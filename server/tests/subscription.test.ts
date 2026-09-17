import { Plan, Role, SubscriptionStatus } from "@prisma/client";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { razorpay } from "../src/config/razorpay.js";
import { supabaseServer } from "../src/config/supabase.js";

vi.mock("../src/config/supabase.js", () => ({
  supabaseServer: { auth: { getUser: vi.fn() } },
}));

vi.mock("../src/config/razorpay.js", () => ({
  razorpay: {
    subscriptions: {
      create: vi.fn().mockResolvedValue({ id: "sub_rzp_mock_123" }),
      cancel: vi.fn().mockResolvedValue({ id: "sub_rzp_mock_123" }),
    },
  },
}));

vi.mock("../src/config/prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    subscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    webhookEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    score: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const mockUser = {
  id: "user-sub-123",
  email: "subscriber@example.com",
  role: Role.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
  profile: null,
};

const mockSubscription = {
  id: "sub-1",
  userId: "user-sub-123",
  providerCustomerId: "cus_123",
  providerSubscriptionId: "sub_rzp_mock_123",
  plan: Plan.MONTHLY,
  status: SubscriptionStatus.ACTIVE,
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  cancelAtPeriodEnd: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function setupAuthUser(user = mockUser) {
  vi.mocked(supabaseServer.auth.getUser).mockResolvedValueOnce({
    data: { user: { id: user.id, email: user.email } as any },
    error: null,
  });
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(user);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(razorpay.subscriptions.create).mockResolvedValue({ id: "sub_rzp_mock_123" } as any);
  vi.mocked(razorpay.subscriptions.cancel).mockResolvedValue({ id: "sub_rzp_mock_123" } as any);
});

describe("Subscription API — Razorpay Test Mode Integration", () => {
  describe("1. Authentication checks", () => {
    it("returns 401 when accessing GET /api/v1/subscription unauthenticated", async () => {
      const res = await request(app).get("/api/v1/subscription");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 when creating checkout session unauthenticated", async () => {
      const res = await request(app)
        .post("/api/v1/subscription/checkout")
        .send({ plan: "MONTHLY" });
      expect(res.status).toBe(401);
    });

    it("returns 401 when canceling subscription unauthenticated", async () => {
      const res = await request(app).post("/api/v1/subscription/cancel");
      expect(res.status).toBe(401);
    });
  });

  describe("2. GET /api/v1/subscription — authenticated", () => {
    it("returns user's current subscription status", async () => {
      setupAuthUser();
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(mockSubscription);

      const res = await request(app)
        .get("/api/v1/subscription")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.plan).toBe("MONTHLY");
      expect(res.body.data.status).toBe("ACTIVE");
    });
  });

  describe("3. POST /api/v1/subscription/checkout — plan validation", () => {
    it("accepts MONTHLY plan and creates Razorpay subscription", async () => {
      setupAuthUser();
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.subscription.upsert).mockResolvedValueOnce(mockSubscription);

      const res = await request(app)
        .post("/api/v1/subscription/checkout")
        .set("Authorization", "Bearer valid-token")
        .send({ plan: "MONTHLY" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subscriptionId).toBeDefined();
    });

    it("accepts YEARLY plan and creates Razorpay subscription", async () => {
      setupAuthUser();
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.subscription.upsert).mockResolvedValueOnce({
        ...mockSubscription,
        plan: Plan.YEARLY,
      });

      const res = await request(app)
        .post("/api/v1/subscription/checkout")
        .set("Authorization", "Bearer valid-token")
        .send({ plan: "YEARLY" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("rejects invalid plan WEEKLY", async () => {
      setupAuthUser();
      const res = await request(app)
        .post("/api/v1/subscription/checkout")
        .set("Authorization", "Bearer valid-token")
        .send({ plan: "WEEKLY" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_SUBSCRIPTION_PLAN");
    });

    it("rejects request trying to supply arbitrary price ID", async () => {
      setupAuthUser();
      const res = await request(app)
        .post("/api/v1/subscription/checkout")
        .set("Authorization", "Bearer valid-token")
        .send({ plan: "MONTHLY", priceId: "price_arbitrary_attacker_id" });

      // Strict schema rejects extra fields
      expect(res.status).toBe(400);
    });
  });

  describe("4. Duplicate subscription protection", () => {
    it("rejects checkout when user already has an active subscription", async () => {
      setupAuthUser();
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(mockSubscription);

      const res = await request(app)
        .post("/api/v1/subscription/checkout")
        .set("Authorization", "Bearer valid-token")
        .send({ plan: "MONTHLY" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("SUBSCRIPTION_ALREADY_ACTIVE");
    });
  });

  describe("5. POST /api/v1/subscription/cancel — cancel at period end", () => {
    it("schedules subscription cancellation at period end", async () => {
      setupAuthUser();
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(mockSubscription);
      vi.mocked(prisma.subscription.update).mockResolvedValueOnce({
        ...mockSubscription,
        cancelAtPeriodEnd: true,
      });

      const res = await request(app)
        .post("/api/v1/subscription/cancel")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(200);
      expect(res.body.data.subscription.cancelAtPeriodEnd).toBe(true);
    });

    it("returns 404 when user has no active subscription to cancel", async () => {
      setupAuthUser();
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/api/v1/subscription/cancel")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("SUBSCRIPTION_NOT_FOUND");
    });
  });

  describe("6. Subscriber Access Control Integration", () => {
    it("allows active subscriber to access GET /api/v1/scores", async () => {
      setupAuthUser();
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(mockSubscription);
      vi.mocked(prisma.score.findMany).mockResolvedValueOnce([]);

      const res = await request(app)
        .get("/api/v1/scores")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(200);
    });

    it("blocks inactive user from accessing GET /api/v1/scores with 403", async () => {
      setupAuthUser();
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce({
        ...mockSubscription,
        status: SubscriptionStatus.INACTIVE,
      });

      const res = await request(app)
        .get("/api/v1/scores")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("blocks user with expired cancelAtPeriodEnd subscription from accessing GET /api/v1/scores", async () => {
      setupAuthUser();
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago (expired)
      });

      const res = await request(app)
        .get("/api/v1/scores")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 404 when trying to cancel an already CANCELED subscription", async () => {
      setupAuthUser();
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELED,
      });

      const res = await request(app)
        .post("/api/v1/subscription/cancel")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("SUBSCRIPTION_NOT_FOUND");
    });
  });
});
