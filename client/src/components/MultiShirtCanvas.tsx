import { useRef, useEffect, useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DesignRatio } from "@/lib/design-ratios";
import { getMockupById } from "@/lib/mockup-data";

interface MultiShirtCanvasProps {
  designImage: string | null;
  mockupId: number;
  designSize: number;
  designPosition: string; // Always 'center' now
  onDownload: () => void;
}

export default function MultiShirtCanvas({
  designImage,
  mockupId,
  designSize,
  designPosition,
  onDownload
}: MultiShirtCanvasProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mockupImg, setMockupImg] = useState<HTMLImageElement | null>(null);
  const [designImg, setDesignImg] = useState<HTMLImageElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100); // Full size view
  const [canvasSize] = useState({ width: 4000, height: 3000 });
  const [showDebugAreas, setShowDebugAreas] = useState(true); // Toggle for debug visualization

  // Initialize canvas with exact mockup dimensions
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
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
      const img = new Image();
      img.onload = () => {
        setMockupImg(img);
      };
      img.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to load mockup image",
          variant: "destructive",
        });
      };
      img.src = mockup.src;
    }
  }, [mockupId, toast]);

  // Load design image when it changes
  useEffect(() => {
    if (designImage) {
      const img = new Image();
      img.onload = () => {
        setDesignImg(img);
      };
      img.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to load design image",
          variant: "destructive",
        });
      };
      img.src = designImage;
    } else {
      setDesignImg(null);
    }
  }, [designImage, toast]);

  // Draw canvas when any inputs change
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw mockup image
    if (mockupImg) {
      ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);
      
      // Draw printable areas for debugging
      drawPrintableAreas(ctx);
      
      // Draw design on all shirts if we have a design image
      if (designImg) {
        drawDesignOnAllShirts(ctx);
      }
    }
  }, [mockupImg, designImg, designSize, designPosition, showDebugAreas]);
  
  // Toggle for showing debug visualization
  const [showDebugAreas, setShowDebugAreas] = useState(true);
  
  // Helper function to visualize the printable areas
  const drawPrintableAreas = (ctx: CanvasRenderingContext2D) => {
    // Skip if debug mode is off
    if (!showDebugAreas) return;
    // FIXED CENTERS - Matching our new drawing method exactly
    // Each position is exactly where we place designs
    const shirtCenters = [
      // Top row (left to right)
      { x: 500, y: 650 },   // White shirt 
      { x: 1500, y: 650 },  // Ivory shirt
      { x: 2500, y: 650 },  // Butter shirt
      { x: 3500, y: 650 },  // Banana shirt
      
      // Bottom row (left to right)
      { x: 500, y: 2150 },  // Mustard shirt
      { x: 1500, y: 2150 }, // Peachy shirt
      { x: 2500, y: 2150 }, // Yam shirt
      { x: 3500, y: 2150 }  // Khaki shirt
    ];
    
    // Set up visuals for debugging rectangles
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    
    // Use the same dimensions we use for placing designs
    const maxWidth = 500;
    const maxHeight = 300;
    
    // Draw consistent rectangles at all positions
    shirtCenters.forEach(pos => {
      // Draw rectangle
      ctx.strokeRect(
        pos.x - maxWidth/2,
        pos.y - maxHeight/2,
        maxWidth,
        maxHeight
      );
      
      // Draw crosshair at center
      ctx.beginPath();
      ctx.moveTo(pos.x - 20, pos.y);
      ctx.lineTo(pos.x + 20, pos.y);
      ctx.moveTo(pos.x, pos.y - 20);
      ctx.lineTo(pos.x, pos.y + 20);
      ctx.stroke();
    });
  };

  // Function to draw design on all 8 shirts
  const drawDesignOnAllShirts = (ctx: CanvasRenderingContext2D) => {
    if (!designImg) return;
    
    // SIMPLE APPROACH: Fixed positions based on mockup reference
    // Hardcoded positions for each shirt, matching the exact reference image
    
    // Calculate aspect ratio once
    const aspectRatio = designImg.width / designImg.height;
    
    // Set max sizes to preserve aspect ratio
    const maxWidth = 500 * (designSize / 100);
    const maxHeight = 300 * (designSize / 100);
    
    // Calculate appropriate dimensions while preserving aspect ratio
    let designWidth, designHeight;
    
    if (aspectRatio > 1) { // Wider than tall
      designWidth = maxWidth;
      designHeight = designWidth / aspectRatio;
    } else { // Taller than wide
      designHeight = maxHeight;
      designWidth = designHeight * aspectRatio;
    }
    
    // Adjust dimensions if they're too large
    if (designHeight > maxHeight) {
      designHeight = maxHeight;
      designWidth = designHeight * aspectRatio;
    }
    
    // HARDCODED POSITIONS - carefully measured from the reference image
    // Each shirt gets exactly the same design at these fixed positions
    
    // Draw on White shirt (top left)
    ctx.drawImage(
      designImg,
      500 - (designWidth / 2), // Center X
      650 - (designHeight / 2), // Center Y - higher placement
      designWidth,
      designHeight
    );
    
    // Draw on Ivory shirt (top left-center)
    ctx.drawImage(
      designImg,
      1500 - (designWidth / 2),
      650 - (designHeight / 2),
      designWidth,
      designHeight
    );
    
    // Draw on Butter shirt (top right-center)
    ctx.drawImage(
      designImg,
      2500 - (designWidth / 2),
      650 - (designHeight / 2),
      designWidth,
      designHeight
    );
    
    // Draw on Banana shirt (top right)
    ctx.drawImage(
      designImg,
      3500 - (designWidth / 2),
      650 - (designHeight / 2),
      designWidth,
      designHeight
    );
    
    // Draw on Mustard shirt (bottom left)
    ctx.drawImage(
      designImg,
      500 - (designWidth / 2),
      2150 - (designHeight / 2),
      designWidth,
      designHeight
    );
    
    // Draw on Peachy shirt (bottom left-center)
    ctx.drawImage(
      designImg,
      1500 - (designWidth / 2),
      2150 - (designHeight / 2),
      designWidth,
      designHeight
    );
    
    // Draw on Yam shirt (bottom right-center)
    ctx.drawImage(
      designImg,
      2500 - (designWidth / 2),
      2150 - (designHeight / 2),
      designWidth,
      designHeight
    );
    
    // Draw on Khaki shirt (bottom right)
    ctx.drawImage(
      designImg,
      3500 - (designWidth / 2),
      2150 - (designHeight / 2),
      designWidth,
      designHeight
    );
  };

  // Handle zoom in/out
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  // Handle download
  const handleDownload = () => {
    if (!canvasRef.current || !designImg || !mockupImg) {
      toast({
        title: "Error",
        description: "Please upload a design image before downloading",
        variant: "destructive",
      });
      return;
    }
    
    // Get canvas data URL
    const dataURL = canvasRef.current.toDataURL('image/png');
    
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
  };

  // Toggle debug areas
  const toggleDebugAreas = () => {
    setShowDebugAreas(prev => !prev);
    // Force redraw
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx && mockupImg) {
        // Clear and redraw everything
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);
        drawPrintableAreas(ctx);
        if (designImg) {
          drawDesignOnAllShirts(ctx);
        }
      }
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Design Mockup</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleDebugAreas}
              title={showDebugAreas ? "Hide debug areas" : "Show debug areas"}
            >
              {showDebugAreas ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomOut}
              disabled={zoomLevel <= 50}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-500">{zoomLevel}%</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomIn}
              disabled={zoomLevel >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden" style={{ height: 'auto' }}>
          <div style={{ 
            transform: `scale(${zoomLevel / 100})`, 
            transformOrigin: 'center', 
            transition: 'transform 0.2s ease',
            width: '100%'
          }}>
            <canvas 
              ref={canvasRef} 
              width={canvasSize.width} 
              height={canvasSize.height}
              style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
            />
          </div>
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