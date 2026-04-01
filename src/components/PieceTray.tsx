import { StyleSheet, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { ActivePiece } from '../game/types';
import { PieceCard } from './PieceCard';

type Props = {
  hand: ActivePiece[];
  draggingPieceId?: string;
  selectedPieceId?: string | null;
  disabled?: boolean;
  fingerX: SharedValue<number>;
  fingerY: SharedValue<number>;
  ghostScale: SharedValue<number>;
  ghostOpacity: SharedValue<number>;
  onSelectPiece: (pieceId: string) => void;
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

export const PieceTray = ({
  hand,
  draggingPieceId,
  selectedPieceId,
  disabled,
  fingerX,
  fingerY,
  ghostScale,
  ghostOpacity,
  onSelectPiece,
  onDragStart,
  onDragMove,
  onDragEnd
}: Props) => {
  const safeHand = Array.isArray(hand) ? hand.filter((piece) => Boolean(piece?.instanceId) && Array.isArray(piece?.cells)) : [];

  return (
    <View style={styles.row}>
      {safeHand.map((piece) => (
        <PieceCard
          key={piece.instanceId}
          piece={piece}
          scaleCell={20}
          disabled={disabled}
          hidden={draggingPieceId === piece.instanceId}
          selected={selectedPieceId === piece.instanceId}
          fingerX={fingerX}
          fingerY={fingerY}
          ghostScale={ghostScale}
          ghostOpacity={ghostOpacity}
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
