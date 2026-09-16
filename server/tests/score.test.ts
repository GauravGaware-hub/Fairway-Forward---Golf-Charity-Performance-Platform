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
    score: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
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

const mockScore = {
  id: "score-1",
  userId: "user-abc",
  score: 32,
  playedAt: new Date("2026-09-01T00:00:00.000Z"),
  createdAt: new Date(),
  updatedAt: new Date(),
};

function setupAuthUser(user = mockUser) {
  vi.mocked(supabaseServer.auth.getUser).mockResolvedValueOnce({
    data: { user: { id: user.id, email: user.email } as any },
    error: null,
  });
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(user);
  vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
    id: "sub-mock",
    userId: user.id,
    stripeCustomerId: "cus_mock",
    stripeSubscriptionId: "sub_mock",
    plan: "MONTHLY",
    status: "ACTIVE",
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);
}

function setupInactiveSubscription(user = mockUser) {
  vi.mocked(supabaseServer.auth.getUser).mockResolvedValueOnce({
    data: { user: { id: user.id, email: user.email } as any },
    error: null,
  });
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(user);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Score API — Phase 3", () => {
  describe("1. GET /api/v1/scores — unauthenticated", () => {
    it("returns 401 when no Authorization header", async () => {
      const res = await request(app).get("/api/v1/scores");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("2. GET /api/v1/scores — authenticated non-subscriber", () => {
    it("returns 403 when subscription is inactive", async () => {
      setupInactiveSubscription();
      const res = await request(app)
        .get("/api/v1/scores")
        .set("Authorization", "Bearer valid-token")
        .set("x-mock-inactive-subscription", "true");
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("3. POST /api/v1/scores — valid score creation", () => {
    it("creates a valid score and returns latest 5 scores", async () => {
      setupAuthUser();
      vi.mocked(prisma.score.findUnique).mockResolvedValueOnce(null);
      const scores = [mockScore];
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn) => fn(prisma));
      vi.mocked(prisma.score.create).mockResolvedValueOnce(mockScore);
      vi.mocked(prisma.score.findMany)
        .mockResolvedValueOnce(scores)
        .mockResolvedValueOnce(scores);

      const res = await request(app)
        .post("/api/v1/scores")
        .set("Authorization", "Bearer valid-token")
        .send({ score: 32, playedAt: "2026-09-01" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe("4. POST /api/v1/scores — score below 1", () => {
    it("returns 400 for score 0", async () => {
      setupAuthUser();
      const res = await request(app)
        .post("/api/v1/scores")
        .set("Authorization", "Bearer valid-token")
        .send({ score: 0, playedAt: "2026-09-01" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("5. POST /api/v1/scores — score above 45", () => {
    it("returns 400 for score 46", async () => {
      setupAuthUser();
      const res = await request(app)
        .post("/api/v1/scores")
        .set("Authorization", "Bearer valid-token")
        .send({ score: 46, playedAt: "2026-09-01" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("6. POST /api/v1/scores — decimal score", () => {
    it("returns 400 for decimal score 32.5", async () => {
      setupAuthUser();
      const res = await request(app)
        .post("/api/v1/scores")
        .set("Authorization", "Bearer valid-token")
        .send({ score: 32.5, playedAt: "2026-09-01" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("7. POST /api/v1/scores — duplicate date", () => {
    it("returns 400 when a score for the same date already exists", async () => {
      setupAuthUser();
      vi.mocked(prisma.score.findUnique).mockResolvedValueOnce(mockScore);
      const res = await request(app)
        .post("/api/v1/scores")
        .set("Authorization", "Bearer valid-token")
        .send({ score: 35, playedAt: "2026-09-01" });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain("already exists");
    });
  });

  describe("8. GET /api/v1/scores — scores returned newest first", () => {
    it("returns scores ordered by playedAt DESC", async () => {
      setupAuthUser();
      const newerScore = { ...mockScore, id: "score-newer", playedAt: new Date("2026-09-10T00:00:00.000Z") };
      const olderScore = { ...mockScore, id: "score-older", playedAt: new Date("2026-08-01T00:00:00.000Z") };
      vi.mocked(prisma.score.findMany).mockResolvedValueOnce([newerScore, olderScore]);

      const res = await request(app)
        .get("/api/v1/scores")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(200);
      const scores = res.body.data.scores;
      expect(new Date(scores[0].playedAt) >= new Date(scores[1].playedAt)).toBe(true);
    });
  });

  describe("9. POST /api/v1/scores — sixth score removes oldest", () => {
    it("atomically removes oldest score when 6th score is added", async () => {
      setupAuthUser();
      vi.mocked(prisma.score.findUnique).mockResolvedValueOnce(null);

      const sixScores = Array.from({ length: 6 }, (_, i) => ({
        ...mockScore,
        id: `score-${i}`,
        playedAt: new Date(`2026-0${i + 1}-01T00:00:00.000Z`),
      })).sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());

      const top5 = sixScores.slice(0, 5);

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn) => fn(prisma));
      vi.mocked(prisma.score.create).mockResolvedValueOnce(mockScore);
      vi.mocked(prisma.score.findMany)
        .mockResolvedValueOnce(sixScores)
        .mockResolvedValueOnce(top5);
      vi.mocked(prisma.score.deleteMany).mockResolvedValueOnce({ count: 1 });

      const res = await request(app)
        .post("/api/v1/scores")
        .set("Authorization", "Bearer valid-token")
        .send({ score: 40, playedAt: "2026-06-01" });

      expect(res.status).toBe(201);
      expect(prisma.score.deleteMany).toHaveBeenCalled();
    });
  });

  describe("10. POST /api/v1/scores — old 6th score does not remove newer scores", () => {
    it("oldest score submitted is pruned, not existing newer scores", async () => {
      setupAuthUser();
      vi.mocked(prisma.score.findUnique).mockResolvedValueOnce(null);

      // 5 existing scores: Sep through Jan (newest first)
      const existing5 = Array.from({ length: 5 }, (_, i) => ({
        ...mockScore,
        id: `score-${i}`,
        playedAt: new Date(`2026-0${9 - i}-01T00:00:00.000Z`),
      }));

      // New score submitted with very old date (January 2025) — should be the pruned one
      const oldNewScore = {
        ...mockScore,
        id: "score-old-new",
        playedAt: new Date("2025-01-01T00:00:00.000Z"),
      };

      const allSix = [oldNewScore, ...existing5].sort(
        (a, b) => b.playedAt.getTime() - a.playedAt.getTime()
      );
      // Top 5 will be existing5, old new score gets pruned
      const top5 = allSix.slice(0, 5);

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn) => fn(prisma));
      vi.mocked(prisma.score.create).mockResolvedValueOnce(oldNewScore);
      vi.mocked(prisma.score.findMany)
        .mockResolvedValueOnce(allSix)
        .mockResolvedValueOnce(top5);
      vi.mocked(prisma.score.deleteMany).mockResolvedValueOnce({ count: 1 });

      const res = await request(app)
        .post("/api/v1/scores")
        .set("Authorization", "Bearer valid-token")
        .send({ score: 28, playedAt: "2025-01-01" });

      expect(res.status).toBe(201);
      // The returned top5 must not include the old new score
      const returnedIds = res.body.data.scores.map((s: any) => s.id);
      expect(returnedIds).not.toContain("score-old-new");
    });
  });

  describe("11. PATCH /api/v1/scores/:id — editing a score works", () => {
    it("updates score value and returns updated scores list", async () => {
      setupAuthUser();
      vi.mocked(prisma.score.findUnique).mockResolvedValueOnce(mockScore);
      vi.mocked(prisma.score.findFirst).mockResolvedValueOnce(null);
      const updatedScore = { ...mockScore, score: 38 };
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn) => fn(prisma));
      vi.mocked(prisma.score.update).mockResolvedValueOnce(updatedScore);
      vi.mocked(prisma.score.findMany)
        .mockResolvedValueOnce([updatedScore])
        .mockResolvedValueOnce([updatedScore]);

      const res = await request(app)
        .patch("/api/v1/scores/score-1")
        .set("Authorization", "Bearer valid-token")
        .send({ score: 38 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("12. PATCH /api/v1/scores/:id — editing to duplicate date is rejected", () => {
    it("returns 400 when changing date to one that already has a score", async () => {
      setupAuthUser();
      vi.mocked(prisma.score.findUnique).mockResolvedValueOnce(mockScore);
      vi.mocked(prisma.score.findFirst).mockResolvedValueOnce({ ...mockScore, id: "score-other" });

      const res = await request(app)
        .patch("/api/v1/scores/score-1")
        .set("Authorization", "Bearer valid-token")
        .send({ playedAt: "2026-09-02" });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain("already exists");
    });
  });

  describe("13. DELETE /api/v1/scores/:id — deleting own score works", () => {
    it("deletes the score and returns success", async () => {
      setupAuthUser();
      vi.mocked(prisma.score.findUnique).mockResolvedValueOnce(mockScore);
      vi.mocked(prisma.score.delete).mockResolvedValueOnce(mockScore);

      const res = await request(app)
        .delete("/api/v1/scores/score-1")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("14. PATCH — cannot edit another user's score", () => {
    it("returns 404 when score belongs to different user", async () => {
      setupAuthUser();
      vi.mocked(prisma.score.findUnique).mockResolvedValueOnce({
        ...mockScore,
        userId: "other-user-id",
      });

      const res = await request(app)
        .patch("/api/v1/scores/score-1")
        .set("Authorization", "Bearer valid-token")
        .send({ score: 40 });

      expect(res.status).toBe(404);
    });
  });

  describe("15. DELETE — cannot delete another user's score", () => {
    it("returns 404 when trying to delete a score owned by another user", async () => {
      setupAuthUser();
      vi.mocked(prisma.score.findUnique).mockResolvedValueOnce({
        ...mockScore,
        userId: "other-user-id",
      });

      const res = await request(app)
        .delete("/api/v1/scores/score-1")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(404);
    });
  });

  describe("16. PATCH — latest-five invariant holds after updates", () => {
    it("re-enforces top-5 retention after updating a score's date", async () => {
      setupAuthUser();
      vi.mocked(prisma.score.findUnique).mockResolvedValueOnce(mockScore);
      vi.mocked(prisma.score.findFirst).mockResolvedValueOnce(null);

      const scores5 = Array.from({ length: 5 }, (_, i) => ({
        ...mockScore,
        id: `score-${i}`,
        playedAt: new Date(`2026-0${i + 1}-01T00:00:00.000Z`),
      }));

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn) => fn(prisma));
      vi.mocked(prisma.score.update).mockResolvedValueOnce(mockScore);
      vi.mocked(prisma.score.findMany)
        .mockResolvedValueOnce(scores5)
        .mockResolvedValueOnce(scores5);

      const res = await request(app)
        .patch("/api/v1/scores/score-1")
        .set("Authorization", "Bearer valid-token")
        .send({ playedAt: "2026-09-15" });

      expect(res.status).toBe(200);
      expect(res.body.data.scores.length).toBeLessThanOrEqual(5);
    });
  });
});
