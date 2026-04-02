import { SCORE_VALUES } from '../constants/game';
import { MoveScoreBreakdown } from './types';

export const calculateMoveScore = (blockCount: number, clearedLines: number): MoveScoreBreakdown => {
  const blockPoints = blockCount;
  const linePoints = clearedLines * SCORE_VALUES.lineClear;
  const multiBonus = clearedLines > 1 ? (clearedLines - 1) * SCORE_VALUES.multiClearBonus : 0;

  return {
    blockPoints,
    linePoints,
    multiBonus,
    clearedLines,
    total: blockPoints + linePoints + multiBonus
  };
};
