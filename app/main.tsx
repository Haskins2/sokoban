import { LEVELS } from "@/assets/levels";
import { GameGestureWrapper } from "@/components/game/GameGestureWrapper";
import { SokobanBoard } from "@/components/game/SokobanBoard";
import { LevelConfig } from "@/components/game/types";
import { useSokoban } from "@/components/game/useSokoban";
import { UserMenu } from "@/components/UserMenu";
import { useUserProgress } from "@/contexts/UserProgressContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
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
  const { markLevelComplete } = useUserProgress();

  useEffect(() => {
    if (levelData) {
      try {
        const parsed = JSON.parse(levelData as string);
        setLevel(parsed);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Fallback to level 1 from Firestore if no param
      fetchLevel(1);
    }
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
        // If we were trying to go next, maybe stay on current?
        // If initial load failed, maybe go to editor?
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
  } = useSokoban(safeLevel);

  const safeMove = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      move(direction);
    },
    [move],
  );

  // Mark level as complete when won
  useEffect(() => {
    if (isWon && safeLevel.levelNumber) {
      markLevelComplete(safeLevel.levelNumber);
    }
  }, [isWon, safeLevel.levelNumber, markLevelComplete]);

  // Track completed sub-levels and show notification
  const [prevCompletedSubLevels, setPrevCompletedSubLevels] = useState<
    number[]
  >([]);
  useEffect(() => {
    if (
      completedSubLevels &&
      completedSubLevels.length > prevCompletedSubLevels.length
    ) {
      // Find newly completed sub-levels
      const newlyCompleted = completedSubLevels.filter(
        (id) => !prevCompletedSubLevels.includes(id),
      );
      if (newlyCompleted.length > 0) {
        setJustCompletedSubLevel(newlyCompleted[0]);
        setTimeout(() => setJustCompletedSubLevel(null), 2000);
      }
      setPrevCompletedSubLevels(completedSubLevels);
    }
  }, [completedSubLevels, prevCompletedSubLevels]);

  // Handle chapter complete - show message for 3 seconds then navigate home
  useEffect(() => {
    if (isChapterComplete) {
      const timer = setTimeout(() => {
        router.push("/home");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isChapterComplete, router]);

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
      <TouchableOpacity
        onPress={() => router.push("/home")}
        style={styles.homeButton}
      >
        <MaterialIcons name="home" size={32} color="white" />
      </TouchableOpacity>
      <UserMenu />

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
          <Text style={styles.resetButtonText}>Reset Chapter</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={undo} style={styles.undoButton}>
          <Text style={styles.undoButtonText}>Undo</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.navButtons}>
        <TouchableOpacity
          onPress={() => router.push("/level_select")}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>Select Level</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/level_editor")}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>Level Editor</Text>
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
    paddingTop: 60,
    backgroundColor: "transparent",
  },
  homeButton: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  gameContainer: {
    marginTop: 200,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 30,
    marginBottom: 50,
  },
  resetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#333",
    borderRadius: 8,
    marginRight: 10,
  },
  resetButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  undoButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#555",
    borderRadius: 8,
  },
  undoButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  navButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
  },
  navButton: {
    padding: 10,
    backgroundColor: "#2196F3",
    borderRadius: 8,
  },
  navButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
