/**
 * DAWAuthGuard - Authentication check component
 * Displays auth required message for unauthenticated users
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';

interface DAWAuthGuardProps {
  children: React.ReactNode;
  user: { id: string } | null;
}

export const DAWAuthGuard: React.FC<DAWAuthGuardProps> = ({ children, user }) => {
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <Music className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
            <p className="text-gray-400 mb-6">
              You need to sign in to access the DAW and create projects.
            </p>
          </div>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = '/auth'} 
              className="w-full"
            >
              Sign In / Sign Up
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'} 
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DAWAuthGuard;
