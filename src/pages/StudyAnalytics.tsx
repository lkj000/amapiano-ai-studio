import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileJson, FileSpreadsheet, RefreshCw, Users, BarChart3, TrendingUp, Target } from 'lucide-react';

interface StudyResponse {
  id: string;
  user_id: string;
  baseline_audio_url: string;
  amapianorized_audio_url: string;
  authenticity_rating: number;
  feedback: string | null;
  producer_experience: string;
  familiarity_with_amapiano: string;
  created_at: string;
}

interface ParsedFeedback {
  pairId?: string;
  region?: string;
  baselineRating?: number;
  amapianorizedRating?: number;
  preferredActual?: string;
  trackOrder?: string;
  userFeedback?: string;
  role?: string;
}

export default function StudyAnalytics() {
  const { toast } = useToast();
  const [responses, setResponses] = useState<StudyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadResponses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_study_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Failed to load responses:', error);
      toast({ title: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResponses();
  }, []);

  // Calculate statistics
  const totalResponses = responses.length;
  const uniqueParticipants = new Set(responses.map(r => r.user_id)).size;
  const avgAuthenticityRating = responses.length > 0
    ? (responses.reduce((acc, r) => acc + r.authenticity_rating, 0) / responses.length).toFixed(1)
    : '0';

  // Parse feedback JSON to extract detailed data
  const parsedResponses = responses.map(r => {
    let parsed: ParsedFeedback = {};
    try {
      if (r.feedback) {
        parsed = JSON.parse(r.feedback);
      }
    } catch (e) {
      // feedback is plain text
    }
    return { ...r, parsed };
  });

  // Calculate preference statistics
  const amapianorizedPreferred = parsedResponses.filter(r => r.parsed.preferredActual === 'amapianorized').length;
  const baselinePreferred = parsedResponses.filter(r => r.parsed.preferredActual === 'baseline').length;
  const preferenceRate = totalResponses > 0 
    ? ((amapianorizedPreferred / totalResponses) * 100).toFixed(1)
    : '0';

  // Experience breakdown
  const experienceBreakdown = responses.reduce((acc, r) => {
    const exp = r.producer_experience || 'unknown';
    acc[exp] = (acc[exp] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Familiarity breakdown
  const familiarityBreakdown = responses.reduce((acc, r) => {
    const fam = r.familiarity_with_amapiano || 'unknown';
    acc[fam] = (acc[fam] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Export as JSON
  const exportJSON = () => {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalResponses,
        uniqueParticipants,
        avgAuthenticityRating,
        amapianorizedPreferenceRate: preferenceRate + '%'
      },
      statistics: {
        experienceBreakdown,
        familiarityBreakdown,
        preferenceStats: {
          amapianorizedPreferred,
          baselinePreferred,
          total: totalResponses
        }
      },
      responses: parsedResponses.map(r => ({
        id: r.id,
        userId: r.user_id,
        baselineAudioUrl: r.baseline_audio_url,
        amapianorizedAudioUrl: r.amapianorized_audio_url,
        authenticityRating: r.authenticity_rating,
        producerExperience: r.producer_experience,
        familiarityWithAmapiano: r.familiarity_with_amapiano,
        createdAt: r.created_at,
        ...r.parsed
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-study-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "JSON exported successfully!" });
  };

  // Export as CSV
  const exportCSV = () => {
    const headers = [
      'Response ID',
      'User ID',
      'Baseline Audio URL',
      'Amapianorized Audio URL',
      'Authenticity Rating',
      'Producer Experience',
      'Familiarity with Amapiano',
      'Pair ID',
      'Region',
      'Baseline Rating',
      'Amapianorized Rating',
      'Preferred Track',
      'Track Order',
      'User Feedback',
      'Role',
      'Created At'
    ];

    const rows = parsedResponses.map(r => [
      r.id,
      r.user_id,
      r.baseline_audio_url,
      r.amapianorized_audio_url,
      r.authenticity_rating,
      r.producer_experience,
      r.familiarity_with_amapiano,
      r.parsed.pairId || '',
      r.parsed.region || '',
      r.parsed.baselineRating || '',
      r.parsed.amapianorizedRating || '',
      r.parsed.preferredActual || '',
      r.parsed.trackOrder || '',
      (r.parsed.userFeedback || '').replace(/,/g, ';').replace(/\n/g, ' '),
      r.parsed.role || '',
      r.created_at
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-study-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported successfully!" });
  };

  const targetParticipants = 25;
  const progressToTarget = Math.min((uniqueParticipants / targetParticipants) * 100, 100);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-2">PhD Research</Badge>
            <h1 className="text-3xl font-bold">User Study Analytics</h1>
            <p className="text-muted-foreground">Export and analyze A/B listening test results</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadResponses} variant="outline" size="sm">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Progress to Target */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recruitment Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>{uniqueParticipants} of {targetParticipants} participants</span>
              <span>{progressToTarget.toFixed(0)}%</span>
            </div>
            <Progress value={progressToTarget} />
            {progressToTarget >= 100 ? (
              <Badge className="bg-green-500">Target Reached! 🎉</Badge>
            ) : (
              <p className="text-sm text-muted-foreground">
                Need {targetParticipants - uniqueParticipants} more participants
              </p>
            )}
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{uniqueParticipants}</div>
                  <div className="text-sm text-muted-foreground">Participants</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{totalResponses}</div>
                  <div className="text-sm text-muted-foreground">Total Responses</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{avgAuthenticityRating}</div>
                  <div className="text-sm text-muted-foreground">Avg Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{preferenceRate}%</div>
                  <div className="text-sm text-muted-foreground">Prefer Enhanced</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breakdowns */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Experience Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(experienceBreakdown).map(([exp, count]) => (
                <div key={exp} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{exp.replace('-', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(count / totalResponses) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(experienceBreakdown).length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Amapiano Familiarity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(familiarityBreakdown).map(([fam, count]) => (
                <div key={fam} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{fam.replace('-', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(count / totalResponses) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(familiarityBreakdown).length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preference Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Track Preference Analysis</CardTitle>
            <CardDescription>
              Which tracks do participants prefer as more authentically Amapiano?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Amapianorized (Enhanced)</span>
                  <span className="text-sm">{amapianorizedPreferred} ({preferenceRate}%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4">
                  <div 
                    className="bg-green-500 h-4 rounded-full transition-all" 
                    style={{ width: `${parseFloat(preferenceRate)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Baseline (Original)</span>
                  <span className="text-sm">{baselinePreferred} ({(100 - parseFloat(preferenceRate)).toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4">
                  <div 
                    className="bg-blue-500 h-4 rounded-full transition-all" 
                    style={{ width: `${100 - parseFloat(preferenceRate)}%` }}
                  />
                </div>
              </div>
            </div>
            {totalResponses > 0 && parseFloat(preferenceRate) > 50 && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Participants prefer the Amapianorized version {(parseFloat(preferenceRate) - 50).toFixed(1)}% more than baseline, 
                  supporting the hypothesis that AI enhancement improves perceived authenticity.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download study data for statistical analysis (SPSS, R, Python)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={exportJSON} variant="outline" className="flex-1 min-w-[200px]">
                <FileJson className="mr-2 h-4 w-4" />
                Export as JSON
              </Button>
              <Button onClick={exportCSV} variant="outline" className="flex-1 min-w-[200px]">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as CSV
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              CSV format is compatible with Excel, Google Sheets, SPSS, and R. 
              JSON includes full metadata and nested feedback data.
            </p>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild>
            <a href="/study-recruitment">Recruit More Participants</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/user-study">Take the Study</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
