import { StyleSheet, View } from 'react-native';
import { ActivePiece } from '../game/types';
import { getPieceBounds } from '../game/pieces';

type Props = {
  piece: ActivePiece;
  x: number;
  y: number;
  cellSize?: number;
};

const FALLBACK_CELL_SIZE = 24;

export const DragGhost = ({ piece, x, y, cellSize = FALLBACK_CELL_SIZE }: Props) => {
  const bounds = getPieceBounds(piece.cells);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrapper,
        {
          width: bounds.width * cellSize,
          height: bounds.height * cellSize,
          transform: [
            { translateX: x - (bounds.width * cellSize) / 2 },
            { translateY: y - (bounds.height * cellSize) / 2 }
          ]
        }
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
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 30,
    opacity: 0.88
  },
  block: {
    position: 'absolute',
    borderRadius: 5
  }
});
