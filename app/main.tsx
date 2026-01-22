import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { SokobanBoard } from "@/components/game/SokobanBoard";
import { Dpad } from "@/components/game/Dpad";
import { useSokoban } from "@/components/game/useSokoban";
import { LevelConfig } from "@/components/game/types";
import { LEVELS } from "@/assets/levels";

const INITIAL_LEVEL = LEVELS[0];

export default function HomeScreen() {
  const router = useRouter();
  const { levelData } = useLocalSearchParams();
  const [level, setLevel] = useState<LevelConfig | null>(null);
  const [loading, setLoading] = useState(false);

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
        setLevel(snap.data() as LevelConfig);
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

  const handleNext = () => {
    if (safeLevel && safeLevel.levelNumber) {
      fetchLevel(safeLevel.levelNumber + 1);
    }
  };

  // Safe fallback for hook
  const safeLevel = level || INITIAL_LEVEL;
  const { gameState, move, reset, undo, isWon, lastMove } =
    useSokoban(safeLevel);

  const safeMove = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      if (!isWon) {
        move(direction);
      }
    },
    [move, isWon]
  );

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key.toLowerCase()) {
          case "w":
            safeMove("up");
            break;
          case "a":
            safeMove("left");
            break;
          case "s":
            safeMove("down");
            break;
          case "d":
            safeMove("right");
            break;
          case "q":
            reset();
            break;
          case "e":
            undo();
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [safeMove, reset, undo]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Sokoban {safeLevel.levelNumber ? `#${safeLevel.levelNumber}` : ""}
      </Text>
      <View style={styles.gameContainer}>
        <SokobanBoard
          level={safeLevel}
          gameState={gameState}
          lastMove={lastMove}
        />
      </View>
      <Dpad onMove={safeMove} />
      {isWon && (
        <View style={styles.winOverlay}>
          <View style={styles.winContainer}>
            <Text style={styles.winText}>You Win!</Text>
            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <Text style={styles.nextButtonText}>Next Level</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={reset} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset Level</Text>
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
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  gameContainer: {
    marginBottom: 20,
  },
  winText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 30,
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
  editorButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#2196F3",
    borderRadius: 8,
  },
  editorButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  winOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  winContainer: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
  },
  nextButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  nextButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
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
