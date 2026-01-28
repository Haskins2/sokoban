import { useEffect, useState } from "react";
import {
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { GameState, LevelConfig } from "./types";

export const useCamera = (
  level: LevelConfig,
  gameState: GameState,
  tileSize: number,
) => {
  // Current zoom (can change via triggers)
  const [currentZoom, setCurrentZoom] = useState(level.followZoom ?? 3.0);

  // Calculate initial camera position centered on player
  const getInitialPosition = () => {
    const boardWidth = level.width * tileSize;
    const boardHeight = level.height * tileSize;
    const playerCenterX = gameState.player.x * tileSize + tileSize / 2;
    const playerCenterY = gameState.player.y * tileSize + tileSize / 2;
    const initialZoom = level.followZoom ?? 2.0;
    return {
      x: (boardWidth / 2 - playerCenterX) * initialZoom,
      y: (boardHeight / 2 - playerCenterY) * initialZoom,
      scale: initialZoom,
    };
  };

  const initial = getInitialPosition();
  const cameraX = useSharedValue(initial.x);
  const cameraY = useSharedValue(initial.y);
  const cameraScale = useSharedValue(initial.scale);

  // Always follow player, check for zoom triggers
  useEffect(() => {
    // Check for zoom triggers
    if (level.cameraTriggers) {
      const trigger = level.cameraTriggers.find(
        (t) => t.x === gameState.player.x && t.y === gameState.player.y,
      );
      if (
        trigger &&
        "targetZoom" in trigger &&
        trigger.targetZoom !== currentZoom
      ) {
        setCurrentZoom(trigger.targetZoom);
      }
    }

    // Follow player
    const boardWidth = level.width * tileSize;
    const boardHeight = level.height * tileSize;
    const playerCenterX = gameState.player.x * tileSize + tileSize / 2;
    const playerCenterY = gameState.player.y * tileSize + tileSize / 2;

    const targetX = (boardWidth / 2 - playerCenterX) * currentZoom;
    const targetY = (boardHeight / 2 - playerCenterY) * currentZoom;

    cameraX.value = withSpring(targetX, { damping: 100, stiffness: 150 });
    cameraY.value = withSpring(targetY, { damping: 100, stiffness: 150 });
    cameraScale.value = withTiming(currentZoom, { duration: 400 });
  }, [
    gameState.player.x,
    gameState.player.y,
    currentZoom,
    level.cameraTriggers,
    level.width,
    level.height,
    tileSize,
    cameraX,
    cameraY,
    cameraScale,
  ]);

  return {
    cameraX,
    cameraY,
    cameraScale,
  };
};
