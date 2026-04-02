import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, SafeAreaView, StyleSheet, Text, View, Dimensions, Animated as RNAnimated } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Easing, runOnJS, useSharedValue, withSequence, withTiming, withRepeat } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
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
import {
  getSoundEnabled,
  initializeSoundSettings,
  playClickSound,
  playGameOverSound,
  playPlacementSound,
  playWinSound,
  preloadSounds,
  setSoundEnabled,
  unloadSounds
} from './src/utils/sound';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Screen = 'home' | 'game';

/**
 * Giriş ekranındaki yüzen balon efekti için küçük bir yardımcı bileşen
 */
function FloatingBubble({ size, color, top, left, duration }: { size: number, color: string, top: number, left: number, duration: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-20, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        top,
        left,
        opacity: 0.15,
      }, { transform: [{ translateY }] }]}
    />
  );
}

function SoundToggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  const progress = useRef(new RNAnimated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    RNAnimated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false
    }).start();
  }, [progress, value]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 20]
  });

  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#D5DDF5', COLORS.accent]
  });

  return (
    <Pressable style={styles.settingsToggleRow} onPress={onToggle}>
      <Text style={styles.settingsItemText}>Sound</Text>
      <RNAnimated.View style={[styles.toggleTrack, { backgroundColor: trackColor }]}>
        <RNAnimated.View style={[styles.toggleThumb, { transform: [{ translateX }] }]} />
      </RNAnimated.View>
    </Pressable>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const { highScore, loadInitial, resetGame } = useGameStore();

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    void initializeSoundSettings();
    void preloadSounds();

    return () => {
      void unloadSounds();
    };
  }, []);

  const handleStart = () => {
    void playClickSound();
    resetGame();
    setScreen('game');
  };

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaView style={styles.safeArea}>
        {screen === 'home' ? (
          <View style={styles.homeContainer}>
            {/* Arka Plan Balonları */}
            <FloatingBubble size={120} color="#FF6B6B" top={100} left={-30} duration={3000} />
            <FloatingBubble size={80} color="#4ECDC4" top={250} left={SCREEN_WIDTH - 50} duration={2500} />
            <FloatingBubble size={150} color="#FFD93D" top={500} left={20} duration={3500} />
            <FloatingBubble size={60} color="#6C5CE7" top={650} left={SCREEN_WIDTH - 100} duration={2000} />

            <View style={styles.logoBadge}>
              <Text style={styles.title}>BlockFlow</Text>
            </View>

            <Text style={styles.subtitle}>Renkli blokları eşleştir, patlat ve rekorunu kır!</Text>

            {highScore > 0 ? (
              <View style={styles.highScoreCard}>
                <Text style={styles.highScoreLabel}>EN YÜKSEK SKOR</Text>
                <Text style={styles.highScoreValue}>{highScore}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.startButton,
                pressed && { transform: [{ scale: 0.95 }], opacity: 0.9 }
              ]}
              onPress={handleStart}
            >
              <Text style={styles.startButtonText}>OYUNA BAŞLA</Text>
            </Pressable>
          </View>
        ) : (
          <GameScreen onGoHome={() => setScreen('home')} />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function GameScreen({ onGoHome }: { onGoHome: () => void }) {
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
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
  const previousMoveRef = useRef(lastMove);
  const previousGameOverRef = useRef(gameOver);

  const ghostFingerX = useSharedValue(0);
  const ghostFingerY = useSharedValue(0);
  const ghostOpacity = useSharedValue(0);
  const ghostScale = useSharedValue(1);

  useEffect(() => {
    setSoundOn(getSoundEnabled());
  }, []);

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
    void playClickSound();
    dragOriginRef.current = { x: originX, y: originY };
    ghostFingerX.value = x;
    ghostFingerY.value = y;
    ghostScale.value = withTiming(SIZES.dragScale, { duration: 90 });
    ghostOpacity.value = withTiming(SIZES.opacityDragGhost, { duration: 90 });
    startDrag(pieceId, x, y, anchorRatioX, anchorRatioY);
  };

  useEffect(() => {
    if (lastMove && lastMove !== previousMoveRef.current) {
      void playPlacementSound();

      if (lastMove.clearedLines > 0) {
        void playWinSound();
      }
    }

    previousMoveRef.current = lastMove;
  }, [lastMove]);

  useEffect(() => {
    if (gameOver && !previousGameOverRef.current) {
      void playGameOverSound();
    }

    previousGameOverRef.current = gameOver;
  }, [gameOver]);

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

  const toggleSettings = () => {
    void playClickSound();
    setSettingsOpen((prev) => !prev);
  };

  const handleSoundToggle = async () => {
    if (soundOn) {
      void playClickSound();
    }

    const nextValue = !soundOn;
    setSoundOn(nextValue);
    await setSoundEnabled(nextValue);

    if (nextValue) {
      void playClickSound();
    }
  };

  const handleGoHome = () => {
    void playClickSound();
    setSettingsOpen(false);
    onGoHome();
  };

  const handleRestart = () => {
    void playClickSound();
    resetGame();
    setSettingsOpen(false);
  };

  return (
    <>
      <View style={styles.container} onLayout={handleContainerLayout}>
        {settingsOpen ? <Pressable style={styles.settingsBackdrop} onPress={() => setSettingsOpen(false)} /> : null}

        <View style={styles.gameTopRow}>
          <Text style={styles.gameTitle}>BlockFlow</Text>

          <View style={styles.settingsAnchor}>
            <Pressable
              style={({ pressed }) => [styles.settingsIconButton, pressed && { opacity: 0.75 }]}
              onPress={toggleSettings}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </Pressable>

            {settingsOpen ? (
              <View style={styles.settingsDropdown}>
                <SoundToggle value={soundOn} onToggle={handleSoundToggle} />

                <Pressable
                  style={({ pressed }) => [styles.settingsItem, pressed && styles.settingsItemPressed]}
                  onPress={handleGoHome}
                >
                  <Text style={styles.settingsItemText}>Go to Home</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.settingsItem, pressed && styles.settingsItemPressed]}
                  onPress={handleRestart}
                >
                  <Text style={styles.settingsItemText}>Restart Game</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>

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
          onSelectPiece={(pieceId) => {
            void playClickSound();
            selectPiece(pieceId);
          }}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />

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
    backgroundColor: '#F0F4FF' // Daha yumuşak bir arka plan
  },
  logoBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.giant,
    paddingVertical: SPACING.lg,
    borderRadius: 50, // Tam yuvarlak "balon" görünümü
    marginBottom: SPACING.xl,
    elevation: 10,
    shadowColor: COLORS.boardFilled,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.giant,
    paddingBottom: SPACING.giant,
    alignItems: 'center'
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.boardFilled,
    letterSpacing: -1
  },
  gameTopRow: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 30
  },
  gameTitle: {
    fontSize: SIZES.title,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.4
  },
  settingsAnchor: {
    position: 'relative'
  },
  settingsIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.boardBorder,
    alignItems: 'center',
    justifyContent: 'center'
  },
  settingsIcon: {
    fontSize: 18
  },
  settingsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20
  },
  settingsDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: SPACING.md,
    width: 170,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.boardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden'
  },
  settingsItem: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2FF'
  },
  settingsItemPressed: {
    backgroundColor: '#F7F9FF'
  },
  settingsItemText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600'
  },
  settingsToggleRow: {
    minHeight: 50,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2FF'
  },
  toggleTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center'
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 26,
    marginBottom: SPACING.giant
  },
  highScoreCard: {
    backgroundColor: COLORS.panel,
    borderRadius: SIZES.radiusXxl,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.giant,
    alignItems: 'center',
    minWidth: 220,
    marginBottom: SPACING.huge,
    borderWidth: 2,
    borderColor: '#E8EDFB'
  },
  highScoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    letterSpacing: 2
  },
  highScoreValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.textPrimary
  },
  startButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 100, // Balon gibi tam yuvarlak buton
    paddingVertical: 20,
    paddingHorizontal: 60,
    elevation: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  startButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 1
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
    borderRadius: SIZES.radiusXl,
    paddingVertical: SPACING.xl,
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
