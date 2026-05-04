import { db } from "./firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export interface DisciplineReport {
  type: 'severe' | 'warning' | 'reminder' | 'clear';
  message: string;
}

export const checkDiscipline = async (userId: string): Promise<DisciplineReport> => {
  if (!userId) return { type: 'clear', message: '' };

  const userDoc = await getDoc(doc(db, "users", userId));
  const data = userDoc.data();
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  
  const lastActiveDate = data?.lastActiveDate;

  // 1. Severe: Completely abandoned post (missed a day entirely)
  if (lastActiveDate && lastActiveDate < yesterdayStr) {
    return {
      type: 'severe',
      message: "You abandoned your post. Your execution streak has been broken. Inconsistency is the enemy of empire-building."
    };
  }

  // 2. Warning: Were active yesterday but left tasks unfinished
  const tasksRef = collection(db, "users", userId, "tasks");
  const yesterdayQ = query(tasksRef, where("date", "==", yesterdayStr));
  const yesterdaySnapshot = await getDocs(yesterdayQ);
  
  let totalYesterday = 0;
  let completedYesterday = 0;
  
  yesterdaySnapshot.forEach(doc => {
    totalYesterday++;
    if (doc.data().status === "Completed") completedYesterday++;
  });

  if (totalYesterday > 0 && completedYesterday < totalYesterday) {
    return {
      type: 'warning',
      message: `Discipline failure: You left ${totalYesterday - completedYesterday} missions incomplete yesterday. Excuses don't pay. Clear the board today.`
    };
  }

  // 3. Reminder: Daily pending tasks
  const todayQ = query(tasksRef, where("date", "==", todayStr));
  const todaySnapshot = await getDocs(todayQ);
  
  let totalToday = 0;
  let completedToday = 0;
  todaySnapshot.forEach(doc => {
    totalToday++;
    if (doc.data().status === "Completed") completedToday++;
  });

  if (totalToday > 0 && completedToday < totalToday) {
    return {
      type: 'reminder',
      message: `You have ${totalToday - completedToday} critical missions pending. Lock in and execute.`
    };
  } else if (totalToday > 0 && completedToday === totalToday) {
    return {
      type: 'clear',
      message: "All missions cleared. Rest and prepare for tomorrow."
    };
  }

  return { type: 'clear', message: '' };
};
