import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { ActivePiece } from '../game/types';
import { getPieceBounds } from '../game/pieces';

type Props = {
  piece: ActivePiece;
  scaleCell: number;
  disabled?: boolean;
  hidden?: boolean;
  onDragStart: (pieceId: string, x: number, y: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: () => void;
};

export const PieceCard = ({ piece, scaleCell, disabled, hidden, onDragStart, onDragMove, onDragEnd }: Props) => {
  const bounds = getPieceBounds(piece.cells);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: (event) => {
      onDragStart(piece.instanceId, event.nativeEvent.pageX, event.nativeEvent.pageY);
    },
    onPanResponderMove: (event) => {
      onDragMove(event.nativeEvent.pageX, event.nativeEvent.pageY);
    },
    onPanResponderRelease: () => onDragEnd(),
    onPanResponderTerminate: () => onDragEnd()
  });

  if (hidden) {
    return <View style={[styles.card, { opacity: 0.15 }]} />;
  }

  return (
    <View style={[styles.card, disabled && styles.disabled]} {...panResponder.panHandlers}>
      <View style={{ width: bounds.width * scaleCell, height: bounds.height * scaleCell }}>
        {piece.cells.map((cell, index) => (
          <View
            key={`${piece.instanceId}-${index}`}
            style={[
              styles.block,
              {
                width: scaleCell - 2,
                height: scaleCell - 2,
                left: cell.col * scaleCell,
                top: cell.row * scaleCell,
                backgroundColor: piece.color
              }
            ]}
          />
        ))}
      </View>
      <Text style={styles.name}>{piece.name}</Text>
    </View>
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
