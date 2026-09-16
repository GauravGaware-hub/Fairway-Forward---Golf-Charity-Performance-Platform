import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Trophy, Heart, Sparkles, Award, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../../lib/api";

interface Draw {
  id: string;
  month: number;
  year: number;
  status: string;
  winningNumbers: number[];
  publishedAt?: string;
  prizePools?: Array<{
    id: string;
    matchType: string;
    totalAmount: number;
  }>;
}

export const HomePage: React.FC = () => {
  const { data } = useQuery<{ draws: Draw[] }>({
    queryKey: ["publicDraws"],
    queryFn: async () => {
      try {
        const res = await apiFetch("/api/v1/draws");
        return { draws: res.data?.draws || res.draws || res };
      } catch {
        return { draws: [] };
      }
    },
  });

  const latestDraw = data?.draws?.[0];

  return (
    <div className="space-y-16 pb-16">
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden bg-evergreen-950 text-white pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 border-b border-evergreen-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-evergreen-900 border border-evergreen-700 text-xs font-semibold text-amber-400">
              <Sparkles className="w-4 h-4 fill-amber-400" />
              <span>Modern Athletic Charity & Draw Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Your game can make a <span className="text-amber-500 underline decoration-amber-500/40 decoration-wavy">difference.</span>
            </h1>

            <p className="text-lg sm:text-xl text-evergreen-200 font-normal leading-relaxed max-w-2xl">
              Turn your everyday golf Stableford scores into monthly cash prizes while funding verified non-profit partners. Member subscriptions support charitable causes across veterans, youth, and conservation programs.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link
                to="/signup"
                className="px-7 py-3.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-evergreen-950 text-base shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Join Fairway Forward</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/how-it-works"
                className="px-7 py-3.5 rounded-xl font-semibold border border-evergreen-700 hover:bg-evergreen-900 text-white text-base transition-colors flex items-center justify-center gap-2"
              >
                <span>See How It Works</span>
              </Link>
            </div>

            {/* Impact Badges */}
            <div className="pt-8 grid grid-cols-3 gap-4 border-t border-evergreen-800/80">
              <div>
                <div className="text-xl font-extrabold text-white">Verified Grants</div>
                <div className="text-xs text-evergreen-300 font-medium">Non-Profit Partners</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-amber-400">Direct Allocation</div>
                <div className="text-xs text-evergreen-300 font-medium">Member Supported</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-emerald-400">Monthly Draws</div>
                <div className="text-xs text-evergreen-300 font-medium">Deterministic Execution</div>
              </div>
            </div>
          </div>

          {/* Hero Draw Event Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-gradient-to-b from-evergreen-900 to-evergreen-950 p-6 sm:p-8 border border-evergreen-700 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-evergreen-800">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Monthly Draw Event
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  OFFICIAL EVENT
                </span>
              </div>

              <div className="space-y-2 text-center py-4">
                <span className="text-xs text-evergreen-300 uppercase tracking-widest font-semibold">
                  Monthly Cash Draw Pool
                </span>
                <p className="text-sm text-evergreen-200 font-medium pt-1">
                  Prize pools are derived from eligible subscriber revenue and tier allocation rules.
                </p>
              </div>

              {latestDraw && (
                <div className="rounded-xl bg-evergreen-950/80 p-4 border border-evergreen-800 space-y-3">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-evergreen-300">Latest Event</span>
                    <span className="text-white font-bold font-mono">
                      Month {latestDraw.month}/{latestDraw.year}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-evergreen-300">Winning Numbers</span>
                    <span className="text-amber-400 font-bold font-mono">
                      {latestDraw.winningNumbers?.join(" - ") || "Pending"}
                    </span>
                  </div>
                </div>
              )}

              <Link
                to="/signup"
                className="block w-full py-3 text-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-colors"
              >
                Join & Enter Upcoming Monthly Draw &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process Walkthrough */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <h2 className="text-3xl font-extrabold text-evergreen-950 tracking-tight">
            How Fairway Forward Works
          </h2>
          <p className="text-base text-evergreen-700">
            A simple, transparent 3-step platform designed for amateur golfers who want to play with purpose.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-2xl bg-white p-8 border border-evergreen-100 shadow-sm space-y-4 hover:border-amber-400 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 font-black font-mono text-xl flex items-center justify-center">
              01
            </div>
            <h3 className="text-xl font-bold text-evergreen-950">Record Your Scores</h3>
            <p className="text-sm text-evergreen-700 leading-relaxed">
              Submit your genuine 18-hole Stableford scores (1–45 points). Our platform maintains your latest 5 score performance history.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 border border-evergreen-100 shadow-sm space-y-4 hover:border-amber-400 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 font-black font-mono text-xl flex items-center justify-center">
              02
            </div>
            <h3 className="text-xl font-bold text-evergreen-950">Choose Your Charity</h3>
            <p className="text-sm text-evergreen-700 leading-relaxed">
              Select a verified non-profit partner from our directory to receive your allocated subscription contribution.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 border border-evergreen-100 shadow-sm space-y-4 hover:border-amber-400 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-evergreen-800 text-amber-400 font-black font-mono text-xl flex items-center justify-center">
              03
            </div>
            <h3 className="text-xl font-bold text-evergreen-950">Win & Claim Grants</h3>
            <p className="text-sm text-evergreen-700 leading-relaxed">
              Each month, winning numbers are drawn. Match your entry numbers to win cash prizes. Upload your golf app scorecard proof for admin verification.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Charity Impact Categories */}
      <section className="bg-evergreen-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                Impact Areas
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                Verified Non-Profit Partners
              </h2>
            </div>
            <Link
              to="/charities"
              className="text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Explore All Charities</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl bg-evergreen-950 p-6 border border-evergreen-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Military Veterans & Therapy</h3>
              <p className="text-xs text-evergreen-300 leading-relaxed">
                Supporting outdoor rehabilitation and golf therapy programs for active service members and veterans.
              </p>
            </div>

            <div className="rounded-xl bg-evergreen-950 p-6 border border-evergreen-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Youth Junior Athletics</h3>
              <p className="text-xs text-evergreen-300 leading-relaxed">
                Funding junior golf academies, equipment grants, and athletic mentorship for underprivileged youth.
              </p>
            </div>

            <div className="rounded-xl bg-evergreen-950 p-6 border border-evergreen-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Wildlife & Conservation</h3>
              <p className="text-xs text-evergreen-300 leading-relaxed">
                Protecting green spaces, restoring natural parkland ecosystems, and planting native trees alongside open waterways.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Footer Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-evergreen-900 via-evergreen-800 to-evergreen-950 p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 border border-evergreen-700">
          <div className="space-y-3 max-w-xl text-left">
            <h2 className="text-3xl font-extrabold tracking-tight">Ready to play with purpose?</h2>
            <p className="text-sm text-evergreen-200">
              Join Fairway Forward today. Choose your charity partner, log your Stableford scores, and participate in monthly cash draws.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              to="/signup"
              className="px-6 py-3.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-evergreen-950 text-sm shadow-md text-center transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
