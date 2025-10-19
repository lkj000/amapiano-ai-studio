import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIAssistantHub } from '@/components/AIAssistantHub';
import { RealtimeAIAssistant } from '@/components/RealtimeAIAssistant';
import { EngagementAnalytics } from '@/components/EngagementAnalytics';
import RealTimeCollaborationPanel from '@/components/RealTimeCollaborationPanel';
import { AuraConductor } from '@/components/aura/AuraConductor';
import { VastIntegratedOrchestrator } from '@/components/aura/VastIntegratedOrchestrator';
import { RealtimeAudioEngine } from '@/components/RealtimeAudioEngine';
import UnifiedVoiceToMusicEngine from '@/components/UnifiedVoiceToMusicEngine';
import { SourceSeparationEngine } from '@/components/ai/SourceSeparationEngine';
import { 
  Bot, 
  TrendingUp, 
  Users, 
  Zap,
  Crown,
  Music,
  BarChart3,
  Radio,
  Sparkles,
  Mic,
  Layers
} from 'lucide-react';

interface AIHubProps {
  user: User | null;
}

export default function AIHub({ user }: AIHubProps) {
  const [activeTab, setActiveTab] = useState('assistant');
  const [isAudioEngineEnabled, setIsAudioEngineEnabled] = useState(false);
  const [showSeparation, setShowSeparation] = useState(false);
  const [pendingStemUrl, setPendingStemUrl] = useState<string | null>(null);
  const [mockProjectData] = useState({
    id: 'demo-project',
    name: 'Demo Amapiano Track',
    bpm: 118,
    keySignature: 'F#m',
    tracks: [
      { id: '1', name: 'Log Drums', type: 'midi', instrument: 'drums' },
      { id: '2', name: 'Piano Chords', type: 'midi', instrument: 'piano' }
    ]
  });

  const features = [
    {
      title: 'Real-time AI Assistant',
      description: 'Get instant suggestions while you produce',
      icon: Bot,
      status: 'Phase 2',
      color: 'bg-blue-500'
    },
    {
      title: 'Engagement Analytics',
      description: 'Track your music performance and reach',
      icon: BarChart3,
      status: 'Phase 2',
      color: 'bg-green-500'
    },
    {
      title: 'Live Collaboration',
      description: 'Work together in real-time with other producers',
      icon: Radio,
      status: 'Phase 2',
      color: 'bg-purple-500'
    },
    {
      title: 'Aura Conductor',
      description: 'AI-powered orchestration and arrangement',
      icon: Crown,
      status: 'Phase 2',
      color: 'bg-orange-500'
    }
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tool') === 'stem-separation') {
      try {
        const pending = localStorage.getItem('pendingStemTrack');
        if (pending) {
          const data = JSON.parse(pending);
          setPendingStemUrl(data.url);
          localStorage.removeItem('pendingStemTrack');
        }
        setShowSeparation(true);
      } catch (e) {
        console.error('Failed to parse pendingStemTrack:', e);
      }
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <CardTitle>AI Hub Access</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Please sign in to access advanced AI features
            </p>
            <a
              href="/auth"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Sign In to Continue
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">AI Hub</h1>
              <Badge variant="secondary" className="mt-1">
                <Sparkles className="w-3 h-3 mr-1" />
                Phase 2 Features
              </Badge>
            </div>
          </div>
          <p className="text-lg text-muted-foreground">
            Advanced AI-powered tools for amapiano music production, collaboration, and analytics.
          </p>
        </div>

        {showSeparation && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Stem Separation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SourceSeparationEngine initialAudioUrl={pendingStemUrl ?? undefined} autoStart={!!pendingStemUrl} />
            </CardContent>
          </Card>
        )}

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${feature.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{feature.description}</p>
                      <Badge variant="outline" className="text-xs">
                        {feature.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main AI Hub Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="assistant" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Assistant
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Real-time
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Collaborate
            </TabsTrigger>
            <TabsTrigger value="conductor" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Conductor
            </TabsTrigger>
            <TabsTrigger value="vast" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              VAST
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assistant" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  AI Assistant Hub
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIAssistantHub
                  user={user}
                  onTrackGenerated={(track) => {
                    console.log('Track generated:', track);
                  }}
                  onEffectAdded={(effectName) => {
                    console.log('Effect added:', effectName);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice" className="space-y-6">
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Mic className="w-6 h-6 text-primary" />
                  Unified Voice-to-Music Engine
                </h2>
                <p className="text-muted-foreground">
                  Advanced voice-to-music with real-time pitch detection, MIDI export, and AI generation
                </p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <Badge variant="secondary">🎵 Melody Mode</Badge>
                  <Badge variant="secondary">🗣️ Instruction Mode</Badge>
                  <Badge variant="secondary">🥁 Beatbox Mode</Badge>
                  <Badge variant="secondary">🎹 MIDI Export</Badge>
                  <Badge variant="secondary">📊 Real-time Pitch</Badge>
                </div>
              </div>
              
              <UnifiedVoiceToMusicEngine
                onTrackGenerated={(audioUrl, metadata) => {
                  console.log('Voice track generated:', { audioUrl, metadata });
                  // Could integrate with DAW here
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RealtimeAIAssistant
                projectData={mockProjectData}
                onLiveAction={(action) => {
                  console.log('Live action:', action);
                }}
                className="w-full"
              />
              <RealtimeAudioEngine
                isEnabled={isAudioEngineEnabled}
                onToggle={setIsAudioEngineEnabled}
                onAudioData={(audioData) => {
                  // Process real-time audio data for AI analysis
                  console.log('Real-time audio data:', audioData.length);
                }}
                className="w-full"
              />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <EngagementAnalytics
              userId={user.id}
              timeframe="30d"
            />
          </TabsContent>

          <TabsContent value="collaboration" className="space-y-6">
            <Card className="h-[600px]">
              <RealTimeCollaborationPanel
                projectId="demo-project"
                projectData={mockProjectData as any}
                onProjectUpdate={(data) => {
                  console.log('Project updated:', data);
                }}
                onClose={() => {
                  console.log('Collaboration panel closed');
                }}
              />
            </Card>
          </TabsContent>

          <TabsContent value="conductor" className="space-y-6">
            <AuraConductor user={user} />
          </TabsContent>

          <TabsContent value="vast" className="space-y-6">
            <VastIntegratedOrchestrator user={user} />
          </TabsContent>
        </Tabs>

        {/* Phase 2 Status */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg border-2 border-dashed border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">Phase 2 Complete!</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            You now have access to advanced AI features including real-time assistance, 
            comprehensive analytics, live collaboration, and AI orchestration.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">✅ Real-time AI Assistant</Badge>
            <Badge variant="default">✅ Engagement Analytics</Badge>
            <Badge variant="default">✅ Live Collaboration</Badge>
            <Badge variant="default">✅ Multi-language Support</Badge>
            <Badge variant="default">✅ Advanced AI Orchestration</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}