import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";
import type { DawProjectData } from "@/types/daw";

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: DawProjectData;
  onSave: (updatedData: Partial<DawProjectData>) => void;
}

export default function ProjectSettingsModal({
  isOpen,
  onClose,
  projectData,
  onSave,
}: ProjectSettingsModalProps) {
  const [bpm, setBpm] = useState(projectData.bpm);
  const [keySignature, setKeySignature] = useState(projectData.keySignature);
  const [timeSignature, setTimeSignature] = useState(projectData.timeSignature || '4/4');

  const handleSave = () => {
    onSave({
      bpm,
      keySignature,
      timeSignature,
    });
    onClose();
  };

  const keys = [
    'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
  ];
  
  const modes = ['Major', 'Minor', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Project Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* BPM */}
          <div className="space-y-2">
            <Label>Tempo (BPM)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[bpm]}
                onValueChange={([value]) => setBpm(value)}
                min={60}
                max={200}
                step={1}
                className="flex-1"
              />
              <div className="w-16">
                <Input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  min={60}
                  max={200}
                />
              </div>
            </div>
          </div>

          {/* Key Signature */}
          <div className="space-y-2">
            <Label>Key Signature</Label>
            <Select value={keySignature} onValueChange={setKeySignature}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {keys.flatMap(key => 
                  modes.map(mode => (
                    <SelectItem key={`${key}${mode}`} value={`${key}${mode === 'Minor' ? 'm' : ''}`}>
                      {key} {mode}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Time Signature */}
          <div className="space-y-2">
            <Label>Time Signature</Label>
            <Select value={timeSignature} onValueChange={setTimeSignature}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4/4">4/4</SelectItem>
                <SelectItem value="3/4">3/4</SelectItem>
                <SelectItem value="2/4">2/4</SelectItem>
                <SelectItem value="6/8">6/8</SelectItem>
                <SelectItem value="12/8">12/8</SelectItem>
                <SelectItem value="5/4">5/4</SelectItem>
                <SelectItem value="7/8">7/8</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}