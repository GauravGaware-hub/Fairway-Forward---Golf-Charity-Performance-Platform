import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  adminApproveWinnerProof,
  adminFetchWinners,
  adminMarkWinnerPaid,
  adminRejectWinnerProof,
  DetailedWinner,
} from '../../../payouts/api/payoutsApi';

export function AdminWinnersPage() {
  const queryClient = useQueryClient();
  const [rejectWinnerId, setRejectWinnerId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [markPaidWinnerId, setMarkPaidWinnerId] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: winners = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['adminWinners'],
    queryFn: () => adminFetchWinners(),
  });

  const approveMutation = useMutation({
    mutationFn: (winnerId: string) => adminApproveWinnerProof(winnerId),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['adminWinners'] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminRejectWinnerProof(rejectWinnerId!, rejectionReason),
    onSuccess: () => {
      setRejectWinnerId(null);
      setRejectionReason('');
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['adminWinners'] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const markPaidMutation = useMutation({
    mutationFn: () => adminMarkWinnerPaid(markPaidWinnerId!, paymentReference),
    onSuccess: () => {
      setMarkPaidWinnerId(null);
      setPaymentReference('');
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['adminWinners'] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background text-foreground">
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm max-w-md text-center">
          <p className="font-semibold">Error Loading Winners</p>
          <p className="mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Winner Verification & Payouts</h1>
          <p className="text-muted-foreground mt-1">
            Review uploaded proof screenshots, approve/reject verification, and track payout state.
          </p>
        </div>

        {actionError && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium">
            {actionError}
          </div>
        )}

        {/* Reject Dialog */}
        {rejectWinnerId && (
          <div className="p-6 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-4 max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-rose-300">Reject Proof Submission</h2>
            <div>
              <label className="block text-xs font-semibold uppercase text-rose-200 mb-1">
                Rejection Reason (Required)
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why the proof image was rejected (e.g. illegible score, wrong date)..."
                className="w-full px-3 py-2 rounded-lg border border-rose-500/30 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setRejectWinnerId(null);
                  setRejectionReason('');
                }}
                className="px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                className="px-4 py-1.5 rounded bg-rose-500 text-white font-semibold text-xs hover:bg-rose-400 disabled:opacity-50 transition-colors"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        )}

        {/* Mark Paid Dialog */}
        {markPaidWinnerId && (
          <div className="p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-4 max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-emerald-300">Mark Payout as Paid</h2>
            <div>
              <label className="block text-xs font-semibold uppercase text-emerald-200 mb-1">
                Payment Reference / Transaction ID (Optional)
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. TXN12345678"
                className="w-full px-3 py-2 rounded-lg border border-emerald-500/30 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setMarkPaidWinnerId(null);
                  setPaymentReference('');
                }}
                className="px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => markPaidMutation.mutate()}
                disabled={markPaidMutation.isPending}
                className="px-4 py-1.5 rounded bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
              >
                {markPaidMutation.isPending ? 'Processing...' : 'Confirm Paid'}
              </button>
            </div>
          </div>
        )}

        {/* Winner List Table */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-lg font-bold">All Winner Records</h2>
          {winners.length === 0 ? (
            <p className="text-sm text-muted-foreground">No winners found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-xs">
                    <th className="py-3 px-2">User</th>
                    <th className="py-3 px-2">Draw</th>
                    <th className="py-3 px-2">Tier</th>
                    <th className="py-3 px-2">Prize Amount</th>
                    <th className="py-3 px-2">Proof Status</th>
                    <th className="py-3 px-2">Payout Status</th>
                    <th className="py-3 px-2">Proof Image</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {winners.map((w: DetailedWinner) => {
                    const proofStatus = w.proof?.status || 'NOT_SUBMITTED';
                    const payoutStatus = w.payout?.status || 'PENDING';

                    return (
                      <tr key={w.id}>
                        <td className="py-3 px-2 font-medium">
                          {w.user?.email}
                        </td>
                        <td className="py-3 px-2 text-xs">
                          {w.draw?.month}/{w.draw?.year}
                        </td>
                        <td className="py-3 px-2 text-xs font-semibold">
                          {w.matchType}
                        </td>
                        <td className="py-3 px-2 font-bold text-emerald-400">
                          ${(w.prizeAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              proofStatus === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : proofStatus === 'REJECTED'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : proofStatus === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}
                          >
                            {proofStatus}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              payoutStatus === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}
                          >
                            {payoutStatus}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs">
                          {w.proof?.signedProofUrl ? (
                            <a
                              href={w.proof.signedProofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:underline font-medium"
                            >
                              View Proof ↗
                            </a>
                          ) : (
                            <span className="text-muted-foreground">No File</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right space-x-1">
                          {proofStatus === 'PENDING' && (
                            <>
                              <button
                                onClick={() => approveMutation.mutate(w.id)}
                                disabled={approveMutation.isPending}
                                className="px-2 py-1 rounded bg-emerald-500 text-slate-950 text-xs font-semibold hover:bg-emerald-400 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectWinnerId(w.id)}
                                className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {proofStatus === 'APPROVED' && payoutStatus === 'PENDING' && (
                            <button
                              onClick={() => setMarkPaidWinnerId(w.id)}
                              className="px-2.5 py-1 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
