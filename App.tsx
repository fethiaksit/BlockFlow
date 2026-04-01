import { useEffect, useMemo, useRef } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Easing, runOnJS, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Board } from './src/components/Board';
import { DragGhost } from './src/components/DragGhost';
import { GameOverModal } from './src/components/GameOverModal';
import { PieceTray } from './src/components/PieceTray';
import { ScoreHeader } from './src/components/ScoreHeader';
import { COLORS } from './src/constants/game';
import { getPieceBounds } from './src/game/pieces';
import { useBoardSize } from './src/hooks/useBoardSize';
import { useGameStore } from './src/store/useGameStore';
import { BoardLayout, calculateDropPreview, PlacementPreview } from './src/utils/drag';

export default function App() {
  const { boardSizePx } = useBoardSize();

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
    loadInitial,
    resetGame,
    selectPiece,
    startDrag,
    moveDrag,
    setPreview,
    tryPlacePreview
  } = useGameStore();

  const boardLayoutRef = useRef<BoardLayout | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);

  const ghostFingerX = useSharedValue(0);
  const ghostFingerY = useSharedValue(0);
  const ghostOpacity = useSharedValue(0);
  const ghostScale = useSharedValue(1);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

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

    const nextPreview = calculateDropPreview(x, y, activeDrag.piece, activeBoardLayout, state.board);
    state.setPreview(nextPreview);
    return nextPreview;
  };

  const handleDragStart = (pieceId: string, x: number, y: number, originX: number, originY: number) => {
    dragOriginRef.current = { x: originX, y: originY };
    ghostFingerX.value = x;
    ghostFingerY.value = y;
    ghostScale.value = withTiming(1.05, { duration: 90 });
    ghostOpacity.value = withTiming(0.95, { duration: 90 });
    startDrag(pieceId, x, y);
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
      const { cellSize, pageX, pageY } = boardLayoutRef.current;
      const centerX = pageX + (finalPreview.col + bounds.minCol + bounds.width / 2) * cellSize;
      const centerY = pageY + (finalPreview.row + bounds.minRow + bounds.height / 2) * cellSize;

      ghostFingerX.value = withTiming(centerX, { duration: 110, easing: Easing.out(Easing.quad) });
      ghostFingerY.value = withTiming(centerY, { duration: 110, easing: Easing.out(Easing.quad) });
      ghostScale.value = withSequence(withTiming(1.05, { duration: 60 }), withTiming(1, { duration: 80 }));

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
      withTiming(origin.x + 8, { duration: 45 }),
      withTiming(origin.x - 8, { duration: 45 }),
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

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
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
          />
        ) : null}

        <GameOverModal visible={gameOver} score={score} highScore={highScore} onRestart={resetGame} />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 20
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8
  },
  invalidText: {
    color: '#FF8080',
    marginTop: 8,
    fontWeight: '600',
    fontSize: 13,
    minHeight: 18
  },
  invalidPlaceholder: {
    minHeight: 18,
    marginTop: 8
  },
  restartButton: {
    marginTop: 14,
    backgroundColor: '#2D3A63',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10
  },
  restartText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 14
  }
});
