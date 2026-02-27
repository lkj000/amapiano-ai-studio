import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RealtimeSession {
  id: string;
  ws: WebSocket;
  preferences: {
    sensitivity: number;
    voiceGuidance: boolean;
    autoApply: boolean;
    customPrompt?: string;
  };
  projectData: any;
  lastActivity: number;
}

const activeSessions = new Map<string, RealtimeSession>();

serve((req) => {
  const upgrade = req.headers.get("upgrade") || "";
  
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 426 });
  }

  const { socket: ws, response } = Deno.upgradeWebSocket(req);
  const sessionId = crypto.randomUUID();
  
  console.log(`[REALTIME-AI] New connection: ${sessionId}`);

  ws.onopen = () => {
    console.log(`[REALTIME-AI] Session ${sessionId} opened`);
    
    activeSessions.set(sessionId, {
      id: sessionId,
      ws,
      preferences: {
        sensitivity: 0.7,
        voiceGuidance: false,
        autoApply: false
      },
      projectData: null,
      lastActivity: Date.now()
    });

    ws.send(JSON.stringify({
      type: 'session_created',
      sessionId,
      timestamp: Date.now()
    }));
  };

  ws.onmessage = async (event) => {
    try {
      const session = activeSessions.get(sessionId);
      if (!session) return;

      session.lastActivity = Date.now();
      const message = JSON.parse(event.data);
      
      console.log(`[REALTIME-AI] Message from ${sessionId}:`, message.type);

      switch (message.type) {
        case 'init':
          session.projectData = message.projectData;
          session.preferences = { ...session.preferences, ...message.preferences };
          
          ws.send(JSON.stringify({
            type: 'init_complete',
            message: 'AI Assistant ready to provide real-time guidance'
          }));
          break;

        case 'context_update':
          session.projectData = message.context;
          await processContextUpdate(session, message.context);
          break;

        case 'latency_ping':
          ws.send(JSON.stringify({
            type: 'latency_ping',
            timestamp: message.timestamp
          }));
          break;

        default:
          console.log(`[REALTIME-AI] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[REALTIME-AI] Message processing error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  ws.onclose = () => {
    console.log(`[REALTIME-AI] Session ${sessionId} closed`);
    activeSessions.delete(sessionId);
  };

  ws.onerror = (error) => {
    console.error(`[REALTIME-AI] Session ${sessionId} error:`, error);
    activeSessions.delete(sessionId);
  };

  return response;
});

async function processContextUpdate(session: RealtimeSession, context: unknown): Promise<void> {
  // Store context update in agent_memory table for session continuity
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  await supabaseClient.from('agent_memory').upsert({
    agent_id: session.id,
    memory_type: 'context_update',
    content: JSON.stringify(context),
    updated_at: new Date().toISOString()
  }, { onConflict: 'agent_id,memory_type' });

  // Generate AI-driven suggestions and send them over the WebSocket
  const suggestions = await generateRealtimeSuggestions(context, session.preferences, []);
  session.ws.send(JSON.stringify({
    type: 'suggestions',
    suggestions,
    timestamp: Date.now()
  }));
}

async function generateRealtimeSuggestions(context: any, preferences: any, recentMessages: any[]): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  if (!LOVABLE_API_KEY) {
    console.warn('[REALTIME-AI] LOVABLE_API_KEY not configured — cannot generate suggestions');
    return [];
  }

  const systemPrompt =
    'You are an AI music production assistant. Given the conversation context, suggest 2-3 specific, actionable music production improvements. ' +
    'Return JSON array: [{type, suggestion, confidence, action}] where confidence is 0-1 based on relevance, ' +
    'type is one of: harmony|rhythm|arrangement|mixing|sound_design';

  const contextSummary = [
    `BPM: ${context?.bpm || 'unknown'}`,
    `Key: ${context?.keySignature || 'unknown'}`,
    `Tracks: ${(context?.tracks || []).length}`,
    preferences.customPrompt ? `User preference: ${preferences.customPrompt}` : '',
    recentMessages.length > 0
      ? `Recent activity:\n${recentMessages.map((m: any) => `  - ${JSON.stringify(m)}`).join('\n')}`
      : '',
  ].filter(Boolean).join('\n');

  try {
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Current session context:\n${contextSummary}` },
        ],
        temperature: 0.4,
        max_tokens: 600,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`[REALTIME-AI] LLM call failed: ${resp.status} ${errText}`);
      return [];
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || '[]';

    // Strip markdown fences if present, then parse JSON
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = match ? match[1].trim() : raw.trim();

    let suggestions: any[];
    try {
      suggestions = JSON.parse(jsonText);
      if (!Array.isArray(suggestions)) {
        console.warn('[REALTIME-AI] LLM returned non-array JSON — returning empty suggestions');
        return [];
      }
    } catch {
      console.warn('[REALTIME-AI] Failed to parse LLM JSON response — returning empty suggestions');
      return [];
    }

    console.log(`[REALTIME-AI] LLM returned ${suggestions.length} suggestion(s)`);
    return suggestions;
  } catch (err) {
    console.error('[REALTIME-AI] generateRealtimeSuggestions threw:', err);
    return [];
  }
}

setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000;
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastActivity > timeout) {
      console.log(`[REALTIME-AI] Closing inactive session: ${sessionId}`);
      session.ws.close();
      activeSessions.delete(sessionId);
    }
  }
}, 60000);
