import { Role } from "@prisma/client";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { supabaseServer } from "../src/config/supabase.js";

vi.mock("../src/config/supabase.js", () => ({
  supabaseServer: { auth: { getUser: vi.fn() } },
}));

vi.mock("../src/config/prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    subscription: {
      findUnique: vi.fn().mockResolvedValue({
        status: "ACTIVE",
        cancelAtPeriodEnd: false,
      }),
      findFirst: vi.fn(),
    },
    charity: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    charitySelection: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const mockUser = {
  id: "user-abc",
  email: "golfer@example.com",
  role: Role.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
  profile: null,
};

const mockAdmin = { ...mockUser, id: "admin-abc", email: "admin@example.com", role: Role.ADMIN };

const mockCharity = {
  id: "charity-1",
  name: "Digital Heroes Community Foundation",
  slug: "digital-heroes-community-foundation",
  description: "Demo charity for testing",
  imageUrl: null,
  websiteUrl: null,
  isFeatured: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const inactiveCharity = { ...mockCharity, id: "charity-inactive", slug: "inactive-charity", isActive: false };

function setupAuthUser(user = mockUser) {
  vi.mocked(supabaseServer.auth.getUser).mockResolvedValueOnce({
    data: { user: { id: user.id, email: user.email } as any },
    error: null,
  });
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(user);
  vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
    id: "sub-mock",
    userId: user.id,
    providerCustomerId: "cus_mock",
    providerSubscriptionId: "sub_mock",
    plan: "MONTHLY",
    status: "ACTIVE",
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Charity API — Phase 3", () => {
  describe("1. GET /api/v1/charities — public list works", () => {
    it("returns active charities without auth", async () => {
      vi.mocked(prisma.charity.findMany).mockResolvedValueOnce([mockCharity]);
      const res = await request(app).get("/api/v1/charities");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.charities).toHaveLength(1);
    });
  });

  describe("2. GET /api/v1/charities/:id — public charity detail works", () => {
    it("returns charity by ID without auth", async () => {
      vi.mocked(prisma.charity.findUnique).mockResolvedValueOnce(mockCharity);
      const res = await request(app).get("/api/v1/charities/charity-1");
      expect(res.status).toBe(200);
      expect(res.body.data.charity.id).toBe("charity-1");
    });
  });

  describe("3. PUT /api/v1/me/charity — inactive charity cannot be selected", () => {
    it("returns 400 when trying to select an inactive charity", async () => {
      setupAuthUser();
      vi.mocked(prisma.charity.findUnique).mockResolvedValueOnce(inactiveCharity);

      const res = await request(app)
        .put("/api/v1/me/charity")
        .set("Authorization", "Bearer valid-token")
        .send({ charityId: "charity-inactive", contributionPercentage: 10 });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain("inactive");
    });
  });

  describe("4. PUT /api/v1/me/charity — user can select an active charity", () => {
    it("creates charity selection successfully", async () => {
      setupAuthUser();
      vi.mocked(prisma.charity.findUnique).mockResolvedValueOnce(mockCharity);
      vi.mocked(prisma.charitySelection.upsert).mockResolvedValueOnce({
        id: "sel-1",
        userId: "user-abc",
        charityId: "charity-1",
        contributionPercentage: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        charity: mockCharity,
      } as any);

      const res = await request(app)
        .put("/api/v1/me/charity")
        .set("Authorization", "Bearer valid-token")
        .send({ charityId: "charity-1", contributionPercentage: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.selection.contributionPercentage).toBe(10);
    });
  });

  describe("5. PUT /api/v1/me/charity — contribution below 10% rejected", () => {
    it("returns 400 for contributionPercentage of 9", async () => {
      setupAuthUser();
      const res = await request(app)
        .put("/api/v1/me/charity")
        .set("Authorization", "Bearer valid-token")
        .send({ charityId: "charity-1", contributionPercentage: 9 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("6. PUT /api/v1/me/charity — valid contribution >= 10% works", () => {
    it("accepts contributionPercentage of 25", async () => {
      setupAuthUser();
      vi.mocked(prisma.charity.findUnique).mockResolvedValueOnce(mockCharity);
      vi.mocked(prisma.charitySelection.upsert).mockResolvedValueOnce({
        id: "sel-1",
        userId: "user-abc",
        charityId: "charity-1",
        contributionPercentage: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
        charity: mockCharity,
      } as any);

      const res = await request(app)
        .put("/api/v1/me/charity")
        .set("Authorization", "Bearer valid-token")
        .send({ charityId: "charity-1", contributionPercentage: 25 });

      expect(res.status).toBe(200);
      expect(res.body.data.selection.contributionPercentage).toBe(25);
    });
  });

  describe("7. PUT /api/v1/me/charity — user can update their selected charity", () => {
    it("upserts charity selection to a new charity", async () => {
      setupAuthUser();
      const newCharity = { ...mockCharity, id: "charity-2", name: "Green Fairways Initiative", slug: "green-fairways-initiative" };
      vi.mocked(prisma.charity.findUnique).mockResolvedValueOnce(newCharity);
      vi.mocked(prisma.charitySelection.upsert).mockResolvedValueOnce({
        id: "sel-1",
        userId: "user-abc",
        charityId: "charity-2",
        contributionPercentage: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
        charity: newCharity,
      } as any);

      const res = await request(app)
        .put("/api/v1/me/charity")
        .set("Authorization", "Bearer valid-token")
        .send({ charityId: "charity-2", contributionPercentage: 15 });

      expect(res.status).toBe(200);
      expect(res.body.data.selection.charity.id).toBe("charity-2");
    });
  });

  describe("8. GET /api/v1/me/charity — user can retrieve their selection", () => {
    it("returns current charity selection for authenticated user", async () => {
      setupAuthUser();
      vi.mocked(prisma.charitySelection.findUnique).mockResolvedValueOnce({
        id: "sel-1",
        userId: "user-abc",
        charityId: "charity-1",
        contributionPercentage: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        charity: mockCharity,
      } as any);

      const res = await request(app)
        .get("/api/v1/me/charity")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(200);
      expect(res.body.data.selection.charity.id).toBe("charity-1");
    });
  });

  describe("9. PUT /api/v1/me/charity — user cannot modify another user's selection", () => {
    it("user ID is always derived from token, not request body", async () => {
      setupAuthUser();
      vi.mocked(prisma.charity.findUnique).mockResolvedValueOnce(mockCharity);
      vi.mocked(prisma.charitySelection.upsert).mockResolvedValueOnce({
        id: "sel-1",
        userId: "user-abc",
        charityId: "charity-1",
        contributionPercentage: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        charity: mockCharity,
      } as any);

      const res = await request(app)
        .put("/api/v1/me/charity")
        .set("Authorization", "Bearer valid-token")
        .send({ charityId: "charity-1", contributionPercentage: 10, userId: "other-user-id" });

      // Strict schema rejects extra fields
      expect(res.status).toBe(400);
    });
  });

  describe("10. Admin routes — non-admin gets 403", () => {
    it("returns 403 when non-admin tries to POST /api/v1/admin/charities", async () => {
      setupAuthUser(mockUser);
      const res = await request(app)
        .post("/api/v1/admin/charities")
        .set("Authorization", "Bearer valid-token")
        .send({ name: "Test", description: "Test", slug: "test" });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("11. Admin can create charity", () => {
    it("returns 201 when admin creates a charity", async () => {
      setupAuthUser(mockAdmin);
      vi.mocked(prisma.charity.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.charity.create).mockResolvedValueOnce(mockCharity);

      const res = await request(app)
        .post("/api/v1/admin/charities")
        .set("Authorization", "Bearer admin-token")
        .send({
          name: "Digital Heroes Community Foundation",
          description: "Demo charity for testing",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.charity).toBeDefined();
    });
  });

  describe("12. Admin can update charity", () => {
    it("returns 200 when admin updates a charity's name", async () => {
      setupAuthUser(mockAdmin);
      const updatedCharity = { ...mockCharity, name: "Updated Name" };
      vi.mocked(prisma.charity.findUnique).mockResolvedValueOnce(mockCharity);
      vi.mocked(prisma.charity.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.charity.update).mockResolvedValueOnce(updatedCharity);

      const res = await request(app)
        .patch("/api/v1/admin/charities/charity-1")
        .set("Authorization", "Bearer admin-token")
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.charity.name).toBe("Updated Name");
    });
  });

  describe("13. Admin deactivation — soft delete when referenced", () => {
    it("soft deletes charity when user selections exist", async () => {
      setupAuthUser(mockAdmin);
      vi.mocked(prisma.charity.findUnique).mockResolvedValueOnce(mockCharity);
      vi.mocked(prisma.charitySelection.count).mockResolvedValueOnce(2);
      vi.mocked(prisma.charity.update).mockResolvedValueOnce({ ...mockCharity, isActive: false });

      const res = await request(app)
        .delete("/api/v1/admin/charities/charity-1")
        .set("Authorization", "Bearer admin-token");

      expect(res.status).toBe(200);
      expect(res.body.data.softDeleted).toBe(true);
    });
  });
});
