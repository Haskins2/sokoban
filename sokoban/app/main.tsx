import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { SokobanBoard } from "@/components/game/SokobanBoard";
import { Dpad } from "@/components/game/Dpad";
import { useSokoban } from "@/components/game/useSokoban";
import { LevelConfig } from "@/components/game/types";
import { LEVELS } from "@/assets/levels";

const INITIAL_LEVEL = LEVELS[0];

export default function HomeScreen() {
  const router = useRouter();
  const { gameState, move, reset, undo, isWon } = useSokoban(INITIAL_LEVEL);

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key.toLowerCase()) {
          case "w":
            move("up");
            break;
          case "a":
            move("left");
            break;
          case "s":
            move("down");
            break;
          case "d":
            move("right");
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
  }, [move, reset, undo]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sokoban</Text>
      <View style={styles.gameContainer}>
        <SokobanBoard level={INITIAL_LEVEL} gameState={gameState} />
      </View>
      {isWon && <Text style={styles.winText}>You Win!</Text>}
      <Dpad onMove={move} />
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={reset} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset Level</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={undo} style={styles.undoButton}>
          <Text style={styles.undoButtonText}>Undo</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={() => router.push("/level_editor")}
        style={styles.editorButton}
      >
        <Text style={styles.editorButtonText}>Level Editor</Text>
      </TouchableOpacity>
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
});
