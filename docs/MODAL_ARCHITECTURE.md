# AURA-X Modal Architecture

## Overview

AURA-X uses Modal.com as its GPU compute platform, following architectural patterns established by Suno for scalable AI music generation.

## Architecture Principles (Inspired by Suno)

### 1. Dynamic GPU Scaling
- **L4 GPUs**: Cost-efficient batch feature extraction
- **A10G GPUs**: Default inference workloads
- **A100 GPUs**: Model training, heavy computation
- **H100 GPUs**: Peak demand, fastest inference

### 2. Batch Pre-Processing Pipeline
```python
@app.function(cpu=2, memory=4096, timeout=3600, retries=3)
def batch_preprocess(inputs: list[dict]) -> list[dict]:
    """CPU-based pre-processing that scales horizontally"""
    # Feature extraction, normalization, validation
```

### 3. Model Chaining
```python
@app.function(gpu="A10G", timeout=300)
def chain_analysis_to_generation(audio_url: str, params: dict) -> dict:
    """Chain: Analyze → Enhance → Generate"""
    analysis = analyze(audio_url)
    enhanced = enhance(audio_url, analysis)
    output = generate(enhanced)
    return output
```

### 4. Concurrent Request Handling
```python
@app.function(
    gpu="A10G",
    concurrency_limit=100,    # 100 containers
    allow_concurrent_inputs=10  # 10 requests/container
)
```

## Endpoints

| Endpoint | Method | GPU | Purpose |
|----------|--------|-----|---------|
| `/health` | GET | A10G | Health check with GPU status |
| `/audio/analyze` | POST | A10G | Librosa-based audio analysis |
| `/audio/separate` | POST | A10G | Demucs stem separation |
| `/audio/generate` | POST | A10G | Music generation from prompt |
| `/ml/quantize` | POST | A10G | SVDQuant-Audio quantization |
| `/batch/submit` | POST | CPU | Submit batch job |
| `/batch/{id}/status` | GET | CPU | Check batch job status |
| `/agent/execute` | POST | A10G | Agent goal execution |

## Modal Functions

| Function | GPU | Timeout | Purpose |
|----------|-----|---------|---------|
| `fastapi_app` | A10G | 600s | Main web server |
| `train_model` | A100 | 3600s | Model training |
| `separate_stems_gpu` | A10G | 300s | Stem separation |
| `svdquant_audio` | A10G | 120s | Audio quantization |
| `fast_inference` | H100 | 60s | Peak demand inference |
| `batch_preprocess` | CPU | 3600s | Batch pre-processing |
| `batch_feature_extraction` | L4 | 1800s | Batch features |

## Cost Optimization

### Suno's Approach (Applied to AURA-X)
1. **No 3-year GPU reservations** - Serverless pay-per-use
2. **Auto-scaling** - Containers spin up/down with demand
3. **Right-sized GPUs** - L4 for extraction, A10G for inference, H100 for peaks
4. **Batch processing** - Amortize cold-start costs

### Modal Pricing Tiers
- **Starter**: $30/month free credits (development)
- **Academic Grant**: Up to $10k free credits (research)
- **Team**: For production workloads

## Integration with Supabase Edge Functions

```
React Frontend
    ↓
Supabase Edge Functions (Deno)
    ↓ HTTP
Modal FastAPI Backend (Python + GPU)
```

Edge functions act as auth gateway and proxy layer:
- `modal-generate`: Music generation
- `modal-quantize`: SVDQuant-Audio
- `modal-analyze`: Audio analysis (planned)
- `modal-separate`: Stem separation (planned)

## Deployment

```bash
# Deploy to Modal
cd python-backend
modal deploy modal_app/main.py

# View logs
modal logs aura-x-backend

# Run locally
modal serve modal_app/main.py
```

## References

- [How Suno Uses Modal](https://modal.com/blog/suno-case-study)
- [Modal GPU Documentation](https://modal.com/docs/guide/gpu)
- [Modal Scaling Guide](https://modal.com/docs/guide/concurrent-inputs)
