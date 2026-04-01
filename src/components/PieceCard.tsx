import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ActivePiece } from '../game/types';
import { getPieceBounds } from '../game/pieces';

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
  onDragStart: (pieceId: string, x: number, y: number, originX: number, originY: number) => void;
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
  const bounds = getPieceBounds(piece.cells);
  const cardRef = useRef<View>(null);

  const startDragFromEvent = (x: number, y: number) => {
    cardRef.current?.measureInWindow((pageX, pageY, width, height) => {
      onDragStart(piece.instanceId, x, y, pageX + width / 2, pageY + height / 2);
    });
  };

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
    .minDistance(2)
    .onBegin((event) => {
      'worklet';
      fingerX.value = event.absoluteX;
      fingerY.value = event.absoluteY;
      ghostScale.value = withTiming(1.05, { duration: 90 });
      ghostOpacity.value = withTiming(0.95, { duration: 90 });
      runOnJS(startDragFromEvent)(event.absoluteX, event.absoluteY);
    })
    .onUpdate((event) => {
      'worklet';
      fingerX.value = event.absoluteX;
      fingerY.value = event.absoluteY;
      runOnJS(onDragMove)(event.absoluteX, event.absoluteY);
    })
    .onEnd((event) => {
      'worklet';
      runOnJS(onDragEnd)(event.absoluteX, event.absoluteY);
    })
    .onFinalize(() => {
      'worklet';
      ghostScale.value = withTiming(1, { duration: 120 });
      ghostOpacity.value = withTiming(1, { duration: 120 });
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const hiddenStyle = useAnimatedStyle(() => ({
    opacity: hidden ? withTiming(0.12, { duration: 90 }) : withTiming(1, { duration: 90 })
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View ref={cardRef} style={[styles.card, disabled && styles.disabled, selected && styles.selected, hiddenStyle]}>
        <View style={{ width: bounds.width * scaleCell, height: bounds.height * scaleCell }}>
          {piece.cells.map((cell, index) => (
            <View
              key={`${piece.instanceId}-${index}`}
              style={[
                styles.block,
                {
                  width: scaleCell - 2,
                  height: scaleCell - 2,
                  left: (cell.col - bounds.minCol) * scaleCell,
                  top: (cell.row - bounds.minRow) * scaleCell,
                  backgroundColor: piece.color
                }
              ]}
            />
          ))}
        </View>
        <Text style={styles.name}>{piece.name}</Text>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 96,
    backgroundColor: '#171D31',
    borderRadius: 12,
    borderColor: '#303A5B',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10
  },
  selected: {
    borderColor: '#8BA8FF'
  },
  block: {
    position: 'absolute',
    borderRadius: 4
  },
  name: {
    marginTop: 8,
    color: '#BFC9E7',
    fontSize: 12,
    fontWeight: '600'
  },
  disabled: {
    opacity: 0.6
  }
});
