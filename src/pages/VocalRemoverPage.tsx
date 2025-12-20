import React from 'react';
import VocalRemover from '@/components/music/VocalRemover';
import { MusicToolsSidebar } from '@/components/music/MusicToolsSidebar';

const VocalRemoverPage: React.FC = () => {

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <MusicToolsSidebar activeTool="vocal-remover" />
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">AI Vocal Remover Online Free</h1>
              <p className="text-muted-foreground text-lg">
                Remove vocals from any song free with advanced AI algorithms for high-quality results.
              </p>
            </div>
            
            <VocalRemover />
            
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-6 rounded-lg bg-card border">
                <h3 className="font-semibold mb-2">Video & Audio Support</h3>
                <p className="text-sm text-muted-foreground">
                  Extract vocals from both video and audio files quickly and efficiently.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-card border">
                <h3 className="font-semibold mb-2">Any File Format</h3>
                <p className="text-sm text-muted-foreground">
                  Supports MP3, WAV, M4A, FLAC, OGG, and more popular formats.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-card border">
                <h3 className="font-semibold mb-2">AI Powered</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced AI delivers fast, high-quality vocal separation.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-card border">
                <h3 className="font-semibold mb-2">Dual Output</h3>
                <p className="text-sm text-muted-foreground">
                  Get both isolated vocals and clean instrumentals from one upload.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VocalRemoverPage;
