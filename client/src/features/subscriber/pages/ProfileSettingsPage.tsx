import React, { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { apiFetch } from "../../../lib/api";
import { User, Mail, Phone, CheckCircle2, AlertCircle, Award } from "lucide-react";

export const ProfileSettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.profile?.firstName ?? user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.profile?.lastName ?? user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.profile?.phone ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.profile?.firstName ?? user.firstName ?? "");
      setLastName(user.profile?.lastName ?? user.lastName ?? "");
      setPhone(user.profile?.phone ?? "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMsg(null);
    setErrorMsg(null);

    try {
      await apiFetch("/api/v1/me", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: firstName.trim() || null,
          lastName: lastName.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      if (refreshUser) await refreshUser();
      setFeedbackMsg("Profile settings saved successfully!");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-evergreen-950">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Profile & Settings</h1>
        <p className="text-sm text-evergreen-700">
          Manage your personal membership profile details, email notifications, and account credentials.
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 sm:p-8 border border-evergreen-100 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-evergreen-950 border-b border-evergreen-100 pb-3">
          Account Details
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-evergreen-900 uppercase tracking-wider">
                First Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-evergreen-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-evergreen-200 text-sm bg-chalk focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-evergreen-900 uppercase tracking-wider">
                Last Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-evergreen-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-evergreen-200 text-sm bg-chalk focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-evergreen-900 uppercase tracking-wider">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-evergreen-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-evergreen-200 text-sm bg-chalk focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-evergreen-900 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-evergreen-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  readOnly
                  value={user?.email || ""}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-evergreen-200 text-sm bg-evergreen-50/50 text-evergreen-600 font-medium cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-evergreen-500">Email is linked to your Supabase authentication account.</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-evergreen-800 hover:bg-evergreen-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-6 sm:p-8 border border-evergreen-100 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-evergreen-950 border-b border-evergreen-100 pb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" /> Golf Platform Link
        </h3>
        <p className="text-xs text-evergreen-700 leading-relaxed">
          Verify your GHIN handicap or digital scorecard integration. Score submissions are cross-referenced with your official golf platform app screenshots during winner verification.
        </p>
        <div className="p-4 rounded-xl bg-chalk border border-evergreen-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-evergreen-900">Scorecard Verification Status</span>
          <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            VERIFIED SUBSCRIBER
          </span>
        </div>
      </div>
    </div>
  );
};
