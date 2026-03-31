import { BOARD_SIZE } from '../constants/game';
import { ActivePiece } from '../game/types';
import { canPlacePiece } from '../game/board';
import { getPieceBounds } from '../game/pieces';

export type BoardLayout = {
  x: number;
  y: number;
  size: number;
  cell: number;
};

export const calculateDropPreview = (
  fingerX: number,
  fingerY: number,
  piece: ActivePiece,
  boardLayout: BoardLayout,
  board: (0 | 1)[][]
) => {
  const bounds = getPieceBounds(piece.cells);
  const xInside = fingerX - boardLayout.x - (bounds.width * boardLayout.cell) / 2;
  const yInside = fingerY - boardLayout.y - (bounds.height * boardLayout.cell) / 2;

  const col = Math.floor(xInside / boardLayout.cell);
  const row = Math.floor(yInside / boardLayout.cell);

  const insideBoard = row >= 0 && col >= 0 && row < BOARD_SIZE && col < BOARD_SIZE;

  if (!insideBoard) {
    return {
      pieceId: piece.instanceId,
      row,
      col,
      valid: false
    };
  }

  return {
    pieceId: piece.instanceId,
    row,
    col,
    valid: canPlacePiece(board, piece, row, col)
  };
};
