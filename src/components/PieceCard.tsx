import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { DRAG_SENSITIVITY } from '../constants/game';
import { getPieceBounds } from '../game/pieces';
import { ActivePiece } from '../game/types';
import { COLORS, SIZES, SPACING } from '../theme';

type Props = {
  piece: ActivePiece;
  scaleCell: number;
  disabled?: boolean;
  hidden?: boolean;
  selected?: boolean;
  fingerX: SharedValue<number>;
  fingerY: SharedValue<number>;
  ghostScale: SharedValue<number>;
  ghostOpacity: SharedValue<number>;
  onSelect: (pieceId: string) => void;
  onDragStart: (
    pieceId: string,
    x: number,
    y: number,
    originX: number,
    originY: number,
    anchorRatioX: number,
    anchorRatioY: number
  ) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
};

export const PieceCard = ({
  piece,
  scaleCell,
  disabled,
  hidden,
  selected,
  fingerX,
  fingerY,
  ghostScale,
  ghostOpacity,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd
}: Props) => {
  const safeCells = Array.isArray(piece?.cells) ? piece.cells : [];
  const bounds = getPieceBounds(safeCells);
  const cardRef = useRef<View>(null);
  const pieceGridRef = useRef<View>(null);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);

  const getAmplifiedFingerPosition = (absoluteX: number, absoluteY: number): { x: number; y: number } => {
    const origin = dragOriginRef.current;
    if (!origin) {
      return { x: absoluteX, y: absoluteY };
    }

    return {
      x: origin.x + (absoluteX - origin.x) * DRAG_SENSITIVITY,
      y: origin.y + (absoluteY - origin.y) * DRAG_SENSITIVITY
    };
  };

  const startDragFromEvent = (x: number, y: number) => {
    if (!piece?.instanceId) return;

    cardRef.current?.measureInWindow((cardPageX, cardPageY, width, height) => {
      const originX = cardPageX + width / 2;
      const originY = cardPageY + height / 2;

      if (!pieceGridRef.current) {
        onDragStart(piece.instanceId, x, y, originX, originY, 0.5, 0.5);
        return;
      }

      pieceGridRef.current.measureInWindow((gridPageX, gridPageY, gridWidth, gridHeight) => {
        const anchorRatioX = gridWidth > 0 ? (x - gridPageX) / gridWidth : 0.5;
        const anchorRatioY = gridHeight > 0 ? (y - gridPageY) / gridHeight : 0.5;

        onDragStart(piece.instanceId, x, y, originX, originY, anchorRatioX, anchorRatioY);
      });
    });
  };

  const handlePanBeginJS = useCallback(
    (startX: number, startY: number) => {
      dragOriginRef.current = { x: startX, y: startY };
      startDragFromEvent(startX, startY);
    },
    [piece?.instanceId]
  );

  const handlePanUpdateJS = useCallback(
    (absoluteX: number, absoluteY: number) => {
      const amplified = getAmplifiedFingerPosition(absoluteX, absoluteY);
      fingerX.value = amplified.x;
      fingerY.value = amplified.y;
      onDragMove(amplified.x, amplified.y);
    },
    [fingerX, fingerY, onDragMove]
  );

  const handlePanEndJS = useCallback(
    (absoluteX: number, absoluteY: number) => {
      const amplified = getAmplifiedFingerPosition(absoluteX, absoluteY);
      onDragEnd(amplified.x, amplified.y);
    },
    [onDragEnd]
  );

  const handlePanFinalizeJS = useCallback(() => {
    dragOriginRef.current = null;
  }, []);

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .runOnJS(true)
    .onEnd((_event, success) => {
      if (success) {
        onSelect(piece.instanceId);
      }
    });

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(SIZES.boardInnerPadding)
    .onBegin((event) => {
      'worklet';
      const startX = event.absoluteX;
      const startY = event.absoluteY;
      fingerX.value = startX;
      fingerY.value = startY;
      ghostScale.value = withTiming(SIZES.dragScale, { duration: 90 });
      ghostOpacity.value = withTiming(SIZES.opacityDragGhost, { duration: 90 });
      runOnJS(handlePanBeginJS)(startX, startY);
    })
    .onUpdate((event) => {
      'worklet';
      runOnJS(handlePanUpdateJS)(event.absoluteX, event.absoluteY);
    })
    .onEnd((event) => {
      'worklet';
      runOnJS(handlePanEndJS)(event.absoluteX, event.absoluteY);
    })
    .onFinalize(() => {
      'worklet';
      runOnJS(handlePanFinalizeJS)();
      ghostScale.value = withTiming(1, { duration: 120 });
      ghostOpacity.value = withTiming(1, { duration: 120 });
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const hiddenStyle = useAnimatedStyle(() => ({
    opacity: hidden ? withTiming(SIZES.opacityHiddenPiece, { duration: 90 }) : withTiming(1, { duration: 90 })
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View ref={cardRef} style={[styles.card, disabled && styles.disabled, selected && styles.selected, hiddenStyle]}>
        <View ref={pieceGridRef} style={{ width: bounds.width * scaleCell, height: bounds.height * scaleCell }}>
          {safeCells.map((cell, index) => (
            <View
              key={`${piece.instanceId}-${index}`}
              style={[
                styles.block,
                {
                  width: scaleCell - SIZES.boardInnerPadding,
                  height: scaleCell - SIZES.boardInnerPadding,
                  left: (cell.col - bounds.minCol) * scaleCell,
                  top: (cell.row - bounds.minRow) * scaleCell,
                  backgroundColor: piece.color
                }
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: SIZES.pieceCardMinHeight,
    backgroundColor: COLORS.panel,
    borderRadius: SIZES.radiusXl,
    borderColor: COLORS.cardBorder,
    borderWidth: SIZES.boardBorderWidth,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.xl
  },
  selected: {
    borderColor: COLORS.cardSelectedBorder
  },
  block: {
    position: 'absolute',
    borderRadius: SIZES.radiusSm
  },
  disabled: {
    opacity: SIZES.opacityDisabled
  }
});
