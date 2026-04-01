import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

const BOARD_SIZE = 8;
const HORIZONTAL_SAFE_PADDING = 24;

export const useBoardSize = (containerWidth?: number) => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const maxByWindowWidth = width - HORIZONTAL_SAFE_PADDING;
    const maxByContainerWidth = typeof containerWidth === 'number' && containerWidth > 0 ? containerWidth : maxByWindowWidth;
    const maxByHeight = height * 0.5;

    const usableWidth = Math.max(0, Math.min(maxByWindowWidth, maxByContainerWidth, maxByHeight));
    const cellSizePx = Math.max(1, Math.floor(usableWidth / BOARD_SIZE));
    const size = cellSizePx * BOARD_SIZE;

    return {
      boardSizePx: size,
      cellSizePx
    };
  }, [containerWidth, width, height]);
};
