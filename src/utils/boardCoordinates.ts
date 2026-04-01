import { BOARD_SIZE } from '../constants/game';
import { ActivePiece } from '../game/types';
import { getPieceBounds } from '../game/pieces';

export type BoardLayout = {
  pageX: number;
  pageY: number;
  size: number;
  gridSize: number;
  gridX: number;
  gridY: number;
  cellSize: number;
};

export type BoardAnchor = {
  row: number;
  col: number;
};

const toCellIndex = (value: number, cellSize: number): number => Math.floor(value / cellSize);

const isInsideBoard = (row: number, col: number): boolean => row >= 0 && col >= 0 && row < BOARD_SIZE && col < BOARD_SIZE;

export const getPieceAnchorFromFinger = (
  fingerX: number,
  fingerY: number,
  piece: ActivePiece,
  boardLayout: BoardLayout,
  anchorRatioX = 0.5,
  anchorRatioY = 0.5
): BoardAnchor => {
  const safeAnchorRatioX = Math.max(0, Math.min(1, anchorRatioX));
  const safeAnchorRatioY = Math.max(0, Math.min(1, anchorRatioY));
  const bounds = getPieceBounds(piece.cells);
  const pieceTopLeft = getPieceTopLeftFromFinger(fingerX, fingerY, piece, boardLayout, safeAnchorRatioX, safeAnchorRatioY);

  return {
    row: toCellIndex(pieceTopLeft.localY, boardLayout.cellSize) - bounds.minRow,
    col: toCellIndex(pieceTopLeft.localX, boardLayout.cellSize) - bounds.minCol
  };
};

export const getPieceTopLeftFromFinger = (
  fingerX: number,
  fingerY: number,
  piece: ActivePiece,
  boardLayout: BoardLayout,
  anchorRatioX = 0.5,
  anchorRatioY = 0.5
): { localX: number; localY: number } => {
  const bounds = getPieceBounds(piece.cells);
  const safeAnchorRatioX = Math.max(0, Math.min(1, anchorRatioX));
  const safeAnchorRatioY = Math.max(0, Math.min(1, anchorRatioY));

  return {
    localX: fingerX - boardLayout.gridX - bounds.width * boardLayout.cellSize * safeAnchorRatioX,
    localY: fingerY - boardLayout.gridY - bounds.height * boardLayout.cellSize * safeAnchorRatioY
  };
};

export const canAnchorTouchBoard = (anchor: BoardAnchor): boolean => isInsideBoard(anchor.row, anchor.col);
