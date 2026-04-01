import { StyleSheet, View } from 'react-native';
import { ActivePiece } from '../game/types';
import { PieceCard } from './PieceCard';

type Props = {
  hand: ActivePiece[];
  draggingPieceId?: string;
  selectedPieceId?: string | null;
  disabled?: boolean;
  onSelectPiece: (pieceId: string) => void;
  onDragStart: (pieceId: string, x: number, y: number, originX: number, originY: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
};

export const PieceTray = ({
  hand,
  draggingPieceId,
  selectedPieceId,
  disabled,
  onSelectPiece,
  onDragStart,
  onDragMove,
  onDragEnd
}: Props) => {
  return (
    <View style={styles.row}>
      {hand.map((piece) => (
        <PieceCard
          key={piece.instanceId}
          piece={piece}
          scaleCell={20}
          disabled={disabled}
          hidden={draggingPieceId === piece.instanceId}
          selected={selectedPieceId === piece.instanceId}
          onSelect={onSelectPiece}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginTop: 14
  }
});
