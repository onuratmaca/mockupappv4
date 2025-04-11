import { useRef, useEffect, useState } from "react";
import * as fabric from "fabric";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Undo, Redo, Save, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DesignRatio, DESIGN_RATIOS } from "@/lib/design-ratios";
import { MOCKUP_IMAGES, getMockupById } from "@/lib/mockup-data";

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
  const canvasInstanceRef = useRef<fabric.Canvas | null>(null);
  const designObjectRef = useRef<fabric.Image | null>(null);
  const tshirtImageRef = useRef<fabric.Image | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current && !canvasInstanceRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 600,
        height: 600,
        backgroundColor: '#f9fafb',
        selection: false,
      });
      
      canvasInstanceRef.current = canvas;
      
      // Load initial mockup image
      loadMockupImage(mockupId);
      
      // Add to history
      updateHistory();
      
      // Clean up on component unmount
      return () => {
        canvas.dispose();
        canvasInstanceRef.current = null;
      };
    }
  }, []);
  
  // Load mockup image when mockup ID changes
  useEffect(() => {
    if (canvasInstanceRef.current) {
      loadMockupImage(mockupId);
    }
  }, [mockupId]);
  
  // Load design image when it changes
  useEffect(() => {
    if (canvasInstanceRef.current && designImage) {
      loadDesignImage(designImage);
    }
  }, [designImage]);
  
  // Update design position and size
  useEffect(() => {
    if (canvasInstanceRef.current && designObjectRef.current) {
      updateDesignPosition();
    }
  }, [designSize, designPosition, designXOffset, designYOffset]);
  
  // Update zoom level
  useEffect(() => {
    if (canvasInstanceRef.current) {
      canvasInstanceRef.current.setZoom(zoomLevel / 100);
      canvasInstanceRef.current.renderAll();
    }
  }, [zoomLevel]);
  
  // Update history navigation state
  useEffect(() => {
    setCanUndo(historyIndex > 0);
    setCanRedo(historyIndex < history.length - 1);
  }, [history, historyIndex]);
  
  // Load mockup image
  const loadMockupImage = (id: number) => {
    if (!canvasInstanceRef.current) return;
    
    const canvas = canvasInstanceRef.current;
    
    // Find mockup image by ID
    const mockup = getMockupById(id);
    if (!mockup) {
      toast({
        title: "Error",
        description: "Mockup not found",
        variant: "destructive",
      });
      return;
    }
    
    // Remove existing mockup image if any
    if (tshirtImageRef.current) {
      canvas.remove(tshirtImageRef.current);
    }
    
    // Load mockup image
    fabric.Image.fromURL(mockup.src, (img: fabric.Image) => {
      // Scale the image to fit canvas
      const scale = Math.min(
        canvas.width! / img.width!,
        canvas.height! / img.height!
      );
      
      img.scale(scale);
      
      // Center the image
      img.set({
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });
      
      tshirtImageRef.current = img;
      canvas.add(img);
      
      // Make sure it's behind other objects
      img.sendToBack();
      canvas.renderAll();
      
      // If design exists, reapply it
      if (designImage && designObjectRef.current) {
        updateDesignPosition();
      }
    });
  };
  
  // Load design image
  const loadDesignImage = (imageUrl: string) => {
    if (!canvasInstanceRef.current) return;
    
    const canvas = canvasInstanceRef.current;
    
    // Remove existing design image if any
    if (designObjectRef.current) {
      canvas.remove(designObjectRef.current);
    }
    
    fabric.Image.fromURL(imageUrl, (img: fabric.Image) => {
      const ratio = DESIGN_RATIOS[designRatio].value;
      
      // If the ratio is different than the image's natural ratio, adjust it
      if (ratio !== img.width! / img.height!) {
        // Adjust image dimensions to match the selected ratio
        const newWidth = ratio > 1 ? img.width : img.height! * ratio;
        const newHeight = ratio > 1 ? img.width! / ratio : img.height;
        
        img.set({
          width: newWidth,
          height: newHeight,
          scaleX: 1,
          scaleY: 1,
        });
      }
      
      img.set({
        selectable: true,
        evented: true,
        hasBorders: true,
        hasControls: true,
        lockUniScaling: true,
      });
      
      // Set up event listeners for design object
      img.on('moving', () => {
        const pos = img.getCenterPoint();
        onPositionChange(
          Math.round(pos.x - canvas.width! / 2), 
          Math.round(pos.y - canvas.height! / 2)
        );
      });
      
      img.on('modified', updateHistory);
      
      designObjectRef.current = img;
      canvas.add(img);
      canvas.setActiveObject(img);
      
      // Position the design
      updateDesignPosition();
      
      // Add to history
      updateHistory();
    });
  };
  
  // Update design position
  const updateDesignPosition = () => {
    if (!canvasInstanceRef.current || !designObjectRef.current || !tshirtImageRef.current) {
      return;
    }
    
    const canvas = canvasInstanceRef.current;
    const design = designObjectRef.current;
    const tshirt = tshirtImageRef.current;
    
    // Calculate t-shirt printable area (approximate)
    const printableWidth = tshirt.getScaledWidth() * 0.4;
    const printableHeight = tshirt.getScaledHeight() * 0.5;
    
    // Calculate design size based on percentage of printable area
    const maxDesignWidth = printableWidth * (designSize / 100);
    
    // Scale design to fit within printable area while maintaining aspect ratio
    const scale = maxDesignWidth / design.getScaledWidth();
    design.scale(scale);
    
    // Calculate vertical position based on selected position
    let yPosition;
    switch (designPosition) {
      case 'top':
        yPosition = tshirt.top! - printableHeight * 0.2;
        break;
      case 'bottom':
        yPosition = tshirt.top! + printableHeight * 0.2;
        break;
      default: // center
        yPosition = tshirt.top!;
        break;
    }
    
    // Apply position with offsets
    design.set({
      left: tshirt.left! + designXOffset,
      top: yPosition + designYOffset,
      originX: 'center',
      originY: 'center',
    });
    
    canvas.renderAll();
  };
  
  // Update history
  const updateHistory = () => {
    if (!canvasInstanceRef.current) return;
    
    const canvas = canvasInstanceRef.current;
    const json = JSON.stringify(canvas.toJSON(['id']));
    
    // If we have made a new change after undoing, remove future history
    if (historyIndex < history.length - 1) {
      setHistory(prev => prev.slice(0, historyIndex + 1));
    }
    
    setHistory(prev => [...prev, json]);
    setHistoryIndex(prev => prev + 1);
  };
  
  // Handle undo
  const handleUndo = () => {
    if (!canvasInstanceRef.current || historyIndex <= 0) return;
    
    setHistoryIndex(prev => prev - 1);
    loadFromHistory(historyIndex - 1);
  };
  
  // Handle redo
  const handleRedo = () => {
    if (!canvasInstanceRef.current || historyIndex >= history.length - 1) return;
    
    setHistoryIndex(prev => prev + 1);
    loadFromHistory(historyIndex + 1);
  };
  
  // Load from history
  const loadFromHistory = (index: number) => {
    if (!canvasInstanceRef.current || !history[index]) return;
    
    const canvas = canvasInstanceRef.current;
    canvas.loadFromJSON(JSON.parse(history[index]), () => {
      // Find references to the design and t-shirt objects
      canvas.forEachObject(obj => {
        if (obj.selectable) {
          designObjectRef.current = obj as fabric.Image;
        } else {
          tshirtImageRef.current = obj as fabric.Image;
        }
      });
      
      canvas.renderAll();
      
      // Update position values based on design position
      if (designObjectRef.current) {
        const pos = designObjectRef.current.getCenterPoint();
        onPositionChange(
          Math.round(pos.x - canvas.width! / 2),
          Math.round(pos.y - canvas.height! / 2)
        );
      }
    });
  };
  
  // Handle download
  const handleDownload = () => {
    if (!canvasInstanceRef.current) return;
    
    if (!designImage) {
      toast({
        title: "Error",
        description: "Please upload a design image before downloading",
        variant: "destructive",
      });
      return;
    }
    
    // Create a temporary canvas for download (without controls)
    const canvas = canvasInstanceRef.current;
    const activeObj = canvas.getActiveObject();
    
    // Deactivate all objects
    canvas.discardActiveObject();
    canvas.renderAll();
    
    // Generate a dataURL of the canvas
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2, // 2x resolution for better quality
    });
    
    // Create a download link
    const link = document.createElement('a');
    link.download = `tshirt-mockup-${mockupId}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Restore active object if there was one
    if (activeObj) {
      canvas.setActiveObject(activeObj);
      canvas.renderAll();
    }
    
    toast({
      title: "Success",
      description: "Mockup downloaded successfully!",
    });
    
    onDownload();
  };
  
  // Handle zoom in
  const handleZoomIn = () => {
    if (zoomLevel < 200) {
      onZoomChange(zoomLevel + 10);
    }
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    if (zoomLevel > 50) {
      onZoomChange(zoomLevel - 10);
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
          <canvas ref={canvasRef} />
        </div>
        
        <div className="mt-4 flex justify-between">
          <div>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              className={!canUndo ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <Undo className="mr-2 h-4 w-4" />
              Undo
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              className={`ml-2 ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Redo className="mr-2 h-4 w-4" />
              Redo
            </Button>
          </div>
          <div>
            <Button 
              variant="outline"
              size="sm"
              onClick={updateHistory}
            >
              <Save className="mr-2 h-4 w-4" />
              Quick Save
            </Button>
            <Button 
              size="sm"
              onClick={handleDownload}
              className="ml-2"
              disabled={!designImage}
            >
              <Check className="mr-2 h-4 w-4" />
              Apply Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
