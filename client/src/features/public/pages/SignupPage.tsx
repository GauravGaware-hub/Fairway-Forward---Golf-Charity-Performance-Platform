import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../../../components/shared/Logo";
import { useAuth } from "../../../hooks/useAuth";
import { User, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export const SignupPage: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setErrorMsg("You must accept the Terms of Service & Privacy Policy.");
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await signup({ fullName, email, password });
      navigate("/subscription");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create account. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-evergreen-100 shadow-xl">
        <div className="text-center space-y-3">
          <Logo className="justify-center" />
          <h2 className="text-2xl font-extrabold text-evergreen-950 tracking-tight">
            Create Your Membership
          </h2>
          <p className="text-xs text-evergreen-600">
            Join Fairway Forward to play golf with purpose and participate in monthly cash draws.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-evergreen-900 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-evergreen-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-evergreen-200 text-sm bg-chalk focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
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
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="golfer@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-evergreen-200 text-sm bg-chalk focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-evergreen-900 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-evergreen-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-evergreen-200 text-sm bg-chalk focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 rounded border-evergreen-300 text-emerald-600 focus:ring-emerald-600"
            />
            <label htmlFor="terms" className="text-xs text-evergreen-700">
              I agree to the Terms of Service and understand that a portion of my subscription is allocated to verified non-profit charity partners.
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <span>Create Account & Choose Charity</span>
                <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-evergreen-100 text-center text-xs text-evergreen-600">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-evergreen-900 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
