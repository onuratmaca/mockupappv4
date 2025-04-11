// Design ratio options
export type DesignRatio = 'square' | 'landscape' | 'portrait' | 'wide';

export const DESIGN_RATIOS: Record<DesignRatio, { label: string; value: number }> = {
  square: {
    label: 'Square (1:1)',
    value: 1
  },
  landscape: {
    label: 'Landscape (4:3)',
    value: 4/3
  },
  portrait: {
    label: 'Portrait (3:4)',
    value: 3/4
  },
  wide: {
    label: 'Wide (16:9)',
    value: 16/9
  }
};
