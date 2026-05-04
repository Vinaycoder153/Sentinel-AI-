"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  updateDisplayName: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Ensure user document exists in Firestore (for users who signed up before profile creation was added)
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Operative",
              xp: 0,
              streak: 0,
              lastActiveDate: null,
              completedDays: [],
              teamId: null,
              createdAt: serverTimestamp(),
            });
          }
        } catch {
          // If rules haven't been deployed yet, this may fail — suppress silently
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const updateDisplayName = async (name: string) => {
    if (!user) return;
    await firebaseUpdateProfile(user, { displayName: name });
    // Force re-render by updating the user object reference
    setUser({ ...user, displayName: name } as User);
    // Also update Firestore
    await setDoc(doc(db, "users", user.uid), { displayName: name }, { merge: true });
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, updateDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
};
