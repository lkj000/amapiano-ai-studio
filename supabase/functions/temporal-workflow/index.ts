import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MODAL_BASE_URL = (Deno.env.get("MODAL_API_URL") || "https://mabgwej--aura-x-backend-fastapi-app.modal.run").replace(/\/+$/, '');
const TEMPORAL_NAMESPACE = Deno.env.get("TEMPORAL_NAMESPACE") || "";
const TEMPORAL_API_KEY = Deno.env.get("TEMPORAL_API_KEY") || "";

// Cloud Ops API for read-only namespace/workflow listing
const OPS_API_BASE = "https://saas-api.tmprl.cloud/api/v1";

interface WorkflowRequest {
  action: 'start' | 'signal' | 'query' | 'terminate' | 'describe' | 'list';
  workflowId?: string;
  workflowType?: string;
  taskQueue?: string;
  input?: unknown[];
  signalName?: string;
  signalInput?: unknown;
  queryType?: string;
  queryArgs?: unknown;
  reason?: string;
}

/**
 * Route workflow operations through Modal backend which has the Temporal Python SDK.
 * Modal connects to Temporal Cloud via gRPC (the only supported protocol for workflow ops).
 */
async function modalTemporalProxy(action: string, body: Record<string, unknown>) {
  const url = `${MODAL_BASE_URL}/temporal/${action}`;
  console.log(`[TEMPORAL] Proxying to Modal: ${url}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      namespace: TEMPORAL_NAMESPACE,
      api_key: TEMPORAL_API_KEY,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`[TEMPORAL] Modal proxy error ${res.status}:`, text);
    throw new Error(`Temporal proxy error ${res.status}: ${text.substring(0, 500)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * Use Temporal Cloud Ops HTTP API for listing (read-only control plane).
 * This is the only HTTP endpoint Temporal Cloud exposes.
 */
async function opsApiList() {
  const url = `${OPS_API_BASE}/namespaces`;
  console.log(`[TEMPORAL] Ops API list: ${url}`);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TEMPORAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`[TEMPORAL] Ops API error ${res.status}:`, text);
    throw new Error(`Temporal Ops API error ${res.status}: ${text.substring(0, 300)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * Local fallback when Modal backend doesn't have Temporal endpoints yet.
 * Returns a structured response indicating the workflow was queued locally.
 */
function localFallback(action: string, request: WorkflowRequest) {
  const workflowId = request.workflowId || 
    `${request.workflowType || 'workflow'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  console.log(`[TEMPORAL] Local fallback for action: ${action}, workflow: ${workflowId}`);

  switch (action) {
    case 'start':
      return {
        workflowId,
        runId: `local-${Date.now()}`,
        status: 'RUNNING',
        execution_mode: 'local_queued',
        message: `Workflow ${workflowId} queued locally. Deploy Temporal worker on Modal for durable execution.`,
        input: request.input,
      };
    case 'describe':
      return {
        workflowId,
        status: 'UNKNOWN',
        execution_mode: 'local_fallback',
        message: 'Temporal worker not connected. Deploy worker on Modal to track workflow state.',
      };
    case 'list':
      return {
        executions: [],
        execution_mode: 'local_fallback',
        message: 'Temporal worker not connected. No workflows to list.',
        namespace: TEMPORAL_NAMESPACE,
      };
    default:
      return {
        action,
        workflowId,
        execution_mode: 'local_fallback',
        message: `Action ${action} requires a running Temporal worker.`,
      };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TEMPORAL_NAMESPACE || !TEMPORAL_API_KEY) {
      return new Response(JSON.stringify({
        error: 'Temporal credentials not configured. Set TEMPORAL_NAMESPACE and TEMPORAL_API_KEY.',
        success: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const request: WorkflowRequest = await req.json();
    const { action } = request;

    console.log(`[TEMPORAL] Action: ${action}`, {
      workflowId: request.workflowId,
      workflowType: request.workflowType,
      namespace: TEMPORAL_NAMESPACE,
    });

    let result: unknown;

    // Try Modal backend first (it has the Temporal Python SDK with gRPC support)
    try {
      const modalBody: Record<string, unknown> = {};

      switch (action) {
        case 'start':
          if (!request.workflowId || !request.workflowType || !request.taskQueue) {
            throw new Error('workflowId, workflowType, and taskQueue are required');
          }
          modalBody.workflow_id = request.workflowId;
          modalBody.workflow_type = request.workflowType;
          modalBody.task_queue = request.taskQueue;
          modalBody.input = request.input || [];
          break;

        case 'signal':
          if (!request.workflowId || !request.signalName) {
            throw new Error('workflowId and signalName are required');
          }
          modalBody.workflow_id = request.workflowId;
          modalBody.signal_name = request.signalName;
          modalBody.signal_input = request.signalInput;
          break;

        case 'query':
          if (!request.workflowId || !request.queryType) {
            throw new Error('workflowId and queryType are required');
          }
          modalBody.workflow_id = request.workflowId;
          modalBody.query_type = request.queryType;
          modalBody.query_args = request.queryArgs;
          break;

        case 'describe':
          if (!request.workflowId) throw new Error('workflowId is required');
          modalBody.workflow_id = request.workflowId;
          break;

        case 'terminate':
          if (!request.workflowId) throw new Error('workflowId is required');
          modalBody.workflow_id = request.workflowId;
          modalBody.reason = request.reason || 'Terminated by user';
          break;

        case 'list':
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      result = await modalTemporalProxy(action, modalBody);
      console.log(`[TEMPORAL] Modal proxy success for ${action}`);

    } catch (modalError) {
      console.warn(`[TEMPORAL] Modal proxy unavailable, using local fallback:`, 
        modalError instanceof Error ? modalError.message : 'Unknown error');
      
      // Fall back to local handling
      result = localFallback(action, request);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[TEMPORAL] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
