import { Score } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export interface CreateScoreInput {
  score: number;
  playedAt: Date;
}

export interface UpdateScoreInput {
  score?: number;
  playedAt?: Date;
}

export class ScoreService {
  /**
   * Retrieves user's latest 5 scores ordered newest first (by playedAt DESC).
   */
  static async getUserScores(userId: string): Promise<Score[]> {
    return await prisma.score.findMany({
      where: { userId },
      orderBy: { playedAt: "desc" },
      take: 5,
    });
  }

  /**
   * Creates a new score and atomically enforces the latest-5 retention rule.
   */
  static async createScore(userId: string, input: CreateScoreInput): Promise<Score[]> {
    if (input.score < 1 || input.score > 45 || !Number.isInteger(input.score)) {
      throw new Error("Score must be an integer between 1 and 45 inclusive");
    }

    // Check for existing score on the same date for the user
    const existing = await prisma.score.findUnique({
      where: {
        userId_playedAt: {
          userId,
          playedAt: input.playedAt,
        },
      },
    });

    if (existing) {
      throw new Error("A score for this date already exists");
    }

    // Atomic transaction: Insert new score and enforce 5-score retention rule by played date
    return await prisma.$transaction(async (tx) => {
      await tx.score.create({
        data: {
          userId,
          score: input.score,
          playedAt: input.playedAt,
        },
      });

      // Get all user's scores ordered newest first
      const allScores = await tx.score.findMany({
        where: { userId },
        orderBy: { playedAt: "desc" },
      });

      // Retain only top 5 by playedAt DESC; prune any older scores beyond top 5
      if (allScores.length > 5) {
        const top5Ids = new Set(allScores.slice(0, 5).map((s) => s.id));
        const idsToDelete = allScores.filter((s) => !top5Ids.has(s.id)).map((s) => s.id);

        if (idsToDelete.length > 0) {
          await tx.score.deleteMany({
            where: {
              id: { in: idsToDelete },
            },
          });
        }
      }

      return await tx.score.findMany({
        where: { userId },
        orderBy: { playedAt: "desc" },
        take: 5,
      });
    });
  }

  /**
   * Updates an existing score and maintains top-5 retention invariant.
   */
  static async updateScore(
    userId: string,
    scoreId: string,
    input: UpdateScoreInput
  ): Promise<Score[]> {
    const scoreToUpdate = await prisma.score.findUnique({
      where: { id: scoreId },
    });

    if (!scoreToUpdate || scoreToUpdate.userId !== userId) {
      throw new Error("Score not found or unauthorized");
    }

    if (input.score !== undefined) {
      if (input.score < 1 || input.score > 45 || !Number.isInteger(input.score)) {
        throw new Error("Score must be an integer between 1 and 45 inclusive");
      }
    }

    if (input.playedAt !== undefined) {
      const duplicate = await prisma.score.findFirst({
        where: {
          userId,
          playedAt: input.playedAt,
          id: { not: scoreId },
        },
      });

      if (duplicate) {
        throw new Error("A score for this date already exists");
      }
    }

    return await prisma.$transaction(async (tx) => {
      await tx.score.update({
        where: { id: scoreId },
        data: {
          ...(input.score !== undefined && { score: input.score }),
          ...(input.playedAt !== undefined && { playedAt: input.playedAt }),
        },
      });

      const allScores = await tx.score.findMany({
        where: { userId },
        orderBy: { playedAt: "desc" },
      });

      if (allScores.length > 5) {
        const top5Ids = new Set(allScores.slice(0, 5).map((s) => s.id));
        const idsToDelete = allScores.filter((s) => !top5Ids.has(s.id)).map((s) => s.id);

        if (idsToDelete.length > 0) {
          await tx.score.deleteMany({
            where: {
              id: { in: idsToDelete },
            },
          });
        }
      }

      return await tx.score.findMany({
        where: { userId },
        orderBy: { playedAt: "desc" },
        take: 5,
      });
    });
  }

  /**
   * Deletes a user's score.
   */
  static async deleteScore(userId: string, scoreId: string): Promise<void> {
    const scoreToDelete = await prisma.score.findUnique({
      where: { id: scoreId },
    });

    if (!scoreToDelete || scoreToDelete.userId !== userId) {
      throw new Error("Score not found or unauthorized");
    }

    await prisma.score.delete({
      where: { id: scoreId },
    });
  }
}
