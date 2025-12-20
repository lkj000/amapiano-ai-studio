import React from 'react';
import { User } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import LyricsGenerator from '@/components/music/LyricsGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Mic, Radio, Music2, ArrowRight } from 'lucide-react';

interface AILyricsGeneratorPageProps {
  user: User | null;
}

const generatorLinks = [
  { path: '/generate-song-suno', label: 'Suno AI Generator', icon: Music, description: 'Full songs with vocals' },
  { path: '/generate-song-elevenlabs-singing', label: 'ElevenLabs Vocals', icon: Mic, description: 'AI voice synthesis' },
  { path: '/generate-instrumental', label: 'Instrumental Generator', icon: Music2, description: 'Pure instrumentals' },
  { path: '/generate-backing-with-intro', label: 'Backing + Intro', icon: Radio, description: 'Tracks with spoken intro' },
];

const AILyricsGeneratorPage: React.FC<AILyricsGeneratorPageProps> = ({ user }) => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          Boost Creativity with AI Lyrics Generator
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Effortlessly craft lyrics tailored to your unique style, genre, and vision with our AI lyrics generator.
        </p>
      </div>

      <div className="max-w-4xl mx-auto mb-12">
        <LyricsGenerator />
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Turn Your Lyrics Into Music
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

      <div className="mt-16 space-y-8">
        <h2 className="text-2xl font-semibold text-center">
          What is Our AI Lyrics Generator?
        </h2>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto">
          Our AI lyrics generator is a cutting-edge tool that helps users craft customized song lyrics quickly and efficiently. 
          From pop to rap, rock, or Amapiano, our AI adapts to any style. Perfect for amateurs and professionals, 
          it simplifies songwriting with innovative AI technology.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick and Easy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Create custom song lyrics in seconds with our simple, user-friendly interface for effortless songwriting.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supports All Genres</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                From pop to rap, rock, Amapiano, or country, our AI tailors lyrics to suit any musical style.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Two Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get two unique versions of your lyrics to choose from, giving you creative options for your music.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AILyricsGeneratorPage;
