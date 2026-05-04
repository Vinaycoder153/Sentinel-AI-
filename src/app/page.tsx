import Link from "next/link";
import { Rocket, Zap, Users, DollarSign, Brain, Shield, TrendingUp, Target } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Brain,
      color: "from-blue-500 to-cyan-500",
      glow: "group-hover:shadow-blue-500/20",
      title: "AI Mission Control",
      desc: "Gemini Pro analyzes your goals and generates optimized daily tasks tailored to your energy and available time."
    },
    {
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-500",
      glow: "group-hover:shadow-emerald-500/20",
      title: "Revenue Tracker",
      desc: "Log every dollar earned. Track your cash flow in real-time and monitor your financial momentum."
    },
    {
      icon: Users,
      color: "from-purple-500 to-pink-500",
      glow: "group-hover:shadow-purple-500/20",
      title: "Team Network",
      desc: "Build your squad. Invite team members with instant join codes and coordinate execution at scale."
    },
    {
      icon: Zap,
      color: "from-amber-500 to-orange-500",
      glow: "group-hover:shadow-amber-500/20",
      title: "XP & Leveling",
      desc: "Earn XP for every completed mission. Build streaks, level up, and turn productivity into a game you can win."
    },
    {
      icon: Shield,
      color: "from-red-500 to-rose-500",
      glow: "group-hover:shadow-red-500/20",
      title: "Discipline System",
      desc: "No excuses. The system monitors your consistency and delivers real-time accountability reports daily."
    },
    {
      icon: Target,
      color: "from-indigo-500 to-violet-500",
      glow: "group-hover:shadow-indigo-500/20",
      title: "Execution Tracking",
      desc: "Monitor your daily execution rate with visual progress bars. Hit 100% and unlock bonus XP rewards."
    }
  ];

  const stats = [
    { value: "10x", label: "Productivity Boost" },
    { value: "AI", label: "Powered by Gemini" },
    { value: "∞", label: "Team Members" },
    { value: "Real-time", label: "Data Sync" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg shadow-lg shadow-blue-500/20">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
              Execution OS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/signup" className="text-sm font-bold bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-600/10 via-purple-600/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 left-[10%] w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-[10%] w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            AI-Powered Productivity Engine
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            Stop Planning.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 text-transparent bg-clip-text">
              Start Executing.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            The AI-powered operating system for high-performance teams. Generate missions with Gemini, 
            track revenue, build accountability, and turn your goals into results.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              id="hero-cta-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)]"
            >
              <Rocket className="w-5 h-5" /> Launch Your Engine
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-2xl font-bold text-lg transition-all text-slate-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center hover:border-slate-700 transition-colors">
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
              Win
            </span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">Built for operators who demand results. Every feature is designed to drive execution and measurable outcomes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className={`group relative bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl ${f.glow} hover:-translate-y-1`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${f.color} bg-opacity-10 mb-5`}>
                  <div className={`w-8 h-8 bg-gradient-to-br ${f.color} rounded-lg flex items-center justify-center shadow-lg`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24 text-center">
        <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-emerald-600/5" />
          <div className="relative z-10">
            <DollarSign className="w-12 h-12 text-emerald-400 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to Execute?</h2>
            <p className="text-slate-400 mb-8 text-lg">Free to start. No credit card. Just results.</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
            >
              <Rocket className="w-5 h-5" /> Deploy Now — It's Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8 text-center text-slate-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Rocket className="w-4 h-4" />
          <span className="font-semibold">Execution OS</span>
        </div>
        <p>Built for operators. Powered by AI.</p>
      </footer>
    </main>
  );
}
