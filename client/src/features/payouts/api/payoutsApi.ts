import { apiFetch } from "../../../lib/api";

export interface WinnerProof {
  id: string;
  winnerId: string;
  fileUrl: string;
  storagePath: string;
  signedProofUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedById?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  winnerId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID";
  paymentReference?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DetailedWinner {
  id: string;
  drawId: string;
  userId: string;
  matchType: "THREE" | "FOUR" | "FIVE";
  prizeAmount: number;
  createdAt: string;
  draw?: {
    id: string;
    month: number;
    year: number;
    winningNumbers?: number[];
    publishedAt?: string;
  };
  user?: {
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  proof?: WinnerProof | null;
  payout?: Payout | null;
}

export async function fetchMyWinnings(): Promise<DetailedWinner[]> {
  const json = await apiFetch<{ success: boolean; data: { winnings: DetailedWinner[] } }>("/api/v1/me/winnings");
  return json.data?.winnings || (json as unknown as DetailedWinner[]);
}

export async function fetchMyWinningById(winnerId: string): Promise<DetailedWinner> {
  const json = await apiFetch<{ success: boolean; data: { winning: DetailedWinner } }>(
    `/api/v1/me/winnings/${winnerId}`
  );
  return json.data?.winning || (json as unknown as DetailedWinner);
}

export async function submitWinnerProofApi(
  winnerId: string,
  proofImage: string,
  mimeType: string
): Promise<WinnerProof> {
  const json = await apiFetch<{ success: boolean; data: { proof: WinnerProof } }>(
    `/api/v1/me/winnings/${winnerId}/proof`,
    {
      method: "POST",
      body: JSON.stringify({ proofImage, mimeType }),
    }
  );
  return json.data?.proof || (json as unknown as WinnerProof);
}

// Admin API
export async function adminFetchWinners(): Promise<DetailedWinner[]> {
  const json = await apiFetch<{ success: boolean; data: { winners: DetailedWinner[] } }>(
    "/api/v1/admin/winners"
  );
  return json.data?.winners || (json as unknown as DetailedWinner[]);
}

export async function adminApproveWinnerProof(winnerId: string): Promise<Record<string, unknown>> {
  const json = await apiFetch<{ success: boolean; data: Record<string, unknown> }>(
    `/api/v1/admin/winners/${winnerId}/approve`,
    {
      method: "POST",
    }
  );
  return json.data || (json as unknown as Record<string, unknown>);
}

export async function adminRejectWinnerProof(
  winnerId: string,
  rejectionReason: string
): Promise<Record<string, unknown>> {
  const json = await apiFetch<{ success: boolean; data: Record<string, unknown> }>(
    `/api/v1/admin/winners/${winnerId}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ rejectionReason }),
    }
  );
  return json.data || (json as unknown as Record<string, unknown>);
}

export async function adminMarkWinnerPaid(
  winnerId: string,
  paymentReference?: string
): Promise<Record<string, unknown>> {
  const json = await apiFetch<{ success: boolean; data: Record<string, unknown> }>(
    `/api/v1/admin/winners/${winnerId}/mark-paid`,
    {
      method: "POST",
      body: JSON.stringify({ paymentReference }),
    }
  );
  return json.data || (json as unknown as Record<string, unknown>);
}
