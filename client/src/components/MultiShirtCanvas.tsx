import React, { useRef, useEffect, useState, MouseEvent } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, Eye, EyeOff, MoveHorizontal, MoveVertical, Crosshair, RotateCcw, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMockupById } from "@/lib/mockup-data";
import { Slider } from "@/components/ui/slider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Project } from "@shared/schema";

interface MultiShirtCanvasProps {
  designImage: string | null;
  mockupId: number;
  designSize: number;
  designPosition: string; 
  onDownload: () => void;
  onSaveSettings?: (settings: PlacementSettings) => void;
  initialSettings?: PlacementSettings;
}

// Define a placement settings type
export interface PlacementSettings {
  designWidthFactor: number;
  designHeightFactor: number;
  globalYOffset: number;
  placementSettings: string; // JSON string of shirt configs
}

// Size and position configuration
interface ShirtConfig {
  x: number;
  y: number;
  name: string;
  index: number;
  designOffset: { x: number; y: number };
}

// Define initial shirt positions based on optimal placement data
const INITIAL_SHIRT_POSITIONS: ShirtConfig[] = [
  // TOP ROW (Left to Right)
  { x: 500, y: 750, name: "White", index: 0, designOffset: { x: 90, y: -90 } },
  { x: 1500, y: 750, name: "Ivory", index: 1, designOffset: { x: 30, y: -75 } },
  { x: 2500, y: 750, name: "Butter", index: 2, designOffset: { x: -45, y: -80 } },
  { x: 3500, y: 750, name: "Banana", index: 3, designOffset: { x: -90, y: -90 } },
  
  // BOTTOM ROW (Left to Right)
  { x: 500, y: 2250, name: "Mustard", index: 4, designOffset: { x: 95, y: -160 } },
  { x: 1500, y: 2250, name: "Peachy", index: 5, designOffset: { x: 30, y: -180 } },
  { x: 2500, y: 2250, name: "Yam", index: 6, designOffset: { x: -30, y: -170 } },
  { x: 3500, y: 2250, name: "Khaki", index: 7, designOffset: { x: -95, y: -170 } }
];

export default function MultiShirtCanvas({
  designImage,
  mockupId,
  designSize,
  designPosition,
  onDownload,
  onSaveSettings,
  initialSettings
}: MultiShirtCanvasProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mockupImg, setMockupImg] = useState<HTMLImageElement | null>(null);
  const [designImg, setDesignImg] = useState<HTMLImageElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100); // Full size view
  const [canvasSize] = useState({ width: 4000, height: 3000 });
  const [showDebugAreas, setShowDebugAreas] = useState(true); 
  
  // Design placement adjustment controls
  const [shirtConfigs, setShirtConfigs] = useState<ShirtConfig[]>(INITIAL_SHIRT_POSITIONS);
  const [selectedShirt, setSelectedShirt] = useState<number>(0);
  const [globalYOffset, setGlobalYOffset] = useState(-200);  // Default offset based on optimal positioning
  const [editMode, setEditMode] = useState<'none' | 'all' | 'individual'>('none');
  const [designWidthFactor, setDesignWidthFactor] = useState(450); // Default design width for avg design
  const [designHeightFactor, setDesignHeightFactor] = useState(300); // Default design height
  const [syncAll, setSyncAll] = useState(true); // Sync all shirts by default

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
  
  // Load initial placement settings when provided
  useEffect(() => {
    if (initialSettings) {
      // Set design width and height
      setDesignWidthFactor(initialSettings.designWidthFactor);
      setDesignHeightFactor(initialSettings.designHeightFactor);
      
      // Set global Y offset
      setGlobalYOffset(initialSettings.globalYOffset);
      
      // Set shirt configurations if available
      if (initialSettings.placementSettings) {
        try {
          const parsedSettings = JSON.parse(initialSettings.placementSettings);
          if (Array.isArray(parsedSettings) && parsedSettings.length === 8) {
            setShirtConfigs(parsedSettings);
          }
        } catch (error) {
          console.error("Failed to parse saved shirt configurations:", error);
        }
      }
      
      // Automatically enable edit mode for better user experience
      setEditMode('all');
    }
  }, [initialSettings]);

  // Handle mouse click on canvas for selecting shirts
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || editMode === 'none') return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate click position adjusted for canvas scaling and zoom
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = (e.clientX - rect.left) * scaleX * (100 / zoomLevel);
    const clickY = (e.clientY - rect.top) * scaleY * (100 / zoomLevel);
    
    // Find if click is within any shirt area
    const clickedShirtIndex = shirtConfigs.findIndex(shirt => {
      const shirtX = shirt.x;
      const shirtY = shirt.y;
      
      // Use a reasonable click target radius (300px)
      const distance = Math.sqrt(Math.pow(clickX - shirtX, 2) + Math.pow(clickY - shirtY, 2));
      return distance < 300;
    });
    
    if (clickedShirtIndex !== -1) {
      setSelectedShirt(clickedShirtIndex);
      toast({
        title: "Shirt Selected",
        description: `Now editing ${shirtConfigs[clickedShirtIndex].name} shirt (position ${clickedShirtIndex + 1})`,
      });
    }
  };

  // Function to update a specific shirt's position
  const updateShirtOffset = (index: number, xOffset: number, yOffset: number) => {
    setShirtConfigs(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        designOffset: {
          x: xOffset,
          y: yOffset
        }
      };
      return updated;
    });
  };

  // Update all shirts with the same offset
  const updateAllShirtsOffset = (xOffset: number, yOffset: number) => {
    setShirtConfigs(prev => {
      return prev.map(shirt => ({
        ...shirt,
        designOffset: {
          x: xOffset,
          y: yOffset
        }
      }));
    });
  };

  // Handle X offset change
  const handleXOffsetChange = (value: number) => {
    if (syncAll) {
      updateAllShirtsOffset(value, shirtConfigs[0].designOffset.y);
    } else {
      updateShirtOffset(selectedShirt, value, shirtConfigs[selectedShirt].designOffset.y);
    }
  };

  // Handle Y offset change
  const handleYOffsetChange = (value: number) => {
    if (syncAll) {
      updateAllShirtsOffset(shirtConfigs[0].designOffset.x, value);
    } else {
      updateShirtOffset(selectedShirt, shirtConfigs[selectedShirt].designOffset.x, value);
    }
  };

  // Reset positions to default optimal settings
  const resetPositions = () => {
    setShirtConfigs(INITIAL_SHIRT_POSITIONS);
    setGlobalYOffset(-200); // Reset to optimal default Y offset
    setDesignWidthFactor(450);
    setDesignHeightFactor(300);
  };

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
  }, [
    mockupImg, 
    designImg, 
    designSize, 
    showDebugAreas, 
    selectedShirt, 
    shirtConfigs, 
    globalYOffset,
    designWidthFactor,
    designHeightFactor
  ]);
  
  // Draw designs on shirts based on configs
  const drawDesignsOnShirts = (ctx: CanvasRenderingContext2D) => {
    if (!designImg) return;
    
    // Get design's aspect ratio
    const aspectRatio = designImg.width / designImg.height;
    
    // Place design on each shirt position
    shirtConfigs.forEach((shirt) => {
      // Calculate design dimensions based on aspect ratio
      let areaWidth, areaHeight;
      
      if (aspectRatio > 2.0) {
        // Very wide design (banner/text like "overstimulated")
        areaWidth = designWidthFactor;
        areaHeight = designHeightFactor / 2;
      } else if (aspectRatio > 1.3) {
        // Landscape design (like "ARE WE GREAT YET?")
        areaWidth = designWidthFactor;
        areaHeight = designHeightFactor;
      } else if (aspectRatio < 0.7) {
        // Tall/portrait design (like the bear design)
        areaWidth = designWidthFactor * 0.6;
        areaHeight = designHeightFactor * 1.5;
      } else {
        // Square-ish design (like the # symbol)
        areaWidth = designWidthFactor * 0.8;
        areaHeight = designHeightFactor * 1.2;
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
      
      // Draw the design with offsets
      const designX = shirt.x + shirt.designOffset.x;
      const designY = shirt.y + shirt.designOffset.y + globalYOffset;
      
      // Draw from top point instead of center
      ctx.drawImage(
        designImg,
        designX - (designWidth / 2),
        designY, // No longer subtracting half the height
        designWidth,
        designHeight
      );
    });
  };
  
  // Draw debug visualizations and position guides
  const drawDebugAreas = (ctx: CanvasRenderingContext2D) => {
    if (!designImg) return;
    
    const aspectRatio = designImg.width / designImg.height;
    
    // For each shirt, draw boundary and guides
    shirtConfigs.forEach((shirt, index) => {
      // Set different colors for selected vs. non-selected shirts
      const isSelected = index === selectedShirt;
      
      // Calculate design dimensions based on aspect ratio
      let areaWidth, areaHeight;
      
      if (aspectRatio > 2.0) {
        areaWidth = designWidthFactor;
        areaHeight = designHeightFactor / 2;
      } else if (aspectRatio > 1.3) {
        areaWidth = designWidthFactor;
        areaHeight = designHeightFactor;
      } else if (aspectRatio < 0.7) {
        areaWidth = designWidthFactor * 0.6;
        areaHeight = designHeightFactor * 1.5;
      } else {
        areaWidth = designWidthFactor * 0.8;
        areaHeight = designHeightFactor * 1.2;
      }
      
      // Adjust for user size preference
      areaWidth = areaWidth * (designSize / 100);
      areaHeight = areaHeight * (designSize / 100);
      
      // Draw shirt center marker
      ctx.beginPath();
      ctx.strokeStyle = isSelected ? 'rgba(255, 165, 0, 0.8)' : 'rgba(0, 128, 255, 0.5)';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.arc(shirt.x, shirt.y, 15, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw design position with offsets
      const designX = shirt.x + shirt.designOffset.x;
      const designY = shirt.y + shirt.designOffset.y + globalYOffset;
      
      // Draw design area - aligned with top-based positioning
      ctx.strokeStyle = isSelected ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 0, 0, 0.4)';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.strokeRect(
        designX - (areaWidth / 2),
        designY,
        areaWidth,
        areaHeight
      );
      
      // Draw crosshair at design center
      ctx.beginPath();
      ctx.moveTo(designX - 20, designY);
      ctx.lineTo(designX + 20, designY);
      ctx.moveTo(designX, designY - 20);
      ctx.lineTo(designX, designY + 20);
      ctx.stroke();
      
      // Add shirt number for easier identification
      ctx.font = isSelected ? 'bold 48px sans-serif' : '36px sans-serif';
      ctx.fillStyle = isSelected ? 'rgba(255, 165, 0, 0.8)' : 'rgba(0, 128, 255, 0.7)';
      ctx.fillText(`${index + 1}`, shirt.x - 10, shirt.y - 30);
      
      // Add design position info when selected
      if (isSelected) {
        ctx.font = '36px sans-serif';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillText(`X: ${shirt.designOffset.x}, Y: ${shirt.designOffset.y + globalYOffset}`, 
                      designX + (areaWidth / 2) + 10, 
                      designY);
      }
    });
    
    // Draw control panel info
    ctx.font = '36px sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillText(`Design Size: ${designWidthFactor}×${designHeightFactor}`, 100, 100);
    ctx.fillText(`Mode: ${syncAll ? 'All Shirts Synced' : 'Individual Shirt Edit'}`, 100, 150);
    ctx.fillText(`Selected: Shirt #${selectedShirt + 1} (${shirtConfigs[selectedShirt].name})`, 100, 200);
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
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'individual';
      return 'none';
    });
  };

  // Toggle sync all shirts
  const toggleSyncMode = () => {
    setSyncAll(prev => !prev);
  };

  // JPEG quality setting for download
  const [jpegQuality, setJpegQuality] = useState<number>(85); // Default 85% quality
  
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
        shirtConfigs.forEach((shirt) => {
          // Calculate design dimensions based on aspect ratio
          let areaWidth, areaHeight;
          
          if (aspectRatio > 2.0) {
            areaWidth = designWidthFactor;
            areaHeight = designHeightFactor / 2;
          } else if (aspectRatio > 1.3) {
            areaWidth = designWidthFactor;
            areaHeight = designHeightFactor;
          } else if (aspectRatio < 0.7) {
            areaWidth = designWidthFactor * 0.6;
            areaHeight = designHeightFactor * 1.5;
          } else {
            areaWidth = designWidthFactor * 0.8;
            areaHeight = designHeightFactor * 1.2;
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
          
          // Draw the design with offsets
          const designX = shirt.x + shirt.designOffset.x;
          const designY = shirt.y + shirt.designOffset.y + globalYOffset;
          
          // Draw from top point instead of center for download too
          downloadCtx.drawImage(
            designImg,
            designX - (designWidth / 2),
            designY, // No longer subtracting half the height
            designWidth,
            designHeight
          );
        });
      }
      
      // Get canvas data URL as JPEG with quality setting
      const dataURL = downloadCanvas.toDataURL('image/jpeg', jpegQuality / 100);
      
      // Create download link
      const link = document.createElement('a');
      link.download = `tshirt-mockup-${mockupId}.jpg`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: `Mockup downloaded as JPEG (${jpegQuality}% quality)`,
      });
      
      onDownload();
    }
  };
  
  // Quality setting will now be controlled by the slider directly
  
  // Generate position data for developer
  const generatePositionData = () => {
    const data = {
      designWidthFactor,
      designHeightFactor,
      globalYOffset,
      positions: shirtConfigs.map(s => ({
        name: s.name,
        x: s.x + s.designOffset.x, 
        y: s.y + s.designOffset.y + globalYOffset
      }))
    };
    
    console.log('=== POSITION DATA FOR DEVELOPER ===');
    console.log(JSON.stringify(data, null, 2));
    
    toast({
      title: "Position Data Generated",
      description: "Check browser console for copy-paste data",
    });
    
    return data;
  };
  
  // Save placement settings to project
  const saveSettings = () => {
    if (!designImage) {
      toast({
        title: "Error",
        description: "Please upload a design image before saving settings",
        variant: "destructive",
      });
      return;
    }
    
    // Generate the position data
    const positionData = generatePositionData();
    
    // Create the settings object to save
    const settings: PlacementSettings = {
      designWidthFactor,
      designHeightFactor,
      globalYOffset,
      placementSettings: JSON.stringify(shirtConfigs)
    };
    
    // Call the parent's save function if provided
    if (onSaveSettings) {
      onSaveSettings(settings);
      
      toast({
        title: "Success",
        description: "Design placement settings saved successfully!",
        variant: "default",
      });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Design Placement Editor</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant={editMode !== 'none' ? "secondary" : "ghost"}
              size="icon" 
              onClick={toggleEditMode}
              title="Toggle Edit Mode"
            >
              <Crosshair className="h-4 w-4" />
            </Button>
            <Button 
              variant={showDebugAreas ? "secondary" : "ghost"}
              size="icon" 
              onClick={toggleDebugAreas}
              title="Toggle Debug Areas"
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
        {editMode !== 'none' && (
          <div className="bg-gray-100 p-4 mb-4 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Design Placement Controls</h3>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={syncAll ? "default" : "outline"}
                  onClick={toggleSyncMode}
                >
                  {syncAll ? "All Shirts" : "Individual"}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={resetPositions}
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Reset
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={generatePositionData}
                >
                  Export Position Data
                </Button>
                <Button 
                  size="sm" 
                  variant="default" 
                  onClick={saveSettings}
                >
                  <Save className="h-3 w-3 mr-1" /> Save Settings
                </Button>
              </div>
            </div>
            
            {/* Design size controls */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center">
                    <MoveHorizontal className="h-3 w-3 mr-1" /> Design Width: {designWidthFactor}px
                  </label>
                </div>
                <Slider 
                  min={100} 
                  max={800} 
                  step={10} 
                  value={[designWidthFactor]} 
                  onValueChange={(value) => setDesignWidthFactor(value[0])} 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center">
                    <MoveVertical className="h-3 w-3 mr-1" /> Design Height: {designHeightFactor}px
                  </label>
                </div>
                <Slider 
                  min={100} 
                  max={600} 
                  step={10} 
                  value={[designHeightFactor]} 
                  onValueChange={(value) => setDesignHeightFactor(value[0])} 
                />
              </div>
            </div>
            
            {/* Position offset controls */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center">
                    <MoveHorizontal className="h-3 w-3 mr-1" /> X Offset: {
                      syncAll 
                        ? shirtConfigs[0].designOffset.x 
                        : shirtConfigs[selectedShirt].designOffset.x
                    }px
                  </label>
                </div>
                <Slider 
                  min={-200} 
                  max={200} 
                  step={5} 
                  value={[
                    syncAll 
                      ? shirtConfigs[0].designOffset.x 
                      : shirtConfigs[selectedShirt].designOffset.x
                  ]} 
                  onValueChange={(value) => handleXOffsetChange(value[0])} 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center">
                    <MoveVertical className="h-3 w-3 mr-1" /> Y Offset: {
                      syncAll 
                        ? shirtConfigs[0].designOffset.y 
                        : shirtConfigs[selectedShirt].designOffset.y
                    }px
                  </label>
                </div>
                <Slider 
                  min={-300} 
                  max={300} 
                  step={5} 
                  value={[
                    syncAll 
                      ? shirtConfigs[0].designOffset.y 
                      : shirtConfigs[selectedShirt].designOffset.y
                  ]} 
                  onValueChange={(value) => handleYOffsetChange(value[0])} 
                />
              </div>
            </div>
            
            {/* Global Y Offset */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium flex items-center">
                  <MoveVertical className="h-3 w-3 mr-1" /> Global Y Adjustment: {globalYOffset}px
                </label>
              </div>
              <Slider 
                min={-300} 
                max={100} 
                step={5} 
                defaultValue={[-200]}
                value={[globalYOffset]} 
                onValueChange={(value) => setGlobalYOffset(value[0])} 
              />
            </div>
            
            {!syncAll && (
              <div className="flex space-x-2 flex-wrap">
                {shirtConfigs.map((shirt, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={selectedShirt === index ? "default" : "outline"}
                    onClick={() => setSelectedShirt(index)}
                  >
                    {shirt.name} #{index + 1}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
        
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
              onClick={handleCanvasClick}
            />
          </div>
        </div>
        
        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">JPEG Quality: {jpegQuality}%</span>
              <div className="text-xs text-gray-500">
                {jpegQuality > 80 ? "Higher Quality / Larger File" : 
                 jpegQuality > 60 ? "Balanced Quality" : "Smaller File Size"}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Est. Size: ~{Math.round(jpegQuality * 0.15)}MB
            </div>
          </div>
          
          <div className="w-full max-w-full">
            <Slider 
              min={40} 
              max={95} 
              step={5} 
              value={[jpegQuality]} 
              onValueChange={(value) => setJpegQuality(value[0])}
              disabled={!designImg}
            />
          </div>
          
          <div className="flex justify-end">
            <Button 
              size="sm"
              onClick={handleDownload}
              disabled={!designImg}
            >
              <Download className="mr-2 h-4 w-4" />
              Download JPEG Mockup
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}