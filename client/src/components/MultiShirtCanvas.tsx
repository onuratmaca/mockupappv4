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
  designPosition: string; 
  onDownload: () => void;
}

// Design Size Configuration
// These values were determined through careful measurement of the example mockups
const DESIGN_SIZE = {
  // Very wide designs like "overstimulated" (ratio > 2.0)
  veryWide: {
    width: 450,
    height: 150
  },
  // Landscape designs like "ARE WE GREAT YET?" (ratio 1.3-2.0)
  landscape: {
    width: 450,
    height: 300
  },
  // Square-ish designs like the # symbol (ratio 0.7-1.3)
  square: {
    width: 360,
    height: 360
  },
  // Tall/portrait designs like the bear (ratio < 0.7)
  tall: {
    width: 270,
    height: 450
  }
};

// These position values were carefully calibrated using the design placement editor
// Each position is the center point where designs should be placed
const OPTIMIZED_SHIRT_POSITIONS = [
  // TOP ROW (Left to Right)
  { x: 595, y: 560, name: "White" },
  { x: 1535, y: 560, name: "Ivory" },
  { x: 2455, y: 560, name: "Butter" },
  { x: 3390, y: 560, name: "Banana" },
  
  // BOTTOM ROW (Left to Right)
  { x: 605, y: 1970, name: "Mustard" },
  { x: 1535, y: 1965, name: "Peachy" },
  { x: 2475, y: 1965, name: "Yam" },
  { x: 3395, y: 1965, name: "Khaki" }
];

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
  const [showDebugAreas, setShowDebugAreas] = useState(false); // Debug off by default

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

  // Redraw the canvas when inputs change
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
      
      // Draw debug visualization if enabled
      if (showDebugAreas) {
        drawDebugAreas(ctx);
      }
    }
  }, [mockupImg, designImg, designSize, showDebugAreas]);
  
  // Draw designs on all shirts using the optimized positions
  const drawDesignsOnShirts = (ctx: CanvasRenderingContext2D) => {
    if (!designImg) return;
    
    // Get design's aspect ratio
    const aspectRatio = designImg.width / designImg.height;
    
    // Place design on each shirt position
    OPTIMIZED_SHIRT_POSITIONS.forEach(position => {
      // Calculate design dimensions based on aspect ratio
      let areaWidth, areaHeight;
      
      if (aspectRatio > 2.0) {
        // Very wide design (banner/text like "overstimulated")
        areaWidth = DESIGN_SIZE.veryWide.width;
        areaHeight = DESIGN_SIZE.veryWide.height;
      } else if (aspectRatio > 1.3) {
        // Landscape design (like "ARE WE GREAT YET?")
        areaWidth = DESIGN_SIZE.landscape.width;
        areaHeight = DESIGN_SIZE.landscape.height;
      } else if (aspectRatio < 0.7) {
        // Tall/portrait design (like the bear design)
        areaWidth = DESIGN_SIZE.tall.width;
        areaHeight = DESIGN_SIZE.tall.height;
      } else {
        // Square-ish design (like the # symbol)
        areaWidth = DESIGN_SIZE.square.width;
        areaHeight = DESIGN_SIZE.square.height;
      }
      
      // Apply user's size preference 
      areaWidth = areaWidth * (designSize / 100);
      areaHeight = areaHeight * (designSize / 100);
      
      // Calculate final design dimensions preserving aspect ratio
      let designWidth, designHeight;
      
      if (aspectRatio > areaWidth / areaHeight) {
        // Width-constrained
        designWidth = areaWidth;
        designHeight = designWidth / aspectRatio;
      } else {
        // Height-constrained
        designHeight = areaHeight;
        designWidth = designHeight * aspectRatio;
      }
      
      // Draw the design centered on the optimized position
      ctx.drawImage(
        designImg,
        position.x - (designWidth / 2),
        position.y - (designHeight / 2),
        designWidth,
        designHeight
      );
    });
  };
  
  // Draw debug visualization (printable areas)
  const drawDebugAreas = (ctx: CanvasRenderingContext2D) => {
    if (!designImg) return;
    
    const aspectRatio = designImg.width / designImg.height;
    
    // For each shirt position
    OPTIMIZED_SHIRT_POSITIONS.forEach(position => {
      // Calculate design dimensions based on aspect ratio
      let areaWidth, areaHeight;
      
      if (aspectRatio > 2.0) {
        // Very wide design (banner/text like "overstimulated")
        areaWidth = DESIGN_SIZE.veryWide.width;
        areaHeight = DESIGN_SIZE.veryWide.height;
      } else if (aspectRatio > 1.3) {
        // Landscape design (like "ARE WE GREAT YET?")
        areaWidth = DESIGN_SIZE.landscape.width;
        areaHeight = DESIGN_SIZE.landscape.height;
      } else if (aspectRatio < 0.7) {
        // Tall/portrait design (like the bear design)
        areaWidth = DESIGN_SIZE.tall.width;
        areaHeight = DESIGN_SIZE.tall.height;
      } else {
        // Square-ish design (like the # symbol)
        areaWidth = DESIGN_SIZE.square.width;
        areaHeight = DESIGN_SIZE.square.height;
      }
      
      // Apply user's size preference 
      areaWidth = areaWidth * (designSize / 100);
      areaHeight = areaHeight * (designSize / 100);
      
      // Draw printable area rectangle
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        position.x - (areaWidth / 2),
        position.y - (areaHeight / 2),
        areaWidth,
        areaHeight
      );
      
      // Draw crosshair at center
      ctx.beginPath();
      ctx.moveTo(position.x - 15, position.y);
      ctx.lineTo(position.x + 15, position.y);
      ctx.moveTo(position.x, position.y - 15);
      ctx.lineTo(position.x, position.y + 15);
      ctx.stroke();
      
      // Add shirt identifier
      ctx.font = '30px sans-serif';
      ctx.fillStyle = 'rgba(0, 0, 255, 0.7)';
      ctx.fillText(position.name, position.x - 30, position.y - 20);
    });
    
    // Add design info
    ctx.font = '36px sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillText(`Design Ratio: ${aspectRatio.toFixed(2)}`, 100, 100);
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
    
    // Create a temporary canvas for the download (without debug markers)
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = canvasSize.width;
    downloadCanvas.height = canvasSize.height;
    const downloadCtx = downloadCanvas.getContext('2d');
    
    if (downloadCtx) {
      // Draw mockup
      downloadCtx.drawImage(mockupImg, 0, 0, canvasSize.width, canvasSize.height);
      
      // Draw designs without debug markers
      if (designImg) {
        // Get design's aspect ratio
        const aspectRatio = designImg.width / designImg.height;
        
        // Place design on each shirt position
        OPTIMIZED_SHIRT_POSITIONS.forEach(position => {
          // Calculate design dimensions based on aspect ratio
          let areaWidth, areaHeight;
          
          if (aspectRatio > 2.0) {
            // Very wide design (banner/text like "overstimulated")
            areaWidth = DESIGN_SIZE.veryWide.width;
            areaHeight = DESIGN_SIZE.veryWide.height;
          } else if (aspectRatio > 1.3) {
            // Landscape design (like "ARE WE GREAT YET?")
            areaWidth = DESIGN_SIZE.landscape.width;
            areaHeight = DESIGN_SIZE.landscape.height;
          } else if (aspectRatio < 0.7) {
            // Tall/portrait design (like the bear design)
            areaWidth = DESIGN_SIZE.tall.width;
            areaHeight = DESIGN_SIZE.tall.height;
          } else {
            // Square-ish design (like the # symbol)
            areaWidth = DESIGN_SIZE.square.width;
            areaHeight = DESIGN_SIZE.square.height;
          }
          
          // Apply user's size preference 
          areaWidth = areaWidth * (designSize / 100);
          areaHeight = areaHeight * (designSize / 100);
          
          // Calculate final design dimensions preserving aspect ratio
          let designWidth, designHeight;
          
          if (aspectRatio > areaWidth / areaHeight) {
            // Width-constrained
            designWidth = areaWidth;
            designHeight = designWidth / aspectRatio;
          } else {
            // Height-constrained
            designHeight = areaHeight;
            designWidth = designHeight * aspectRatio;
          }
          
          // Draw the design centered on the position
          downloadCtx.drawImage(
            designImg,
            position.x - (designWidth / 2),
            position.y - (designHeight / 2),
            designWidth,
            designHeight
          );
        });
      }
      
      // Get canvas data URL
      const dataURL = downloadCanvas.toDataURL('image/png');
      
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
          <CardTitle className="text-lg font-medium">Design Mockup</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant={showDebugAreas ? "secondary" : "ghost"}
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