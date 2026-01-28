import { useCallback, useEffect, useState } from "react";
import { Dimensions } from "react-native";
import {
  Easing,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { CameraState, GameState, LevelConfig } from "./types";

export const useCamera = (
  level: LevelConfig,
  gameState: GameState,
  tileSize: number,
) => {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  // Animated values for camera position and scale
  const cameraX = useSharedValue(0);
  const cameraY = useSharedValue(0);
  const cameraScale = useSharedValue(1);

  // Current camera mode
  const [cameraState, setCameraState] = useState<CameraState>(() => {
    // If level has sub-levels, automatically lock to first sub-level
    if (level.subLevels && level.subLevels.length > 0) {
      const firstArea = level.subLevels[0];
      console.log("useCamera: initializing to lock to area", firstArea.id);
      return { mode: "lockedArea", lockedAreaId: firstArea.id };
    }
    // Otherwise use configured state or default to fixed
    console.log("useCamera: initializing to fixed mode");
    return level.initialCameraState || { mode: "fixed" };
  });

  // Detect camera triggers when player position changes
  useEffect(() => {
    if (level.cameraTriggers) {
      const trigger = level.cameraTriggers.find(
        (t) => t.x === gameState.player.x && t.y === gameState.player.y,
      );

      if (trigger) {
        console.log(
          "Camera trigger detected at",
          gameState.player,
          ":",
          trigger,
        );
        if (trigger.mode === "follow") {
          console.log("Switching to follow mode");
          setCameraState({ mode: "follow" });
        } else if (
          trigger.mode === "lockArea" &&
          trigger.targetAreaId !== undefined
        ) {
          console.log(
            "Switching to lock area mode, target:",
            trigger.targetAreaId,
          );
          setCameraState({
            mode: "lockedArea",
            lockedAreaId: trigger.targetAreaId,
          });
        }
      }
    }
  }, [gameState.player, level.cameraTriggers]);

  // Lock camera to show entire area
  const lockToArea = useCallback(
    (areaId: number) => {
      const area = level.subLevels?.find((a) => a.id === areaId);
      if (!area) {
        console.log("lockToArea: area not found for id", areaId);
        return;
      }

      console.log("lockToArea: locking to area", areaId, area);

      // Auto-calculate camera position to fit area in view
      const areaWidth = (area.bounds.maxX - area.bounds.minX + 1) * tileSize;
      const areaHeight = (area.bounds.maxY - area.bounds.minY + 1) * tileSize;

      // Calculate scale to fit area in viewport with minimal padding
      const scaleX = (screenWidth * 0.95) / areaWidth;
      const scaleY = (screenHeight * 0.95) / areaHeight;
      const targetScale = Math.min(scaleX, scaleY, 1);

      // Clamp scale to reasonable range
      const clampedScale = Math.max(0.25, Math.min(targetScale, 2.0));

      // Calculate center position of area (in pixels)
      const areaCenterX =
        ((area.bounds.minX + area.bounds.maxX) / 2) * tileSize + tileSize / 2;
      const areaCenterY =
        ((area.bounds.minY + area.bounds.maxY) / 2) * tileSize + tileSize / 2;

      // Calculate centering relative to board center (not screen center)
      const boardWidth = level.width * tileSize;
      const boardHeight = level.height * tileSize;

      const targetX = boardWidth / 2 - areaCenterX;
      const targetY = boardHeight / 2 - areaCenterY;

      console.log("lockToArea: auto-calculated camera position", {
        targetX,
        targetY,
        clampedScale,
      });

      // Smooth animation to area
      cameraX.value = withTiming(targetX, {
        duration: 800,
        easing: Easing.inOut(Easing.ease),
      });
      cameraY.value = withTiming(targetY, {
        duration: 800,
        easing: Easing.inOut(Easing.ease),
      });
      cameraScale.value = withTiming(clampedScale, {
        duration: 800,
        easing: Easing.inOut(Easing.ease),
      });
    },
    [
      level.subLevels,
      level.width,
      level.height,
      tileSize,
      screenWidth,
      screenHeight,
      cameraX,
      cameraY,
      cameraScale,
    ],
  );

  // Update camera based on mode
  useEffect(() => {
    console.log("Camera mode update:", cameraState.mode, cameraState);
    if (cameraState.mode === "fixed") {
      // Reset to default position
      console.log("Setting camera to fixed position (0, 0, scale 1)");
      cameraX.value = 0;
      cameraY.value = 0;
      cameraScale.value = 1;
    } else if (cameraState.mode === "follow") {
      // Follow player with smooth spring animation
      // Center the middle of the player sprite, not the top-left corner
      const boardWidth = level.width * tileSize;
      const boardHeight = level.height * tileSize;

      const playerCenterX = gameState.player.x * tileSize + tileSize / 2;
      const playerCenterY = gameState.player.y * tileSize + tileSize / 2;

      // Since the board is centered in the view, we translate relative to board center
      const targetX = boardWidth / 2 - playerCenterX;
      const targetY = boardHeight / 2 - playerCenterY;

      console.log(
        "Following player at",
        gameState.player,
        "targetX:",
        targetX,
        "targetY:",
        targetY,
      );
      cameraX.value = withSpring(targetX, { damping: 100, stiffness: 150 });
      cameraY.value = withSpring(targetY, { damping: 100, stiffness: 150 });
      cameraScale.value = withTiming(1, { duration: 400 });
    } else if (
      cameraState.mode === "lockedArea" &&
      cameraState.lockedAreaId !== undefined
    ) {
      // Lock to area
      console.log("Calling lockToArea for area id:", cameraState.lockedAreaId);
      lockToArea(cameraState.lockedAreaId);
    }
  }, [
    cameraState,
    gameState.player,
    tileSize,
    screenWidth,
    screenHeight,
    lockToArea,
    cameraX,
    cameraY,
    cameraScale,
  ]);

  return {
    cameraX,
    cameraY,
    cameraScale,
    cameraState,
  };
};
