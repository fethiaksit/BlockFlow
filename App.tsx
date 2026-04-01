import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Easing, runOnJS, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Board } from './src/components/Board';
import { DragGhost } from './src/components/DragGhost';
import { GameOverModal } from './src/components/GameOverModal';
import { PieceTray } from './src/components/PieceTray';
import { ScoreHeader } from './src/components/ScoreHeader';
import { getPieceBounds } from './src/game/pieces';
import { useBoardSize } from './src/hooks/useBoardSize';
import { useGameStore } from './src/store/useGameStore';
import { COLORS, SIZES, SPACING } from './src/theme';
import { BoardLayout, calculateDropPreview, PlacementPreview } from './src/utils/drag';

type Screen = 'home' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const { highScore, loadInitial, resetGame } = useGameStore();

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const handleStart = () => {
    resetGame();
    setScreen('game');
  };

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaView style={styles.safeArea}>
        {screen === 'home' ? (
          <View style={styles.homeContainer}>
            <Text style={styles.title}>BlockFlow</Text>
            <Text style={styles.subtitle}>Place blocks, clear lines, chase your best score.</Text>

            {highScore > 0 ? (
              <View style={styles.highScoreCard}>
                <Text style={styles.highScoreLabel}>High Score</Text>
                <Text style={styles.highScoreValue}>{highScore}</Text>
              </View>
            ) : null}

            <Pressable style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>Start</Text>
            </Pressable>
          </View>
        ) : (
          <GameScreen />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function GameScreen() {
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const { boardSizePx } = useBoardSize(containerWidth);

  const {
    board,
    hand,
    score,
    highScore,
    gameOver,
    selectedPieceId,
    drag,
    preview,
    lastMove,
    invalidDropPulse,
    resetGame,
    selectPiece,
    startDrag,
    moveDrag,
    tryPlacePreview
  } = useGameStore();

  const boardLayoutRef = useRef<BoardLayout | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);

  const ghostFingerX = useSharedValue(0);
  const ghostFingerY = useSharedValue(0);
  const ghostOpacity = useSharedValue(0);
  const ghostScale = useSharedValue(1);

  const handleBoardLayoutMeasured = (layout: BoardLayout) => {
    boardLayoutRef.current = layout;
  };

  const updatePreviewFromPoint = (x: number, y: number) => {
    const state = useGameStore.getState();
    const activeDrag = state.drag;
    const activeBoardLayout = boardLayoutRef.current;

    if (!activeDrag || !activeBoardLayout) {
      state.setPreview(null);
      return null;
    }

    const nextPreview = calculateDropPreview(
      x,
      y,
      activeDrag.piece,
      activeBoardLayout,
      state.board,
      activeDrag.anchorRatioX,
      activeDrag.anchorRatioY
    );
    state.setPreview(nextPreview);
    return nextPreview;
  };

  const handleDragStart = (
    pieceId: string,
    x: number,
    y: number,
    originX: number,
    originY: number,
    anchorRatioX: number,
    anchorRatioY: number
  ) => {
    dragOriginRef.current = { x: originX, y: originY };
    ghostFingerX.value = x;
    ghostFingerY.value = y;
    ghostScale.value = withTiming(SIZES.dragScale, { duration: 90 });
    ghostOpacity.value = withTiming(SIZES.opacityDragGhost, { duration: 90 });
    startDrag(pieceId, x, y, anchorRatioX, anchorRatioY);
  };

  const handleDragMove = (x: number, y: number) => {
    moveDrag(x, y);
    updatePreviewFromPoint(x, y);
  };

  const finalizeDrop = async (finalPreview: PlacementPreview, droppedOnBoard: boolean) => {
    await tryPlacePreview(finalPreview, droppedOnBoard);
    ghostOpacity.value = withTiming(0, { duration: 80 });
    ghostScale.value = withTiming(1, { duration: 80 });
  };

  const handleDragEnd = async (x: number, y: number) => {
    ghostFingerX.value = x;
    ghostFingerY.value = y;

    moveDrag(x, y);
    const finalPreview = updatePreviewFromPoint(x, y);

    if (!finalPreview) {
      await finalizeDrop(null, false);
      return;
    }

    if (finalPreview.valid && boardLayoutRef.current && drag) {
      const bounds = getPieceBounds(drag.piece.cells);
      const { cellSize, gridX, gridY } = boardLayoutRef.current;
      const anchorX = gridX + (finalPreview.col + bounds.minCol + bounds.width * drag.anchorRatioX) * cellSize;
      const anchorY = gridY + (finalPreview.row + bounds.minRow + bounds.height * drag.anchorRatioY) * cellSize;

      ghostFingerX.value = withTiming(anchorX, { duration: 110, easing: Easing.out(Easing.quad) });
      ghostFingerY.value = withTiming(anchorY, { duration: 110, easing: Easing.out(Easing.quad) });
      ghostScale.value = withSequence(withTiming(SIZES.dragScale, { duration: 60 }), withTiming(1, { duration: 80 }));

      ghostOpacity.value = withTiming(0, { duration: 130 }, (finished) => {
        if (finished) {
          runOnJS(finalizeDrop)(finalPreview, true);
        }
      });
      return;
    }

    const origin = dragOriginRef.current;
    if (!origin) {
      await finalizeDrop(finalPreview, true);
      return;
    }

    ghostFingerX.value = withSequence(
      withTiming(origin.x + SPACING.lg, { duration: 45 }),
      withTiming(origin.x - SPACING.lg, { duration: 45 }),
      withTiming(origin.x, { duration: 80 })
    );
    ghostFingerY.value = withTiming(origin.y, { duration: 160 }, (finished) => {
      if (finished) {
        runOnJS(finalizeDrop)(finalPreview, true);
      }
    });
  };

  const invalidText = useMemo(() => {
    if (!drag) return '';
    if (!preview) return '';
    return preview.valid ? '' : 'Geçersiz yerleştirme';
  }, [drag, preview, invalidDropPulse]);

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth((prev) => (prev === width ? prev : width));
  };

  return (
    <>
      <View style={styles.container} onLayout={handleContainerLayout}>
        <Text style={styles.title}>BlockFlow</Text>

        <ScoreHeader score={score} highScore={highScore} lastMove={lastMove} />

        <Board
          board={board}
          sizePx={boardSizePx}
          preview={preview}
          draggingPiece={drag?.piece ?? null}
          gameOver={gameOver}
          onLayoutMeasured={handleBoardLayoutMeasured}
        />

        {invalidText ? <Text style={styles.invalidText}>{invalidText}</Text> : <View style={styles.invalidPlaceholder} />}

        <PieceTray
          hand={hand}
          draggingPieceId={drag?.piece.instanceId}
          selectedPieceId={selectedPieceId}
          disabled={gameOver}
          fingerX={ghostFingerX}
          fingerY={ghostFingerY}
          ghostScale={ghostScale}
          ghostOpacity={ghostOpacity}
          onSelectPiece={selectPiece}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />

        <Pressable style={styles.restartButton} onPress={resetGame}>
          <Text style={styles.restartText}>Yeniden Başlat</Text>
        </Pressable>
      </View>

      {drag ? (
        <DragGhost
          piece={drag.piece}
          fingerX={ghostFingerX}
          fingerY={ghostFingerY}
          opacity={ghostOpacity}
          scale={ghostScale}
          cellSize={boardLayoutRef.current?.cellSize}
          anchorRatioX={drag.anchorRatioX}
          anchorRatioY={drag.anchorRatioY}
        />
      ) : null}

      <GameOverModal visible={gameOver} score={score} highScore={highScore} onRestart={resetGame} />
    </>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  safeArea: {
    flex: 1
  },
  homeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.giant,
    gap: SPACING.huge
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.giant,
    paddingBottom: SPACING.giant,
    alignItems: 'center'
  },
  title: {
    marginTop: SPACING.huge,
    fontSize: SIZES.title,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.4
  },
  subtitle: {
    fontSize: SIZES.bodyText,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20
  },
  highScoreCard: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.giant,
    alignItems: 'center',
    minWidth: 180
  },
  highScoreLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  highScoreValue: {
    fontSize: SIZES.score,
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  startButton: {
    backgroundColor: COLORS.accent,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.giant,
    minWidth: 180,
    alignItems: 'center'
  },
  startButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: SIZES.buttonText,
    letterSpacing: 0.5
  },
  invalidText: {
    minHeight: SIZES.invalidTextHeight,
    marginTop: SPACING.md,
    color: COLORS.invalidText,
    fontSize: SIZES.smallText,
    fontWeight: '600'
  },
  invalidPlaceholder: {
    minHeight: SIZES.invalidTextHeight,
    marginTop: SPACING.md
  },
  restartButton: {
    marginTop: SPACING.huge,
    backgroundColor: COLORS.restartButton,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.giant,
    alignSelf: 'stretch',
    alignItems: 'center'
  },
  restartText: {
    color: COLORS.white,
    fontSize: SIZES.buttonText,
    fontWeight: '700'
  }
});
