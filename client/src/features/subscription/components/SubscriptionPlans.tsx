import { useState } from "react";

interface SubscriptionPlansProps {
  onSelectPlan: (plan: "MONTHLY" | "YEARLY") => void;
  isLoading?: boolean;
}

export function SubscriptionPlans({ onSelectPlan, isLoading }: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Choose Your Subscription Plan</h2>
        <p className="text-muted-foreground mt-2">
          Unlock performance score tracking, charity contributions, and eligibility for monthly draws.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Plan Card */}
        <div
          onClick={() => setSelectedPlan("MONTHLY")}
          className={`cursor-pointer rounded-xl border p-6 transition-all shadow-sm ${
            selectedPlan === "MONTHLY"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-950/10"
              : "border-border hover:border-muted-foreground/30"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold">Monthly Membership</h3>
              <p className="text-sm text-muted-foreground mt-1">Flexible month-to-month access</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Popular
            </span>
          </div>

          <div className="mt-6">
            <span className="text-3xl font-extrabold">Monthly</span>
            <span className="text-muted-foreground text-sm font-normal"> / billed monthly</span>
          </div>

          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span> Stableford score management (top 5)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span> Support partner charities (min 10%)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span> Monthly hero draw eligibility
            </li>
          </ul>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => onSelectPlan("MONTHLY")}
            className="mt-8 w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50"
          >
            {isLoading && selectedPlan === "MONTHLY" ? "Opening Razorpay Checkout..." : "Subscribe Monthly"}
          </button>
        </div>

        {/* Yearly Plan Card */}
        <div
          onClick={() => setSelectedPlan("YEARLY")}
          className={`cursor-pointer rounded-xl border p-6 transition-all shadow-sm ${
            selectedPlan === "YEARLY"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-950/10"
              : "border-border hover:border-muted-foreground/30"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold">Annual Hero Pass</h3>
              <p className="text-sm text-muted-foreground mt-1">Best value for dedicated golfers</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Save Big
            </span>
          </div>

          <div className="mt-6">
            <span className="text-3xl font-extrabold">Yearly</span>
            <span className="text-muted-foreground text-sm font-normal"> / billed annually</span>
          </div>

          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span> All Monthly plan features included
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span> Full 12-month uninterrupted access
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span> Priority status in Digital Heroes events
            </li>
          </ul>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => onSelectPlan("YEARLY")}
            className="mt-8 w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50"
          >
            {isLoading && selectedPlan === "YEARLY" ? "Opening Razorpay Checkout..." : "Subscribe Yearly"}
          </button>
        </div>
      </div>
    </div>
  );
}
