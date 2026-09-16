import { Request, Response } from "express";
import { ScoreService } from "../services/score.service.js";
import { createScoreSchema, updateScoreSchema } from "../validators/score.validator.js";

export async function getScores(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const scores = await ScoreService.getUserScores(user.id);

  res.status(200).json({
    success: true,
    data: { scores },
  });
}

export async function createScore(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const parseResult = createScoreSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid score payload",
        details: parseResult.error.format(),
      },
    });
    return;
  }

  try {
    const scores = await ScoreService.createScore(user.id, parseResult.data);
    res.status(201).json({
      success: true,
      data: { scores },
    });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: err instanceof Error ? err.message : "Failed to create score",
      },
    });
  }
}

export async function updateScore(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const scoreId = req.params.id;

  const parseResult = updateScoreSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid score update payload",
        details: parseResult.error.format(),
      },
    });
    return;
  }

  try {
    const scores = await ScoreService.updateScore(user.id, scoreId, parseResult.data);
    res.status(200).json({
      success: true,
      data: { scores },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update score";
    const isNotFound = message.includes("not found") || message.includes("unauthorized");
    res.status(isNotFound ? 404 : 400).json({
      success: false,
      error: {
        code: isNotFound ? "NOT_FOUND" : "BAD_REQUEST",
        message,
      },
    });
  }
}

export async function deleteScore(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const scoreId = req.params.id;

  try {
    await ScoreService.deleteScore(user.id, scoreId);
    res.status(200).json({
      success: true,
      data: {
        message: "Score deleted successfully",
      },
    });
  } catch (err: unknown) {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: err instanceof Error ? err.message : "Score not found or unauthorized",
      },
    });
  }
}
