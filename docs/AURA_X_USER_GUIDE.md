# Aura-X User Guide: Viewing Implementations in Action

## 🎯 Quick Access Overview

All new Aura-X enhancements are now live and accessible through multiple interfaces.

---

## 🖥️ Frontend Access

### 1. Admin Dashboard
**URL**: Navigate to `/admin` in your application

The Admin Dashboard now includes **4 main tabs**:

#### **Monitoring Tab**
- **What it shows**: Real-time API performance metrics
- **Key metrics**:
  - Total API calls
  - Success rate percentage
  - Average latency (ms)
  - Failed calls count
  - Function-level performance breakdown
  - Recent API calls log with timestamps

#### **MLOps Tab**
- **What it shows**: AI model performance and cost analytics
- **Key metrics**:
  - Model-specific success rates
  - Average generation time per model
  - Cost tracking per model
  - Total AI credits used
  - Model health alerts

#### **Security Tab**
- **What it shows**: Comprehensive penetration testing checklist
- **Features**:
  - 8 security categories
  - 40+ security test items
  - Pass/Fail/Pending status tracking
  - Detailed test descriptions
  - Export functionality for audit reports

#### **Plugins Tab**
- **What it shows**: Plugin approval workflow (existing feature)

---

## 🔧 Backend Infrastructure

### 2. AuraBridge API Layer
**Location**: `src/lib/AuraBridge.ts`

**How to use in your code**:
```typescript
import { AuraBridge } from '@/lib/AuraBridge';

// Make monitored API calls
const result = await AuraBridge.call({
  function_name: 'neural-music-generation',
  body: { 
    prompt: 'Create amapiano beat',
    model: 'google/gemini-2.5-flash'
  }
});

// Get real-time metrics
const metrics = AuraBridge.getMetrics();
console.log('API Performance:', metrics);
```

**What it does**:
- Tracks every API call automatically
- Measures latency for each request
- Handles rate limiting and payment errors
- Stores metrics in localStorage
- Provides unified error handling

---

### 3. MCP (Model Context Protocol) Server
**Location**: `src/hooks/useMCPServer.ts`

**How to use in your code**:
```typescript
import { useMCPServer } from '@/hooks/useMCPServer';

function AIComponent() {
  const { 
    initializeSession, 
    executeRequest, 
    updateContext,
    isProcessing 
  } = useMCPServer();

  // Initialize AI session
  await initializeSession();

  // Execute AI request with context
  const response = await executeRequest({
    prompt: 'Generate amapiano melody',
    context: { 
      genre: 'amapiano',
      bpm: 112,
      key: 'Am'
    }
  });

  // Update context for future requests
  updateContext({ mood: 'energetic' });
}
```

**What it does**:
- Manages AI model sessions
- Maintains context across requests
- Supports model switching
- Persists session data
- Tracks conversation history

---

### 4. Audit Logging
**Location**: `src/hooks/useAuditLog.ts`

**How to use in your code**:
```typescript
import { useAuditLog } from '@/hooks/useAuditLog';

function SecuritySensitiveComponent() {
  const { logAction } = useAuditLog();

  // Log security events
  await logAction({
    action: 'user_login',
    severity: 'info',
    details: { method: 'email' }
  });

  await logAction({
    action: 'admin_access',
    severity: 'warning',
    details: { resource: 'user_data' }
  });
}
```

**What it logs**:
- Authentication events
- Admin actions
- Data access events
- AI generation requests
- Security-critical operations

**View logs**: Check `analytics_events` table in Supabase

---

## 🔌 API Endpoints (Backend Testing)

### 5. Rate-Limited Edge Functions

All AI generation endpoints now include rate limiting:

**Test Neural Music Generation**:
```bash
curl -X POST https://mywijmtszelyutssormy.supabase.co/functions/v1/neural-music-generation \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create amapiano beat",
    "model": "google/gemini-2.5-flash",
    "context": {
      "genre": "amapiano",
      "bpm": 112
    }
  }'
```

**Response includes rate limit headers**:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1735812000
```

**Other rate-limited endpoints**:
- `/ai-music-generation` - 10 req/min
- `/aura-conductor-orchestration` - 5 req/min
- `/voice-to-text` - 20 req/min
- `/music-analysis` - 50 req/min

---

## 📊 Viewing Live Data

### Monitor API Performance
1. Go to `/admin`
2. Click **Monitoring** tab
3. Watch real-time metrics update
4. Metrics refresh every 5 seconds automatically

### Track AI Model Usage
1. Go to `/admin`
2. Click **MLOps** tab
3. View model-specific analytics
4. Monitor costs and success rates

### Run Security Audits
1. Go to `/admin`
2. Click **Security** tab
3. Go through each category
4. Mark tests as Pass/Fail
5. Export report for compliance

### View Edge Function Logs
**Supabase Dashboard**:
1. Visit: `https://supabase.com/dashboard/project/mywijmtszelyutssormy/functions`
2. Select any function (e.g., `neural-music-generation`)
3. Click **Logs** tab
4. See real-time execution logs

---

## 🧪 Testing the System

### Test API Latency Tracking
```typescript
// In any component
import { AuraBridge } from '@/lib/AuraBridge';

// Make multiple calls
for (let i = 0; i < 5; i++) {
  await AuraBridge.call({
    function_name: 'check-subscription',
    body: {}
  });
}

// Check metrics in Admin Dashboard
// Navigate to /admin > Monitoring tab
// See the calls logged with latency
```

### Test Rate Limiting
```bash
# Make 15 rapid requests (limit is 10/min)
for i in {1..15}; do
  curl -X POST https://mywijmtszelyutssormy.supabase.co/functions/v1/neural-music-generation \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"prompt":"test"}' &
done

# After 10 requests, you should receive:
# {"error": "Rate limit exceeded. Please try again later."}
```

### Test MCP Context Persistence
```typescript
// Session persists across page reloads
const { initializeSession, context } = useMCPServer();

await initializeSession();
console.log('Session context:', context);

// Refresh the page
// Context will be restored from localStorage
```

---

## 📈 Database Schema

### View Analytics Data
**Supabase SQL Editor**:
```sql
-- View recent API calls (tracked by AuraBridge)
SELECT * FROM analytics_events
WHERE event_type = 'api_call'
ORDER BY created_at DESC
LIMIT 50;

-- View AI model usage
SELECT * FROM ai_model_usage
ORDER BY created_at DESC
LIMIT 50;

-- View audit logs
SELECT * FROM analytics_events
WHERE event_type IN ('auth_event', 'admin_action', 'data_access')
ORDER BY created_at DESC;
```

---

## 🔐 Security Features

### Rate Limiter (Shared Module)
**Location**: `supabase/functions/_shared/rateLimiter.ts`

**How it works**:
- In-memory rate limiting per user
- Configurable limits per endpoint
- Automatic cleanup of expired entries
- Returns detailed error messages

### Audit Trail
All security-sensitive actions are automatically logged:
- User authentication (login, logout, signup)
- Admin panel access
- Database queries
- AI generation requests
- File uploads/downloads

---

## 📖 API Documentation

**Full API Specification**: See `docs/API_SPECIFICATION.md`

Key sections:
- Authentication requirements
- Rate limits per endpoint
- Request/response schemas
- Error handling
- Best practices

---

## 🚀 Quick Demo Workflow

### Complete Test Flow:
1. **Login to your app**
2. **Navigate to `/admin`**
3. **Generate AI content** (via any AI feature)
4. **Check Monitoring tab** - See the API call logged
5. **Check MLOps tab** - See AI model usage
6. **Run Security checklist** - Mark tests as complete
7. **View Supabase logs** - See backend execution details

---

## 📝 Implementation Status

All features documented in `docs/AURA_X_COMPLETE.md` are **fully operational**:
- ✅ AuraBridge API Layer
- ✅ MCP Server
- ✅ Monitoring Dashboard
- ✅ MLOps Dashboard
- ✅ Security Checklist
- ✅ Rate Limiting
- ✅ Audit Logging
- ✅ API Documentation

---

## 🆘 Troubleshooting

### Metrics not showing in Admin Dashboard
- Make API calls through AuraBridge
- Wait 5 seconds for auto-refresh
- Check browser localStorage for `aura_api_metrics`

### Rate limiting not working
- Ensure edge function uses shared rateLimiter
- Check function logs in Supabase dashboard
- Verify user is authenticated

### MCP context not persisting
- Check browser localStorage for `mcp_session`
- Ensure cookies are enabled
- Clear cache and reinitialize session

---

## 📞 Next Steps

- Apply rate limiter to remaining edge functions
- Generate architectural diagrams
- Set up continuous monitoring alerts
- Configure cost optimization rules
- Implement model retraining pipelines

---

**Last Updated**: Phase 4 Complete
**Version**: Aura-X v1.0
**Status**: All Systems Operational ✅
