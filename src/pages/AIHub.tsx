import React from 'react';
import { User } from '@supabase/supabase-js';
import { AIAssistantHub } from '@/components/AIAssistantHub';

interface AIHubProps {
  user: User | null;
}

export default function AIHub({ user }: AIHubProps) {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">AI Assistant Hub</h1>
          <p className="text-lg text-muted-foreground">
            Access all AI-powered features for amapiano music production in one centralized hub.
          </p>
        </div>
        
        <AIAssistantHub
          user={user}
          onTrackGenerated={(track) => {
            console.log('Track generated:', track);
          }}
          onEffectAdded={(effectName) => {
            console.log('Effect added:', effectName);
          }}
        />
      </div>
    </div>
  );
}