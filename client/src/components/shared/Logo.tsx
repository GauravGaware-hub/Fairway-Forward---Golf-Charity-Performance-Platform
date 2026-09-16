import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = "dark", className = "" }) => {
  const isLight = variant === "light";

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group focus:outline-none ${className}`}>
      <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-evergreen-800 text-white shadow-md shadow-evergreen-800/20 group-hover:bg-evergreen-700 transition-colors">
        {/* Modern Golf Flag & Arc Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-amber-500"
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="currentColor" fillOpacity="0.2" />
          <line x1="4" x2="4" y1="22" y2="2" />
          <circle cx="16" cy="18" r="2" fill="currentColor" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span
          className={`font-extrabold tracking-tight text-lg leading-none ${
            isLight ? "text-white" : "text-evergreen-950"
          }`}
        >
          Fairway<span className="text-amber-600 ml-0.5">Forward</span>
        </span>
        <span
          className={`text-[10px] font-semibold tracking-wider uppercase leading-tight ${
            isLight ? "text-emerald-300/80" : "text-evergreen-700/80"
          }`}
        >
          Golf & Charity
        </span>
      </div>
    </Link>
  );
};
