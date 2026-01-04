import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Music, 
  Mic, 
  Brain, 
  Database, 
  Server, 
  Globe, 
  Zap, 
  Shield,
  Play,
  FileText,
  Users,
  Sparkles,
  BarChart3,
  Layers,
  Wand2,
  AudioLines,
  Settings,
  BookOpen,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SystemModule {
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  status: 'live' | 'beta' | 'development' | 'planned';
  category: string;
  progress?: number;
}

const AuraXHub = () => {
  const modules: SystemModule[] = [
    // Production Tools
    { title: 'Suno AI Generator', description: 'Full song generation with vocals', icon: Music, route: '/generate-song-suno', status: 'live', category: 'Production' },
    { title: 'ElevenLabs Vocals', description: 'Artist voice synthesis', icon: Mic, route: '/generate-song-elevenlabs-singing', status: 'live', category: 'Production' },
    { title: 'Instrumental Generator', description: 'AI instrumental creation', icon: AudioLines, route: '/generate-instrumental', status: 'live', category: 'Production' },
    { title: 'Backing Track + Intro', description: 'Full backing track pipeline', icon: Layers, route: '/generate-backing-with-intro', status: 'live', category: 'Production' },
    { title: 'AI Lyrics Generator', description: 'Multilingual lyric creation', icon: FileText, route: '/ai-lyrics-generator', status: 'live', category: 'Production' },
    { title: 'Sound Effects', description: 'AI sound effect generation', icon: Sparkles, route: '/sound-effect', status: 'live', category: 'Production' },
    
    // Audio Processing
    { title: 'Stem Splitter', description: 'Separate audio into stems', icon: Wand2, route: '/stem-splitter', status: 'live', category: 'Processing' },
    { title: 'Vocal Remover', description: 'Extract vocals from tracks', icon: AudioLines, route: '/vocal-remover', status: 'live', category: 'Processing' },
    { title: 'Amapianorize', description: 'Convert any track to Amapiano', icon: Zap, route: '/amapianorize', status: 'beta', category: 'Processing' },
    { title: 'Audio Editor', description: 'Full audio editing suite', icon: Settings, route: '/audio-editor', status: 'live', category: 'Processing' },
    
    // DAW & Studio
    { title: 'AURA DAW', description: 'Full digital audio workstation', icon: Music, route: '/daw', status: 'live', category: 'Studio' },
    { title: 'Pattern Editor', description: 'Amapiano pattern creation', icon: Layers, route: '/patterns', status: 'live', category: 'Studio' },
    { title: 'Sample Library', description: 'Curated Amapiano samples', icon: Database, route: '/samples', status: 'live', category: 'Studio' },
    
    // AI & Agents
    { title: 'Text to Production', description: 'Natural language to full track', icon: Wand2, route: '/aura-x/text-to-production', status: 'live', category: 'AI' },
    { title: 'AI Hub', description: 'Central AI assistant interface', icon: Brain, route: '/ai-hub', status: 'live', category: 'AI' },
    { title: 'Agent Demo', description: 'Autonomous production agents', icon: Zap, route: '/agent-demo', status: 'beta', category: 'AI' },
    { title: 'Level 5 Dashboard', description: 'Full autonomy monitoring', icon: Target, route: '/level5-dashboard', status: 'beta', category: 'AI' },
    { title: 'AURA Platform', description: 'Integrated AI production', icon: Sparkles, route: '/aura', status: 'live', category: 'AI' },
    
    // Voice & Licensing
    { title: 'Voice Licensing', description: 'Artist voice licensing & revenue share', icon: Mic, route: '/aura-x/voice-licensing', status: 'live', category: 'Voice & Licensing' },
    { title: 'Voice Models', description: 'Browse licensed artist voices', icon: Users, route: '/aura-x/voice-licensing', status: 'live', category: 'Voice & Licensing' },
    
    // Training & Data
    { title: 'Training Dataset', description: 'Bulk upload & annotate training data', icon: Database, route: '/training-dataset', status: 'live', category: 'Training' },
    { title: 'Training Data Collection', description: 'Collect voice & feedback data', icon: Database, route: '/training', status: 'live', category: 'Training' },
    { title: 'User Study', description: 'A/B testing & preferences', icon: Users, route: '/user-study', status: 'live', category: 'Training' },
    { title: 'Study Analytics', description: 'Training data analytics', icon: BarChart3, route: '/study-analytics', status: 'live', category: 'Training' },
    { title: 'A/B Pair Generator', description: 'Generate comparison pairs', icon: Layers, route: '/ab-pair-generator', status: 'live', category: 'Training' },
    
    // Infrastructure
    { title: 'Modal Dashboard', description: 'GPU orchestration metrics', icon: Server, route: '/modal-dashboard', status: 'live', category: 'Infrastructure' },
    { title: 'ML Quantize', description: 'Model optimization tools', icon: Zap, route: '/ml/quantize', status: 'beta', category: 'Infrastructure' },
    { title: 'Performance Monitor', description: 'System performance tracking', icon: BarChart3, route: '/performance', status: 'live', category: 'Infrastructure' },
    
    // Community
    { title: 'Social Feed', description: 'Community music sharing', icon: Users, route: '/social', status: 'live', category: 'Community' },
    { title: 'Creator Hub', description: 'Creator tools & analytics', icon: Globe, route: '/creator-hub', status: 'live', category: 'Community' },
    { title: 'Marketplace', description: 'Samples, presets, plugins', icon: Database, route: '/marketplace', status: 'live', category: 'Community' },
    
    // Documentation
    { title: 'Architecture Overview', description: 'Complete system architecture', icon: BookOpen, route: '/aura-x/architecture', status: 'live', category: 'Documentation' },
    { title: 'Research', description: 'Research papers & findings', icon: FileText, route: '/research', status: 'live', category: 'Documentation' },
  ];

  const categories = [...new Set(modules.map(m => m.category))];

  const statusColors: Record<string, string> = {
    live: 'bg-green-500/20 text-green-400 border-green-500/30',
    beta: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    development: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    planned: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const phaseProgress = [
    { phase: 'Phase 1: Data Collection', progress: 45, status: 'In Progress' },
    { phase: 'Phase 2: Infrastructure', progress: 70, status: 'Active' },
    { phase: 'Phase 3: Model Training', progress: 20, status: 'Started' },
    { phase: 'Phase 4: Neuro-Symbolic', progress: 10, status: 'Planning' },
    { phase: 'Phase 5: UI/UX', progress: 60, status: 'Active' },
    { phase: 'Phase 6: Business', progress: 15, status: 'Planning' },
    { phase: 'Phase 7: Expansion', progress: 0, status: 'Future' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/50 to-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-500/10 to-blue-500/20" />
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              AURA X
            </h1>
            <p className="text-2xl text-gray-300 mb-2">
              Level 5 Autonomous Producer
            </p>
            <p className="text-gray-400 max-w-2xl mx-auto">
              The complete AI-powered music production platform for Amapiano & South African music.
              From text prompts to mastered tracks with cultural authenticity.
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <div className="text-3xl font-bold text-purple-400">{modules.filter(m => m.status === 'live').length}</div>
              <div className="text-sm text-gray-400">Live Modules</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <div className="text-3xl font-bold text-yellow-400">{modules.filter(m => m.status === 'beta').length}</div>
              <div className="text-sm text-gray-400">In Beta</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <div className="text-3xl font-bold text-blue-400">12</div>
              <div className="text-sm text-gray-400">SA Languages</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <div className="text-3xl font-bold text-green-400">50+</div>
              <div className="text-sm text-gray-400">Voice Models</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-16">
        {/* Phase Progress */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Development Roadmap
            </CardTitle>
            <CardDescription>30-36 month implementation timeline</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {phaseProgress.map((phase, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{phase.phase}</span>
                  <span className="text-gray-500">{phase.status}</span>
                </div>
                <Progress value={phase.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Modules by Category */}
        {categories.map(category => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              {category}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {modules.filter(m => m.category === category).map((module, idx) => {
                const Icon = module.icon;
                return (
                  <Link key={idx} to={module.route}>
                    <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 hover:bg-gray-800/80 transition-all h-full group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                            <Icon className="w-5 h-5 text-purple-400" />
                          </div>
                          <Badge variant="outline" className={statusColors[module.status]}>
                            {module.status}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-white mb-1">{module.title}</h3>
                        <p className="text-sm text-gray-400">{module.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-700">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Quick Start</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/generate-song-suno">
                <Button className="w-full h-auto py-4 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700">
                  <Play className="w-6 h-6" />
                  <span>Generate Full Song</span>
                </Button>
              </Link>
              <Link to="/ai-lyrics-generator">
                <Button className="w-full h-auto py-4 flex flex-col gap-2 bg-pink-600 hover:bg-pink-700">
                  <FileText className="w-6 h-6" />
                  <span>Write Lyrics</span>
                </Button>
              </Link>
              <Link to="/daw">
                <Button className="w-full h-auto py-4 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700">
                  <Music className="w-6 h-6" />
                  <span>Open DAW</span>
                </Button>
              </Link>
              <Link to="/training">
                <Button className="w-full h-auto py-4 flex flex-col gap-2 bg-green-600 hover:bg-green-700">
                  <Database className="w-6 h-6" />
                  <span>Contribute Data</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuraXHub;
