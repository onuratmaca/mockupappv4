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
    // Adjusted based on the reference mockup image with actual designs
    const shirtCenters = [
      // Top row (left to right)
      { x: 500, y: 680 },   // Top left shirt (White) - landscape "ARE WE GREAT YET? CAUSE..."
      { x: 1500, y: 680 },  // Top left-center shirt (Ivory) - square with "#" design
      { x: 2500, y: 680 },  // Top right-center shirt (Butter) - wide "overstimulated" text
      { x: 3500, y: 680 },  // Top right shirt (Banana) - no design
      
      // Bottom row (left to right)
      { x: 500, y: 2180 },  // Bottom left shirt (Mustard) - "Eat The Rich" with caterpillar
      { x: 1500, y: 2180 }, // Bottom left-center shirt (Peachy) - bear design
      { x: 2500, y: 2180 }, // Bottom right-center shirt (Yam) - "MADE for more"
      { x: 3500, y: 2180 }  // Bottom right shirt (Khaki) - "Well-behaved women rarely make history"
    ];
    
    // Add rectangles to show the current printable areas
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    
    shirtCenters.forEach((pos, index) => {
      // Different rectangle shapes based on reference image with actual designs
      let width, height;
      
      if (index === 0) {
        // White shirt - landscape rectangle - "ARE WE GREAT YET? CAUSE..."
        width = 550;
        height = 300;
      } else if (index === 1) {
        // Ivory shirt - square with "#" design
        width = 400;
        height = 400;
      } else if (index === 2) {
        // Butter shirt - wide horizontal text "overstimulated"
        width = 450;
        height = 110;
      } else if (index === 4) {
        // Mustard shirt - "Eat The Rich" with caterpillar
        width = 500;
        height = 320;
      } else if (index === 5) {
        // Peachy shirt - bear design
        width = 380;
        height = 480;
      } else if (index === 6) {
        // Yam shirt - "MADE for more"
        width = 480;
        height = 280;
      } else if (index === 7) {
        // Khaki shirt - "Well-behaved women rarely make history"
        width = 520;
        height = 300;
      } else {
        // Default for shirts without specific designs
        width = 450;
        height = 300;
      }
      
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
    // Adjusted based on the reference mockup image with actual designs
    const shirtCenters = [
      // Top row (left to right)
      { x: 500, y: 680 },   // Top left shirt (White) - landscape "ARE WE GREAT YET? CAUSE..."
      { x: 1500, y: 680 },  // Top left-center shirt (Ivory) - square with "#" design
      { x: 2500, y: 680 },  // Top right-center shirt (Butter) - wide "overstimulated" text
      { x: 3500, y: 680 },  // Top right shirt (Banana) - no design
      
      // Bottom row (left to right)
      { x: 500, y: 2180 },  // Bottom left shirt (Mustard) - "Eat The Rich" with caterpillar
      { x: 1500, y: 2180 }, // Bottom left-center shirt (Peachy) - bear design
      { x: 2500, y: 2180 }, // Bottom right-center shirt (Yam) - "MADE for more"
      { x: 3500, y: 2180 }  // Bottom right shirt (Khaki) - "Well-behaved women rarely make history"
    ];
    
    // ADAPTIVE SIZE APPROACH BASED ON DESIGN'S ASPECT RATIO
    
    // Detect SVG files (they need special handling)
    const isSVG = 
      (designImage?.toLowerCase().endsWith('.svg') || 
       designImage?.toLowerCase().includes('image/svg') ||
       (designImage?.startsWith('data:') && 
        designImage?.includes('svg')));
    
    // Calculate the design's aspect ratio
    const aspectRatio = designImg.width / designImg.height;
    const isLandscape = aspectRatio > 1.3;
    const isSquarish = aspectRatio >= 0.8 && aspectRatio <= 1.3;
    const isWide = aspectRatio > 2.5;
    const isPortrait = aspectRatio < 0.8;
    
    // Draw on each shirt, placing the design according to its aspect ratio
    shirtCenters.forEach((pos, index) => {
      // Initialize with default values
      let designWidth = 400;
      let designHeight = 400;
      
      // Custom sizing based on specific shirt position and design aspect ratio
      if (index === 0) {
        // White shirt - landscape rectangle "ARE WE GREAT YET? CAUSE..."
        if (isWide || isLandscape) {
          designWidth = 550 * (designSize / 100);
          designHeight = designWidth / aspectRatio;
        } else if (isSquarish) {
          designWidth = 450 * (designSize / 100);
          designHeight = designWidth / aspectRatio;
        } else {
          // Portrait
          designHeight = 300 * (designSize / 100);
          designWidth = designHeight * aspectRatio;
        }
      } else if (index === 1) {
        // Ivory shirt - square with "#" design
        if (isSquarish) {
          // Ideal for square design
          designWidth = 400 * (designSize / 100);
          designHeight = designWidth / aspectRatio;
        } else if (isLandscape) {
          designWidth = 400 * (designSize / 100);
          designHeight = designWidth / aspectRatio;
        } else {
          // Portrait
          designHeight = 400 * (designSize / 100);
          designWidth = designHeight * aspectRatio;
        }
      } else if (index === 2) {
        // Butter shirt - wide horizontal "overstimulated" text
        // Perfect for very wide designs
        if (isWide) {
          designWidth = 450 * (designSize / 100);
          designHeight = designWidth / aspectRatio;
        } else if (isLandscape) {
          designWidth = 400 * (designSize / 100);
          designHeight = designWidth / aspectRatio;
        } else {
          // For taller designs, keep it contained
          designHeight = 150 * (designSize / 100);
          designWidth = designHeight * aspectRatio;
        }
      } else if (index === 4) {
        // Mustard shirt - "Eat The Rich" with caterpillar
        if (isLandscape || isWide) {
          designWidth = 500 * (designSize / 100);
          designHeight = designWidth / aspectRatio;
        } else {
          designHeight = 320 * (designSize / 100);
          designWidth = designHeight * aspectRatio;
        }
      } else if (index === 5) {
        // Peachy shirt - bear design (more vertical space)
        if (isPortrait) {
          // Perfect for tall designs
          designHeight = 480 * (designSize / 100);
          designWidth = designHeight * aspectRatio;
        } else {
          designWidth = 380 * (designSize / 100);
          designHeight = designWidth / aspectRatio;
        }
      } else if (index === 6) {
        // Yam shirt - "MADE for more"
        if (isLandscape || isWide) {
          designWidth = 480 * (designSize / 100);
          designHeight = designWidth / aspectRatio;
        } else {
          designHeight = 280 * (designSize / 100);
          designWidth = designHeight * aspectRatio;
        }
      } else if (index === 7) {
        // Khaki shirt - "Well-behaved women rarely make history"
        if (isLandscape || isWide) {
          designWidth = 520 * (designSize / 100);
          designHeight = designWidth / aspectRatio;
        } else {
          designHeight = 300 * (designSize / 100);
          designWidth = designHeight * aspectRatio;
        }
      } else {
        // Default for other shirts or no specific design
        // Fall back to format-based sizing
        if (isSVG) {
          // SVG images get slightly larger dimensions
          if (isWide) {
            designWidth = 500 * (designSize / 100);
            designHeight = designWidth / aspectRatio;
          } else if (isLandscape) {
            designWidth = 450 * (designSize / 100);
            designHeight = designWidth / aspectRatio;
          } else if (isSquarish) {
            designWidth = 400 * (designSize / 100);
            designHeight = designWidth / aspectRatio;
          } else {
            // Portrait/tall designs
            designHeight = 400 * (designSize / 100);
            designWidth = designHeight * aspectRatio;
          }
        } else {
          // Raster images get slightly smaller dimensions
          if (isWide) {
            designWidth = 450 * (designSize / 100);
            designHeight = designWidth / aspectRatio;
          } else if (isLandscape) {
            designWidth = 400 * (designSize / 100);
            designHeight = designWidth / aspectRatio;
          } else if (isSquarish) {
            designWidth = 350 * (designSize / 100);
            designHeight = designWidth / aspectRatio;
          } else {
            // Default to portrait
            designHeight = 350 * (designSize / 100);
            designWidth = designHeight * aspectRatio;
          }
        }
      }
      
      // Draw the design centered on the shirt
      ctx.drawImage(
        designImg, 
        pos.x - (designWidth / 2),  // center X
        pos.y - (designHeight / 2), // center Y
        designWidth, 
        designHeight
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