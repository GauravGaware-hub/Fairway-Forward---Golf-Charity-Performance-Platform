import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../../lib/api";
import {
  SlidersHorizontal,
  Heart,
  CheckCheck,
  BarChart3,
  ArrowRight,
} from "lucide-react";

export const AdminDashboardPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: winnersData } = useQuery<{ winners: any[] }>({
    queryKey: ["adminWinners"],
    queryFn: async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await apiFetch("/api/v1/admin/winners");
        return { winners: res.data?.winners || res.winners || [] };
      } catch {
        return { winners: [] };
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: charitiesData } = useQuery<{ charities: any[] }>({
    queryKey: ["charities"],
    queryFn: async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await apiFetch("/api/v1/charities");
        return { charities: res.data?.charities || res.charities || [] };
      } catch {
        return { charities: [] };
      }
    },
  });

  const winners = winnersData?.winners || [];
  const charities = charitiesData?.charities || [];
  const pendingProofCount = winners.filter((w) => w.proof?.status === "PENDING").length;

  return (
    <div className="space-y-8 text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Admin Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            System overview for Fairway Forward draws, charity allocations, and winner payout operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono text-emerald-400 font-semibold">ALL SYSTEMS OPERATIONAL</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Pending Winner Proofs</span>
            <CheckCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-400">{pendingProofCount}</div>
          <Link
            to="/admin/winners"
            className="text-[11px] font-bold text-amber-400 hover:underline inline-flex items-center gap-1"
          >
            Review Proof Queue &rarr;
          </Link>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Verified Non-Profits</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">{charities.length}</div>
          <Link
            to="/admin/charities"
            className="text-[11px] font-bold text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            Manage Charity Partners &rarr;
          </Link>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Active Draw Events</span>
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">Monthly Cycle</div>
          <Link
            to="/admin/draws"
            className="text-[11px] font-bold text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            Draw Control Center &rarr;
          </Link>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Financial Ledgers</span>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">50% Charity / 30% Pool</div>
          <Link
            to="/admin/reports"
            className="text-[11px] font-bold text-indigo-400 hover:underline inline-flex items-center gap-1"
          >
            View Platform Analytics &rarr;
          </Link>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/draws"
          className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
              Draw Management & Strategy Control
            </h3>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Create new monthly draw events, execute Monte Carlo draw simulations, and release official winning numbers to the platform.
          </p>
        </Link>

        <Link
          to="/admin/winners"
          className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
              Winner Verification & Cash Payouts
            </h3>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 group-hover:text-amber-400 transition-all" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Inspect golf platform score proof screenshots side-by-side, approve/reject winner claims, and trigger direct cash payout transitions.
          </p>
        </Link>
      </div>
    </div>
  );
};
