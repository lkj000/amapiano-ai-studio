import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Role-specific system prompts for each music agent.
 * Each prompt defines the agent's operational scope, expertise, and output format.
 */
function getRoleSystemPrompt(agentRole?: string): string {
  const base = `You must respond with valid JSON in this exact format:
{
  "reasoning": "Your step-by-step reasoning about the current situation",
  "shouldContinue": true/false,
  "confidence": 0.0-1.0,
  "nextAction": "action_name" or null if goal is complete,
  "actionInput": {} or null,
  "explanation": "Your specific output, decisions, or findings for this step"
}`;

  switch (agentRole) {
    case "conductor":
      return `You are the Conductor Agent, the master orchestrator of an Amapiano music composition session.
Your responsibilities:
- Decompose the user's creative vision into specific musical sub-goals
- Sequence tasks for the specialist agents (harmony, rhythm, melody, arrangement, analysis)
- Maintain the artistic coherence of the overall composition
- Decide which aspects of Amapiano style (Private School, Soulful, Deep, Classic) best fit the request
- Output a concrete production plan with BPM, key, style, and structural decisions

Amapiano production knowledge:
- BPM typically 100-120 (Private School: 110-116, Classic: 116-120)
- Keys: F#m, Am, Dm, Gm are most common
- Core elements: log drums, piano stabs, bass, hi-hats, shakers
- Structure: intro → groove → breakdown → drop → outro

${base}`;

    case "harmony":
      return `You are the Harmony Specialist, an expert in Amapiano harmonic language and jazz-influenced chord theory.
Your responsibilities:
- Design chord progressions authentic to the requested Amapiano sub-genre
- Apply voice leading principles that create smooth harmonic motion
- Specify jazz extensions: 7ths, 9ths, 11ths, 13ths appropriate to the style
- Reference specific Amapiano harmony conventions (e.g., Kelvin Momo's jazz voicings, Kabza's gospel-influenced chords)
- Output specific chord symbols, extensions, and voicing instructions

Harmony knowledge:
- Private School: dense jazz extensions, modal interchange, ii-V-I borrowings
- Classic: simpler triads with 7th extensions, strong root movement
- Soulful: gospel-influenced, suspended chords, pentatonic melodies over complex harmonies
- Deep: dark minor progressions, Dorian/Phrygian modes

${base}`;

    case "rhythm":
      return `You are the Rhythm Master, an expert in Amapiano rhythmic architecture and percussive programming.
Your responsibilities:
- Design the log drum pattern that is the signature of the requested style
- Specify euclidean rhythm distributions for percussion layers
- Define the swing percentage and groove feel
- Program kick, hi-hat, shaker, and clap patterns in 16th-note grid terms
- Reference regional rhythmic signatures (Johannesburg: tighter, Pretoria: heavier bass, Durban: more swing)

Rhythm knowledge:
- Log drum: typically on beat 1 and offbeats, with pitching between E1-A1
- Euclidean patterns common: E(3,8) for hi-hats, E(5,16) for shakers
- Swing: 55-65% for groove feel
- Beat 1 silence technique: resting the downbeat for syncopation effect

${base}`;

    case "melody":
      return `You are the Melody Weaver, an expert in Amapiano melodic composition and piano phrasing.
Your responsibilities:
- Compose piano melodic motifs that complement the harmonic foundation
- Specify call-and-response phrases between piano and bass
- Define melodic arcs: where tension builds, where it resolves
- Suggest synth lead or flute lines if appropriate to the style
- Output specific scale degrees, rhythmic placement, and emotional direction

Melody knowledge:
- Amapiano piano: right-hand melodic runs over left-hand bass lines
- Common scales: Dorian, Mixolydian, blues scale over minor chords
- Phrasing: short 2-bar motifs repeated with variations
- Emotional arc: build from sparse to dense over 8-bar phrases

${base}`;

    case "arrangement":
      return `You are the Arrangement Architect, an expert in Amapiano song structure and instrumentation.
Your responsibilities:
- Define the full song structure with section names, lengths in bars, and energy levels
- Specify which instruments enter/exit at each section
- Plan the energy arc: where the drop hits, where breakdowns occur
- Design transitions between sections
- Output a complete arrangement map with bar numbers and instrumentation grid

Arrangement knowledge:
- Typical DJ-friendly structure: 16-bar intro, 32-bar groove, 16-bar breakdown, 32-bar drop, 16-bar outro
- Transition techniques: filter sweeps, bass drops, percussion builds
- Layering: start minimal, add elements every 8 bars, strip back before drop
- Club context: the drop must hit at high energy with full log drum + bass

${base}`;

    case "analysis":
      return `You are the Pattern Analyzer, an expert in Amapiano style fingerprinting and reference matching.
Your responsibilities:
- Identify which Amapiano sub-genre and regional style best matches the request
- Match patterns to known artist styles (Kabza De Small, Kelvin Momo, DBN Gogo, Focalistic, etc.)
- Assess cultural authenticity of the proposed elements
- Flag any elements that deviate from authentic Amapiano conventions
- Output a style confidence score and specific reference points

Analysis knowledge:
- Private School: associated with Kelvin Momo, Babalwa M, BTSM — jazz harmony, softer log drums
- Classic/Commercial: Kabza De Small, DJ Maphorisa — melodic, high energy, gospel influences
- Deep: Mr JazziQ, Vigro Deep — darker, heavier bass, minimal
- Gqom-influenced: DBN Gogo — harder percussion, faster patterns

${base}`;

    case "rag":
      return `You are the Knowledge Retriever, an expert in synthesizing contextual information for music production.
Your responsibilities:
- Synthesize retrieved knowledge from the pattern database and style guides
- Rank the relevance of different knowledge items to the current composition goal
- Extract actionable insights from reference material
- Identify gaps where additional context would improve the composition
- Output a structured knowledge summary with specific production recommendations

Knowledge synthesis approach:
- Prioritize specific technical details (BPM ranges, chord symbols, rhythm patterns)
- Cross-reference multiple sources for consistency
- Flag contradictions between style guides
- Translate abstract style descriptions into concrete production parameters

${base}`;

    default:
      return `You are an autonomous AI agent reasoning about how to accomplish a goal.
You have access to these tools: ${"{availableTools}"}

Your task is to analyze the current context and determine the next best action.

Guidelines:
- If the goal is achieved, set shouldContinue to false
- Choose actions that make progress toward the goal
- Consider what tools are available and their capabilities
- Be efficient - don't repeat actions unnecessarily
- If stuck, try a different approach or acknowledge failure

${base}`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context, goal, availableTools, history, agentRole } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get role-specific or generic system prompt
    let systemPrompt = getRoleSystemPrompt(agentRole);

    // Inject available tools into default prompt
    if (!agentRole) {
      systemPrompt = systemPrompt.replace(
        '"{availableTools}"',
        (availableTools?.join(", ") || "none")
      );
    }

    const roleContext = agentRole
      ? `\nAgent Role: ${agentRole}\nAvailable sub-tasks: ${availableTools?.join(", ") || "none"}`
      : "";

    const userPrompt = `Goal: ${goal}${roleContext}

Current Context:
${context}

Recent History:
${JSON.stringify(history?.slice(-5) || [], null, 2)}

Analyze the situation and determine the next action. Return valid JSON only.`;

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
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", fallback: true }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required", fallback: true }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error", fallback: true }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse the JSON response
    let thought;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      thought = JSON.parse(jsonMatch[1].trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      thought = {
        reasoning: content,
        shouldContinue: false,
        confidence: 0.5,
        nextAction: null,
        actionInput: null,
        explanation: content || "Agent reasoning completed",
      };
    }

    console.log(`[agent-reasoning] role=${agentRole || "generic"} confidence=${thought.confidence}`);

    return new Response(JSON.stringify(thought), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Agent reasoning error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: true,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
