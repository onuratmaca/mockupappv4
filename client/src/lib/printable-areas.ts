/**
 * Printable area configuration for each mockup template
 * These values are used to calculate where to place designs on each type of mockup
 */

export type PrintableArea = {
  // Horizontal percentage from the left edge of the image
  xCenter: number;
  // Vertical percentage from the top edge of the image
  yCenter: number;
  // Maximum width of the printable area as a percentage of the image width
  width: number;
  // Maximum height of the printable area as a percentage of the image height
  height: number;
  // Additional position adjustments for different placement options (top, center, bottom)
  positionOffsets: {
    top: { x: number; y: number };
    center: { x: number; y: number };
    bottom: { x: number; y: number };
  };
};

// Default printable area if specific mockup configuration is not found
const DEFAULT_PRINTABLE_AREA: PrintableArea = {
  xCenter: 0.5,   // Center horizontally
  yCenter: 0.45,  // Slightly above center vertically
  width: 0.4,     // 40% of mockup width
  height: 0.5,    // 50% of mockup height
  positionOffsets: {
    top: { x: 0, y: -0.15 },     // Move up for top position
    center: { x: 0, y: 0 },      // No adjustment for center
    bottom: { x: 0, y: 0.15 },   // Move down for bottom position
  }
};

// Configuration for each mockup's printable area
export const MOCKUP_PRINTABLE_AREAS: Record<number, PrintableArea> = {
  // Mockup 1
  1: {
    xCenter: 0.5,
    yCenter: 0.42,
    width: 0.4,
    height: 0.45,
    positionOffsets: {
      top: { x: 0, y: -0.15 },
      center: { x: 0, y: 0 },
      bottom: { x: 0, y: 0.15 },
    }
  },
  // Mockup 2
  2: {
    xCenter: 0.5,
    yCenter: 0.45,
    width: 0.35,
    height: 0.45,
    positionOffsets: {
      top: { x: 0, y: -0.12 },
      center: { x: 0, y: 0 },
      bottom: { x: 0, y: 0.12 },
    }
  },
  // Mockup 3
  3: {
    xCenter: 0.5,
    yCenter: 0.43,
    width: 0.38,
    height: 0.48,
    positionOffsets: {
      top: { x: 0, y: -0.16 },
      center: { x: 0, y: 0 },
      bottom: { x: 0, y: 0.16 },
    }
  },
  // Mockup 4
  4: {
    xCenter: 0.5,
    yCenter: 0.44,
    width: 0.42,
    height: 0.5,
    positionOffsets: {
      top: { x: 0, y: -0.14 },
      center: { x: 0, y: 0 },
      bottom: { x: 0, y: 0.14 },
    }
  },
  // Mockup 5
  5: {
    xCenter: 0.5,
    yCenter: 0.46,
    width: 0.36,
    height: 0.45,
    positionOffsets: {
      top: { x: 0, y: -0.13 },
      center: { x: 0, y: 0 },
      bottom: { x: 0, y: 0.13 },
    }
  }
};

/**
 * Get the printable area configuration for a specific mockup
 * @param mockupId The ID of the mockup
 * @returns The printable area configuration
 */
export function getPrintableArea(mockupId: number): PrintableArea {
  return MOCKUP_PRINTABLE_AREAS[mockupId] || DEFAULT_PRINTABLE_AREA;
}