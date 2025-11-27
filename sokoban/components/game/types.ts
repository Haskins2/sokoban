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
};

export type GameState = {
  player: Position;
  boxes: Position[];
};
