import { NextFunction, Request, Response } from 'express';
import { DrawService } from '../services/draw.service.js';
import { createDrawSchema } from '../validators/draw.validator.js';

const drawService = new DrawService();

// Admin Endpoints
export async function adminCreateDraw(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = createDrawSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid draw payload',
          details: parseResult.error.format(),
        },
      });
      return;
    }

    const { month, year, strategy } = parseResult.data;
    const draw = await drawService.createDraw(month, year, strategy);

    res.status(201).json({
      success: true,
      data: { draw },
    });
  } catch (error) {
    next(error);
  }
}

export async function adminListDraws(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const draws = await drawService.listAllDrawsForAdmin();
    res.status(200).json({
      success: true,
      data: { draws },
    });
  } catch (error) {
    next(error);
  }
}

export async function adminGetDrawById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const draw = await drawService.getDrawById(id);
    if (!draw) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Draw not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { draw },
    });
  } catch (error) {
    next(error);
  }
}

export async function adminSimulateDraw(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const simulation = await drawService.simulateDraw(id);
    res.status(200).json({
      success: true,
      data: { simulation },
    });
  } catch (error) {
    next(error);
  }
}

export async function adminPublishDraw(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const publishedDraw = await drawService.publishDraw(id);
    res.status(200).json({
      success: true,
      data: { draw: publishedDraw },
    });
  } catch (error) {
    next(error);
  }
}

// User / Public Endpoints
export async function getPublicDraws(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const draws = await drawService.getPublicDraws();
    res.status(200).json({
      success: true,
      data: { draws },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDrawById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const draw = await drawService.getDrawById(id);
    if (!draw || draw.status !== 'PUBLISHED') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Published draw not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { draw },
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserEntryForDraw(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;
    const entry = await drawService.getUserEntry(id, user.id);

    res.status(200).json({
      success: true,
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyWinnings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const winnings = await drawService.getUserWinnings(user.id);

    res.status(200).json({
      success: true,
      data: { winnings },
    });
  } catch (error) {
    next(error);
  }
}
