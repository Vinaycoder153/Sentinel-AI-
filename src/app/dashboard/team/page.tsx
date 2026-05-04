"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  Team, 
  TeamMember, 
  getUserProfile, 
  getTeam, 
  createTeam, 
  joinTeam, 
  getTeamMembers 
} from "@/lib/teams";
import { Users, UserPlus, KeyRound, Copy } from "lucide-react";

export default function TeamPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [userProfile, setUserProfile] = useState<TeamMember | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);

  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);

      if (profile?.teamId) {
        const teamData = await getTeam(profile.teamId);
        setTeam(teamData);
        
        const membersData = await getTeamMembers(profile.teamId);
        setMembers(membersData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user || !user.email) return;
    try {
      await createTeam(user.uid, user.email, createName);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create team.");
      } else {
        setError("Failed to create team.");
      }
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user || !user.email) return;
    try {
      await joinTeam(user.uid, user.email, joinCode);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to join team. Check your code.");
      } else {
        setError("Failed to join team. Check your code.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Team Roster</h1>
        <p className="text-slate-400">Manage your operatives and secure your team network.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {!userProfile?.teamId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Team */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800/80 p-8 shadow-xl shadow-black/20">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Create a New Team</h2>
            <p className="text-sm text-slate-400 mb-6">Start a new execution unit and invite other operatives.</p>
            
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <input
                type="text"
                placeholder="Team Name"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/20">
                Initialize Team
              </button>
            </form>
          </div>

          {/* Join Team */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800/80 p-8 shadow-xl shadow-black/20">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
              <KeyRound className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Join Existing Team</h2>
            <p className="text-sm text-slate-400 mb-6">Enter an invite code from your commander to join.</p>
            
            <form onSubmit={handleJoinTeam} className="space-y-4">
              <input
                type="text"
                placeholder="6-Digit Invite Code"
                required
                maxLength={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-purple-500/20">
                Authenticate & Join
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Team Header Info */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800/80 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl shadow-black/20">
            <div>
              <span className="text-xs font-bold px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 mb-3 inline-block">
                Active Network
              </span>
              <h2 className="text-2xl font-bold text-white">{team?.name}</h2>
            </div>
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-4 min-w-[200px]">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Invite Code</p>
                <p className="text-lg font-mono font-bold text-white tracking-widest">{team?.joinCode}</p>
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(team?.joinCode || "")}
                className="ml-auto p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                title="Copy Code"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Member List */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl shadow-black/20">
            <div className="p-6 border-b border-slate-800/80 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-white">Operatives List ({members.length})</h3>
            </div>
            
            <div className="divide-y divide-slate-800/50">
              {members.map((member) => (
                <div key={member.uid} className="p-6 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-bold text-white shadow-inner border border-slate-600">
                    {member.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{member.email}</p>
                    <p className="text-xs text-slate-500">
                      {team?.createdBy === member.uid ? "Commander" : "Operative"}
                    </p>
                  </div>
                  {member.uid === user?.uid && (
                    <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-md">
                      You
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
