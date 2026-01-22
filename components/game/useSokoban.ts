import { useState, useCallback, useEffect, useRef } from 'react';
import { LevelConfig, Position, Direction, GameState, MoveSequence } from './types';

export const useSokoban = (level: LevelConfig) => {
  const [gameState, setGameState] = useState<GameState>({
    player: level.initialPlayer,
    boxes: level.boxes,
  });
  const [isMoving, setIsMoving] = useState(false);
  const [lastMove, setLastMove] = useState<MoveSequence | null>(null);

  const historyRef = useRef<GameState[]>([]);

  // Reset game state when level changes
  useEffect(() => {
    setGameState({
      player: level.initialPlayer,
      boxes: level.boxes,
    });
    setIsMoving(false);
    setLastMove(null);
    historyRef.current = [];
  }, [level]);

  const isWon = !isMoving && level.goals.every(g => gameState.boxes.some(b => b.x === g.x && b.y === g.y));

  const isWall = useCallback((pos: Position) => {
    return level.walls.some(w => w.x === pos.x && w.y === pos.y);
  }, [level.walls]);

  const getBoxIndex = useCallback((pos: Position, currentBoxes: Position[]) => {
    return currentBoxes.findIndex(b => b.x === pos.x && b.y === pos.y);
  }, []);

  const move = useCallback((direction: Direction) => {
    if (isMoving) return;
    
    let currentState = { ...gameState };
    const startState = { ...gameState };
    
    const playerPath = [currentState.player];
    let boxMovedIndex = -1;
    const boxPath: Position[] = [];

    let dx = 0;
    let dy = 0;

    switch (direction) {
      case 'up': dy = -1; break;
      case 'down': dy = 1; break;
      case 'left': dx = -1; break;
      case 'right': dx = 1; break;
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
        boxMoved: boxMovedIndex !== -1 ? { index: boxMovedIndex, path: boxPath } : undefined
      });
      
      setIsMoving(true);
      // Calculate duration based on steps
      // 50ms per step
      const duration = (playerPath.length - 1) * 25;
      setTimeout(() => setIsMoving(false), duration);
    }
  }, [gameState, isMoving, isWall, getBoxIndex]);

  const reset = useCallback(() => {
    if (isMoving) return;
    setGameState({
      player: level.initialPlayer,
      boxes: level.boxes,
    });
    setLastMove(null);
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
    isWon,
    isMoving,
    lastMove,
  };
};
