import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VoiceSampleCollector } from '@/components/training/VoiceSampleCollector';
import { OutputFeedbackRating } from '@/components/training/OutputFeedbackRating';
import { ABTestComparison } from '@/components/training/ABTestComparison';
import { Mic, Star, Trophy, Database, Brain } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';


export default function TrainingDataCollection() {
  const [activeTab, setActiveTab] = useState('voice-samples');

  // Fetch training stats
  const { data: stats } = useQuery({
    queryKey: ['training-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [samplesRes, feedbackRes, testsRes] = await Promise.all([
        supabase.from('voice_training_samples').select('id', { count: 'exact' }),
        supabase.from('training_feedback').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('ab_test_results').select('id', { count: 'exact' }).eq('user_id', user.id)
      ]);

      return {
        totalSamples: samplesRes.count || 0,
        userFeedback: feedbackRes.count || 0,
        userTests: testsRes.count || 0
      };
    }
  });

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AI Training Data Collection
          </h1>
          <p className="text-muted-foreground">
            Help train the next generation of authentic Amapiano AI by contributing voice samples and feedback
          </p>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats?.totalSamples || 0}</p>
                  <p className="text-sm text-muted-foreground">Voice Samples</p>
                </div>
                <Mic className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats?.userFeedback || 0}</p>
                  <p className="text-sm text-muted-foreground">Your Ratings</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats?.userTests || 0}</p>
                  <p className="text-sm text-muted-foreground">A/B Tests</p>
                </div>
                <Trophy className="h-8 w-8 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">Contributor</p>
                  <p className="text-sm text-muted-foreground">Your Status</p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="voice-samples" className="gap-2">
              <Mic className="h-4 w-4" />
              Voice Samples
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <Star className="h-4 w-4" />
              Rate Outputs
            </TabsTrigger>
            <TabsTrigger value="ab-testing" className="gap-2">
              <Trophy className="h-4 w-4" />
              A/B Testing
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="voice-samples" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Why Contribute Voice Samples?</CardTitle>
                  <CardDescription>
                    Your voice samples help train AI to replicate authentic South African vocal styles.
                    The more diverse samples we collect, the better the AI becomes at understanding 
                    regional accents, vocal textures, and cultural nuances.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-medium mb-2">🎤 Quality Matters</h4>
                      <p className="text-muted-foreground">
                        Record in a quiet space with clear vocals. 5-30 seconds is ideal.
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-medium mb-2">🌍 Regional Diversity</h4>
                      <p className="text-muted-foreground">
                        Include your region to help capture local vocal characteristics.
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-medium mb-2">🎵 Style Matching</h4>
                      <p className="text-muted-foreground">
                        Try to match the vocal style you select for best training results.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <VoiceSampleCollector />
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rate AI Outputs</CardTitle>
                  <CardDescription>
                    After generating lyrics, vocals, or instrumentals, use this tool to rate the output.
                    Your ratings directly influence how the AI learns and improves.
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OutputFeedbackRating 
                  outputType="lyrics"
                  generationParams={{ demo: true }}
                />
                <OutputFeedbackRating 
                  outputType="vocals"
                  generationParams={{ demo: true }}
                />
              </div>
            </TabsContent>

            <TabsContent value="ab-testing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compare & Choose</CardTitle>
                  <CardDescription>
                    Listen to two versions and pick the one that sounds more authentic.
                    This helps the AI understand what "authentic" means to real listeners.
                  </CardDescription>
                </CardHeader>
              </Card>

              <ABTestComparison
                testType="lyrics"
                variantA={{
                  id: 'demo-a',
                  content: `[Verse 1]
Ngiyakuthanda, sthandwa sami
Inhliziyo yami inawe
Ubusuku nobusuku
Ngiphuphe ngawe...`,
                  label: 'Traditional Style'
                }}
                variantB={{
                  id: 'demo-b', 
                  content: `[Verse 1]
Skhathi esihle, sithandwa
Umculo wethu uyaduma
Emgwaqweni yasekasi
Sidansa kuze kuse...`,
                  label: 'Modern Style'
                }}
                context={{ demo: true, genre: 'amapiano' }}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* How it works */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              How Your Contributions Power the AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h4 className="font-medium mb-1">Collect</h4>
                <p className="text-sm text-muted-foreground">
                  Voice samples and feedback are securely stored
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h4 className="font-medium mb-1">Analyze</h4>
                <p className="text-sm text-muted-foreground">
                  Patterns and preferences are identified
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h4 className="font-medium mb-1">Train</h4>
                <p className="text-sm text-muted-foreground">
                  AI models learn from your contributions
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-primary">4</span>
                </div>
                <h4 className="font-medium mb-1">Improve</h4>
                <p className="text-sm text-muted-foreground">
                  Generated content becomes more authentic
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
