import { UserSubscription } from "../api/subscriptionApi";

interface SubscriptionStatusProps {
  subscription: UserSubscription;
  onCancel: () => void;
  isCanceling?: boolean;
}

export function SubscriptionStatusView({
  subscription,
  onCancel,
  isCanceling,
}: SubscriptionStatusProps) {
  const isActive =
    subscription.status === "ACTIVE" || subscription.status === "TRIALING";

  const statusBadgeColor = subscription.isDemo
    ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
    : {
        ACTIVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        TRIALING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        PAST_DUE: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        CANCELED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        INACTIVE: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      }[subscription.status];

  return (
    <div className="w-full max-w-xl mx-auto rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-semibold">Subscription Overview</h3>
          <p className="text-sm text-muted-foreground">Your active Digital Heroes membership</p>
        </div>
        <div className="flex items-center gap-2">
          {subscription.isDemo && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Demo
            </span>
          )}
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeColor}`}
          >
            {subscription.status}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">Plan</span>
          <span className="font-medium">
            {subscription.plan || "None"} {subscription.isDemo ? "(Free Demo)" : ""}
          </span>
        </div>

        {subscription.currentPeriodEnd && (
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">
              {subscription.cancelAtPeriodEnd ? "Access Valid Until" : "Next Renewal Date"}
            </span>
            <span className="font-medium">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        )}

        {subscription.isDemo && (
          <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-start gap-2">
            <span className="font-bold">ℹ️</span>
            <div>
              <p className="font-semibold">Evaluation Subscription Active</p>
              <p className="mt-0.5 text-teal-200/80">
                This is a free demo/evaluation subscription. No payment was charged.
              </p>
            </div>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            ⚠️ Your subscription is scheduled for cancellation at the end of the billing period.
          </div>
        )}
      </div>

      {isActive && !subscription.cancelAtPeriodEnd && (
        <div className="mt-6 pt-4 border-t border-border flex justify-end">
          <button
            type="button"
            disabled={isCanceling}
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isCanceling ? "Canceling..." : "Cancel Subscription"}
          </button>
        </div>
      )}
    </div>
  );
}
