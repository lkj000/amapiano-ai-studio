import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useArrangementTemplates } from '@/hooks/useArrangementTemplates';
import { Zap, Music, Clock, Sparkles, Download, Upload, Save, Trash2 } from 'lucide-react';

interface ArrangementSection {
  name: string;
  duration: number; // bars
  elements: string[];
}

interface ArrangementTemplate {
  name: string;
  sections: ArrangementSection[];
  totalBars: number;
}

const AMAPIANO_TEMPLATES: ArrangementTemplate[] = [
  {
    name: 'Private School',
    totalBars: 128,
    sections: [
      { name: 'Intro', duration: 16, elements: ['Percussion', 'Hi-hats'] },
      { name: 'Build', duration: 16, elements: ['Log Drums', 'Shakers', 'Bass (soft)'] },
      { name: 'Drop 1', duration: 32, elements: ['Full Drums', 'Bass', 'Piano', 'Vocals'] },
      { name: 'Breakdown', duration: 16, elements: ['Piano', 'Bass', 'Minimal Drums'] },
      { name: 'Build 2', duration: 16, elements: ['Add Percussion', 'Risers'] },
      { name: 'Drop 2', duration: 32, elements: ['Full Elements', 'Counter Melody'] }
    ]
  },
  {
    name: 'Blaq Diamond Style',
    totalBars: 144,
    sections: [
      { name: 'Intro', duration: 8, elements: ['Shakers', 'Cowbells'] },
      { name: 'Percussion Build', duration: 16, elements: ['Add Bongos', 'Rides', 'Hi-hats'] },
      { name: 'Main Groove', duration: 32, elements: ['Log Drums', 'Bass', 'Heavy Percussion'] },
      { name: 'Vocal Section', duration: 32, elements: ['Vocals', 'Full Drums', 'Piano'] },
      { name: 'Breakdown', duration: 16, elements: ['Minimal', 'Reverse FX'] },
      { name: 'Final Drop', duration: 40, elements: ['All Elements', 'SFX', 'Build Energy'] }
    ]
  },
  {
    name: 'Quick Radio Edit',
    totalBars: 96,
    sections: [
      { name: 'Intro', duration: 8, elements: ['Hook', 'Light Drums'] },
      { name: 'Verse', duration: 24, elements: ['Vocals', 'Bass', 'Percussion'] },
      { name: 'Chorus', duration: 32, elements: ['Full Arrangement'] },
      { name: 'Bridge', duration: 16, elements: ['Breakdown', 'Build'] },
      { name: 'Outro', duration: 16, elements: ['Hook', 'Fade Elements'] }
    ]
  }
];

interface QuickArrangementAssistantProps {
  onApplyArrangement?: (template: ArrangementTemplate, intensity: number) => void;
  className?: string;
}

export function QuickArrangementAssistant({ 
  onApplyArrangement,
  className 
}: QuickArrangementAssistantProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('Private School');
  const [intensity, setIntensity] = useState([70]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const { toast } = useToast();
  
  const {
    templates,
    isLoading,
    isSaving,
    saveToLocal,
    saveToDatabase,
    deleteTemplate,
    exportTemplate,
    importTemplate
  } = useArrangementTemplates();

  const currentTemplate = templates.find(t => t.name === selectedTemplate);

  const handleApplyArrangement = async () => {
    if (!currentTemplate) return;

    setIsGenerating(true);
    
    try {
      // Simulate arrangement generation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onApplyArrangement?.(currentTemplate, intensity[0]);
      
      toast({
        title: "Arrangement Applied",
        description: `${currentTemplate.name} template (${currentTemplate.totalBars} bars) loaded successfully`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAsNew = async () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a template name",
        variant: "destructive",
      });
      return;
    }

    if (!currentTemplate) return;

    const newTemplate = {
      ...currentTemplate,
      name: newTemplateName
    };

    const saved = saveToLocal(newTemplate);
    if (saved) {
      setNewTemplateName('');
      setShowSaveDialog(false);
    }
  };

  const handleSaveToCloud = async () => {
    if (!currentTemplate) return;
    await saveToDatabase(currentTemplate, false);
  };

  const handleExport = () => {
    if (!currentTemplate) return;
    exportTemplate(currentTemplate);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await importTemplate(file);
    e.target.value = ''; // Reset input
  };

  const handleDelete = async (templateId?: string) => {
    if (!templateId) return;
    
    const confirmed = window.confirm('Delete this template?');
    if (confirmed) {
      await deleteTemplate(templateId);
    }
  };

  const estimatedTime = currentTemplate ? Math.round(currentTemplate.totalBars / 4 * 2) : 0; // seconds at 120 BPM

  return (
    <Card className={className}>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Quick Arrangement Assistant</h3>
          <span className="ml-auto text-xs text-muted-foreground">5× faster</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Template</Label>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  disabled={!currentTemplate}
                  className="h-7 w-7 p-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById('import-template')?.click()}
                  className="h-7 w-7 p-0"
                >
                  <Upload className="h-3 w-3" />
                </Button>
                <input
                  id="import-template"
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>
            </div>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template, idx) => (
                  <SelectItem key={`${template.name}_${idx}`} value={template.name}>
                    {template.name} ({template.totalBars} bars)
                    {template.author && ' 🔒'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentTemplate && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Duration: ~{estimatedTime}s</span>
                <Music className="h-4 w-4 ml-4" />
                <span>{currentTemplate.sections.length} sections</span>
              </div>
              
              <div className="space-y-2">
                {currentTemplate.sections.map((section, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="font-medium min-w-[100px]">{section.name}</span>
                    <span className="text-muted-foreground">{section.duration} bars</span>
                    <span className="text-muted-foreground ml-auto">{section.elements.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Arrangement Intensity: {intensity[0]}%</Label>
            <Slider
              value={intensity}
              onValueChange={setIntensity}
              min={30}
              max={100}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher intensity adds more elements and variations
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={handleApplyArrangement} 
              disabled={isGenerating}
              className="col-span-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Apply Arrangement
                </>
              )}
            </Button>

            {!showSaveDialog ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save As New
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleSaveToCloud}
                  disabled={isSaving || !currentTemplate}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save to Cloud
                </Button>
              </>
            ) : (
              <div className="col-span-2 space-y-2">
                <Input
                  placeholder="New template name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleSaveAsNew}
                    disabled={!newTemplateName.trim()}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowSaveDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <p className="text-xs font-medium">Benefits:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Professional structure in seconds</li>
            <li>• Genre-authentic section transitions</li>
            <li>• Smart element placement</li>
            <li>• Customizable intensity levels</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
