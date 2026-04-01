import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Board } from './src/components/Board';
import { DragGhost } from './src/components/DragGhost';
import { GameOverModal } from './src/components/GameOverModal';
import { PieceTray } from './src/components/PieceTray';
import { ScoreHeader } from './src/components/ScoreHeader';
import { COLORS } from './src/constants/game';
import { useBoardSize } from './src/hooks/useBoardSize';
import { useGameStore } from './src/store/useGameStore';
import { BoardLayout, calculateDropPreview } from './src/utils/drag';

export default function App() {
  const { boardSizePx } = useBoardSize();

  const {
    board,
    hand,
    score,
    highScore,
    gameOver,
    drag,
    preview,
    lastMove,
    invalidDropPulse,
    loadInitial,
    resetGame,
    startDrag,
    moveDrag,
    setPreview,
    tryPlacePreview
  } = useGameStore();

  const [boardLayout, setBoardLayout] = useState<BoardLayout | null>(null);
  const boardLayoutRef = useRef<BoardLayout | null>(null);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const handleBoardLayoutMeasured = (layout: BoardLayout) => {
    boardLayoutRef.current = layout;
    setBoardLayout(layout);
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

  const handleDragStart = (pieceId: string, x: number, y: number) => {
    startDrag(pieceId, x, y);
    requestAnimationFrame(() => {
      updatePreviewFromPoint(x, y);
    });
  };

  const handleDragMove = (x: number, y: number) => {
    moveDrag(x, y);
    updatePreviewFromPoint(x, y);
  };

  const handleDragEnd = async (x: number, y: number) => {
    moveDrag(x, y);
    const finalPreview = updatePreviewFromPoint(x, y);
    await tryPlacePreview(finalPreview);
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
            disabled={gameOver}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />

          <Pressable style={styles.restartButton} onPress={resetGame}>
            <Text style={styles.restartText}>Yeniden Başlat</Text>
          </Pressable>
        </View>

        {drag ? <DragGhost piece={drag.piece} x={drag.fingerX} y={drag.fingerY} cellSize={boardLayout?.cellSize} /> : null}

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
