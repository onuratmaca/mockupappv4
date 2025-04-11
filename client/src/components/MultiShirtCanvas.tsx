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
import { getMockupById } from "@/lib/mockup-data";

interface MultiShirtCanvasProps {
  designImage: string | null;
  mockupId: number;
  designSize: number;
  designPosition: string; // Not used since we're auto-centering
  onDownload: () => void;
}

// Define shirt dimensions - these are consistent across all mockups
const SHIRT_WIDTH = 1000;
const SHIRT_HEIGHT = 1400;
const COLLAR_HEIGHT = 300; // Estimated height from top to collar
// Standard distance from collar to design
const DESIGN_OFFSET_FROM_COLLAR = 175;

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
      
      // Draw designs if available
      if (designImg) {
        drawDesignsOnShirts(ctx);
      }
      
      // Draw debug guides if enabled
      if (showDebugAreas) {
        drawDebugAreas(ctx);
      }
    }
  }, [mockupImg, designImg, designSize, showDebugAreas]);
  
  // Define shirt center positions in the canvas
  // These values remain constant for all mockups
  const shirtCenters = [
    // TOP ROW (Left to Right)
    { x: 500, y: 750 },    // White shirt
    { x: 1500, y: 750 },   // Ivory shirt
    { x: 2500, y: 750 },   // Butter shirt
    { x: 3500, y: 750 },   // Banana shirt
    
    // BOTTOM ROW (Left to Right)
    { x: 500, y: 2250 },   // Mustard shirt
    { x: 1500, y: 2250 },  // Peachy shirt
    { x: 2500, y: 2250 },  // Yam shirt
    { x: 3500, y: 2250 }   // Khaki shirt
  ];
  
  // Draw designs on all shirts using a consistent approach
  const drawDesignsOnShirts = (ctx: CanvasRenderingContext2D) => {
    if (!designImg) return;
    
    // Get design's aspect ratio
    const aspectRatio = designImg.width / designImg.height;
    
    // For each shirt position
    shirtCenters.forEach((center) => {
      // Calculate position relative to top of shirt collar
      const topOfShirt = center.y - (SHIRT_HEIGHT / 2);
      const collarPosition = topOfShirt + COLLAR_HEIGHT;
      
      // Calculate design placement location (below the collar)
      const designY = collarPosition + DESIGN_OFFSET_FROM_COLLAR;
      
      // Calculate design dimensions based on aspect ratio
      let areaWidth, areaHeight;
      
      if (aspectRatio > 2.0) {
        // Very wide design (banner/text like "overstimulated")
        areaWidth = 450;
        areaHeight = 120;
      } else if (aspectRatio > 1.3) {
        // Landscape design (like "ARE WE GREAT YET?")
        areaWidth = 400;
        areaHeight = 220;
      } else if (aspectRatio < 0.7) {
        // Tall/portrait design (like the bear design)
        areaWidth = 280;
        areaHeight = 420;
      } else {
        // Square-ish design (like the # symbol)
        areaWidth = 350;
        areaHeight = 350;
      }
      
      // Apply user's size preference 
      areaWidth = areaWidth * (designSize / 100);
      areaHeight = areaHeight * (designSize / 100);
      
      // Calculate final design dimensions preserving aspect ratio
      let designWidth, designHeight;
      
      // Fit by width or height based on aspect ratio
      if (aspectRatio > areaWidth / areaHeight) {
        // Width-constrained
        designWidth = areaWidth;
        designHeight = designWidth / aspectRatio;
      } else {
        // Height-constrained
        designHeight = areaHeight;
        designWidth = designHeight * aspectRatio;
      }
      
      // Draw the design centered horizontally, positioned below collar
      ctx.drawImage(
        designImg,
        center.x - (designWidth / 2),
        designY - (designHeight / 2),
        designWidth,
        designHeight
      );
    });
  };
  
  // Draw debug visualizations
  const drawDebugAreas = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    
    // Get design's aspect ratio
    const aspectRatio = designImg ? designImg.width / designImg.height : 1;
    
    // For each shirt
    shirtCenters.forEach((center) => {
      // Draw shirt outline for debugging
      ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
      ctx.strokeRect(
        center.x - (SHIRT_WIDTH / 2),
        center.y - (SHIRT_HEIGHT / 2),
        SHIRT_WIDTH,
        SHIRT_HEIGHT
      );
      
      // Calculate collar position
      const topOfShirt = center.y - (SHIRT_HEIGHT / 2);
      const collarPosition = topOfShirt + COLLAR_HEIGHT;
      
      // Draw collar line
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.beginPath();
      ctx.moveTo(center.x - 100, collarPosition);
      ctx.lineTo(center.x + 100, collarPosition);
      ctx.stroke();
      
      // Calculate design position
      const designY = collarPosition + DESIGN_OFFSET_FROM_COLLAR;
      
      // Calculate design area based on aspect ratio
      let areaWidth, areaHeight;
      
      if (aspectRatio > 2.0) {
        // Very wide design (banner/text like "overstimulated")
        areaWidth = 450;
        areaHeight = 120;
      } else if (aspectRatio > 1.3) {
        // Landscape design (like "ARE WE GREAT YET?")
        areaWidth = 400;
        areaHeight = 220;
      } else if (aspectRatio < 0.7) {
        // Tall/portrait design (like the bear design)
        areaWidth = 280;
        areaHeight = 420;
      } else {
        // Square-ish design (like the # symbol)
        areaWidth = 350;
        areaHeight = 350;
      }
      
      // Draw design area
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.strokeRect(
        center.x - (areaWidth / 2),
        designY - (areaHeight / 2),
        areaWidth,
        areaHeight
      );
      
      // Draw crosshair at design center
      ctx.beginPath();
      ctx.moveTo(center.x - 20, designY);
      ctx.lineTo(center.x + 20, designY);
      ctx.moveTo(center.x, designY - 20);
      ctx.lineTo(center.x, designY + 20);
      ctx.stroke();
    });
  };

  // Handle zoom in/out
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };
  
  // Toggle debug visualization
  const toggleDebugAreas = () => {
    setShowDebugAreas(prev => !prev);
  };

  // Handle mockup download
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