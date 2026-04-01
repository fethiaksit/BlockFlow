import { canPlacePiece } from '../game/board';
import { ActivePiece } from '../game/types';
import { BoardLayout, getPieceAnchorFromFinger } from './boardCoordinates';

export type { BoardLayout } from './boardCoordinates';

export type PlacementPreview = {
  pieceId: string;
  row: number;
  col: number;
  valid: boolean;
} | null;

const isPointInsideBoard = (x: number, y: number, boardLayout: BoardLayout): boolean => {
  return (
    x >= boardLayout.pageX &&
    x <= boardLayout.pageX + boardLayout.size &&
    y >= boardLayout.pageY &&
    y <= boardLayout.pageY + boardLayout.size
  );
};

export const calculateDropPreview = (
  fingerX: number,
  fingerY: number,
  piece: ActivePiece,
  boardLayout: BoardLayout,
  board: (0 | 1)[][],
  anchorRatioX = 0.5,
  anchorRatioY = 0.5
): PlacementPreview => {
  if (!isPointInsideBoard(fingerX, fingerY, boardLayout)) {
    return null;
  }

  const anchor = getPieceAnchorFromFinger(fingerX, fingerY, piece, boardLayout, anchorRatioX, anchorRatioY);

  return {
    pieceId: piece.instanceId,
    row: anchor.row,
    col: anchor.col,
    valid: canPlacePiece(board, piece, anchor.row, anchor.col)
  };
};
