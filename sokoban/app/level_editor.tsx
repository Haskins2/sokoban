import React, { useState, useEffect } from "react";
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
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
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

  // New state for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<"add" | "remove">("add");

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleGlobalUp = () => setIsDragging(false);
      window.addEventListener("pointerup", handleGlobalUp);
      return () => window.removeEventListener("pointerup", handleGlobalUp);
    }
  }, []);

  const [walls, setWalls] = useState<Position[]>([]);
  const [boxes, setBoxes] = useState<Position[]>([]);
  const [goals, setGoals] = useState<Position[]>([]);
  const [player, setPlayer] = useState<Position | null>(null);

  const isAt = (x: number, y: number, arr: Position[]) =>
    arr.some((p) => p.x === x && p.y === y);

  const removeAt = (x: number, y: number, arr: Position[]) =>
    arr.filter((p) => p.x !== x || p.y !== y);

  const paintTile = (x: number, y: number, action: "add" | "remove") => {
    switch (selectedTool) {
      case "wall":
        if (action === "add") {
          setWalls((prev) => {
            if (isAt(x, y, prev)) return prev;
            return [...prev, { x, y }];
          });
          setBoxes((prev) => removeAt(x, y, prev));
          setGoals((prev) => removeAt(x, y, prev));
          setPlayer((prev) => (prev?.x === x && prev?.y === y ? null : prev));
        } else {
          setWalls((prev) => removeAt(x, y, prev));
        }
        break;
      case "floor":
        setWalls((prev) => removeAt(x, y, prev));
        setBoxes((prev) => removeAt(x, y, prev));
        setGoals((prev) => removeAt(x, y, prev));
        setPlayer((prev) => (prev?.x === x && prev?.y === y ? null : prev));
        break;
      case "box":
        setWalls((prev) => removeAt(x, y, prev));
        setPlayer((prev) => (prev?.x === x && prev?.y === y ? null : prev));
        if (action === "add") {
          setBoxes((prev) => {
            if (isAt(x, y, prev)) return prev;
            return [...prev, { x, y }];
          });
        } else {
          setBoxes((prev) => removeAt(x, y, prev));
        }
        break;
      case "goal":
        setWalls((prev) => removeAt(x, y, prev));
        if (action === "add") {
          setGoals((prev) => {
            if (isAt(x, y, prev)) return prev;
            return [...prev, { x, y }];
          });
        } else {
          setGoals((prev) => removeAt(x, y, prev));
        }
        break;
      case "player":
        setWalls((prev) => removeAt(x, y, prev));
        setBoxes((prev) => removeAt(x, y, prev));
        if (action === "add") {
          setPlayer({ x, y });
        } else {
          setPlayer((prev) => (prev?.x === x && prev?.y === y ? null : prev));
        }
        break;
      case "delete":
        setWalls((prev) => removeAt(x, y, prev));
        setBoxes((prev) => removeAt(x, y, prev));
        setGoals((prev) => removeAt(x, y, prev));
        setPlayer((prev) => (prev?.x === x && prev?.y === y ? null : prev));
        break;
    }
  };

  const handlePointerDown = (x: number, y: number) => {
    setIsDragging(true);
    let action: "add" | "remove" = "add";

    if (selectedTool === "wall" && isAt(x, y, walls)) action = "remove";
    else if (selectedTool === "box" && isAt(x, y, boxes)) action = "remove";
    else if (selectedTool === "goal" && isAt(x, y, goals)) action = "remove";
    else if (selectedTool === "player" && player?.x === x && player?.y === y)
      action = "remove";
    else if (selectedTool === "delete") action = "remove";

    setDragAction(action);
    paintTile(x, y, action);
  };

  const handlePointerEnter = (x: number, y: number) => {
    if (isDragging) {
      paintTile(x, y, dragAction);
    }
  };

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

  const saveLevel = async (force = false) => {
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

    const docId = `level_${levelNumber}`;
    const docRef = doc(db, "levels", docId);

    if (!force) {
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          if (Platform.OS === "web") {
            if (
              window.confirm(`Level ${levelNumber} already exists. Overwrite?`)
            ) {
              saveLevel(true);
            } else {
              setStatusMsg("Save cancelled");
            }
          } else {
            Alert.alert(
              "Overwrite?",
              `Level ${levelNumber} already exists. Overwrite?`,
              [
                {
                  text: "Cancel",
                  onPress: () => setStatusMsg("Save cancelled"),
                  style: "cancel",
                },
                { text: "Overwrite", onPress: () => saveLevel(true) },
              ]
            );
          }
          return;
        }
      } catch (e) {
        console.error("Error checking document: ", e);
        setStatusMsg("Error checking level existence");
        return;
      }
    }

    try {
      await setDoc(docRef, {
        ...levelConfig,
        levelNumber: parseInt(levelNumber),
        createdAt: new Date(),
      });
      console.log("Document written with ID: ", docId);
      setStatusMsg("Saved to Firestore!");
      if (Platform.OS === "web") {
        window.alert("Level saved successfully to Firestore!");
      } else {
        Alert.alert("Success", "Level saved successfully to Firestore!");
      }
    } catch (e) {
      console.error("Error adding document: ", e);
      setStatusMsg("Error saving to Firestore");
      Alert.alert("Error", "Failed to save level to Firestore");
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

        const tileProps =
          Platform.OS === "web"
            ? {
                onPointerDown: (e: any) => {
                  e.preventDefault();
                  handlePointerDown(x, y);
                },
                onPointerEnter: (e: any) => {
                  e.preventDefault();
                  handlePointerEnter(x, y);
                },
              }
            : {
                onPress: () => handleTilePress(x, y),
              };

        row.push(
          <TouchableOpacity
            key={`${x}-${y}`}
            style={[styles.tile, { width: tileSize, height: tileSize }]}
            {...tileProps}
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
          Saves to Firestore 'levels' collection
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
