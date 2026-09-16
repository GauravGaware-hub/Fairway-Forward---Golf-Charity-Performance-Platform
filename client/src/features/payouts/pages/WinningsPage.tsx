import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DetailedWinner, fetchMyWinnings, submitWinnerProofApi } from "../api/payoutsApi";
import { Trophy, Upload, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

export function WinningsPage() {
  const queryClient = useQueryClient();
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    data: winnings = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["myWinningsDetails"],
    queryFn: () => fetchMyWinnings(),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ winnerId, file }: { winnerId: string; file: File }) => {
      setUploadError(null);
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size exceeds 5MB limit.");
      }

      const mimeType = file.type;
      if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(mimeType.toLowerCase())) {
        throw new Error("Allowed formats: PNG, JPEG, JPG, WEBP.");
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
      });
      reader.readAsDataURL(file);

      const proofImage = await base64Promise;
      return submitWinnerProofApi(winnerId, proofImage, mimeType);
    },
    onSuccess: () => {
      setSelectedWinnerId(null);
      queryClient.invalidateQueries({ queryKey: ["myWinningsDetails"] });
    },
    onError: (err: Error) => {
      setUploadError(err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          <p className="font-bold">Error Loading Winnings</p>
          <p className="mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const totalPrizeMinor = winnings.reduce((acc, w) => acc + w.prizeAmount, 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-evergreen-950">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-bold text-xs border border-emerald-500/20">
          <Trophy className="w-3.5 h-3.5 text-emerald-600" />
          <span>Member Winnings & Verification Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Your Golf Draw Winnings</h1>
        <p className="text-sm text-evergreen-700">
          Submit official golf platform scorecard screenshots for verification and track your cash payout status.
        </p>
      </div>

      {/* Career Summary Banner */}
      <div className="rounded-3xl bg-evergreen-950 text-white p-6 sm:p-8 border border-evergreen-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-evergreen-300 uppercase tracking-wider">
            Total Prize Money Earned
          </div>
          <div className="text-4xl font-black font-mono text-amber-400">
            ${(totalPrizeMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
          {winnings.length} {winnings.length === 1 ? "Winning Draw Record" : "Winning Draw Records"}
        </div>
      </div>

      {/* Winnings Cards List */}
      {winnings.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-dashed border-evergreen-200 text-center text-evergreen-600 space-y-2">
          <FileText className="w-8 h-8 text-evergreen-400 mx-auto" />
          <h3 className="text-base font-bold text-evergreen-900">No Winnings Records Found</h3>
          <p className="text-xs text-evergreen-600">
            Keep logging your 18-hole Stableford scores to participate in upcoming monthly draws.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {winnings.map((w: DetailedWinner) => {
            const proofStatus = w.proof?.status || "NOT_SUBMITTED";
            const payoutStatus = w.payout?.status || "PENDING";

            return (
              <div
                key={w.id}
                className="rounded-3xl bg-white p-6 sm:p-8 border border-evergreen-100 shadow-sm space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-evergreen-100 pb-4">
                  <div>
                    <span className="text-[11px] font-bold text-evergreen-600 uppercase tracking-wider">
                      Draw Month {w.draw?.month}/{w.draw?.year}
                    </span>
                    <h2 className="text-2xl font-black font-mono text-evergreen-950 mt-0.5">
                      ${(w.prizeAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                      <span className="text-sm font-sans font-bold text-emerald-700">
                        ({w.matchType}-Number Match)
                      </span>
                    </h2>
                  </div>

                  <div className="flex gap-2 flex-wrap text-xs">
                    <span
                      className={`px-3 py-1 rounded-full font-bold border ${
                        proofStatus === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : proofStatus === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : proofStatus === "PENDING"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-chalk text-evergreen-700 border-evergreen-200"
                      }`}
                    >
                      Proof: {proofStatus === "NOT_SUBMITTED" ? "NEEDS PROOF" : proofStatus}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full font-bold border ${
                        payoutStatus === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-chalk text-evergreen-700 border-evergreen-200"
                      }`}
                    >
                      Payout: {payoutStatus}
                    </span>
                  </div>
                </div>

                {/* Rejection Alert */}
                {proofStatus === "REJECTED" && w.proof?.rejectionReason && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-rose-900">
                      <AlertTriangle className="w-4 h-4 text-rose-600" /> Proof Screenshot Rejected
                    </p>
                    <p>{w.proof.rejectionReason}</p>
                    <p className="text-[11px] text-rose-700 font-medium pt-1">
                      Please upload a clear screenshot of your official golf scorecard below to resubmit.
                    </p>
                  </div>
                )}

                {/* Proof Actions */}
                <div>
                  {proofStatus === "APPROVED" ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verification Complete. Cash payout processing.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedWinnerId === w.id ? (
                        <div className="p-5 rounded-2xl bg-chalk border border-evergreen-200 space-y-4">
                          <label className="block text-xs font-bold text-evergreen-900 uppercase tracking-wider">
                            Upload Official Scorecard Screenshot (PNG, JPEG, WEBP &le; 5MB)
                          </label>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                uploadMutation.mutate({ winnerId: w.id, file });
                              }
                            }}
                            className="text-xs text-evergreen-800 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                          />
                          {uploadMutation.isPending && (
                            <div className="text-xs text-amber-600 font-bold animate-pulse">
                              Uploading & submitting proof image...
                            </div>
                          )}
                          {uploadError && (
                            <div className="text-xs text-rose-600 font-semibold">{uploadError}</div>
                          )}
                          <div>
                            <button
                              onClick={() => {
                                setSelectedWinnerId(null);
                                setUploadError(null);
                              }}
                              className="text-xs text-evergreen-600 hover:text-evergreen-950 font-semibold underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedWinnerId(w.id)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          <span>
                            {proofStatus === "REJECTED" ? "Resubmit Proof Screenshot" : "Upload Scorecard Proof"}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

