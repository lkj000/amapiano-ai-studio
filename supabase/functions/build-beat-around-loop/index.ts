import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AIML_API_URL = "https://api.aimlapi.com/v2/generate/audio";

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function setupError(message: string, providerCode?: number) {
  return json(
    {
      success: false,
      requiresSetup: true,
      provider: "aimlapi",
      providerCode,
      error: message,
      message,
    },
    200
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      loopName,
      loopType,
      style,
      prompt,
      bpm,
      key,
      duration,
      preserveLoop,
      blendAmount,
      addDrums,
      addBass,
      addMelody,
      addVocals,
      taskId,
    } = await req.json();

    console.log("[BUILD-BEAT] Request:", {
      loopName,
      loopType,
      style,
      bpm,
      key,
      duration,
      taskId,
    });

    const AIML_API_KEY = Deno.env.get("AIML_API_KEY");
    if (!AIML_API_KEY) {
      return setupError(
        "AIML_API_KEY not configured. Add your AIML API key from https://aimlapi.com",
        0
      );
    }

    // If polling for existing task
    if (taskId) {
      console.log("[BUILD-BEAT] Polling task status:", taskId);

      const statusResponse = await fetch(
        `https://api.aimlapi.com/v2/generate/audio/${taskId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${AIML_API_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error(
          "[BUILD-BEAT] Task status error:",
          statusResponse.status,
          errorText
        );

        if (statusResponse.status === 401 || statusResponse.status === 403) {
          return setupError(
            "AIML API rejected your API key. Please check your AIML_API_KEY.",
            statusResponse.status
          );
        }

        throw new Error(`Failed to get task status: ${statusResponse.status}`);
      }

      const statusResult = await statusResponse.json();
      console.log("[BUILD-BEAT] Task status response:", JSON.stringify(statusResult));

      // Check if generation completed
      if (statusResult.status === "completed" || statusResult.status === "success") {
        const audioUrl = statusResult.audio_url || statusResult.url || statusResult.audio?.[0]?.url;
        
        if (audioUrl) {
          return json({
            audioUrl,
            imageUrl: statusResult.image_url || null,
            metadata: {
              title: statusResult.title || `${loopName} - AI Beat`,
              duration: statusResult.duration || duration,
              bpm,
              key,
              genre: style,
              source: "aimlapi",
            },
          });
        }
      }

      // Check for failure
      if (statusResult.status === "failed" || statusResult.status === "error") {
        throw new Error(
          "Generation failed: " + (statusResult.error || statusResult.message || "Unknown error")
        );
      }

      // Still processing
      return json({
        pending: true,
        status: statusResult.status || "processing",
        taskId,
      });
    }

    // Build the generation prompt
    const elements: string[] = [];
    if (addDrums) elements.push("powerful drums");
    if (addBass) elements.push("deep bassline");
    if (addMelody) elements.push("melodic elements");
    if (addVocals) elements.push("vocal hooks");

    const fullPrompt = `Build a complete ${style} beat around this ${loopType}. ${prompt || ""}. Add ${elements.join(
      ", "
    )}. BPM: ${bpm}. Key: ${key}. ${
      preserveLoop
        ? "Preserve and highlight the original loop."
        : "Transform the loop creatively."
    } Blend amount: ${blendAmount}%`;

    console.log("[BUILD-BEAT] Generation prompt:", fullPrompt);

    // Use minimax-music model for instrumental generation
    const requestBody = {
      model: addVocals ? "minimax-music" : "minimax-music",
      prompt: fullPrompt.substring(0, 2000),
      reference_audio_url: null,
    };

    console.log("[BUILD-BEAT] AIML API request body:", JSON.stringify(requestBody));

    const response = await fetch(AIML_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIML_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[BUILD-BEAT] API error:", response.status, errorText);

      if (response.status === 401 || response.status === 403) {
        return setupError(
          "AIML API rejected your API key. Please check your AIML_API_KEY.",
          response.status
        );
      }

      if (response.status === 402) {
        return setupError(
          "AIML API requires credits. Please add credits at https://aimlapi.com",
          response.status
        );
      }

      throw new Error(`AIML API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("[BUILD-BEAT] AIML API response:", JSON.stringify(result));

    // Async task response (AIML returns generation_id for polling)
    if (result.id || result.generation_id) {
      const generationId = result.id || result.generation_id;
      console.log("[BUILD-BEAT] Task submitted, generationId:", generationId);
      return json({ pending: true, taskId: generationId });
    }

    // Direct response with audio URL
    const audioUrl = result.audio_url || result.url || result.audio?.[0]?.url;
    if (audioUrl) {
      return json({
        audioUrl,
        imageUrl: result.image_url || null,
        metadata: {
          title: result.title || `${loopName} - AI Beat`,
          duration: result.duration || duration,
          bpm,
          key,
          genre: style,
          source: "aimlapi",
        },
      });
    }

    throw new Error("Unexpected response format from AIML API: " + JSON.stringify(result));
  } catch (error) {
    console.error("[BUILD-BEAT] Error:", error);
    return json(
      {
        error: error instanceof Error ? error.message : "Failed to build beat",
      },
      500
    );
  }
});
