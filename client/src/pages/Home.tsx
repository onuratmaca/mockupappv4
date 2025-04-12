import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DesignUploader from "@/components/DesignUploader";
import MockupSelector from "@/components/MockupSelector";
import DesignControls from "@/components/DesignControls";
import MultiShirtCanvas, { PlacementSettings } from "@/components/MultiShirtCanvas";
import SavedProjectsModal from "@/components/SavedProjectsModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { toast } = useToast();
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [selectedMockupId, setSelectedMockupId] = useState(1);
  const [designSize, setDesignSize] = useState(100); // Start at 100% (will be scaled based on file type)
  const [showSavedProjects, setShowSavedProjects] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [placementSettings, setPlacementSettings] = useState<PlacementSettings | undefined>(undefined);
  
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

  // Handle save placement settings
  const handleSavePlacementSettings = (settings: PlacementSettings) => {
    setPlacementSettings(settings);
    
    // If we have a current project, update it with the placement settings
    if (currentProjectId) {
      updateMutation.mutate({
        id: currentProjectId,
        name: `Project ${new Date().toLocaleString()}`,
        lastEdited: new Date().toISOString(),
        designImage: designImage || '',
        selectedMockupId,
        shirtPosition: 0,
        designSize,
        designPosition: 'center',
        designXOffset: 0,
        designYOffset: 0,
        designRatio: 'square',
        thumbnail: designImage || '',
        // Add the new placement settings
        placementSettings: settings.placementSettings,
        designWidthFactor: settings.designWidthFactor,
        designHeightFactor: settings.designHeightFactor,
        globalYOffset: settings.globalYOffset
      });
    }
  };

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
      // Include placement settings if available
      placementSettings: placementSettings?.placementSettings || '{}',
      designWidthFactor: placementSettings?.designWidthFactor || 450,
      designHeightFactor: placementSettings?.designHeightFactor || 300,
      globalYOffset: placementSettings?.globalYOffset || 0
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
    
    // Load placement settings if available
    if (project.placementSettings) {
      try {
        setPlacementSettings({
          placementSettings: project.placementSettings || '{}',
          designWidthFactor: project.designWidthFactor || 450,
          designHeightFactor: project.designHeightFactor || 300,
          globalYOffset: project.globalYOffset || 0
        });
      } catch (error) {
        console.error("Failed to parse placement settings:", error);
      }
    }

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
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden" style={{ maxHeight: '100vh' }}>
      <Header 
        onSaveProject={() => setShowSavedProjects(true)}
        onDownloadMockup={handleDownloadMockup}
      />
      
      <main className="flex-grow flex flex-col" style={{ minHeight: 0 }}>
        <div className="flex h-10 items-center px-4 py-1 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <DesignUploader onDesignUpload={setDesignImage} />
            {designImage && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Size:</span>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="5"
                  value={designSize}
                  onChange={(e) => setDesignSize(parseInt(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs font-medium">{designSize}%</span>
              </div>
            )}
          </div>
          
          <div className="h-6 border-l border-gray-200 mx-2"></div>
          
          <MockupSelector
            selectedMockupId={selectedMockupId}
            onMockupSelect={setSelectedMockupId}
          />
          
          {designImage && (
            <>
              <div className="h-6 border-l border-gray-200 mx-2"></div>
              <Button 
                onClick={handleResetDesign}
                variant="outline" 
                size="sm"
                className="text-xs h-7"
              >
                Reset Size
              </Button>
            </>
          )}
        </div>
        
        {/* Main content - canvas takes most of the screen */}
        <div className="flex-grow" style={{ height: 'calc(100% - 10px)' }}>
          <MultiShirtCanvas
            designImage={designImage}
            mockupId={selectedMockupId}
            designSize={designSize}
            designPosition={designPosition}
            onDownload={handleDownloadMockup}
            onSaveSettings={handleSavePlacementSettings}
            initialSettings={placementSettings || undefined}
          />
        </div>
      </main>
      
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
