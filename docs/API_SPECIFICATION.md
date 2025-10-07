# Aura-X API Specification

## Overview
Comprehensive API documentation for the Amapiano AI platform, detailing all available endpoints, authentication requirements, and rate limits.

## Base URL
```
Production: https://mywijmtszelyutssormy.supabase.co/functions/v1
```

## Authentication
All API requests require authentication via Supabase JWT token:
```
Authorization: Bearer <JWT_TOKEN>
```

## Rate Limits

### AI Generation Endpoints
- **Limit**: 10 requests per minute per user
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

### Standard Endpoints
- **Limit**: 100 requests per minute per user

### Read-Only Endpoints
- **Limit**: 200 requests per minute per user

## Endpoints

### 1. Neural Music Generation
**POST** `/neural-music-generation`

Generate AI music using neural networks with context awareness.

**Rate Limit**: 10 req/min

**Request Body**:
```json
{
  "prompt": "Create an upbeat amapiano track with log drums",
  "context": {
    "genre": "amapiano",
    "bpm": 112,
    "key": "C minor"
  },
  "model": "google/gemini-2.5-flash",
  "temperature": 0.7,
  "maxTokens": 2000
}
```

**Response**:
```json
{
  "result": "Generated music data",
  "model": "google/gemini-2.5-flash",
  "tokensUsed": 1547,
  "latency": 2340,
  "contextUpdated": true
}
```

**Error Responses**:
- `401`: Unauthorized - Invalid or missing JWT token
- `429`: Rate limit exceeded
- `500`: Internal server error

---

### 2. AI Music Generation
**POST** `/ai-music-generation`

Legacy AI music generation endpoint.

**Rate Limit**: 10 req/min

**Request Body**:
```json
{
  "prompt": "Amapiano beat with piano chords",
  "style": "classic",
  "duration": 120
}
```

**Response**:
```json
{
  "audioUrl": "https://storage.supabase.co/...",
  "metadata": {
    "bpm": 112,
    "key": "Am",
    "duration": 120
  }
}
```

---

### 3. Aura Conductor Orchestration
**POST** `/aura-conductor-orchestration`

Orchestrate complex AI music production workflows.

**Rate Limit**: 5 req/min

**Request Body**:
```json
{
  "sessionId": "session_123",
  "prompt": "Create a full amapiano song with intro, verse, and chorus",
  "orchestrationConfig": {
    "stages": ["analysis", "generation", "mixing", "mastering"],
    "quality": "high"
  }
}
```

**Response**:
```json
{
  "success": true,
  "orchestrationId": "orch_abc123",
  "stages": [
    {
      "name": "analysis",
      "status": "completed",
      "result": {...}
    }
  ],
  "estimatedCompletionTime": 45000
}
```

---

### 4. Check Subscription
**POST** `/check-subscription`

Verify user subscription status and tier.

**Rate Limit**: 100 req/min

**Request Body**: None (uses JWT user ID)

**Response**:
```json
{
  "subscription": {
    "tier": "premium",
    "status": "active",
    "features": {
      "ai_generation_credits": 500,
      "upload_limit_mb": 1000,
      "priority_processing": true
    }
  }
}
```

---

### 5. Voice to Text
**POST** `/voice-to-text`

Convert voice recordings to text transcriptions.

**Rate Limit**: 20 req/min

**Request Body**:
```json
{
  "audioUrl": "https://storage.supabase.co/audio.mp3",
  "language": "en-US"
}
```

**Response**:
```json
{
  "transcript": "Create a beat with heavy bass",
  "confidence": 0.95,
  "duration": 3.5
}
```

---

### 6. Music Analysis
**POST** `/music-analysis`

Analyze audio files for BPM, key, and structure.

**Rate Limit**: 50 req/min

**Request Body**:
```json
{
  "audioUrl": "https://storage.supabase.co/track.mp3"
}
```

**Response**:
```json
{
  "bpm": 112,
  "key": "Am",
  "timeSignature": "4/4",
  "structure": [
    { "section": "intro", "start": 0, "end": 8 },
    { "section": "verse", "start": 8, "end": 32 }
  ],
  "instruments": ["piano", "drums", "bass"],
  "mood": "energetic"
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes
- `UNAUTHORIZED`: Missing or invalid authentication
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_REQUEST`: Malformed request body
- `INSUFFICIENT_CREDITS`: Not enough AI credits
- `INTERNAL_ERROR`: Server error

## Rate Limit Headers

All responses include rate limit information:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1735812000
```

## Webhooks

### Subscription Events
Configure webhooks to receive subscription status updates:

**POST** `https://your-domain.com/webhook`
```json
{
  "event": "subscription.updated",
  "user_id": "user_123",
  "subscription": {
    "tier": "premium",
    "status": "active"
  }
}
```

## SDKs

### JavaScript/TypeScript
```typescript
import { AuraBridge } from '@/lib/AuraBridge';

const result = await AuraBridge.call({
  function_name: 'neural-music-generation',
  body: {
    prompt: 'Create amapiano beat',
    model: 'google/gemini-2.5-flash'
  }
});
```

## Best Practices

1. **Always handle rate limits**: Check `X-RateLimit-Remaining` header
2. **Implement exponential backoff**: Retry failed requests with increasing delays
3. **Cache responses**: Cache read-only data to reduce API calls
4. **Use webhooks**: Subscribe to events instead of polling
5. **Monitor usage**: Track API calls via MLOps dashboard

## Support
- Documentation: https://docs.amapiano-ai.com
- Discord: https://discord.gg/amapiano-ai
- Email: support@amapiano-ai.com
