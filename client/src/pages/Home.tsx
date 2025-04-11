import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DesignUploader from "@/components/DesignUploader";
import MockupSelector from "@/components/MockupSelector";
import DesignControls from "@/components/DesignControls";
import ShirtPositionSelector from "@/components/ShirtPositionSelector";
import PreviewCanvas from "@/components/PreviewCanvas";
import SavedProjectsModal from "@/components/SavedProjectsModal";
import { useToast } from "@/hooks/use-toast";
import { DesignRatio } from "@/lib/design-ratios";
import { ShirtPosition } from "@/lib/mockup-data";
import { Project } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { toast } = useToast();
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [selectedMockupId, setSelectedMockupId] = useState(1); // Default to first mockup
  const [shirtPosition, setShirtPosition] = useState<ShirtPosition>(0); // Default to first shirt (top-left)
  const [designSize, setDesignSize] = useState(60);
  const [designPosition, setDesignPosition] = useState<"top" | "center" | "bottom">("center");
  const [designXOffset, setDesignXOffset] = useState(0);
  const [designYOffset, setDesignYOffset] = useState(0);
  const [designRatio, setDesignRatio] = useState<DesignRatio>("square");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showSavedProjects, setShowSavedProjects] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);

  // Query for saved projects
  const { data: savedProjects = [], refetch: refetchProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: true
  });

  // Save project mutation
  const saveMutation = useMutation({
    mutationFn: (projectData: Omit<Project, 'id'>) => {
      return apiRequest('POST', '/api/projects', projectData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project saved successfully!",
        variant: "default",
      });
      refetchProjects();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save project: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: (projectData: Project) => {
      return apiRequest('PUT', `/api/projects/${projectData.id}`, projectData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project updated successfully!",
        variant: "default",
      });
      refetchProjects();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update project: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle save project
  const handleSaveProject = () => {
    if (!designImage) {
      toast({
        title: "Error",
        description: "Please upload a design image before saving",
        variant: "destructive",
      });
      return;
    }

    const projectData = {
      name: `Project ${new Date().toLocaleString()}`,
      lastEdited: new Date().toISOString(),
      designImage,
      selectedMockupId,
      shirtPosition,
      designSize,
      designPosition,
      designXOffset,
      designYOffset,
      designRatio,
      thumbnail: designImage, // Use design as thumbnail for now
    };

    if (currentProjectId) {
      updateMutation.mutate({ ...projectData, id: currentProjectId });
    } else {
      saveMutation.mutate(projectData);
    }
  };

  // Handle download mockup
  const handleDownloadMockup = () => {
    if (!designImage) {
      toast({
        title: "Error",
        description: "Please upload a design image before downloading",
        variant: "destructive",
      });
      return;
    }
    
    // Will be implemented in PreviewCanvas component
  };

  // Handle load project
  const handleLoadProject = (project: Project) => {
    setDesignImage(project.designImage);
    setSelectedMockupId(project.selectedMockupId || 1);
    setShirtPosition((project.shirtPosition as ShirtPosition) || 0);
    setDesignSize(project.designSize);
    setDesignPosition(project.designPosition as "top" | "center" | "bottom");
    setDesignXOffset(project.designXOffset);
    setDesignYOffset(project.designYOffset);
    setDesignRatio(project.designRatio as DesignRatio);
    setCurrentProjectId(project.id);
    setShowSavedProjects(false);

    toast({
      title: "Success",
      description: "Project loaded successfully!",
      variant: "default",
    });
  };

  // Reset design to default values
  const handleResetDesign = () => {
    setDesignSize(60);
    setDesignPosition("center");
    setDesignXOffset(0);
    setDesignYOffset(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header 
        onSaveProject={() => setShowSavedProjects(true)}
        onDownloadMockup={handleDownloadMockup}
      />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                <DesignUploader
                  onDesignUpload={setDesignImage}
                  designRatio={designRatio}
                  onDesignRatioChange={setDesignRatio}
                />
                
                <MockupSelector
                  selectedMockupId={selectedMockupId}
                  onMockupSelect={setSelectedMockupId}
                />
                
                <ShirtPositionSelector
                  selectedPosition={shirtPosition}
                  onPositionSelect={setShirtPosition}
                />
                
                <DesignControls
                  designSize={designSize}
                  onDesignSizeChange={setDesignSize}
                  designPosition={designPosition}
                  onDesignPositionChange={setDesignPosition}
                  designXOffset={designXOffset}
                  onDesignXOffsetChange={setDesignXOffset}
                  designYOffset={designYOffset}
                  onDesignYOffsetChange={setDesignYOffset}
                  onResetDesign={handleResetDesign}
                />
              </div>
            </div>
            
            <div className="lg:col-span-9 mt-8 lg:mt-0">
              <PreviewCanvas
                designImage={designImage}
                mockupId={selectedMockupId}
                shirtPosition={shirtPosition}
                designSize={designSize}
                designPosition={designPosition}
                designXOffset={designXOffset}
                designYOffset={designYOffset}
                designRatio={designRatio}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                onPositionChange={(x, y) => {
                  setDesignXOffset(x);
                  setDesignYOffset(y);
                }}
                onDownload={handleDownloadMockup}
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {showSavedProjects && (
        <SavedProjectsModal
          projects={savedProjects}
          onClose={() => setShowSavedProjects(false)}
          onLoadProject={handleLoadProject}
          onSaveProject={handleSaveProject}
        />
      )}
    </div>
  );
}
