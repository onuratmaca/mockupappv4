// Generate a t-shirt URL based on the color
export function generateTShirtUrl(color: string): string {
  // In a real application, you would have real t-shirt mockup images for each color
  // For this demo, we'll use placeholder colors for the t-shirts
  
  // Default white t-shirt mockup (replace with real image URLs in production)
  const defaultTshirtUrl = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'%3E%3Crect width='800' height='800' fill='%23f8f9fa'/%3E%3Cpath d='M400,150 L300,200 L250,350 L200,750 L600,750 L550,350 L500,200 Z' fill='%23ffffff' stroke='%23e9ecef' stroke-width='8'/%3E%3Cpath d='M300,200 L250,100 L550,100 L500,200' fill='%23ffffff' stroke='%23e9ecef' stroke-width='8'/%3E%3Ccircle cx='400' cy='100' r='25' fill='%23ffffff' stroke='%23e9ecef' stroke-width='8'/%3E%3Cpath d='M370,100 L300,150 M430,100 L500,150' stroke='%23e9ecef' stroke-width='8'/%3E%3C/svg%3E";
  
  // Generate SVG t-shirt mockup for the given color
  return `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'%3E%3Crect width='800' height='800' fill='%23f8f9fa'/%3E%3Cpath d='M400,150 L300,200 L250,350 L200,750 L600,750 L550,350 L500,200 Z' fill='${encodeURIComponent(getColorValue(color))}' stroke='%23e9ecef' stroke-width='8'/%3E%3Cpath d='M300,200 L250,100 L550,100 L500,200' fill='${encodeURIComponent(getColorValue(color))}' stroke='%23e9ecef' stroke-width='8'/%3E%3Ccircle cx='400' cy='100' r='25' fill='${encodeURIComponent(getColorValue(color))}' stroke='%23e9ecef' stroke-width='8'/%3E%3Cpath d='M370,100 L300,150 M430,100 L500,150' stroke='%23e9ecef' stroke-width='8'/%3E%3C/svg%3E`;
}

// Helper to get color value for a given color name
function getColorValue(colorName: string): string {
  // Map of color names to hex values
  const colorMap: Record<string, string> = {
    'White': '#FFFFFF',
    'Ivory': '#F8E8D4',
    'Butter': '#F5D6A8',
    'Banana': '#FFECB3',
    'Mustard': '#E9B85C',
    'Peachy': '#FFBCBC',
    'Yam': '#CD7F56',
    'Khaki': '#C2B280',
    'Sandstone': '#C2B280',
    'Bay': '#A7D1C5',
    'Blossom': '#FFD1DC',
    'Orchid': '#DA70D6',
    'Bright Salmon': '#FA8072',
    'Red': '#FF0000',
    'Crimson': '#DC143C',
    'Berry': '#990066',
    'Wine': '#722F37',
    'Violet': '#8A2BE2',
    'Grape': '#6A0DAD',
    'Espresso': '#3C2A21',
    'Blue Jean': '#6CA0DC',
    'Denim': '#4A5F82',
    'Flo Blue': '#4682B4',
    'Royal Caribe': '#00BFFF',
    'Navy': '#000080',
    'True Navy': '#00008B',
    'Grey': '#808080',
    'Black': '#000000',
    'Seafoam': '#7FFFD4',
    'Island Green': '#00FF7F',
    'Light Green': '#90EE90',
    'Sage': '#9CAF88',
    'Blue Spruce': '#2F4F4F',
    'Moss': '#8A9A5B',
    'Pepper': '#6E6E6E',
    'Hemp': '#987654'
  };
  
  return colorMap[colorName] || '#FFFFFF';
}

// Calculate the printable area based on t-shirt dimensions
export function calculatePrintableArea(
  tshirtWidth: number, 
  tshirtHeight: number
): { width: number; height: number; top: number; left: number } {
  // Typically the printable area is ~40% of the t-shirt width
  // and positioned at ~30% from the top of the t-shirt
  const printableWidth = tshirtWidth * 0.4;
  const printableHeight = tshirtHeight * 0.5;
  const top = tshirtHeight * 0.3;
  const left = tshirtWidth / 2;
  
  return {
    width: printableWidth,
    height: printableHeight,
    top,
    left
  };
}
