import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { ActivePiece } from '../game/types';
import { getPieceBounds } from '../game/pieces';

type Props = {
  piece: ActivePiece;
  fingerX: SharedValue<number>;
  fingerY: SharedValue<number>;
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
  cellSize?: number;
};

const FALLBACK_CELL_SIZE = 24;

export const DragGhost = ({ piece, fingerX, fingerY, opacity, scale, cellSize = FALLBACK_CELL_SIZE }: Props) => {
  const bounds = getPieceBounds(piece.cells);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: fingerX.value - (bounds.width * cellSize) / 2 },
      { translateY: fingerY.value - (bounds.height * cellSize) / 2 },
      { scale: scale.value }
    ]
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrapper,
        {
          width: bounds.width * cellSize,
          height: bounds.height * cellSize
        },
        animatedStyle
      ]}
    >
      {piece.cells.map((cell, index) => (
        <View
          key={`${piece.instanceId}-ghost-${index}`}
          style={[
            styles.block,
            {
              width: cellSize - 2,
              height: cellSize - 2,
              left: (cell.col - bounds.minCol) * cellSize,
              top: (cell.row - bounds.minRow) * cellSize,
              backgroundColor: piece.color
            }
          ]}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 30
  },
  block: {
    position: 'absolute',
    borderRadius: 5
  }
});
