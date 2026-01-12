import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoiceModelTrainer, VoiceBlender, TextToSpeech } from '@/components/voice';
import { Mic, Blend, Volume2, Sparkles } from 'lucide-react';

const VoiceLab = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Voice Lab</h1>
              <p className="text-sm text-muted-foreground">
                Train custom voice models, blend voices, and generate speech
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="trainer" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="trainer" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Training</span>
            </TabsTrigger>
            <TabsTrigger value="blender" className="flex items-center gap-2">
              <Blend className="h-4 w-4" />
              <span className="hidden sm:inline">Blender</span>
            </TabsTrigger>
            <TabsTrigger value="tts" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Text to Speech</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trainer">
            <div className="max-w-2xl mx-auto">
              <VoiceModelTrainer />
            </div>
          </TabsContent>

          <TabsContent value="blender">
            <div className="max-w-2xl mx-auto">
              <VoiceBlender />
            </div>
          </TabsContent>

          <TabsContent value="tts">
            <div className="max-w-2xl mx-auto">
              <TextToSpeech />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VoiceLab;
