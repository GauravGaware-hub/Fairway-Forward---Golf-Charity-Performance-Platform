import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelSubscription,
  createCheckoutSession,
  fetchSubscription,
  verifyPayment,
} from "../api/subscriptionApi";
import { SubscriptionPlans } from "../components/SubscriptionPlans";
import { SubscriptionStatusView } from "../components/SubscriptionStatus";

export function SubscriptionPage() {
  const queryClient = useQueryClient();

  const {
    data: subscription,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => fetchSubscription(),
  });

  const checkoutMutation = useMutation({
    mutationFn: (plan: "MONTHLY" | "YEARLY") => createCheckoutSession(plan),
    onSuccess: (data) => {
      const subId = data.subscriptionId || data.sessionId;
      const keyId = data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "";

      if (subId && typeof window !== "undefined" && window.Razorpay) {
        const options = {
          key: keyId,
          subscription_id: subId,
          name: "Fairway Forward",
          description: "Golf & Charity Performance Subscription",
          theme: { color: "#059669" },
          handler: async function (response: {
            razorpay_payment_id: string;
            razorpay_subscription_id: string;
            razorpay_signature: string;
          }) {
            try {
              await verifyPayment({
                paymentId: response.razorpay_payment_id,
                subscriptionId: response.razorpay_subscription_id,
                signature: response.razorpay_signature,
              });
            } catch (err) {
              console.error("Verification error:", err);
            }
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm max-w-md text-center">
          <p className="font-semibold">Error Loading Subscription</p>
          <p className="mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const hasActiveSub =
    subscription &&
    (subscription.status === "ACTIVE" || subscription.status === "TRIALING");

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your Digital Heroes plan and payment settings.
            </p>
          </div>
        </div>

        {subscription && subscription.status !== "INACTIVE" && (
          <SubscriptionStatusView
            subscription={subscription}
            onCancel={() => cancelMutation.mutate()}
            isCanceling={cancelMutation.isPending}
          />
        )}

        {(!hasActiveSub || subscription?.cancelAtPeriodEnd) && (
          <SubscriptionPlans
            onSelectPlan={(plan) => checkoutMutation.mutate(plan)}
            isLoading={checkoutMutation.isPending}
          />
        )}

        {checkoutMutation.isError && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm max-w-xl mx-auto text-center">
            {(checkoutMutation.error as Error).message}
          </div>
        )}
      </div>
    </div>
  );
}
