import { BOARD_SIZE } from '../constants/game';
import { ActivePiece } from '../game/types';
import { getPieceBounds } from '../game/pieces';

export type BoardLayout = {
  pageX: number;
  pageY: number;
  size: number;
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
  const bounds = getPieceBounds(piece.cells);
  const safeAnchorRatioX = Math.max(0, Math.min(1, anchorRatioX));
  const safeAnchorRatioY = Math.max(0, Math.min(1, anchorRatioY));
  const localX = fingerX - boardLayout.pageX - bounds.width * boardLayout.cellSize * safeAnchorRatioX;
  const localY = fingerY - boardLayout.pageY - bounds.height * boardLayout.cellSize * safeAnchorRatioY;

  return {
    row: toCellIndex(localY, boardLayout.cellSize) - bounds.minRow,
    col: toCellIndex(localX, boardLayout.cellSize) - bounds.minCol
  };
};

export const canAnchorTouchBoard = (anchor: BoardAnchor): boolean => isInsideBoard(anchor.row, anchor.col);
