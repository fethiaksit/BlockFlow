import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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
  gameOver?: boolean;
  onLayoutMeasured: (layout: BoardLayout) => void;
};

type ClearingCell = {
  key: string;
  row: number;
  col: number;
};

const PreviewLayerCell = ({ visible, valid, cellSize }: { visible: boolean; valid: boolean; cellSize: number }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 110 });
  }, [visible, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value * 0.9,
    transform: [{ scale: 0.94 + progress.value * 0.06 }]
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.previewCell,
        {
          width: cellSize,
          height: cellSize,
          backgroundColor: valid ? COLORS.validPreview : COLORS.invalidPreview
        },
        style
      ]}
    />
  );
};

const ClearPulseCell = ({
  row,
  col,
  cellSize,
  cellStep,
  cellMargin
}: {
  row: number;
  col: number;
  cellSize: number;
  cellStep: number;
  cellMargin: number;
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 180 });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scale: 1 - progress.value * 0.25 }]
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.clearPulse,
        {
          width: cellSize,
          height: cellSize,
          left: col * cellStep + cellMargin,
          top: row * cellStep + cellMargin
        },
        style
      ]}
    />
  );
};

export const Board = ({ board, sizePx, preview, draggingPiece, gameOver = false, onLayoutMeasured }: Props) => {
  const boardRef = useRef<View>(null);
  const previousBoardRef = useRef(board);
  const clearPulseIdRef = useRef(0);
  const [clearingCells, setClearingCells] = useState<ClearingCell[]>([]);
  const boardInnerPadding = 2;
  const cellMargin = 1;
  const gridSize = sizePx - boardInnerPadding * 2;
  const cellStep = gridSize / BOARD_SIZE;
  const cellSize = cellStep - cellMargin * 2;

  const boardScale = useSharedValue(1);
  const boardOpacity = useSharedValue(1);

  useEffect(() => {
    boardScale.value = withTiming(gameOver ? 0.98 : 1, { duration: 220 });
    boardOpacity.value = withTiming(gameOver ? 0.92 : 1, { duration: 220 });
  }, [gameOver, boardOpacity, boardScale]);

  const boardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: boardOpacity.value,
    transform: [{ scale: boardScale.value }]
  }));

  useEffect(() => {
    const prev = previousBoardRef.current;
    const pulses: ClearingCell[] = [];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (prev[row][col] === 1 && board[row][col] === 0) {
          const pulseId = clearPulseIdRef.current + 1;
          clearPulseIdRef.current = pulseId;
          pulses.push({ key: `${row}-${col}-${pulseId}`, row, col });
        }
      }
    }

    previousBoardRef.current = board;

    if (pulses.length > 0) {
      setClearingCells(pulses);
      const timeout = setTimeout(() => setClearingCells([]), 220);
      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [board]);

  const measureBoard = useCallback(() => {
    boardRef.current?.measureInWindow((pageX, pageY, width) => {
      const gridSize = width - boardInnerPadding * 2;
      onLayoutMeasured({
        pageX,
        pageY,
        size: width,
        gridSize,
        gridX: pageX + boardInnerPadding,
        gridY: pageY + boardInnerPadding,
        cellSize: gridSize / BOARD_SIZE
      });
    });
  }, [boardInnerPadding, onLayoutMeasured]);

  const handleLayout = (_event: LayoutChangeEvent) => {
    requestAnimationFrame(measureBoard);
  };

  const previewLookup = useMemo(() => {
    const lookup = new Map<string, boolean>();
    if (preview && draggingPiece) {
      draggingPiece.cells.forEach((cell) => {
        const row = preview.row + cell.row;
        const col = preview.col + cell.col;
        lookup.set(`${row}-${col}`, preview.valid);
      });
    }
    return lookup;
  }, [draggingPiece, preview]);

  return (
    <Animated.View ref={boardRef} style={[styles.board, { width: sizePx, height: sizePx }, boardAnimatedStyle]} onLayout={handleLayout}>
      {board.map((row, rowIndex) => (
        <View key={`r-${rowIndex}`} style={styles.row}>
          {row.map((value, colIndex) => {
            const previewKey = `${rowIndex}-${colIndex}`;
            const previewState = previewLookup.get(previewKey);

            return (
              <View
                key={`c-${rowIndex}-${colIndex}`}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: value === 1 ? COLORS.boardFilled : COLORS.boardCell
                  }
                ]}
              >
                {typeof previewState === 'boolean' ? (
                  <PreviewLayerCell visible valid={previewState} cellSize={cellSize} />
                ) : null}
              </View>
            );
          })}
        </View>
      ))}

      {clearingCells.map((cell) => (
        <ClearPulseCell
          key={cell.key}
          row={cell.row}
          col={cell.col}
          cellSize={cellSize}
          cellStep={cellStep}
          cellMargin={cellMargin}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  board: {
    alignSelf: 'center',
    backgroundColor: COLORS.boardBackground,
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: '#2B3558',
    overflow: 'hidden'
  },
  row: {
    flexDirection: 'row',
    flex: 1
  },
  cell: {
    margin: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  previewCell: {
    borderRadius: 4
  },
  clearPulse: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: '#FFF7B0'
  }
});
