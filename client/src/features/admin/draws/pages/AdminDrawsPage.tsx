import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  adminCreateDraw,
  adminFetchDraws,
  adminPublishDraw,
  adminSimulateDraw,
  Draw,
} from '../../../draws/api/drawsApi';

interface SimulationDetails {
  drawId: string;
  month: number;
  year: number;
  winningNumbers: number[];
  eligibleEntriesCount: number;
  matchBreakdown: {
    FIVE: number;
    FOUR: number;
    THREE: number;
  };
  nextJackpotRollover: number;
}

export function AdminDrawsPage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(2026);
  const [strategy, setStrategy] = useState<'RANDOM' | 'SCORE_WEIGHTED'>('RANDOM');
  const [simulationResult, setSimulationResult] = useState<SimulationDetails | null>(null);

  const { data: draws = [], isLoading } = useQuery({
    queryKey: ['adminDraws'],
    queryFn: () => adminFetchDraws(),
  });

  const createMutation = useMutation({
    mutationFn: () => adminCreateDraw({ month, year, strategy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDraws'] });
    },
  });

  const simulateMutation = useMutation({
    mutationFn: (drawId: string) => adminSimulateDraw(drawId),
    onSuccess: (res) => {
      setSimulationResult(res as unknown as SimulationDetails);
      queryClient.invalidateQueries({ queryKey: ['adminDraws'] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (drawId: string) => adminPublishDraw(drawId),
    onSuccess: () => {
      setSimulationResult(null);
      queryClient.invalidateQueries({ queryKey: ['adminDraws'] });
      queryClient.invalidateQueries({ queryKey: ['publicDraws'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Draw Manager</h1>
          <p className="text-muted-foreground mt-1">
            Configure monthly draws, run simulations, inspect candidate results, and publish draws.
          </p>
        </div>

        {/* Create Draw Form */}
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <h2 className="text-lg font-bold">Create New Monthly Draw</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Month (1-12)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Year
              </label>
              <input
                type="number"
                min={2026}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Strategy
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as 'RANDOM' | 'SCORE_WEIGHTED')}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="RANDOM">RANDOM</option>
                <option value="SCORE_WEIGHTED">SCORE_WEIGHTED</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Draft Draw'}
          </button>

          {createMutation.isError && (
            <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {(createMutation.error as Error).message}
            </div>
          )}
        </div>

        {/* Simulation Modal / Preview Panel */}
        {simulationResult && (
          <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-amber-300">
                Simulation Preview (Month {simulationResult.month}/{simulationResult.year})
              </h2>
              <button
                onClick={() => setSimulationResult(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Simulated Winning Numbers:
              </span>
              <div className="flex gap-2 mt-2">
                {simulationResult.winningNumbers.map((num: number) => (
                  <span
                    key={num}
                    className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center"
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-sm space-y-1 text-muted-foreground">
              <p>Eligible Entries: {simulationResult.eligibleEntriesCount}</p>
              <p>5-Match Winners: {simulationResult.matchBreakdown.FIVE}</p>
              <p>4-Match Winners: {simulationResult.matchBreakdown.FOUR}</p>
              <p>3-Match Winners: {simulationResult.matchBreakdown.THREE}</p>
              {simulationResult.nextJackpotRollover > 0 && (
                <p className="text-amber-400 font-semibold">
                  Jackpot Rollover: ₹{(simulationResult.nextJackpotRollover / 100).toFixed(2)}
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => publishMutation.mutate(simulationResult.drawId)}
                disabled={publishMutation.isPending}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors"
              >
                {publishMutation.isPending ? 'Publishing...' : 'Confirm & Publish Draw'}
              </button>
            </div>
          </div>
        )}

        {/* All Draws Table */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-lg font-bold">Existing Draws</h2>
          {draws.length === 0 ? (
            <p className="text-sm text-muted-foreground">No draws created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-xs">
                    <th className="py-3 px-2">Month/Year</th>
                    <th className="py-3 px-2">Strategy</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Winning Numbers</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {draws.map((d: Draw) => (
                    <tr key={d.id}>
                      <td className="py-3 px-2 font-medium">
                        {d.month}/{d.year}
                      </td>
                      <td className="py-3 px-2 text-xs">{d.strategy}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            d.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : d.status === 'SIMULATED'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-xs">
                        {d.winningNumbers.length > 0 ? d.winningNumbers.join(', ') : 'None'}
                      </td>
                      <td className="py-3 px-2 text-right space-x-2">
                        {d.status !== 'PUBLISHED' && (
                          <>
                            <button
                              onClick={() => simulateMutation.mutate(d.id)}
                              disabled={simulateMutation.isPending}
                              className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-xs hover:bg-amber-500/30 transition-colors"
                            >
                              Simulate
                            </button>
                            <button
                              onClick={() => publishMutation.mutate(d.id)}
                              disabled={publishMutation.isPending}
                              className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-semibold text-xs hover:bg-emerald-400 transition-colors"
                            >
                              Publish
                            </button>
                          </>
                        )}
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
  );
}
