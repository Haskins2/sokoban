import { useCallback, useEffect, useRef, useState } from "react";
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

  // Calculate initial camera values for first area if subLevels exist
  const getInitialCameraValues = () => {
    if (level.subLevels && level.subLevels.length > 0) {
      const firstArea = level.subLevels[0];
      const areaWidth =
        (firstArea.bounds.maxX - firstArea.bounds.minX + 1) * tileSize;
      const areaHeight =
        (firstArea.bounds.maxY - firstArea.bounds.minY + 1) * tileSize;

      const paddedWidth = areaWidth + 2 * tileSize;
      const paddedHeight = areaHeight + 2 * tileSize;

      const scaleX = screenWidth / paddedWidth;
      const scaleY = screenHeight / paddedHeight;
      const targetScale = Math.min(scaleX, scaleY);
      const clampedScale = Math.max(0.25, Math.min(targetScale, 2.0));

      const areaCenterX =
        ((firstArea.bounds.minX + firstArea.bounds.maxX) / 2) * tileSize +
        tileSize / 2;
      const areaCenterY =
        ((firstArea.bounds.minY + firstArea.bounds.maxY) / 2) * tileSize +
        tileSize / 2;

      const boardWidth = level.width * tileSize;
      const boardHeight = level.height * tileSize;

      // When scaling, we need to multiply the translation by the scale factor
      const targetX = (boardWidth / 2 - areaCenterX) * clampedScale;
      const targetY =
        (boardHeight / 2 - areaCenterY) * clampedScale -
        2.5 * tileSize * clampedScale;

      return { x: targetX, y: targetY, scale: clampedScale };
    }
    return { x: 0, y: 0, scale: 1 };
  };

  const initialValues = getInitialCameraValues();

  // Animated values for camera position and scale
  const cameraX = useSharedValue(initialValues.x);
  const cameraY = useSharedValue(initialValues.y);
  const cameraScale = useSharedValue(initialValues.scale);

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

  // Track if this is the first render to avoid unnecessary initial animation
  const isInitialMount = useRef(true);
  const prevCameraMode = useRef(cameraState.mode);

  // Update camera state when level subLevels become available
  useEffect(() => {
    if (
      level.subLevels &&
      level.subLevels.length > 0 &&
      cameraState.mode === "fixed"
    ) {
      const firstArea = level.subLevels[0];
      console.log(
        "useCamera: level subLevels loaded, switching to lock area",
        firstArea.id,
      );
      setCameraState({ mode: "lockedArea", lockedAreaId: firstArea.id });
    }
  }, [level.subLevels, cameraState.mode]);

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

      // Add 1 tile padding on each side (2 tiles total per dimension)
      const paddedWidth = areaWidth + 2 * tileSize;
      const paddedHeight = areaHeight + 2 * tileSize;

      // Calculate scale to fit padded area in viewport
      const scaleX = screenWidth / paddedWidth;
      const scaleY = screenHeight / paddedHeight;
      const targetScale = Math.min(scaleX, scaleY);

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

      // When scaling, we need to multiply the translation by the scale factor
      // This is because transforms are applied in order: translate first, then scale
      const targetX = (boardWidth / 2 - areaCenterX) * clampedScale;
      const targetY =
        (boardHeight / 2 - areaCenterY) * clampedScale -
        2.5 * tileSize * clampedScale;

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
    ],
  );

  // Handle fixed and lockedArea camera modes
  useEffect(() => {
    // Skip on initial mount if we're already in lockedArea mode with the first area
    // since getInitialCameraValues already positioned the camera correctly
    if (
      isInitialMount.current &&
      cameraState.mode === "lockedArea" &&
      level.subLevels &&
      level.subLevels.length > 0
    ) {
      const firstAreaId = level.subLevels[0].id;
      if (cameraState.lockedAreaId === firstAreaId) {
        console.log(
          "Skipping initial lockToArea call - camera already positioned correctly",
        );
        isInitialMount.current = false;
        return;
      }
    }
    isInitialMount.current = false;

    console.log("Camera mode update:", cameraState.mode, cameraState);
    if (cameraState.mode === "fixed") {
      // Reset to default position
      console.log("Setting camera to fixed position (0, 0, scale 1)");
      cameraX.value = 0;
      cameraY.value = 0;
      cameraScale.value = 1;
    } else if (
      cameraState.mode === "lockedArea" &&
      cameraState.lockedAreaId !== undefined
    ) {
      // Lock to area
      console.log("Calling lockToArea for area id:", cameraState.lockedAreaId);
      lockToArea(cameraState.lockedAreaId);
    }
  }, [cameraState, lockToArea, level.subLevels]);

  // Handle follow mode - updates when player moves
  useEffect(() => {
    // Check for camera triggers first, before checking mode
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
        if (trigger.mode === "follow" && cameraState.mode !== "follow") {
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
          // Skip follow update since we're switching modes
          return;
        }
      }
    }

    if (cameraState.mode !== "follow") {
      prevCameraMode.current = cameraState.mode;
      return;
    }

    // If we just switched to follow mode, update immediately
    // Otherwise only update when player moves (not on mode change)
    const justSwitchedToFollow = prevCameraMode.current !== "follow";
    prevCameraMode.current = "follow";

    // Follow player with smooth spring animation
    // Center the middle of the player sprite, not the top-left corner
    const boardWidth = level.width * tileSize;
    const boardHeight = level.height * tileSize;

    const playerCenterX = gameState.player.x * tileSize + tileSize / 2;
    const playerCenterY = gameState.player.y * tileSize + tileSize / 2;

    const followZoom = level.followZoom ?? 2.0;

    // Since the board is centered in the view, we translate relative to board center
    // When zooming, we need to adjust the translation by the zoom factor
    const targetX = (boardWidth / 2 - playerCenterX) * followZoom;
    const targetY = (boardHeight / 2 - playerCenterY) * followZoom;

    console.log(
      "Following player at",
      gameState.player,
      "targetX:",
      targetX,
      "targetY:",
      targetY,
      "zoom:",
      followZoom,
    );
    cameraX.value = withSpring(targetX, { damping: 100, stiffness: 150 });
    cameraY.value = withSpring(targetY, { damping: 100, stiffness: 150 });
    cameraScale.value = withTiming(followZoom, { duration: 400 });
  }, [
    cameraState.mode,
    gameState.player,
    level.width,
    level.height,
    level.followZoom,
    level.cameraTriggers,
    tileSize,
  ]);

  return {
    cameraX,
    cameraY,
    cameraScale,
    cameraState,
  };
};
