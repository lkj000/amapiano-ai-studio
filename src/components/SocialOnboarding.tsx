import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Music, Heart, Share2, Repeat, ArrowUp, ArrowDown, Space, Sparkles } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface SocialOnboardingProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SocialOnboarding: React.FC<SocialOnboardingProps> = ({ user, isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Social Feed!",
      description: "Discover, share, and connect with amapiano creators worldwide",
      icon: Users,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Users className="w-16 h-16 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              Join thousands of amapiano creators sharing their music, remixing tracks, and building a global community around authentic South African sounds.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Navigation Made Simple",
      description: "Learn how to browse the vertical feed",
      icon: ArrowUp,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <ArrowUp className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Scroll up</p>
              <p className="text-xs text-muted-foreground">Previous track</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <ArrowDown className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Scroll down</p>
              <p className="text-xs text-muted-foreground">Next track</p>
            </div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Space className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Spacebar</p>
            <p className="text-xs text-muted-foreground">Pause/Play current track</p>
          </div>
        </div>
      )
    },
    {
      title: "Engage with Content",
      description: "Like, share, and remix tracks you love",
      icon: Heart,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-xs font-medium">Like</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Share2 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-xs font-medium">Share</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Repeat className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-xs font-medium">Remix</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Your interactions help train our AI to show you more content you'll love!
          </p>
        </div>
      )
    },
    {
      title: "AI-Powered Discovery",
      description: "Personalized recommendations based on your preferences",
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Our machine learning algorithms analyze your listening patterns, likes, and interactions to curate a personalized feed just for you.
            </p>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Sparkles className="w-3 h-3 mr-1" />
              Smart Recommendations
            </Badge>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-5 h-5 text-primary" />
            <DialogTitle>{currentStepData.title}</DialogTitle>
          </div>
          <DialogDescription>
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {currentStepData.content}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={prevStep}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={nextStep}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};