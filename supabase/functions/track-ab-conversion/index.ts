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

    // Store conversion event in the ab_test_results table
    const { error: insertError } = await supabase
      .from('ab_test_results')
      .insert({
        experiment_id: testId,
        variant,
        converted: true,
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
      });

    if (insertError) {
      console.error('Failed to insert conversion record:', insertError);
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log('Conversion recorded for experiment:', testId, 'variant:', variant);

    // Query real stats: count total rows and converted rows per variant for this experiment
    const { data: rows, error: queryError } = await supabase
      .from('ab_test_results')
      .select('variant, converted')
      .eq('experiment_id', testId);

    if (queryError) {
      console.error('Failed to query ab_test_results:', queryError);
      throw new Error(`Database query failed: ${queryError.message}`);
    }

    // Aggregate counts per variant
    const variantStats: Record<string, { total: number; conversions: number }> = {};
    for (const row of rows ?? []) {
      if (!variantStats[row.variant]) {
        variantStats[row.variant] = { total: 0, conversions: 0 };
      }
      variantStats[row.variant].total += 1;
      if (row.converted) {
        variantStats[row.variant].conversions += 1;
      }
    }

    const currentStats = variantStats[variant] ?? { total: 0, conversions: 0 };
    const realConversions = currentStats.conversions;
    const totalExposures = currentStats.total;
    const realConversionRate = totalExposures > 0 ? realConversions / totalExposures : 0;

    // Simple chi-square significance test between control and treatment (if both variants present)
    const controlStats = variantStats['control'] ?? { total: 0, conversions: 0 };
    const treatmentStats = variantStats['treatment'] ?? { total: 0, conversions: 0 };
    let significance = 'insufficient_data';
    let confidence = 0;

    const n1 = controlStats.total;
    const n2 = treatmentStats.total;
    const c1 = controlStats.conversions;
    const c2 = treatmentStats.conversions;

    if (n1 >= 30 && n2 >= 30) {
      // Chi-square test with 2x2 contingency table
      const total = n1 + n2;
      const totalConversions = c1 + c2;
      const totalNonConversions = total - totalConversions;
      // Expected values
      const e11 = (n1 * totalConversions) / total;
      const e12 = (n1 * totalNonConversions) / total;
      const e21 = (n2 * totalConversions) / total;
      const e22 = (n2 * totalNonConversions) / total;
      // Chi-square statistic (Yates' correction for small cells)
      const chiSquare =
        Math.pow(Math.abs(c1 - e11) - 0.5, 2) / e11 +
        Math.pow(Math.abs((n1 - c1) - e12) - 0.5, 2) / e12 +
        Math.pow(Math.abs(c2 - e21) - 0.5, 2) / e21 +
        Math.pow(Math.abs((n2 - c2) - e22) - 0.5, 2) / e22;
      // Critical value for p < 0.05 with 1 degree of freedom is 3.841
      // Critical value for p < 0.01 is 6.635
      if (chiSquare >= 6.635) {
        significance = 'significant';
        confidence = 0.99;
      } else if (chiSquare >= 3.841) {
        significance = 'significant';
        confidence = 0.95;
      } else {
        significance = 'not_significant';
        // Approximate confidence from chi-square: p-value approximation
        confidence = Math.min(0.94, chiSquare / 3.841 * 0.95);
      }
    }

    const analytics = {
      testId,
      variant,
      conversions: realConversions,
      totalExposures,
      conversionRate: realConversionRate,
      significance,
      confidence,
      sampleSizes: { control: n1, treatment: n2 }
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