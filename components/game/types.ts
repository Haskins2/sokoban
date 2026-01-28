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
  | "cameraFollow"
  | "cameraLockArea";

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
  mode: "follow" | "lockArea";
  targetAreaId?: number;
};

export type CameraMode = "fixed" | "follow" | "lockedArea";

export type CameraState = {
  mode: CameraMode;
  lockedAreaId?: number;
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
  cameraTriggers?: CameraTrigger[]; // Camera control tiles
  initialCameraState?: CameraState; // Starting camera mode
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
