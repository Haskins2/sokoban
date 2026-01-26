// Tracks completed levels per user
// Syncs progress to Firestore (userProgress collection)
// Works for both logged-in users and guests (local state only for guests)
// Auto-loads progress when user logs in

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { db } from "../firebaseConfig";
import { useAuth } from "./AuthContext";

type UserProgress = {
  completedLevels: number[];
  lastPlayedLevel: number;
};

type UserProgressContextType = {
  completedLevels: number[];
  markLevelComplete: (levelNumber: number) => Promise<void>;
  getNextIncompleteLevel: () => number;
  isLevelComplete: (levelNumber: number) => boolean;
  loading: boolean;
};

const UserProgressContext = createContext<UserProgressContextType | undefined>(
  undefined,
);

export function UserProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user progress from Firestore
  useEffect(() => {
    if (user) {
      loadUserProgress();
    } else {
      // Guest user - use local state only
      setCompletedLevels([]);
      setLoading(false);
    }
  }, [user]);

  const loadUserProgress = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const progressRef = doc(db, "userProgress", user.uid);
      const progressSnap = await getDoc(progressRef);

      if (progressSnap.exists()) {
        const data = progressSnap.data() as UserProgress;
        setCompletedLevels(data.completedLevels || []);
      } else {
        // Initialize new user progress document
        await setDoc(progressRef, {
          completedLevels: [],
          lastPlayedLevel: 1,
        });
        setCompletedLevels([]);
      }
    } catch (error) {
      console.error("Error loading user progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const markLevelComplete = async (levelNumber: number) => {
    // Update local state
    if (!completedLevels.includes(levelNumber)) {
      const updated = [...completedLevels, levelNumber].sort((a, b) => a - b);
      setCompletedLevels(updated);

      // Sync to Firestore if user is logged in
      if (user) {
        try {
          const progressRef = doc(db, "userProgress", user.uid);
          await updateDoc(progressRef, {
            completedLevels: updated,
            lastPlayedLevel: levelNumber,
          });
        } catch (error) {
          console.error("Error saving progress:", error);
        }
      }
    }
  };

  const getNextIncompleteLevel = (): number => {
    // Find the first level that isn't completed
    let nextLevel = 1;
    while (completedLevels.includes(nextLevel)) {
      nextLevel++;
    }
    return nextLevel;
  };

  const isLevelComplete = (levelNumber: number): boolean => {
    return completedLevels.includes(levelNumber);
  };

  return (
    <UserProgressContext.Provider
      value={{
        completedLevels,
        markLevelComplete,
        getNextIncompleteLevel,
        isLevelComplete,
        loading,
      }}
    >
      {children}
    </UserProgressContext.Provider>
  );
}

export function useUserProgress() {
  const context = useContext(UserProgressContext);
  if (context === undefined) {
    throw new Error(
      "useUserProgress must be used within a UserProgressProvider",
    );
  }
  return context;
}
