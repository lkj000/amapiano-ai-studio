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
      throw new Error('REPLICATE_API_KEY is not set');
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });
    const body = await req.json();
    console.log("Generate sample request:", body);

    // Status check for existing prediction
    if (body.predictionId) {
      console.log("Checking status for prediction:", body.predictionId);
      const prediction = await replicate.predictions.get(body.predictionId);
      console.log("Status check response:", prediction);
      return new Response(JSON.stringify(prediction), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate new sample based on type
    if (body.type === 'audio') {
      // Amapiano music generation using MusicGen
      console.log("Generating Amapiano audio with prompt:", body.prompt);
      const output = await replicate.run(
        "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
        {
          input: {
            prompt: body.prompt || "Amapiano beat with log drum, piano chords, deep bass, 112 BPM",
            duration: body.duration || 8,
            model_version: "melody",
            output_format: "mp3",
            normalization_strategy: "peak"
          }
        }
      );

      console.log("Audio generation response:", output);
      return new Response(JSON.stringify({ output, type: 'audio' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.type === 'image') {
      // Visual asset generation using Flux
      console.log("Generating image with prompt:", body.prompt);
      const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        {
          input: {
            prompt: body.prompt,
            go_fast: true,
            megapixels: "1",
            num_outputs: 1,
            aspect_ratio: body.aspectRatio || "16:9",
            output_format: "webp",
            output_quality: 80,
            num_inference_steps: 4
          }
        }
      );

      console.log("Image generation response:", output);
      return new Response(JSON.stringify({ output, type: 'image' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.type === 'benchmark') {
      // Model benchmarking - run multiple models and compare
      console.log("Running benchmark with models:", body.models);
      const models = body.models || ["black-forest-labs/flux-schnell", "black-forest-labs/flux-dev"];
      
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

  } catch (error) {
    console.error("Error in generate-sample function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
