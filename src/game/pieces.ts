import { ActivePiece, PieceDefinition } from './types';

// Mevcut palette dizisini şu canlı renklerle değiştirin:
const palette = [
  '#FF6B6B', // Kiraz
  '#4ECDC4', // Turkuaz
  '#FFD93D', // Güneş Sarısı
  '#6C5CE7', // Mor
  '#A8E6CF', // Nane Yeşili
  '#FF8B3D'  // Portakal
];
export const PIECE_LIBRARY: PieceDefinition[] = [
  { id: 'single', name: 'Single', color: palette[0], weight: 8, cells: [{ row: 0, col: 0 }] },
  {
    id: 'line2_h',
    name: 'Line 2',
    color: palette[1],
    weight: 8,
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 }
    ]
  },
  {
    id: 'line3_h',
    name: 'Line 3',
    color: palette[2],
    weight: 8,
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 }
    ]
  },
  {
    id: 'line3_v',
    name: 'Line 3V',
    color: palette[3],
    weight: 8,
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 }
    ]
  },
  {
    id: 'square2',
    name: 'Square 2',
    color: palette[4],
    weight: 7,
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 }
    ]
  },
  {
    id: 'l3',
    name: 'L 3',
    color: palette[5],
    weight: 7,
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 1, col: 1 }
    ]
  },
  {
    id: 'l4',
    name: 'L 4',
    color: palette[0],
    weight: 5,
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 2, col: 1 }
    ]
  },
  {
    id: 't4',
    name: 'T 4',
    color: palette[1],
    weight: 5,
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 1 }
    ]
  },
  {
    id: 'plus5',
    name: 'Plus',
    color: palette[2],
    weight: 3,
    cells: [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 1 }
    ]
  }
];

const weightedPool = PIECE_LIBRARY.flatMap((piece) => Array.from({ length: piece.weight }, () => piece));

export const createPieceInstance = (definition: PieceDefinition): ActivePiece => ({
  ...definition,
  instanceId: `${definition.id}_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`
});

export const drawRandomPiece = (): ActivePiece => {
  const index = Math.floor(Math.random() * weightedPool.length);
  return createPieceInstance(weightedPool[index]);
};

export const drawHand = (count: number): ActivePiece[] => Array.from({ length: count }, drawRandomPiece);

export const getPieceBounds = (cells: { row: number; col: number }[]) => {
  if (!Array.isArray(cells) || cells.length === 0) {
    return {
      minRow: 0,
      minCol: 0,
      maxRow: 0,
      maxCol: 0,
      width: 1,
      height: 1
    };
  }

  const rows = cells.map((cell) => cell.row);
  const cols = cells.map((cell) => cell.col);
  const minRow = Math.min(...rows);
  const minCol = Math.min(...cols);
  const maxRow = Math.max(...rows);
  const maxCol = Math.max(...cols);

  return {
    minRow,
    minCol,
    maxRow,
    maxCol,
    width: maxCol - minCol + 1,
    height: maxRow - minRow + 1
  };
};
