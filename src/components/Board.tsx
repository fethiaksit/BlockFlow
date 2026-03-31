import { useCallback, useRef } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { BOARD_SIZE, COLORS } from '../constants/game';
import { ActivePiece } from '../game/types';
import { BoardLayout } from '../utils/drag';

type Preview = {
  pieceId: string;
  row: number;
  col: number;
  valid: boolean;
} | null;

type Props = {
  board: (0 | 1)[][];
  sizePx: number;
  preview: Preview;
  draggingPiece: ActivePiece | null;
  onLayoutMeasured: (layout: BoardLayout) => void;
};

export const Board = ({ board, sizePx, preview, draggingPiece, onLayoutMeasured }: Props) => {
  const boardRef = useRef<View>(null);
  const cellSize = sizePx / BOARD_SIZE;

  const measureBoard = useCallback(() => {
    boardRef.current?.measureInWindow((pageX, pageY, width) => {
      onLayoutMeasured({ pageX, pageY, size: width, cellSize: width / BOARD_SIZE });
    });
  }, [onLayoutMeasured]);

  const handleLayout = (_event: LayoutChangeEvent) => {
    requestAnimationFrame(measureBoard);
  };

  const previewLookup = new Map<string, boolean>();
  if (preview && draggingPiece) {
    draggingPiece.cells.forEach((cell) => {
      const row = preview.row + cell.row;
      const col = preview.col + cell.col;
      previewLookup.set(`${row}-${col}`, preview.valid);
    });
  }

  return (
    <View ref={boardRef} style={[styles.board, { width: sizePx, height: sizePx }]} onLayout={handleLayout}>
      {board.map((row, rowIndex) => (
        <View key={`r-${rowIndex}`} style={styles.row}>
          {row.map((value, colIndex) => {
            const previewKey = `${rowIndex}-${colIndex}`;
            const previewState = previewLookup.get(previewKey);

            let backgroundColor = value === 1 ? COLORS.boardFilled : COLORS.boardCell;
            if (previewState === true) backgroundColor = COLORS.validPreview;
            if (previewState === false) backgroundColor = COLORS.invalidPreview;

            return <View key={`c-${rowIndex}-${colIndex}`} style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor }]} />;
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  board: {
    backgroundColor: COLORS.boardBackground,
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: '#2B3558'
  },
  row: {
    flexDirection: 'row',
    flex: 1
  },
  cell: {
    margin: 1,
    borderRadius: 4
  }
});
