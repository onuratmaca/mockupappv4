import { MOCKUP_IMAGES, getMockupById } from "@/lib/mockup-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MockupSelectorProps {
  selectedMockupId: number;
  onMockupSelect: (mockupId: number) => void;
}

export default function MockupSelector({ 
  selectedMockupId,
  onMockupSelect
}: MockupSelectorProps) {
  const selectedMockup = getMockupById(selectedMockupId);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Template:</span>
      <Select
        value={selectedMockupId.toString()}
        onValueChange={(value) => onMockupSelect(parseInt(value))}
      >
        <SelectTrigger className="h-8 min-w-[180px]">
          <SelectValue>
            {selectedMockup?.name || "Select a mockup"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MOCKUP_IMAGES.map((mockup) => (
            <SelectItem key={mockup.id} value={mockup.id.toString()}>
              <div className="flex items-center">
                <div className="w-6 h-6 mr-2 overflow-hidden rounded-sm">
                  <img 
                    src={mockup.src} 
                    alt={mockup.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <span>{mockup.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}