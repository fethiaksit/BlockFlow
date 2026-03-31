import { StyleSheet, View } from 'react-native';
import { ActivePiece } from '../game/types';
import { getPieceBounds } from '../game/pieces';

type Props = {
  piece: ActivePiece;
  x: number;
  y: number;
};

const CELL = 24;

export const DragGhost = ({ piece, x, y }: Props) => {
  const bounds = getPieceBounds(piece.cells);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrapper,
        {
          width: bounds.width * CELL,
          height: bounds.height * CELL,
          transform: [
            { translateX: x - (bounds.width * CELL) / 2 },
            { translateY: y - (bounds.height * CELL) / 2 }
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
              width: CELL - 2,
              height: CELL - 2,
              left: cell.col * CELL,
              top: cell.row * CELL,
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
