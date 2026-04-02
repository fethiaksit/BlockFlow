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

export type FingerToBoardOptions = {
  anchorRatioX?: number;
  anchorRatioY?: number;
  /**
   * Additional interactive padding (in cell units) around the board.
   * Helps edge rows/cols (especially the last row) feel as targetable as inner cells.
   */
  hitSlopCells?: number;
};

const EDGE_EPSILON = 0.0001;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const clampToBoardCell = (value: number, cellSize: number): number =>
  clamp(value, 0, BOARD_SIZE * cellSize - EDGE_EPSILON);
const toCellIndex = (value: number, cellSize: number): number => Math.floor(clampToBoardCell(value, cellSize) / cellSize);

const isInsideBoard = (row: number, col: number): boolean => row >= 0 && col >= 0 && row < BOARD_SIZE && col < BOARD_SIZE;

export const getBoardLocalPoint = (absoluteX: number, absoluteY: number, boardLayout: BoardLayout): { localX: number; localY: number } => ({
  localX: absoluteX - boardLayout.gridX,
  localY: absoluteY - boardLayout.gridY
});

const isInsideInteractiveBoardArea = (
  localX: number,
  localY: number,
  boardLayout: BoardLayout,
  hitSlopCells = 0
): boolean => {
  const hitSlopPx = Math.max(0, hitSlopCells) * boardLayout.cellSize;
  return (
    localX >= -hitSlopPx &&
    localX <= boardLayout.gridSize + hitSlopPx &&
    localY >= -hitSlopPx &&
    localY <= boardLayout.gridSize + hitSlopPx
  );
};

export const getBoardAnchorFromAbsolute = (absoluteX: number, absoluteY: number, boardLayout: BoardLayout): BoardAnchor => {
  const { localX, localY } = getBoardLocalPoint(absoluteX, absoluteY, boardLayout);
  return {
    row: toCellIndex(localY, boardLayout.cellSize),
    col: toCellIndex(localX, boardLayout.cellSize)
  };
};

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
  const pieceTopLeftAnchor = getBoardAnchorFromAbsolute(
    pieceTopLeft.localX + boardLayout.gridX,
    pieceTopLeft.localY + boardLayout.gridY,
    boardLayout
  );

  return {
    row: clamp(pieceTopLeftAnchor.row - bounds.minRow, 0, BOARD_SIZE - 1),
    col: clamp(pieceTopLeftAnchor.col - bounds.minCol, 0, BOARD_SIZE - 1)
  };
};

export const resolvePlacementAnchorFromFinger = (
  fingerX: number,
  fingerY: number,
  piece: ActivePiece,
  boardLayout: BoardLayout,
  options: FingerToBoardOptions = {}
): BoardAnchor | null => {
  const {
    anchorRatioX = 0.5,
    anchorRatioY = 0.5,
    hitSlopCells = 0.45
  } = options;

  const { localX, localY } = getBoardLocalPoint(fingerX, fingerY, boardLayout);
  if (!isInsideInteractiveBoardArea(localX, localY, boardLayout, hitSlopCells)) {
    return null;
  }

  return getPieceAnchorFromFinger(fingerX, fingerY, piece, boardLayout, anchorRatioX, anchorRatioY);
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
