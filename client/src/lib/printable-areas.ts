/**
 * Printable area configuration for each mockup template
 * These values are used to calculate where to place designs on each type of mockup
 */
import { ShirtPosition } from "./mockup-data";

export type PrintableArea = {
  // Horizontal percentage from the left edge of a shirt
  xCenter: number;
  // Vertical percentage from the top edge of a shirt
  yCenter: number;
  // Maximum width of the printable area as a percentage of the shirt width
  width: number;
  // Maximum height of the printable area as a percentage of the shirt height
  height: number;
  // Additional position adjustments for different placement options (top, center, bottom)
  positionOffsets: {
    top: { x: number; y: number };
    center: { x: number; y: number };
    bottom: { x: number; y: number };
  };
};

// Default printable area if specific mockup configuration is not found
// Based on analysis of 4000x3000 px mockups with 8 shirts in a 4x2 grid
const DEFAULT_PRINTABLE_AREA: PrintableArea = {
  xCenter: 0.5,   // Center horizontally within each shirt
  yCenter: 0.42,  // Slightly above center vertically to account for neckline
  width: 0.66,    // 66% of shirt width (880px for an 880px wide shirt)
  height: 0.55,   // 55% of shirt height (726px for a 1320px tall shirt)
  positionOffsets: {
    top: { x: 0, y: -0.09 },     // Move up for top position (~120px)
    center: { x: 0, y: 0 },      // No adjustment for center
    bottom: { x: 0, y: 0.09 },   // Move down for bottom position (~120px)
  }
};

// Configuration for each mockup style's printable area
// The key is the mockup ID (1-5), values based on careful analysis of 4000x3000 px mockups
export const MOCKUP_PRINTABLE_AREAS: Record<number, PrintableArea> = {
  // Mockup 1 - Standard tees
  1: {
    xCenter: 0.5,
    yCenter: 0.42,
    width: 0.66,
    height: 0.55,
    positionOffsets: {
      top: { x: 0, y: -0.09 },
      center: { x: 0, y: 0 },
      bottom: { x: 0, y: 0.09 },
    }
  },
  // Mockup 2 - V-necks
  2: {
    xCenter: 0.5,
    yCenter: 0.43,
    width: 0.65,
    height: 0.55,
    positionOffsets: {
      top: { x: 0, y: -0.09 },
      center: { x: 0, y: 0 },
      bottom: { x: 0, y: 0.09 },
    }
  },
  // Mockup 3 - Pocket tees
  3: {
    xCenter: 0.5,
    yCenter: 0.43,
    width: 0.64,
    height: 0.54,
    positionOffsets: {
      top: { x: 0, y: -0.09 },
      center: { x: 0, y: 0 },
      bottom: { x: 0, y: 0.09 },
    }
  },
  // Mockup 4 - Long sleeves
  4: {
    xCenter: 0.5,
    yCenter: 0.42,
    width: 0.66,
    height: 0.56,
    positionOffsets: {
      top: { x: 0, y: -0.09 },
      center: { x: 0, y: 0 },
      bottom: { x: 0, y: 0.09 },
    }
  },
  // Mockup 5 - Hoodies
  5: {
    xCenter: 0.5,
    yCenter: 0.44,
    width: 0.64,
    height: 0.52,
    positionOffsets: {
      top: { x: 0, y: -0.08 },
      center: { x: 0, y: 0 },
      bottom: { x: 0, y: 0.08 },
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