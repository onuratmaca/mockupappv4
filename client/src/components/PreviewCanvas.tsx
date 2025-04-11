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
import { getMockupById, Mockup } from "@/lib/mockup-data";
import { getPrintableArea, PrintableArea } from "@/lib/printable-areas";

interface PreviewCanvasProps {
  designImage: string | null;
  mockupId: number;
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
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 });
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
  }, [designSize, designPosition, designXOffset, designYOffset, designRatio]);

  // Redraw canvas when images or zoom change
  useEffect(() => {
    drawCanvas();
  }, [mockupImg, designImg, zoomLevel]);

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
      // Calculate scaling to fit canvas
      const scale = Math.min(
        canvasSize.width / img.width,
        canvasSize.height / img.height
      );
      
      const width = img.width * scale;
      const height = img.height * scale;
      
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
    
    const printableArea = getPrintableArea(mockupId);
    
    // Calculate printable area dimensions
    const printableWidth = mockupImg.width * printableArea.width;
    const printableHeight = mockupImg.height * printableArea.height;
    
    // Calculate center of printable area
    const centerX = mockupImg.x + mockupImg.width * printableArea.xCenter;
    const centerY = mockupImg.y + mockupImg.height * printableArea.yCenter;
    
    // Calculate design size based on percentage of printable area
    const maxDesignWidth = printableWidth * (designSize / 100);
    const scale = maxDesignWidth / designImg.width;
    
    const newWidth = designImg.width * scale;
    const newHeight = designImg.height * scale;
    
    // Get position offset based on selected position
    const positionOffset = printableArea.positionOffsets[designPosition];
    
    // Calculate position with offsets
    const xPosition = centerX + (mockupImg.width * positionOffset.x) - (newWidth / 2) + designXOffset;
    const yPosition = centerY + (mockupImg.height * positionOffset.y) - (newHeight / 2) + designYOffset;
    
    // Update design image properties
    const updatedDesign = {
      ...designImg,
      x: xPosition,
      y: yPosition,
      width: newWidth,
      height: newHeight
    };
    
    setDesignImg(updatedDesign);
    
    // Update position for parent component
    onPositionChange(
      Math.round(xPosition - (canvasSize.width / 2 - newWidth / 2)),
      Math.round(yPosition - (canvasSize.height / 2 - newHeight / 2))
    );
    
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
    const printableArea = getPrintableArea(mockupId);
    
    // Calculate printable area dimensions
    const printableWidth = mockupImg.width * printableArea.width;
    const printableHeight = mockupImg.height * printableArea.height;
    
    // Calculate center of printable area
    const centerX = mockupImg.x + mockupImg.width * printableArea.xCenter;
    const centerY = mockupImg.y + mockupImg.height * printableArea.yCenter;
    
    // Draw printable area rectangle
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      centerX - printableWidth / 2,
      centerY - printableHeight / 2,
      printableWidth,
      printableHeight
    );
    
    // Draw position markers
    const positions = ['top', 'center', 'bottom'] as const;
    const colors = {
      top: 'rgba(255, 0, 0, 0.7)',
      center: 'rgba(0, 255, 0, 0.7)',
      bottom: 'rgba(0, 0, 255, 0.7)'
    };
    
    positions.forEach(position => {
      const offset = printableArea.positionOffsets[position];
      const x = centerX + (mockupImg.width * offset.x);
      const y = centerY + (mockupImg.height * offset.y);
      
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = colors[position];
      ctx.fill();
    });
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
    if (!isDragging || !designImg || !canvasRef.current) return;
    
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
    
    // Update position for parent component
    onPositionChange(
      Math.round(newX - (canvasSize.width / 2 - designImg.width / 2)),
      Math.round(newY - (canvasSize.height / 2 - designImg.height / 2))
    );
    
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