import { PayoutStatus, VerificationStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { StorageService } from './storage.service.js';

interface AppError extends Error {
  statusCode?: number;
}

function createAppError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export class PayoutService {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  async getUserWinnings(userId: string) {
    const winnings = await prisma.drawWinner.findMany({
      where: { userId },
      include: {
        draw: {
          select: {
            id: true,
            month: true,
            year: true,
            winningNumbers: true,
            publishedAt: true,
          },
        },
        proof: true,
        payout: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = [];
    for (const w of winnings) {
      let signedProofUrl = null;
      if (w.proof?.storagePath) {
        signedProofUrl = await this.storageService.getSignedProofUrl(w.proof.storagePath);
      }
      result.push({
        ...w,
        proof: w.proof
          ? {
              ...w.proof,
              signedProofUrl,
            }
          : null,
      });
    }

    return result;
  }

  async getUserWinningById(userId: string, winnerId: string) {
    const winner = await prisma.drawWinner.findUnique({
      where: { id: winnerId },
      include: {
        draw: {
          select: {
            id: true,
            month: true,
            year: true,
            winningNumbers: true,
            publishedAt: true,
          },
        },
        proof: true,
        payout: true,
      },
    });

    if (!winner) {
      throw createAppError('Winning record not found', 404);
    }

    if (winner.userId !== userId) {
      throw createAppError('Not authorized to access this winning record', 403);
    }

    let signedProofUrl = null;
    if (winner.proof?.storagePath) {
      signedProofUrl = await this.storageService.getSignedProofUrl(winner.proof.storagePath);
    }

    return {
      ...winner,
      proof: winner.proof
        ? {
            ...winner.proof,
            signedProofUrl,
          }
        : null,
    };
  }

  async submitWinnerProof(
    userId: string,
    winnerId: string,
    proofBuffer: Buffer,
    mimeType: string
  ) {
    const winner = await prisma.drawWinner.findUnique({
      where: { id: winnerId },
      include: { proof: true },
    });

    if (!winner) {
      throw createAppError('Winning record not found', 404);
    }

    if (winner.userId !== userId) {
      throw createAppError('Not authorized to submit proof for another user', 403);
    }

    // Upload image to storage
    const uploadResult = await this.storageService.uploadWinnerProof(
      winnerId,
      proofBuffer,
      mimeType
    );

    // Create or Update WinnerProof
    const proof = await prisma.winnerProof.upsert({
      where: { winnerId },
      create: {
        winnerId,
        fileUrl: uploadResult.fileUrl,
        storagePath: uploadResult.storagePath,
        status: VerificationStatus.PENDING,
      },
      update: {
        fileUrl: uploadResult.fileUrl,
        storagePath: uploadResult.storagePath,
        status: VerificationStatus.PENDING,
        rejectionReason: null,
        reviewedById: null,
        reviewedAt: null,
      },
    });

    const signedProofUrl = await this.storageService.getSignedProofUrl(proof.storagePath);

    return {
      ...proof,
      signedProofUrl,
    };
  }

  async adminListWinners() {
    const winners = await prisma.drawWinner.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        draw: {
          select: {
            id: true,
            month: true,
            year: true,
            publishedAt: true,
          },
        },
        proof: true,
        payout: true,
      },
    });

    const result = [];
    for (const w of winners) {
      let signedProofUrl = null;
      if (w.proof?.storagePath) {
        signedProofUrl = await this.storageService.getSignedProofUrl(w.proof.storagePath);
      }
      result.push({
        ...w,
        proof: w.proof
          ? {
              ...w.proof,
              signedProofUrl,
            }
          : null,
      });
    }

    return result;
  }

  async adminGetWinnerById(winnerId: string) {
    const winner = await prisma.drawWinner.findUnique({
      where: { id: winnerId },
      include: {
        user: {
          include: { profile: true },
        },
        draw: {
          select: {
            id: true,
            month: true,
            year: true,
            publishedAt: true,
          },
        },
        proof: true,
        payout: true,
      },
    });

    if (!winner) {
      throw createAppError('Winner not found', 404);
    }

    let signedProofUrl = null;
    if (winner.proof?.storagePath) {
      signedProofUrl = await this.storageService.getSignedProofUrl(winner.proof.storagePath);
    }

    return {
      ...winner,
      proof: winner.proof
        ? {
            ...winner.proof,
            signedProofUrl,
          }
        : null,
    };
  }

  async adminApproveProof(winnerId: string, adminId: string) {
    const winner = await prisma.drawWinner.findUnique({
      where: { id: winnerId },
      include: { proof: true, payout: true },
    });

    if (!winner || !winner.proof) {
      throw createAppError('Winner has not submitted proof for verification', 400);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Approve proof
      const updatedProof = await tx.winnerProof.update({
        where: { winnerId },
        data: {
          status: VerificationStatus.APPROVED,
          reviewedById: adminId,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });

      // 2. Initialize payout record in PENDING status if not existing
      const payout = await tx.payout.upsert({
        where: { winnerId },
        create: {
          winnerId,
          amount: winner.prizeAmount,
          currency: 'INR',
          status: PayoutStatus.PENDING,
        },
        update: {
          amount: winner.prizeAmount,
        },
      });

      return {
        proof: updatedProof,
        payout,
      };
    });
  }

  async adminRejectProof(winnerId: string, adminId: string, rejectionReason: string) {
    if (!rejectionReason || rejectionReason.trim().length < 3) {
      throw createAppError('Rejection reason must be at least 3 characters long', 400);
    }

    const winner = await prisma.drawWinner.findUnique({
      where: { id: winnerId },
      include: { proof: true },
    });

    if (!winner || !winner.proof) {
      throw createAppError('Winner has not submitted proof for verification', 400);
    }

    return prisma.$transaction(async (tx) => {
      const updatedProof = await tx.winnerProof.update({
        where: { winnerId },
        data: {
          status: VerificationStatus.REJECTED,
          rejectionReason: rejectionReason.trim(),
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });

      return { proof: updatedProof };
    });
  }

  async adminMarkPaid(winnerId: string, paymentReference?: string) {
    const winner = await prisma.drawWinner.findUnique({
      where: { id: winnerId },
      include: { proof: true, payout: true },
    });

    if (!winner || !winner.proof) {
      throw createAppError('Winner has not submitted proof', 400);
    }

    if (winner.proof.status !== VerificationStatus.APPROVED) {
      throw createAppError('Cannot mark payout as paid: Winner proof is not approved', 400);
    }

    if (!winner.payout) {
      throw createAppError('Payout record has not been initialized for this winner', 400);
    }

    if (winner.payout.status === PayoutStatus.PAID) {
      throw createAppError('Payout is already marked as paid', 400);
    }

    return prisma.$transaction(async (tx) => {
      const updatedPayout = await tx.payout.update({
        where: { winnerId },
        data: {
          status: PayoutStatus.PAID,
          paymentReference: paymentReference?.trim() || null,
          paidAt: new Date(),
        },
      });

      return { payout: updatedPayout };
    });
  }
}
