import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APIBOX_BASE_URL = "https://apibox.erweima.ai/api/v1/generate";

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
      provider: "apibox",
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
      audioData,
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

    const SUNO_API_KEY = Deno.env.get("SUNO_API_KEY");
    if (!SUNO_API_KEY) {
      return setupError(
        "SUNO_API_KEY not configured. Add your API.box Suno key from https://apibox.erweima.ai",
        0
      );
    }

    // If polling for existing task
    if (taskId) {
      console.log("[BUILD-BEAT] Polling task status:", taskId);

      const statusResponse = await fetch(
        `https://apibox.erweima.ai/api/v1/generate/record-info?taskId=${taskId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${SUNO_API_KEY}`,
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
            "API.box rejected your SUNO_API_KEY (no access permissions). Please replace it with a valid API.box key and ensure your plan has Suno access.",
            statusResponse.status
          );
        }

        throw new Error(`Failed to get task status: ${statusResponse.status}`);
      }

      const statusResult = await statusResponse.json();

      // API.box-style auth error
      if (statusResult?.code === 401 || statusResult?.code === 403) {
        return setupError(
          statusResult?.msg ||
            "API.box rejected your SUNO_API_KEY (no access permissions).",
          statusResult?.code
        );
      }

      console.log("[BUILD-BEAT] Task status:", statusResult.data?.status);

      // Check if generation completed
      if (
        statusResult.data?.status === "SUCCESS" ||
        statusResult.data?.status === "completed"
      ) {
        const tracks =
          statusResult.data?.response?.sunoData || statusResult.data?.data || [];

        if (tracks.length > 0) {
          const track = tracks[0];
          return json({
            audioUrl: track.audioUrl || track.audio_url,
            imageUrl: track.imageUrl || track.image_url,
            metadata: {
              title: track.title || `${loopName} - AI Beat`,
              duration: track.duration || duration,
              bpm,
              key,
              genre: style,
              source: "apibox-suno-v4",
            },
            allTracks: tracks,
          });
        }
      }

      // Check for failure
      if (statusResult.data?.status === "FAILED" || statusResult.data?.status === "failed") {
        throw new Error(
          "Generation failed: " + (statusResult.data?.errorMessage || "Unknown error")
        );
      }

      // Still processing
      return json({
        pending: true,
        status: statusResult.data?.status || "processing",
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

    const stylePrompt = `${style}, ${bpm} BPM, ${elements.join(", ")}`;

    console.log("[BUILD-BEAT] Generation prompt:", fullPrompt);
    console.log("[BUILD-BEAT] Style:", stylePrompt);

    // NOTE: audioData is currently not sent to API.box, because API.box's V4 endpoint
    // expects text-based generation. We still accept audioData for future provider support.
    void audioData;

    const requestBody = {
      prompt: fullPrompt.substring(0, 3000),
      style: stylePrompt,
      title: loopName || "AI Generated Beat",
      customMode: true,
      instrumental: !addVocals,
      model: "V4",
      callbackUrl: "",
    };

    console.log("[BUILD-BEAT] API request body:", JSON.stringify(requestBody));

    const response = await fetch(APIBOX_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[BUILD-BEAT] API error:", response.status, errorText);

      if (response.status === 401 || response.status === 403) {
        return setupError(
          "API.box rejected your SUNO_API_KEY (no access permissions). Please replace it with a valid API.box key and ensure your plan has Suno access.",
          response.status
        );
      }

      throw new Error(`API.box error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("[BUILD-BEAT] API response:", JSON.stringify(result));

    // API.box-style error response
    if (result?.code && result.code !== 200) {
      if (result.code === 401 || result.code === 403) {
        return setupError(
          result.msg ||
            "API.box rejected your SUNO_API_KEY (no access permissions).",
          result.code
        );
      }

      throw new Error(result.msg || result.message || `API Error: ${result.code}`);
    }

    // Async task response
    if (result.data?.taskId) {
      console.log("[BUILD-BEAT] Task submitted, taskId:", result.data.taskId);
      return json({ pending: true, taskId: result.data.taskId });
    }

    // Direct response (rare)
    const audioUrl = result.data?.audioUrl || result.audio_url;
    if (audioUrl) {
      return json({
        audioUrl,
        imageUrl: result.data?.imageUrl || result.image_url,
        metadata: {
          title: result.data?.title || `${loopName} - AI Beat`,
          duration: result.data?.duration || duration,
          bpm,
          key,
          genre: style,
          source: "apibox-suno-v4",
        },
      });
    }

    throw new Error("Unexpected response format from API.box: " + JSON.stringify(result));
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
