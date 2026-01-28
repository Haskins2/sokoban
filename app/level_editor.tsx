import {
  CameraTrigger,
  Door,
  LevelConfig,
  Position,
  SubLevelArea,
  TilePosition,
} from "@/components/game/types";
import { UserMenu } from "@/components/UserMenu";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";

// Using new tilesheet - all 16x16 tiles
const IMAGES = {
  wall1x1: require("../assets/images/tilesheet/1x1_wall.png"),
  wallBLInner: require("../assets/images/tilesheet/BL_wall_inner.png"),
  wallBLOuter: require("../assets/images/tilesheet/BL_wall_outer.png"),
  wallBottom: require("../assets/images/tilesheet/Bottom_wall.png"),
  box: require("../assets/images/tilesheet/Box.png"),
  wallBRInner: require("../assets/images/tilesheet/BR_wall_inner.png"),
  wallBROuter: require("../assets/images/tilesheet/BR_wall_outer.png"),
  floor: require("../assets/images/tilesheet/Floor.png"),
  goal: require("../assets/images/tilesheet/Goal.png"),
  wallLeft: require("../assets/images/tilesheet/Left_wall.png"),
  playerLeft: require("../assets/images/tilesheet/Player_facing_left.png"),
  playerRight: require("../assets/images/tilesheet/Player_facing_right.png"),
  wallRight: require("../assets/images/tilesheet/Right_wall.png"),
  wallTLInner: require("../assets/images/tilesheet/TL_wall_inner.png"),
  wallTLOuter: require("../assets/images/tilesheet/TL_Wall_outer.png"),
  wallTop: require("../assets/images/tilesheet/Top_wall.png"),
  wallTRInner: require("../assets/images/tilesheet/TR_wall_inner.png"),
  wallTROuter: require("../assets/images/tilesheet/TR_wall_outer.png"),
  doorClosedLr: require("../assets/images/tilesheet/door_closed_lr.png"),
  doorOpenLr: require("../assets/images/tilesheet/door_open_lr.png"),
  doorClosedUd: require("../assets/images/tilesheet/door_closed_ud.png"),
  doorOpenUd: require("../assets/images/tilesheet/door_open_ud.png"),
};

type TileType =
  | "wall1x1"
  | "wallBLInner"
  | "wallBLOuter"
  | "wallBottom"
  | "wallBRInner"
  | "wallBROuter"
  | "floor"
  | "wallLeft"
  | "wallRight"
  | "wallTLInner"
  | "wallTLOuter"
  | "wallTop"
  | "wallTRInner"
  | "wallTROuter";

type Tool =
  | TileType
  | "box"
  | "goal"
  | "player"
  | "doorLr"
  | "doorUd"
  | "cameraFollow"
  | "cameraLockArea"
  | "autoWall"
  | "delete";

type TilePosition = Position & {
  tileType: TileType;
};

const TOOL_LABELS: Record<Tool, string> = {
  wall1x1: "1x1",
  wallBLInner: "BL",
  wallBLOuter: "BL",
  wallBottom: "Bottom",
  wallBRInner: "BR",
  wallBROuter: "BR",
  floor: "Floor",
  wallLeft: "Left",
  wallRight: "Right",
  wallTLInner: "TL",
  wallTLOuter: "TL",
  wallTop: "Top",
  wallTRInner: "TR",
  wallTROuter: "TR",
  box: "Box",
  goal: "Goal",
  player: "Player",
  doorLr: "Door H",
  doorUd: "Door V",
  cameraFollow: "Cam Follow",
  cameraLockArea: "Cam Lock",
  autoWall: "Auto Wall",
  delete: "Delete",
};

export default function LevelEditor() {
  const router = useRouter();
  const [levelNumber, setLevelNumber] = useState("1");
  const [selectedTool, setSelectedTool] = useState<Tool>("floor");
  const [statusMsg, setStatusMsg] = useState("");

  // New state for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<"add" | "remove">("add");

  // Infinite grid state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartX, setPanStartX] = useState(0);
  const [panStartY, setPanStartY] = useState(0);

  // Single tiles array that stores all placed tiles with their type
  const [tiles, setTiles] = useState<TilePosition[]>([]);
  const [boxes, setBoxes] = useState<Position[]>([]);
  const [goals, setGoals] = useState<Position[]>([]);
  const [player, setPlayer] = useState<Position | null>(null);
  const [door, setDoor] = useState<Door | null>(null);

  // Sub-level area state
  const [subLevelAreas, setSubLevelAreas] = useState<SubLevelArea[]>([]);
  const [isAreaMode, setIsAreaMode] = useState(false);
  const [areaStartPos, setAreaStartPos] = useState<Position | null>(null);
  const [areaEndPos, setAreaEndPos] = useState<Position | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [cameraTriggerTargets, setCameraTriggerTargets] = useState<
    Map<string, number>
  >(new Map());
  const [editingCameraTrigger, setEditingCameraTrigger] =
    useState<Position | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleGlobalUp = () => {
        setIsDragging(false);
        setIsPanning(false);
        if (isAreaMode && areaStartPos && areaEndPos) {
          // Finalize the area
          addArea(areaStartPos, areaEndPos);
          setAreaStartPos(null);
          setAreaEndPos(null);
        }
      };
      const handleGlobalMove = (e: PointerEvent) => {
        if (isPanning) {
          setPanX(e.clientX - panStartX);
          setPanY(e.clientY - panStartY);
        }
      };
      window.addEventListener("pointerup", handleGlobalUp);
      window.addEventListener("pointermove", handleGlobalMove);
      return () => {
        window.removeEventListener("pointerup", handleGlobalUp);
        window.removeEventListener("pointermove", handleGlobalMove);
      };
    }
  }, [isPanning, panStartX, panStartY, isAreaMode, areaStartPos, areaEndPos]);

  const isAt = (x: number, y: number, arr: Position[]) =>
    arr.some((p) => p.x === x && p.y === y);

  const removeAt = (x: number, y: number, arr: Position[]) =>
    arr.filter((p) => p.x !== x || p.y !== y);

  const getTileAt = (x: number, y: number): TilePosition | undefined =>
    tiles.find((t) => t.x === x && t.y === y);

  const removeTileAt = (x: number, y: number) =>
    tiles.filter((t) => t.x !== x || t.y !== y);

  const isFloorTile = (tileType?: TileType): boolean => {
    if (!tileType) return true; // Empty tiles are treated as floor
    return (
      tileType === "floor" ||
      tileType === "cameraFollow" ||
      tileType === "cameraLockArea"
    );
  };

  const determineAutoWallType = (x: number, y: number): TileType => {
    // Check all 8 neighbors
    const n = getTileAt(x, y - 1);
    const ne = getTileAt(x + 1, y - 1);
    const e = getTileAt(x + 1, y);
    const se = getTileAt(x + 1, y + 1);
    const s = getTileAt(x, y + 1);
    const sw = getTileAt(x - 1, y + 1);
    const w = getTileAt(x - 1, y);
    const nw = getTileAt(x - 1, y - 1);

    // Check where floor tiles are
    const floorN = isFloorTile(n?.tileType);
    const floorE = isFloorTile(e?.tileType);
    const floorS = isFloorTile(s?.tileType);
    const floorW = isFloorTile(w?.tileType);
    const floorNE = isFloorTile(ne?.tileType);
    const floorSE = isFloorTile(se?.tileType);
    const floorSW = isFloorTile(sw?.tileType);
    const floorNW = isFloorTile(nw?.tileType);

    // Count floor tiles in cardinal directions
    const floorCount = [floorN, floorE, floorS, floorW].filter(Boolean).length;

    // OUTER CORNERS: Floor on exactly 2 adjacent sides, no floor on opposite sides
    if (floorN && floorW && !floorE && !floorS) return "wallTLOuter";
    if (floorN && floorE && !floorW && !floorS) return "wallTROuter";
    if (floorS && floorW && !floorN && !floorE) return "wallBLOuter";
    if (floorS && floorE && !floorN && !floorW) return "wallBROuter";

    // INNER CORNERS: Floor on 2 adjacent sides AND the diagonal
    if (floorN && floorW && floorNW && !floorE && !floorS) return "wallTLInner";
    if (floorN && floorE && floorNE && !floorW && !floorS) return "wallTRInner";
    if (floorS && floorW && floorSW && !floorN && !floorE) return "wallBLInner";
    if (floorS && floorE && floorSE && !floorN && !floorW) return "wallBRInner";

    // STRAIGHT WALLS: Based on floor position
    // Top wall = floor is BELOW (south)
    if (floorS && !floorN) return "wallTop";
    // Bottom wall = floor is ABOVE (north)
    if (floorN && !floorS) return "wallBottom";
    // Left wall = floor is to the RIGHT (east)
    if (floorE && !floorW) return "wallLeft";
    // Right wall = floor is to the LEFT (west)
    if (floorW && !floorE) return "wallRight";

    // Default
    return "wall1x1";
  };

  const paintTile = (x: number, y: number, action: "add" | "remove") => {
    if (selectedTool === "delete") {
      setTiles(removeTileAt(x, y));
      setBoxes((prev) => removeAt(x, y, prev));
      setGoals((prev) => removeAt(x, y, prev));
      setPlayer((prev) => (prev?.x === x && prev?.y === y ? null : prev));
      setDoor((prev) => (prev?.x === x && prev?.y === y ? null : prev));
      // Also remove doors from sub-level areas
      setSubLevelAreas((prev) =>
        prev.map((area) =>
          area.door?.x === x && area.door?.y === y
            ? { ...area, door: undefined }
            : area,
        ),
      );
      return;
    }

    if (selectedTool === "autoWall") {
      if (action === "add") {
        const wallType = determineAutoWallType(x, y);
        setTiles((prev) => {
          const filtered = removeTileAt(x, y);
          return [...filtered, { x, y, tileType: wallType }];
        });
        setBoxes((prev) => removeAt(x, y, prev));
        setGoals((prev) => removeAt(x, y, prev));
        setPlayer((prev) => (prev?.x === x && prev?.y === y ? null : prev));
      } else {
        setTiles(removeTileAt(x, y));
      }
      return;
    }

    if (selectedTool === "cameraFollow" || selectedTool === "cameraLockArea") {
      if (action === "add") {
        setTiles((prev) => {
          const filtered = removeTileAt(x, y);
          return [...filtered, { x, y, tileType: selectedTool }];
        });
        setBoxes((prev) => removeAt(x, y, prev));
        setGoals((prev) => removeAt(x, y, prev));
        setPlayer((prev) => (prev?.x === x && prev?.y === y ? null : prev));

        // Show area selection dialog for camera lock tiles
        if (selectedTool === "cameraLockArea" && subLevelAreas.length > 0) {
          setEditingCameraTrigger({ x, y });
        }
      } else {
        setTiles(removeTileAt(x, y));
        // Remove camera trigger target mapping when deleting
        setCameraTriggerTargets((prev) => {
          const newMap = new Map(prev);
          newMap.delete(`${x},${y}`);
          return newMap;
        });
      }
      return;
    }

    if (selectedTool === "doorLr" || selectedTool === "doorUd") {
      if (action === "add") {
        const orientation = selectedTool === "doorLr" ? "lr" : "ud";
        setTiles((prev) => {
          const filtered = removeTileAt(x, y);
          return [...filtered, { x, y, tileType: "floor" }];
        });

        // Automatically detect which area this door belongs to
        const targetArea = subLevelAreas.find(
          (area) =>
            x >= area.bounds.minX &&
            x <= area.bounds.maxX &&
            y >= area.bounds.minY &&
            y <= area.bounds.maxY,
        );

        if (targetArea) {
          // Assign door to the detected area
          setSubLevelAreas((prev) =>
            prev.map((area) =>
              area.id === targetArea.id
                ? { ...area, door: { x, y, orientation } }
                : area,
            ),
          );
        } else {
          // No area found, set as global door (legacy mode)
          setDoor({ x, y, orientation });
        }

        setBoxes((prev) => removeAt(x, y, prev));
        setGoals((prev) => removeAt(x, y, prev));
        setPlayer((prev) => (prev?.x === x && prev?.y === y ? null : prev));
      } else {
        // Remove door - check all areas
        const areaWithDoor = subLevelAreas.find(
          (area) => area.door?.x === x && area.door?.y === y,
        );

        if (areaWithDoor) {
          setSubLevelAreas((prev) =>
            prev.map((area) =>
              area.id === areaWithDoor.id ? { ...area, door: undefined } : area,
            ),
          );
        } else {
          setDoor((prev) => (prev?.x === x && prev?.y === y ? null : prev));
        }
      }
      return;
    }

    if (selectedTool === "box") {
      if (action === "add") {
        setTiles((prev) => {
          const filtered = removeTileAt(x, y);
          return [...filtered, { x, y, tileType: "floor" }];
        });
        setBoxes((prev) => {
          if (isAt(x, y, prev)) return prev;
          return [...prev, { x, y }];
        });
        setPlayer((prev) => (prev?.x === x && prev?.y === y ? null : prev));
      } else {
        setBoxes((prev) => removeAt(x, y, prev));
      }
      return;
    }

    if (selectedTool === "goal") {
      if (action === "add") {
        setTiles((prev) => {
          const filtered = removeTileAt(x, y);
          return [...filtered, { x, y, tileType: "floor" }];
        });
        setGoals((prev) => {
          if (isAt(x, y, prev)) return prev;
          return [...prev, { x, y }];
        });
      } else {
        setGoals((prev) => removeAt(x, y, prev));
      }
      return;
    }

    if (selectedTool === "player") {
      if (action === "add") {
        setTiles((prev) => {
          const filtered = removeTileAt(x, y);
          return [...filtered, { x, y, tileType: "floor" }];
        });
        setPlayer({ x, y });
        setBoxes((prev) => removeAt(x, y, prev));
      } else {
        setPlayer((prev) => (prev?.x === x && prev?.y === y ? null : prev));
      }
      return;
    }

    // For tile types
    const tileType = selectedTool as TileType;
    if (action === "add") {
      setTiles((prev) => {
        const filtered = removeTileAt(x, y);
        return [...filtered, { x, y, tileType }];
      });
      // Remove box, goal, player if placing a non-floor tile
      if (tileType !== "floor") {
        setBoxes((prev) => removeAt(x, y, prev));
        setGoals((prev) => removeAt(x, y, prev));
        setPlayer((prev) => (prev?.x === x && prev?.y === y ? null : prev));
      }
    } else {
      setTiles(removeTileAt(x, y));
    }
  };

  const handlePointerDown = (x: number, y: number) => {
    if (isAreaMode) {
      // Area mode: start drawing area or select existing area
      const clickedArea = subLevelAreas.find(
        (a) =>
          x >= a.bounds.minX &&
          x <= a.bounds.maxX &&
          y >= a.bounds.minY &&
          y <= a.bounds.maxY,
      );
      if (clickedArea) {
        setSelectedAreaId(clickedArea.id);
      } else {
        setAreaStartPos({ x, y });
        setSelectedAreaId(null);
      }
      return;
    }

    setIsDragging(true);
    let action: "add" | "remove" = "add";

    const tile = getTileAt(x, y);
    if (selectedTool === "box" && isAt(x, y, boxes)) {
      action = "remove";
    } else if (selectedTool === "goal" && isAt(x, y, goals)) {
      action = "remove";
    } else if (
      selectedTool === "player" &&
      player?.x === x &&
      player?.y === y
    ) {
      action = "remove";
    } else if (selectedTool === "delete") {
      action = "remove";
    } else if (tile && tile.tileType === selectedTool) {
      action = "remove";
    }

    setDragAction(action);
    paintTile(x, y, action);
  };

  const handlePointerEnter = (x: number, y: number) => {
    if (isAreaMode && areaStartPos) {
      setAreaEndPos({ x, y });
    } else if (isDragging) {
      paintTile(x, y, dragAction);
    }
  };

  const handleTilePress = (x: number, y: number) => {
    const tile = getTileAt(x, y);
    let action: "add" | "remove" = "add";

    if (selectedTool === "box" && isAt(x, y, boxes)) {
      action = "remove";
    } else if (selectedTool === "goal" && isAt(x, y, goals)) {
      action = "remove";
    } else if (
      selectedTool === "player" &&
      player?.x === x &&
      player?.y === y
    ) {
      action = "remove";
    } else if (selectedTool === "delete") {
      action = "remove";
    } else if (tile && tile.tileType === selectedTool) {
      action = "remove";
    }

    paintTile(x, y, action);
  };

  const addArea = (start: Position, end: Position) => {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    const newArea: SubLevelArea = {
      id: subLevelAreas.length + 1,
      bounds: { minX, minY, maxX, maxY },
      boxIndices: [],
      goalIndices: [],
    };

    setSubLevelAreas((prev) => [...prev, newArea]);
  };

  const deleteSelectedArea = () => {
    if (selectedAreaId !== null) {
      setSubLevelAreas((prev) => prev.filter((a) => a.id !== selectedAreaId));
      setSelectedAreaId(null);
    }
  };

  const assignElementsToAreas = () => {
    return subLevelAreas.map((area) => {
      const boxIndices: number[] = [];
      const goalIndices: number[] = [];

      boxes.forEach((box, i) => {
        if (
          box.x >= area.bounds.minX &&
          box.x <= area.bounds.maxX &&
          box.y >= area.bounds.minY &&
          box.y <= area.bounds.maxY
        ) {
          boxIndices.push(i);
        }
      });

      goals.forEach((goal, i) => {
        if (
          goal.x >= area.bounds.minX &&
          goal.x <= area.bounds.maxX &&
          goal.y >= area.bounds.minY &&
          goal.y <= area.bounds.maxY
        ) {
          goalIndices.push(i);
        }
      });

      return { ...area, boxIndices, goalIndices };
    });
  };

  const extractCameraTriggers = (tiles: TilePosition[]): CameraTrigger[] => {
    return tiles
      .filter(
        (t) => t.tileType === "cameraFollow" || t.tileType === "cameraLockArea",
      )
      .map((t) => ({
        x: t.x,
        y: t.y,
        mode:
          t.tileType === "cameraFollow"
            ? ("follow" as const)
            : ("lockArea" as const),
        targetAreaId: cameraTriggerTargets.get(`${t.x},${t.y}`),
      }));
  };

  // Helper to remove undefined fields recursively (Firestore doesn't accept undefined)
  const removeUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return null;
    }
    if (Array.isArray(obj)) {
      return obj.map(removeUndefined);
    }
    if (typeof obj === "object") {
      const cleaned: any = {};
      Object.keys(obj).forEach((key) => {
        const value = removeUndefined(obj[key]);
        if (value !== null && value !== undefined) {
          cleaned[key] = value;
        }
      });
      return cleaned;
    }
    return obj;
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

    // Calculate bounding box
    const allPositions = [...tiles, ...boxes, ...goals, player];
    if (allPositions.length === 0) {
      setStatusMsg("Error: Level is empty!");
      Alert.alert("Error", "Level must have at least some elements");
      return;
    }

    const minX = Math.min(...allPositions.map((p) => p.x));
    const maxX = Math.max(...allPositions.map((p) => p.x));
    const minY = Math.min(...allPositions.map((p) => p.y));
    const maxY = Math.max(...allPositions.map((p) => p.y));

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    // Normalize positions to start from (0,0)
    const normalizePos = (p: Position) => ({ x: p.x - minX, y: p.y - minY });

    // Build walls array from tiles (any non-floor tile is considered a wall)
    const walls: Position[] = [];
    const normalizedTiles: TilePosition[] = [];

    // First, add all explicitly placed tiles
    tiles.forEach((tile) => {
      const normalized = { ...normalizePos(tile), tileType: tile.tileType };
      normalizedTiles.push(normalized);

      // Only add actual wall tiles to walls array (not floor or camera triggers)
      if (
        tile.tileType !== "floor" &&
        tile.tileType !== "cameraFollow" &&
        tile.tileType !== "cameraLockArea"
      ) {
        walls.push(normalizePos(tile));
      }
    });

    // Then, fill in any empty positions in the bounding box with floor tiles
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const hasExistingTile = normalizedTiles.some(
          (t) => t.x === x && t.y === y,
        );
        if (!hasExistingTile) {
          normalizedTiles.push({ x, y, tileType: "floor" });
        }
      }
    }

    const normalizedBoxes = boxes.map(normalizePos);
    const normalizedGoals = goals.map(normalizePos);
    const normalizedPlayer = normalizePos(player);

    console.log("Building level config...");
    console.log("Original boxes:", boxes);
    console.log("Normalized boxes:", normalizedBoxes);
    console.log("Original goals:", goals);
    console.log("Normalized goals:", normalizedGoals);
    console.log("Sub-level areas:", subLevelAreas);
    console.log("Camera triggers:", extractCameraTriggers(tiles));

    // Assign elements to areas using NORMALIZED positions
    const assignElementsToAreasNormalized = () => {
      return subLevelAreas.map((area) => {
        const boxIndices: number[] = [];
        const goalIndices: number[] = [];

        // Normalize area bounds first
        const normalizedAreaBounds = {
          minX: area.bounds.minX - minX,
          minY: area.bounds.minY - minY,
          maxX: area.bounds.maxX - minX,
          maxY: area.bounds.maxY - minY,
        };

        normalizedBoxes.forEach((box, i) => {
          if (
            box.x >= normalizedAreaBounds.minX &&
            box.x <= normalizedAreaBounds.maxX &&
            box.y >= normalizedAreaBounds.minY &&
            box.y <= normalizedAreaBounds.maxY
          ) {
            boxIndices.push(i);
          }
        });

        normalizedGoals.forEach((goal, i) => {
          if (
            goal.x >= normalizedAreaBounds.minX &&
            goal.x <= normalizedAreaBounds.maxX &&
            goal.y >= normalizedAreaBounds.minY &&
            goal.y <= normalizedAreaBounds.maxY
          ) {
            goalIndices.push(i);
          }
        });

        console.log(
          `Area ${area.id} - boxIndices:`,
          boxIndices,
          "goalIndices:",
          goalIndices,
        );
        return { ...area, boxIndices, goalIndices };
      });
    };

    const assignedAreas =
      subLevelAreas.length > 0 ? assignElementsToAreasNormalized() : [];

    // Validate indices
    assignedAreas.forEach((area) => {
      area.boxIndices.forEach((idx) => {
        if (idx < 0 || idx >= normalizedBoxes.length) {
          console.error(
            `Invalid box index ${idx} in area ${area.id}. Total boxes: ${normalizedBoxes.length}`,
          );
        }
      });
      area.goalIndices.forEach((idx) => {
        if (idx < 0 || idx >= normalizedGoals.length) {
          console.error(
            `Invalid goal index ${idx} in area ${area.id}. Total goals: ${normalizedGoals.length}`,
          );
        }
      });
    });

    const levelConfig: LevelConfig = {
      width,
      height,
      walls,
      boxes: normalizedBoxes,
      goals: normalizedGoals,
      initialPlayer: normalizedPlayer,
      tiles: normalizedTiles,
      door: door
        ? {
            x: door.x - minX,
            y: door.y - minY,
            orientation: door.orientation,
          }
        : undefined,
      subLevels:
        assignedAreas.length > 0
          ? assignedAreas.map((area) => ({
              ...area,
              bounds: {
                minX: area.bounds.minX - minX,
                minY: area.bounds.minY - minY,
                maxX: area.bounds.maxX - minX,
                maxY: area.bounds.maxY - minY,
              },
              door: area.door
                ? {
                    x: area.door.x - minX,
                    y: area.door.y - minY,
                    orientation: area.door.orientation,
                  }
                : undefined,
            }))
          : undefined,
      cameraTriggers:
        extractCameraTriggers(tiles).length > 0
          ? extractCameraTriggers(tiles).map((t) => ({
              ...normalizePos(t),
              mode: t.mode,
              targetAreaId: t.targetAreaId,
            }))
          : undefined,
      initialCameraState:
        assignedAreas.length > 0
          ? { mode: "lockedArea" as const, lockedAreaId: assignedAreas[0].id }
          : { mode: "fixed" as const },
    };

    console.log("Level config built:", JSON.stringify(levelConfig, null, 2));

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
              ],
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
      // Remove undefined fields (Firestore doesn't accept undefined)
      const cleanLevelConfig = removeUndefined(levelConfig);

      const dataToSave = {
        ...cleanLevelConfig,
        levelNumber: parseInt(levelNumber),
        createdAt: new Date(),
      };

      console.log("Attempting to save to Firestore...");
      console.log("Data to save:", JSON.stringify(dataToSave, null, 2));

      await setDoc(docRef, dataToSave);

      console.log("Document written with ID: ", docId);
      setStatusMsg("Saved to Firestore!");
      if (Platform.OS === "web") {
        window.alert("Level saved successfully to Firestore!");
      } else {
        Alert.alert("Success", "Level saved successfully to Firestore!");
      }
    } catch (e: any) {
      console.error("Error adding document: ", e);
      console.error("Error message:", e?.message);
      console.error("Error stack:", e?.stack);
      const errorMsg = `Error saving to Firestore: ${e?.message || e}`;
      setStatusMsg(errorMsg);
      if (Platform.OS === "web") {
        window.alert(
          `Failed to save level to Firestore.\n\nError: ${e?.message || e}\n\nCheck browser console for details.`,
        );
      } else {
        Alert.alert("Error", errorMsg);
      }
    }
  };

  // Calculate tile size
  const BASE_TILE_SIZE = 40;
  const tileSize = BASE_TILE_SIZE * zoom;

  // Handle zoom
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.25, Math.min(3, prev + delta)));
  };

  // Handle wheel zoom on web
  useEffect(() => {
    if (Platform.OS === "web") {
      const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          handleZoom(delta);
        }
      };
      window.addEventListener("wheel", handleWheel, { passive: false });
      return () => window.removeEventListener("wheel", handleWheel);
    }
  }, []);

  const renderGrid = () => {
    const screenWidth = Dimensions.get("window").width;
    const screenHeight = Dimensions.get("window").height;

    // Calculate visible grid range with some padding
    const minVisibleX = Math.floor(-panX / tileSize) - 2;
    const maxVisibleX = Math.ceil((screenWidth - panX) / tileSize) + 2;
    const minVisibleY = Math.floor(-panY / tileSize) - 2;
    const maxVisibleY = Math.ceil((screenHeight - panY) / tileSize) + 2;

    // Collect all placed positions
    const allPositions = new Set<string>();
    tiles.forEach((p) => allPositions.add(`${p.x},${p.y}`));
    boxes.forEach((p) => allPositions.add(`${p.x},${p.y}`));
    goals.forEach((p) => allPositions.add(`${p.x},${p.y}`));
    if (player) allPositions.add(`${player.x},${player.y}`);

    // Determine grid bounds to show
    let minX = minVisibleX;
    let maxX = maxVisibleX;
    let minY = minVisibleY;
    let maxY = maxVisibleY;

    // Expand to include all placed tiles
    if (allPositions.size > 0) {
      const positions = [...tiles, ...boxes, ...goals];
      if (player) positions.push(player);
      if (positions.length > 0) {
        minX = Math.min(minX, Math.min(...positions.map((p) => p.x)) - 2);
        maxX = Math.max(maxX, Math.max(...positions.map((p) => p.x)) + 2);
        minY = Math.min(minY, Math.min(...positions.map((p) => p.y)) - 2);
        maxY = Math.max(maxY, Math.max(...positions.map((p) => p.y)) + 2);
      }
    }

    const renderedTiles = [];

    // Render grid tiles
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tile = getTileAt(x, y);
        const isBox = isAt(x, y, boxes);
        const isGoal = isAt(x, y, goals);
        const isPlayer = player?.x === x && player?.y === y;

        // Check for door at this position (global or from sub-level areas)
        const globalDoor = door?.x === x && door?.y === y ? door : null;
        const areaDoor = subLevelAreas.find(
          (area) => area.door?.x === x && area.door?.y === y,
        )?.door;
        const isDoor = globalDoor || areaDoor;
        const doorAtPosition = isDoor ? globalDoor || areaDoor : null;

        const tileProps =
          Platform.OS === "web"
            ? {
                onPointerDown: (e: any) => {
                  if (!(e.button === 2 || e.shiftKey)) {
                    e.preventDefault();
                    handlePointerDown(x, y);
                  }
                },
                onPointerEnter: (e: any) => {
                  if (!isPanning) {
                    e.preventDefault();
                    handlePointerEnter(x, y);
                  }
                },
              }
            : {
                onPress: () => handleTilePress(x, y),
              };

        renderedTiles.push(
          <TouchableOpacity
            key={`${x}-${y}`}
            style={[
              styles.tile,
              {
                width: tileSize,
                height: tileSize,
                position: "absolute",
                left: x * tileSize,
                top: y * tileSize,
              },
            ]}
            {...tileProps}
          >
            {/* Show tile if placed */}
            {tile && (
              <>
                <Image
                  source={
                    tile.tileType === "cameraFollow" ||
                    tile.tileType === "cameraLockArea"
                      ? IMAGES.floor
                      : IMAGES[tile.tileType]
                  }
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                  }}
                  resizeMode="stretch"
                />
                {(tile.tileType === "cameraFollow" ||
                  tile.tileType === "cameraLockArea") && (
                  <>
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        borderWidth: 2,
                        borderColor:
                          tile.tileType === "cameraFollow"
                            ? "rgba(0, 255, 0, 0.8)"
                            : "rgba(0, 150, 255, 0.8)",
                        position: "absolute",
                      }}
                    />
                    {tile.tileType === "cameraLockArea" && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 2,
                          right: 2,
                          backgroundColor: "rgba(0, 150, 255, 0.9)",
                          paddingHorizontal: 4,
                          paddingVertical: 2,
                          borderRadius: 3,
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        >
                          {cameraTriggerTargets.get(`${x},${y}`) || "?"}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </>
            )}
            {isGoal && (
              <Image
                source={IMAGES.goal}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                resizeMode="stretch"
              />
            )}
            {isBox && (
              <Image
                source={IMAGES.box}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                resizeMode="stretch"
              />
            )}
            {isPlayer && (
              <Image
                source={IMAGES.playerRight}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                resizeMode="stretch"
              />
            )}
            {isDoor && doorAtPosition && (
              <Image
                source={
                  doorAtPosition.orientation === "lr"
                    ? IMAGES.doorClosedLr
                    : IMAGES.doorClosedUd
                }
                style={{ width: "100%", height: "100%" }}
                resizeMode="stretch"
              />
            )}
          </TouchableOpacity>,
        );
      }
    }

    return renderedTiles;
  };

  const renderToolButton = (tool: Tool, imageName?: keyof typeof IMAGES) => (
    <TouchableOpacity
      key={tool}
      style={[
        styles.toolButton,
        selectedTool === tool && styles.selectedTool,
        tool === "delete" && styles.deleteButton,
      ]}
      onPress={() => setSelectedTool(tool)}
    >
      <View style={styles.toolButtonContent}>
        {imageName && (
          <Image
            source={IMAGES[imageName]}
            style={styles.toolPreview}
            resizeMode="contain"
          />
        )}
        <Text
          style={[
            styles.toolText,
            selectedTool === tool && styles.selectedToolText,
            tool === "delete" && styles.deleteButtonText,
            imageName && { marginLeft: 4 },
          ]}
        >
          {TOOL_LABELS[tool]}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Level Editor" }} />
      <TouchableOpacity
        onPress={() => router.push("/home")}
        style={styles.homeButton}
      >
        <MaterialIcons name="home" size={32} color="white" />
      </TouchableOpacity>
      <UserMenu />

      <ScrollView
        style={styles.sidebar}
        contentContainerStyle={styles.sidebarContent}
      >
        <Text style={styles.label}>Level #</Text>
        <TextInput
          style={styles.input}
          value={levelNumber}
          onChangeText={setLevelNumber}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Zoom</Text>
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleZoom(-0.25)}
          >
            <Text style={styles.zoomButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleZoom(0.25)}
          >
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => {
            setPanX(0);
            setPanY(0);
            setZoom(1);
          }}
        >
          <Text style={styles.centerButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.centerButton, isAreaMode && styles.selectedTool]}
          onPress={() => setIsAreaMode(!isAreaMode)}
        >
          <Text style={styles.centerButtonText}>
            {isAreaMode ? "Tile Mode" : "Area Mode"}
          </Text>
        </TouchableOpacity>

        {selectedAreaId !== null && (
          <TouchableOpacity
            style={styles.deleteAreaButton}
            onPress={deleteSelectedArea}
          >
            <Text style={styles.deleteAreaButtonText}>
              Delete Area {selectedAreaId}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionHeader}>Floor</Text>
        {renderToolButton("floor", "floor")}

        <Text style={styles.sectionHeader}>Auto Wall</Text>
        {renderToolButton("autoWall", "wall1x1")}

        <Text style={styles.sectionHeader}>Walls</Text>
        {renderToolButton("wallTop", "wallTop")}
        {renderToolButton("wallLeft", "wallLeft")}
        {renderToolButton("wallBottom", "wallBottom")}
        {renderToolButton("wallRight", "wallRight")}

        <Text style={styles.sectionHeader}>Inner Corners</Text>
        {renderToolButton("wallTLInner", "wallTLInner")}
        {renderToolButton("wallTRInner", "wallTRInner")}
        {renderToolButton("wallBLInner", "wallBLInner")}
        {renderToolButton("wallBRInner", "wallBRInner")}

        <Text style={styles.sectionHeader}>Outer Corners</Text>
        {renderToolButton("wallTLOuter", "wallTLOuter")}
        {renderToolButton("wallTROuter", "wallTROuter")}
        {renderToolButton("wallBLOuter", "wallBLOuter")}
        {renderToolButton("wallBROuter", "wallBROuter")}

        <Text style={styles.sectionHeader}>1x1 Block</Text>
        {renderToolButton("wall1x1", "wall1x1")}

        <Text style={styles.sectionHeader}>Objects</Text>
        {renderToolButton("box", "box")}
        {renderToolButton("goal", "goal")}
        {renderToolButton("player", "playerRight")}

        <Text style={styles.sectionHeader}>Door</Text>
        {renderToolButton("doorLr", "doorClosedLr")}
        {renderToolButton("doorUd", "doorClosedUd")}

        <Text style={styles.sectionHeader}>Camera</Text>
        {renderToolButton("cameraFollow", "floor")}
        {renderToolButton("cameraLockArea", "floor")}

        {renderToolButton("delete")}

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
          {Platform.OS === "web"
            ? "Shift+drag or right-click to pan\nCtrl+scroll to zoom"
            : "Pinch to zoom"}
        </Text>
        <Text style={styles.instruction}>Saves to Firestore</Text>
      </ScrollView>

      <View
        style={styles.mainArea}
        onPointerDown={
          Platform.OS === "web"
            ? (e: any) => {
                if (e.button === 2 || e.shiftKey) {
                  e.preventDefault();
                  setIsPanning(true);
                  setPanStartX(e.clientX - panX);
                  setPanStartY(e.clientY - panY);
                }
              }
            : undefined
        }
        onContextMenu={
          Platform.OS === "web" ? (e: any) => e.preventDefault() : undefined
        }
      >
        <View
          style={[
            styles.gridContainer,
            {
              transform: [{ translateX: panX }, { translateY: panY }],
            },
          ]}
        >
          {renderGrid()}

          {/* Render sub-level area overlays */}
          {subLevelAreas.map((area) => (
            <View
              key={area.id}
              style={{
                position: "absolute",
                left: area.bounds.minX * tileSize,
                top: area.bounds.minY * tileSize,
                width: (area.bounds.maxX - area.bounds.minX + 1) * tileSize,
                height: (area.bounds.maxY - area.bounds.minY + 1) * tileSize,
                backgroundColor: `rgba(${(area.id * 50) % 255}, 100, 200, 0.2)`,
                borderWidth: 2,
                borderColor: selectedAreaId === area.id ? "#00ff00" : "#ffffff",
                pointerEvents: "none",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: "bold",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  padding: 2,
                }}
              >
                Area {area.id}
              </Text>
            </View>
          ))}

          {/* Render area preview while drawing */}
          {isAreaMode && areaStartPos && areaEndPos && (
            <View
              style={{
                position: "absolute",
                left: Math.min(areaStartPos.x, areaEndPos.x) * tileSize,
                top: Math.min(areaStartPos.y, areaEndPos.y) * tileSize,
                width: (Math.abs(areaEndPos.x - areaStartPos.x) + 1) * tileSize,
                height:
                  (Math.abs(areaEndPos.y - areaStartPos.y) + 1) * tileSize,
                backgroundColor: "rgba(100, 200, 100, 0.3)",
                borderWidth: 2,
                borderColor: "#00ff00",
                borderStyle: "dashed",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Camera Preview for Selected Area */}
          {selectedAreaId !== null &&
            (() => {
              const area = subLevelAreas.find((a) => a.id === selectedAreaId);
              if (!area) return null;

              const screenWidth = Dimensions.get("window").width;
              const screenHeight = Dimensions.get("window").height;

              // Use manual camera settings if defined, otherwise auto-calculate
              let cameraX, cameraY, cameraScale;
              if (
                area.cameraX !== undefined &&
                area.cameraY !== undefined &&
                area.cameraScale !== undefined
              ) {
                cameraX = area.cameraX;
                cameraY = area.cameraY;
                cameraScale = area.cameraScale;
              } else {
                // Auto-calculate
                const areaWidth =
                  (area.bounds.maxX - area.bounds.minX + 1) * tileSize;
                const areaHeight =
                  (area.bounds.maxY - area.bounds.minY + 1) * tileSize;
                const scaleX = (screenWidth * 0.95) / areaWidth;
                const scaleY = (screenHeight * 0.95) / areaHeight;
                cameraScale = Math.min(scaleX, scaleY, 1);

                const areaCenterX =
                  ((area.bounds.minX + area.bounds.maxX) / 2) * tileSize +
                  tileSize / 2;
                const areaCenterY =
                  ((area.bounds.minY + area.bounds.maxY) / 2) * tileSize +
                  tileSize / 2;

                cameraX = screenWidth / 2 - areaCenterX;
                cameraY = screenHeight / 2 - areaCenterY;
              }

              // Calculate what area is visible on screen
              // Reverse the camera transform to get the viewport in world coordinates
              const viewportLeft = -cameraX / zoom;
              const viewportTop = -cameraY / zoom;
              const viewportWidth = screenWidth / zoom;
              const viewportHeight = screenHeight / zoom;

              return (
                <View
                  style={{
                    position: "absolute",
                    left: viewportLeft,
                    top: viewportTop,
                    width: viewportWidth,
                    height: viewportHeight,
                    borderWidth: 3 / zoom,
                    borderColor: "#FF9800",
                    backgroundColor: "rgba(255, 152, 0, 0.1)",
                    pointerEvents: "none",
                  }}
                >
                  <Text
                    style={{
                      position: "absolute",
                      top: 5 / zoom,
                      left: 5 / zoom,
                      color: "#FF9800",
                      fontSize: 12 / zoom,
                      fontWeight: "bold",
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      padding: 4 / zoom,
                    }}
                  >
                    Camera View (Area {selectedAreaId})
                  </Text>
                </View>
              );
            })()}
        </View>
      </View>

      {/* Camera Trigger Area Selection Modal */}
      {editingCameraTrigger && subLevelAreas.length > 0 && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Target Area</Text>
            <Text style={styles.modalHelp}>
              Which area should this camera lock trigger to?
            </Text>
            <ScrollView style={styles.areaList}>
              {subLevelAreas.map((area) => (
                <TouchableOpacity
                  key={area.id}
                  style={styles.areaOption}
                  onPress={() => {
                    setCameraTriggerTargets((prev) => {
                      const newMap = new Map(prev);
                      newMap.set(
                        `${editingCameraTrigger.x},${editingCameraTrigger.y}`,
                        area.id,
                      );
                      return newMap;
                    });
                    setEditingCameraTrigger(null);
                  }}
                >
                  <Text style={styles.areaOptionText}>Area {area.id}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setEditingCameraTrigger(null)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
  },
  homeButton: {
    position: "absolute",
    top: 20,
    left: 100,
    padding: 10,
    zIndex: 10,
  },
  sidebar: {
    width: 90,
    backgroundColor: "#333",
    borderRightWidth: 1,
    borderRightColor: "#444",
  },
  sidebarContent: {
    padding: 6,
  },
  mainArea: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  gridContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  tile: {
    borderWidth: 0.5,
    borderColor: "rgba(100,100,100,0.2)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222",
  },
  label: {
    color: "#aaa",
    fontSize: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionHeader: {
    color: "#888",
    fontSize: 9,
    marginTop: 10,
    marginBottom: 3,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#222",
    color: "white",
    padding: 6,
    borderRadius: 3,
    marginBottom: 4,
    fontSize: 11,
  },
  zoomControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  zoomButton: {
    backgroundColor: "#444",
    width: 24,
    height: 24,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  zoomText: {
    color: "#aaa",
    fontSize: 10,
  },
  centerButton: {
    backgroundColor: "#555",
    padding: 6,
    borderRadius: 3,
    alignItems: "center",
    marginBottom: 6,
  },
  centerButtonText: {
    color: "#ccc",
    fontSize: 9,
  },
  toolButton: {
    padding: 5,
    backgroundColor: "#444",
    borderRadius: 3,
    marginBottom: 3,
    alignItems: "center",
  },
  toolButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  toolPreview: {
    width: 16,
    height: 16,
  },
  selectedTool: {
    backgroundColor: "#2196F3",
  },
  toolText: {
    color: "#ccc",
    fontSize: 9,
  },
  selectedToolText: {
    color: "white",
    fontWeight: "bold",
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: "#4CAF50",
    padding: 7,
    borderRadius: 3,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },
  deleteButton: {
    marginTop: 8,
    backgroundColor: "#d32f2f",
  },
  deleteAreaButton: {
    backgroundColor: "#d32f2f",
    padding: 6,
    borderRadius: 3,
    alignItems: "center",
    marginBottom: 6,
  },
  deleteAreaButtonText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  deleteButtonText: {
    color: "white",
  },
  instruction: {
    color: "#888",
    fontSize: 8,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 10,
  },
  statusText: {
    color: "#4CAF50",
    fontSize: 9,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "bold",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 20,
    minWidth: 250,
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalHelp: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
  },
  areaList: {
    maxHeight: 300,
  },
  areaOption: {
    backgroundColor: "#3a3a3a",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  areaOptionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalCancelButton: {
    backgroundColor: "#555",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  modalCancelText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  cameraSection: {
    backgroundColor: "#2a2a2a",
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  autoCalcButton: {
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 6,
  },
  autoCalcButtonText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  clearCameraButton: {
    backgroundColor: "#555",
    padding: 6,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 4,
  },
  clearCameraButtonText: {
    color: "white",
    fontSize: 9,
  },
});
