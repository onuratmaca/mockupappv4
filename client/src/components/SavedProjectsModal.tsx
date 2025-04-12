import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Project } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Download, Upload, ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface SavedProjectsModalProps {
  projects: Project[];
  onClose: () => void;
  onLoadProject: (project: Project) => void;
  onSaveProject: () => void;
  jpegQuality?: number;
  onJpegQualityChange?: (quality: number) => void;
  onDownload?: () => void;
  lastFileSize?: number | null;
}

export default function SavedProjectsModal({
  projects,
  onClose,
  onLoadProject,
  onSaveProject,
  jpegQuality = 85,
  onJpegQualityChange,
  onDownload,
  lastFileSize
}: SavedProjectsModalProps) {
  const { toast } = useToast();
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="export">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="projects">Saved Projects</TabsTrigger>
            <TabsTrigger value="export">Export Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects" className="overflow-y-auto py-2 flex-grow">
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No saved projects yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <div 
                    key={project.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onLoadProject(project)}
                  >
                    <div className="h-40 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {project.thumbnail ? (
                        <img 
                          src={project.thumbnail} 
                          alt={project.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400">No Preview</div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-medium">{project.name}</h4>
                      <p className="text-xs text-gray-500">
                        Last edited: {formatDistanceToNow(new Date(project.lastEdited), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="export" className="py-2">
            <div className="space-y-6">
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <h4 className="text-sm font-medium mb-3 flex items-center">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  JPEG Quality Settings
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm min-w-[80px]">Quality: </span>
                    <Slider
                      min={30}
                      max={100}
                      step={5}
                      value={[jpegQuality]}
                      onValueChange={(value) => onJpegQualityChange && onJpegQualityChange(value[0])}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium min-w-[40px]">{jpegQuality}%</span>
                  </div>
                  
                  {lastFileSize && (
                    <div className="text-sm text-gray-500">
                      Estimated file size: {lastFileSize.toFixed(2)} MB
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-1">
                    <p>Higher quality produces larger file sizes but better image quality.</p>
                    <p>Recommended: 85% for good balance between quality and file size.</p>
                  </div>
                  
                  <Button 
                    onClick={onDownload}
                    className="w-full"
                    disabled={!onDownload}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download with Current Settings
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="pt-4 border-t border-gray-200 px-0 mt-auto">
          <Button 
            variant="outline" 
            onClick={onSaveProject}
          >
            <Upload className="mr-2 h-4 w-4" />
            Save Current Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
