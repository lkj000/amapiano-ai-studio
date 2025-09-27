import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConversionData {
  testId: string;
  variant: 'control' | 'treatment';
  event: string;
  value?: number;
  userId?: string;
  sessionId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { testId, variant, event, value, userId, sessionId }: ConversionData = await req.json();

    console.log('A/B Test Conversion:', { testId, variant, event, value, userId, sessionId });

    // Store conversion data
    const conversionRecord = {
      test_id: testId,
      variant,
      event,
      value: value || null,
      user_id: userId || null,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      metadata: {
        user_agent: req.headers.get('user-agent'),
        referrer: req.headers.get('referer'),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
      }
    };

    // In a real implementation, you would store this in a database
    // For now, we'll just log it and return success
    console.log('Conversion recorded:', conversionRecord);

    // Mock analytics processing
    const analytics = {
      testId,
      variant,
      conversions: Math.floor(Math.random() * 100) + 50,
      conversionRate: Math.random() * 0.3 + 0.1,
      significance: Math.random() > 0.5 ? 'significant' : 'not_significant',
      confidence: Math.random() * 0.4 + 0.6
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conversion tracked successfully',
        analytics
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error) {
    console.error('Error tracking A/B conversion:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to track conversion',
        details: (error as Error).message
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
})