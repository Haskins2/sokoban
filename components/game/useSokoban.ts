import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Direction,
    GameState,
    LevelConfig,
    MoveSequence,
    Position,
} from "./types";

export const useSokoban = (level: LevelConfig) => {
  const [gameState, setGameState] = useState<GameState>({
    player: level.initialPlayer,
    boxes: level.boxes,
  });
  const [isMoving, setIsMoving] = useState(false);
  const [lastMove, setLastMove] = useState<MoveSequence | null>(null);
  const [doorOpen, setDoorOpen] = useState(false);
  const [openDoors, setOpenDoors] = useState<Set<number>>(new Set());
  const [completedSubLevels, setCompletedSubLevels] = useState<number[]>([]);
  const [isChapterComplete, setIsChapterComplete] = useState(false);

  const historyRef = useRef<GameState[]>([]);

  // Reset game state when level changes
  useEffect(() => {
    setGameState({
      player: level.initialPlayer,
      boxes: level.boxes,
    });
    setIsMoving(false);
    setLastMove(null);
    setDoorOpen(false);
    setOpenDoors(new Set());
    setCompletedSubLevels([]);
    setIsChapterComplete(false);
    historyRef.current = [];
  }, [level]);

  // Pre-compute wall positions as a Set for O(1) lookups
  const wallSet = useMemo(() => {
    const set = new Set<string>();
    level.walls.forEach((w) => set.add(`${w.x},${w.y}`));
    return set;
  }, [level.walls]);

  // Check sub-level completion
  const getSubLevelCompletion = useCallback(() => {
    if (!level.subLevels || level.subLevels.length === 0) {
      // Legacy single-level mode - use Set for O(1) box position lookups
      const boxPositions = new Set(gameState.boxes.map((b) => `${b.x},${b.y}`));
      const legacyIsWon = level.goals.every((g) =>
        boxPositions.has(`${g.x},${g.y}`),
      );
      return { isWon: legacyIsWon, completedSubLevels: [] };
    }

    // Chapter mode: check each sub-level independently
    const completed = level.subLevels.filter((area) => {
      // Filter out invalid indices to prevent undefined access
      const areaGoals = area.goalIndices
        .map((i) => level.goals[i])
        .filter((g) => g !== undefined);
      const areaBoxes = area.boxIndices
        .map((i) => gameState.boxes[i])
        .filter((b) => b !== undefined);

      // If no valid goals, consider incomplete
      if (areaGoals.length === 0) return false;

      // Use Set for O(1) lookups instead of .some()
      const areaBoxPositions = new Set(areaBoxes.map((b) => `${b.x},${b.y}`));

      return areaGoals.every((g) => areaBoxPositions.has(`${g.x},${g.y}`));
    });

    return {
      isWon: completed.length === level.subLevels.length,
      completedSubLevels: completed.map((a) => a.id),
    };
  }, [level, gameState.boxes]);

  const { isWon, completedSubLevels: currentCompletedSubLevels } =
    getSubLevelCompletion();
  const actualIsWon = !isMoving && isWon;

  // Update completed sub-levels and open doors
  useEffect(() => {
    if (!level.subLevels || level.subLevels.length === 0) {
      // Legacy mode: open single door when won
      if (actualIsWon && !doorOpen) {
        const timer = setTimeout(() => {
          setDoorOpen(true);
        }, 300);
        return () => clearTimeout(timer);
      }
    } else {
      // Chapter mode: open doors for completed sub-levels
      // Only update if the completed sub-levels have actually changed
      if (
        JSON.stringify(completedSubLevels) !==
        JSON.stringify(currentCompletedSubLevels)
      ) {
        setCompletedSubLevels(currentCompletedSubLevels);
      }

      currentCompletedSubLevels.forEach((areaId) => {
        if (!openDoors.has(areaId)) {
          setTimeout(() => {
            setOpenDoors((prev) => new Set(prev).add(areaId));
          }, 300);
        }
      });
    }
  }, [
    actualIsWon,
    doorOpen,
    level.subLevels,
    currentCompletedSubLevels,
    openDoors,
    completedSubLevels,
  ]);

  const isDoorBlocking = useCallback(
    (pos: Position) => {
      // Check legacy door
      if (level.door && level.door.x === pos.x && level.door.y === pos.y) {
        return !doorOpen;
      }

      // Check sub-level doors
      if (level.subLevels) {
        const area = level.subLevels.find(
          (a) => a.door && a.door.x === pos.x && a.door.y === pos.y,
        );
        if (area) {
          return !openDoors.has(area.id);
        }
      }

      return false;
    },
    [level.door, level.subLevels, doorOpen, openDoors],
  );

  const isWall = useCallback(
    (pos: Position) => {
      return wallSet.has(`${pos.x},${pos.y}`) || isDoorBlocking(pos);
    },
    [wallSet, isDoorBlocking],
  );

  const getBoxIndex = useCallback((pos: Position, currentBoxes: Position[]) => {
    return currentBoxes.findIndex((b) => b.x === pos.x && b.y === pos.y);
  }, []);

  const move = useCallback(
    (direction: Direction) => {
      if (isMoving) return;

      let currentState = { ...gameState };
      const startState = { ...gameState };

      const playerPath = [currentState.player];
      let boxMovedIndex = -1;
      const boxPath: Position[] = [];

      let dx = 0;
      let dy = 0;

      switch (direction) {
        case "up":
          dy = -1;
          break;
        case "down":
          dy = 1;
          break;
        case "left":
          dx = -1;
          break;
        case "right":
          dx = 1;
          break;
      }

      let moved = false;

      while (true) {
        const { player, boxes } = currentState;
        const newPlayerPos = { x: player.x + dx, y: player.y + dy };

        // Check wall collision for player
        if (isWall(newPlayerPos)) {
          break;
        }

        // Check box collision
        const boxIndex = getBoxIndex(newPlayerPos, boxes);
        if (boxIndex !== -1) {
          // Trying to push a box
          const newBoxPos = { x: newPlayerPos.x + dx, y: newPlayerPos.y + dy };

          // Check if box can move (not into wall or another box)
          if (isWall(newBoxPos) || getBoxIndex(newBoxPos, boxes) !== -1) {
            break;
          }

          // Move box
          const newBoxes = [...boxes];
          newBoxes[boxIndex] = newBoxPos;

          if (boxMovedIndex === -1) {
            boxMovedIndex = boxIndex;
            boxPath.push(boxes[boxIndex]); // Add start pos
          }
          boxPath.push(newBoxPos);

          currentState = {
            player: newPlayerPos,
            boxes: newBoxes,
          };
        } else {
          // Just moving player
          currentState = {
            ...currentState,
            player: newPlayerPos,
          };
        }

        playerPath.push(currentState.player);
        moved = true;
      }

      if (moved) {
        historyRef.current.push(startState);
        setGameState(currentState);
        setLastMove({
          direction,
          playerPath,
          boxMoved:
            boxMovedIndex !== -1
              ? { index: boxMovedIndex, path: boxPath }
              : undefined,
        });

        setIsMoving(true);
        // Calculate duration based on steps
        // 12ms per step for fast arcade-style movement
        const duration = (playerPath.length - 1) * 12;
        setTimeout(() => {
          setIsMoving(false);

          // Check if player reached the finish tile
          if (
            level.finishPosition &&
            currentState.player.x === level.finishPosition.x &&
            currentState.player.y === level.finishPosition.y
          ) {
            console.log(
              "Player reached finish tile! Setting isChapterComplete to true",
            );
            console.log("Finish position:", level.finishPosition);
            console.log("Player position:", currentState.player);
            console.log("Chapter number:", level.chapterNumber);
            setIsChapterComplete(true);
          }
        }, duration);
      }
    },
    [gameState, isMoving, isWall, getBoxIndex],
  );

  const reset = useCallback(() => {
    if (isMoving) return;
    setGameState({
      player: level.initialPlayer,
      boxes: level.boxes,
    });
    setLastMove(null);
    setDoorOpen(false);
    setOpenDoors(new Set());
    setCompletedSubLevels([]);
    setIsChapterComplete(false);
    historyRef.current = [];
  }, [level, isMoving]);

  const undo = useCallback(() => {
    if (isMoving) return;
    if (historyRef.current.length > 0) {
      const lastState = historyRef.current.pop()!;
      setGameState(lastState);
      setLastMove(null); // Clear animation on undo
    }
  }, [isMoving]);

  return {
    gameState,
    move,
    reset,
    undo,
    isWon: actualIsWon,
    isMoving,
    lastMove,
    doorOpen,
    openDoors,
    completedSubLevels,
    isChapterComplete,
  };
};
