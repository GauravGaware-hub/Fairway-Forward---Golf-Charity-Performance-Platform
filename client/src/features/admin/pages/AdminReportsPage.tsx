import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, DollarSign, ShieldCheck } from "lucide-react";
import { apiFetch } from "../../../lib/api";

export const AdminReportsPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: drawsData } = useQuery<{ draws: any[] }>({
    queryKey: ["adminReportsDraws"],
    queryFn: async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await apiFetch("/api/v1/draws");
        return { draws: res.data?.draws || res.draws || [] };
      } catch {
        return { draws: [] };
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: charitiesData } = useQuery<{ charities: any[] }>({
    queryKey: ["adminReportsCharities"],
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

  const draws = drawsData?.draws || [];
  const charities = charitiesData?.charities || [];

  const totalCharityRaised = charities.reduce((acc, c) => acc + (c.totalFundsReceivedDollars || 0), 0);

  return (
    <div className="space-y-8 text-slate-100 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financial & Draw Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">
            Platform revenue breakdown, charity grant allocation logs, and monthly prize payout ledgers.
          </p>
        </div>
      </div>

      {/* Revenue Distribution Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Charity Grant Funds Allocated</span>
            <PieChart className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            ${totalCharityRaised.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">Total grants allocated to partner non-profits</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Prize Pool Ledger</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-400">
            {draws.length} Events
          </div>
          <p className="text-[11px] text-slate-400">Monthly tier allocations & 5-match jackpot rollovers</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Payment Security</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            PCI Compliant
          </div>
          <p className="text-[11px] text-slate-400">Stripe payment gateway integration</p>
        </div>
      </div>

      {/* Draw History Ledger Table with Mobile Scroll */}
      <div className="rounded-2xl bg-slate-950 p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Historical Draw Event Ledger</h3>
        {draws.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No published draws recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold">
                  <th className="py-3 px-3">Draw Period</th>
                  <th className="py-3 px-3">Winning Numbers</th>
                  <th className="py-3 px-3">Published Date</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {draws.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/50">
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      Month {d.month}/{d.year}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-400 font-bold">
                      {d.winningNumbers?.join(" - ") || "Pending"}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {d.publishedAt ? new Date(d.publishedAt).toLocaleDateString() : "Pending"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
