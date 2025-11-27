import { useState, useCallback, useEffect } from 'react';
import { LevelConfig, Position, Direction, GameState } from './types';

export const useSokoban = (level: LevelConfig) => {
  const [gameState, setGameState] = useState<GameState>({
    player: level.initialPlayer,
    boxes: level.boxes,
  });

  // Reset game state when level changes
  useEffect(() => {
    setGameState({
      player: level.initialPlayer,
      boxes: level.boxes,
    });
  }, [level]);

  const isWon = level.goals.every(g => gameState.boxes.some(b => b.x === g.x && b.y === g.y));

  const isWall = useCallback((pos: Position) => {
    return level.walls.some(w => w.x === pos.x && w.y === pos.y);
  }, [level.walls]);

  const getBoxIndex = useCallback((pos: Position, currentBoxes: Position[]) => {
    return currentBoxes.findIndex(b => b.x === pos.x && b.y === pos.y);
  }, []);

  const move = useCallback((direction: Direction) => {
    setGameState((prev: GameState) => {
      const { player, boxes } = prev;
      let dx = 0;
      let dy = 0;

      switch (direction) {
        case 'up': dy = -1; break;
        case 'down': dy = 1; break;
        case 'left': dx = -1; break;
        case 'right': dx = 1; break;
      }

      const newPlayerPos = { x: player.x + dx, y: player.y + dy };

      // Check wall collision for player
      if (isWall(newPlayerPos)) {
        return prev;
      }

      // Check box collision
      const boxIndex = getBoxIndex(newPlayerPos, boxes);
      if (boxIndex !== -1) {
        // Trying to push a box
        const newBoxPos = { x: newPlayerPos.x + dx, y: newPlayerPos.y + dy };

        // Check if box can move (not into wall or another box)
        if (isWall(newBoxPos) || getBoxIndex(newBoxPos, boxes) !== -1) {
          return prev;
        }

        // Move box
        const newBoxes = [...boxes];
        newBoxes[boxIndex] = newBoxPos;
        return {
          player: newPlayerPos,
          boxes: newBoxes,
        };
      }

      // Just moving player
      return {
        ...prev,
        player: newPlayerPos,
      };
    });
  }, [isWall, getBoxIndex]);

  const reset = useCallback(() => {
    setGameState({
      player: level.initialPlayer,
      boxes: level.boxes,
    });
  }, [level]);

  return {
    gameState,
    move,
    reset,
    isWon,
  };
};
