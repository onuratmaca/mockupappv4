import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Define the mockup images
export const MOCKUP_IMAGES = [
  { id: 1, name: "Mockup 1", src: "/attached_assets/1.jpg" },
  { id: 2, name: "Mockup 2", src: "/attached_assets/2.jpg" },
  { id: 3, name: "Mockup 3", src: "/attached_assets/3.jpg" },
  { id: 4, name: "Mockup 4", src: "/attached_assets/4.jpg" },
  { id: 5, name: "Mockup 5", src: "/attached_assets/5.jpg" }
];

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
          <h3 className="text-lg font-medium">Mockup Template</h3>
          
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
                      "h-24 justify-start px-2 py-1 transition-all",
                      mockup.id === selectedMockupId ? "border-2 border-primary" : "border border-input"
                    )}
                    onClick={() => onMockupSelect(mockup.id)}
                  >
                    <div className="flex items-center w-full">
                      <div className="w-16 h-16 mr-2 overflow-hidden rounded">
                        <img 
                          src={mockup.src} 
                          alt={mockup.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col items-start text-left">
                        <span className="font-medium">{mockup.name}</span>
                        <span className="text-xs text-muted-foreground">8 colors</span>
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