"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ToastProvider";
import { User, Mail, Lock, Shield, Trash2, Loader2, Eye, EyeOff, Save, ChevronRight } from "lucide-react";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, deleteDoc, collection, getDocs } from "firebase/firestore";

function SettingSection({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl shadow-black/20">
      <div className="p-5 border-b border-slate-800/80">
        <h2 className="text-base font-bold text-white">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout, updateDisplayName } = useAuth();
  const toast = useToast();

  // Profile
  const [name, setName] = useState(user?.displayName || "");
  const [savingName, setSavingName] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingName(true);
    try {
      await updateDisplayName(name.trim());
      toast.success("Profile updated", "Your display name has been saved.");
    } catch {
      toast.error("Failed to update name", "Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || newPassword.length < 6) return;
    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success("Password updated", "Your new password is active.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("wrong-password")) {
        toast.error("Wrong current password", "Re-enter your current password.");
      } else {
        toast.error("Failed to update password", "Please try again.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResetEmail = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success("Reset email sent", `Check ${user.email} for a reset link.`);
    } catch {
      toast.error("Failed to send reset email");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirm !== "DELETE") return;
    setDeletingAccount(true);
    try {
      // Delete all user subcollections (tasks, earnings)
      const subcols = ["tasks", "earnings"];
      for (const col of subcols) {
        const snap = await getDocs(collection(db, "users", user.uid, col));
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
      }
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      toast.success("Account deleted");
      logout();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete account", "You may need to re-login first.");
      setDeletingAccount(false);
    }
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Operative";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Settings</h1>
        <p className="text-slate-400 text-sm">Manage your profile and account preferences.</p>
      </div>

      {/* Profile Card */}
      <div className="flex items-center gap-4 mb-8 p-5 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl shadow-black/20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-emerald-500 p-[2px] flex-shrink-0">
          <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
            <span className="text-2xl font-black bg-gradient-to-tr from-blue-400 to-emerald-400 text-transparent bg-clip-text">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div>
          <p className="text-lg font-bold text-white">{displayName}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Verified Operative
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Display Name */}
        <SettingSection title="Display Name" desc="This is how you appear across the platform.">
          <form onSubmit={handleSaveName} className="flex gap-3">
            <div className="relative flex-1">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Your name"
                required
              />
            </div>
            <button
              type="submit"
              id="save-name-btn"
              disabled={savingName}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </form>
        </SettingSection>

        {/* Email (read-only) */}
        <SettingSection title="Email Address" desc="Your login email address (cannot be changed).">
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="email"
              value={user?.email || ""}
              readOnly
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800/50 rounded-xl text-slate-500 text-sm cursor-not-allowed"
            />
          </div>
        </SettingSection>

        {/* Change Password */}
        <SettingSection title="Change Password" desc="Update your password. You must enter your current password to confirm.">
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Current password"
                required
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="New password (min 6 chars)"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                id="save-password-btn"
                disabled={savingPassword}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Update Password
              </button>
              <button
                type="button"
                onClick={handleResetEmail}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                Send reset email <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </form>
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title="Danger Zone" desc="Permanently delete your account and all associated data.">
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              This action is <span className="text-red-400 font-bold">irreversible</span>. All your tasks, earnings, XP, and team data will be permanently deleted.
            </p>
            <div>
              <label className="block text-xs text-slate-500 mb-2">Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm</label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-red-500/20 focus:border-red-500/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500/30 outline-none transition-all"
                placeholder="DELETE"
              />
            </div>
            <button
              id="delete-account-btn"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== "DELETE" || deletingAccount}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete My Account
            </button>
          </div>
        </SettingSection>
      </div>
    </div>
  );
}
