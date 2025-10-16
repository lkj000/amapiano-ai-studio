import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Cpu, 
  Volume2, 
  BookOpen, 
  Users, 
  TrendingUp, 
  AudioWaveform, 
  Activity,
  Zap,
  Sparkles
} from 'lucide-react';
import { RealtimeAIAssistant } from './RealtimeAIAssistant';
import { AIModelRouter } from './AIModelRouter';
import { VoiceAIGuide } from './VoiceAIGuide';
import { RAGKnowledgeBase } from './RAGKnowledgeBase';
import { RealTimeCollaboration } from './RealTimeCollaboration';
import { AIModelMarketplace } from './AIModelMarketplace';
import { MusicAnalysisTools } from './MusicAnalysisTools';
import { VoiceToMusicEngine } from './VoiceToMusicEngine';
import { User } from '@supabase/supabase-js';
import type { DawProjectData } from '@/types/daw';
import { ErrorBoundary } from './ErrorBoundary';

interface AIAssistantHubProps {
  user: User | null;
  projectData?: DawProjectData | null;
  activeProjectId?: string;
  onTrackGenerated?: (track: any) => void;
  onEffectAdded?: (effectName: string) => void;
  className?: string;
}

export const AIAssistantHub: React.FC<AIAssistantHubProps> = ({
  user,
  projectData,
  activeProjectId,
  onTrackGenerated,
  onEffectAdded,
  className = ""
}) => {
  const [activeFeature, setActiveFeature] = useState<string>('overview');

  const aiFeatures = [
    {
      id: 'realtime',
      name: 'Live AI Assistant',
      icon: Activity,
      description: 'Real-time AI performance assistant with live feedback',
      color: 'text-green-500'
    },
    {
      id: 'models',
      name: 'AI Model Router',
      icon: Cpu,
      description: 'Smart routing between different AI models for optimal results',
      color: 'text-blue-500'
    },
    {
      id: 'voice',
      name: 'Voice AI Guide',
      icon: Volume2,
      description: 'Voice-powered AI guidance and text-to-speech feedback',
      color: 'text-purple-500'
    },
    {
      id: 'knowledge',
      name: 'Knowledge Base',
      icon: BookOpen,
      description: 'RAG-powered amapiano knowledge and cultural context',
      color: 'text-orange-500'
    },
    {
      id: 'collaboration',
      name: 'Real-time Collaboration',
      icon: Users,
      description: 'Live collaboration with AI-mediated sessions',
      color: 'text-pink-500'
    },
    {
      id: 'marketplace',
      name: 'AI Marketplace',
      icon: TrendingUp,
      description: 'Browse and purchase specialized AI models',
      color: 'text-yellow-500'
    },
    {
      id: 'analysis',
      name: 'Music Analysis',
      icon: AudioWaveform,
      description: 'Advanced music analysis and pattern recognition',
      color: 'text-cyan-500'
    },
    {
      id: 'voice-to-music',
      name: 'Voice to Music',
      icon: Zap,
      description: 'Convert voice recordings to amapiano tracks',
      color: 'text-red-500'
    }
  ];

  if (activeFeature === 'overview') {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Assistant Hub
            <Badge variant="secondary" className="ml-auto">
              <Sparkles className="w-3 h-3 mr-1" />
              8 AI Features
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
                  onClick={() => setActiveFeature(feature.id)}
                >
                  <CardContent className="p-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center mb-3 ${feature.color}`}>
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-sm mb-2">{feature.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Near-Limitless AI Querying
            </h4>
            <p className="text-sm text-muted-foreground">
              Our platform supports unlimited AI interactions across multiple providers (OpenAI, Anthropic, ElevenLabs) 
              with intelligent model routing, caching, and cost optimization for the best amapiano production experience.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveFeature('overview')}
        >
          ← Back to Hub
        </Button>
        <Badge variant="secondary">
          {aiFeatures.find(f => f.id === activeFeature)?.name}
        </Badge>
      </div>

      {activeFeature === 'realtime' && (
        <ErrorBoundary>
          <RealtimeAIAssistant
            projectData={projectData}
            onLiveAction={(action) => {
              console.log('Live AI Action:', action);
              if (action.type === 'addEffect' && onEffectAdded) {
                onEffectAdded(action.effectName);
              }
            }}
          />
        </ErrorBoundary>
      )}

      {activeFeature === 'models' && (
        <AIModelRouter
          onModelSelect={(modelId) => {
            console.log('Selected AI Model:', modelId);
          }}
        />
      )}

      {activeFeature === 'voice' && (
        <ErrorBoundary>
          <VoiceAIGuide
            currentContext={`Project: ${projectData ? 'Active' : 'None'} | Features: All AI capabilities available`}
            onVoiceCommand={(command) => {
              console.log('Voice Command:', command);
            }}
          />
        </ErrorBoundary>
      )}

      {activeFeature === 'knowledge' && (
        <ErrorBoundary>
          <RAGKnowledgeBase
            currentContext="AI Assistant Hub - Full access to amapiano knowledge base"
          />
        </ErrorBoundary>
      )}

      {activeFeature === 'collaboration' && (
        <RealTimeCollaboration
          projectId={activeProjectId || 'demo'}
          currentUser={user}
          projectData={projectData || null}
          onProjectUpdate={(update) => {
            console.log('Project update:', update);
          }}
        />
      )}

      {activeFeature === 'marketplace' && (
        <AIModelMarketplace />
      )}

      {activeFeature === 'analysis' && (
        <ErrorBoundary>
          <MusicAnalysisTools
            projectData={projectData}
          />
        </ErrorBoundary>
      )}

      {activeFeature === 'voice-to-music' && (
        <VoiceToMusicEngine
          onTrackGenerated={(track) => {
            console.log('Generated track from voice:', track);
            if (onTrackGenerated) {
              onTrackGenerated(track);
            }
          }}
        />
      )}
    </div>
  );
};