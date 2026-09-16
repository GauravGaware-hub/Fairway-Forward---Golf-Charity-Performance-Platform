import { Request, Response } from "express";
import { SubscriptionService } from "../services/subscription.service.js";
import { createCheckoutSessionSchema } from "../validators/subscription.validator.js";

export async function getSubscription(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const subscription = await SubscriptionService.getUserSubscription(user.id);

  res.status(200).json({
    success: true,
    data: subscription,
  });
}

export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const parseResult = createCheckoutSessionSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_SUBSCRIPTION_PLAN",
        message: "Invalid subscription plan payload",
        details: parseResult.error.format(),
      },
    });
    return;
  }

  try {
    const session = await SubscriptionService.createCheckoutSession(
      user.id,
      user.email,
      parseResult.data
    );

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        url: session.url,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    const isDuplicate = message.includes("already has an active subscription");
    res.status(isDuplicate ? 400 : 500).json({
      success: false,
      error: {
        code: isDuplicate ? "SUBSCRIPTION_ALREADY_ACTIVE" : "STRIPE_CHECKOUT_ERROR",
        message,
      },
    });
  }
}

export async function cancelSubscription(req: Request, res: Response): Promise<void> {
  const user = req.user!;

  try {
    const subscription = await SubscriptionService.cancelSubscription(user.id);
    res.status(200).json({
      success: true,
      data: {
        message: "Subscription scheduled for cancellation at period end",
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel subscription";
    const isNotFound = message.includes("No active subscription");
    res.status(isNotFound ? 404 : 400).json({
      success: false,
      error: {
        code: isNotFound ? "SUBSCRIPTION_NOT_FOUND" : "STRIPE_CONFIGURATION_ERROR",
        message,
      },
    });
  }
}
