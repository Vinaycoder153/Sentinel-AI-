"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Task } from "@/lib/tasks";
import { useToast } from "@/components/ToastProvider";
import {
  CheckCircle2, Clock, Trash2, Filter, Search,
  Calendar, ChevronDown, TrendingUp, Loader2
} from "lucide-react";

type FilterStatus = "All" | "Completed" | "Not Started" | "In Progress";
type FilterType = "All" | "Money" | "Startup" | "Growth";

interface TaskWithDate extends Task {
  date: string;
}

export default function MissionsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState<TaskWithDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("All");
  const [typeFilter, setTypeFilter] = useState<FilterType>("All");
  const [showFilters, setShowFilters] = useState(false);

  const loadAllTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const tasksRef = collection(db, "users", user.uid, "tasks");
      const q = query(tasksRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const fetched: TaskWithDate[] = [];
      snap.forEach((d) => fetched.push({ id: d.id, ...d.data() } as TaskWithDate));
      setTasks(fetched);
    } catch {
      toast.error("Failed to load missions");
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadAllTasks();
  }, [loadAllTasks]);

  const handleDelete = async (task: TaskWithDate) => {
    if (!user) return;
    setDeletingId(task.id);
    try {
      await deleteDoc(doc(db, "users", user.uid, "tasks", task.id));
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success("Mission deleted");
    } catch {
      toast.error("Failed to delete mission");
    } finally {
      setDeletingId(null);
    }
  };

  // Derived stats
  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Filtered list
  const filtered = tasks.filter((t) => {
    const matchSearch = search === "" || t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchType = typeFilter === "All" || t.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // Group by date
  const groupedByDate = filtered.reduce<Record<string, TaskWithDate[]>>((acc, task) => {
    const date = task.date || "Unknown";
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const getStatusStyle = (status: string) => {
    if (status === "Completed") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (status === "In Progress") return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    return "text-slate-400 bg-slate-800 border-slate-700";
  };

  const getTypeStyle = (type: string) => {
    if (type === "Money") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (type === "Startup") return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    return "text-purple-400 bg-purple-500/10 border-purple-500/20";
  };

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long", month: "short", day: "numeric"
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Mission Archive</h1>
          <p className="text-slate-400 text-sm">Your complete execution history.</p>
        </div>
        {!loading && tasks.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xl font-black text-white">{tasks.length}</div>
              <div className="text-xs text-slate-500">Total</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <div className="text-xl font-black text-emerald-400">{completionRate}%</div>
              <div className="text-xs text-slate-500">Completed</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <div className="text-xl font-black text-white">{completedCount}</div>
              <div className="text-xs text-slate-500">Done</div>
            </div>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search missions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showFilters || statusFilter !== "All" || typeFilter !== "All"
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium">Status</p>
              <div className="flex gap-2 flex-wrap">
                {(["All", "Completed", "In Progress", "Not Started"] as FilterStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      statusFilter === s
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-px bg-slate-800 hidden sm:block" />
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium">Type</p>
              <div className="flex gap-2 flex-wrap">
                {(["All", "Money", "Startup", "Growth"] as FilterType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      typeFilter === t
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading mission archive...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
          {tasks.length === 0 ? (
            <>
              <TrendingUp className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-300 font-bold text-lg">No missions yet</p>
              <p className="text-slate-500 text-sm mt-1">Go to the Command Center and generate your first action plan.</p>
            </>
          ) : (
            <>
              <Search className="w-10 h-10 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-300 font-bold">No results found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-bold text-slate-400">{formatDate(date)}</span>
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-xs text-slate-600 font-medium">
                  {groupedByDate[date].filter((t) => t.status === "Completed").length}/{groupedByDate[date].length} done
                </span>
              </div>

              {/* Tasks for this date */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl shadow-black/10 divide-y divide-slate-800/50">
                {groupedByDate[date].map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors group"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      task.status === "Completed"
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-slate-700"
                    }`}>
                      {task.status === "Completed" && <CheckCircle2 className="w-3 h-3" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        task.status === "Completed" ? "text-slate-500 line-through" : "text-slate-200"
                      }`}>
                        {task.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${getTypeStyle(task.type)}`}>
                        {task.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusStyle(task.status)}`}>
                        {task.status === "Not Started" ? "Pending" : task.status}
                      </span>
                      <span className="hidden sm:flex items-center gap-1 text-xs text-slate-600">
                        <Clock className="w-3 h-3" /> {task.urgency}
                      </span>
                      <button
                        onClick={() => handleDelete(task)}
                        disabled={deletingId === task.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        {deletingId === task.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
