import { canPlacePiece } from '../game/board';
import { ActivePiece } from '../game/types';
import { BoardLayout, canAnchorTouchBoard, getPieceAnchorFromFinger } from './boardCoordinates';

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
  board: (0 | 1)[][]
): PlacementPreview => {
  const anchor = getPieceAnchorFromFinger(fingerX, fingerY, piece, boardLayout);

  if (!canAnchorTouchBoard(anchor)) {
    return {
      pieceId: piece.instanceId,
      row: anchor.row,
      col: anchor.col,
      valid: false
    };
  }

  return {
    pieceId: piece.instanceId,
    row: anchor.row,
    col: anchor.col,
    valid: canPlacePiece(board, piece, anchor.row, anchor.col)
  };
};
