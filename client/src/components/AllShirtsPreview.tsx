import { useRef, useEffect, useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Minus, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DesignRatio, DESIGN_RATIOS } from "@/lib/design-ratios";
import { getMockupById, Mockup, ShirtGridPosition, SHIRT_GRID_POSITIONS } from "@/lib/mockup-data";

interface AllShirtsPreviewProps {
  designImage: string | null;
  mockupId: number;
  designSize: number;
  designPosition: 'top' | 'center' | 'bottom';
  designXOffset: number;
  designYOffset: number;
  designRatio: DesignRatio;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onDownload: () => void;
}

// Types for image objects
interface ImageObject {
  img: HTMLImageElement;
  width: number;
  height: number;
}

export default function AllShirtsPreview({
  designImage,
  mockupId,
  designSize,
  designPosition,
  designXOffset,
  designYOffset,
  designRatio,
  zoomLevel,
  onZoomChange,
  onDownload
}: AllShirtsPreviewProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [mockupImg, setMockupImg] = useState<ImageObject | null>(null);
  const [designImg, setDesignImg] = useState<ImageObject | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 4000, height: 3000 });

  // Initialize canvas with exact mockup dimensions
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvasCtxRef.current = ctx;
        // Set initial canvas background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [canvasSize]);

  // Load mockup image when mockup ID changes
  useEffect(() => {
    const mockup = getMockupById(mockupId);
    if (mockup) {
      loadMockupImage(mockup);
    } else {
      toast({
        title: "Error",
        description: "Mockup not found",
        variant: "destructive",
      });
    }
  }, [mockupId]);

  // Load design image when it changes
  useEffect(() => {
    if (designImage) {
      loadDesignImage(designImage);
    }
  }, [designImage]);

  // Redraw canvas when images, position or zoom change
  useEffect(() => {
    if (mockupImg && designImg) {
      drawCanvas();
    }
  }, [mockupImg, designImg, designSize, designPosition, designXOffset, designYOffset, zoomLevel]);

  // Handle zoom level
  const handleZoomIn = () => {
    if (zoomLevel < 200) {
      onZoomChange(zoomLevel + 10);
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 50) {
      onZoomChange(zoomLevel - 10);
    }
  };

  // Load mockup image
  const loadMockupImage = (mockup: Mockup) => {
    const img = new Image();
    img.onload = () => {
      setMockupImg({
        img,
        width: canvasSize.width,  // Match canvas dimensions exactly
        height: canvasSize.height
      });
      
      // If design already exists, redraw
      if (designImg) {
        drawCanvas();
      }
    };
    
    img.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to load mockup image",
        variant: "destructive",
      });
    };
    
    img.src = mockup.src;
  };

  // Load design image
  const loadDesignImage = (imageUrl: string) => {
    const img = new Image();
    img.onload = () => {
      // Apply the selected design ratio if needed
      const ratio = DESIGN_RATIOS[designRatio].value;
      let width, height;
      
      const actualRatio = img.width / img.height;
      
      // Use natural dimensions for the design
      // We'll size it appropriately when drawing on each shirt
      setDesignImg({
        img,
        width: img.width,
        height: img.height
      });
      
      // If mockup is loaded, redraw canvas
      if (mockupImg) {
        drawCanvas();
      }
    };
    
    img.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to load design image",
        variant: "destructive",
      });
    };
    
    img.src = imageUrl;
  };

  // Draw canvas with designs on all shirts
  const drawCanvas = () => {
    if (!canvasCtxRef.current || !mockupImg || !designImg) return;
    
    const ctx = canvasCtxRef.current;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Apply zoom
    const zoomFactor = zoomLevel / 100;
    ctx.save();
    
    // Scale from center
    ctx.translate(canvasSize.width / 2, canvasSize.height / 2);
    ctx.scale(zoomFactor, zoomFactor);
    ctx.translate(-canvasSize.width / 2, -canvasSize.height / 2);
    
    // Draw mockup image as background (full size)
    ctx.drawImage(
      mockupImg.img,
      0, 0,
      canvasSize.width, 
      canvasSize.height
    );
    
    // Now draw the design on each shirt in the mockup
    SHIRT_GRID_POSITIONS.forEach((gridPos, index) => {
      drawDesignOnShirt(ctx, gridPos, index);
    });
    
    ctx.restore();
  };
  
  // Draw design on a specific shirt in the grid
  const drawDesignOnShirt = (ctx: CanvasRenderingContext2D, gridPos: ShirtGridPosition, shirtIndex: number) => {
    if (!mockupImg || !designImg) return;
    
    // Standard shirt dimensions in a 4000x3000 pixel mockup
    // These values are derived from the mockup image structure
    const STANDARD_SHIRT_WIDTH = 1000; // px (4000px mockup / 4 shirts across)
    const STANDARD_SHIRT_HEIGHT = 1500; // px (3000px mockup / 2 shirts down)
    
    // Fixed printable area size for all shirts
    const PRINTABLE_AREA_WIDTH = 500; // px (50% of shirt width)
    const PRINTABLE_AREA_HEIGHT = 600; // px (40% of shirt height)
    
    // Fixed positions for top, center, bottom placements (pixels from center)
    const POSITIONS = {
      top: { x: 0, y: -200 },     // 200px above center
      center: { x: 0, y: 0 },     // At center 
      bottom: { x: 0, y: 200 }    // 200px below center
    };
    
    // Calculate the size and position of this specific shirt within the mockup
    const shirtWidth = canvasSize.width * gridPos.width;
    const shirtHeight = canvasSize.height * gridPos.height;
    const shirtX = canvasSize.width * gridPos.x - (shirtWidth / 2);
    const shirtY = canvasSize.height * gridPos.y - (shirtHeight / 2);
    
    // Center of the shirt, adjusted for neckline
    const centerX = shirtX + (shirtWidth / 2);
    const centerY = shirtY + (shirtHeight / 2) - (shirtHeight * 0.08); // Shift up by 8%
    
    // Calculate maximum design size based on percentage of printable area
    const availableWidth = PRINTABLE_AREA_WIDTH * (designSize / 100);
    const availableHeight = PRINTABLE_AREA_HEIGHT * (designSize / 100);
    
    // Get the original aspect ratio of the design
    const designAspectRatio = designImg.width / designImg.height;
    
    // Determine new dimensions while maintaining aspect ratio
    let newWidth, newHeight;
    
    if (designAspectRatio >= 1) {
      // Landscape or square - constrain by width
      newWidth = availableWidth;
      newHeight = newWidth / designAspectRatio;
      
      // If height exceeds max height, constrain by height instead
      if (newHeight > availableHeight) {
        newHeight = availableHeight;
        newWidth = newHeight * designAspectRatio;
      }
    } else {
      // Portrait - constrain by height
      newHeight = availableHeight;
      newWidth = newHeight * designAspectRatio;
      
      // If width exceeds max width, constrain by width instead
      if (newWidth > availableWidth) {
        newWidth = availableWidth;
        newHeight = newWidth / designAspectRatio;
      }
    }
    
    // Get position offset based on selected position
    const positionOffset = POSITIONS[designPosition];
    
    // Calculate final position with design centered on target point plus user offset
    const xPosition = centerX + positionOffset.x - (newWidth / 2) + designXOffset;
    const yPosition = centerY + positionOffset.y - (newHeight / 2) + designYOffset;
    
    // Draw the design on this shirt
    ctx.drawImage(
      designImg.img,
      xPosition, 
      yPosition,
      newWidth, 
      newHeight
    );
  };

  // Handle download
  const handleDownload = () => {
    if (!canvasRef.current || !designImg) {
      toast({
        title: "Error",
        description: "Please upload a design image before downloading",
        variant: "destructive",
      });
      return;
    }
    
    // Create a clean version for download (no guides or debug info)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasSize.width;
    tempCanvas.height = canvasSize.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx && mockupImg) {
      // Draw mockup
      tempCtx.drawImage(
        mockupImg.img,
        0, 0,
        canvasSize.width, 
        canvasSize.height
      );
      
      // Draw design on each shirt
      SHIRT_GRID_POSITIONS.forEach((gridPos, index) => {
        if (tempCtx) {
          drawDesignOnShirt(tempCtx, gridPos, index);
        }
      });
      
      // Get data URL
      const dataURL = tempCanvas.toDataURL('image/png');
      
      // Create download link
      const link = document.createElement('a');
      link.download = `tshirt-mockup-${mockupId}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Mockup downloaded successfully!",
      });
      
      onDownload();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">All Shirts Preview</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomOut}
              disabled={zoomLevel <= 50}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-500">{zoomLevel}%</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomIn}
              disabled={zoomLevel >= 200}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden" style={{ height: '600px' }}>
          <canvas 
            ref={canvasRef} 
            width={canvasSize.width} 
            height={canvasSize.height}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button 
            size="sm"
            onClick={handleDownload}
            disabled={!designImg}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Mockup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}