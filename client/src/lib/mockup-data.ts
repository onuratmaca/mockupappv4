// Import mockup images (with watermark) - Original shop (2x4 grid, 8 shirts)
import mockup1 from "@assets/1 copy.jpg";
import mockup2 from "@assets/2 copy.jpg";
import mockup3 from "@assets/3 copy.jpg";
import mockup4 from "@assets/4 copy.jpg";
import mockup5 from "@assets/5 copy.jpg";

// Import new mockup images - Calvary Apparel Studio (3x3 grid, 9 shirts)
import mockup6 from "@assets/batch-white_1764529217047.jpg";
import mockup7 from "@assets/batch-white2_1764529217047.jpg";
import mockup8 from "@assets/batch-black_1764529217048.jpg";

// Shirt positions in the grid (supports both 8 shirts in 2x4 and 9 shirts in 3x3)
export type ShirtPosition = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Grid layout types
export type GridLayout = "2x4" | "3x3";

// Define the mockup images with their grid layout
// skipPositions: positions to skip (e.g., for logo placement)
export const MOCKUP_IMAGES = [
  { id: 1, name: "Mockup 1", src: mockup1, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 2, name: "Mockup 2", src: mockup2, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 3, name: "Mockup 3", src: mockup3, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 4, name: "Mockup 4", src: mockup4, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 5, name: "Mockup 5", src: mockup5, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 6, name: "Calvary White", src: mockup6, gridLayout: "3x3" as GridLayout, shirtCount: 9, skipPositions: [] as number[] },
  { id: 7, name: "Calvary White 2", src: mockup7, gridLayout: "3x3" as GridLayout, shirtCount: 8, skipPositions: [7] as number[] }, // Skip position 7 (8th spot with logo)
  { id: 8, name: "Calvary Black", src: mockup8, gridLayout: "3x3" as GridLayout, shirtCount: 9, skipPositions: [] as number[] }
];

export interface Mockup {
  id: number;
  name: string;
  src: string;
  gridLayout: GridLayout;
  shirtCount: number;
  skipPositions: number[]; // Positions to skip (e.g., for logo placement)
}

export interface ShirtGridPosition {
  x: number; // Percentage x position in the grid (0-1)
  y: number; // Percentage y position in the grid (0-1)
  width: number; // Width percentage of a single shirt (0-1)
  height: number; // Height percentage of a single shirt (0-1)
}

// Definition of where each shirt is positioned in the mockup grid
// These values are based on analysis of 4000x3000 px mockups with 8 shirts (4 columns x 2 rows)
// Grid reference: 0-based from left to right, top to bottom
//
// | 0 | 1 | 2 | 3 |  <- Top row (positions 0-3)
// | 4 | 5 | 6 | 7 |  <- Bottom row (positions 4-7)
export const SHIRT_GRID_POSITIONS_2x4: ShirtGridPosition[] = [
  // Top row (left to right)
  { x: 0.125, y: 0.25, width: 0.22, height: 0.44 },  // Position 0 - Top Left (500/4000, 750/3000)
  { x: 0.375, y: 0.25, width: 0.22, height: 0.44 },  // Position 1 - Top Middle-Left (1500/4000, 750/3000)
  { x: 0.625, y: 0.25, width: 0.22, height: 0.44 },  // Position 2 - Top Middle-Right (2500/4000, 750/3000)
  { x: 0.875, y: 0.25, width: 0.22, height: 0.44 },  // Position 3 - Top Right (3500/4000, 750/3000)
  
  // Bottom row (left to right)
  { x: 0.125, y: 0.75, width: 0.22, height: 0.44 },  // Position 4 - Bottom Left (500/4000, 2250/3000)
  { x: 0.375, y: 0.75, width: 0.22, height: 0.44 },  // Position 5 - Bottom Middle-Left (1500/4000, 2250/3000)
  { x: 0.625, y: 0.75, width: 0.22, height: 0.44 },  // Position 6 - Bottom Middle-Right (2500/4000, 2250/3000)
  { x: 0.875, y: 0.75, width: 0.22, height: 0.44 },  // Position 7 - Bottom Right (3500/4000, 2250/3000)
];

// Definition of where each shirt is positioned in the 3x3 mockup grid
// Grid reference: 0-based from left to right, top to bottom
//
// | 0 | 1 | 2 |  <- Top row (positions 0-2)
// | 3 | 4 | 5 |  <- Middle row (positions 3-5)
// | 6 | 7 | 8 |  <- Bottom row (positions 6-8)
export const SHIRT_GRID_POSITIONS_3x3: ShirtGridPosition[] = [
  // Top row (left to right)
  { x: 0.167, y: 0.167, width: 0.28, height: 0.30 },  // Position 0 - Top Left
  { x: 0.500, y: 0.167, width: 0.28, height: 0.30 },  // Position 1 - Top Center
  { x: 0.833, y: 0.167, width: 0.28, height: 0.30 },  // Position 2 - Top Right
  
  // Middle row (left to right)
  { x: 0.167, y: 0.500, width: 0.28, height: 0.30 },  // Position 3 - Middle Left
  { x: 0.500, y: 0.500, width: 0.28, height: 0.30 },  // Position 4 - Middle Center
  { x: 0.833, y: 0.500, width: 0.28, height: 0.30 },  // Position 5 - Middle Right
  
  // Bottom row (left to right)
  { x: 0.167, y: 0.833, width: 0.28, height: 0.30 },  // Position 6 - Bottom Left
  { x: 0.500, y: 0.833, width: 0.28, height: 0.30 },  // Position 7 - Bottom Center
  { x: 0.833, y: 0.833, width: 0.28, height: 0.30 },  // Position 8 - Bottom Right
];

// Keep for backward compatibility
export const SHIRT_GRID_POSITIONS = SHIRT_GRID_POSITIONS_2x4;

export function getMockupById(id: number): Mockup | undefined {
  return MOCKUP_IMAGES.find(mockup => mockup.id === id);
}

export function getShirtGridPosition(position: ShirtPosition, gridLayout: GridLayout = "2x4"): ShirtGridPosition {
  if (gridLayout === "3x3") {
    return SHIRT_GRID_POSITIONS_3x3[position] || SHIRT_GRID_POSITIONS_3x3[0];
  }
  return SHIRT_GRID_POSITIONS_2x4[position] || SHIRT_GRID_POSITIONS_2x4[0];
}

export function getShirtGridPositions(gridLayout: GridLayout): ShirtGridPosition[] {
  return gridLayout === "3x3" ? SHIRT_GRID_POSITIONS_3x3 : SHIRT_GRID_POSITIONS_2x4;
}