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
  designPosition: 'top' | 'center' | 'bottom';
  onDesignPositionChange: (position: 'top' | 'center' | 'bottom') => void;
  designXOffset: number;
  onDesignXOffsetChange: (offset: number) => void;
  designYOffset: number;
  onDesignYOffsetChange: (offset: number) => void;
  onResetDesign: () => void;
}

export default function DesignControls({
  designSize,
  onDesignSizeChange,
  designPosition,
  onDesignPositionChange,
  designXOffset,
  onDesignXOffsetChange,
  designYOffset,
  onDesignYOffsetChange,
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
            Size
          </Label>
          <div className="flex items-center space-x-2 mt-2">
            <Slider
              id="sizeSlider"
              min={20}
              max={100}
              step={1}
              value={[designSize]}
              onValueChange={(value) => onDesignSizeChange(value[0])}
              className="flex-grow"
            />
            <span className="text-sm text-gray-500 w-10 text-right">{designSize}%</span>
          </div>
        </div>
        
        {/* Position Controls */}
        <div>
          <Label className="text-sm font-medium text-gray-700 block mb-2">
            Position
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={designPosition === 'top' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onDesignPositionChange('top')}
              className="w-full"
            >
              Top
            </Button>
            <Button
              variant={designPosition === 'center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onDesignPositionChange('center')}
              className="w-full"
            >
              Center
            </Button>
            <Button
              variant={designPosition === 'bottom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onDesignPositionChange('bottom')}
              className="w-full"
            >
              Bottom
            </Button>
          </div>
        </div>
        
        {/* Fine Adjustment Controls */}
        <div>
          <Label className="text-sm font-medium text-gray-700 block mb-2">
            Fine Adjustments
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="xPos" className="text-xs text-gray-500">
                X Position
              </Label>
              <Input
                id="xPos"
                type="number"
                value={designXOffset}
                onChange={(e) => onDesignXOffsetChange(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="yPos" className="text-xs text-gray-500">
                Y Position
              </Label>
              <Input
                id="yPos"
                type="number"
                value={designYOffset}
                onChange={(e) => onDesignYOffsetChange(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
        
        {/* Reset Button */}
        <Button 
          variant="outline" 
          onClick={onResetDesign}
          className="w-full"
        >
          Reset Position
        </Button>
      </CardContent>
    </Card>
  );
}
