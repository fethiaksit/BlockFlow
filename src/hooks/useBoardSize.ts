import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export const useBoardSize = () => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const maxByWidth = width - 24;
    const maxByHeight = height * 0.5;
    const size = Math.max(280, Math.min(maxByWidth, maxByHeight));
    return {
      boardSizePx: size,
      cellSizePx: size / 8
    };
  }, [width, height]);
};
