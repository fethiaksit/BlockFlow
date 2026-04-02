export const SIZES = {
  minScoreCardWidth: 110,
  pieceCardMinHeight: 96,
  boardBorderWidth: 1,
  title: 32,
  score: 24,
  modalTitle: 24,
  modalValue: 20,
  buttonText: 16,
  bodyText: 14,
  caption: 13,
  smallText: 12,
  invalidTextHeight: 18,
  zIndexGhost: 30,
  opacityDisabled: 0.6,
  opacityHiddenPiece: 0.12,
  opacityDragGhost: 0.95,
  opacityGameOverBoard: 0.92,
  boardGameOverScale: 0.98,
  dragScale: 1.05,
  previewBaseScale: 0.94,
  previewScaleDelta: 0.06,
  previewOpacityMultiplier: 0.9,
  clearPulseScaleDelta: 0.25,
  clearPulseDuration: 180,
  clearPulseCleanupDelay: 220,
  modalWidthRatio: 0.82,
  modalTranslateY: 10,
  radiusSm: 8,   // Hücre köşeleri daha yuvarlak
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,  // Board ve kartlar için çok daha modern bir görünüm
  radiusXxl: 32,
  boardInnerPadding: 6, // Hücreler arası boşluğu artırarak nefes aldırın
  cellMargin: 2
} as const;

export type Sizes = typeof SIZES;
