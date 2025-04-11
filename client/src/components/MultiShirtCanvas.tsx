import { useRef, useEffect, useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut } from "lucide-react";
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
  }, [mockupImg, designImg, designSize, designPosition]);
  
  // Helper function to visualize the printable areas
  const drawPrintableAreas = (ctx: CanvasRenderingContext2D) => {
    // GRID LAYOUT FOR THE 8 SHIRTS (4 across, 2 down)
    const shirtCenters = [
      // Top row (left to right)
      { x: 500, y: 800 },   // Top left shirt 
      { x: 1335, y: 800 },  // Top left-center shirt
      { x: 2665, y: 800 },  // Top right-center shirt 
      { x: 3500, y: 800 },  // Top right shirt
      
      // Bottom row (left to right)
      { x: 500, y: 2300 },  // Bottom left shirt 
      { x: 1335, y: 2300 }, // Bottom left-center shirt
      { x: 2665, y: 2300 }, // Bottom right-center shirt
      { x: 3500, y: 2300 }  // Bottom right shirt
    ];
    
    // Add rectangles to show the current printable areas
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    
    shirtCenters.forEach(pos => {
      // Draw a red rectangle for the current positioning
      // 300x300 pixel area to represent printable area
      const width = 300;
      const height = 300;
      
      ctx.strokeRect(
        pos.x - width/2,
        pos.y - height/2,
        width,
        height
      );
      
      // Draw crosshair at the center
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
    
    // GRID LAYOUT FOR THE 8 SHIRTS (4 across, 2 down)
    // These values represent the center point of each shirt chest area
    // Positioned exactly 3-4 fingers down from the neckline/tag
    const shirtCenters = [
      // Top row (left to right)
      { x: 500, y: 800 },   // Top left shirt (3-4 fingers down from tag)
      { x: 1335, y: 800 },  // Top left-center shirt
      { x: 2665, y: 800 },  // Top right-center shirt 
      { x: 3500, y: 800 },  // Top right shirt
      
      // Bottom row (left to right)
      { x: 500, y: 2300 },  // Bottom left shirt (3-4 fingers down from tag)
      { x: 1335, y: 2300 }, // Bottom left-center shirt
      { x: 2665, y: 2300 }, // Bottom right-center shirt
      { x: 3500, y: 2300 }  // Bottom right shirt
    ];
    
    // CONSISTENT SIZE APPROACH
    // Use fixed dimensions for all designs while preserving aspect ratio
    
    // Detect SVG files (they need special handling)
    const isSVG = 
      (designImage?.toLowerCase().endsWith('.svg') || 
       designImage?.toLowerCase().includes('image/svg') ||
       (designImage?.startsWith('data:') && 
        designImage?.includes('svg')));
    
    // Base dimensions - Adjusted to your specifications
    // 60% for SVGs, 40% for raster images
    const designWidth = isSVG ? 600 : 400;
    
    // Apply user's size preference (percentage scaling)
    const finalWidth = designWidth * (designSize / 100);
    
    // Calculate height while preserving aspect ratio
    const aspectRatio = designImg.width / designImg.height;
    const finalHeight = finalWidth / aspectRatio;
    
    // Always center designs on each shirt (no top/bottom options)
    // Draw on each shirt
    shirtCenters.forEach(pos => {
      ctx.drawImage(
        designImg, 
        // Center horizontally and vertically on each shirt
        pos.x - (finalWidth / 2),  // center X
        pos.y - (finalHeight / 2), // center Y
        finalWidth, 
        finalHeight
      );
    });
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

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Design Mockup</CardTitle>
          <div className="flex items-center space-x-2">
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