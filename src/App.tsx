import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { Auth } from "./pages/Auth";
import AuraPlatform from "./pages/AuraPlatform";
import AIHub from "./pages/AIHub";
import CreatorHub from "./pages/CreatorHub";
import SocialFeed from "./pages/SocialFeed";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
              <Route path="/generate" element={<Generate user={user} />} />
              <Route path="/analyze" element={<Analyze user={user} />} />
              <Route path="/samples" element={<Samples user={user} />} />
              <Route path="/patterns" element={<Patterns user={user} />} />
              <Route path="/daw" element={<DAW user={user} />} />
              <Route path="/aura" element={<AuraPlatform user={user} />} />
              <Route path="/ai-hub" element={<AIHub user={user} />} />
              <Route path="/social" element={<SocialFeed user={user} />} />
              <Route path="/creator-hub" element={<CreatorHub user={user} />} />
              <Route path="/subscription" element={<Index user={user} showSubscription={true} />} />
              <Route path="/marketplace" element={<Index user={user} showMarketplace={true} />} />
              <Route path="/subscription-success" element={<Index user={user} />} />
              <Route path="/purchase-success" element={<Index user={user} />} />
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
