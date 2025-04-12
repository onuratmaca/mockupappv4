import { MOCKUP_IMAGES, getMockupById } from "@/lib/mockup-data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MockupSelectorProps {
  selectedMockupId: number;
  onMockupSelect: (mockupId: number) => void;
}

export default function MockupSelector({ 
  selectedMockupId,
  onMockupSelect
}: MockupSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <TooltipProvider>
        {MOCKUP_IMAGES.map((mockup) => (
          <Tooltip key={mockup.id}>
            <TooltipTrigger asChild>
              <button 
                type="button"
                onClick={() => onMockupSelect(mockup.id)}
                className={`w-10 h-10 rounded-md border transition-all mb-2 ${
                  selectedMockupId === mockup.id 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img 
                  src={mockup.src} 
                  alt={mockup.name} 
                  className="w-full h-full object-cover rounded-sm"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">{mockup.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}