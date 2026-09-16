import { Plan, SubscriptionStatus } from "@prisma/client";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";

vi.mock("../src/config/prisma.js", () => ({
  prisma: {
    webhookEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const mockSubscription = {
  id: "sub-1",
  userId: "user-sub-123",
  stripeCustomerId: "cus_123",
  stripeSubscriptionId: "sub_stripe_123",
  plan: Plan.MONTHLY,
  status: SubscriptionStatus.INACTIVE,
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(),
  cancelAtPeriodEnd: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Stripe Webhook API — Phase 4", () => {
  describe("1. Idempotency & Verification", () => {
    it("processes valid checkout.session.completed event and creates subscription", async () => {
      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn) => fn(prisma));
      vi.mocked(prisma.webhookEvent.create).mockResolvedValueOnce({
        id: "evt-db-1",
        stripeEventId: "evt_test_checkout_1",
        eventType: "checkout.session.completed",
        payload: {},
        processedAt: new Date(),
        createdAt: new Date(),
      });
      vi.mocked(prisma.subscription.upsert).mockResolvedValueOnce({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      });

      const payload = {
        id: "evt_test_checkout_1",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_123",
            customer: "cus_123",
            subscription: "sub_stripe_123",
            metadata: {
              userId: "user-sub-123",
              plan: "MONTHLY",
            },
          },
        },
      };

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(payload));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
      expect(res.body.idempotent).toBe(false);
    });

    it("returns idempotent success without re-applying duplicate webhook event", async () => {
      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValueOnce({
        id: "evt-db-1",
        stripeEventId: "evt_test_checkout_1",
        eventType: "checkout.session.completed",
        payload: {},
        processedAt: new Date(),
        createdAt: new Date(),
      });

      const payload = {
        id: "evt_test_checkout_1",
        type: "checkout.session.completed",
        data: { object: {} },
      };

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(payload));

      expect(res.status).toBe(200);
      expect(res.body.idempotent).toBe(true);
      expect(prisma.subscription.upsert).not.toHaveBeenCalled();
    });
  });

  describe("2. Subscription Lifecycle Event Mapping", () => {
    it("handles customer.subscription.updated to update status", async () => {
      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn) => fn(prisma));
      vi.mocked(prisma.subscription.findFirst).mockResolvedValueOnce(mockSubscription);
      vi.mocked(prisma.subscription.update).mockResolvedValueOnce({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      });

      const payload = {
        id: "evt_sub_updated_1",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_stripe_123",
            customer: "cus_123",
            status: "active",
            cancel_at_period_end: false,
            current_period_start: 1700000000,
            current_period_end: 1702592000,
          },
        },
      };

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(payload));

      expect(res.status).toBe(200);
      expect(prisma.subscription.update).toHaveBeenCalled();
    });

    it("handles customer.subscription.deleted to mark subscription CANCELED", async () => {
      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn) => fn(prisma));
      vi.mocked(prisma.subscription.findFirst).mockResolvedValueOnce(mockSubscription);
      vi.mocked(prisma.subscription.update).mockResolvedValueOnce({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELED,
      });

      const payload = {
        id: "evt_sub_deleted_1",
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_stripe_123",
            customer: "cus_123",
          },
        },
      };

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(payload));

      expect(res.status).toBe(200);
      expect(prisma.subscription.update).toHaveBeenCalled();
    });

    it("handles invoice.payment_failed to mark status PAST_DUE", async () => {
      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn) => fn(prisma));
      vi.mocked(prisma.subscription.findFirst).mockResolvedValueOnce(mockSubscription);
      vi.mocked(prisma.subscription.update).mockResolvedValueOnce({
        ...mockSubscription,
        status: SubscriptionStatus.PAST_DUE,
      });

      const payload = {
        id: "evt_invoice_failed_1",
        type: "invoice.payment_failed",
        data: {
          object: {
            id: "in_123",
            subscription: "sub_stripe_123",
          },
        },
      };

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(payload));

      expect(res.status).toBe(200);
      expect(prisma.subscription.update).toHaveBeenCalled();
    });
  });
});
