import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp
} from "firebase/firestore";

export type TaskType = 'Money' | 'Startup' | 'Growth';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  progress: number;
  date: string;
  urgency: string;
}

export const getDailyTasks = async (userId: string, dateStr: string): Promise<Task[]> => {
  if (!userId) return [];
  
  const tasksRef = collection(db, "users", userId, "tasks");
  const q = query(tasksRef, where("date", "==", dateStr));
  const snapshot = await getDocs(q);
  
  const tasks: Task[] = [];
  snapshot.forEach((doc) => {
    tasks.push({ id: doc.id, ...doc.data() } as Task);
  });
  
  return tasks;
};

export const saveGeneratedTasks = async (userId: string, dateStr: string, generatedTasks: { title: string, type: TaskType, urgency: string }[]) => {
  if (!userId) return;

  const tasksRef = collection(db, "users", userId, "tasks");
  
  for (const task of generatedTasks) {
    const newDocRef = doc(tasksRef);
    await setDoc(newDocRef, {
      ...task,
      status: "Not Started",
      progress: 0,
      date: dateStr,
      createdAt: serverTimestamp()
    });
  }
};

export const toggleTaskComplete = async (userId: string, taskId: string, currentlyCompleted: boolean) => {
  if (!userId || !taskId) return;
  
  const taskRef = doc(db, "users", userId, "tasks", taskId);
  const newStatus = currentlyCompleted ? "Not Started" : "Completed";
  const newProgress = currentlyCompleted ? 0 : 100;
  
  await updateDoc(taskRef, {
    status: newStatus,
    progress: newProgress
  });
};
