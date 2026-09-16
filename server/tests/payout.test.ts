import { PayoutStatus, PrizeTier, Role, VerificationStatus } from '@prisma/client';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { supabaseServer } from '../src/config/supabase.js';

vi.mock('../src/config/supabase.js', () => ({
  supabaseServer: {
    auth: { getUser: vi.fn() },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'mock/path.png' }, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://storage.digitalheroes.app/signed/path.png' }, error: null }),
      }),
    },
  },
}));

vi.mock('../src/config/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    subscription: {
      findUnique: vi.fn().mockResolvedValue({
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
      }),
    },
    drawWinner: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    winnerProof: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    payout: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

const mockUser1 = {
  id: 'user-winner-1',
  email: 'winner1@example.com',
  role: Role.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUser2 = {
  id: 'user-winner-2',
  email: 'winner2@example.com',
  role: Role.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAdmin = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: Role.ADMIN,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleWinner = {
  id: 'winner-100',
  drawId: 'draw-1',
  userId: 'user-winner-1',
  matchType: PrizeTier.FIVE,
  prizeAmount: 5000,
  createdAt: new Date(),
  draw: {
    id: 'draw-1',
    month: 10,
    year: 2026,
    winningNumbers: [5, 10, 15, 20, 25],
    publishedAt: new Date(),
  },
  proof: null,
  payout: null,
};

describe('Winner Verification, Proof Upload & Payout State Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. User Endpoints & Security
  describe('User Endpoints & Authorization', () => {
    it('allows a winner to view their own winnings list', async () => {
      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-winner-1', email: 'winner1@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockUser1);
      (prisma.drawWinner.findMany as any).mockResolvedValue([sampleWinner]);

      const response = await request(app)
        .get('/api/v1/me/winnings')
        .set('Authorization', 'Bearer winner-token');

      expect(response.status).toBe(200);
      expect(response.body.data.winnings).toHaveLength(1);
      expect(response.body.data.winnings[0].id).toBe('winner-100');
    });

    it('prevents user from viewing another user winning record', async () => {
      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-winner-2', email: 'winner2@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockUser2);
      (prisma.drawWinner.findUnique as any).mockResolvedValue(sampleWinner);

      const response = await request(app)
        .get('/api/v1/me/winnings/winner-100')
        .set('Authorization', 'Bearer winner2-token');

      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain('Not authorized');
    });

    it('allows winner to upload screenshot proof', async () => {
      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-winner-1', email: 'winner1@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockUser1);
      (prisma.drawWinner.findUnique as any).mockResolvedValue(sampleWinner);
      (prisma.winnerProof.upsert as any).mockResolvedValue({
        id: 'proof-1',
        winnerId: 'winner-100',
        fileUrl: 'http://example.com/proof.png',
        storagePath: 'winner-100/proof.png',
        status: VerificationStatus.PENDING,
      });

      const response = await request(app)
        .post('/api/v1/me/winnings/winner-100/proof')
        .set('Authorization', 'Bearer winner-token')
        .send({
          proofImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          mimeType: 'image/png',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.proof.status).toBe('PENDING');
    });

    it('rejects upload attempt for non-existent winner record', async () => {
      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-winner-1', email: 'winner1@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockUser1);
      (prisma.drawWinner.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/me/winnings/invalid-winner/proof')
        .set('Authorization', 'Bearer winner-token')
        .send({
          proofImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          mimeType: 'image/png',
        });

      expect(response.status).toBe(404);
    });

    it('rejects invalid image file format', async () => {
      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-winner-1', email: 'winner1@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockUser1);

      const response = await request(app)
        .post('/api/v1/me/winnings/winner-100/proof')
        .set('Authorization', 'Bearer winner-token')
        .send({
          proofImage: 'data:application/pdf;base64,JVBERi0xLjQK...',
          mimeType: 'application/pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Invalid proof payload');
    });

    it('resubmitting a rejected proof resets status to PENDING', async () => {
      const rejectedWinner = {
        ...sampleWinner,
        proof: {
          id: 'proof-1',
          winnerId: 'winner-100',
          fileUrl: 'http://example.com/old.png',
          storagePath: 'winner-100/old.png',
          status: VerificationStatus.REJECTED,
          rejectionReason: 'Illegible screenshot',
        },
      };

      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-winner-1', email: 'winner1@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockUser1);
      (prisma.drawWinner.findUnique as any).mockResolvedValue(rejectedWinner);
      (prisma.winnerProof.upsert as any).mockResolvedValue({
        id: 'proof-1',
        winnerId: 'winner-100',
        fileUrl: 'http://example.com/new.png',
        storagePath: 'winner-100/new.png',
        status: VerificationStatus.PENDING,
        rejectionReason: null,
      });

      const response = await request(app)
        .post('/api/v1/me/winnings/winner-100/proof')
        .set('Authorization', 'Bearer winner-token')
        .send({
          proofImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          mimeType: 'image/png',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.proof.status).toBe('PENDING');
    });
  });

  // 2. Admin Verification & Payout Workflows
  describe('Admin Endpoints & Payout State Engine', () => {
    it('prevents non-admin from viewing admin winners list', async () => {
      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-winner-1', email: 'winner1@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockUser1);

      const response = await request(app)
        .get('/api/v1/admin/winners')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
    });

    it('allows admin to list all winners', async () => {
      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockAdmin);
      (prisma.drawWinner.findMany as any).mockResolvedValue([sampleWinner]);

      const response = await request(app)
        .get('/api/v1/admin/winners')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.data.winners).toHaveLength(1);
    });

    it('admin cannot approve proof if no proof has been submitted', async () => {
      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockAdmin);
      (prisma.drawWinner.findUnique as any).mockResolvedValue({
        ...sampleWinner,
        proof: null,
      });

      const response = await request(app)
        .post('/api/v1/admin/winners/winner-100/approve')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('not submitted proof');
    });

    it('admin can approve valid proof and initialize PENDING payout', async () => {
      const winnerWithProof = {
        ...sampleWinner,
        proof: {
          id: 'proof-1',
          winnerId: 'winner-100',
          fileUrl: 'http://example.com/proof.png',
          storagePath: 'winner-100/proof.png',
          status: VerificationStatus.PENDING,
        },
      };

      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockAdmin);
      (prisma.drawWinner.findUnique as any).mockResolvedValue(winnerWithProof);
      (prisma.winnerProof.update as any).mockResolvedValue({
        id: 'proof-1',
        status: VerificationStatus.APPROVED,
        reviewedById: 'admin-1',
      });
      (prisma.payout.upsert as any).mockResolvedValue({
        id: 'payout-1',
        winnerId: 'winner-100',
        amount: 5000,
        status: PayoutStatus.PENDING,
      });

      const response = await request(app)
        .post('/api/v1/admin/winners/winner-100/approve')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.data.proof.status).toBe('APPROVED');
      expect(response.body.data.payout.status).toBe('PENDING');
    });

    it('admin reject requires a rejection reason', async () => {
      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockAdmin);

      const response = await request(app)
        .post('/api/v1/admin/winners/winner-100/reject')
        .set('Authorization', 'Bearer admin-token')
        .send({ rejectionReason: '' });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Rejection reason');
    });

    it('admin can reject submitted proof with a valid reason', async () => {
      const winnerWithProof = {
        ...sampleWinner,
        proof: {
          id: 'proof-1',
          winnerId: 'winner-100',
          fileUrl: 'http://example.com/proof.png',
          storagePath: 'winner-100/proof.png',
          status: VerificationStatus.PENDING,
        },
      };

      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockAdmin);
      (prisma.drawWinner.findUnique as any).mockResolvedValue(winnerWithProof);
      (prisma.winnerProof.update as any).mockResolvedValue({
        id: 'proof-1',
        status: VerificationStatus.REJECTED,
        rejectionReason: 'Unclear score card photo',
      });

      const response = await request(app)
        .post('/api/v1/admin/winners/winner-100/reject')
        .set('Authorization', 'Bearer admin-token')
        .send({ rejectionReason: 'Unclear score card photo' });

      expect(response.status).toBe(200);
      expect(response.body.data.proof.status).toBe('REJECTED');
    });

    it('cannot mark payout as paid if proof is not APPROVED', async () => {
      const winnerPendingProof = {
        ...sampleWinner,
        proof: {
          id: 'proof-1',
          status: VerificationStatus.PENDING,
        },
        payout: null,
      };

      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockAdmin);
      (prisma.drawWinner.findUnique as any).mockResolvedValue(winnerPendingProof);

      const response = await request(app)
        .post('/api/v1/admin/winners/winner-100/mark-paid')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('not approved');
    });

    it('allows admin to mark approved winner payout as PAID', async () => {
      const approvedWinner = {
        ...sampleWinner,
        proof: {
          id: 'proof-1',
          status: VerificationStatus.APPROVED,
        },
        payout: {
          id: 'payout-1',
          status: PayoutStatus.PENDING,
        },
      };

      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockAdmin);
      (prisma.drawWinner.findUnique as any).mockResolvedValue(approvedWinner);
      (prisma.payout.update as any).mockResolvedValue({
        id: 'payout-1',
        status: PayoutStatus.PAID,
        paymentReference: 'TXN998877',
        paidAt: new Date(),
      });

      const response = await request(app)
        .post('/api/v1/admin/winners/winner-100/mark-paid')
        .set('Authorization', 'Bearer admin-token')
        .send({ paymentReference: 'TXN998877' });

      expect(response.status).toBe(200);
      expect(response.body.data.payout.status).toBe('PAID');
    });

    it('cannot mark already paid payout as paid again', async () => {
      const paidWinner = {
        ...sampleWinner,
        proof: {
          id: 'proof-1',
          status: VerificationStatus.APPROVED,
        },
        payout: {
          id: 'payout-1',
          status: PayoutStatus.PAID,
        },
      };

      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockAdmin);
      (prisma.drawWinner.findUnique as any).mockResolvedValue(paidWinner);

      const response = await request(app)
        .post('/api/v1/admin/winners/winner-100/mark-paid')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('already marked as paid');
    });
  });
});
