import React, { useState, useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import Navigation from "./components/Navigation";
import LoadingSpinner from "./components/LoadingSpinner";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load all other pages for code splitting
const Generate = lazy(() => import("./pages/Generate"));
const Analyze = lazy(() => import("./pages/Analyze"));
const Samples = lazy(() => import("./pages/Samples"));
const Patterns = lazy(() => import("./pages/Patterns"));
const DAW = lazy(() => import("./pages/DAW"));
const TemplatesShowcase = lazy(() => import("./pages/TemplatesShowcase"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin").then(m => ({ default: m.Admin })));
const AuraPlatform = lazy(() => import("./pages/AuraPlatform"));
const Aura808Demo = lazy(() => import("./pages/Aura808Demo"));
const AIHub = lazy(() => import("./pages/AIHub"));
const CreatorHub = lazy(() => import("./pages/CreatorHub"));
const SocialFeed = lazy(() => import("./pages/SocialFeed"));
const VASTDemo = lazy(() => import("./pages/VASTDemo"));
const Research = lazy(() => import("./pages/Research"));
const EssentiaDemo = lazy(() => import("./pages/EssentiaDemo"));
const PluginDev = lazy(() => import("./pages/PluginDev"));
const AudioEditor = lazy(() => import("./pages/AudioEditor"));
const Performance = lazy(() => import("./pages/Performance"));
const Amapianorize = lazy(() => import("./pages/Amapianorize"));
const AudioTestLab = lazy(() => import("./pages/AudioTestLab"));
const WorkflowValidation = lazy(() => import("./pages/WorkflowValidation"));
const UserStudy = lazy(() => import("./pages/UserStudy"));
const StudyRecruitment = lazy(() => import("./pages/StudyRecruitment"));
const StudyAnalytics = lazy(() => import("./pages/StudyAnalytics"));
const ABPairGenerator = lazy(() => import("./pages/ABPairGenerator"));
const AgentDemo = lazy(() => import("./pages/AgentDemo"));
const Level5Dashboard = lazy(() => import("./pages/Level5Dashboard"));
const MLQuantize = lazy(() => import("./pages/MLQuantize"));
const ModalDashboard = lazy(() => import("./pages/ModalDashboard"));
const SunoGenerator = lazy(() => import("./pages/SunoGenerator"));
const ElevenLabsSinging = lazy(() => import("./pages/ElevenLabsSinging"));
const InstrumentalGenerator = lazy(() => import("./pages/InstrumentalGenerator"));
const DJAgent = lazy(() => import("./pages/DJAgent"));
const BackingWithIntro = lazy(() => import("./pages/BackingWithIntro"));
const AILyricsGeneratorPage = lazy(() => import("./pages/AILyricsGeneratorPage"));
const StemSplitterPage = lazy(() => import("./pages/StemSplitterPage"));
const VocalRemoverPage = lazy(() => import("./pages/VocalRemoverPage"));
const SoundEffectPage = lazy(() => import("./pages/SoundEffectPage"));
const SunoStudioPage = lazy(() => import("./pages/SunoStudioPage"));
const TrainingDataCollection = lazy(() => import("./pages/TrainingDataCollection"));
const AuraXHub = lazy(() => import("./pages/AuraXHub"));
const AuraXArchitecture = lazy(() => import("./pages/AuraXArchitecture"));
const VoiceLicensing = lazy(() => import("./pages/VoiceLicensing"));
const TextToProduction = lazy(() => import("./pages/TextToProduction"));
const TrainingDataset = lazy(() => import("./pages/TrainingDataset"));
const VoiceLab = lazy(() => import("./pages/VoiceLab"));
const AudioLab = lazy(() => import("./pages/AudioLab"));
// Studio and AmapianoPro consolidated — redirect to DAW
const LANDRHub = lazy(() => import("./pages/LANDRHub"));
const AWSActivatePitchDeck = lazy(() => import("./pages/AWSActivatePitchDeck"));
const PitchDeckComparison = lazy(() => import("./pages/PitchDeckComparison"));
const MasteringStudio = lazy(() => import("./pages/MasteringStudio"));
const ReleaseManager = lazy(() => import("./pages/ReleaseManager"));
const PromotionHub = lazy(() => import("./pages/PromotionHub"));
const RhythmDemo = lazy(() => import("./pages/RhythmDemo"));
// AmapianoPro consolidated into DAW
const AdminInventory = lazy(() => import("./pages/AdminInventory"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session ? 'Session active' : 'No session');
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh token every 50 minutes (tokens expire after 1 hour)
  useEffect(() => {
    if (!session) return;

    const refreshInterval = setInterval(async () => {
      console.log('Attempting to refresh session token...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Token refresh failed:', error);
      } else if (data.session) {
        console.log('Token refreshed successfully');
        setSession(data.session);
        setUser(data.session.user);
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(refreshInterval);
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navigation user={user} />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Eager loaded routes */}
                <Route path="/" element={<Index user={user} />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Lazy loaded routes */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/templates" element={<TemplatesShowcase />} />
                <Route path="/generate" element={<Generate user={user} />} />
                <Route path="/analyze" element={<Analyze user={user} />} />
                <Route path="/samples" element={<Samples user={user} />} />
                <Route path="/patterns" element={<Patterns user={user} />} />
                <Route path="/daw" element={<DAW user={user} />} />
                <Route path="/aura" element={<AuraPlatform user={user} />} />
                <Route path="/aura808" element={<Aura808Demo />} />
                <Route path="/ai-hub" element={<AIHub user={user} />} />
                <Route path="/social" element={<SocialFeed user={user} />} />
                <Route path="/social/post/:id" element={<SocialFeed user={user} />} />
                <Route path="/creator-hub" element={<CreatorHub user={user} />} />
                <Route path="/subscription" element={<Index user={user} showSubscription={true} />} />
                <Route path="/marketplace" element={<Index user={user} showMarketplace={true} />} />
                <Route path="/subscription-success" element={<Index user={user} />} />
                <Route path="/purchase-success" element={<Index user={user} />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/vast-demo" element={<VASTDemo />} />
                <Route path="/research" element={<Research />} />
                <Route path="/essentia-demo" element={<EssentiaDemo />} />
                <Route path="/plugin-dev" element={<PluginDev />} />
                <Route path="/audio-editor" element={<AudioEditor user={user} />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/amapianorize" element={<Amapianorize />} />
                <Route path="/audio-test-lab" element={<AudioTestLab />} />
                <Route path="/workflow-validation" element={<WorkflowValidation />} />
                <Route path="/user-study" element={<UserStudy />} />
                <Route path="/study-recruitment" element={<StudyRecruitment />} />
                <Route path="/study-analytics" element={<StudyAnalytics />} />
                <Route path="/ab-pair-generator" element={<ABPairGenerator />} />
                <Route path="/agent-demo" element={<AgentDemo />} />
                <Route path="/level5-dashboard" element={<Level5Dashboard />} />
                <Route path="/ml/quantize" element={<MLQuantize />} />
                <Route path="/modal-dashboard" element={<ModalDashboard />} />
                <Route path="/generate-song-suno" element={<SunoGenerator user={user} />} />
                <Route path="/generate-song-elevenlabs-singing" element={<ElevenLabsSinging user={user} />} />
                <Route path="/generate-instrumental" element={<InstrumentalGenerator user={user} />} />
                <Route path="/generate-backing-with-intro" element={<BackingWithIntro user={user} />} />
                <Route path="/ai-lyrics-generator" element={<AILyricsGeneratorPage user={user} />} />
                <Route path="/stem-splitter" element={<StemSplitterPage user={user} />} />
                <Route path="/vocal-remover" element={<VocalRemoverPage />} />
                <Route path="/sound-effect" element={<SoundEffectPage />} />
                <Route path="/training" element={<TrainingDataCollection />} />
                <Route path="/aura-x" element={<AuraXHub />} />
                <Route path="/aura-x/architecture" element={<AuraXArchitecture />} />
                <Route path="/aura-x/voice-licensing" element={<VoiceLicensing user={user} />} />
                <Route path="/aura-x/text-to-production" element={<TextToProduction user={user} />} />
                <Route path="/training-dataset" element={<TrainingDataset />} />
                <Route path="/voice-lab" element={<VoiceLab />} />
                <Route path="/audio-lab" element={<AudioLab />} />
                <Route path="/studio" element={<Navigate to="/daw" replace />} />
                <Route path="/landr" element={<LANDRHub />} />
                <Route path="/pitch-deck" element={<AWSActivatePitchDeck />} />
                <Route path="/pitch-deck-comparison" element={<PitchDeckComparison />} />
                <Route path="/master" element={<MasteringStudio />} />
                <Route path="/release" element={<ReleaseManager />} />
                <Route path="/promote" element={<PromotionHub />} />
                <Route path="/suno-studio" element={<SunoStudioPage user={user} />} />
                <Route path="/rhythm-demo" element={<RhythmDemo />} />
                <Route path="/amapiano-pro" element={<Navigate to="/daw" replace />} />
                <Route path="/dj-agent" element={<DJAgent user={user} />} />
                <Route path="/admin/inventory" element={<AdminInventory />} />
                <Route path="/aihub" element={<Navigate to="/ai-hub" replace />} />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
