import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DesignControlsProps {
  designSize: number;
  onDesignSizeChange: (size: number) => void;
  onResetDesign: () => void;
}

export default function DesignControls({
  designSize,
  onDesignSizeChange,
  onResetDesign
}: DesignControlsProps) {
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-medium">Design Settings</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 space-y-4">
        {/* Size Control */}
        <div>
          <Label htmlFor="sizeSlider" className="text-sm font-medium text-gray-700">
            Design Size
          </Label>
          <div className="flex items-center space-x-2 mt-2">
            <Slider
              id="sizeSlider"
              min={20}
              max={200}
              step={5}
              value={[designSize]}
              onValueChange={(value) => onDesignSizeChange(value[0])}
              className="flex-grow"
            />
            <span className="text-sm text-gray-500 w-12 text-right">{designSize}%</span>
          </div>
        </div>
        
        {/* Reset Button */}
        <Button 
          variant="outline" 
          onClick={onResetDesign}
          className="w-full"
        >
          Reset Size
        </Button>
      </CardContent>
    </Card>
  );
}
