import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { LevelConfig, Position } from "@/components/game/types";

// Re-using images from SokobanBoard (assuming they are at these paths)
const IMAGES = {
  wall: require("../assets/soko_images/wall.png"),
  floor: require("../assets/soko_images/floor.png"),
  box: require("../assets/soko_images/box.png"),
};

type Tool = "wall" | "floor" | "box" | "goal" | "player" | "delete";

const DEFAULT_WIDTH = 8;
const DEFAULT_HEIGHT = 8;

export default function LevelEditor() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [levelNumber, setLevelNumber] = useState("1");
  const [selectedTool, setSelectedTool] = useState<Tool>("wall");
  const [statusMsg, setStatusMsg] = useState("");

  const [walls, setWalls] = useState<Position[]>([]);
  const [boxes, setBoxes] = useState<Position[]>([]);
  const [goals, setGoals] = useState<Position[]>([]);
  const [player, setPlayer] = useState<Position | null>(null);

  const isAt = (x: number, y: number, arr: Position[]) =>
    arr.some((p) => p.x === x && p.y === y);

  const removeAt = (x: number, y: number, arr: Position[]) =>
    arr.filter((p) => p.x !== x || p.y !== y);

  const handleTilePress = (x: number, y: number) => {
    switch (selectedTool) {
      case "wall":
        if (isAt(x, y, walls)) {
          setWalls(removeAt(x, y, walls));
        } else {
          setWalls([...walls, { x, y }]);
          setBoxes(removeAt(x, y, boxes));
          setGoals(removeAt(x, y, goals));
          if (player?.x === x && player?.y === y) setPlayer(null);
        }
        break;
      case "floor":
        setWalls(removeAt(x, y, walls));
        setBoxes(removeAt(x, y, boxes));
        setGoals(removeAt(x, y, goals));
        if (player?.x === x && player?.y === y) setPlayer(null);
        break;
      case "box":
        setWalls(removeAt(x, y, walls));
        if (player?.x === x && player?.y === y) setPlayer(null);

        if (isAt(x, y, boxes)) {
          setBoxes(removeAt(x, y, boxes));
        } else {
          setBoxes([...boxes, { x, y }]);
        }
        break;
      case "goal":
        setWalls(removeAt(x, y, walls));

        if (isAt(x, y, goals)) {
          setGoals(removeAt(x, y, goals));
        } else {
          setGoals([...goals, { x, y }]);
        }
        break;
      case "player":
        setWalls(removeAt(x, y, walls));
        setBoxes(removeAt(x, y, boxes));

        if (player?.x === x && player?.y === y) {
          setPlayer(null);
        } else {
          setPlayer({ x, y });
        }
        break;
      case "delete":
        setWalls(removeAt(x, y, walls));
        setBoxes(removeAt(x, y, boxes));
        setGoals(removeAt(x, y, goals));
        if (player?.x === x && player?.y === y) setPlayer(null);
        break;
    }
  };

  const saveLevel = async () => {
    console.log("saveLevel: Function called");
    setStatusMsg("Saving...");
    if (!player) {
      console.log("saveLevel: No player position set");
      setStatusMsg("Error: Place a player first!");
      Alert.alert("Error", "Level must have a player start position");
      return;
    }

    const levelConfig: LevelConfig = {
      width,
      height,
      walls,
      boxes,
      goals,
      initialPlayer: player,
    };

    const json = JSON.stringify(levelConfig, null, 2);
    console.log("saveLevel: JSON generated", json);

    // Copy to clipboard
    try {
      console.log("saveLevel: Attempting to copy to clipboard");
      await Clipboard.setStringAsync(json);
      console.log("saveLevel: Copied to clipboard");
      setStatusMsg("Copied to clipboard!");
      if (Platform.OS === "web") {
        window.alert(
          "Level JSON copied to clipboard! Paste it into a file in assets/levels/."
        );
      } else {
        Alert.alert(
          "Level Copied!",
          "The level JSON has been copied to your clipboard. Create a new file in 'assets/levels/' and paste the content there."
        );
      }
    } catch (error) {
      console.error("saveLevel: Clipboard error", error);
      setStatusMsg("Error copying to clipboard");
      Alert.alert(
        "Error",
        "Failed to copy to clipboard: " + (error as any).message
      );
    }

    const fileName = `level_${levelNumber}.json`;

    if (Platform.OS === "web") {
      return;
    }

    // Use type assertion to avoid TS error if types are missing
    const docDir = (FileSystem as any).documentDirectory;
    console.log("saveLevel: Document directory", docDir);
    if (!docDir) {
      console.error("saveLevel: No document directory");
      Alert.alert("Error", "Could not determine document directory");
      return;
    }
    const fileUri = docDir + fileName;
    console.log("saveLevel: File URI", fileUri);

    try {
      console.log("saveLevel: Writing file");
      await FileSystem.writeAsStringAsync(fileUri, json);
      console.log("saveLevel: File written");

      if (await Sharing.isAvailableAsync()) {
        console.log("saveLevel: Sharing file");
        await Sharing.shareAsync(fileUri);
      } else {
        console.log("saveLevel: Sharing not available");
        Alert.alert("Saved", `Level saved to ${fileUri}`);
      }
    } catch (error) {
      console.error("saveLevel: File system error", error);
      Alert.alert("Error", "Failed to save level: " + (error as any).message);
    }
  };

  // Calculate tile size
  const screenWidth = Dimensions.get("window").width;
  const sidebarWidth = 100;
  const availableWidth = screenWidth - sidebarWidth - 40; // padding
  const tileSize = Math.min(availableWidth / width, 40);

  const renderGrid = () => {
    const rows = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const isWall = isAt(x, y, walls);
        const isBox = isAt(x, y, boxes);
        const isGoal = isAt(x, y, goals);
        const isPlayer = player?.x === x && player?.y === y;

        row.push(
          <TouchableOpacity
            key={`${x}-${y}`}
            style={[styles.tile, { width: tileSize, height: tileSize }]}
            onPress={() => handleTilePress(x, y)}
          >
            <Image
              source={isWall ? IMAGES.wall : IMAGES.floor}
              style={{ width: "100%", height: "100%", position: "absolute" }}
            />
            {isGoal && !isWall && <View style={styles.goalIndicator} />}
            {isBox && (
              <Image
                source={IMAGES.box}
                style={{ width: "100%", height: "100%" }}
              />
            )}
            {isPlayer && <View style={styles.playerIndicator} />}
          </TouchableOpacity>
        );
      }
      rows.push(
        <View key={y} style={styles.row}>
          {row}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Level Editor" }} />

      <View style={styles.sidebar}>
        <Text style={styles.label}>Level #</Text>
        <TextInput
          style={styles.input}
          value={levelNumber}
          onChangeText={setLevelNumber}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Size</Text>
        <View style={styles.sizeInputs}>
          <TextInput
            style={[styles.input, styles.sizeInput]}
            value={width.toString()}
            onChangeText={(t) => setWidth(parseInt(t) || 5)}
            keyboardType="numeric"
          />
          <Text style={styles.x}>x</Text>
          <TextInput
            style={[styles.input, styles.sizeInput]}
            value={height.toString()}
            onChangeText={(t) => setHeight(parseInt(t) || 5)}
            keyboardType="numeric"
          />
        </View>

        <Text style={styles.label}>Tools</Text>
        {(["wall", "floor", "box", "goal", "player", "delete"] as Tool[]).map(
          (tool) => (
            <TouchableOpacity
              key={tool}
              style={[
                styles.toolButton,
                selectedTool === tool && styles.selectedTool,
                tool === "delete" && styles.deleteButton,
              ]}
              onPress={() => setSelectedTool(tool)}
            >
              <Text
                style={[
                  styles.toolText,
                  selectedTool === tool && styles.selectedToolText,
                  tool === "delete" && styles.deleteButtonText,
                ]}
              >
                {tool.charAt(0).toUpperCase() + tool.slice(1)}
              </Text>
            </TouchableOpacity>
          )
        )}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => {
            console.log("Save button pressed");
            saveLevel();
          }}
        >
          <Text style={styles.saveButtonText}>Save Level</Text>
        </TouchableOpacity>

        {statusMsg ? <Text style={styles.statusText}>{statusMsg}</Text> : null}

        <Text style={styles.instruction}>
          1. Click Save Level (copies to clipboard) 2. Run 'npm run save-level'
          in terminal
        </Text>
      </View>

      <ScrollView
        style={styles.mainArea}
        contentContainerStyle={styles.gridContainer}
      >
        <View style={styles.gridBoard}>{renderGrid()}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
  },
  sidebar: {
    width: 120,
    padding: 10,
    backgroundColor: "#333",
    borderRightWidth: 1,
    borderRightColor: "#444",
  },
  mainArea: {
    flex: 1,
  },
  gridContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  gridBoard: {
    borderWidth: 1,
    borderColor: "#555",
  },
  row: {
    flexDirection: "row",
  },
  tile: {
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#222",
    color: "white",
    padding: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  sizeInputs: {
    flexDirection: "row",
    alignItems: "center",
  },
  sizeInput: {
    flex: 1,
    textAlign: "center",
  },
  x: {
    color: "#aaa",
    marginHorizontal: 5,
  },
  toolButton: {
    padding: 10,
    backgroundColor: "#444",
    borderRadius: 4,
    marginBottom: 5,
    alignItems: "center",
  },
  selectedTool: {
    backgroundColor: "#2196F3",
  },
  toolText: {
    color: "#ccc",
    fontSize: 12,
  },
  selectedToolText: {
    color: "white",
    fontWeight: "bold",
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: "#d32f2f",
  },
  deleteButtonText: {
    color: "white",
  },
  instruction: {
    color: "#888",
    fontSize: 10,
    marginTop: 10,
    textAlign: "center",
  },
  statusText: {
    color: "#4CAF50",
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  goalIndicator: {
    position: "absolute",
    width: "40%",
    height: "40%",
    borderRadius: 999,
    backgroundColor: "rgba(76, 175, 80, 0.8)",
  },
  playerIndicator: {
    position: "absolute",
    width: "60%",
    height: "60%",
    borderRadius: 999,
    backgroundColor: "red",
    zIndex: 10,
  },
});
