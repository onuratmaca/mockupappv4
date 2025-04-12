import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

interface DesignUploaderProps {
  onDesignUpload: (imageDataUrl: string) => void;
}

export default function DesignUploader({ 
  onDesignUpload
}: DesignUploaderProps) {
  const { toast } = useToast();

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
        // For all designs, just pass the original file data
        // No need to normalize or process - we'll handle sizing in the canvas
        onDesignUpload(result);
        
        if (file.type === 'image/svg+xml') {
          toast({
            title: "SVG Uploaded",
            description: "Vector image uploaded at original quality",
          });
        } else {
          toast({
            title: "Design Uploaded",
            description: "Design uploaded successfully",
          });
        }
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

  return (
    <>
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
        size="sm"
        className="flex items-center gap-1"
      >
        <UploadCloud className="w-4 h-4" />
        <span>Upload Design</span>
      </Button>
    </>
  );
}
