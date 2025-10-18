# Lovable Cloud Integration in AURA-X

## Overview
AURA-X now integrates Lovable Cloud features (via external Supabase) with VAST-inspired architecture for enterprise-scale AI orchestration.

## Architecture Components

### 1. Lovable AI Integration
- **Model**: `google/gemini-2.5-flash` (default, balanced performance)
- **Alternative**: `google/gemini-2.5-pro` (highest quality for complex reasoning)
- **Edge Function**: `aura-ai-suggestions`
- **Features**:
  - Intelligent music production suggestions
  - Structured output via tool calling
  - Cultural authenticity validation
  - Rate limit and error handling with fallbacks

### 2. VAST Architecture Integration

#### AuraBridge (API Layer)
- Unified service layer for all backend communications
- Automatic latency tracking and error handling
- Rate limit and payment error handling
- Persistent metrics storage

#### DataSpace (Unified Data Layer)
- Single API for all data operations (projects, samples, patterns)
- Real-time synchronization via Supabase
- Event pub/sub system
- Workspace-scoped data isolation

#### Event Processor (Real-time Pipeline)
- Priority-based event queue (critical, high, normal, low)
- Pattern matching for event handlers
- Sub-100ms processing for real-time events
- Performance monitoring

#### MCP (Model Context Protocol)
- AI agent orchestration with context management
- Session persistence across page reloads
- Multi-model support with dynamic switching
- Sense → Learn → Reason → Act lifecycle

### 3. VastIntegratedOrchestrator Component
Combines all VAST components for intelligent music production:

```typescript
// Initialize VAST components
const dataSpace = useDataSpace('aura-orchestrator');
const mcpServer = useMCPServer();
const eventProcessor = getEventProcessor();

// Orchestration flow:
// 1. Initialize MCP Agent
// 2. Get AI suggestions via Lovable AI
// 3. Execute MCP orchestration
// 4. Store results in DataSpace
// 5. Log completion events
```

## Usage Examples

### AI Suggestions with Lovable AI

```typescript
const suggestions = await AuraBridge.call({
  function_name: 'aura-ai-suggestions',
  body: {
    context: {
      user_intent: 'Create smooth amapiano track',
      genre: 'amapiano',
      bpm: 118,
      existing_elements: ['log_drums', 'piano']
    },
    suggestion_type: 'full_analysis'
  }
});
```

### DataSpace Operations

```typescript
// Create project
await dataSpace.createProject({
  name: 'My Amapiano Track',
  orchestration_data: result,
  user_id: user.id
});

// Search projects
const results = await dataSpace.searchProjects('amapiano');
```

### Event Processing

```typescript
// Dispatch orchestration event
await eventProcessor.dispatch({
  type: EventTypes.AI.GENERATION_STARTED,
  priority: 'high',
  payload: { prompt, userId },
  source: 'aura_orchestrator'
});

// Subscribe to events
eventProcessor.on(/^orchestration\./, 'high', async (event) => {
  console.log('Orchestration event:', event);
});
```

## Error Handling

### Rate Limiting (429)
- Automatic detection via AuraBridge
- Fallback to heuristic suggestions
- User-friendly toast notifications

### Payment Required (402)
- Detected when Lovable AI credits depleted
- Guidance to add credits
- Fallback suggestions provided

### Network Errors
- Automatic retry logic in AuraBridge
- Graceful degradation to offline mode
- Event logging for debugging

## Monitoring

### Real-time Metrics
- Total API operations
- Success rate percentage
- Average latency (ms)
- Active AI agents count
- Events processed

### AuraBridge Metrics

```typescript
const metrics = AuraBridge.getMetrics();
// Returns: { totalCalls, successRate, averageLatency, errorRate }
```

## Configuration

### Edge Function Setup
All edge functions are auto-deployed. Configuration in `supabase/config.toml`:

```toml
[functions.aura-ai-suggestions]
verify_jwt = true

[functions.aura-conductor-orchestration]
verify_jwt = true
```

### Required Secrets
- `LOVABLE_API_KEY` - Auto-provisioned for Lovable AI
- `OPENAI_API_KEY` - Optional, for OpenAI models
- `SUPABASE_*` - Auto-configured

## Benefits

### Developer Experience
- Single orchestration API for all AI operations
- Automatic monitoring and error handling
- Type-safe DataSpace operations
- Real-time event notifications

### Performance
- Sub-100ms event processing
- Efficient caching in DataSpace
- Automatic rate limit handling
- Optimized batch operations

### Scalability
- Workspace isolation for multi-tenancy
- Distributed event processing
- Horizontal scaling via Supabase
- Edge function auto-scaling

## Access Points

### AI Hub Interface
- Navigate to `/ai-hub`
- Click "VAST" tab
- Use VastIntegratedOrchestrator

### Direct Integration
```typescript
import { VastIntegratedOrchestrator } from '@/components/aura/VastIntegratedOrchestrator';

<VastIntegratedOrchestrator user={currentUser} />
```

## Future Enhancements
- [ ] Vector search for musical patterns
- [ ] Multi-agent collaboration
- [ ] Advanced workflow automation
- [ ] Real-time collaboration features
- [ ] Custom AI model fine-tuning

## Resources
- [Lovable AI Docs](https://docs.lovable.dev/features/ai)
- [Lovable Cloud Docs](https://docs.lovable.dev/features/cloud)
- [VAST Architecture](./VAST_IMPLEMENTATION_SUMMARY.md)
- [Edge Function Logs](https://supabase.com/dashboard/project/mywijmtszelyutssormy/functions/aura-ai-suggestions/logs)
