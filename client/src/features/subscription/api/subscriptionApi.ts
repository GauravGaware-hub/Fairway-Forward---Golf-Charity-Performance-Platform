import { apiFetch } from "../../../lib/api";

export interface UserSubscription {
  id?: string;
  plan: "MONTHLY" | "YEARLY" | null;
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INACTIVE";
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isDemo?: boolean;
  demoMode?: boolean;
}

export interface CheckoutResponse {
  subscriptionId?: string;
  keyId?: string;
  sessionId?: string;
  url?: string | null;
}

export interface VerifyPaymentPayload {
  paymentId: string;
  subscriptionId: string;
  signature: string;
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

export async function verifyPayment(payload: VerifyPaymentPayload): Promise<void> {
  await apiFetch("/api/v1/subscription/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelSubscription(): Promise<void> {
  await apiFetch("/api/v1/subscription/cancel", {
    method: "POST",
  });
}

export async function activateDemoSubscription(): Promise<UserSubscription> {
  const res = await apiFetch<{ success: boolean; data: UserSubscription }>("/api/v1/subscription/demo", {
    method: "POST",
  });
  return res.data || (res as unknown as UserSubscription);
}
