import React from 'react';
import SoundEffectGenerator from '@/components/music/SoundEffectGenerator';
import { MusicToolsSidebar } from '@/components/music/MusicToolsSidebar';

const SoundEffectPage: React.FC = () => {

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <MusicToolsSidebar activeTool="sound-effect" />
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">AI Sound Effect Generator</h1>
              <p className="text-muted-foreground text-lg">
                Generate custom sound effects from text descriptions using AI. Perfect for games, videos, and podcasts.
              </p>
            </div>
            
            <SoundEffectGenerator />
            
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="p-6 rounded-lg bg-card border">
                <h3 className="font-semibold mb-2">Text to Sound</h3>
                <p className="text-sm text-muted-foreground">
                  Simply describe the sound you want and AI will generate it for you.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-card border">
                <h3 className="font-semibold mb-2">Custom Duration</h3>
                <p className="text-sm text-muted-foreground">
                  Control the length of your sound effects from 1 to 22 seconds.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-card border">
                <h3 className="font-semibold mb-2">High Quality</h3>
                <p className="text-sm text-muted-foreground">
                  Generate professional-quality sound effects for any project.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SoundEffectPage;
