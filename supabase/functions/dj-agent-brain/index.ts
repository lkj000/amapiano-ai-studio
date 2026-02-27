import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tracks, config, planScores } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context from real track analysis data
    const trackSummary = tracks.map((t: any, i: number) => 
      `${i + 1}. "${t.title}" by ${t.artist || 'Unknown'} — ${t.bpm?.toFixed(1)} BPM, Key: ${t.key} (${t.camelot}), Energy: ${(t.avgEnergy * 100).toFixed(0)}%, LUFS: ${t.lufs?.toFixed(1)}, Duration: ${Math.round(t.durationSec)}s`
    ).join('\n');

    const systemPrompt = `You are the AURA-X Level-5 DJ Agent — an autonomous music performance intelligence.

You analyze real audio features (BPM, key/Camelot, energy curves, vocal activity, segments) to make intelligent DJ set decisions.

Your job is to provide:
1. A narrative rationale for the set order (why this arc works)
2. Specific transition recommendations between each pair with reasoning
3. Where to use Extend (create longer blend zones), Mashup (vocal/drum swaps), or Bridge sections
4. Energy storytelling notes (where the crowd should feel what)

Be specific to the actual BPM, key, and energy data. Reference Camelot wheel compatibility. 
Note any harmonic clashes and suggest pitch-shift if needed.
For Amapiano presets, reference log-drum intensity, pad layering, and percussion density.`;

    const userPrompt = `Generate a DJ set performance plan.

PRESET: ${config.preset}
DURATION: ${config.duration} minutes
RISK: ${(config.risk * 100).toFixed(0)}% (${config.risk <= 0.3 ? 'Safe/harmonic' : config.risk <= 0.6 ? 'Balanced' : 'Wild/creative'})
HARMONIC STRICTNESS: ${(config.harmonicStrictness * 100).toFixed(0)}%
MAX BPM DELTA: ±${config.maxBpmDelta} BPM
VOCAL MASHUPS: ${config.allowVocalOverlay ? 'Allowed' : 'Avoid'}

TRACK POOL (${tracks.length} tracks with real analysis):
${trackSummary}

ALGORITHMIC SCORES:
- Harmonic Compatibility: ${planScores?.harmonicClash || 'N/A'}%
- Tempo Consistency: ${planScores?.tempoJump || 'N/A'}%
- Energy Flow: ${planScores?.energySmoothness || 'N/A'}%
- Overall: ${planScores?.overall || 'N/A'}%

Provide your DJ direction: narrative arc, transition-by-transition notes, and any Extend/Mashup/Bridge recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted — please top up in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("[dj-agent-brain] AI error:", status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the response back
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("[dj-agent-brain] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
