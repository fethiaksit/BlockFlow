import { useEffect, useMemo, useRef } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';
import { Board } from './src/components/Board';
import { DragGhost } from './src/components/DragGhost';
import { GameOverModal } from './src/components/GameOverModal';
import { PieceTray } from './src/components/PieceTray';
import { ScoreHeader } from './src/components/ScoreHeader';
import { COLORS } from './src/constants/game';
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
    ghostOpacity.value = 1;
    startDrag(pieceId, x, y);
  };

  const handleDragMove = (x: number, y: number) => {
    ghostFingerX.value = x;
    ghostFingerY.value = y;
    moveDrag(x, y);
    updatePreviewFromPoint(x, y);
  };

  const handleInvalidDropAfterAnimation = async (finalPreview: PlacementPreview) => {
    await tryPlacePreview(finalPreview, true);
    ghostOpacity.value = 0;
  };

  const handleDragEnd = async (x: number, y: number) => {
    ghostFingerX.value = x;
    ghostFingerY.value = y;

    moveDrag(x, y);
    const finalPreview = updatePreviewFromPoint(x, y);

    if (!finalPreview) {
      ghostOpacity.value = 0;
      await tryPlacePreview(null, false);
      return;
    }

    if (finalPreview.valid) {
      ghostOpacity.value = 0;
      await tryPlacePreview(finalPreview, true);
      return;
    }

    const origin = dragOriginRef.current;
    if (!origin) {
      ghostOpacity.value = 0;
      await tryPlacePreview(finalPreview, true);
      return;
    }

    ghostFingerX.value = withTiming(origin.x, { duration: 180 });
    ghostFingerY.value = withTiming(origin.y, { duration: 180 }, (finished) => {
      if (finished) {
        runOnJS(handleInvalidDropAfterAnimation)(finalPreview);
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
            onLayoutMeasured={handleBoardLayoutMeasured}
          />

          {invalidText ? <Text style={styles.invalidText}>{invalidText}</Text> : <View style={styles.invalidPlaceholder} />}

          <PieceTray
            hand={hand}
            draggingPieceId={drag?.piece.instanceId}
            selectedPieceId={selectedPieceId}
            disabled={gameOver}
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
          <DragGhost piece={drag.piece} fingerX={ghostFingerX} fingerY={ghostFingerY} opacity={ghostOpacity} cellSize={boardLayoutRef.current?.cellSize} />
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
