import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, CheckCircle2, Search, AlertCircle, ArrowRight, Building2 } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { apiFetch, ApiError } from "../../../lib/api";

interface Charity {
  id: string;
  name: string;
  category?: string;
  description: string;
  websiteUrl: string | null;
  imageUrl?: string | null;
  isFeatured?: boolean;
}

const CharityLogo: React.FC<{ imageUrl?: string | null; name: string }> = ({ imageUrl, name }) => {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
        <Building2 className="w-5 h-5 text-emerald-600" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      onError={() => setHasError(true)}
      className="w-10 h-10 rounded-lg object-cover border border-evergreen-200 bg-chalk shrink-0"
    />
  );
};

export const CharitySelectPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [subRequiredError, setSubRequiredError] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ charities: Charity[] }>({
    queryKey: ["charities"],
    queryFn: async () => {
      const res = await apiFetch("/api/v1/charities");
      return res.data || res;
    },
  });

  const selectCharityMutation = useMutation({
    mutationFn: async (charityId: string) => {
      setSubRequiredError(false);
      return apiFetch("/api/v1/me/charity", {
        method: "PUT",
        body: JSON.stringify({
          charityId,
          contributionPercentage: 50,
        }),
      });
    },
    onSuccess: async () => {
      setFeedbackMsg("Charity partner selected successfully!");
      if (refreshUser) await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["charities"] });
      queryClient.invalidateQueries({ queryKey: ["authMe"] });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.status === 403) {
        setSubRequiredError(true);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFeedbackMsg((err as any)?.message || "Failed to select charity.");
      }
    },
  });

  const charities = data?.charities || [];
  const activeCharityId = user?.selectedCharityId || user?.selectedCharity?.id;

  const filteredCharities = charities.filter((c) => {
    const categoryText = c.category || (c.isFeatured ? "FEATURED" : "VERIFIED");
    const matchesCategory =
      selectedCategory === "ALL" || categoryText.toUpperCase().includes(selectedCategory);
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-evergreen-950">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
          <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
          <span>Charity Impact Partner Selection</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Choose Your Charity Partner</h1>
        <p className="text-sm text-evergreen-700">
          Select the verified non-profit organization to support with your active membership subscription.
        </p>
      </div>

      {subRequiredError && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-300 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Subscription Required</span>
          </div>
          <p className="text-xs text-amber-800">
            Activate your membership subscription to select a charity partner and allocate contributions.
          </p>
          <Link
            to="/subscription"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-colors"
          >
            <span>Activate Subscription</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {feedbackMsg && !subRequiredError && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="rounded-2xl bg-white p-4 sm:p-6 border border-evergreen-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-evergreen-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search charity partner..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-evergreen-200 text-sm bg-chalk focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {["ALL", "VETERANS", "YOUTH", "CONSERVATION"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-evergreen-800 text-white shadow-sm"
                  : "bg-chalk text-evergreen-700 hover:bg-evergreen-100"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Charities Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-chalk animate-pulse border border-evergreen-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharities.map((charity) => {
            const isSelected = activeCharityId === charity.id;
            const displayCategory =
              charity.category ||
              (charity.isFeatured ? "Featured Partner" : "Verified Charity");
            const isThisCharityPending =
              selectCharityMutation.isPending &&
              selectCharityMutation.variables === charity.id;

            return (
              <div
                key={charity.id}
                className={`rounded-2xl p-6 border transition-all flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? "bg-emerald-50/50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                    : "bg-white border-evergreen-100 hover:border-evergreen-300 shadow-sm"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <CharityLogo imageUrl={charity.imageUrl} name={charity.name} />
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-evergreen-50 text-evergreen-800 border border-evergreen-200 truncate">
                        {displayCategory}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SELECTED
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-evergreen-950">{charity.name}</h3>
                  <p className="text-xs text-evergreen-700 leading-relaxed line-clamp-3">
                    {charity.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-evergreen-100">
                  <button
                    onClick={() => selectCharityMutation.mutate(charity.id)}
                    disabled={isSelected || selectCharityMutation.isPending}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? "bg-emerald-700 text-white cursor-default"
                        : "bg-evergreen-800 hover:bg-evergreen-700 text-white shadow-sm"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Active Charity Partner
                      </>
                    ) : isThisCharityPending ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <span>Select This Charity</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
