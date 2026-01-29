import { LEVELS } from "@/assets/levels";
import { GameGestureWrapper } from "@/components/game/GameGestureWrapper";
import { SokobanBoard } from "@/components/game/SokobanBoard";
import { TimerDisplay } from "@/components/game/TimerDisplay";
import { LevelConfig } from "@/components/game/types";
import { useSokoban } from "@/components/game/useSokoban";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProgress } from "@/contexts/UserProgressContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";

const INITIAL_LEVEL = LEVELS[0];

export default function HomeScreen() {
  const router = useRouter();
  const { levelData } = useLocalSearchParams();
  const [level, setLevel] = useState<LevelConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const { user } = useAuth();
  const { markLevelComplete } = useUserProgress();

  const loadLevel = async () => {
    if (!levelData) {
      // Fallback to level 1 from Firestore if no param provided
      await fetchLevel(1);
      return;
    }

    try {
      const parsed = JSON.parse(levelData as string);
      setLevel(parsed);
    } catch (error) {
      console.error("Failed to parse level data:", error);
      // Fallback to level 1 on parse error
      await fetchLevel(1);
    }
  };

  useEffect(() => {
    loadLevel();
  }, [levelData]);

  const fetchLevel = async (num: number) => {
    setLoading(true);
    try {
      const docRef = doc(db, "levels", `level_${num}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const levelData = snap.data() as LevelConfig;
        setLevel(levelData);
      } else {
        Alert.alert("Finished", "No more levels!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setJustCompletedSubLevel(null);
    setPrevCompletedSubLevels([]);
  };

  // Safe fallback for hook
  const safeLevel = level || INITIAL_LEVEL;

  const [justCompletedSubLevel, setJustCompletedSubLevel] = useState<
    number | null
  >(null);

  const {
    gameState,
    move,
    reset,
    undo,
    isWon,
    lastMove,
    doorOpen,
    openDoors,
    completedSubLevels,
    isChapterComplete,
    timerState,
    moveCount,
  } = useSokoban(safeLevel);

  const safeMove = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      move(direction);
    },
    [move],
  );

  // Mark level as complete when won
  // run when level is won, safeLevel.levelNumber changes
  useEffect(() => {
    if (isWon && safeLevel.levelNumber) {
      markLevelComplete(safeLevel.levelNumber);
    }
  }, [isWon, safeLevel.levelNumber, markLevelComplete]);

  // Track completed sub-levels to detect new ones
  const [prevCompletedSubLevels, setPrevCompletedSubLevels] = useState<
    number[]
  >([]);

  useEffect(() => {
    // Check if there are new completions
    if (
      !completedSubLevels ||
      completedSubLevels.length <= prevCompletedSubLevels.length
    ) {
      return;
    }

    // Find newly completed sub-levels
    const newlyCompleted = completedSubLevels.filter(
      (id) => !prevCompletedSubLevels.includes(id),
    );

    // Show notification for the first newly completed sub-level
    if (newlyCompleted.length > 0) {
      setJustCompletedSubLevel(newlyCompleted[0]);

      // Clear notification after 2 seconds
      const timer = setTimeout(() => setJustCompletedSubLevel(null), 2000);
      return () => clearTimeout(timer);
    }

    // Update tracked list
    setPrevCompletedSubLevels(completedSubLevels);
  }, [completedSubLevels, prevCompletedSubLevels]);

  const uploadSpeedRun = async (
    levelNumber: number,
    time: number,
    moves: number,
  ) => {
    // Only upload if user is authenticated
    if (!user) {
      console.log("User not authenticated, skipping Firebase upload");
      return;
    }

    try {
      const levelId = `level_${levelNumber}`;
      const speedRunRef = doc(db, "speedRuns", levelId, "users", user.uid);

      await setDoc(speedRunRef, {
        time,
        timestamp: serverTimestamp(),
        moves,
        username: user.displayName || "Anonymous",
        chapterNumber: safeLevel.chapterNumber,
      });

      console.log(`Speed run uploaded for level ${levelNumber}: ${time}ms`);
    } catch (error) {
      console.error("Error uploading speed run:", error);
      Alert.alert(
        "Upload Failed",
        "Your time was saved locally, but couldn't be uploaded to the leaderboard. Please check your internet connection.",
      );
    }
  };

  // Load best time when level changes
  useEffect(() => {
    const loadBestTime = async () => {
      if (safeLevel.levelNumber) {
        try {
          const key = `bestTime_level_${safeLevel.levelNumber}`;
          const storedTime = await AsyncStorage.getItem(key);
          if (storedTime) {
            setBestTime(parseInt(storedTime, 10));
          } else {
            setBestTime(null);
          }
        } catch (e) {
          console.error("Error loading best time:", e);
        }
      }
    };
    loadBestTime();
  }, [safeLevel.levelNumber]);

  // Save best time when chapter is complete
  const handleChapterComplete = async () => {
    if (!safeLevel.levelNumber || timerState.elapsedTime <= 0) {
      return;
    }

    const key = `bestTime_level_${safeLevel.levelNumber}`;
    const isNewBestTime = !bestTime || timerState.elapsedTime < bestTime;

    if (!isNewBestTime) {
      return;
    }

    try {
      // Save to local storage
      await AsyncStorage.setItem(key, timerState.elapsedTime.toString());
      setBestTime(timerState.elapsedTime);
      console.log(
        `New best time for level ${safeLevel.levelNumber}: ${timerState.elapsedTime}ms`,
      );

      // Upload to Firebase
      await uploadSpeedRun(
        safeLevel.levelNumber,
        timerState.elapsedTime,
        moveCount,
      );
    } catch (error) {
      console.error("Error saving best time:", error);
    }
  };

  // Navigate home after chapter completion
  useEffect(() => {
    if (!isChapterComplete) {
      return;
    }

    // Save best time if it's a new record
    handleChapterComplete();

    // Navigate home after 3 seconds
    const timer = setTimeout(() => {
      router.push("/home");
    }, 3000);

    return () => clearTimeout(timer);
  }, [
    isChapterComplete,
    router,
    safeLevel.levelNumber,
    timerState.elapsedTime,
    bestTime,
  ]);

  // Advance level when player enters open door
  useEffect(() => {
    if (!safeLevel.subLevels || safeLevel.subLevels.length === 0) {
      // Legacy mode: single door
      if (
        doorOpen &&
        safeLevel.door &&
        gameState.player.x === safeLevel.door.x &&
        gameState.player.y === safeLevel.door.y
      ) {
        if (safeLevel.levelNumber) {
          fetchLevel(safeLevel.levelNumber + 1);
        }
      }
    } else {
      // Chapter mode: check final sub-level's door
      const finalArea = safeLevel.subLevels[safeLevel.subLevels.length - 1];
      if (
        openDoors &&
        openDoors.has(finalArea.id) &&
        finalArea.door &&
        gameState.player.x === finalArea.door.x &&
        gameState.player.y === finalArea.door.y
      ) {
        if (safeLevel.levelNumber) {
          fetchLevel(safeLevel.levelNumber + 1);
        }
      }
    }
  }, [
    doorOpen,
    openDoors,
    gameState.player,
    safeLevel.door,
    safeLevel.subLevels,
    safeLevel.levelNumber,
  ]);

  // Use refs to avoid re-attaching event listener on every state change
  const safeMoveRef = useRef(safeMove);
  const resetRef = useRef(reset);
  const undoRef = useRef(undo);

  // Keep refs up to date
  safeMoveRef.current = safeMove;
  resetRef.current = reset;
  undoRef.current = undo;

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key.toLowerCase()) {
          case "w":
            safeMoveRef.current("up");
            break;
          case "a":
            safeMoveRef.current("left");
            break;
          case "s":
            safeMoveRef.current("down");
            break;
          case "d":
            safeMoveRef.current("right");
            break;
          case "q":
            resetRef.current();
            break;
          case "e":
            undoRef.current();
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []); // No dependencies - handler uses refs

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.push("/home")}>
          <Image
            source={require("../assets/images/main_menu/home_icon.png")}
            style={styles.headerIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Image
            source={require("../assets/images/main_menu/profile_icon.png")}
            style={styles.headerIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <TimerDisplay timerState={timerState} />

      <GameGestureWrapper onMove={safeMove}>
        <View style={styles.gameContainer}>
          <SokobanBoard
            level={safeLevel}
            gameState={gameState}
            lastMove={lastMove}
            doorOpen={doorOpen}
            openDoors={openDoors}
            justCompletedSubLevel={justCompletedSubLevel}
            isChapterComplete={isChapterComplete}
          />
        </View>
      </GameGestureWrapper>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Image
            source={require("../assets/images/main_buttons/reset_chapter.png")}
            style={styles.resetButtonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={undo} style={styles.undoButton}>
          <Image
            source={require("../assets/images/main_buttons/undo.png")}
            style={styles.undoButtonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 0,
    backgroundColor: "transparent",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 20,
    zIndex: 1000,
  },
  headerIcon: {
    width: 30,
    height: 30,
  },
  gameContainer: {
    marginTop: 100,
  },
  buttonContainer: {
    flexDirection: "row",
    marginBottom: 50,
    gap: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  resetButtonImage: {
    width: 200,
    height: 80,
  },
  undoButtonImage: {
    width: 150,
    height: 30,
    paddingBottom: 1,
  },
});
