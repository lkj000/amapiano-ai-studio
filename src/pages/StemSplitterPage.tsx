import React from 'react';
import { User } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import StemSplitter from '@/components/music/StemSplitter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Mic, Radio, Music2, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';

interface StemSplitterPageProps {
  user: User | null;
}

const generatorLinks = [
  { path: '/generate-song-suno', label: 'Suno AI Generator', icon: Music, description: 'Full songs with vocals' },
  { path: '/generate-song-elevenlabs-singing', label: 'ElevenLabs Vocals', icon: Mic, description: 'AI voice synthesis' },
  { path: '/generate-instrumental', label: 'Instrumental Generator', icon: Music2, description: 'Pure instrumentals' },
  { path: '/ai-lyrics-generator', label: 'AI Lyrics Generator', icon: Sparkles, description: 'Generate song lyrics' },
];

const StemSplitterPage: React.FC<StemSplitterPageProps> = ({ user }) => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          The Best AI Stem Splitter Free Online
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Unlock creative possibilities with our free AI Stem Splitter for effortless audio separation
        </p>
      </div>

      <div className="max-w-4xl mx-auto mb-12">
        <StemSplitter />
      </div>

      <div className="mt-16 space-y-8">
        <h2 className="text-2xl font-semibold text-center">
          Key Features Of Our AI Stem Splitter
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Free – No Credit Card Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Start separating your music into individual stems at no cost, making it accessible for anyone to explore stem separation.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Fast and Precise Separation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get fast, accurate separation of vocals, drums, bass, and other instruments with high-quality output.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Music className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Multiple Stem Types</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Extract vocals, drums, bass, and other instruments separately for remixing, mastering, or creating karaoke tracks.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Create New Music
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {generatorLinks.map(({ path, label, icon: Icon, description }) => (
            <Card key={path} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <Icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">{label}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={path}>
                    Try Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StemSplitterPage;
