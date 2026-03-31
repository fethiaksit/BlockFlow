export type Cell = 0 | 1;
export type Board = Cell[][];

export type PieceCell = {
  row: number;
  col: number;
};

export type PieceDefinition = {
  id: string;
  name: string;
  color: string;
  weight: number;
  cells: PieceCell[];
};

export type ActivePiece = PieceDefinition & {
  instanceId: string;
};

export type LineClearResult = {
  rows: number[];
  cols: number[];
};

export type MoveScoreBreakdown = {
  blockPoints: number;
  linePoints: number;
  multiBonus: number;
  total: number;
  clearedLines: number;
};

export type MoveResolution = {
  board: Board;
  clearResult: LineClearResult;
  score: MoveScoreBreakdown;
};
