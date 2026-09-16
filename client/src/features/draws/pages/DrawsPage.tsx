import { useQuery } from "@tanstack/react-query";
import { fetchPublicDraws, fetchUserWinnings } from "../api/drawsApi";
import { Trophy, Calendar, Award } from "lucide-react";

export function DrawsPage() {
  const {
    data: draws = [],
    isLoading: isDrawsLoading,
    isError: isDrawsError,
    error: drawsError,
  } = useQuery({
    queryKey: ["publicDraws"],
    queryFn: () => fetchPublicDraws(),
  });

  const { data: winnings = [] } = useQuery({
    queryKey: ["myWinnings"],
    queryFn: () => fetchUserWinnings(),
    retry: false,
  });

  if (isDrawsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isDrawsError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          <p className="font-bold">Error Loading Draw Results</p>
          <p className="mt-1">{(drawsError as Error).message}</p>
        </div>
      </div>
    );
  }

  const latestDraw = draws[0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-evergreen-950">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 font-bold text-xs border border-amber-500/20">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>Monthly Cash Draw Archive</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Monthly Draws & Jackpot Winners</h1>
        <p className="text-sm text-evergreen-700">
          Inspect official published winning numbers, tier allocations, and your personal winning record.
        </p>
      </div>

      {/* User Personal Winnings Banner */}
      {winnings.length > 0 && (
        <div className="p-6 rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-950 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-900">
            <Award className="w-5 h-5 text-emerald-600" /> 🎉 Your Active Winning Draw Records
          </h2>
          <div className="grid gap-2">
            {winnings.map((w) => (
              <div
                key={w.id}
                className="flex justify-between items-center text-xs p-3 rounded-xl bg-white border border-emerald-200"
              >
                <div>
                  <span className="font-bold text-evergreen-950">
                    Draw Event {w.draw?.month}/{w.draw?.year}
                  </span>
                  <span className="ml-2 text-evergreen-600">
                    ({w.matchType}-Number Match)
                  </span>
                </div>
                <span className="font-bold font-mono text-emerald-700 text-sm">
                  ${(w.prizeAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Published Draw Event Card */}
      {latestDraw ? (
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-evergreen-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-evergreen-100 pb-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                Latest Published Draw
              </span>
              <h2 className="text-2xl font-extrabold text-evergreen-950 mt-1">
                Month {latestDraw.month}, {latestDraw.year}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-evergreen-600 font-medium">
              <Calendar className="w-4 h-4 text-evergreen-400" />
              <span>
                Published {latestDraw.publishedAt ? new Date(latestDraw.publishedAt).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-evergreen-600 uppercase tracking-wider">
              Official Winning Numbers (1 – 45)
            </h3>
            <div className="flex gap-3 flex-wrap">
              {latestDraw.winningNumbers.map((num) => (
                <div
                  key={num}
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-evergreen-900 border-2 border-evergreen-700 text-amber-400 font-black font-mono text-xl flex items-center justify-center shadow-lg"
                >
                  {num}
                </div>
              ))}
            </div>
          </div>

          {/* Tier Prize Allocations */}
          {latestDraw.prizePools && latestDraw.prizePools.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-evergreen-600 uppercase tracking-wider">
                Prize Allocations By Tier
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {latestDraw.prizePools.map((pool) => (
                  <div key={pool.id} className="p-4 rounded-xl bg-chalk border border-evergreen-200 space-y-1">
                    <div className="text-[11px] font-bold text-evergreen-700 uppercase tracking-wider">
                      {pool.matchType}-NUMBER MATCH ({pool.percentage}%)
                    </div>
                    <div className="text-2xl font-black font-mono text-evergreen-950">
                      ${(pool.totalAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    {pool.rolloverAmount > 0 && (
                      <div className="text-[10px] font-semibold text-amber-600">
                        Includes ${(pool.rolloverAmount / 100).toLocaleString()} rollover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-white border border-dashed border-evergreen-200 text-center text-evergreen-600">
          No published draws available yet. Check back soon for the next monthly draw release!
        </div>
      )}

      {/* Previous Draws List */}
      {draws.length > 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-evergreen-950">Past Draw Events</h2>
          <div className="grid gap-3">
            {draws.slice(1).map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-2xl bg-white border border-evergreen-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-evergreen-950 text-base">
                    Draw Month {d.month}/{d.year}
                  </div>
                  <div className="text-xs font-mono font-semibold text-evergreen-700 mt-0.5">
                    Winning Numbers: {d.winningNumbers.join(", ")}
                  </div>
                </div>
                <div className="text-xs text-evergreen-500 font-medium">
                  {d.publishedAt ? new Date(d.publishedAt).toLocaleDateString() : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

