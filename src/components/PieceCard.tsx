import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ActivePiece } from '../game/types';
import { getPieceBounds } from '../game/pieces';

type Props = {
  piece: ActivePiece;
  scaleCell: number;
  disabled?: boolean;
  hidden?: boolean;
  selected?: boolean;
  onSelect: (pieceId: string) => void;
  onDragStart: (pieceId: string, x: number, y: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
};

export const PieceCard = ({ piece, scaleCell, disabled, hidden, selected, onSelect, onDragStart, onDragMove, onDragEnd }: Props) => {
  const bounds = getPieceBounds(piece.cells);

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
    .minDistance(4)
    .runOnJS(true)
    .onStart((event) => {
      onDragStart(piece.instanceId, event.absoluteX, event.absoluteY);
    })
    .onUpdate((event) => {
      onDragMove(event.absoluteX, event.absoluteY);
    })
    .onFinalize((event) => {
      onDragEnd(event.absoluteX, event.absoluteY);
    });

  const composedGesture = Gesture.Simultaneous(tapGesture, panGesture);

  if (hidden) {
    return <View style={[styles.card, { opacity: 0.15 }]} />;
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={[styles.card, disabled && styles.disabled, selected && styles.selected]}>
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
      </View>
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
