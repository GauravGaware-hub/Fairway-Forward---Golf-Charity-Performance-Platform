import { NextFunction, Request, Response } from 'express';
import { PayoutService } from '../services/payout.service.js';
import { markPaidSchema, rejectProofSchema, uploadProofSchema } from '../validators/payout.validator.js';

const payoutService = new PayoutService();

// User Endpoints
export async function getUserWinnings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const winnings = await payoutService.getUserWinnings(user.id);
    res.status(200).json({
      success: true,
      data: { winnings },
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserWinningById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const winning = await payoutService.getUserWinningById(user.id, id);
    res.status(200).json({
      success: true,
      data: { winning },
    });
  } catch (error) {
    next(error);
  }
}

export async function submitWinnerProof(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const parseResult = uploadProofSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid proof payload',
          details: parseResult.error.format(),
        },
      });
      return;
    }

    const { proofImage, mimeType } = parseResult.data;

    // Convert base64 or raw data string to Buffer
    let buffer: Buffer;
    if (proofImage.startsWith('data:')) {
      const base64Data = proofImage.split(',')[1] || proofImage;
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = Buffer.from(proofImage, 'base64');
    }

    const proof = await payoutService.submitWinnerProof(user.id, id, buffer, mimeType);

    res.status(200).json({
      success: true,
      data: { proof },
    });
  } catch (error) {
    next(error);
  }
}

// Admin Endpoints
export async function adminListWinners(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const winners = await payoutService.adminListWinners();
    res.status(200).json({
      success: true,
      data: { winners },
    });
  } catch (error) {
    next(error);
  }
}

export async function adminGetWinnerById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const winner = await payoutService.adminGetWinnerById(id);
    res.status(200).json({
      success: true,
      data: { winner },
    });
  } catch (error) {
    next(error);
  }
}

export async function adminApproveProof(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const result = await payoutService.adminApproveProof(id, admin.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminRejectProof(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const admin = req.user!;
    const { id } = req.params;

    const parseResult = rejectProofSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rejection reason is required',
          details: parseResult.error.format(),
        },
      });
      return;
    }

    const { rejectionReason } = parseResult.data;
    const result = await payoutService.adminRejectProof(id, admin.id, rejectionReason);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminMarkPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const parseResult = markPaidSchema.safeParse(req.body);
    const paymentReference = parseResult.success ? parseResult.data.paymentReference : undefined;

    const result = await payoutService.adminMarkPaid(id, paymentReference);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
