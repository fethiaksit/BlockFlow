export const COLORS = {
  background: '#0E1220',
  boardBackground: '#1A2035',
  boardCell: '#242D4A',
  boardFilled: '#5B8CFF',
  textPrimary: '#F2F5FF',
  textSecondary: '#A9B5D6',
  validPreview: 'rgba(104, 222, 143, 0.6)',
  invalidPreview: 'rgba(255, 92, 92, 0.65)',
  panel: '#171D31',
  accent: '#7D9DFF',
  boardBorder: '#2B3558',
  cardBorder: '#303A5B',
  cardSelectedBorder: '#8BA8FF',
  white: '#FFF',
  clearPulse: '#FFF7B0',
  invalidText: '#FF8080',
  restartButton: '#2D3A63',
  backdrop: 'rgba(0,0,0,0.58)'
} as const;

export type Colors = typeof COLORS;
