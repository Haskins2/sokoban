// Tracks completed levels per user
// Syncs progress to Firestore (userProgress collection)
// Works for both logged-in users and guests (local state only for guests)
// Auto-loads progress when user logs in

import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { db } from "../firebaseConfig";
import { useAuth } from "./AuthContext";

type UserProgress = {
  completedLevels: number[];
  lastPlayedLevel: number;
  stars?: Record<number, number>; // Level number -> star count (1-3)
};

type UserProgressContextType = {
  completedLevels: number[];
  stars: Record<number, number>;
  markLevelComplete: (
    levelNumber: number,
    starsEarned?: number,
  ) => Promise<void>;
  getNextIncompleteLevel: () => number;
  isLevelComplete: (levelNumber: number) => boolean;
  loading: boolean;
};

const UserProgressContext = createContext<UserProgressContextType | undefined>(
  undefined,
);

const GUEST_PROGRESS_KEY = "guest_user_progress";

export function UserProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [stars, setStars] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  // Load user progress from Firestore or AsyncStorage
  useEffect(() => {
    if (user) {
      loadUserProgress();
    } else {
      loadGuestProgress();
    }
  }, [user]);

  const loadGuestProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem(GUEST_PROGRESS_KEY);
      if (stored) {
        const data = JSON.parse(stored) as UserProgress;
        setCompletedLevels(data.completedLevels || []);
        setStars(data.stars || {});
      } else {
        setCompletedLevels([]);
        setStars({});
      }
    } catch (error) {
      console.error("Error loading guest progress", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const progressRef = doc(db, "userProgress", user.uid);
      const progressSnap = await getDoc(progressRef);

      if (progressSnap.exists()) {
        const data = progressSnap.data() as UserProgress;
        setCompletedLevels(data.completedLevels || []);
        setStars(data.stars || {});
      } else {
        // Initialize new user progress document
        await setDoc(progressRef, {
          completedLevels: [],
          lastPlayedLevel: 1,
          stars: {},
        });
        setCompletedLevels([]);
        setStars({});
      }
    } catch (error) {
      console.error("Error loading user progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const markLevelComplete = useCallback(
    async (levelNumber: number, starsEarned: number = 0) => {
      // 1. Calculate new completed levels
      const isNewCompletion = !completedLevels.includes(levelNumber);
      const updatedCompletedLevels = isNewCompletion
        ? [...completedLevels, levelNumber].sort((a, b) => a - b)
        : completedLevels;

      // 2. Calculate new stars (only update if higher)
      const currentStars = stars[levelNumber] || 0;
      const newStars = Math.max(currentStars, starsEarned);
      const updatedStars = { ...stars, [levelNumber]: newStars };

      // 3. Update local state
      setCompletedLevels(updatedCompletedLevels);
      setStars(updatedStars);

      // 4. Persist
      if (user) {
        try {
          const progressRef = doc(db, "userProgress", user.uid);
          await updateDoc(progressRef, {
            completedLevels: updatedCompletedLevels,
            lastPlayedLevel: levelNumber,
            stars: updatedStars,
          });
        } catch (error) {
          console.error("Error saving progress:", error);
        }
      } else {
        // Save for guest
        try {
          const data: UserProgress = {
            completedLevels: updatedCompletedLevels,
            lastPlayedLevel: levelNumber,
            stars: updatedStars,
          };
          await AsyncStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(data));
        } catch (error) {
          console.error("Error saving guest progress:", error);
        }
      }
    },
    [user, completedLevels, stars],
  );

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
        stars,
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
