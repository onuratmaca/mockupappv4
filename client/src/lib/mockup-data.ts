// Import mockup images (with watermark)
import mockup1 from "@assets/1 copy.jpg";
import mockup2 from "@assets/2 copy.jpg";
import mockup3 from "@assets/3 copy.jpg";
import mockup4 from "@assets/4 copy.jpg";
import mockup5 from "@assets/5 copy.jpg";

// Shirt positions in the grid (8 shirts in a 2x4 grid)
export type ShirtPosition = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Define the mockup images
export const MOCKUP_IMAGES = [
  { id: 1, name: "Mockup 1", src: mockup1 },
  { id: 2, name: "Mockup 2", src: mockup2 },
  { id: 3, name: "Mockup 3", src: mockup3 },
  { id: 4, name: "Mockup 4", src: mockup4 },
  { id: 5, name: "Mockup 5", src: mockup5 }
];

export interface Mockup {
  id: number;
  name: string;
  src: string;
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
export const SHIRT_GRID_POSITIONS: ShirtGridPosition[] = [
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

export function getMockupById(id: number): Mockup | undefined {
  return MOCKUP_IMAGES.find(mockup => mockup.id === id);
}

export function getShirtGridPosition(position: ShirtPosition): ShirtGridPosition {
  return SHIRT_GRID_POSITIONS[position];
}