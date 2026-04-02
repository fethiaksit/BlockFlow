import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { getPieceBounds } from '../game/pieces';
import { ActivePiece } from '../game/types';
import { SIZES } from '../theme';

type Props = {
  piece: ActivePiece;
  fingerX: SharedValue<number>;
  fingerY: SharedValue<number>;
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
  cellSize?: number;
  anchorRatioX?: number;
  anchorRatioY?: number;
};

const FALLBACK_CELL_SIZE = 24;

export const DragGhost = ({
  piece,
  fingerX,
  fingerY,
  opacity,
  scale,
  cellSize = FALLBACK_CELL_SIZE,
  anchorRatioX = 0.5,
  anchorRatioY = 0.5
}: Props) => {
  const bounds = getPieceBounds(piece.cells);
  const safeAnchorRatioX = Math.max(0, Math.min(1, anchorRatioX));
  const safeAnchorRatioY = Math.max(0, Math.min(1, anchorRatioY));

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: fingerX.value - bounds.width * cellSize * safeAnchorRatioX },
      { translateY: fingerY.value - bounds.height * cellSize * safeAnchorRatioY },
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
              width: cellSize - SIZES.boardInnerPadding,
              height: cellSize - SIZES.boardInnerPadding,
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
    zIndex: SIZES.zIndexGhost
  },
  block: {
    position: 'absolute',
    borderRadius: SIZES.radiusMd
  }
});
