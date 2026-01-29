import React, { useEffect, useMemo } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Door, GameState, LevelConfig, MoveSequence, TileType } from "./types";
import { useCamera } from "./useCamera";

// Tilesheet images
const IMAGES = {
  wall1x1: require("../../assets/images/tilesheet/1x1_wall.png"),
  wallBLInner: require("../../assets/images/tilesheet/BL_wall_inner.png"),
  wallBLOuter: require("../../assets/images/tilesheet/BL_wall_outer.png"),
  wallBottom: require("../../assets/images/tilesheet/Bottom_wall.png"),
  box: require("../../assets/images/tilesheet/Box.png"),
  wallBRInner: require("../../assets/images/tilesheet/BR_wall_inner.png"),
  wallBROuter: require("../../assets/images/tilesheet/BR_wall_outer.png"),
  floor: require("../../assets/images/tilesheet/Floor.png"),
  goal: require("../../assets/images/tilesheet/Goal.png"),
  wallLeft: require("../../assets/images/tilesheet/Left_wall.png"),
  playerLeft: require("../../assets/images/tilesheet/Player_facing_left.png"),
  playerRight: require("../../assets/images/tilesheet/Player_facing_right.png"),
  wallRight: require("../../assets/images/tilesheet/Right_wall.png"),
  wallTLInner: require("../../assets/images/tilesheet/TL_wall_inner.png"),
  wallTLOuter: require("../../assets/images/tilesheet/TL_Wall_outer.png"),
  wallTop: require("../../assets/images/tilesheet/Top_wall.png"),
  wallTRInner: require("../../assets/images/tilesheet/TR_wall_inner.png"),
  wallTROuter: require("../../assets/images/tilesheet/TR_wall_outer.png"),
  doorClosedLr: require("../../assets/images/tilesheet/door_closed_lr.png"),
  doorOpenLr: require("../../assets/images/tilesheet/door_open_lr.png"),
  doorClosedUd: require("../../assets/images/tilesheet/door_closed_ud.png"),
  doorOpenUd: require("../../assets/images/tilesheet/door_open_ud.png"),
  finish: require("../../assets/images/tilesheet/Finish.png"),
};

const LEVEL_COMPLETE_IMAGES: { [key: number]: any } = {
  1: require("../../assets/images/level_complete_text/level_1_complete.png"),
  2: require("../../assets/images/level_complete_text/level_2_complete.png"),
  3: require("../../assets/images/level_complete_text/level_3_complete.png"),
  4: require("../../assets/images/level_complete_text/level_4_complete.png"),
  5: require("../../assets/images/level_complete_text/level_5_complete.png"),
  6: require("../../assets/images/level_complete_text/level_6_complete.png"),
  7: require("../../assets/images/level_complete_text/level_7_complete.png"),
};

const CHAPTER_COMPLETE_IMAGES: { [key: number]: any } = {
  1: require("../../assets/images/chapter_complete_text/chapter_1_complete.png"),
  2: require("../../assets/images/chapter_complete_text/chapter_2_complete.png"),
};

interface Props {
  level: LevelConfig;
  gameState: GameState;
  lastMove: MoveSequence | null;
  doorOpen: boolean;
  openDoors?: Set<number>;
  justCompletedSubLevel?: number | null;
  isChapterComplete?: boolean;
}

const TILE_DURATION = 30;

const AnimatedDoor = ({
  door,
  doorOpen,
  tileSize,
}: {
  door: Door;
  doorOpen: boolean;
  tileSize: number;
}) => {
  const opacity = useSharedValue(1);
  const [visible, setVisible] = React.useState(true);

  useEffect(() => {
    if (doorOpen) {
      // Simple fade from closed to open
      opacity.value = withSequence(
        withTiming(0, { duration: 200 }),
        withTiming(1, { duration: 200 }),
      );

      // Hide door after 1 second
      const timer = setTimeout(() => {
        setVisible(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      opacity.value = 1;
      setVisible(true);
    }
  }, [doorOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const closedImage =
    door.orientation === "lr" ? IMAGES.doorClosedLr : IMAGES.doorClosedUd;
  const openImage =
    door.orientation === "lr" ? IMAGES.doorOpenLr : IMAGES.doorOpenUd;

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.absolute,
        {
          left: door.x * tileSize,
          top: door.y * tileSize,
          width: tileSize,
          height: tileSize,
          zIndex: 3,
        },
        animatedStyle,
      ]}
    >
      <Image
        source={doorOpen ? openImage : closedImage}
        style={{ width: tileSize, height: tileSize }}
        resizeMode="stretch"
      />
    </Animated.View>
  );
};

const AnimatedPlayer = ({
  x,
  y,
  tileSize,
  lastMove,
}: {
  x: number;
  y: number;
  tileSize: number;
  lastMove: MoveSequence | null;
}) => {
  const svX = useSharedValue(x * tileSize);
  const svY = useSharedValue(y * tileSize);
  const [facingLeft, setFacingLeft] = React.useState(false);

  useEffect(() => {
    if (lastMove && lastMove.playerPath.length > 1) {
      // Update player direction based on last move
      if (lastMove.direction === "left") {
        setFacingLeft(true);
      } else if (lastMove.direction === "right") {
        setFacingLeft(false);
      }
      // Keep same direction for up/down movements

      // Animate sequence
      const path = lastMove.playerPath;
      const startPos = path[0];
      svX.value = startPos.x * tileSize;
      svY.value = startPos.y * tileSize;

      const sequenceX = path.slice(1).map((p) =>
        withTiming(p.x * tileSize, {
          duration: TILE_DURATION,
          easing: Easing.linear,
        }),
      );
      const sequenceY = path.slice(1).map((p) =>
        withTiming(p.y * tileSize, {
          duration: TILE_DURATION,
          easing: Easing.linear,
        }),
      );

      if (sequenceX.length) svX.value = withSequence(...sequenceX);
      if (sequenceY.length) svY.value = withSequence(...sequenceY);
    } else {
      // Snap
      cancelAnimation(svX);
      cancelAnimation(svY);
      svX.value = x * tileSize;
      svY.value = y * tileSize;
    }
  }, [lastMove, x, y, tileSize]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: svX.value }, { translateY: svY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.absolute,
        style,
        { width: tileSize, height: tileSize, zIndex: 10 },
      ]}
    >
      <Image
        source={facingLeft ? IMAGES.playerLeft : IMAGES.playerRight}
        style={{
          width: tileSize,
          height: tileSize,
        }}
        resizeMode="stretch"
      />
    </Animated.View>
  );
};

const AnimatedBox = ({
  index,
  x,
  y,
  tileSize,
  lastMove,
}: {
  index: number;
  x: number;
  y: number;
  tileSize: number;
  lastMove: MoveSequence | null;
}) => {
  const svX = useSharedValue(x * tileSize);
  const svY = useSharedValue(y * tileSize);

  useEffect(() => {
    if (lastMove && lastMove.boxMoved && lastMove.boxMoved.index === index) {
      const path = lastMove.boxMoved.path;
      const playerPath = lastMove.playerPath;

      // Delay calculation
      // Box path length includes start position.
      // If player moves 5 steps (path len 6), box moves 2 steps (path len 3).
      // Delay steps = 6 - 3 = 3 steps.
      const delaySteps = playerPath.length - path.length;
      const delayTime = delaySteps * TILE_DURATION;

      const startPos = path[0];
      svX.value = startPos.x * tileSize;
      svY.value = startPos.y * tileSize;

      const sequenceX = path.slice(1).map((p) =>
        withTiming(p.x * tileSize, {
          duration: TILE_DURATION,
          easing: Easing.linear,
        }),
      );
      const sequenceY = path.slice(1).map((p) =>
        withTiming(p.y * tileSize, {
          duration: TILE_DURATION,
          easing: Easing.linear,
        }),
      );

      if (sequenceX.length)
        svX.value = withDelay(delayTime, withSequence(...sequenceX));
      if (sequenceY.length)
        svY.value = withDelay(delayTime, withSequence(...sequenceY));
    } else {
      cancelAnimation(svX);
      cancelAnimation(svY);
      svX.value = x * tileSize;
      svY.value = y * tileSize;
    }
  }, [lastMove, x, y, tileSize, index]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: svX.value }, { translateY: svY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.absolute,
        style,
        { width: tileSize, height: tileSize, zIndex: 5 },
      ]}
    >
      <Image
        source={IMAGES.box}
        style={{
          width: tileSize,
          height: tileSize,
        }}
        resizeMode="stretch"
      />
    </Animated.View>
  );
};

export const SokobanBoard: React.FC<Props> = ({
  level,
  gameState,
  lastMove,
  doorOpen,
  openDoors,
  justCompletedSubLevel,
  isChapterComplete,
}) => {
  const { width, height } = level;

  // Track which completion message to display (only one at a time)
  const [activeOverlay, setActiveOverlay] = React.useState<{
    type: "level" | "chapter" | null;
    levelId?: number;
  }>({ type: null });

  // Use a ref to track the current timeout so we can clear it when a new overlay appears
  const overlayTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Handle level completion overlay
  useEffect(() => {
    if (justCompletedSubLevel !== null && justCompletedSubLevel !== undefined) {
      // Clear any existing timer
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }

      setActiveOverlay({ type: "level", levelId: justCompletedSubLevel });

      // Clear after 1 second
      overlayTimerRef.current = setTimeout(() => {
        setActiveOverlay({ type: null });
        overlayTimerRef.current = null;
      }, 1000);
    }
  }, [justCompletedSubLevel]);

  // Handle chapter completion overlay (takes priority as most recent)
  useEffect(() => {
    if (isChapterComplete) {
      // Clear any existing timer (e.g., from level completion)
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }

      setActiveOverlay({ type: "chapter" });

      // Clear after 3 seconds
      overlayTimerRef.current = setTimeout(() => {
        setActiveOverlay({ type: null });
        overlayTimerRef.current = null;
      }, 3000);
    }
  }, [isChapterComplete]);

  // Debug logging
  useEffect(() => {
    console.log("Level finishPosition:", level.finishPosition);
    console.log("Level chapterNumber:", level.chapterNumber);
    console.log("isChapterComplete:", isChapterComplete);
  }, [level.finishPosition, level.chapterNumber, isChapterComplete]);

  const screenWidth = Dimensions.get("window").width;
  const maxTileWidth = (screenWidth - 40) / width;
  const tileSize = Math.min(maxTileWidth, 50);

  // Camera system
  const { cameraX, cameraY, cameraScale } = useCamera(
    level,
    gameState,
    tileSize,
  );

  const cameraStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cameraX.value },
      { translateY: cameraY.value },
      { scale: cameraScale.value },
    ],
  }));

  // Pre-compute lookup maps for O(1) access instead of O(n²) array searches
  const tileMap = useMemo(() => {
    const map = new Map<string, TileType>();
    level.tiles?.forEach((t) =>
      map.set(`${t.x},${t.y}`, t.tileType as TileType),
    );
    return map;
  }, [level.tiles]);

  const goalSet = useMemo(() => {
    const set = new Set<string>();
    level.goals.forEach((g) => set.add(`${g.x},${g.y}`));
    return set;
  }, [level.goals]);

  const triggerMap = useMemo(() => {
    const map = new Map<string, number>();
    level.cameraTriggers?.forEach((t) =>
      map.set(`${t.x},${t.y}`, t.targetZoom),
    );
    return map;
  }, [level.cameraTriggers]);

  // Render static grid (walls, floors, goals)
  const renderGrid = () => {
    const rows = [];

    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`;
        const isGoal = goalSet.has(key);
        const isFinish =
          level.finishPosition &&
          level.finishPosition.x === x &&
          level.finishPosition.y === y;

        // Get the tile type at this position using O(1) lookup
        const tileType = tileMap.get(key) || "floor";

        // Camera zoom trigger tiles render as floor with special indicator
        const isCameraZoom = tileType === "cameraZoom";
        const displayTileType = isCameraZoom ? "floor" : tileType;
        const tileImage = IMAGES[displayTileType as keyof typeof IMAGES];
        const isWall = displayTileType !== "floor";

        // Get zoom value for this trigger if it exists using O(1) lookup
        const zoomValue = isCameraZoom ? triggerMap.get(key) : undefined;

        row.push(
          <View key={`${x}-${y}`} style={{ width: tileSize, height: tileSize }}>
            <Image
              source={tileImage}
              style={{
                width: tileSize,
                height: tileSize,
                position: "absolute",
              }}
              resizeMode="stretch"
            />
            {isGoal && !isWall && (
              <Image
                source={IMAGES.goal}
                style={{
                  width: tileSize,
                  height: tileSize,
                }}
                resizeMode="stretch"
              />
            )}
            {isFinish && (
              <Image
                source={IMAGES.finish}
                style={{
                  width: tileSize,
                  height: tileSize,
                }}
                resizeMode="stretch"
              />
            )}
            {isCameraZoom && (
              <View
                style={{
                  width: tileSize,
                  height: tileSize,
                  borderWidth: 2,
                  borderColor: "rgba(255, 165, 0, 0.8)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {zoomValue !== undefined && (
                  <Text
                    style={{
                      color: "rgba(255, 165, 0, 0.9)",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    {zoomValue}x
                  </Text>
                )}
              </View>
            )}
          </View>,
        );
      }
      rows.push(
        <View key={y} style={styles.row}>
          {row}
        </View>,
      );
    }
    return rows;
  };

  return (
    <View style={styles.container}>
      {/* Single completion message overlay - shows most recent */}
      {activeOverlay.type === "level" &&
        activeOverlay.levelId !== undefined &&
        LEVEL_COMPLETE_IMAGES[activeOverlay.levelId] && (
          <View style={styles.completionOverlay}>
            <Image
              source={LEVEL_COMPLETE_IMAGES[activeOverlay.levelId]}
              style={styles.completionImage}
              resizeMode="contain"
            />
          </View>
        )}

      {activeOverlay.type === "chapter" &&
        level.chapterNumber &&
        CHAPTER_COMPLETE_IMAGES[level.chapterNumber] && (
          <View style={styles.completionOverlay}>
            <Image
              source={CHAPTER_COMPLETE_IMAGES[level.chapterNumber]}
              style={styles.completionImage}
              resizeMode="contain"
            />
          </View>
        )}

      <Animated.View style={cameraStyle}>
        <View style={{ width: width * tileSize, height: height * tileSize }}>
          {/* Static Grid Layer */}
          <View style={styles.absolute}>{renderGrid()}</View>

          {/* Door Layer - Legacy single door */}
          {level.door && !level.subLevels && (
            <AnimatedDoor
              door={level.door}
              doorOpen={doorOpen}
              tileSize={tileSize}
            />
          )}

          {/* Door Layer - Sub-level doors */}
          {level.subLevels &&
            level.subLevels.map((area) => {
              if (!area.door) return null;
              const isDoorOpen = openDoors?.has(area.id) ?? false;
              return (
                <AnimatedDoor
                  key={area.id}
                  door={area.door}
                  doorOpen={isDoorOpen}
                  tileSize={tileSize}
                />
              );
            })}

          {/* Dynamic Layer */}
          {gameState.boxes.map((box, i) => (
            <AnimatedBox
              key={i}
              index={i}
              x={box.x}
              y={box.y}
              tileSize={tileSize}
              lastMove={lastMove}
            />
          ))}

          <AnimatedPlayer
            x={gameState.player.x}
            y={gameState.player.y}
            tileSize={tileSize}
            lastMove={lastMove}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: "row",
  },
  centered: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  completionOverlay: {
    position: "absolute",
    top: -120,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: "center",
    paddingTop: 20,
  },
  completionImage: {
    width: "80%",
    height: 80,
  },
});
