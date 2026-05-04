"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ToastProvider";
import { Earning, getEarnings, addEarning } from "@/lib/money";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  DollarSign, TrendingUp, Plus, Calendar, ArrowUpRight,
  Target, Loader2, Trash2, Tag
} from "lucide-react";
import { deleteDoc, doc as firestoreDoc } from "firebase/firestore";

const CATEGORIES = ["Freelance", "Product", "Consulting", "Ads", "Partnership", "Other"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_COLORS: Record<Category, string> = {
  Freelance: "bg-blue-500",
  Product: "bg-emerald-500",
  Consulting: "bg-purple-500",
  Ads: "bg-amber-500",
  Partnership: "bg-pink-500",
  Other: "bg-slate-500",
};

interface EarningWithCategory extends Earning {
  category?: Category;
}

export default function RevenuePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [earnings, setEarnings] = useState<EarningWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyGoal, setMonthlyGoal] = useState(0);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Other");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [data, userDoc] = await Promise.all([
        getEarnings(user.uid),
        getDoc(doc(db, "users", user.uid)),
      ]);
      setEarnings(data as EarningWithCategory[]);
      const goal = userDoc.data()?.monthlyRevenueGoal || 0;
      setMonthlyGoal(goal);
      setGoalInput(goal.toString());
    } catch {
      toast.error("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddEarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;
    setIsSubmitting(true);
    try {
      await addEarning(user.uid, parseFloat(amount), description || "Uncategorized Income");
      toast.success("Earning recorded", `+$${parseFloat(amount).toFixed(2)} added to treasury.`);
      setAmount("");
      setDescription("");
      setCategory("Other");
      await loadData();
    } catch {
      toast.error("Failed to record earning");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEarning = async (id: string) => {
    if (!user) return;
    setDeletingId(id);
    try {
      await deleteDoc(firestoreDoc(db, "users", user.uid, "earnings", id));
      setEarnings((prev) => prev.filter((e) => e.id !== id));
      toast.success("Entry removed");
    } catch {
      toast.error("Failed to delete entry");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveGoal = async () => {
    if (!user) return;
    const val = parseFloat(goalInput);
    if (isNaN(val) || val < 0) return;
    try {
      await setDoc(doc(db, "users", user.uid), { monthlyRevenueGoal: val }, { merge: true });
      setMonthlyGoal(val);
      setEditingGoal(false);
      toast.success("Revenue goal updated", `Target set to $${val.toLocaleString()}/month`);
    } catch {
      toast.error("Failed to save goal");
    }
  };

  // Analytics
  const today = new Date();
  const thisMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const { totalEarnings, thisMonthEarnings, todayEarnings, last7DaysByDay } = useMemo(() => {
    const total = earnings.reduce((s, e) => s + e.amount, 0);
    const todayStr = today.toISOString().split("T")[0];

    const thisMonth = earnings
      .filter((e) => e.date?.startsWith(thisMonthStr))
      .reduce((s, e) => s + e.amount, 0);

    const todayAmt = earnings
      .filter((e) => e.date === todayStr)
      .reduce((s, e) => s + e.amount, 0);

    // Last 7 days bar chart data
    const days: { label: string; total: number; dateStr: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const ds = d.toISOString().split("T")[0];
      const dayTotal = earnings.filter((e) => e.date === ds).reduce((s, e) => s + e.amount, 0);
      days.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        total: dayTotal,
        dateStr: ds,
      });
    }

    return { totalEarnings: total, thisMonthEarnings: thisMonth, todayEarnings: todayAmt, last7DaysByDay: days };
  }, [earnings, thisMonthStr, today]);

  const goalProgress = monthlyGoal > 0 ? Math.min((thisMonthEarnings / monthlyGoal) * 100, 100) : 0;
  const maxDayAmount = Math.max(...last7DaysByDay.map((d) => d.total), 1);

  // Category breakdown
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    earnings.forEach((e) => {
      const cat = (e.category as string) || "Other";
      totals[cat] = (totals[cat] || 0) + e.amount;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [earnings]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Revenue Tracker</h1>
        <p className="text-slate-400 text-sm">Monitor your cash flow and hit your revenue targets.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {/* All-Time */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800/80 p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 shadow-xl shadow-black/20">
          <div className="absolute top-0 right-0 p-28 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><DollarSign className="w-4 h-4 text-emerald-400" /></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">All Time</span>
            </div>
            <div className="text-3xl font-black text-white mb-0.5">
              ${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 font-medium">Total Capital Secured</p>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800/80 p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 shadow-xl shadow-black/20">
          <div className="absolute top-0 right-0 p-28 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Calendar className="w-4 h-4 text-blue-400" /></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">This Month</span>
            </div>
            <div className="text-3xl font-black text-white mb-0.5">
              ${thisMonthEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 font-medium">Generated in {today.toLocaleDateString("en-US", { month: "long" })}</p>
          </div>
        </div>

        {/* Today */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800/80 p-5 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 shadow-xl shadow-black/20">
          <div className="absolute top-0 right-0 p-28 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg"><TrendingUp className="w-4 h-4 text-purple-400" /></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today</span>
            </div>
            <div className="text-3xl font-black text-white mb-0.5">
              ${todayEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 font-medium">Generated Today</p>
          </div>
        </div>
      </div>

      {/* Monthly Goal */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800/80 p-5 mb-8 shadow-xl shadow-black/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white">Monthly Revenue Goal</h2>
          </div>
          {!editingGoal ? (
            <button
              onClick={() => setEditingGoal(true)}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 bg-blue-500/10 rounded-lg"
            >
              {monthlyGoal === 0 ? "Set Goal" : "Edit Goal"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="pl-7 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm w-32 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="5000"
                  autoFocus
                />
              </div>
              <button onClick={handleSaveGoal} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 bg-emerald-500/10 rounded-lg">Save</button>
              <button onClick={() => setEditingGoal(false)} className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1.5">Cancel</button>
            </div>
          )}
        </div>
        {monthlyGoal > 0 ? (
          <>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400 font-medium">
                ${thisMonthEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })} raised
              </span>
              <span className="font-bold text-white">
                {Math.round(goalProgress)}% of ${monthlyGoal.toLocaleString()} goal
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  goalProgress >= 100 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                  goalProgress >= 75 ? "bg-gradient-to-r from-blue-500 to-emerald-500" :
                  "bg-gradient-to-r from-blue-600 to-blue-400"
                }`}
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            {goalProgress >= 100 && (
              <p className="text-emerald-400 text-sm font-bold mt-2 text-center">🎉 Monthly goal crushed!</p>
            )}
            {goalProgress > 0 && goalProgress < 100 && (
              <p className="text-slate-500 text-xs mt-2">
                ${(monthlyGoal - thisMonthEarnings).toLocaleString(undefined, { maximumFractionDigits: 0 })} remaining to hit your goal
              </p>
            )}
          </>
        ) : (
          <p className="text-slate-500 text-sm">Set a monthly revenue goal to track your progress.</p>
        )}
      </div>

      {/* 7-Day Chart */}
      {earnings.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800/80 p-5 mb-8 shadow-xl shadow-black/20">
          <h2 className="font-bold text-white mb-5">Last 7 Days</h2>
          <div className="flex items-end gap-2 h-24">
            {last7DaysByDay.map((day, i) => {
              const heightPct = maxDayAmount > 0 ? (day.total / maxDayAmount) * 100 : 0;
              const isToday = i === last7DaysByDay.length - 1;
              return (
                <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-700 ${
                        day.total === 0
                          ? "bg-slate-800 h-1"
                          : isToday
                          ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                          : "bg-gradient-to-t from-blue-700 to-blue-500"
                      }`}
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                      title={`$${day.total.toFixed(2)}`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${isToday ? "text-emerald-400" : "text-slate-600"}`}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Earning Form */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-2xl border border-slate-800/80 p-5 shadow-xl shadow-black/20 sticky top-24">
            <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Record Earning
            </h2>
            <form onSubmit={handleAddEarning} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="number" step="0.01" min="0" required
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Stripe Payout, Client Retainer..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Category</span>
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button
                type="submit" id="add-earning-btn"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />Add to Treasury</>}
              </button>
            </form>

            {/* Category Breakdown */}
            {categoryTotals.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">By Category</h3>
                <div className="space-y-2">
                  {categoryTotals.map(([cat, total]) => {
                    const pct = totalEarnings > 0 ? (total / totalEarnings) * 100 : 0;
                    const colorClass = CATEGORY_COLORS[cat as Category] || "bg-slate-500";
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400 font-medium">{cat}</span>
                          <span className="text-slate-300 font-bold">${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div className={`${colorClass} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Earnings Ledger */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl shadow-black/20">
            <div className="p-5 border-b border-slate-800/80 flex justify-between items-center">
              <h2 className="font-bold text-white">Financial Ledger</h2>
              <span className="text-sm text-slate-500 font-medium">{earnings.length} entries</span>
            </div>
            <div className="divide-y divide-slate-800/50 bg-slate-900/50">
              {earnings.length === 0 ? (
                <div className="p-12 text-center">
                  <DollarSign className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No earnings yet.</p>
                  <p className="text-sm text-slate-500 mt-1">Start logging your revenue on the left.</p>
                </div>
              ) : (
                earnings.map((earning) => (
                  <div key={earning.id} className="p-4 hover:bg-slate-800/40 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_COLORS[(earning.category as Category) || "Other"] || "bg-slate-500"}`} />
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">{earning.description}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> {earning.date}
                          {earning.category && <span className="ml-1 text-slate-600">· {earning.category}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-base text-white">
                        +${earning.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <button
                        onClick={() => handleDeleteEarning(earning.id)}
                        disabled={deletingId === earning.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        {deletingId === earning.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
