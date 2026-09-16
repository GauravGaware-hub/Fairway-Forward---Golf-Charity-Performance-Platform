import { apiFetch } from "../../../lib/api";

export interface UserSubscription {
  id?: string;
  plan: "MONTHLY" | "YEARLY" | null;
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INACTIVE";
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutResponse {
  sessionId: string;
  url: string | null;
}

export async function fetchSubscription(): Promise<UserSubscription> {
  const res = await apiFetch<{ success: boolean; data: UserSubscription }>("/api/v1/subscription");
  return res.data || (res as unknown as UserSubscription);
}

export async function createCheckoutSession(
  plan: "MONTHLY" | "YEARLY"
): Promise<CheckoutResponse> {
  const res = await apiFetch<{ success: boolean; data: CheckoutResponse }>("/api/v1/subscription/checkout", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
  return res.data || (res as unknown as CheckoutResponse);
}

export async function cancelSubscription(): Promise<void> {
  await apiFetch("/api/v1/subscription/cancel", {
    method: "POST",
  });
}
