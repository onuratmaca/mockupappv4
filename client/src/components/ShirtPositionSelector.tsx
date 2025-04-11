import React from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShirtPosition, SHIRT_GRID_POSITIONS } from "@/lib/mockup-data";

interface ShirtPositionSelectorProps {
  selectedPosition: ShirtPosition;
  onPositionSelect: (position: ShirtPosition) => void;
}

export default function ShirtPositionSelector({
  selectedPosition,
  onPositionSelect
}: ShirtPositionSelectorProps) {
  // Create a 2×4 grid to represent the shirts
  // First row: positions 0-3
  // Second row: positions 4-7
  const topRow: ShirtPosition[] = [0, 1, 2, 3];
  const bottomRow: ShirtPosition[] = [4, 5, 6, 7];
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Shirt Position</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Select which shirt to place your design on:
          </p>
          
          <div className="grid grid-cols-4 gap-2 mt-2">
            {/* Top row */}
            {topRow.map(position => (
              <Button
                key={position}
                variant={selectedPosition === position ? "default" : "outline"}
                className="w-full h-14 p-1"
                onClick={() => onPositionSelect(position)}
              >
                <span className="text-xs">{position + 1}</span>
              </Button>
            ))}
            
            {/* Bottom row */}
            {bottomRow.map(position => (
              <Button
                key={position}
                variant={selectedPosition === position ? "default" : "outline"}
                className="w-full h-14 p-1"
                onClick={() => onPositionSelect(position)}
              >
                <span className="text-xs">{position + 1}</span>
              </Button>
            ))}
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            This represents the grid of shirts in the mockup image (top row: 1-4, bottom row: 5-8)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}