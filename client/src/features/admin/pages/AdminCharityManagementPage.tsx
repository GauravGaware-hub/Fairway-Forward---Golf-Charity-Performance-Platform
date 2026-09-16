import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../lib/api";
import { Plus, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

interface Charity {
  id: string;
  name: string;
  category: string;
  description: string;
  websiteUrl: string | null;
  totalFundsReceivedDollars?: number;
}

export const AdminCharityManagementPage: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("VETERANS");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ charities: Charity[] }>({
    queryKey: ["adminCharities"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await apiFetch("/api/v1/charities");
      return res.data || res;
    },
  });

  const createCharityMutation = useMutation({
    mutationFn: async (payload: { name: string; description: string; websiteUrl?: string; category?: string }) => {
      return apiFetch("/api/v1/admin/charities", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setFeedbackMsg("New non-profit partner added to Fairway Forward network!");
      setIsAdding(false);
      setName("");
      setDescription("");
      setWebsiteUrl("");
      queryClient.invalidateQueries({ queryKey: ["adminCharities"] });
    },
    onError: (err: unknown) => {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create charity partner.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFeedbackMsg(null);

    createCharityMutation.mutate({
      name,
      category,
      description,
      websiteUrl: websiteUrl.trim() || undefined,
    });
  };

  const charities = data?.charities || [];

  return (
    <div className="space-y-8 text-slate-100 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Charity Partner Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Add and manage non-profit organizations eligible for 50% subscriber donation allocations.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? "Cancel Form" : "Add New Partner"}</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="rounded-2xl bg-slate-950 p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">
            Create Charity Partner Profile
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase">Charity Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Golf for Heroes Foundation"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase">Impact Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="VETERANS">Veterans & Therapy</option>
                  <option value="YOUTH">Youth Sports & Athletics</option>
                  <option value="CONSERVATION">Wildlife & Conservation</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase">Mission Description</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Overview of mission statement and program goals..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase">Official Website URL (Optional)</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.org"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={createCharityMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
            >
              {createCharityMutation.isPending ? "Creating..." : "Save Partner Profile"}
            </button>
          </form>
        </div>
      )}

      {/* Existing Charities Table */}
      <div className="rounded-2xl bg-slate-950 p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Active Partner Directory</h3>
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading charity network...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold">
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Website</th>
                  <th className="py-3 px-3 text-right">Total Allocations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {charities.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/50">
                    <td className="py-3 px-3 font-bold text-white">{c.name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-emerald-400 border border-slate-700">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {c.websiteUrl ? (
                        <a
                          href={c.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-emerald-400 inline-flex items-center gap-1"
                        >
                          <span>Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                      ${(c.totalFundsReceivedDollars || 0).toLocaleString()}
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
