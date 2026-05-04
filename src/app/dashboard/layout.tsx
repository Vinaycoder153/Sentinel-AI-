"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, Target, Users, Settings, LogOut, Menu, X, Rocket, DollarSign, ChevronRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: "Command Center", href: "/dashboard", icon: LayoutDashboard, desc: "Overview" },
    { name: "Missions", href: "/dashboard/missions", icon: Target, desc: "Full history" },
    { name: "Revenue", href: "/dashboard/revenue", icon: DollarSign, desc: "Track cash flow" },
    { name: "Team", href: "/dashboard/team", icon: Users, desc: "Manage squad" },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, desc: "Preferences" },
  ];

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Operative";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-slate-50 flex overflow-hidden selection:bg-blue-500/30">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800/80 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block flex flex-col ${isSidebarOpen ? "translate-x-0 shadow-2xl shadow-black/50" : "-translate-x-full"}`}>
          <div className="h-full flex flex-col">
            {/* Logo Header */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800/80 flex-shrink-0">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl shadow-lg shadow-blue-500/20">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
                  Execution OS
                </span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="ml-auto lg:hidden text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-4">Navigation</p>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                      isActive 
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isActive ? "bg-blue-500/20" : "bg-slate-800 group-hover:bg-slate-700"} transition-colors`}>
                      <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-sm block">{item.name}</span>
                      <span className="text-xs text-slate-600 group-hover:text-slate-500 transition-colors">{item.desc}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-blue-400/60" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-slate-800/80 flex-shrink-0">
              <div className="flex items-center gap-3 px-2 py-2 mb-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-500 p-[2px] flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                    <span className="text-sm font-bold bg-gradient-to-tr from-blue-400 to-emerald-400 text-transparent bg-clip-text">
                      {avatarLetter}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                id="logout-btn"
                onClick={logout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group"
              >
                <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
                <span className="font-medium text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Navbar */}
          <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-30 flex-shrink-0">
            <div className="flex items-center gap-4">
              <button
                id="mobile-menu-btn"
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg text-slate-400 hover:bg-slate-800 lg:hidden transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-sm shadow-inner">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                <span className="text-slate-300 font-medium text-xs">System Online</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-200">{displayName}</p>
                <p className="text-xs text-slate-500">Operative</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-500 p-[2px] shadow-lg shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform flex-shrink-0">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                  <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 to-emerald-400">
                    {avatarLetter}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Page Content */}
          <main className="flex-1 overflow-y-auto bg-slate-950 p-4 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
