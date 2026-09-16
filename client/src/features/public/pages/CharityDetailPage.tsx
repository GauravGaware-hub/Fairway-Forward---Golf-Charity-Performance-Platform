import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ArrowLeft, ExternalLink, ArrowRight } from "lucide-react";
import { apiFetch } from "../../../lib/api";

interface Charity {
  id: string;
  name: string;
  category: string;
  description: string;
  websiteUrl: string | null;
  totalFundsReceivedDollars?: number;
}

export const CharityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery<{ charity: Charity }>({
    queryKey: ["charity", id],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await apiFetch(`/api/v1/charities/${id}`);
      const charity = res.data?.charity || res.charity || res;
      if (!charity) throw new Error("Charity not found");
      return { charity };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin mx-auto" />
        <p className="mt-4 text-xs text-evergreen-600 font-medium">Loading charity profile...</p>
      </div>
    );
  }

  if (isError || !data?.charity) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-2xl font-bold text-evergreen-950">Charity Profile Not Found</h2>
        <Link to="/charities" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Charity Directory
        </Link>
      </div>
    );
  }

  const charity = data.charity;

  return (
    <div className="space-y-12 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-evergreen-950">
      <Link
        to="/charities"
        className="inline-flex items-center gap-2 text-xs font-bold text-evergreen-700 hover:text-evergreen-950 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </Link>

      <div className="rounded-3xl bg-white p-8 sm:p-12 border border-evergreen-100 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-evergreen-100">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
              {charity.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-evergreen-950">{charity.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">Verified Partner</span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-evergreen-950">Mission Statement & Overview</h3>
          <p className="text-sm text-evergreen-700 leading-relaxed whitespace-pre-line">
            {charity.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-chalk border border-evergreen-200">
          <div className="space-y-1">
            <span className="text-xs text-evergreen-600 font-semibold uppercase tracking-wider">
              Total Direct Platform Grants Received
            </span>
            <div className="text-3xl font-extrabold font-mono text-evergreen-950">
              ${(charity.totalFundsReceivedDollars || 0).toLocaleString()}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-evergreen-600 font-semibold uppercase tracking-wider">
              Allocation Percentage
            </span>
            <div className="text-3xl font-extrabold font-mono text-emerald-600">
              50% Subscription Net
            </div>
          </div>
        </div>

        {charity.websiteUrl && (
          <div className="pt-2">
            <a
              href={charity.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              <span>Visit Official Charity Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        <div className="pt-6 border-t border-evergreen-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-evergreen-600">
            Selecting this charity allocates 50% of your active Fairway Forward subscription directly to their cause.
          </p>
          <Link
            to="/charity-select"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Select This Charity</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
