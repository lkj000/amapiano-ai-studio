import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Palette, Wand2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StyleProfile {
  id: string;
  name: string;
  description: string;
  category: 'analog' | 'digital' | 'vintage' | 'modern' | 'experimental';
  characteristics: string[];
  preview: string;
}

interface PluginStyleTransferProps {
  sourcePlugin?: string;
  onTransferComplete?: (styledPlugin: string) => void;
}

export function PluginStyleTransfer({ sourcePlugin, onTransferComplete }: PluginStyleTransferProps) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [transferIntensity, setTransferIntensity] = useState([75]);
  const [preserveStructure, setPreserveStructure] = useState([50]);

  const styleProfiles: StyleProfile[] = [
    {
      id: 'analog-warmth',
      name: 'Analog Warmth',
      description: 'Vintage analog character with subtle harmonic distortion',
      category: 'analog',
      characteristics: ['Tube saturation', 'Tape compression', 'Transformer coloration'],
      preview: 'Smooth, warm, slightly compressed with even-order harmonics'
    },
    {
      id: 'vintage-console',
      name: 'Vintage Console',
      description: 'Classic mixing console sound with presence and character',
      category: 'vintage',
      characteristics: ['Console EQ curves', 'Bus compression', 'Subtle distortion'],
      preview: 'Present, punchy, with midrange clarity and smooth highs'
    },
    {
      id: 'digital-precision',
      name: 'Digital Precision',
      description: 'Ultra-clean digital processing with surgical accuracy',
      category: 'digital',
      characteristics: ['Linear phase', 'Surgical EQ', 'Transparent dynamics'],
      preview: 'Crystal clear, precise, with no added coloration'
    },
    {
      id: 'modern-aggressive',
      name: 'Modern Aggressive',
      description: 'Contemporary EDM-style processing with punch and presence',
      category: 'modern',
      characteristics: ['Brick-wall limiting', 'Multiband processing', 'Sidechain shaping'],
      preview: 'Loud, punchy, with enhanced transients and tight bass'
    },
    {
      id: 'experimental-glitch',
      name: 'Experimental Glitch',
      description: 'Creative glitch and artifact generation',
      category: 'experimental',
      characteristics: ['Bit crushing', 'Buffer stuttering', 'Spectral artifacts'],
      preview: 'Unpredictable, textured, with digital artifacts and glitches'
    },
    {
      id: 'lofi-character',
      name: 'Lo-Fi Character',
      description: 'Intentional degradation for vintage feel',
      category: 'vintage',
      characteristics: ['Bit reduction', 'Sample rate reduction', 'Vinyl crackle'],
      preview: 'Degraded, nostalgic, with character and imperfections'
    },
    {
      id: 'studio-classic',
      name: 'Studio Classic',
      description: 'Emulation of legendary studio equipment',
      category: 'analog',
      characteristics: ['LA-2A compression', 'Pultec EQ curves', 'Plate reverb'],
      preview: 'Professional, polished, with classic studio character'
    },
    {
      id: 'future-bass',
      name: 'Future Bass',
      description: 'Modern production style with lush harmonics',
      category: 'modern',
      characteristics: ['Supersaws', 'Vocal chops', 'Wide stereo'],
      preview: 'Wide, lush, with shimmering high-end and rich harmonics'
    }
  ];

  const transferStyle = async () => {
    if (!selectedStyle) {
      toast.error("Please select a style profile first");
      return;
    }

    setIsTransferring(true);
    const style = styleProfiles.find(s => s.id === selectedStyle);
    toast.info(`Transferring "${style?.name}" style...`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simulate style transfer
    const styledCode = `// Style Transfer Applied: ${style?.name}
// Intensity: ${transferIntensity[0]}%, Structure Preservation: ${preserveStructure[0]}%

class ${style?.name.replace(/\s+/g, '')}Plugin {
  constructor(context) {
    this.context = context;
    this.characteristics = ${JSON.stringify(style?.characteristics)};
    this.intensity = ${transferIntensity[0] / 100};
    
    ${style?.category === 'analog' ? `
    // Analog modeling
    this.saturation = new TubeSaturation(context);
    this.compression = new VintageCompressor(context);
    ` : ''}
    
    ${style?.category === 'digital' ? `
    // Digital precision
    this.linearPhaseEQ = new LinearPhaseEQ(context);
    this.transparentCompressor = new TransparentCompressor(context);
    ` : ''}
    
    ${style?.category === 'experimental' ? `
    // Experimental processing
    this.bitCrusher = new BitCrusher(context);
    this.glitchEngine = new GlitchEngine(context);
    ` : ''}
  }
  
  process(input) {
    let output = input;
    
    ${style?.characteristics.map(char => `
    // Apply: ${char}
    output = this.apply${char.replace(/\s+/g, '')}(output);
    `).join('\n')}
    
    // Blend with original based on intensity
    return this.blend(input, output, this.intensity);
  }
  
  blend(dry, wet, amount) {
    return dry.map((sample, i) => 
      sample * (1 - amount) + wet[i] * amount
    );
  }
}

// Original plugin code preserved below
${sourcePlugin || '// ... original plugin code ...'}
`;

    if (onTransferComplete) {
      onTransferComplete(styledCode);
    }

    setIsTransferring(false);
    toast.success(`Style transfer complete! Applied "${style?.name}"`);
  };

  const getCategoryColor = (category: StyleProfile['category']) => {
    switch (category) {
      case 'analog': return 'bg-amber-500/10 text-amber-500';
      case 'digital': return 'bg-blue-500/10 text-blue-500';
      case 'vintage': return 'bg-purple-500/10 text-purple-500';
      case 'modern': return 'bg-green-500/10 text-green-500';
      case 'experimental': return 'bg-pink-500/10 text-pink-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">AI Style Transfer</h3>
            <p className="text-sm text-muted-foreground">
              Apply the sonic characteristics of professional plugins to your creation
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Transfer Intensity</label>
            <Slider
              value={transferIntensity}
              onValueChange={setTransferIntensity}
              max={100}
              step={1}
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">{transferIntensity[0]}% - Balance between original and styled sound</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Structure Preservation</label>
            <Slider
              value={preserveStructure}
              onValueChange={setPreserveStructure}
              max={100}
              step={1}
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">{preserveStructure[0]}% - How much of the original architecture to keep</p>
          </div>
        </div>

        <Button 
          onClick={transferStyle} 
          disabled={isTransferring || !selectedStyle}
          className="w-full"
        >
          {isTransferring ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Transferring Style...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Transfer Style
            </>
          )}
        </Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {styleProfiles.map(style => (
          <Card
            key={style.id}
            className={`p-4 cursor-pointer transition-all ${
              selectedStyle === style.id
                ? 'ring-2 ring-primary shadow-lg'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedStyle(style.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold">{style.name}</h4>
              <Badge className={getCategoryColor(style.category)}>
                {style.category}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">{style.description}</p>
            
            <div className="space-y-2">
              <p className="text-xs font-medium">Characteristics:</p>
              <div className="flex flex-wrap gap-1">
                {style.characteristics.map((char, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {char}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-muted rounded text-xs italic">
              Preview: {style.preview}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
