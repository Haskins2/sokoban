export type Position = {
  x: number;
  y: number;
};

export type Direction = 'up' | 'down' | 'left' | 'right';

export type LevelConfig = {
  width: number;
  height: number;
  walls: Position[];
  boxes: Position[];
  goals: Position[];
  initialPlayer: Position;
  levelNumber?: number;
};

export type GameState = {
  player: Position;
  boxes: Position[];
};

export type MoveSequence = {
  direction: Direction;
  playerPath: Position[];
  boxMoved?: {
    index: number;
    path: Position[];
  };
};

