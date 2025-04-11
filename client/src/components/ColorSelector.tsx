import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { T_SHIRT_COLORS } from "@/lib/t-shirt-colors";

interface ColorSelectorProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export default function ColorSelector({ selectedColor, onColorSelect }: ColorSelectorProps) {
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-medium">T-Shirt Color</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="grid grid-cols-6 gap-2">
          {Object.entries(T_SHIRT_COLORS).map(([colorName, colorHex]) => (
            <button
              key={colorName}
              className={`w-8 h-8 rounded-full focus:outline-none 
                ${selectedColor === colorName ? 'ring-2 ring-offset-2 ring-primary' : 'hover:ring-2 hover:ring-offset-1 hover:ring-gray-300'}`}
              style={{ backgroundColor: colorHex }}
              onClick={() => onColorSelect(colorName)}
              aria-label={`Select ${colorName} color`}
              title={colorName}
            />
          ))}
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">Selected: <span className="font-medium">{selectedColor}</span></p>
        </div>
      </CardContent>
    </Card>
  );
}
