import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  query, 
  where,
  serverTimestamp,
  addDoc
} from "firebase/firestore";

export interface Team {
  id: string;
  name: string;
  joinCode: string;
  createdBy: string;
}

export interface TeamMember {
  uid: string;
  email: string;
  teamId: string;
}

// Generate a random 6-character alphanumeric code
const generateJoinCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const getUserProfile = async (userId: string): Promise<TeamMember | null> => {
  if (!userId) return null;
  const userDoc = await getDoc(doc(db, "users", userId));
  if (userDoc.exists() && userDoc.data().teamId) {
    return { uid: userId, ...userDoc.data() } as TeamMember;
  }
  return null;
};

export const getTeam = async (teamId: string): Promise<Team | null> => {
  if (!teamId) return null;
  const teamDoc = await getDoc(doc(db, "teams", teamId));
  if (teamDoc.exists()) {
    return { id: teamDoc.id, ...teamDoc.data() } as Team;
  }
  return null;
};

export const createTeam = async (userId: string, email: string, teamName: string) => {
  const joinCode = generateJoinCode();
  
  // Create Team
  const teamRef = await addDoc(collection(db, "teams"), {
    name: teamName,
    joinCode,
    createdBy: userId,
    createdAt: serverTimestamp()
  });

  // Update User Profile with Team ID
  await setDoc(doc(db, "users", userId), {
    email: email,
    teamId: teamRef.id
  }, { merge: true });

  return teamRef.id;
};

export const joinTeam = async (userId: string, email: string, joinCode: string) => {
  // Find Team by Code
  const q = query(collection(db, "teams"), where("joinCode", "==", joinCode.toUpperCase()));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    throw new Error("Invalid join code.");
  }

  const teamId = snapshot.docs[0].id;

  // Update User Profile with Team ID
  await setDoc(doc(db, "users", userId), {
    email: email,
    teamId: teamId
  }, { merge: true });

  return teamId;
};

export const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  const q = query(collection(db, "users"), where("teamId", "==", teamId));
  const snapshot = await getDocs(q);
  
  const members: TeamMember[] = [];
  snapshot.forEach((doc) => {
    members.push({ uid: doc.id, ...doc.data() } as TeamMember);
  });
  
  return members;
};
