import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DesignUploader from "@/components/DesignUploader";
import MockupSelector from "@/components/MockupSelector";
import DesignControls from "@/components/DesignControls";
import MultiShirtCanvas from "@/components/MultiShirtCanvas";
import SavedProjectsModal from "@/components/SavedProjectsModal";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { toast } = useToast();
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [selectedMockupId, setSelectedMockupId] = useState(1);
  const [designSize, setDesignSize] = useState(100); // Start at 100% size
  const [showSavedProjects, setShowSavedProjects] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  
  // Fixed position for all designs
  const designPosition = "center";

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
      shirtPosition: 0,
      designSize,
      designPosition: 'center',
      designXOffset: 0,
      designYOffset: 0,
      designRatio: 'square',
      thumbnail: designImage,
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
  };

  // Handle load project
  const handleLoadProject = (project: Project) => {
    setDesignImage(project.designImage);
    setSelectedMockupId(project.selectedMockupId || 1);
    setDesignSize(project.designSize || 100); // Default to 100% if not set
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
    setDesignSize(100); // Reset to default 100% size
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header 
        onSaveProject={() => setShowSavedProjects(true)}
        onDownloadMockup={handleDownloadMockup}
      />
      
      <main className="flex-grow">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/5 lg:min-w-[260px]">
              <div className="bg-white rounded-lg shadow-md p-4 space-y-4 sticky top-0">
                <DesignUploader
                  onDesignUpload={setDesignImage}
                />
                
                <MockupSelector
                  selectedMockupId={selectedMockupId}
                  onMockupSelect={setSelectedMockupId}
                />
                
                <DesignControls
                  designSize={designSize}
                  onDesignSizeChange={setDesignSize}
                  onResetDesign={handleResetDesign}
                />
              </div>
            </div>
            
            <div className="flex-1 mt-4 lg:mt-0 lg:ml-4">
              <MultiShirtCanvas
                designImage={designImage}
                mockupId={selectedMockupId}
                designSize={designSize}
                designPosition={designPosition}
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
