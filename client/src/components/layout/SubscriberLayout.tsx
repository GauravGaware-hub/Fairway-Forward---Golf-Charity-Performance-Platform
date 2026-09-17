import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "../shared/Logo";
import {
  LayoutDashboard,
  Trophy,
  Heart,
  CreditCard,
  Target,
  Gift,
  User,
  LogOut,
  Menu,
  X,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useSubscriptionStatus } from "../../hooks/useSubscriptionStatus";
import { useAuth } from "../../hooks/useAuth";

export const SubscriberLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: subData, isLoading: subLoading } = useSubscriptionStatus();
  const { user, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isSubActive = subData?.hasActiveSubscription;
  const isCanceledPending = subData?.cancelAtPeriodEnd;

  const displayName = user
    ? user.role === "ADMIN"
      ? "Admin"
      : user.displayName || user.fullName || "Member"
    : "Member";

  const initialLetter =
    user?.role === "ADMIN"
      ? "A"
      : displayName !== "Member"
      ? displayName.charAt(0).toUpperCase()
      : "M";

  return (
    <div className="min-h-screen flex bg-chalk font-sans text-evergreen-950">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-evergreen-950/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-evergreen-950 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-evergreen-900 flex items-center justify-between">
          <Logo variant="light" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-evergreen-900 text-evergreen-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subscription Status Card in Sidebar */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-evergreen-900/70 border border-evergreen-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-evergreen-300 uppercase tracking-wider">
              Membership State
            </span>
            {subLoading ? (
              <span className="w-2 h-2 rounded-full bg-evergreen-500 animate-pulse" />
            ) : isSubActive ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                <CheckCircle2 className="w-3 h-3" /> ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                <AlertTriangle className="w-3 h-3" /> INACTIVE
              </span>
            )}
          </div>
          <p className="text-xs text-evergreen-200 font-medium">
            {isCanceledPending
              ? "Cancels at period end"
              : isSubActive
              ? "Full Subscriber Access"
              : "Subscribe to submit scores"}
          </p>
          {!isSubActive && (
            <Link
              to="/subscription"
              className="mt-2 block w-full text-center py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-evergreen-950 font-bold text-xs shadow-sm transition-colors"
            >
              Activate Subscription
            </Link>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <NavLink
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-evergreen-800 text-white shadow-sm border-l-4 border-amber-400"
                  : "text-evergreen-300 hover:bg-evergreen-900 hover:text-white"
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 text-amber-400" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/scores"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-evergreen-800 text-white shadow-sm border-l-4 border-amber-400"
                  : "text-evergreen-300 hover:bg-evergreen-900 hover:text-white"
              }`
            }
          >
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Score Management</span>
          </NavLink>

          <NavLink
            to="/charity-select"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-evergreen-800 text-white shadow-sm border-l-4 border-amber-400"
                  : "text-evergreen-300 hover:bg-evergreen-900 hover:text-white"
              }`
            }
          >
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Charity Selection</span>
          </NavLink>

          <NavLink
            to="/draws"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-evergreen-800 text-white shadow-sm border-l-4 border-amber-400"
                  : "text-evergreen-300 hover:bg-evergreen-900 hover:text-white"
              }`
            }
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Monthly Draws</span>
          </NavLink>

          <NavLink
            to="/winnings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-evergreen-800 text-white shadow-sm border-l-4 border-amber-400"
                  : "text-evergreen-300 hover:bg-evergreen-900 hover:text-white"
              }`
            }
          >
            <Gift className="w-4 h-4 text-emerald-300" />
            <span>Winnings & Proof</span>
          </NavLink>

          <NavLink
            to="/subscription"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-evergreen-800 text-white shadow-sm border-l-4 border-amber-400"
                  : "text-evergreen-300 hover:bg-evergreen-900 hover:text-white"
              }`
            }
          >
            <CreditCard className="w-4 h-4 text-blue-400" />
            <span>Subscription Plan</span>
          </NavLink>

          <NavLink
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-evergreen-800 text-white shadow-sm border-l-4 border-amber-400"
                  : "text-evergreen-300 hover:bg-evergreen-900 hover:text-white"
              }`
            }
          >
            <User className="w-4 h-4 text-indigo-300" />
            <span>Profile & Settings</span>
          </NavLink>
        </nav>

        {/* Footer Logout Action */}
        <div className="p-4 border-t border-evergreen-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-evergreen-300 hover:text-white hover:bg-evergreen-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-evergreen-100 h-16 px-4 sm:px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-evergreen-800 hover:bg-evergreen-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-evergreen-950 tracking-tight hidden sm:block">
              Fairway Forward <span className="text-amber-600">Member Portal</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/scores"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-evergreen-800 hover:bg-evergreen-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Submit Score</span>
            </Link>

            <div className="flex items-center gap-3 pl-3 border-l border-evergreen-200">
              <div className="w-8 h-8 rounded-full bg-evergreen-800 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {authLoading ? (
                  <span className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
                ) : (
                  initialLetter
                )}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-evergreen-950 leading-tight">
                  {authLoading ? (
                    <span className="inline-block w-24 h-3 bg-evergreen-100 rounded animate-pulse" />
                  ) : (
                    displayName
                  )}
                </span>
                <span className="text-[10px] text-evergreen-600 font-medium">
                  {authLoading ? (
                    <span className="inline-block w-32 h-2.5 bg-evergreen-50 rounded animate-pulse mt-1" />
                  ) : (
                    user?.email || ""
                  )}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Outlet Component Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
