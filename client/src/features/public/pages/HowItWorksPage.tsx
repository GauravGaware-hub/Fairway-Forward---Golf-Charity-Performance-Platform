import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Target, Heart, Trophy, CheckCircle, ShieldCheck, FileCheck } from "lucide-react";

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-evergreen-950">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Editorial Guide
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          How Fairway Forward Works
        </h1>
        <p className="text-lg text-evergreen-700 leading-relaxed">
          Fairway Forward bridges amateur golf performance with verified charity funding and monthly cash draw events. Here is the complete step-by-step breakdown.
        </p>
      </div>

      {/* Step 1: Score Entry */}
      <div className="rounded-3xl bg-white p-8 sm:p-12 border border-evergreen-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
            <Target className="w-4 h-4" /> Step 1: Golf Performance History
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Log Your Stableford Golf Scores</h2>
          <p className="text-sm text-evergreen-700 leading-relaxed">
            Every active subscriber logs their genuine 18-hole Stableford scores (valid between 1 and 45 points). Our platform maintains your <strong>latest 5 scores</strong> as your rolling performance history.
          </p>
        </div>
        <div className="lg:col-span-5 rounded-2xl bg-evergreen-950 p-6 text-white space-y-4 shadow-md">
          <div className="text-xs font-mono text-amber-400 font-bold uppercase">Sample 5-Score Performance History</div>
          <div className="flex gap-2 justify-between">
            {[34, 38, 41, 29, 36].map((num, i) => (
              <div
                key={i}
                className="w-11 h-11 rounded-2xl bg-evergreen-800 border border-evergreen-700 text-amber-400 font-extrabold font-mono text-sm flex items-center justify-center shadow-inner"
              >
                {num}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2: Charity Allocation */}
      <div className="rounded-3xl bg-white p-8 sm:p-12 border border-evergreen-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 order-2 lg:order-1 rounded-2xl bg-emerald-950 p-6 text-white space-y-4 shadow-md">
          <div className="text-xs font-mono text-emerald-400 font-bold uppercase">Subscription Distribution</div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-emerald-900/60 border border-emerald-800 flex justify-between items-center text-xs">
              <span className="text-emerald-200">Charity Contribution</span>
              <span className="font-bold font-mono text-emerald-400">Selected Non-Profit</span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-900/60 border border-emerald-800 flex justify-between items-center text-xs">
              <span className="text-emerald-200">Prize Pool Allocation</span>
              <span className="font-bold font-mono text-amber-400">Monthly Event Seed</span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-900/60 border border-emerald-800 flex justify-between items-center text-xs">
              <span className="text-emerald-200">Platform Operations</span>
              <span className="font-bold font-mono text-white">Razorpay & Infrastructure</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-7 order-1 lg:order-2 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <Heart className="w-4 h-4" /> Step 2: Purposeful Charity Selection
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Direct Support to Non-Profits</h2>
          <p className="text-sm text-evergreen-700 leading-relaxed">
            When you subscribe, you choose your preferred partner non-profit from our directory. Subscription revenue is allocated directly to support your chosen charity's cause.
          </p>
          <ul className="space-y-2 text-xs text-evergreen-800 font-medium">
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Direct grant allocations to vetted non-profit partners.</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Transparent allocation ledgers in Admin Reports.</li>
          </ul>
        </div>
      </div>

      {/* Step 3: Monthly Draw Engine & Winner Verification */}
      <div className="rounded-3xl bg-white p-8 sm:p-12 border border-evergreen-100 shadow-sm space-y-6">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-evergreen-800 uppercase tracking-wider">
          <Trophy className="w-4 h-4 text-amber-500" /> Step 3: Draw Execution & Winner Verification
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold">Draw Execution, Verification & Payout</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-5 rounded-2xl bg-chalk border border-evergreen-200 space-y-3">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <h4 className="font-bold text-base text-evergreen-950">Deterministic Draw</h4>
            <p className="text-xs text-evergreen-700 leading-relaxed">
              At the end of each month, the draw engine runs official strategies to select 5 winning numbers (1–45).
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-chalk border border-evergreen-200 space-y-3">
            <FileCheck className="w-6 h-6 text-emerald-600" />
            <h4 className="font-bold text-base text-evergreen-950">Scorecard Proof Upload</h4>
            <p className="text-xs text-evergreen-700 leading-relaxed">
              Winners upload a screenshot of their official golf platform scorecard for admin review.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-chalk border border-evergreen-200 space-y-3">
            <Trophy className="w-6 h-6 text-evergreen-800" />
            <h4 className="font-bold text-base text-evergreen-950">Direct Cash Payout</h4>
            <p className="text-xs text-evergreen-700 leading-relaxed">
              Upon admin proof verification, winnings transition from PENDING to PAID directly to your account.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Bottom Banner */}
      <div className="text-center space-y-4 pt-4">
        <h3 className="text-2xl font-bold text-evergreen-950">Ready to join Fairway Forward?</h3>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-evergreen-950 shadow-md text-sm transition-colors"
        >
          <span>Get Started Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
