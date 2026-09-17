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
  providerCustomerId: "cus_123",
  providerSubscriptionId: "sub_rzp_123",
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

describe("Razorpay Webhook API — Test Mode Integration", () => {
  describe("1. Idempotency & Verification", () => {
    it("processes valid subscription.activated event and activates subscription", async () => {
      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn) => fn(prisma));
      vi.mocked(prisma.webhookEvent.create).mockResolvedValueOnce({
        id: "evt-db-1",
        eventId: "evt_rzp_checkout_1",
        eventType: "subscription.activated",
        payload: {},
        processedAt: new Date(),
        createdAt: new Date(),
      });
      vi.mocked(prisma.subscription.findFirst).mockResolvedValueOnce(mockSubscription);
      vi.mocked(prisma.subscription.update).mockResolvedValueOnce({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      });

      const payload = {
        id: "evt_rzp_checkout_1",
        event: "subscription.activated",
        payload: {
          subscription: {
            entity: {
              id: "sub_rzp_123",
              status: "active",
              current_start: 1700000000,
              current_end: 1702592000,
              notes: {
                userId: "user-sub-123",
                plan: "MONTHLY",
              },
            },
          },
        },
      };

      const res = await request(app)
        .post("/api/v1/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(payload));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
      expect(res.body.idempotent).toBe(false);
    });

    it("returns idempotent success without re-applying duplicate webhook event", async () => {
      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValueOnce({
        id: "evt-db-1",
        eventId: "evt_rzp_checkout_1",
        eventType: "subscription.activated",
        payload: {},
        processedAt: new Date(),
        createdAt: new Date(),
      });

      const payload = {
        id: "evt_rzp_checkout_1",
        event: "subscription.activated",
        payload: {},
      };

      const res = await request(app)
        .post("/api/v1/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(payload));

      expect(res.status).toBe(200);
      expect(res.body.idempotent).toBe(true);
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });
  });

  describe("2. Subscription Lifecycle Event Mapping", () => {
    it("handles subscription.charged to update active status", async () => {
      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn) => fn(prisma));
      vi.mocked(prisma.subscription.findFirst).mockResolvedValueOnce(mockSubscription);
      vi.mocked(prisma.subscription.update).mockResolvedValueOnce({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      });

      const payload = {
        id: "evt_sub_charged_1",
        event: "subscription.charged",
        payload: {
          subscription: {
            entity: {
              id: "sub_rzp_123",
              status: "active",
              current_start: 1700000000,
              current_end: 1702592000,
              notes: { userId: "user-sub-123" },
            },
          },
        },
      };

      const res = await request(app)
        .post("/api/v1/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(payload));

      expect(res.status).toBe(200);
      expect(prisma.subscription.update).toHaveBeenCalled();
    });

    it("handles subscription.cancelled to mark subscription CANCELED", async () => {
      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn) => fn(prisma));
      vi.mocked(prisma.subscription.findFirst).mockResolvedValueOnce(mockSubscription);
      vi.mocked(prisma.subscription.update).mockResolvedValueOnce({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELED,
      });

      const payload = {
        id: "evt_sub_cancelled_1",
        event: "subscription.cancelled",
        payload: {
          subscription: {
            entity: {
              id: "sub_rzp_123",
              notes: { userId: "user-sub-123" },
            },
          },
        },
      };

      const res = await request(app)
        .post("/api/v1/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(payload));

      expect(res.status).toBe(200);
      expect(prisma.subscription.update).toHaveBeenCalled();
    });

    it("handles subscription.halted to mark status PAST_DUE", async () => {
      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn) => fn(prisma));
      vi.mocked(prisma.subscription.findFirst).mockResolvedValueOnce(mockSubscription);
      vi.mocked(prisma.subscription.update).mockResolvedValueOnce({
        ...mockSubscription,
        status: SubscriptionStatus.PAST_DUE,
      });

      const payload = {
        id: "evt_sub_halted_1",
        event: "subscription.halted",
        payload: {
          subscription: {
            entity: {
              id: "sub_rzp_123",
              notes: { userId: "user-sub-123" },
            },
          },
        },
      };

      const res = await request(app)
        .post("/api/v1/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(payload));

      expect(res.status).toBe(200);
      expect(prisma.subscription.update).toHaveBeenCalled();
    });
  });
});
