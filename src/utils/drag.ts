import { canPlacePiece } from '../game/board';
import { ActivePiece } from '../game/types';
import { BoardLayout, resolvePlacementAnchorFromFinger } from './boardCoordinates';

export type { BoardLayout } from './boardCoordinates';

export type PlacementPreview = {
  pieceId: string;
  row: number;
  col: number;
  valid: boolean;
} | null;

export const calculateDropPreview = (
  fingerX: number,
  fingerY: number,
  piece: ActivePiece,
  boardLayout: BoardLayout,
  board: (0 | 1)[][],
  anchorRatioX = 0.5,
  anchorRatioY = 0.5
): PlacementPreview => {
  const anchor = resolvePlacementAnchorFromFinger(fingerX, fingerY, piece, boardLayout, {
    anchorRatioX,
    anchorRatioY,
    hitSlopCells: 0.45
  });

  if (!anchor) {
    return null;
  }

  return {
    pieceId: piece.instanceId,
    row: anchor.row,
    col: anchor.col,
    valid: canPlacePiece(board, piece, anchor.row, anchor.col)
  };
};
