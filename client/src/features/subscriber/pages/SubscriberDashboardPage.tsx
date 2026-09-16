import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Target,
  Heart,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { useSubscriptionStatus } from "../../../hooks/useSubscriptionStatus";
import { useAuth } from "../../../hooks/useAuth";
import { apiFetch } from "../../../lib/api";

interface Score {
  id: string;
  stablefordScore: number;
  playedAt: string;
  courseName?: string;
}

interface Draw {
  id: string;
  month: number;
  year: number;
  status: string;
  winningNumbers: number[];
  publishedAt?: string;
}

export const SubscriberDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: subData } = useSubscriptionStatus();

  const { data: scoresData, isLoading: scoresLoading } = useQuery<{ scores: Score[] }>({
    queryKey: ["userScores"],
    queryFn: async () => {
      try {
        const res = await apiFetch("/api/v1/scores");
        const scoresList = res.data?.scores || res.scores || res;
        return { scores: Array.isArray(scoresList) ? scoresList : [] };
      } catch {
        return { scores: [] };
      }
    },
  });

  const { data: drawsData } = useQuery<{ draws: Draw[] }>({
    queryKey: ["publicDraws"],
    queryFn: async () => {
      try {
        const res = await apiFetch("/api/v1/draws");
        const drawsList = res.data?.draws || res.draws || res;
        return { draws: Array.isArray(drawsList) ? drawsList : [] };
      } catch {
        return { draws: [] };
      }
    },
  });

  const isSubActive = subData?.hasActiveSubscription;
  const scores = scoresData?.scores || [];
  const latestScores = scores.slice(0, 5);
  const draws = drawsData?.draws || [];
  const latestDraw = draws[0];

  return (
    <div className="space-y-8">
      {/* Welcome & Subscription Status Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-evergreen-900 via-evergreen-800 to-evergreen-950 p-6 sm:p-8 text-white shadow-lg border border-evergreen-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Sparkles className="w-4 h-4 fill-amber-400" />
            <span>Subscriber Performance Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName || "Member Player"}
          </h1>
          <p className="text-xs sm:text-sm text-evergreen-200">
            {isSubActive
              ? "Your subscription is active and contributions support your chosen charity partner."
              : "Activate your membership subscription to log scores and participate in monthly cash draws."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSubActive ? (
            <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ACTIVE SUBSCRIBER</span>
            </div>
          ) : (
            <Link
              to="/subscription"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-evergreen-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" /> Activate Membership
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Entry Scores & Draw Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Rolling Scores */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl bg-white p-6 border border-evergreen-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-evergreen-950">Rolling 5 Performance Record</h3>
              </div>
              <span className="text-[11px] font-mono font-semibold text-evergreen-600 bg-chalk px-2.5 py-1 rounded-md">
                STABLEFORD 1 – 45
              </span>
            </div>

            <p className="text-xs text-evergreen-700 leading-relaxed">
              Your latest 5 Stableford scores form your active performance history.
            </p>

            {scoresLoading ? (
              <div className="flex gap-3 justify-center py-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="w-12 h-12 rounded-full bg-chalk animate-pulse" />
                ))}
              </div>
            ) : latestScores.length > 0 ? (
              <div className="flex flex-wrap gap-3 justify-between pt-2">
                {latestScores.map((score, idx) => (
                  <div
                    key={score.id || idx}
                    className="w-12 h-12 rounded-2xl bg-evergreen-900 border-2 border-evergreen-700 text-amber-400 font-extrabold font-mono text-base flex items-center justify-center shadow-md"
                  >
                    {score.stablefordScore}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-chalk text-center space-y-3 border border-dashed border-evergreen-200">
                <p className="text-xs text-evergreen-700 font-medium">
                  No Stableford scores logged yet. Submit your 18-hole scores to build your 5-score record.
                </p>
                <Link
                  to="/scores"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-evergreen-800 text-white text-xs font-bold hover:bg-evergreen-700 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" /> Submit Score
                </Link>
              </div>
            )}
          </div>

          {/* Recent Score List */}
          <div className="rounded-2xl bg-white p-6 border border-evergreen-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-evergreen-950">Recent Score Submissions</h3>
              <Link to="/scores" className="text-xs font-bold text-emerald-600 hover:underline">
                View Full Score History &rarr;
              </Link>
            </div>

            {latestScores.length === 0 ? (
              <p className="text-xs text-evergreen-600 italic py-2">No scores logged yet.</p>
            ) : (
              <div className="space-y-2">
                {latestScores.map((score, i) => (
                  <div
                    key={score.id || i}
                    className="p-3 rounded-xl bg-chalk border border-evergreen-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-evergreen-800 text-white font-mono font-bold text-[10px] flex items-center justify-center">
                        #{i + 1}
                      </span>
                      <div>
                        <div className="font-bold text-evergreen-950">
                          {score.courseName || "Standard 18-Hole Round"}
                        </div>
                        <div className="text-[10px] text-evergreen-500">
                          {new Date(score.playedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-black text-sm text-evergreen-900 bg-white px-3 py-1 rounded-lg border border-evergreen-200">
                      {score.stablefordScore} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Draw & Charity */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-gradient-to-b from-evergreen-900 to-evergreen-950 p-6 text-white border border-evergreen-700 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-evergreen-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Monthly Draw Event
                </span>
              </div>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-1 text-center">
              <span className="text-[11px] text-evergreen-300 uppercase tracking-widest font-semibold">
                Prize Pool Allocation
              </span>
              <p className="text-xs text-amber-300 font-medium pt-1">
                Calculated dynamically from active subscription revenue & rollover rules
              </p>
            </div>

            {latestDraw && (
              <div className="p-3.5 rounded-xl bg-evergreen-950/90 border border-evergreen-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-evergreen-300">Latest Event</span>
                  <span className="font-bold text-white font-mono">
                    Month {latestDraw.month}/{latestDraw.year}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-evergreen-300">Winning Numbers</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {latestDraw.winningNumbers?.join(" - ") || "Pending"}
                  </span>
                </div>
              </div>
            )}

            <Link
              to="/draws"
              className="block w-full py-2.5 text-center rounded-xl bg-amber-500 hover:bg-amber-400 text-evergreen-950 font-bold text-xs shadow-sm transition-colors"
            >
              View Full Draw Archive & Winning Numbers
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-evergreen-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h3 className="text-base font-bold text-evergreen-950">Active Charity Partner</h3>
              </div>
              <Link to="/charity-select" className="text-xs font-bold text-emerald-600 hover:underline">
                Change &rarr;
              </Link>
            </div>

            <div className="p-4 rounded-xl bg-chalk border border-evergreen-200 space-y-2">
              <h4 className="font-bold text-sm text-evergreen-950">
                {user?.selectedCharity?.name || "No Charity Partner Selected"}
              </h4>
              <p className="text-xs text-evergreen-700 leading-relaxed line-clamp-2">
                {user?.selectedCharity?.description ||
                  "Select a non-profit partner to allocate your membership contribution."}
              </p>
            </div>

            <Link
              to="/charity-select"
              className="block w-full py-2 text-center rounded-xl bg-chalk hover:bg-evergreen-100 text-evergreen-900 text-xs font-bold transition-colors"
            >
              Browse & Select Charity Partner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
