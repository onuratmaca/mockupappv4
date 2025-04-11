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
import { Upload } from "lucide-react";

interface SavedProjectsModalProps {
  projects: Project[];
  onClose: () => void;
  onLoadProject: (project: Project) => void;
  onSaveProject: () => void;
}

export default function SavedProjectsModal({
  projects,
  onClose,
  onLoadProject,
  onSaveProject
}: SavedProjectsModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Saved Projects</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto py-4 flex-grow">
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
        </div>
        
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
