import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "../shared/Logo";
import {
  ShieldAlert,
  SlidersHorizontal,
  Heart,
  CheckCheck,
  BarChart3,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-900 font-sans text-slate-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Logo variant="light" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Badge Banner */}
        <div className="p-3 mx-3 my-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>ADMINISTRATOR CONTROL PANEL</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <NavLink
            to="/admin/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-emerald-600/20 text-emerald-400 border-l-4 border-emerald-500"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </NavLink>

          <NavLink
            to="/admin/draws"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-emerald-600/20 text-emerald-400 border-l-4 border-emerald-500"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Draw Management</span>
          </NavLink>

          <NavLink
            to="/admin/charities"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-emerald-600/20 text-emerald-400 border-l-4 border-emerald-500"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            <Heart className="w-4 h-4" />
            <span>Charity Management</span>
          </NavLink>

          <NavLink
            to="/admin/winners"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-emerald-600/20 text-emerald-400 border-l-4 border-emerald-500"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            <CheckCheck className="w-4 h-4" />
            <span>Winner Verification & Payout</span>
          </NavLink>

          <NavLink
            to="/admin/reports"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-emerald-600/20 text-emerald-400 border-l-4 border-emerald-500"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics & Reports</span>
          </NavLink>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Switch to Member View
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Exit Admin Session
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Admin Header */}
        <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 h-16 px-4 sm:px-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Fairway Forward</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                PROD BACKEND CONNECTED
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono hidden sm:block">
              Role: <strong className="text-amber-400 font-bold">ADMINISTRATOR</strong>
            </span>
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
