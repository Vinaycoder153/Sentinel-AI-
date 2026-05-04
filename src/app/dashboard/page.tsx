"use client";

import {
  CheckCircle2, TrendingUp, Zap, Clock, ChevronRight, Wand2, Flame,
  AlertOctagon, AlertTriangle, Info, ShieldCheck, RefreshCw, Trash2, Plus
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Task, getDailyTasks, saveGeneratedTasks, toggleTaskComplete } from "@/lib/tasks";
import { UserLevelInfo, getGamificationStats, updateGamificationOnTaskCompletion } from "@/lib/gamification";
import { DisciplineReport, checkDiscipline } from "@/lib/discipline";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/components/ToastProvider";

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Operative";

  const [missions, setMissions] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<UserLevelInfo | null>(null);
  const [discipline, setDiscipline] = useState<DisciplineReport | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // AI Generation State
  const [goal, setGoal] = useState("");
  const [energy, setEnergy] = useState("High (Locked in)");
  const [time, setTime] = useState("2-4 hours");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const [fetchedTasks, fetchedStats, fetchedDiscipline] = await Promise.all([
      getDailyTasks(user.uid, today),
      getGamificationStats(user.uid),
      checkDiscipline(user.uid),
    ]);

    setMissions(fetchedTasks);
    setStats(fetchedStats);
    setDiscipline(fetchedDiscipline);
    setLoading(false);
    setRefreshing(false);
  }, [user, today]);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user, loadDashboardData]);

  const handleGenerateTasks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsGenerating(true);
    setGenError("");
    try {
      const response = await fetch("/api/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal, energy, time,
          streak: stats?.streak,
          completionRate: missions.length > 0
            ? Math.round((missions.filter(m => m.status === "Completed").length / missions.length) * 100)
            : undefined,
        }),
      });

      const data = await response.json();

      if (data.tasks) {
        await saveGeneratedTasks(user.uid, today, data.tasks);
        await loadDashboardData(true);
        setGoal("");
        toast.success("Action plan deployed!", `${data.tasks.length} missions generated.`);
      } else {
        setGenError(data.error || "Failed to generate tasks. Try again.");
      }
    } catch {
      setGenError("Network error. Check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggle = async (mission: Task) => {
    if (!user || togglingId) return;
    setTogglingId(mission.id);
    const isCompleted = mission.status === "Completed";

    // Optimistic update
    setMissions((prev) =>
      prev.map((m) =>
        m.id === mission.id
          ? { ...m, status: isCompleted ? "Not Started" : "Completed", progress: isCompleted ? 0 : 100 }
          : m
      )
    );

    try {
      await Promise.all([
        toggleTaskComplete(user.uid, mission.id, isCompleted),
        updateGamificationOnTaskCompletion(user.uid, today, missions, isCompleted),
      ]);

      const [newStats, newDiscipline] = await Promise.all([
        getGamificationStats(user.uid),
        checkDiscipline(user.uid),
      ]);
      setStats(newStats);
      setDiscipline(newDiscipline);

      if (!isCompleted) {
        toast.success("+10 XP earned!", "Keep executing. Every mission counts.");
        // Check if all missions now complete
        const updatedMissions = missions.map(m =>
          m.id === mission.id ? { ...m, status: "Completed" as const, progress: 100 } : m
        );
        if (updatedMissions.every(m => m.status === "Completed") && updatedMissions.length > 0) {
          toast.success("🎉 All missions complete!", "Bonus +50 XP awarded. Legendary execution!");
        }
      }
    } catch {
      // Revert optimistic update on error
      setMissions((prev) =>
        prev.map((m) =>
          m.id === mission.id
            ? { ...m, status: mission.status, progress: mission.progress }
            : m
        )
      );
      toast.error("Failed to update mission", "Please try again.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteTask = async (mission: Task) => {
    if (!user || deletingId) return;
    setDeletingId(mission.id);
    try {
      await deleteDoc(doc(db, "users", user.uid, "tasks", mission.id));
      setMissions((prev) => prev.filter((m) => m.id !== mission.id));
      toast.success("Mission removed");
    } finally {
      setDeletingId(null);
    }
  };

  const getUrgencyStyle = (urgency: string) => {
    if (urgency === "Critical") return "bg-red-500/10 text-red-400 border border-red-500/20";
    if (urgency === "High") return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
    return "bg-slate-800 text-slate-400 border border-slate-700";
  };

  const executionRate =
    missions.length > 0
      ? Math.round((missions.filter((m) => m.status === "Completed").length / missions.length) * 100)
      : 0;

  const completedCount = missions.filter((m) => m.status === "Completed").length;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
            {greeting()}, <span className="bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">{displayName}</span>
          </h1>
          <p className="text-slate-400 text-sm">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} — Stay locked in.
          </p>
        </div>
        <button
          id="refresh-btn"
          onClick={() => loadDashboardData(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-slate-200 transition-all text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Discipline Alert */}
      {discipline && discipline.message !== "" && (
        <div
          className={`mb-8 p-4 rounded-2xl border flex items-start gap-3 shadow-lg ${
            discipline.type === "severe"
              ? "bg-red-500/10 border-red-500/40 text-red-400 shadow-red-500/5"
              : discipline.type === "warning"
              ? "bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-orange-500/5"
              : discipline.type === "reminder"
              ? "bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-blue-500/5"
              : "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-emerald-500/5"
          }`}
        >
          {discipline.type === "severe" && <AlertOctagon className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {discipline.type === "warning" && <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {discipline.type === "reminder" && <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {discipline.type === "clear" && <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <p className="font-medium text-sm leading-relaxed">{discipline.message}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {/* XP / Level Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800/80 p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 shadow-xl shadow-black/20">
          <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-full">
                Level {stats?.level || 1}
              </span>
            </div>
            <h3 className="text-3xl font-black text-white mb-0.5 tracking-tight">
              {(stats?.xp || 0).toLocaleString()} <span className="text-xl text-emerald-400">XP</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">+10 XP per task • +50 XP full completion</p>
            <div className="w-full bg-slate-950 rounded-full h-1.5 shadow-inner overflow-hidden border border-slate-800/50">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats?.progressPercentage || 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-600 text-right mt-1.5 font-medium">
              {stats?.xpToNextLevel || 100} XP to Level {(stats?.level || 1) + 1}
            </p>
          </div>
        </div>

        {/* Execution Rate */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800/80 p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 shadow-xl shadow-black/20">
          <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-full">
                Today
              </span>
            </div>
            <h3 className="text-3xl font-black text-white mb-0.5 tracking-tight">{executionRate}%</h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              {completedCount}/{missions.length} missions complete
            </p>
            <div className="w-full bg-slate-950 rounded-full h-1.5 shadow-inner overflow-hidden border border-slate-800/50">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  executionRate === 100
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : "bg-gradient-to-r from-blue-600 to-blue-400"
                }`}
                style={{ width: `${executionRate}%` }}
              />
            </div>
            {executionRate === 100 && (
              <p className="text-xs text-emerald-400 text-right mt-1.5 font-bold">🎉 Bonus +50 XP earned!</p>
            )}
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800/80 p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300 shadow-xl shadow-black/20">
          <div className="absolute top-0 right-0 p-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-400">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-full">
                {stats?.streak && stats.streak > 0 ? "🔥 Active" : "Start"}
              </span>
            </div>
            <h3 className="text-3xl font-black text-white mb-0.5 tracking-tight">
              {stats?.streak || 0} <span className="text-xl text-orange-400">Days</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              {stats?.streak && stats.streak >= 7 ? "Elite streak! Keep going." : "Execute daily to build streak"}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full ${
                    i < (stats?.streak || 0) % 7 || (stats?.streak || 0) >= 7
                      ? "bg-orange-500"
                      : "bg-slate-800"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-600 text-right mt-1.5 font-medium">Weekly progress</p>
          </div>
        </div>
      </div>

      {/* Missions Section */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl shadow-black/20">
        <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/80">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Today&apos;s Missions</h2>
            <p className="text-sm text-slate-500 font-medium">
              {missions.length > 0 ? `${completedCount} of ${missions.length} complete` : "No missions generated yet"}
            </p>
          </div>
          {missions.length > 0 && (
            <button
              id="add-more-btn"
              onClick={() => setMissions([])}
              className="flex items-center gap-1.5 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 border border-blue-500/20"
            >
              <Plus className="w-4 h-4" /> New Plan
            </button>
          )}
        </div>

        <div className="bg-slate-900/50">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Loading your missions...</p>
            </div>
          ) : missions.length === 0 ? (
            <div className="p-8 max-w-2xl mx-auto">
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 shadow-inner">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                    <Wand2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">AI Mission Control</h3>
                  <p className="text-slate-400 text-sm">
                    Tell Gemini your goal and it will generate 3 high-impact missions optimized for your current state.
                  </p>
                </div>

                {genError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                    {genError}
                  </div>
                )}

                <form onSubmit={handleGenerateTasks} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      What is your #1 goal right now?
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Launch MVP, Close first 10 clients, Grow to $10k MRR..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Energy Level</label>
                      <select
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none cursor-pointer"
                        value={energy}
                        onChange={(e) => setEnergy(e.target.value)}
                      >
                        <option>Low (Burnt out)</option>
                        <option>Medium (Steady)</option>
                        <option>High (Locked in)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Available Time</label>
                      <select
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none cursor-pointer"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      >
                        <option>1-2 hours</option>
                        <option>2-4 hours</option>
                        <option>4-8 hours</option>
                        <option>Full day (8+ hours)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="generate-tasks-btn"
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {isGenerating ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating Protocol...</>
                    ) : (
                      <><Wand2 className="w-5 h-5" /> Generate Action Plan</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  className="p-5 hover:bg-slate-800/30 transition-colors duration-200 group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <button
                      id={`toggle-${mission.id}`}
                      onClick={() => handleToggle(mission)}
                      disabled={togglingId === mission.id}
                      className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        mission.status === "Completed"
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                          : "border-slate-600 hover:border-emerald-400 text-transparent hover:text-emerald-400"
                      } ${togglingId === mission.id ? "opacity-50 cursor-wait" : ""}`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${mission.status === "Completed" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-bold text-sm mb-1 tracking-tight transition-colors ${
                          mission.status === "Completed"
                            ? "text-slate-500 line-through"
                            : "text-slate-100 group-hover:text-white"
                        }`}
                      >
                        {mission.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs font-medium flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md ${getUrgencyStyle(mission.urgency || "Medium")}`}>
                          {mission.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${getUrgencyStyle(mission.urgency || "Medium")}`}>
                          {mission.urgency || "Medium"}
                        </span>
                        <span className="text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Today
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:w-56 pl-9 sm:pl-0">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">{mission.status}</span>
                        <span className="font-bold text-slate-400">{mission.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-1.5 shadow-inner overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            mission.progress === 100
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                              : "bg-gradient-to-r from-blue-600 to-blue-400"
                          }`}
                          style={{ width: `${mission.progress}%` }}
                        />
                      </div>
                    </div>
                    <button
                      id={`delete-${mission.id}`}
                      onClick={() => handleDeleteTask(mission)}
                      disabled={deletingId === mission.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      title="Delete mission"
                    >
                      {deletingId === mission.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
