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
        onDesignUpload(result);
        toast({
          title: "Success",
          description: "Design uploaded successfully",
        });
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
