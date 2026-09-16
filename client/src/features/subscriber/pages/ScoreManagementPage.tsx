import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, PlusCircle, CheckCircle2, AlertCircle, Calendar, Flag, ArrowRight } from "lucide-react";
import { apiFetch, ApiError } from "../../../lib/api";

interface Score {
  id: string;
  stablefordScore: number;
  playedAt: string;
  courseName?: string;
}

export const ScoreManagementPage: React.FC = () => {
  const [stablefordScore, setStablefordScore] = useState<number | "">("");
  const [courseName, setCourseName] = useState("");
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split("T")[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [subRequiredError, setSubRequiredError] = useState(false);

  const queryClient = useQueryClient();

  const { data: scoresData, isLoading: scoresLoading } = useQuery<{ scores: Score[] }>({
    queryKey: ["userScores"],
    queryFn: async () => {
      try {
        const res = await apiFetch("/api/v1/scores");
        const scoresList = res.data?.scores || res.scores || res;
        return { scores: Array.isArray(scoresList) ? scoresList : [] };
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 403) {
          setSubRequiredError(true);
        }
        return { scores: [] };
      }
    },
  });

  const submitScoreMutation = useMutation({
    mutationFn: async (payload: { stablefordScore: number; playedAt: string; courseName?: string }) => {
      setSubRequiredError(false);
      return apiFetch("/api/v1/scores", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setSuccessMsg("Stableford score recorded successfully!");
      setStablefordScore("");
      setCourseName("");
      queryClient.invalidateQueries({ queryKey: ["userScores"] });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.status === 403) {
        setSubRequiredError(true);
      } else {
        setErrorMsg(err instanceof Error ? err.message : "Failed to record score. Please enter a valid 1–45 Stableford score.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const scoreNum = Number(stablefordScore);
    if (!scoreNum || scoreNum < 1 || scoreNum > 45) {
      setErrorMsg("Stableford score must be a valid integer between 1 and 45.");
      return;
    }

    submitScoreMutation.mutate({
      stablefordScore: scoreNum,
      playedAt,
      courseName: courseName.trim() || undefined,
    });
  };

  const scores = scoresData?.scores || [];
  const latestFive = scores.slice(0, 5);

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-evergreen-950">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Score Management</h1>
        <p className="text-sm text-evergreen-700">
          Submit your genuine 18-hole Stableford scores (1–45 points). Your latest 5 scores form your performance record.
        </p>
      </div>

      {subRequiredError && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-300 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Subscription Active Required</span>
          </div>
          <p className="text-xs text-amber-800">
            You must have an active membership subscription to submit and manage golf scores.
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

      {/* Latest 5 Score Summary Card */}
      <div className="rounded-2xl bg-evergreen-950 text-white p-6 border border-evergreen-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-evergreen-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Latest 5 Stableford Scores
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            STABLEFORD (1–45 RANGE)
          </span>
        </div>

        {latestFive.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 py-1">
            {latestFive.map((s, i) => (
              <div
                key={s.id || i}
                className="w-12 h-12 rounded-2xl bg-evergreen-900 border-2 border-evergreen-700 text-amber-400 font-extrabold font-mono text-base flex items-center justify-center shadow-md"
              >
                {s.stablefordScore}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-evergreen-300">
            Submit your 18-hole Stableford scores to build your 5-score performance record. Currently {scores.length}/5 available.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Score Submission Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-white p-6 border border-evergreen-100 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-evergreen-100 pb-3">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-evergreen-950">Record Stableford Score</h3>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-evergreen-900 uppercase tracking-wider">
                  Stableford Score (1 – 45)
                </label>
                <div className="relative">
                  <Target className="w-4 h-4 text-evergreen-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={1}
                    max={45}
                    required
                    value={stablefordScore}
                    onChange={(e) => setStablefordScore(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 36"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-evergreen-200 text-sm bg-chalk focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono font-bold transition-all"
                  />
                </div>
                <p className="text-[10px] text-evergreen-600">Standard 18-hole Stableford points total.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-evergreen-900 uppercase tracking-wider">
                  Golf Course Name (Optional)
                </label>
                <div className="relative">
                  <Flag className="w-4 h-4 text-evergreen-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g. Pebble Beach Golf Links"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-evergreen-200 text-sm bg-chalk focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-evergreen-900 uppercase tracking-wider">
                  Date Played
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-evergreen-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={playedAt}
                    onChange={(e) => setPlayedAt(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-evergreen-200 text-sm bg-chalk focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitScoreMutation.isPending}
                className="w-full py-3 rounded-xl bg-evergreen-800 hover:bg-evergreen-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitScoreMutation.isPending ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <span>Record Score</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Historical Scores Table with Mobile Scroll Container */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl bg-white p-6 border border-evergreen-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-evergreen-950">Submitted Score History</h3>

            {scoresLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-12 rounded-xl bg-chalk animate-pulse" />
                ))}
              </div>
            ) : scores.length === 0 ? (
              <p className="text-xs text-evergreen-600 italic py-6 text-center">No scores recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[400px]">
                  <thead>
                    <tr className="border-b border-evergreen-100 text-evergreen-600 uppercase font-bold tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Course</th>
                      <th className="py-2.5 px-3 text-right">Stableford Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-evergreen-100">
                    {scores.map((score) => (
                      <tr key={score.id} className="hover:bg-chalk transition-colors">
                        <td className="py-3 px-3 font-medium text-evergreen-900">
                          {new Date(score.playedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-evergreen-700">
                          {score.courseName || "Standard 18-Hole Round"}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-evergreen-950 text-sm">
                          {score.stablefordScore} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
