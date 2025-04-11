import { Button } from "@/components/ui/button";
import { Shirt } from "lucide-react";

interface HeaderProps {
  onSaveProject: () => void;
  onDownloadMockup: () => void;
}

export default function Header({ onSaveProject, onDownloadMockup }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Shirt className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-xl font-semibold text-primary">T-Shirt Designer</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={onSaveProject}
          >
            Save Project
          </Button>
          <Button 
            onClick={onDownloadMockup}
          >
            Download
          </Button>
        </div>
      </div>
    </header>
  );
}
