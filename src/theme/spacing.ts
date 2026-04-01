export const SPACING = {
  xxs: 1,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
  xxl: 12,
  xxxl: 14,
  huge: 18,
  giant: 20
} as const;

export type Spacing = typeof SPACING;
