import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Search, Filter, ArrowRight, ShieldCheck } from "lucide-react";

interface Charity {
  id: string;
  name: string;
  category: string;
  description: string;
  websiteUrl: string | null;
  totalFundsReceivedDollars?: number;
  totalAllocations?: number;
}

export const CharityDirectoryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data, isLoading } = useQuery<{ charities: Charity[] }>({
    queryKey: ["charities"],
    queryFn: async () => {
      const res = await fetch("/api/v1/charities");
      if (!res.ok) return { charities: [] };
      return res.json();
    },
  });

  const charities = data?.charities || [];

  const filteredCharities = charities.filter((c) => {
    const matchesCategory =
      selectedCategory === "ALL" || c.category.toUpperCase().includes(selectedCategory);
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-12 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-evergreen-950">
      {/* Directory Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-bold text-xs border border-emerald-500/20">
          <Heart className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
          <span>Verified Non-Profit Network</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Charity Partner Directory
        </h1>
        <p className="text-base text-evergreen-700 leading-relaxed">
          50% of every Fairway Forward subscription goes directly to your selected charity partner. Explore our vetted network of non-profit organizations.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl bg-white p-4 sm:p-6 border border-evergreen-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-evergreen-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search charities or keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-evergreen-200 text-sm bg-chalk focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
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
      ) : filteredCharities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-evergreen-100 space-y-3">
          <Filter className="w-10 h-10 text-evergreen-400 mx-auto" />
          <h3 className="text-lg font-bold text-evergreen-900">No charities found</h3>
          <p className="text-xs text-evergreen-600">Try adjusting your search query or filter settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCharities.map((charity) => (
            <div
              key={charity.id}
              className="rounded-2xl bg-white p-6 border border-evergreen-100 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-evergreen-50 text-evergreen-800 border border-evergreen-200">
                    {charity.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Vetted Partner
                  </span>
                </div>

                <h3 className="text-xl font-bold text-evergreen-950 leading-snug">
                  {charity.name}
                </h3>

                <p className="text-xs text-evergreen-700 leading-relaxed line-clamp-3">
                  {charity.description}
                </p>
              </div>

              <div className="pt-4 border-t border-evergreen-100 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-evergreen-600 font-medium">Total Allocations</span>
                  <span className="font-bold font-mono text-evergreen-950">
                    ${(charity.totalFundsReceivedDollars || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/charities/${charity.id}`}
                    className="flex-1 py-2 text-center rounded-xl bg-chalk hover:bg-evergreen-100 text-evergreen-900 text-xs font-bold transition-colors"
                  >
                    View Details
                  </Link>
                  <Link
                    to="/charity-select"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
                  >
                    <span>Support</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
