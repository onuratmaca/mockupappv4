import { useRef, useEffect, useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Download, Undo, Redo, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DesignRatio, DESIGN_RATIOS } from "@/lib/design-ratios";
import { getMockupById, Mockup, ShirtPosition, getShirtGridPosition, ShirtGridPosition } from "@/lib/mockup-data";
import { getPrintableArea, PrintableArea } from "@/lib/printable-areas";

interface PreviewCanvasProps {
  designImage: string | null;
  mockupId: number;
  shirtPosition: ShirtPosition;
  designSize: number;
  designPosition: 'top' | 'center' | 'bottom';
  designXOffset: number;
  designYOffset: number;
  designRatio: DesignRatio;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onPositionChange: (x: number, y: number) => void;
  onDownload: () => void;
}

// Types for our image objects
interface ImageObject {
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function PreviewCanvas({
  designImage,
  mockupId,
  shirtPosition,
  designSize,
  designPosition,
  designXOffset,
  designYOffset,
  designRatio,
  zoomLevel,
  onZoomChange,
  onPositionChange,
  onDownload
}: PreviewCanvasProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [mockupImg, setMockupImg] = useState<ImageObject | null>(null);
  const [designImg, setDesignImg] = useState<ImageObject | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 4000, height: 3000 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<ImageObject[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvasCtxRef.current = ctx;
        // Set initial canvas background
        ctx.fillStyle = '#f9fafb';
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

  // Update design position when related props change
  useEffect(() => {
    if (mockupImg && designImg) {
      updateDesignPosition();
    }
  }, [designSize, designPosition, designXOffset, designYOffset, designRatio, shirtPosition]);

  // Redraw canvas when images, position or zoom change
  useEffect(() => {
    drawCanvas();
  }, [mockupImg, designImg, zoomLevel, shirtPosition]);

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
      // Original mockups are 4000x3000px, ensure correct aspect ratio
      const naturalAspect = 4000 / 3000;
      
      // If the loaded image has a different aspect ratio, we'll enforce the correct one
      const correctedWidth = naturalAspect >= 1 ? img.width : img.height * naturalAspect;
      const correctedHeight = naturalAspect >= 1 ? img.width / naturalAspect : img.height;
      
      // Calculate scaling to fit canvas
      const scale = Math.min(
        canvasSize.width / correctedWidth,
        canvasSize.height / correctedHeight
      );
      
      const width = correctedWidth * scale;
      const height = correctedHeight * scale;
      
      // Center in canvas
      const x = (canvasSize.width - width) / 2;
      const y = (canvasSize.height - height) / 2;
      
      setMockupImg({
        img,
        x,
        y,
        width,
        height
      });
      
      // If design already exists, update its position
      if (designImg) {
        updateDesignPosition();
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
      // Apply the selected design ratio
      const ratio = DESIGN_RATIOS[designRatio].value;
      let width, height;
      
      if (ratio !== img.width / img.height) {
        // Adjust dimensions to match the selected ratio
        if (ratio > 1) {
          // Landscape or wide
          width = img.width;
          height = img.width / ratio;
        } else {
          // Portrait or square
          width = img.height * ratio;
          height = img.height;
        }
      } else {
        width = img.width;
        height = img.height;
      }
      
      // Create design object with initial position at the center
      const designObject: ImageObject = {
        img,
        x: canvasSize.width / 2 - width / 2,
        y: canvasSize.height / 2 - height / 2,
        width,
        height
      };
      
      setDesignImg(designObject);
      
      // Position design correctly
      if (mockupImg) {
        updateDesignPosition();
      }
      
      // Save to history
      addToHistory(designObject);
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

  // Update design position based on settings
  const updateDesignPosition = () => {
    if (!mockupImg || !designImg) return;
    
    // Get the grid position of the selected shirt
    const gridPos = getShirtGridPosition(shirtPosition);
    
    // Get the printable area configuration
    const printableArea = getPrintableArea(mockupId);
    
    // Calculate the size and position of the selected shirt within the mockup
    const shirtWidth = mockupImg.width * gridPos.width;
    const shirtHeight = mockupImg.height * gridPos.height;
    const shirtX = mockupImg.x + (mockupImg.width * gridPos.x) - (shirtWidth / 2);
    const shirtY = mockupImg.y + (mockupImg.height * gridPos.y) - (shirtHeight / 2);
    
    // Hard-coded measurements for printable areas (in pixels) based on a 880x1320px shirt
    // These values can be adjusted for more precise placement
    const STANDARD_SHIRT_WIDTH = 880; // px (original 4000px mockup / 4 shirts + small margin)
    const STANDARD_SHIRT_HEIGHT = 1320; // px (original 3000px mockup / 2 shirts + small margin)
    
    // Calculate scaling factor between our canvas and standard measurements
    const scaleFactorX = shirtWidth / STANDARD_SHIRT_WIDTH;
    const scaleFactorY = shirtHeight / STANDARD_SHIRT_HEIGHT;
    
    // Standard printable area for a typical t-shirt (in pixels)
    const STANDARD_PRINTABLE_WIDTH = 500; // px (adjusted for t-shirt mockups)
    const STANDARD_PRINTABLE_HEIGHT = 600; // px (adjusted for t-shirt mockups)
    
    // Fixed positions for top, center, bottom placements relative to shirt (in pixels)
    const POSITIONS = {
      top: { x: 0, y: -150 },     // 150px above center
      center: { x: 0, y: 0 },     // At center 
      bottom: { x: 0, y: 150 }    // 150px below center
    };
    
    // Calculate scaled printable dimensions
    const printableWidth = STANDARD_PRINTABLE_WIDTH * scaleFactorX;
    const printableHeight = STANDARD_PRINTABLE_HEIGHT * scaleFactorY;
    
    // Center of the shirt
    const centerX = shirtX + (shirtWidth / 2);
    const centerY = shirtY + (shirtHeight / 2) - (shirtHeight * 0.08); // Shift up by 8% to account for neckline
    
    // Calculate max size based on desired percentage of printable area
    const maxWidth = printableWidth * (designSize / 100);
    const maxHeight = printableHeight * (designSize / 100);
    
    // Get the original aspect ratio of the design
    const designAspectRatio = designImg.width / designImg.height;
    
    // Determine new dimensions while maintaining aspect ratio
    let newWidth, newHeight;
    
    if (designAspectRatio >= 1) {
      // Landscape or square - constrain by width
      newWidth = maxWidth;
      newHeight = newWidth / designAspectRatio;
      
      // If height exceeds max height, constrain by height instead
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * designAspectRatio;
      }
    } else {
      // Portrait - constrain by height
      newHeight = maxHeight;
      newWidth = newHeight * designAspectRatio;
      
      // If width exceeds max width, constrain by width instead
      if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = newWidth / designAspectRatio;
      }
    }
    
    // Get position offset based on selected position (scaled to actual shirt size)
    const positionOffset = POSITIONS[designPosition];
    const scaledOffsetX = positionOffset.x * scaleFactorX;
    const scaledOffsetY = positionOffset.y * scaleFactorY;
    
    // Calculate final position with design centered on target point plus user offset
    const xPosition = centerX + scaledOffsetX - (newWidth / 2) + designXOffset;
    const yPosition = centerY + scaledOffsetY - (newHeight / 2) + designYOffset;
    
    // Update design image properties
    const updatedDesign = {
      ...designImg,
      x: xPosition,
      y: yPosition,
      width: newWidth,
      height: newHeight
    };
    
    setDesignImg(updatedDesign);
    
    // Only update offset values, not absolute positions
    onPositionChange(designXOffset, designYOffset);
    
    // Save to history
    addToHistory(updatedDesign);
  };

  // Draw functions
  const drawCanvas = () => {
    if (!canvasCtxRef.current) return;
    
    const ctx = canvasCtxRef.current;
    
    // Clear canvas
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Apply zoom
    const zoomFactor = zoomLevel / 100;
    ctx.save();
    
    // Scale from center
    ctx.translate(canvasSize.width / 2, canvasSize.height / 2);
    ctx.scale(zoomFactor, zoomFactor);
    ctx.translate(-canvasSize.width / 2, -canvasSize.height / 2);
    
    // Draw mockup image
    if (mockupImg) {
      ctx.drawImage(
        mockupImg.img,
        mockupImg.x,
        mockupImg.y,
        mockupImg.width,
        mockupImg.height
      );
      
      // Draw printable area visualization
      drawPrintableArea(ctx, mockupImg);
    }
    
    // Draw design image
    if (designImg) {
      ctx.drawImage(
        designImg.img,
        designImg.x,
        designImg.y,
        designImg.width,
        designImg.height
      );
    }
    
    ctx.restore();
  };

  // Draw printable area visualization
  const drawPrintableArea = (ctx: CanvasRenderingContext2D, mockupImg: ImageObject) => {
    // Get the grid position of the selected shirt
    const gridPos = getShirtGridPosition(shirtPosition);
    
    // Calculate the size and position of the selected shirt within the mockup
    const shirtWidth = mockupImg.width * gridPos.width;
    const shirtHeight = mockupImg.height * gridPos.height;
    const shirtX = mockupImg.x + (mockupImg.width * gridPos.x) - (shirtWidth / 2);
    const shirtY = mockupImg.y + (mockupImg.height * gridPos.y) - (shirtHeight / 2);
    
    // Hard-coded measurements for printable areas (in pixels) based on a 880x1320px shirt
    const STANDARD_SHIRT_WIDTH = 880; // px (original 4000px mockup / 4 shirts + small margin)
    const STANDARD_SHIRT_HEIGHT = 1320; // px (original 3000px mockup / 2 shirts + small margin)
    
    // Calculate scaling factor between our canvas and standard measurements
    const scaleFactorX = shirtWidth / STANDARD_SHIRT_WIDTH;
    const scaleFactorY = shirtHeight / STANDARD_SHIRT_HEIGHT;
    
    // Standard printable area for a typical t-shirt (in pixels)
    const STANDARD_PRINTABLE_WIDTH = 500; // px (adjusted for t-shirt mockups)
    const STANDARD_PRINTABLE_HEIGHT = 600; // px (adjusted for t-shirt mockups)
    
    // Fixed positions for top, center, bottom placements relative to shirt (in pixels)
    const POSITIONS = {
      top: { x: 0, y: -150 },     // 150px above center
      center: { x: 0, y: 0 },     // At center 
      bottom: { x: 0, y: 150 }    // 150px below center
    };
    
    // Calculate scaled printable dimensions
    const printableWidth = STANDARD_PRINTABLE_WIDTH * scaleFactorX;
    const printableHeight = STANDARD_PRINTABLE_HEIGHT * scaleFactorY;
    
    // Center of the shirt
    const centerX = shirtX + (shirtWidth / 2);
    const centerY = shirtY + (shirtHeight / 2) - (shirtHeight * 0.08); // Shift up by 8% to account for neckline
    
    // Highlight the selected shirt with a transparent overlay
    ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
    ctx.fillRect(
      shirtX,
      shirtY,
      shirtWidth,
      shirtHeight
    );
    
    // Draw shirt position outline
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(
      shirtX,
      shirtY,
      shirtWidth,
      shirtHeight
    );
    
    // Draw printable area rectangle
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      centerX - printableWidth / 2,
      centerY - printableHeight / 2,
      printableWidth,
      printableHeight
    );
    
    // Add a subtle background to the printable area
    ctx.fillStyle = 'rgba(0, 150, 255, 0.05)';
    ctx.fillRect(
      centerX - printableWidth / 2,
      centerY - printableHeight / 2,
      printableWidth,
      printableHeight
    );
    
    // Draw position markers with improved visibility
    const positions = ['top', 'center', 'bottom'] as const;
    const colors = {
      top: 'rgba(255, 50, 50, 0.9)',
      center: 'rgba(50, 255, 50, 0.9)',
      bottom: 'rgba(50, 50, 255, 0.9)'
    };
    
    // Draw the markers for each position with a larger radius
    positions.forEach(position => {
      // Get position offset and scale it
      const positionOffset = POSITIONS[position];
      const scaledOffsetX = positionOffset.x * scaleFactorX;
      const scaledOffsetY = positionOffset.y * scaleFactorY;
      
      // Calculate center point for this position
      const x = centerX + scaledOffsetX;
      const y = centerY + scaledOffsetY;
      
      // Add a white outline to the marker
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      
      // Draw the colored marker
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = colors[position];
      ctx.fill();
      
      // Draw a ring around the current position marker
      if (position === designPosition) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = colors[position];
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    
    // Draw label for the current position
    const currentPositionLabel = designPosition.charAt(0).toUpperCase() + designPosition.slice(1);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(`Position: ${currentPositionLabel}`, centerX, shirtY + shirtHeight + 15);
    
    // Draw label for size percentage
    ctx.fillText(`Size: ${designSize}%`, centerX, shirtY + shirtHeight + 30);
  };

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!designImg) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) * (canvasSize.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasSize.height / rect.height);
    
    // Check if click is inside design
    const zoomFactor = zoomLevel / 100;
    const designLeft = (designImg.x - (canvasSize.width * (zoomFactor - 1) / 2)) * zoomFactor;
    const designTop = (designImg.y - (canvasSize.height * (zoomFactor - 1) / 2)) * zoomFactor;
    const designRight = designLeft + designImg.width * zoomFactor;
    const designBottom = designTop + designImg.height * zoomFactor;
    
    if (x >= designLeft && x <= designRight && y >= designTop && y <= designBottom) {
      setIsDragging(true);
      setDragStart({ x: x - designImg.x, y: y - designImg.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !designImg || !canvasRef.current || !mockupImg) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasSize.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasSize.height / rect.height);
    
    const newX = x - dragStart.x;
    const newY = y - dragStart.y;
    
    setDesignImg({
      ...designImg,
      x: newX,
      y: newY
    });
    
    // Get the grid position of the selected shirt
    const gridPos = getShirtGridPosition(shirtPosition);
    
    // Calculate shirt dimensions and position
    const shirtWidth = mockupImg.width * gridPos.width;
    const shirtHeight = mockupImg.height * gridPos.height;
    const shirtX = mockupImg.x + (mockupImg.width * gridPos.x) - (shirtWidth / 2);
    const shirtY = mockupImg.y + (mockupImg.height * gridPos.y) - (shirtHeight / 2);
    
    // Hard-coded measurements for printable areas based on a standard shirt
    const STANDARD_SHIRT_WIDTH = 880; // px
    const STANDARD_SHIRT_HEIGHT = 1320; // px
    
    // Calculate scaling factor between our canvas and standard measurements
    const scaleFactorX = shirtWidth / STANDARD_SHIRT_WIDTH;
    const scaleFactorY = shirtHeight / STANDARD_SHIRT_HEIGHT;
    
    // Fixed positions for top, center, bottom placements relative to shirt center
    const POSITIONS = {
      top: { x: 0, y: -150 },     // 150px above center
      center: { x: 0, y: 0 },     // At center 
      bottom: { x: 0, y: 150 }    // 150px below center
    };
    
    // Center of the shirt, adjusted for neckline
    const centerX = shirtX + (shirtWidth / 2);
    const centerY = shirtY + (shirtHeight / 2) - (shirtHeight * 0.08); // Shift up by 8%
    
    // Get position offset and scale it
    const positionOffset = POSITIONS[designPosition];
    const scaledOffsetX = positionOffset.x * scaleFactorX;
    const scaledOffsetY = positionOffset.y * scaleFactorY;
    
    // Calculate the ideal position for this design
    const idealCenterX = centerX + scaledOffsetX;
    const idealCenterY = centerY + scaledOffsetY;
    
    // Calculate the offsets from the ideal position
    const newXOffset = Math.round(newX - (idealCenterX - designImg.width / 2));
    const newYOffset = Math.round(newY - (idealCenterY - designImg.height / 2));
    
    // Update position for parent component
    onPositionChange(newXOffset, newYOffset);
    
    drawCanvas();
  };

  const handleMouseUp = () => {
    if (isDragging && designImg) {
      setIsDragging(false);
      addToHistory(designImg);
    }
  };

  // History management
  const addToHistory = (designObject: ImageObject) => {
    // If we have made a new change after undoing, remove future history
    if (historyIndex < history.length - 1) {
      setHistory(prev => prev.slice(0, historyIndex + 1));
    }
    
    setHistory(prev => [...prev, { ...designObject }]);
    setHistoryIndex(prev => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    
    if (history[newIndex]) {
      setDesignImg(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    
    if (history[newIndex]) {
      setDesignImg(history[newIndex]);
    }
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
    
    // Create a temporary canvas without debug visuals for download
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasSize.width;
    tempCanvas.height = canvasSize.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx && mockupImg) {
      // Draw background
      tempCtx.fillStyle = '#f9fafb';
      tempCtx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      
      // Draw mockup
      tempCtx.drawImage(
        mockupImg.img,
        mockupImg.x,
        mockupImg.y,
        mockupImg.width,
        mockupImg.height
      );
      
      // Draw design
      tempCtx.drawImage(
        designImg.img,
        designImg.x,
        designImg.y,
        designImg.width,
        designImg.height
      );
      
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
          <CardTitle className="text-lg font-medium">Preview</CardTitle>
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
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        </div>
        
        <div className="mt-4 flex justify-between">
          <div>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo className="mr-2 h-4 w-4" />
              Undo
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="ml-2"
            >
              <Redo className="mr-2 h-4 w-4" />
              Redo
            </Button>
          </div>
          <div>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => designImg && addToHistory(designImg)}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Position
            </Button>
            <Button 
              size="sm"
              onClick={handleDownload}
              className="ml-2"
              disabled={!designImg}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}