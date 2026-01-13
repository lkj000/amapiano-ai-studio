/**
 * LANDR Hub Page
 * Central management for LANDR Pro integration
 * Now also shows integration with the DAW for complete workflow
 */

import React from 'react';
import { LANDRIntegration } from '@/components/integrations/LANDRIntegration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Music2, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LANDRHub() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* DAW Integration Banner */}
        <Card className="mb-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Complete Your Production in the DAW
                    <Badge className="bg-purple-500">Recommended</Badge>
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Master and export your tracks directly from the DAW for a seamless end-to-end workflow
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/daw')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Music2 className="w-4 h-4 mr-2" />
                Open DAW
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <LANDRIntegration />
      </div>
    </div>
  );
}
