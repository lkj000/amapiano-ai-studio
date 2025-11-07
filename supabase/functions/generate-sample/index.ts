import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: "Replicate API key is not configured",
          details: "Please add your REPLICATE_API_KEY in Supabase Edge Function secrets"
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });
    const body = await req.json();
    console.log("Generate sample request:", body);

    // Health check endpoint
    if (body.type === 'health-check') {
      try {
        // Make a minimal API call to verify the key works
        const account = await replicate.accounts.current();
        console.log("Health check successful:", account);
        return new Response(JSON.stringify({ 
          status: 'healthy', 
          message: 'Replicate API key is valid',
          username: account.username 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (healthError: any) {
        console.error("Health check failed:", healthError);
        if (healthError.response?.status === 401) {
          return new Response(JSON.stringify({ 
            status: 'unhealthy',
            error: 'Invalid Replicate API key',
            details: 'The API key is not valid. Please update it in Supabase Edge Function secrets. Get a valid key from https://replicate.com/account/api-tokens',
            hint: 'API tokens should start with "r8_"'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          });
        }
        return new Response(JSON.stringify({ 
          status: 'unhealthy',
          error: healthError.message 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    }

    // Status check for existing prediction
    if (body.predictionId) {
      console.log("Checking status for prediction:", body.predictionId);
      const prediction = await replicate.predictions.get(body.predictionId);
      console.log("Prediction status:", prediction.status);
      if (prediction.status === 'succeeded') {
        console.log("Prediction succeeded with output:", prediction.output);
      } else if (prediction.status === 'failed') {
        console.error("Prediction failed:", prediction.error);
      }
      return new Response(JSON.stringify(prediction), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate new sample based on type
    if (body.type === 'audio') {
      console.log("Generating audio with prompt:", body.prompt, "model:", body.model);
      
      let modelVersion = "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb";
      let modelInput: any = {
        prompt: body.prompt || "Amapiano beat with log drum, piano chords, deep bass, 112 BPM",
        duration: body.duration || 8,
        model_version: "large",
        output_format: "mp3",
        normalization_strategy: "peak"
      };

      if (body.model === 'musicgen-large') {
        modelVersion = "b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38";
        modelInput.model_version = "stereo-large";
      } else if (body.model === 'riffusion') {
        modelVersion = "8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05";
        modelInput = {
          prompt_a: body.prompt || "Amapiano beat",
          denoising: 0.75,
          seed_image_id: "vibes"
        };
      }

      const prediction = await replicate.predictions.create({
        version: modelVersion,
        input: modelInput
      });

      console.log("Audio generation started:", prediction.id);
      return new Response(JSON.stringify(prediction), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.type === 'image') {
      console.log("Generating image with prompt:", body.prompt, "model:", body.model);
      
      // For image generation, we'll use run() for simplicity since images are faster
      let modelId = "black-forest-labs/flux-schnell";
      let modelInput: any = {
        prompt: body.prompt,
        go_fast: true,
        megapixels: "1",
        num_outputs: 1,
        aspect_ratio: body.aspectRatio || "16:9",
        output_format: "webp",
        output_quality: 80,
        num_inference_steps: 4
      };

      if (body.model === 'flux-dev') {
        modelId = "black-forest-labs/flux-dev";
        modelInput.go_fast = false;
        modelInput.num_inference_steps = 28;
      } else if (body.model === 'sdxl') {
        modelId = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";
        modelInput = {
          prompt: body.prompt,
          width: 1024,
          height: 1024,
          num_outputs: 1
        };
      } else if (body.model === 'playground-v2.5') {
        modelId = "playgroundai/playground-v2.5-1024px-aesthetic:a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24";
        modelInput = {
          prompt: body.prompt,
          width: 1024,
          height: 1024
        };
      }

      const output = await replicate.run(modelId, { input: modelInput });

      console.log("Image generation response:", output);
      // Return in prediction format for client compatibility
      return new Response(JSON.stringify({ 
        id: `gen_${Date.now()}`,
        status: 'succeeded',
        output: output
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.type === 'benchmark') {
      console.log("Running benchmark with models:", body.models);
      const models = body.models || [
        "black-forest-labs/flux-schnell", 
        "black-forest-labs/flux-dev",
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        "playgroundai/playground-v2.5-1024px-aesthetic:a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24"
      ];
      
      const benchmarkResults = await Promise.all(
        models.map(async (model: string) => {
          const startTime = Date.now();
          try {
            const output = await replicate.run(model, {
              input: {
                prompt: body.prompt,
                go_fast: true,
                num_outputs: 1,
                aspect_ratio: "1:1"
              }
            });
            const endTime = Date.now();
            return {
              model,
              status: 'success',
              duration: endTime - startTime,
              output
            };
          } catch (error) {
            return {
              model,
              status: 'error',
              error: error.message,
              duration: Date.now() - startTime
            };
          }
        })
      );

      console.log("Benchmark results:", benchmarkResults);
      return new Response(JSON.stringify({ benchmarkResults, type: 'benchmark' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid type. Must be 'audio', 'image', or 'benchmark'" }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );

  } catch (error: any) {
    console.error("Error in generate-sample function:", error);
    
    // Handle specific Replicate API errors
    if (error.response?.status === 401) {
      return new Response(JSON.stringify({ 
        error: "Invalid Replicate API key",
        details: "Your Replicate API key is invalid or expired. Please update it in Supabase Edge Function secrets.",
        hint: "Get a valid API token from https://replicate.com/account/api-tokens (tokens start with 'r8_')"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    
    if (error.response?.status === 402) {
      return new Response(JSON.stringify({ 
        error: "Replicate account payment required",
        details: "Your Replicate account needs payment. Please add credits at https://replicate.com/account/billing"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 402,
      });
    }
    
    if (error.response?.status === 429) {
      return new Response(JSON.stringify({ 
        error: "Replicate rate limit exceeded",
        details: "Too many requests. Please wait a moment and try again."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      });
    }

    if (error.response?.status === 422) {
      let details: any = undefined;
      try {
        const txt = await error.response.text();
        details = txt;
      } catch (_) {}
      return new Response(JSON.stringify({ 
        error: "Invalid input for model",
        details: details || error.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 422,
      });
    }
    
    return new Response(JSON.stringify({ 
      error: error.message || "An unexpected error occurred",
      details: "Check the edge function logs for more information"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
