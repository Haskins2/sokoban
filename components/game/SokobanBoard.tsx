import React, { useEffect } from "react";
import { Dimensions, Image, StyleSheet, View, Text } from "react-native";
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
};

interface Props {
  level: LevelConfig;
  gameState: GameState;
  lastMove: MoveSequence | null;
  doorOpen: boolean;
  openDoors?: Set<number>;
  justCompletedSubLevel?: number | null;
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
        withTiming(1, { duration: 200 })
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

  const closedImage = door.orientation === 'lr'
    ? IMAGES.doorClosedLr
    : IMAGES.doorClosedUd;
  const openImage = door.orientation === 'lr'
    ? IMAGES.doorOpenLr
    : IMAGES.doorOpenUd;

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
      if (lastMove.direction === 'left') {
        setFacingLeft(true);
      } else if (lastMove.direction === 'right') {
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
}) => {
  const { width, height } = level;

  const screenWidth = Dimensions.get("window").width;
  const maxTileWidth = (screenWidth - 40) / width;
  const tileSize = Math.min(maxTileWidth, 50);

  // Camera system
  const { cameraX, cameraY, cameraScale } = useCamera(
    level,
    gameState,
    tileSize
  );

  const cameraStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cameraX.value },
      { translateY: cameraY.value },
      { scale: cameraScale.value },
    ],
  }));

  // Render static grid (walls, floors, goals)
  const renderGrid = () => {
    const rows = [];

    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const isGoal = level.goals.some((g) => g.x === x && g.y === y);

        // Find the tile at this position
        const tile = level.tiles?.find((t) => t.x === x && t.y === y);
        const tileType = (tile?.tileType as TileType) || "floor";

        // Camera trigger tiles render as floor with special indicator
        const isCameraTrigger = tileType === "cameraFollow" || tileType === "cameraLockArea";
        const displayTileType = isCameraTrigger ? "floor" : tileType;
        const tileImage = IMAGES[displayTileType as keyof typeof IMAGES];
        const isWall = displayTileType !== "floor";

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
            {isCameraTrigger && (
              <View
                style={{
                  width: tileSize,
                  height: tileSize,
                  borderWidth: 2,
                  borderColor: tileType === "cameraFollow" ? "rgba(0, 255, 0, 0.6)" : "rgba(0, 150, 255, 0.6)",
                }}
              />
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
      {/* Completion message overlay */}
      {justCompletedSubLevel !== null && justCompletedSubLevel !== undefined && (
        <View style={styles.completionOverlay}>
          <Text style={styles.completionText}>
            Level {justCompletedSubLevel} Complete!
          </Text>
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
          {level.subLevels && level.subLevels.map((area) => {
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
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
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
    top: 40,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: "center",
  },
  completionText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
});
