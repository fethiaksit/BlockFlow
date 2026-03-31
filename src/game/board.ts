import { BOARD_SIZE } from '../constants/game';
import { Board, LineClearResult, MoveResolution, PieceDefinition } from './types';
import { calculateMoveScore } from './score';

export const createEmptyBoard = (): Board =>
  Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 0 as const));

export const cloneBoard = (board: Board): Board => board.map((row) => [...row] as (0 | 1)[]);

export const canPlacePiece = (board: Board, piece: PieceDefinition, originRow: number, originCol: number): boolean => {
  return piece.cells.every((cell) => {
    const targetRow = originRow + cell.row;
    const targetCol = originCol + cell.col;

    if (targetRow < 0 || targetCol < 0 || targetRow >= BOARD_SIZE || targetCol >= BOARD_SIZE) {
      return false;
    }

    return board[targetRow][targetCol] === 0;
  });
};

export const placePiece = (board: Board, piece: PieceDefinition, originRow: number, originCol: number): Board => {
  const next = cloneBoard(board);

  piece.cells.forEach((cell) => {
    next[originRow + cell.row][originCol + cell.col] = 1;
  });

  return next;
};

export const getFilledLines = (board: Board): LineClearResult => {
  const rows: number[] = [];
  const cols: number[] = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    if (board[row].every((value) => value === 1)) {
      rows.push(row);
    }
  }

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    let full = true;
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      if (board[row][col] === 0) {
        full = false;
        break;
      }
    }
    if (full) {
      cols.push(col);
    }
  }

  return { rows, cols };
};

export const clearLines = (board: Board, clearResult: LineClearResult): Board => {
  const next = cloneBoard(board);

  clearResult.rows.forEach((row) => {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      next[row][col] = 0;
    }
  });

  clearResult.cols.forEach((col) => {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      next[row][col] = 0;
    }
  });

  return next;
};

export const resolveMove = (board: Board, piece: PieceDefinition, originRow: number, originCol: number): MoveResolution => {
  const placed = placePiece(board, piece, originRow, originCol);
  const lines = getFilledLines(placed);
  const cleared = clearLines(placed, lines);

  return {
    board: cleared,
    clearResult: lines,
    score: calculateMoveScore(piece.cells.length, lines.rows.length + lines.cols.length)
  };
};

export const hasAnyValidPlacement = (board: Board, piece: PieceDefinition): boolean => {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (canPlacePiece(board, piece, row, col)) {
        return true;
      }
    }
  }
  return false;
};
