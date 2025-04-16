import React, { useRef, useEffect, useState, MouseEvent } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Download, ZoomIn, ZoomOut, Eye, EyeOff, MoveHorizontal, MoveVertical, Crosshair, RotateCcw, Save, Zap } from "lucide-react";
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
  editModeEnabled?: boolean; // New prop to control edit mode from parent
  onDownload: () => void;
  onSaveSettings?: (settings: PlacementSettings) => void;
  initialSettings?: PlacementSettings;
  onAutoButtonRef?: (fn: () => void) => void;
  onEditButtonRef?: (fn: () => void) => void;
  onGuidesButtonRef?: (fn: () => void) => void;
  onZoomInRef?: (fn: () => void) => void;
  onZoomOutRef?: (fn: () => void) => void;
  // JPEG quality settings
  jpegQuality?: number;
  onJpegQualityChange?: (quality: number) => void;
  onGetLastFileSize?: (size: number | null) => void;
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
  editModeEnabled = false, // Default to not showing edit panel
  onDownload,
  onSaveSettings,
  initialSettings,
  onAutoButtonRef,
  onEditButtonRef,
  onGuidesButtonRef,
  onZoomInRef,
  onZoomOutRef,
  jpegQuality: externalJpegQuality,
  onJpegQualityChange,
  onGetLastFileSize
}: MultiShirtCanvasProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mockupImg, setMockupImg] = useState<HTMLImageElement | null>(null);
  const [designImg, setDesignImg] = useState<HTMLImageElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100); // Full size view
  const [canvasSize] = useState({ width: 4000, height: 3000 });
  const [showDebugAreas, setShowDebugAreas] = useState(true); 

  // Preset configurations for different aspect ratios
  interface DesignPreset {
    name: string;
    description: string;
    widthFactor: number;
    heightFactor: number;
    forRatio: string;
  }

  const DESIGN_PRESETS: DesignPreset[] = [
    {
      name: "Wide Banner",
      description: "For wide horizontal designs (ratio > 2:1)",
      widthFactor: 600,
      heightFactor: 200,
      forRatio: "> 2:1"
    },
    {
      name: "Landscape",
      description: "For landscape designs (ratio 4:3, 16:9)",
      widthFactor: 500,
      heightFactor: 300,
      forRatio: "4:3 to 16:9"
    },
    {
      name: "Square",
      description: "For square designs (ratio 1:1)",
      widthFactor: 400,
      heightFactor: 400,
      forRatio: "~1:1"
    },
    {
      name: "Portrait",
      description: "For portrait designs (ratio 3:4, 9:16)",
      widthFactor: 300,
      heightFactor: 450,
      forRatio: "3:4 to 9:16"
    },
    {
      name: "Tall",
      description: "For tall vertical designs (ratio < 1:2)",
      widthFactor: 250,
      heightFactor: 550,
      forRatio: "< 1:2"
    }
  ];

  // Design placement adjustment controls
  const [shirtConfigs, setShirtConfigs] = useState<ShirtConfig[]>(INITIAL_SHIRT_POSITIONS);
  const [selectedShirt, setSelectedShirt] = useState<number>(0);
  const [globalYOffset, setGlobalYOffset] = useState(-200);  // Default offset based on optimal positioning
  const [globalXOffset, setGlobalXOffset] = useState(0);  // Default X offset at center
  const [editMode, setEditMode] = useState<'none' | 'all' | 'individual'>('none');
  const [designWidthFactor, setDesignWidthFactor] = useState(450); // Default design width for avg design
  const [designHeightFactor, setDesignHeightFactor] = useState(300); // Default design height
  const [syncAll, setSyncAll] = useState(true); // Sync all shirts by default
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null); // Track selected preset

  // Expose functions to parent component through refs
  useEffect(() => {
    // Create a stable reference to autoPosition that won't change on rerenders
    const stableAutoPosition = autoPosition;

    if (onAutoButtonRef) onAutoButtonRef(() => {
      console.log("Auto position callback called from parent");
      stableAutoPosition();
    });

    if (onEditButtonRef) onEditButtonRef(toggleEditMode);
    if (onGuidesButtonRef) onGuidesButtonRef(toggleDebugAreas);
    if (onZoomInRef) onZoomInRef(handleZoomIn);
    if (onZoomOutRef) onZoomOutRef(handleZoomOut);
  }, []);

  // We'll handle downloads directly through the hidden button now

  // Sync edit mode with parent component
  useEffect(() => {
    setEditMode(editModeEnabled ? 'all' : 'none');
  }, [editModeEnabled]);

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
    setSelectedPreset(null);
  };

  // Apply a preset based on index
  const applyPreset = (presetIndex: number) => {
    if (presetIndex >= 0 && presetIndex < DESIGN_PRESETS.length) {
      const preset = DESIGN_PRESETS[presetIndex];
      setDesignWidthFactor(preset.widthFactor);
      setDesignHeightFactor(preset.heightFactor);
      setSelectedPreset(presetIndex);

      toast({
        title: "Preset Applied",
        description: `Applied "${preset.name}" preset for ${preset.forRatio} ratio designs`,
      });
    }
  };

  // Auto-position based on the design's dimensions
  const autoPosition = () => {
    console.log("AutoPosition function called directly");
    if (!designImg) {
      toast({
        title: "No Design",
        description: "Please upload a design first to use auto-positioning",
        variant: "destructive"
      });
      return;
    }

    // Reset positions first for consistency
    setShirtConfigs(INITIAL_SHIRT_POSITIONS);

    // Calculate the aspect ratio
    const aspectRatio = designImg.width / designImg.height;

    /**
     * IMPORTANT INSIGHT:
     * When using presets, we need to account for the additional multipliers that get applied in drawDesignsOnShirts():
     * - For portrait (aspectRatio < 0.7): width gets multiplied by 0.6 and height by 1.5
     * - For square (0.7 <= aspectRatio <= 1.3): width gets multiplied by 0.8 and height by 1.2 
     * 
     * So we need to counteract these multipliers by adjusting our preset values.
     */

    // Check if the design is an SVG by looking at its source
    const isSvgImage = designImage?.toLowerCase().includes('.svg') || 
                      designImage?.toLowerCase().startsWith('data:image/svg+xml');

    // Default position on shirt
    let yOffset = -200; 

    // Choose preset and adjust for the right appearance
    if (aspectRatio > 2.0) {
      // Very wide - use wide banner preset
      setSelectedPreset(0);
      setDesignWidthFactor(DESIGN_PRESETS[0].widthFactor);
      setDesignHeightFactor(DESIGN_PRESETS[0].heightFactor);
      yOffset = -150; // Wide designs a bit lower
    } 
    else if (aspectRatio > 1.3) {
      // Standard landscape designs
      setSelectedPreset(1);
      setDesignWidthFactor(DESIGN_PRESETS[1].widthFactor);
      setDesignHeightFactor(DESIGN_PRESETS[1].heightFactor);
      yOffset = -180;
    }
    else if (aspectRatio >= 0.7 && aspectRatio <= 1.3) {
      // Square designs
      setSelectedPreset(2);
      setDesignWidthFactor(DESIGN_PRESETS[2].widthFactor);
      setDesignHeightFactor(DESIGN_PRESETS[2].heightFactor);
      yOffset = -200;
    }
    else if (aspectRatio >= 0.4 && aspectRatio < 0.7) {
      // Portrait designs need larger size to counteract the 0.6 width multiplier
      // Use square preset but with adjusted values
      setSelectedPreset(2); // Still use square preset...

      // The drawDesignsOnShirts function will multiply width by 0.6 and height by 1.5
      // So we need to counter that by dividing width by 0.6 (multiplying by 1.67)
      // and dividing height by 1.5 (multiplying by 0.67)
      const adjustedWidth = Math.round(DESIGN_PRESETS[2].widthFactor * 1.67);
      const adjustedHeight = Math.round(DESIGN_PRESETS[2].heightFactor * 0.67);

      setDesignWidthFactor(adjustedWidth);
      setDesignHeightFactor(adjustedHeight);

      // Position portrait designs a bit lower than square designs
      yOffset = -180; // Only 20px higher than square
    }
    else {
      // Very tall designs (aspectRatio < 0.4) need even more width adjustment
      setSelectedPreset(2); // Still use square preset...

      // The drawDesignsOnShirts function will multiply width by 0.6 and height by 1.5
      // For very tall designs, we need to counter even more
      const adjustedWidth = Math.round(DESIGN_PRESETS[2].widthFactor * 1.9); // Even more width
      const adjustedHeight = Math.round(DESIGN_PRESETS[2].heightFactor * 0.67);

      setDesignWidthFactor(adjustedWidth);
      setDesignHeightFactor(adjustedHeight);

      // Position tall designs at similar position to portrait
      yOffset = -180;
    }

    // If it's an SVG, adjust the position to compensate for the larger scaling factor
    // SVGs are scaled by 1.5x in the rendering process, so need to position higher
    if (isSvgImage) {
      yOffset -= 70; // SVGs should be positioned 70px higher to maintain consistent position
    }

    // Apply calculated Y offset
    setGlobalYOffset(yOffset);

    // Force All Shirts mode but don't change edit mode
    // (let the parent component control this)
    setSyncAll(true);

    // Prepare appropriate description for toast - make it clearer what's happening
    let description;
    if (aspectRatio < 0.7) {
      const designType = (aspectRatio < 0.4) ? "tall" : "portrait";
      const size = `${designWidthFactor}×${designHeightFactor}`;
      description = `${designType.toUpperCase()} design optimized with size ${size} at Y=${yOffset}px`;
    } else {
      const presetName = DESIGN_PRESETS[getSelectedPresetIndex(aspectRatio)].name;
      description = `Applied "${presetName}" preset at Y=${yOffset}px`;
    }

    toast({
      title: "Auto-Positioned",
      description
    });
  };

  // Helper to get preset index based on aspect ratio
  const getSelectedPresetIndex = (aspectRatio: number): number => {
    if (aspectRatio > 2.0) return 0; // Wide banner
    if (aspectRatio > 1.3) return 1; // Landscape
    if (aspectRatio >= 0.7) return 2; // Square
    if (aspectRatio >= 0.4) return 3; // Portrait
    return 4; // Tall
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
    globalXOffset,
    designWidthFactor,
    designHeightFactor
  ]);

  // Draw designs on shirts based on configs
  const drawDesignsOnShirts = (ctx: CanvasRenderingContext2D) => {
    if (!designImg) return;

    // Get design's aspect ratio
    const aspectRatio = designImg.width / designImg.height;

    // Check if the design is an SVG by looking at its source or other characteristics
    // SVG images typically have perfect 1:1 pixel ratio regardless of content
    const isSvgImage = designImage?.toLowerCase().includes('.svg') || 
                      designImage?.toLowerCase().startsWith('data:image/svg+xml');

    // SVG scaling factor - we'll make SVGs larger by default
    const svgScaleFactor = isSvgImage ? 1.5 : 1.0;

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

      // Apply SVG scaling factor if detected
      if (isSvgImage) {
        areaWidth = areaWidth * svgScaleFactor;
        areaHeight = areaHeight * svgScaleFactor;
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
      const designX = shirt.x + shirt.designOffset.x + globalXOffset;
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

    // Check if the design is an SVG by looking at its source (maintain consistency)
    const isSvgImage = designImage?.toLowerCase().includes('.svg') || 
                      designImage?.toLowerCase().startsWith('data:image/svg+xml');

    // SVG scaling factor - consistent with other functions
    const svgScaleFactor = isSvgImage ? 1.5 : 1.0;

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

      // Apply SVG scaling if detected
      if (isSvgImage) {
        areaWidth = areaWidth * svgScaleFactor;
        areaHeight = areaHeight * svgScaleFactor;
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
      const designX = shirt.x + shirt.designOffset.x + globalXOffset;
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

      // Add position label near the crosshair
      ctx.font = '24px Arial';
      ctx.fillStyle = isSelected ? 'rgba(255, 165, 0, 0.8)' : 'rgba(0, 128, 255, 0.5)';
      ctx.fillText(`${shirt.name}`, designX + 25, designY);

      // Show position coordinates for selected shirt
      if (isSelected) {
        ctx.font = '18px Arial';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillText(`x: ${shirt.designOffset.x + globalXOffset}, y: ${shirt.designOffset.y + globalYOffset}`, designX + 25, designY + 25);
      }
    });
  };

  // Toggle debug overlay
  const toggleDebugAreas = () => {
    setShowDebugAreas(prev => !prev);
  };

  // Toggle edit mode (simplified to just on/off for better parent component integration)
  // We're now being controlled by the parent, so this just serves as an API for the parent
  const toggleEditMode = () => {
    // This no longer updates internal state directly, parent will handle it
    // Parent component is listening via the callback reference
  };

  // Toggle sync all shirts
  const toggleSyncMode = () => {
    setSyncAll(prev => !prev);
  };

  // JPEG quality setting for download
  const [jpegQuality, setJpegQuality] = useState<number>(externalJpegQuality || 85); // Use external value if provided
  const [lastFileSize, setLastFileSize] = useState<number | null>(null); // To store actual file size

  // Update internal quality if external prop changes
  useEffect(() => {
    if (externalJpegQuality && externalJpegQuality !== jpegQuality) {
      setJpegQuality(externalJpegQuality);
    }
  }, [externalJpegQuality]);

  // Expose jpeg quality and file size to parent
  useEffect(() => {
    // Pass quality changes back to parent
    if (onJpegQualityChange && jpegQuality !== externalJpegQuality) {
      onJpegQualityChange(jpegQuality);
    }

    // Pass file size back to parent
    if (onGetLastFileSize && lastFileSize !== null) {
      onGetLastFileSize(lastFileSize);
    }

    // Calculate estimated file size when jpegQuality changes
    if (designImg && mockupImg) {
      calculateFileSize();
    }
  }, [jpegQuality, lastFileSize, designImg, mockupImg, onJpegQualityChange, onGetLastFileSize]);

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

        // Check if the design is an SVG by looking at its source
        const isSvgImage = designImage?.toLowerCase().includes('.svg') || 
                          designImage?.toLowerCase().startsWith('data:image/svg+xml');

        // SVG scaling factor - we'll make SVGs larger by default
        const svgScaleFactor = isSvgImage ? 1.5 : 1.0;

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

          // Apply SVG scaling factor if detected
          if (isSvgImage) {
            areaWidth = areaWidth * svgScaleFactor;
            areaHeight = areaHeight * svgScaleFactor;
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
          const designX = shirt.x + shirt.designOffset.x + globalXOffset;
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

      // Calculate file size
      const binaryString = atob(dataURL.split(',')[1]);
      const fileSizeBytes = binaryString.length;
      const fileSizeMB = fileSizeBytes / (1024 * 1024);
      setLastFileSize(fileSizeMB);

      // Create download link
      const link = document.createElement('a');
link.download = `tshirt-mockup-${mockupId}.jpg`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `Downloaded JPEG (${fileSizeMB.toFixed(2)}MB at ${jpegQuality}% quality)`,
      });

      onDownload();
    }
  };

  // Generate a sample file to get an exact size estimate without downloading
  const calculateFileSize = () => {
    if (!canvasRef.current || !designImg || !mockupImg) {
      return; // Can't calculate without images
    }

    // Create a temporary canvas for size calculation
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

        // Check if the design is an SVG by looking at its source
        const isSvgImage = designImage?.toLowerCase().includes('.svg') || 
                          designImage?.toLowerCase().startsWith('data:image/svg+xml');

        // SVG scaling factor - consistent with drawing function
        const svgScaleFactor = isSvgImage ? 1.5 : 1.0;

        // Just draw a single shirt to save processing time
        const shirt = shirtConfigs[0];

        // Use the same calculation logic as the draw function
        let areaWidth = designWidthFactor;
        let areaHeight = designHeightFactor;

        // Apply SVG scaling if detected
        if (isSvgImage) {
          areaWidth = areaWidth * svgScaleFactor;
          areaHeight = areaHeight * svgScaleFactor;
        }

        // Apply user's size preference 
        areaWidth = areaWidth * (designSize / 100);
        areaHeight = areaHeight * (designSize / 100);

        // Calculate final design dimensions preserving aspect ratio
        let designWidth, designHeight;

        if (aspectRatio > areaWidth / areaHeight) {
          designWidth = areaWidth;
          designHeight = designWidth / aspectRatio;
        } else {
          designHeight = areaHeight;
          designWidth = designHeight * aspectRatio;
        }

        // Draw the design with offsets
        const designX = shirt.x + shirt.designOffset.x + globalXOffset;
        const designY = shirt.y + shirt.designOffset.y + globalYOffset;

        downloadCtx.drawImage(
          designImg,
          designX - (designWidth / 2),
          designY,
          designWidth,
          designHeight
        );
      }

      // Generate the data URL at the current quality
      const dataURL = downloadCanvas.toDataURL('image/jpeg', jpegQuality / 100);

      // Calculate file size
      const binaryString = atob(dataURL.split(',')[1]);
      const fileSizeBytes = binaryString.length;
      const fileSizeMB = fileSizeBytes / (1024 * 1024);

      // Update the last file size
      setLastFileSize(fileSizeMB);

      toast({
        description: `JPEG file size at ${jpegQuality}% quality: ${fileSizeMB.toFixed(2)}MB`,
      });
    }
  };

  // Generate position data for developer
  const generatePositionData = () => {
    const data = {
      designWidthFactor,
      designHeightFactor,
      globalYOffset,
      positions: shirtConfigs.map(s => ({
        name: s.name,
        x: s.x + s.designOffset.x + globalXOffset, 
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

  // Handle zoom level changes
  const handleZoomIn = () => {
    setZoomLevel(Math.min(200, zoomLevel + 10));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(50, zoomLevel - 10));
  };

  return (
    <div className="h-full flex flex-col" id="canvas-container">
      {/* Hidden buttons that can be triggered programmatically */}
      <button 
        id="download-btn" 
        onClick={handleDownload} 
        style={{ display: 'none' }}
      >
        Download
      </button>
      <button 
        id="auto-btn" 
        onClick={autoPosition} 
        style={{ display: 'none' }}
      >
        Auto
      </button>

      <div className="flex-grow h-full overflow-hidden">
        {editMode !== 'none' && (
          <div className="absolute top-8 left-0 right-0 z-10 bg-white/90 p-1 shadow-md border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant={syncAll ? "default" : "outline"}
                    className="h-6 text-xs px-2"
                    onClick={toggleSyncMode}
                  >
                    {syncAll ? "All" : "Individual"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-6 text-xs px-2"
                    onClick={resetPositions}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Reset
                  </Button>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={autoPosition}
                    disabled={!designImg}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Auto
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-6 text-xs px-2"
                    onClick={saveSettings}
                  >
                    <Save className="h-3 w-3 mr-1" /> Save
                  </Button>
                </div>
              </div>
            </div>

            {/* Basic Controls - Always visible in edit mode */}
            <div className="pt-1 flex flex-wrap gap-2 items-center justify-between border-t border-gray-200 mt-1">
              {/* Even more compact controls */}
              <div className="grid grid-cols-4 gap-2 w-full">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 min-w-[60px]">X: {globalXOffset}</span>
                  <Slider 
                    min={-800} 
                    max={800} 
                    step={2}
                    value={[globalXOffset]} 
                    onValueChange={(value) => setGlobalXOffset(value[0])}
                    className="w-20"
                  />
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-4 w-4 p-0" 
                      onClick={() => setGlobalXOffset(Math.max(-800, globalXOffset - 10))}
                    >
                      <span className="text-[10px]">-</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-4 w-4 p-0" 
                      onClick={() => setGlobalXOffset(Math.min(800, globalXOffset + 10))}
                    >
                      <span className="text-[10px]">+</span>
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 min-w-[60px]">W: {designWidthFactor}</span>
                  <Slider 
                    min={100} 
                    max={1200} 
                    step={10} 
                    value={[designWidthFactor]} 
                    onValueChange={(value) => {
                      setDesignWidthFactor(value[0]);
                      setSelectedPreset(null);
                    }}
                    className="w-20" 
                  />
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-4 w-4 p-0" 
                      onClick={() => {
                        setDesignWidthFactor(Math.max(100, designWidthFactor - 50));
                        setSelectedPreset(null);
                      }}
                    >
                      <span className="text-[10px]">-</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-4 w-4 p-0" 
                      onClick={() => {
                        setDesignWidthFactor(Math.min(800, designWidthFactor + 50));
                        setSelectedPreset(null);
                      }}
                    >
                      <span className="text-[10px]">+</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 min-w-[60px]">H: {designHeightFactor}</span>
                  <Slider 
                    min={100} 
                    max={1000} 
                    step={10} 
                    value={[designHeightFactor]} 
                    onValueChange={(value) => {
                      setDesignHeightFactor(value[0]);
                      setSelectedPreset(null);
                    }}
                    className="w-20"
                  />
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-4 w-4 p-0" 
                      onClick={() => {
                        setDesignHeightFactor(Math.max(100, designHeightFactor - 50));
                        setSelectedPreset(null);
                      }}
                    >
                      <span className="text-[10px]">-</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-4 w-4 p-0" 
                      onClick={() => {
                        setDesignHeightFactor(Math.min(600, designHeightFactor + 50));
                        setSelectedPreset(null);
                      }}
                    >
                      <span className="text-[10px]">+</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 min-w-[60px]">Y: {globalYOffset}</span>
                  <Slider 
                    min={-800} 
                    max={400} 
                    step={2}
                    value={[globalYOffset]} 
                    onValueChange={(value) => setGlobalYOffset(value[0])}
                    className="w-20"
                  />
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-4 w-4 p-0" 
                      onClick={() => setGlobalYOffset(Math.max(-400, globalYOffset - 10))}
                    >
                      <span className="text-[10px]">-</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-4 w-4 p-0" 
                      onClick={() => setGlobalYOffset(Math.min(200, globalYOffset + 10))}
                    >
                      <span className="text-[10px]">+</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1 pt-1 border-t border-gray-200 w-full">
                <span className="text-[10px] text-gray-500">Presets:</span>
                <div className="flex gap-1 flex-wrap">
                  {DESIGN_PRESETS.map((preset, idx) => (
                    <Button
                      key={idx}
                      variant={selectedPreset === idx ? "default" : "outline"}
                      size="sm"
                      className="text-[10px] h-5 px-1"
                      onClick={() => applyPreset(idx)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative h-full">
          <div className="bg-gray-50 flex items-center justify-center h-full w-full">
            <div style={{ 
              transform: `scale(${zoomLevel / 100})`, 
              transformOrigin: 'center', 
              transition: 'transform 0.2s ease',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <canvas 
                ref={canvasRef} 
                width={canvasSize.width} 
                height={canvasSize.height}
                style={{ 
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '100vh',
                  objectFit: 'contain',
                  display: 'block' 
                }}
                onClick={handleCanvasClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}