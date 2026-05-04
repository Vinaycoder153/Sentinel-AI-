import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Task } from "./tasks";

export interface GamificationStats {
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  completedDays: string[];
}

export interface UserLevelInfo {
  xp: number;
  streak: number;
  level: number;
  xpToNextLevel: number;
  progressPercentage: number;
}

const XP_PER_LEVEL = 100;
const XP_PER_TASK = 10;
const XP_FULL_COMPLETION = 50;

export const getGamificationStats = async (userId: string): Promise<UserLevelInfo> => {
  if (!userId) {
    return { xp: 0, streak: 0, level: 1, xpToNextLevel: 100, progressPercentage: 0 };
  }

  const userDoc = await getDoc(doc(db, "users", userId));
  const data = userDoc.data() as GamificationStats | undefined;

  const xp = data?.xp || 0;
  const streak = data?.streak || 0;
  
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInCurrentLevel = xp % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - xpInCurrentLevel;
  const progressPercentage = Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100);

  return {
    xp,
    streak,
    level,
    xpToNextLevel,
    progressPercentage
  };
};

export const updateGamificationOnTaskCompletion = async (userId: string, dateStr: string, tasks: Task[], currentlyCompleted: boolean) => {
  if (!userId) return;

  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);
  const data = userDoc.data() as GamificationStats | undefined;

  let currentXp = data?.xp || 0;
  let currentStreak = data?.streak || 0;
  let lastActiveDate = data?.lastActiveDate || null;
  let completedDays = data?.completedDays || [];

  if (!currentlyCompleted) {
    // Task is being completed
    currentXp += XP_PER_TASK;

    // Check streak logic
    if (lastActiveDate !== dateStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActiveDate === yesterdayStr) {
        currentStreak += 1; // Maintained streak
      } else {
        currentStreak = 1; // Started new streak
      }
      lastActiveDate = dateStr;
    }

    // Check full completion
    // The passed 'tasks' array represents the state BEFORE this specific task was marked complete.
    // So if tasks array has 2 completed tasks, and this is the 3rd, it means full completion.
    const completedTasks = tasks.filter(t => t.status === "Completed");
    if (completedTasks.length === 2 && tasks.length === 3 && !completedDays.includes(dateStr)) {
      currentXp += XP_FULL_COMPLETION;
      completedDays.push(dateStr);
    }
  } else {
    // Task is being un-completed
    currentXp = Math.max(0, currentXp - XP_PER_TASK);
    
    // If they were at full completion today, we should probably remove the bonus
    if (completedDays.includes(dateStr)) {
      currentXp = Math.max(0, currentXp - XP_FULL_COMPLETION);
      completedDays = completedDays.filter(d => d !== dateStr);
    }
  }

  await setDoc(userRef, {
    xp: currentXp,
    streak: currentStreak,
    lastActiveDate: lastActiveDate,
    completedDays: completedDays
  }, { merge: true });
};
