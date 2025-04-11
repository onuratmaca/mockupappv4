// Import mockup images
import mockup1 from "@assets/1.jpg";
import mockup2 from "@assets/2.jpg";
import mockup3 from "@assets/3.jpg";
import mockup4 from "@assets/4.jpg";
import mockup5 from "@assets/5.jpg";

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

export function getMockupById(id: number): Mockup | undefined {
  return MOCKUP_IMAGES.find(mockup => mockup.id === id);
}