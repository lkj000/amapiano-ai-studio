import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Modal URL - will need to be updated when you deploy your Modal backend
const MODAL_URL = Deno.env.get("MODAL_BACKEND_URL") || "https://mabgwej--aura-x-backend-fastapi-app.modal.run";

// Development mode flag - DISABLED: Always use real Modal backend
const DEV_MODE = false;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, genre = "amapiano", bpm = 118, duration = 30, key = "Am", mood = "energetic" } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[modal-generate] Calling Modal GPU backend with prompt: "${prompt.substring(0, 50)}..."`);
    console.log(`[modal-generate] Parameters: genre=${genre}, bpm=${bpm}, duration=${duration}s, key=${key}, mood=${mood}`);

    const startTime = Date.now();

    // Try to call Modal backend
    try {
      const response = await fetch(`${MODAL_URL}/audio/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          genre,
          bpm,
          duration,
          key,
          mood,
        }),
      });

      const processingTime = Date.now() - startTime;

      if (response.ok) {
        const result = await response.json();
        console.log(`[modal-generate] Success in ${processingTime}ms: audio_url=${result.audio_url?.substring(0, 50)}...`);

        return new Response(
          JSON.stringify({
            ...result,
            processing_time_ms: processingTime,
            infrastructure: "modal-gpu"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If Modal backend fails and we're in dev mode, return mock response
      if (DEV_MODE) {
        console.log(`[modal-generate] Modal backend unavailable (${response.status}), returning development mock response`);
        return generateMockResponse(prompt, genre, bpm, duration, key, mood, processingTime);
      }

      const errorText = await response.text();
      console.error(`[modal-generate] Modal error: ${response.status}`, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Modal GPU backend is not available. Please deploy your Modal backend or enable development mode.`,
          details: `Status: ${response.status}`,
          hint: "To deploy a Modal backend, follow the instructions in docs/MODAL_ARCHITECTURE.md"
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (fetchError) {
      // Network error reaching Modal - return mock in dev mode
      if (DEV_MODE) {
        const processingTime = Date.now() - startTime;
        console.log(`[modal-generate] Network error reaching Modal, returning development mock response`);
        return generateMockResponse(prompt, genre, bpm, duration, key, mood, processingTime);
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("[modal-generate] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Generate a mock response for development/testing
function generateMockResponse(
  prompt: string,
  genre: string,
  bpm: number,
  duration: number,
  key: string,
  mood: string,
  processingTime: number
) {
  // Generate a unique ID based on prompt
  const trackId = crypto.randomUUID();
  
  // Use a sample audio URL for development (royalty-free sample)
  const sampleAudioUrls = [
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  ];
  
  const audioUrl = sampleAudioUrls[Math.floor(Math.random() * sampleAudioUrls.length)];
  
  // Create track title from prompt
  const title = prompt.length > 40 
    ? prompt.substring(0, 40) + "..." 
    : prompt;

  const mockResult = {
    success: true,
    audio_url: audioUrl,
    track_id: trackId,
    title: title,
    duration: duration,
    bpm: bpm,
    key: key,
    genre: genre,
    mood: mood,
    processing_time_ms: processingTime + Math.floor(Math.random() * 1000) + 500, // Simulate processing time
    infrastructure: "development-mock",
    is_mock: true,
    message: "This is a development mock response. Deploy your Modal backend for real AI generation.",
    metadata: {
      model: "mock-v1",
      quality_score: 0.85 + Math.random() * 0.1,
      timestamp: new Date().toISOString()
    }
  };

  console.log(`[modal-generate] Mock response generated: track_id=${trackId}`);

  return new Response(
    JSON.stringify(mockResult),
    { headers: { 
      ...corsHeaders, 
      "Content-Type": "application/json" 
    }}
  );
}
