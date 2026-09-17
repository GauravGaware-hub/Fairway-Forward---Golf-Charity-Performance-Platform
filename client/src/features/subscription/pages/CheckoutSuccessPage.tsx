import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchSubscription } from "../api/subscriptionApi";

export function CheckoutSuccessPage() {
  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => fetchSubscription(),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === "ACTIVE" || data.status === "TRIALING")) {
        return false;
      }
      return 2000; // Poll every 2s until webhook confirms subscription in database
    },
  });

  const isConfirmed =
    subscription &&
    (subscription.status === "ACTIVE" || subscription.status === "TRIALING");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm text-center">
        {!isConfirmed ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Confirming Your Subscription</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you for completing checkout! We are currently confirming your payment with Razorpay via secure webhook.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
              ✓
            </div>
            <h2 className="text-xl font-bold tracking-tight text-emerald-500">Subscription Confirmed!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your {subscription.plan} membership is now active. You have full access to performance tracking and charity features.
            </p>
          </>
        )}

        <div className="mt-6">
          <Link
            to="/subscription"
            className="inline-flex items-center justify-center py-2 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-colors"
          >
            Go to Subscription Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
