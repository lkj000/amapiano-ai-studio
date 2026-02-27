import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompilationRequest {
  code: string;
  pluginName: string;
  framework: 'juce' | 'webaudio';
  parameters: any[];
  optimizationLevel: string;
  enableSIMD?: boolean;
  enableThreads?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: CompilationRequest = await req.json();

    console.log(`[WASM Compiler] Received compilation request for ${request.pluginName}`);
    console.log(`[WASM Compiler] Framework: ${request.framework}, Optimization: ${request.optimizationLevel}`);

    const modalApiUrl = Deno.env.get('MODAL_API_URL');

    if (!modalApiUrl) {
      console.warn('[WASM Compiler] MODAL_API_URL not configured — cannot compile WASM');
      return new Response(
        JSON.stringify({
          error: 'C++ plugin compilation requires the Modal GPU backend. Ensure MODAL_API_URL is configured and the backend is running.',
          requires: 'modal-backend'
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Proxy the compilation request to the Modal backend
    console.log('[WASM Compiler] Proxying to Modal backend:', `${modalApiUrl}/plugin/compile-wasm`);

    let modalResponse: Response;
    try {
      modalResponse = await fetch(`${modalApiUrl}/plugin/compile-wasm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
    } catch (fetchError) {
      console.error('[WASM Compiler] Modal backend unreachable:', fetchError);
      return new Response(
        JSON.stringify({
          error: 'C++ plugin compilation requires the Modal GPU backend. Ensure MODAL_API_URL is configured and the backend is running.',
          requires: 'modal-backend'
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!modalResponse.ok) {
      const errText = await modalResponse.text();
      console.error('[WASM Compiler] Modal backend error:', modalResponse.status, errText);
      return new Response(
        JSON.stringify({
          error: 'C++ plugin compilation requires the Modal GPU backend. Ensure MODAL_API_URL is configured and the backend is running.',
          requires: 'modal-backend'
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const result = await modalResponse.json();
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[WASM Compiler] Request handling failed:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Request handling failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
