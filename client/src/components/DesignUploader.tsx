import { useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DesignRatio, DESIGN_RATIOS } from "@/lib/design-ratios";

interface DesignUploaderProps {
  onDesignUpload: (imageDataUrl: string) => void;
  designRatio: DesignRatio;
  onDesignRatioChange: (ratio: DesignRatio) => void;
}

export default function DesignUploader({ 
  onDesignUpload, 
  designRatio,
  onDesignRatioChange
}: DesignUploaderProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (file: File) => {
    // Validate file type
    if (!file.type.match('image.*')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Load image to get dimensions
        const img = new Image();
        img.onload = () => {
          // Create a canvas to normalize the image size
          const canvas = document.createElement('canvas');
          
          // Set standard dimensions based on ratio
          const ratio = DESIGN_RATIOS[designRatio].value;
          let targetWidth, targetHeight;
          
          // Standardize dimensions based on ratio (maintain aspect but with standard size)
          if (ratio >= 1) { // landscape or square
            targetWidth = 800; // standard width for all designs
            targetHeight = 800 / ratio;
          } else { // portrait
            targetHeight = 800; // standard height for all designs
            targetWidth = 800 * ratio;
          }
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // Draw and resize the image
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            
                    // For SVG files, we may want to preserve the original to maintain quality
            // but for non-SVG files, we normalize to PNG
            if (file.type === 'image/svg+xml') {
              // For SVGs, pass the original file to preserve vector quality
              onDesignUpload(result);
              
              toast({
                title: "SVG Uploaded",
                description: `Vector design uploaded at original quality`,
              });
            } else {
              // For other formats, convert to PNG and normalize dimensions
              const normalizedImageUrl = canvas.toDataURL('image/png');
              onDesignUpload(normalizedImageUrl);
              
              toast({
                title: "Success",
                description: `Design normalized to ${Math.round(targetWidth)}×${Math.round(targetHeight)} pixels`,
              });
            }
          } else {
            // Fallback if canvas context fails
            onDesignUpload(result);
            toast({
              title: "Success",
              description: "Design uploaded successfully",
            });
          }
        };
        
        // Load the image from the file reader result
        img.src = result;
      }
    };
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read the uploaded file",
        variant: "destructive"
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-medium">Upload Design</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div 
          className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadCloud className="w-12 h-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">Drag & drop or browse</p>
          <input 
            type="file" 
            id="designUpload" 
            className="sr-only" 
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          <Button 
            onClick={() => document.getElementById('designUpload')?.click()}
            className="mt-4"
          >
            Browse Files
          </Button>
        </div>
        
        {/* Design Ratio Selection */}
        <div className="mt-4">
          <Label htmlFor="designRatio" className="text-sm font-medium text-gray-700">
            Design Ratio
          </Label>
          <Select 
            value={designRatio} 
            onValueChange={(value) => onDesignRatioChange(value as DesignRatio)}
          >
            <SelectTrigger id="designRatio" className="w-full mt-1">
              <SelectValue placeholder="Select ratio" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DESIGN_RATIOS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
