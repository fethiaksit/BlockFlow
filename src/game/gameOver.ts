import { Board, PieceDefinition } from './types';
import { hasAnyValidPlacement } from './board';

export const isGameOver = (board: Board, hand: PieceDefinition[]): boolean => {
  if (hand.length === 0) {
    return false;
  }

  return !hand.some((piece) => hasAnyValidPlacement(board, piece));
};
