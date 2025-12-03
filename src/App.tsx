import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import Navigation from "./components/Navigation";
import Index from "./pages/Index";
import Generate from "./pages/Generate";
import Analyze from "./pages/Analyze";
import Samples from "./pages/Samples";
import Patterns from "./pages/Patterns";
import DAW from "./pages/DAW";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import TemplatesShowcase from "./pages/TemplatesShowcase";
import Profile from "./pages/Profile";
import { Admin } from "./pages/Admin";
import AuraPlatform from "./pages/AuraPlatform";
import Aura808Demo from "./pages/Aura808Demo";
import AIHub from "./pages/AIHub";
import CreatorHub from "./pages/CreatorHub";
import SocialFeed from "./pages/SocialFeed";
import VASTDemo from "./pages/VASTDemo";
import Research from "./pages/Research";
import EssentiaDemo from "./pages/EssentiaDemo";
import PluginDev from "./pages/PluginDev";
import AudioEditor from "./pages/AudioEditor";
import Performance from "./pages/Performance";
import Amapianorize from "./pages/Amapianorize";
import AudioTestLab from "./pages/AudioTestLab";
import WorkflowValidation from "./pages/WorkflowValidation";
import UserStudy from "./pages/UserStudy";
import StudyRecruitment from "./pages/StudyRecruitment";
import StudyAnalytics from "./pages/StudyAnalytics";
import ABPairGenerator from "./pages/ABPairGenerator";

const queryClient = new QueryClient();

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
            <Routes>
              <Route path="/" element={<Index user={user} />} />
              <Route path="/auth" element={<Auth />} />
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
              <Route path="/aihub" element={<Navigate to="/ai-hub" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
