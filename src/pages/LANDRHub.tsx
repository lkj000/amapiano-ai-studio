/**
 * LANDR Hub Page
 * Central management for LANDR Pro integration
 */

import React from 'react';
import { LANDRIntegration } from '@/components/integrations/LANDRIntegration';

export default function LANDRHub() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <LANDRIntegration />
      </div>
    </div>
  );
}
