import { Plan, SubscriptionStatus } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { RazorpayPaymentProvider } from "./paymentProvider.service.js";

export interface CreateCheckoutInput {
  plan: "MONTHLY" | "YEARLY";
}

interface RazorpayEntity {
  id?: string;
  subscription_id?: string;
  plan_id?: string;
  status?: string;
  current_start?: number;
  current_end?: number;
  notes?: {
    userId?: string;
    plan?: string;
  };
}

interface RazorpayWebhookPayload {
  id?: string;
  event?: string;
  type?: string;
  event_id?: string;
  created_at?: number;
  entity?: RazorpayEntity;
  payload?: {
    subscription?: {
      entity?: RazorpayEntity;
    };
    payment?: {
      entity?: RazorpayEntity;
    };
  };
}

export class SubscriptionService {
  /**
   * Retrieves user's current subscription from the database.
   */
  static async getUserSubscription(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return {
        plan: null,
        status: SubscriptionStatus.INACTIVE,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    return {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }

  /**
   * Evaluates if a user has an active subscription in the local database.
   */
  static async hasActiveSubscription(
    userId: string,
    headers?: Record<string, unknown>
  ): Promise<boolean> {
    if (!userId) {
      return false;
    }

    // Test header override for testing inactive subscriber authorization rules
    if (headers && headers["x-mock-inactive-subscription"] === "true") {
      return false;
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return false;
    }

    const now = new Date();

    // If cancellation was requested at period end and currentPeriodEnd has passed, access is expired
    if (
      subscription.cancelAtPeriodEnd &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd <= now
    ) {
      return false;
    }

    // Active or Trialing subscriptions give full subscriber access
    if (
      subscription.status === SubscriptionStatus.ACTIVE ||
      subscription.status === SubscriptionStatus.TRIALING
    ) {
      return true;
    }

    return false;
  }

  /**
   * Creates a Razorpay Subscription Checkout for subscription purchase.
   */
  static async createCheckoutSession(
    userId: string,
    userEmail: string,
    input: CreateCheckoutInput
  ): Promise<{ subscriptionId: string; keyId: string; sessionId: string; url: string | null }> {
    const { plan } = input;

    // Check for existing active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (
      existingSubscription &&
      (existingSubscription.status === SubscriptionStatus.ACTIVE ||
        existingSubscription.status === SubscriptionStatus.TRIALING) &&
      !existingSubscription.cancelAtPeriodEnd
    ) {
      throw new Error("User already has an active subscription");
    }

    // Create subscription with Razorpay provider
    const result = await RazorpayPaymentProvider.createSubscription({
      plan,
      userId,
      userEmail,
    });

    // Upsert local subscription record with provider subscription ID
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        providerSubscriptionId: result.subscriptionId,
        plan: plan === "MONTHLY" ? Plan.MONTHLY : Plan.YEARLY,
        status: SubscriptionStatus.INACTIVE,
      },
      update: {
        providerSubscriptionId: result.subscriptionId,
        plan: plan === "MONTHLY" ? Plan.MONTHLY : Plan.YEARLY,
      },
    });

    return {
      subscriptionId: result.subscriptionId,
      keyId: result.keyId,
      sessionId: result.subscriptionId,
      url: null,
    };
  }

  /**
   * Schedules subscription cancellation at the end of the current billing period.
   */
  static async cancelSubscription(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (
      !subscription ||
      !subscription.providerSubscriptionId ||
      subscription.status === SubscriptionStatus.INACTIVE ||
      subscription.status === SubscriptionStatus.CANCELED
    ) {
      throw new Error("No active subscription found to cancel");
    }

    if (subscription.cancelAtPeriodEnd) {
      return subscription;
    }

    // Call Razorpay to cancel at period end
    await RazorpayPaymentProvider.cancelSubscription(subscription.providerSubscriptionId);

    // Update local database record to reflect cancelAtPeriodEnd
    return await prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });
  }

  /**
   * Server-side signature verification of checkout completion.
   */
  static async verifyCheckoutPayment(
    userId: string,
    paymentId: string,
    subscriptionId: string,
    signature: string
  ): Promise<boolean> {
    const isValid = RazorpayPaymentProvider.verifyCheckoutSignature(
      paymentId,
      subscriptionId,
      signature
    );

    if (!isValid) {
      throw new Error("Invalid Razorpay payment signature");
    }

    // Local subscription verification check
    const localSub = await prisma.subscription.findFirst({
      where: {
        OR: [
          { providerSubscriptionId: subscriptionId },
          { userId },
        ],
      },
    });

    if (localSub && localSub.status === SubscriptionStatus.INACTIVE) {
      const durationDays = localSub.plan === Plan.YEARLY ? 365 : 30;
      await prisma.subscription.update({
        where: { id: localSub.id },
        data: {
          providerSubscriptionId: subscriptionId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        },
      });
    }

    return true;
  }

  /**
   * Verifies and processes incoming Razorpay webhooks idempotently.
   */
  static async handleRazorpayWebhook(
    rawBody: Buffer | string,
    signature?: string
  ): Promise<{ processed: boolean; idempotent: boolean; eventType?: string }> {
    let payload: Record<string, unknown>;
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const isValid = RazorpayPaymentProvider.verifyWebhookSignature(
        rawBody,
        signature,
        webhookSecret
      );
      if (!isValid) {
        throw new Error("Webhook Signature Verification Failed: Invalid signature");
      }
    }

    try {
      payload = typeof rawBody === "string" ? JSON.parse(rawBody) : JSON.parse(rawBody.toString("utf8"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid JSON payload";
      throw new Error(`Webhook Parsing Failed: ${msg}`);
    }

    const eventName: string = payload.event || payload.type || "";
    const eventId: string =
      payload.id ||
      payload.event_id ||
      `${payload.payload?.subscription?.entity?.id || "sub"}_${eventName}_${payload.created_at || Date.now()}`;

    if (!eventName) {
      throw new Error("Invalid Razorpay event structure");
    }

    // Check for idempotency in WebhookEvent table
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      return { processed: true, idempotent: true, eventType: eventName };
    }

    // Record webhook event and process subscription state update
    await prisma.$transaction(async (tx) => {
      await tx.webhookEvent.create({
        data: {
          eventId,
          eventType: eventName,
          payload: JSON.parse(JSON.stringify(payload)),
        },
      });

      await this.processRazorpayEvent(tx, payload, eventName);
    });

    return { processed: true, idempotent: false, eventType: eventName };
  }

  /**
   * Helper to process Razorpay subscription lifecycle events inside database transaction.
   */


  private static async processRazorpayEvent(
    tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
    payload: RazorpayWebhookPayload,
    eventName: string
  ): Promise<void> {
    const subEntity = payload.payload?.subscription?.entity || payload.entity;
    const providerSubscriptionId = subEntity?.id || subEntity?.subscription_id;
    const notes = subEntity?.notes || {};
    const userId = notes.userId;

    switch (eventName) {
      case "subscription.authenticated":
      case "subscription.activated":
      case "subscription.charged": {
        const planStr = notes.plan || (subEntity?.plan_id === env.RAZORPAY_YEARLY_PLAN_ID ? "YEARLY" : "MONTHLY");
        const plan = planStr === "YEARLY" ? Plan.YEARLY : Plan.MONTHLY;
        const durationDays = plan === Plan.YEARLY ? 365 : 30;

        const currentStart = subEntity?.current_start
          ? new Date(subEntity.current_start * 1000)
          : new Date();
        const currentEnd = subEntity?.current_end
          ? new Date(subEntity.current_end * 1000)
          : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        // Find existing subscription by userId or providerSubscriptionId
        const localSub = await tx.subscription.findFirst({
          where: {
            OR: [
              ...(userId ? [{ userId }] : []),
              ...(providerSubscriptionId ? [{ providerSubscriptionId }] : []),
            ],
          },
        });

        if (localSub) {
          await tx.subscription.update({
            where: { id: localSub.id },
            data: {
              providerSubscriptionId: providerSubscriptionId || localSub.providerSubscriptionId,
              plan,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: currentStart,
              currentPeriodEnd: currentEnd,
              cancelAtPeriodEnd: false,
            },
          });
        } else if (userId) {
          await tx.subscription.upsert({
            where: { userId },
            create: {
              userId,
              providerSubscriptionId,
              plan,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: currentStart,
              currentPeriodEnd: currentEnd,
            },
            update: {
              providerSubscriptionId,
              plan,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: currentStart,
              currentPeriodEnd: currentEnd,
              cancelAtPeriodEnd: false,
            },
          });
        }
        break;
      }

      case "subscription.pending":
      case "subscription.halted": {
        const localSub = await tx.subscription.findFirst({
          where: {
            OR: [
              ...(userId ? [{ userId }] : []),
              ...(providerSubscriptionId ? [{ providerSubscriptionId }] : []),
            ],
          },
        });

        if (localSub) {
          await tx.subscription.update({
            where: { id: localSub.id },
            data: {
              status: SubscriptionStatus.PAST_DUE,
            },
          });
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.completed": {
        const localSub = await tx.subscription.findFirst({
          where: {
            OR: [
              ...(userId ? [{ userId }] : []),
              ...(providerSubscriptionId ? [{ providerSubscriptionId }] : []),
            ],
          },
        });

        if (localSub) {
          await tx.subscription.update({
            where: { id: localSub.id },
            data: {
              status: SubscriptionStatus.CANCELED,
              cancelAtPeriodEnd: false,
            },
          });
        }
        break;
      }

      default:
        // Handle checkout.session.completed or legacy fallback for compatibility
        if (eventName === "checkout.session.completed" && userId) {
          await tx.subscription.upsert({
            where: { userId },
            create: {
              userId,
              providerSubscriptionId,
              plan: Plan.MONTHLY,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            update: {
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              cancelAtPeriodEnd: false,
            },
          });
        }
        break;
    }
  }
}
