import { db } from "./firebase";
import { 
  collection, 
  getDocs, 
  addDoc,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";

export interface Earning {
  id: string;
  amount: number;
  description: string;
  date: string;
  createdAt: unknown;
}

export const addEarning = async (userId: string, amount: number, description: string) => {
  if (!userId) return;

  const today = new Date().toISOString().split('T')[0];
  const earningsRef = collection(db, "users", userId, "earnings");
  
  await addDoc(earningsRef, {
    amount,
    description,
    date: today,
    createdAt: serverTimestamp()
  });
};

export const getEarnings = async (userId: string): Promise<Earning[]> => {
  if (!userId) return [];
  
  const earningsRef = collection(db, "users", userId, "earnings");
  // Sort by newest first
  const q = query(earningsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  const earnings: Earning[] = [];
  snapshot.forEach((doc) => {
    earnings.push({ id: doc.id, ...doc.data() } as Earning);
  });
  
  return earnings;
};
