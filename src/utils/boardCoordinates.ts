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
  boardLayout: BoardLayout
): BoardAnchor => {
  const bounds = getPieceBounds(piece.cells);
  const localX = fingerX - boardLayout.pageX - (bounds.width * boardLayout.cellSize) / 2;
  const localY = fingerY - boardLayout.pageY - (bounds.height * boardLayout.cellSize) / 2;

  return {
    row: toCellIndex(localY, boardLayout.cellSize) - bounds.minRow,
    col: toCellIndex(localX, boardLayout.cellSize) - bounds.minCol
  };
};

export const canAnchorTouchBoard = (anchor: BoardAnchor): boolean => isInsideBoard(anchor.row, anchor.col);
