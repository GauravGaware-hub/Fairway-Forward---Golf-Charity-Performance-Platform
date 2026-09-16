import { useQuery } from "@tanstack/react-query";
import { apiFetch, ApiError } from "../lib/api";

export interface SubscriptionStatusData {
  hasActiveSubscription: boolean;
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INACTIVE";
  plan: "MONTHLY" | "YEARLY" | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}

export function useSubscriptionStatus() {
  return useQuery<SubscriptionStatusData>({
    queryKey: ["subscriptionStatus"],
    queryFn: async () => {
      try {
        const res = await apiFetch("/api/v1/subscription");
        const sub = res.data || res.subscription || res;
        const isActive = ["ACTIVE", "TRIALING", "PAST_DUE"].includes(sub.status);
        return {
          hasActiveSubscription: isActive,
          status: sub.status || "INACTIVE",
          plan: sub.plan || null,
          cancelAtPeriodEnd: !!sub.cancelAtPeriodEnd,
          currentPeriodEnd: sub.currentPeriodEnd || null,
        };
      } catch (err: unknown) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          return {
            hasActiveSubscription: false,
            status: "INACTIVE",
            plan: null,
            cancelAtPeriodEnd: false,
            currentPeriodEnd: null,
          };
        }
        return {
          hasActiveSubscription: false,
          status: "INACTIVE",
          plan: null,
          cancelAtPeriodEnd: false,
          currentPeriodEnd: null,
        };
      }
    },
  });
}
