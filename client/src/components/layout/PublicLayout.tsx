import React, { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Logo } from "../shared/Logo";
import { Menu, X, Heart, ShieldCheck, Trophy, ArrowRight } from "lucide-react";

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-chalk font-sans text-evergreen-950 antialiased">
      {/* Top Banner Notice */}
      <div className="bg-evergreen-950 text-white text-xs font-medium py-2 px-4 text-center border-b border-evergreen-800 flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1 text-amber-400 font-semibold uppercase tracking-wider text-[10px] bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
          <Heart className="w-3 h-3 fill-amber-400" /> Impact Driven
        </span>
        <span>50% of every membership goes directly to verified non-profit charity partners.</span>
        <Link to="/charities" className="underline hover:text-amber-300 font-semibold text-[11px] ml-1">
          Explore Charities &rarr;
        </Link>
      </div>

      {/* Main Public Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-evergreen-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-evergreen-800">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `hover:text-evergreen-600 transition-colors py-1 ${
                  isActive ? "text-evergreen-950 font-bold border-b-2 border-amber-500" : ""
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/how-it-works"
              className={({ isActive }) =>
                `hover:text-evergreen-600 transition-colors py-1 ${
                  isActive ? "text-evergreen-950 font-bold border-b-2 border-amber-500" : ""
                }`
              }
            >
              How It Works
            </NavLink>
            <NavLink
              to="/charities"
              className={({ isActive }) =>
                `hover:text-evergreen-600 transition-colors py-1 ${
                  isActive ? "text-evergreen-950 font-bold border-b-2 border-amber-500" : ""
                }`
              }
            >
              Charity Directory
            </NavLink>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-evergreen-800 hover:text-evergreen-950 hover:bg-evergreen-50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-evergreen-800 hover:bg-evergreen-700 text-white shadow-md shadow-evergreen-800/15 transition-all flex items-center gap-1.5 group"
            >
              <span>Join Now</span>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-evergreen-800 hover:bg-evergreen-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-evergreen-100 px-4 pt-2 pb-6 space-y-3 shadow-lg">
            <NavLink
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-evergreen-900 hover:bg-evergreen-50"
            >
              Home
            </NavLink>
            <NavLink
              to="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-evergreen-900 hover:bg-evergreen-50"
            >
              How It Works
            </NavLink>
            <NavLink
              to="/charities"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-evergreen-900 hover:bg-evergreen-50"
            >
              Charity Directory
            </NavLink>
            <div className="pt-4 border-t border-evergreen-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg text-sm font-semibold border border-evergreen-200 text-evergreen-900 hover:bg-evergreen-50"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-evergreen-800 text-white hover:bg-evergreen-700 shadow-md"
              >
                Join Now & Start Impact
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-evergreen-950 text-white pt-16 pb-12 border-t border-evergreen-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-evergreen-900/60">
            <div className="md:col-span-1 space-y-4">
              <Logo variant="light" />
              <p className="text-sm text-evergreen-300/80 leading-relaxed">
                Fairway Forward turns your everyday golf performance into real non-profit funding and monthly prize pools.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                <Trophy className="w-4 h-4" />
                <span>"Your game can make a difference."</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm text-evergreen-300">
                <li><Link to="/how-it-works" className="hover:text-amber-400 transition-colors">How It Works</Link></li>
                <li><Link to="/charities" className="hover:text-amber-400 transition-colors">Charity Partners</Link></li>
                <li><Link to="/draws" className="hover:text-amber-400 transition-colors">Monthly Draws Archive</Link></li>
                <li><Link to="/subscription" className="hover:text-amber-400 transition-colors">Membership Tiers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Trust & Compliance</h4>
              <ul className="space-y-2.5 text-sm text-evergreen-300">
                <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Verified Draws</li>
                <li className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-amber-400" /> 50% Net Charity Allocation</li>
                <li className="text-xs text-evergreen-400">PCI-DSS Compliant Payments via Razorpay</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Account Access</h4>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block w-full text-center px-4 py-2 rounded-lg bg-evergreen-900 hover:bg-evergreen-800 text-sm font-semibold border border-evergreen-800 transition-colors"
                >
                  Member Sign In
                </Link>
                <Link
                  to="/signup"
                  className="block w-full text-center px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-sm font-semibold text-white transition-colors shadow-sm"
                >
                  Register Membership
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-evergreen-400/80 gap-4">
            <p>&copy; {new Date().getFullYear()} Fairway Forward. All rights reserved.</p>
            <p className="text-evergreen-400/60">
              Powered by <span className="font-semibold text-evergreen-300">Digital Heroes</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
