import * as Haptics from 'expo-haptics';
import { create } from 'zustand';
import { BOARD_SIZE, HAND_SIZE } from '../constants/game';
import { canPlacePiece, createEmptyBoard, resolveMove } from '../game/board';
import { isGameOver } from '../game/gameOver';
import { drawHand } from '../game/pieces';
import { ActivePiece, MoveScoreBreakdown } from '../game/types';
import { loadHighScore, saveHighScore } from '../utils/storage';

type PlacementPreview = {
  pieceId: string;
  row: number;
  col: number;
  valid: boolean;
} | null;

type DragState = {
  piece: ActivePiece;
  fingerX: number;
  fingerY: number;
} | null;

type GameState = {
  board: (0 | 1)[][];
  hand: ActivePiece[];
  score: number;
  highScore: number;
  gameOver: boolean;
  drag: DragState;
  preview: PlacementPreview;
  invalidDropPulse: number;
  lastMove: MoveScoreBreakdown | null;
  loadInitial: () => Promise<void>;
  resetGame: () => void;
  startDrag: (pieceId: string, fingerX: number, fingerY: number) => void;
  moveDrag: (fingerX: number, fingerY: number) => void;
  stopDrag: () => void;
  setPreview: (preview: PlacementPreview) => void;
  tryPlacePreview: () => Promise<void>;
};

const initialHand = drawHand(HAND_SIZE);

export const useGameStore = create<GameState>((set, get) => ({
  board: createEmptyBoard(),
  hand: initialHand,
  score: 0,
  highScore: 0,
  gameOver: false,
  drag: null,
  preview: null,
  invalidDropPulse: 0,
  lastMove: null,

  loadInitial: async () => {
    const highScore = await loadHighScore();
    set({ highScore });
  },

  resetGame: () => {
    set({
      board: createEmptyBoard(),
      hand: drawHand(HAND_SIZE),
      score: 0,
      gameOver: false,
      drag: null,
      preview: null,
      invalidDropPulse: 0,
      lastMove: null
    });
  },

  startDrag: (pieceId, fingerX, fingerY) => {
    const piece = get().hand.find((item) => item.instanceId === pieceId);
    if (!piece || get().gameOver) return;

    set({ drag: { piece, fingerX, fingerY }, preview: null });
  },

  moveDrag: (fingerX, fingerY) => {
    const drag = get().drag;
    if (!drag) return;

    set({ drag: { ...drag, fingerX, fingerY } });
  },

  stopDrag: () => {
    set({ drag: null, preview: null });
  },

  setPreview: (preview) => set({ preview }),

  tryPlacePreview: async () => {
    const { preview, drag, board, hand, score, highScore } = get();

    if (!preview || !drag || preview.pieceId !== drag.piece.instanceId || !preview.valid) {
      set((state) => ({
        drag: null,
        preview: null,
        invalidDropPulse: state.invalidDropPulse + 1
      }));
      return;
    }

    if (!canPlacePiece(board, drag.piece, preview.row, preview.col)) {
      set((state) => ({
        drag: null,
        preview: null,
        invalidDropPulse: state.invalidDropPulse + 1
      }));
      return;
    }

    const move = resolveMove(board, drag.piece, preview.row, preview.col);
    const nextScore = score + move.score.total;

    let nextHand = hand.filter((piece) => piece.instanceId !== drag.piece.instanceId);
    if (nextHand.length === 0) {
      nextHand = drawHand(HAND_SIZE);
    }

    const nextGameOver = isGameOver(move.board, nextHand);

    const nextState: Partial<GameState> = {
      board: move.board,
      hand: nextHand,
      score: nextScore,
      gameOver: nextGameOver,
      preview: null,
      drag: null,
      lastMove: move.score
    };

    if (nextScore > highScore) {
      nextState.highScore = nextScore;
      await saveHighScore(nextScore);
    }

    set(nextState as GameState);

    if (move.score.clearedLines > 0) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.selectionAsync();
    }

    if (nextGameOver) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }
}));

export const clampToBoard = (value: number): number => {
  if (value < 0) return 0;
  if (value >= BOARD_SIZE) return BOARD_SIZE - 1;
  return value;
};
