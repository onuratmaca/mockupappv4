import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOCKUP_IMAGES } from "@/lib/mockup-data";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MockupSelectorProps {
  selectedMockupId: number;
  onMockupSelect: (mockupId: number) => void;
}

export default function MockupSelector({ 
  selectedMockupId,
  onMockupSelect
}: MockupSelectorProps) {
  const [currentTab, setCurrentTab] = useState("all");

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Mockup Template</h3>

            {/* Quick Navigation Controls */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-md p-1 border border-gray-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const currentIndex = MOCKUP_IMAGES.findIndex(m => m.id === selectedMockupId);
                  if (currentIndex > 0) {
                    onMockupSelect(MOCKUP_IMAGES[currentIndex - 1].id);
                  }
                }}
                disabled={MOCKUP_IMAGES.findIndex(m => m.id === selectedMockupId) === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium">
                {MOCKUP_IMAGES.findIndex(m => m.id === selectedMockupId) + 1} / {MOCKUP_IMAGES.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const currentIndex = MOCKUP_IMAGES.findIndex(m => m.id === selectedMockupId);
                  if (currentIndex < MOCKUP_IMAGES.length - 1) {
                    onMockupSelect(MOCKUP_IMAGES[currentIndex + 1].id);
                  }
                }}
                disabled={MOCKUP_IMAGES.findIndex(m => m.id === selectedMockupId) === MOCKUP_IMAGES.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Selected Mockup Preview */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-2">
            <div className="flex items-center">
              <div className="w-20 h-20 mr-3 overflow-hidden rounded">
                <img 
                  src={MOCKUP_IMAGES.find(m => m.id === selectedMockupId)?.src} 
                  alt={MOCKUP_IMAGES.find(m => m.id === selectedMockupId)?.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-medium">{MOCKUP_IMAGES.find(m => m.id === selectedMockupId)?.name}</h4>
                <p className="text-xs text-gray-500">8 shirt colors per mockup</p>
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => {
                      const currentIndex = MOCKUP_IMAGES.findIndex(m => m.id === selectedMockupId);
                      if (currentIndex < MOCKUP_IMAGES.length - 1) {
                        onMockupSelect(MOCKUP_IMAGES[currentIndex + 1].id);
                      }
                    }}
                    disabled={MOCKUP_IMAGES.findIndex(m => m.id === selectedMockupId) === MOCKUP_IMAGES.length - 1}
                  >
                    Next Mockup <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="all">All Templates</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-2 gap-2">
                {MOCKUP_IMAGES.map((mockup) => (
                  <Button
                    key={mockup.id}
                    variant={mockup.id === selectedMockupId ? "default" : "outline"}
                    className={cn(
                      "h-20 justify-start px-2 py-1 transition-all",
                      mockup.id === selectedMockupId ? "border-2 border-primary" : "border border-input"
                    )}
                    onClick={() => onMockupSelect(mockup.id)}
                  >
                    <div className="flex items-center w-full">
                      <div className="w-12 h-12 mr-2 overflow-hidden rounded">
                        <img 
                          src={mockup.src} 
                          alt={mockup.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col items-start text-left">
                        <span className="font-medium text-sm">{mockup.name}</span>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="favorites" className="mt-4">
              <div className="p-4 text-center text-muted-foreground">
                No favorites selected yet
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}