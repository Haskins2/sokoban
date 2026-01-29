export type Position = {
  x: number;
  y: number;
};

export type Direction = "up" | "down" | "left" | "right";

export type TileType =
  | "wall1x1"
  | "wallBLInner"
  | "wallBLOuter"
  | "wallBottom"
  | "wallBRInner"
  | "wallBROuter"
  | "floor"
  | "wallLeft"
  | "wallRight"
  | "wallTLInner"
  | "wallTLOuter"
  | "wallTop"
  | "wallTRInner"
  | "wallTROuter"
  | "cameraZoom";

export type TilePosition = Position & {
  tileType: TileType;
};

export type DoorOrientation = "lr" | "ud";

export type Door = Position & {
  orientation: DoorOrientation;
};

export type SubLevelArea = {
  id: number;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  boxIndices: number[];
  goalIndices: number[];
  door?: Door;
};

export type CameraTrigger = Position & {
  targetZoom: number;
};

export type LevelConfig = {
  width: number;
  height: number;
  walls: Position[]; // For collision detection
  boxes: Position[];
  goals: Position[];
  initialPlayer: Position;
  door?: Door;
  levelNumber?: number;
  tiles?: TilePosition[]; // Detailed tile information for rendering
  subLevels?: SubLevelArea[]; // Chapter mode: multiple puzzle areas
  cameraTriggers?: CameraTrigger[]; // Camera zoom trigger tiles
  followZoom?: number; // Default zoom level (default: 2.0)
  finishPosition?: Position; // Chapter finish tile
  chapterNumber?: number; // For showing chapter_x_complete.png
  starThresholds?: {
    1: number;
    2: number;
    3: number;
  };
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

export type TimerState = {
  startTime: number | null;
  elapsedTime: number;
  isRunning: boolean;
};

export type SpeedRunRecord = {
  time: number; // milliseconds
  timestamp: number; // Firebase server timestamp
  moves: number; // total moves in run
  username: string; // user.displayName or "Anonymous"
  chapterNumber?: number; // optional chapter identifier
};
