import React, { useEffect } from "react";
import { View, StyleSheet, Image, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { LevelConfig, GameState, MoveSequence } from "./types";

const IMAGES = {
  wall: require("../../assets/soko_images/wall.png"),
  floor: require("../../assets/soko_images/floor.png"),
  box: require("../../assets/soko_images/box.png"),
};

interface Props {
  level: LevelConfig;
  gameState: GameState;
  lastMove: MoveSequence | null;
}

const TILE_DURATION = 50;

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

  useEffect(() => {
    if (lastMove && lastMove.playerPath.length > 1) {
      // Animate sequence
      const path = lastMove.playerPath;
      // Start from index 1 (0 is current pos before move, but we might have already snapped?
      // No, if we use lastMove, we assume we are at start of animation)

      // Actually, if we just rendered, x/y are the FINAL positions.
      // So we should initialize shared values to START position if animating.
      // But useEffect runs after render.

      // Better: Reset to start, then animate.
      const startPos = path[0];
      svX.value = startPos.x * tileSize;
      svY.value = startPos.y * tileSize;

      const sequenceX = path
        .slice(1)
        .map((p) =>
          withTiming(p.x * tileSize, {
            duration: TILE_DURATION,
            easing: Easing.linear,
          })
        );
      const sequenceY = path
        .slice(1)
        .map((p) =>
          withTiming(p.y * tileSize, {
            duration: TILE_DURATION,
            easing: Easing.linear,
          })
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
      <View style={[styles.centered, { width: tileSize, height: tileSize }]}>
        <View
          style={[
            styles.player,
            {
              width: tileSize * 0.6,
              height: tileSize * 0.6,
              borderRadius: tileSize * 0.3,
            },
          ]}
        />
      </View>
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

      const sequenceX = path
        .slice(1)
        .map((p) =>
          withTiming(p.x * tileSize, {
            duration: TILE_DURATION,
            easing: Easing.linear,
          })
        );
      const sequenceY = path
        .slice(1)
        .map((p) =>
          withTiming(p.y * tileSize, {
            duration: TILE_DURATION,
            easing: Easing.linear,
          })
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
        style={{ width: tileSize, height: tileSize }}
      />
    </Animated.View>
  );
};

export const SokobanBoard: React.FC<Props> = ({
  level,
  gameState,
  lastMove,
}) => {
  const { width, height } = level;

  const screenWidth = Dimensions.get("window").width;
  const maxTileWidth = (screenWidth - 40) / width;
  const tileSize = Math.min(maxTileWidth, 50);

  // Render static grid (walls, floors, goals)
  const renderGrid = () => {
    const rows = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const isWall = level.walls.some((w) => w.x === x && w.y === y);
        const isGoal = level.goals.some((g) => g.x === x && g.y === y);

        row.push(
          <View key={`${x}-${y}`} style={{ width: tileSize, height: tileSize }}>
            <Image
              source={isWall ? IMAGES.wall : IMAGES.floor}
              style={{
                width: tileSize,
                height: tileSize,
                position: "absolute",
              }}
            />
            {isGoal && !isWall && (
              <View
                style={[styles.centered, { width: tileSize, height: tileSize }]}
              >
                <View
                  style={{
                    width: tileSize * 0.4,
                    height: tileSize * 0.4,
                    borderRadius: tileSize * 0.2,
                    backgroundColor: "#4CAF50",
                  }}
                />
              </View>
            )}
          </View>
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
      <View style={{ width: width * tileSize, height: height * tileSize }}>
        {/* Static Grid Layer */}
        <View style={styles.absolute}>{renderGrid()}</View>

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
  player: {
    backgroundColor: "red",
  },
});
