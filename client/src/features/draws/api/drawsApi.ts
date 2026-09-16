import { apiFetch } from "../../../lib/api";

export interface PrizePool {
  id: string;
  drawId: string;
  matchType: "THREE" | "FOUR" | "FIVE";
  percentage: number;
  poolAmount: number;
  rolloverAmount: number;
  totalAmount: number;
}

export interface DrawWinner {
  id: string;
  drawId: string;
  userId: string;
  matchType: "THREE" | "FOUR" | "FIVE";
  prizeAmount: number;
  createdAt: string;
  user?: {
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  draw?: {
    month: number;
    year: number;
    publishedAt: string;
  };
}

export interface Draw {
  id: string;
  month: number;
  year: number;
  strategy: "RANDOM" | "SCORE_WEIGHTED";
  status: "DRAFT" | "SIMULATED" | "PUBLISHED";
  winningNumbers: number[];
  simulationResult?: Record<string, unknown>;
  publishedAt?: string;
  createdAt: string;
  prizePools?: PrizePool[];
  winners?: DrawWinner[];
}

export interface UserDrawEntry {
  drawId: string;
  userId: string;
  numbers: number[];
  isDraftPreview?: boolean;
}

export async function fetchPublicDraws(): Promise<Draw[]> {
  const json = await apiFetch<{ success: boolean; data: { draws: Draw[] } }>("/api/v1/draws");
  return json.data?.draws || (json as unknown as Draw[]);
}

export async function fetchDrawById(id: string): Promise<Draw> {
  const json = await apiFetch<{ success: boolean; data: { draw: Draw } }>(`/api/v1/draws/${id}`);
  return json.data?.draw || (json as unknown as Draw);
}

export async function fetchUserDrawEntry(drawId: string): Promise<UserDrawEntry | null> {
  const json = await apiFetch<{ success: boolean; data: { entry: UserDrawEntry } }>(`/api/v1/draws/${drawId}/entry`);
  return json.data?.entry || null;
}

export async function fetchUserWinnings(): Promise<DrawWinner[]> {
  const json = await apiFetch<{ success: boolean; data: { winnings: DrawWinner[] } }>("/api/v1/me/winnings");
  return json.data?.winnings || (json as unknown as DrawWinner[]);
}

// Admin API Callers
export async function adminCreateDraw(
  data: { month: number; year: number; strategy: "RANDOM" | "SCORE_WEIGHTED" }
): Promise<Draw> {
  const json = await apiFetch<{ success: boolean; data: { draw: Draw } }>("/api/v1/admin/draws", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data?.draw || (json as unknown as Draw);
}

export async function adminFetchDraws(): Promise<Draw[]> {
  const json = await apiFetch<{ success: boolean; data: { draws: Draw[] } }>("/api/v1/admin/draws");
  return json.data?.draws || (json as unknown as Draw[]);
}

export async function adminSimulateDraw(drawId: string): Promise<Record<string, unknown>> {
  const json = await apiFetch<{ success: boolean; data: { simulation: Record<string, unknown> } }>(
    `/api/v1/admin/draws/${drawId}/simulate`,
    {
      method: "POST",
    }
  );
  return json.data?.simulation || (json as unknown as Record<string, unknown>);
}

export async function adminPublishDraw(drawId: string): Promise<Draw> {
  const json = await apiFetch<{ success: boolean; data: { draw: Draw } }>(
    `/api/v1/admin/draws/${drawId}/publish`,
    {
      method: "POST",
    }
  );
  return json.data?.draw || (json as unknown as Draw);
}
