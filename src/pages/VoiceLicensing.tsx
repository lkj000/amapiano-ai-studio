import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  Upload, 
  DollarSign, 
  Users, 
  Play, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Music,
  Globe
} from 'lucide-react';

interface VoiceLicensingProps {
  user: User | null;
}

interface VoiceModel {
  id: string;
  artist_name: string;
  voice_name: string;
  description: string | null;
  voice_type: string;
  gender: string | null;
  language_codes: string[];
  genre_specialization: string[];
  revenue_share_percentage: number;
  is_premium: boolean;
  premium_fee_cents: number;
  preview_audio_url: string | null;
  quality_score: number | null;
  training_hours: number | null;
  sample_count: number;
}

interface LicenseRequest {
  id: string;
  artist_name: string;
  artist_email: string;
  status: string;
  created_at: string;
  voice_type: string;
  preferred_license_type: string;
}

const VoiceLicensing = ({ user }: VoiceLicensingProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('browse');
  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>([]);
  const [myRequests, setMyRequests] = useState<LicenseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // License request form state
  const [artistName, setArtistName] = useState('');
  const [artistEmail, setArtistEmail] = useState('');
  const [voiceType, setVoiceType] = useState('singing');
  const [preferredLicenseType, setPreferredLicenseType] = useState('revenue_share');
  const [minimumShare, setMinimumShare] = useState('15');
  const [sampleDescription, setSampleDescription] = useState('');
  const [languages, setLanguages] = useState<string[]>(['zu', 'en']);
  const [genres, setGenres] = useState<string[]>(['amapiano']);
  const [socialLinks, setSocialLinks] = useState({ instagram: '', tiktok: '', youtube: '' });

  useEffect(() => {
    loadVoiceModels();
    if (user) {
      loadMyRequests();
    }
  }, [user]);

  const loadVoiceModels = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_models')
        .select('*')
        .eq('is_active', true)
        .eq('is_public', true)
        .eq('approval_status', 'approved')
        .order('artist_name');

      if (error) throw error;
      setVoiceModels(data || []);
    } catch (error) {
      console.error('Error loading voice models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyRequests = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('voice_license_requests')
        .select('*')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleSubmitRequest = async () => {
    if (!user) {
      toast({ title: 'Please sign in', description: 'You need to be signed in to submit a license request', variant: 'destructive' });
      return;
    }

    if (!artistName || !artistEmail) {
      toast({ title: 'Missing fields', description: 'Please fill in artist name and email', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('voice_license_requests')
        .insert({
          requester_id: user.id,
          artist_name: artistName,
          artist_email: artistEmail,
          voice_type: voiceType,
          preferred_license_type: preferredLicenseType,
          minimum_revenue_share: parseFloat(minimumShare),
          sample_description: sampleDescription,
          languages: languages,
          genre_specialization: genres,
          social_links: socialLinks,
        });

      if (error) throw error;

      toast({ title: 'Request submitted!', description: 'We\'ll review your application and get back to you soon.' });
      
      // Reset form
      setArtistName('');
      setArtistEmail('');
      setSampleDescription('');
      
      // Reload requests
      loadMyRequests();
      setActiveTab('my-requests');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({ title: 'Error', description: 'Failed to submit request', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      submitted: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Clock className="w-3 h-3" /> },
      under_review: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <AlertCircle className="w-3 h-3" /> },
      approved: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <CheckCircle className="w-3 h-3" /> },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <AlertCircle className="w-3 h-3" /> },
      contract_sent: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <FileText className="w-3 h-3" /> },
    };
    const config = statusConfig[status] || statusConfig.submitted;
    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Voice Licensing
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            License your voice for AI music generation and earn revenue share on every track created with your voice model.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <Mic className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{voiceModels.length}</div>
              <div className="text-sm text-gray-400">Voice Models</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-pink-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">50+</div>
              <div className="text-sm text-gray-400">Licensed Artists</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">15-25%</div>
              <div className="text-sm text-gray-400">Revenue Share</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">R500K+</div>
              <div className="text-sm text-gray-400">Paid to Artists</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-800/50">
            <TabsTrigger value="browse">Browse Voices</TabsTrigger>
            <TabsTrigger value="license">License Your Voice</TabsTrigger>
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          </TabsList>

          {/* Browse Voices Tab */}
          <TabsContent value="browse">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4" />
                <p className="text-gray-400">Loading voice models...</p>
              </div>
            ) : voiceModels.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Mic className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Voice Models Yet</h3>
                  <p className="text-gray-400 mb-4">Be the first to license your voice and start earning!</p>
                  <Button onClick={() => setActiveTab('license')} className="bg-purple-600 hover:bg-purple-700">
                    License Your Voice
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {voiceModels.map((voice) => (
                  <Card key={voice.id} className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                          <Mic className="w-6 h-6 text-purple-400" />
                        </div>
                        {voice.is_premium && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            Premium
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-1">{voice.artist_name}</h3>
                      <p className="text-sm text-purple-400 mb-3">{voice.voice_name}</p>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{voice.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-400">{voice.language_codes?.join(', ').toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Music className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-400">{voice.genre_specialization?.join(', ')}</span>
                        </div>
                        {voice.quality_score && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Quality:</span>
                            <Progress value={voice.quality_score * 100} className="flex-1 h-2" />
                            <span className="text-gray-400">{(voice.quality_score * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm" className="border-gray-600">
                          <Play className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          Use Voice
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* License Your Voice Tab */}
          <TabsContent value="license">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Benefits */}
              <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    Why License Your Voice?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white">Passive Income</h4>
                      <p className="text-sm text-gray-400">Earn 15-25% revenue share on every track created with your voice</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white">IP Protection</h4>
                      <p className="text-sm text-gray-400">Your voice is protected with DRM and watermarking technology</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white">Transparent Tracking</h4>
                      <p className="text-sm text-gray-400">Real-time dashboard showing all usage and earnings</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white">Global Reach</h4>
                      <p className="text-sm text-gray-400">Your voice reaches producers worldwide through AURA X</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Application Form */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Apply to License Your Voice</CardTitle>
                  <CardDescription>Fill out this form to start the licensing process</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="artistName">Artist Name *</Label>
                      <Input
                        id="artistName"
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
                        placeholder="Your stage name"
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistEmail">Email *</Label>
                      <Input
                        id="artistEmail"
                        type="email"
                        value={artistEmail}
                        onChange={(e) => setArtistEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Voice Type</Label>
                      <Select value={voiceType} onValueChange={setVoiceType}>
                        <SelectTrigger className="bg-gray-900/50 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="singing">Singing</SelectItem>
                          <SelectItem value="speaking">Speaking</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>License Type</Label>
                      <Select value={preferredLicenseType} onValueChange={setPreferredLicenseType}>
                        <SelectTrigger className="bg-gray-900/50 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="revenue_share">Revenue Share</SelectItem>
                          <SelectItem value="flat_fee">Flat Fee</SelectItem>
                          <SelectItem value="exclusive">Exclusive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Revenue Share (%)</Label>
                    <Input
                      type="number"
                      min="10"
                      max="50"
                      value={minimumShare}
                      onChange={(e) => setMinimumShare(e.target.value)}
                      className="bg-gray-900/50 border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Social Links (optional)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Instagram"
                        value={socialLinks.instagram}
                        onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                        className="bg-gray-900/50 border-gray-600 text-sm"
                      />
                      <Input
                        placeholder="TikTok"
                        value={socialLinks.tiktok}
                        onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                        className="bg-gray-900/50 border-gray-600 text-sm"
                      />
                      <Input
                        placeholder="YouTube"
                        value={socialLinks.youtube}
                        onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                        className="bg-gray-900/50 border-gray-600 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tell us about your voice</Label>
                    <Textarea
                      value={sampleDescription}
                      onChange={(e) => setSampleDescription(e.target.value)}
                      placeholder="Describe your vocal style, range, languages you sing in, notable tracks..."
                      className="bg-gray-900/50 border-gray-600 min-h-[100px]"
                    />
                  </div>

                  <Button 
                    onClick={handleSubmitRequest} 
                    disabled={isSubmitting || !user}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>

                  {!user && (
                    <p className="text-sm text-yellow-400 text-center">
                      Please sign in to submit a license request
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Requests Tab */}
          <TabsContent value="my-requests">
            {!user ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Sign In Required</h3>
                  <p className="text-gray-400">Please sign in to view your license requests</p>
                </CardContent>
              </Card>
            ) : myRequests.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Requests Yet</h3>
                  <p className="text-gray-400 mb-4">You haven't submitted any voice licensing requests</p>
                  <Button onClick={() => setActiveTab('license')} className="bg-purple-600 hover:bg-purple-700">
                    Submit Your First Request
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <Card key={request.id} className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{request.artist_name}</h3>
                          <p className="text-sm text-gray-400">{request.artist_email}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="border-gray-600 text-gray-400">
                              {request.voice_type}
                            </Badge>
                            <Badge variant="outline" className="border-gray-600 text-gray-400">
                              {request.preferred_license_type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(request.status)}
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VoiceLicensing;
