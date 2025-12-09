# Python Backend Architecture for Level 5+ Agent System

## Executive Summary

This document outlines the migration strategy from a JavaScript/TypeScript-only architecture to a hybrid architecture with a Python ML backend, enabling true Level 5+ autonomous agent capabilities that are impossible with client-side JS alone.

## Current Architecture Limitations

| Capability | Current JS Implementation | Limitation |
|------------|---------------------------|------------|
| Audio ML Models | Mock/Approximation | No PyTorch/TensorFlow runtime |
| Stem Separation | Replicate API (external) | Latency, cost, no customization |
| Music Generation | External APIs only | No local model training/inference |
| Feature Extraction | Basic FFT | No Essentia/Librosa full suite |
| Model Quantization | Approximation | No ONNX Runtime, TensorRT |
| Agent Frameworks | Custom implementation | No LangChain/AutoGen/CrewAI |
| Vector Search | Supabase pgvector | No FAISS GPU acceleration |
| Training | Impossible | No GPU compute |

## Proposed Hybrid Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/TypeScript)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   DAW UI    │  │  Agent UI   │  │  Samples    │  │  Workflow   │ │
│  │  WebAudio   │  │  Reasoning  │  │  Library    │  │   Wizard    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS (Gateway)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │    Auth     │  │   Routing   │  │   Caching   │  │   Logging   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│   MODAL.COM (GPU)   │ │   REPLICATE (Ext)   │ │   SUPABASE (Data)   │
│  ┌───────────────┐  │ │  ┌───────────────┐  │ │  ┌───────────────┐  │
│  │   FastAPI     │  │ │  │   Demucs      │  │ │  │   PostgreSQL  │  │
│  │   Endpoints   │  │ │  │   MusicGen    │  │ │  │   pgvector    │  │
│  └───────────────┘  │ │  └───────────────┘  │ │  │   Storage     │  │
│  ┌───────────────┐  │ └─────────────────────┘ │  └───────────────┘  │
│  │  PyTorch/JAX  │  │                         └─────────────────────┘
│  │   Models      │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │  LangChain    │  │
│  │  Agents       │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │  Essentia/    │  │
│  │  Librosa      │  │
│  └───────────────┘  │
└─────────────────────┘
```

## Python Backend Structure

### Directory Layout

```
python-backend/
├── modal_app/
│   ├── __init__.py
│   ├── main.py                 # Modal entry point
│   ├── config.py               # Environment configuration
│   └── requirements.txt        # Python dependencies
│
├── api/
│   ├── __init__.py
│   ├── routes/
│   │   ├── audio.py            # Audio processing endpoints
│   │   ├── ml.py               # ML model endpoints
│   │   ├── agent.py            # Agent orchestration endpoints
│   │   └── analysis.py         # Audio analysis endpoints
│   └── middleware/
│       ├── auth.py             # Supabase JWT validation
│       └── cors.py             # CORS configuration
│
├── services/
│   ├── __init__.py
│   ├── audio/
│   │   ├── stem_separation.py  # Demucs integration
│   │   ├── feature_extraction.py # Essentia/Librosa
│   │   ├── synthesis.py        # Audio synthesis
│   │   └── effects.py          # Audio effects processing
│   │
│   ├── ml/
│   │   ├── models/
│   │   │   ├── authenticity.py # Trained authenticity model
│   │   │   ├── genre_classifier.py
│   │   │   └── element_selector.py
│   │   ├── quantization/
│   │   │   ├── svdquant.py     # Real SVDQuant implementation
│   │   │   └── onnx_export.py
│   │   └── training/
│   │       ├── trainer.py
│   │       └── datasets.py
│   │
│   └── agents/
│       ├── orchestrator.py     # LangChain agent orchestration
│       ├── tools/
│       │   ├── audio_tools.py
│       │   ├── analysis_tools.py
│       │   └── generation_tools.py
│       └── memory/
│           └── vector_store.py # FAISS integration
│
├── models/
│   ├── trained/                # Trained model weights
│   └── configs/                # Model configurations
│
└── tests/
    ├── test_audio.py
    ├── test_ml.py
    └── test_agents.py
```

## Key Python Components

### 1. Audio Processing (Essentia + Librosa)

```python
# services/audio/feature_extraction.py
import essentia.standard as es
import librosa
import numpy as np

class AudioFeatureExtractor:
    """Production-grade audio feature extraction using Essentia and Librosa"""
    
    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate
        self.rhythm_extractor = es.RhythmExtractor2013()
        self.key_extractor = es.KeyExtractor()
        self.mfcc = es.MFCC()
        
    def extract_features(self, audio: np.ndarray) -> dict:
        # BPM and beat positions
        bpm, beats, beats_confidence, _, _ = self.rhythm_extractor(audio)
        
        # Key and scale
        key, scale, key_strength = self.key_extractor(audio)
        
        # Spectral features via Librosa
        spectral_centroid = librosa.feature.spectral_centroid(y=audio, sr=self.sample_rate)
        spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=self.sample_rate)
        
        # MFCCs
        mfcc_bands, mfcc_coeffs = self.mfcc(audio)
        
        return {
            'bpm': float(bpm),
            'beats': beats.tolist(),
            'key': key,
            'scale': scale,
            'key_strength': float(key_strength),
            'spectral_centroid': float(np.mean(spectral_centroid)),
            'spectral_rolloff': float(np.mean(spectral_rolloff)),
            'mfcc': mfcc_coeffs.tolist()
        }
```

### 2. Real SVDQuant Implementation

```python
# services/ml/quantization/svdquant.py
import torch
import torch.nn as nn
import numpy as np

class SVDQuantAudio:
    """Phase-coherent audio quantization using true SVD"""
    
    def __init__(self, target_bits: int = 8):
        self.target_bits = target_bits
        
    def quantize(self, audio: torch.Tensor) -> tuple[torch.Tensor, dict]:
        # Convert to STFT for phase-aware processing
        stft = torch.stft(audio, n_fft=2048, hop_length=512, return_complex=True)
        magnitude = torch.abs(stft)
        phase = torch.angle(stft)
        
        # Apply SVD to magnitude spectrogram
        U, S, Vh = torch.linalg.svd(magnitude, full_matrices=False)
        
        # Energy-based rank selection
        energy = torch.cumsum(S ** 2, dim=-1) / torch.sum(S ** 2, dim=-1, keepdim=True)
        rank = torch.searchsorted(energy, 0.99) + 1
        
        # Low-rank approximation
        U_reduced = U[..., :rank]
        S_reduced = S[..., :rank]
        Vh_reduced = Vh[..., :rank, :]
        
        # Quantize singular values
        S_quantized = self._quantize_values(S_reduced, self.target_bits)
        
        # Reconstruct magnitude
        magnitude_reconstructed = U_reduced @ torch.diag_embed(S_quantized) @ Vh_reduced
        
        # Reconstruct complex STFT preserving original phase
        stft_reconstructed = magnitude_reconstructed * torch.exp(1j * phase)
        
        # Inverse STFT
        audio_quantized = torch.istft(stft_reconstructed, n_fft=2048, hop_length=512)
        
        # Calculate metrics
        metrics = self._calculate_metrics(audio, audio_quantized)
        
        return audio_quantized, metrics
    
    def _quantize_values(self, values: torch.Tensor, bits: int) -> torch.Tensor:
        levels = 2 ** bits
        v_min, v_max = values.min(), values.max()
        scale = (v_max - v_min) / (levels - 1)
        quantized = torch.round((values - v_min) / scale) * scale + v_min
        return quantized
    
    def _calculate_metrics(self, original: torch.Tensor, quantized: torch.Tensor) -> dict:
        # SNR
        noise = original - quantized
        snr = 10 * torch.log10(torch.sum(original ** 2) / torch.sum(noise ** 2))
        
        # Fréchet Audio Distance (simplified)
        fad = self._compute_fad(original, quantized)
        
        return {
            'snr_db': float(snr),
            'fad': float(fad),
            'compression_ratio': 32 / self.target_bits
        }
```

### 3. LangChain Agent Orchestration

```python
# services/agents/orchestrator.py
from langchain.agents import AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI
from langchain.tools import Tool
from langchain.prompts import PromptTemplate

class MusicAgentOrchestrator:
    """Multi-agent orchestration using LangChain"""
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4", temperature=0.7)
        self.tools = self._create_tools()
        self.agent = self._create_agent()
        
    def _create_tools(self) -> list[Tool]:
        return [
            Tool(
                name="analyze_audio",
                func=self._analyze_audio,
                description="Analyze audio file for BPM, key, genre, and musical features"
            ),
            Tool(
                name="separate_stems",
                func=self._separate_stems,
                description="Separate audio into stems: vocals, drums, bass, other"
            ),
            Tool(
                name="apply_amapianorization",
                func=self._apply_amapianorization,
                description="Apply Amapiano style elements to audio"
            ),
            Tool(
                name="generate_music",
                func=self._generate_music,
                description="Generate new music based on prompt and parameters"
            ),
            Tool(
                name="quantize_model",
                func=self._quantize_model,
                description="Quantize audio model for efficient inference"
            )
        ]
    
    def _create_agent(self) -> AgentExecutor:
        prompt = PromptTemplate.from_template("""
        You are AURA-X, an autonomous music production agent specializing in Amapiano.
        
        You have access to the following tools:
        {tools}
        
        Use the following format:
        Goal: the goal you are trying to achieve
        Thought: reasoning about what to do next
        Action: the action to take, one of [{tool_names}]
        Action Input: the input to the action
        Observation: the result of the action
        ... (repeat Thought/Action/Observation as needed)
        Final Answer: the final result
        
        Goal: {input}
        {agent_scratchpad}
        """)
        
        agent = create_react_agent(self.llm, self.tools, prompt)
        return AgentExecutor(agent=agent, tools=self.tools, verbose=True)
    
    async def execute_goal(self, goal: str) -> dict:
        result = await self.agent.ainvoke({"input": goal})
        return {
            "output": result["output"],
            "intermediate_steps": result.get("intermediate_steps", [])
        }
```

### 4. Modal.com Deployment

```python
# modal_app/main.py
import modal
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Define Modal app with GPU
app = modal.App("aura-x-backend")

# Define image with all dependencies
image = modal.Image.debian_slim().pip_install(
    "fastapi",
    "uvicorn",
    "torch",
    "torchaudio",
    "essentia",
    "librosa",
    "demucs",
    "langchain",
    "langchain-openai",
    "faiss-gpu",
    "onnx",
    "onnxruntime-gpu",
    "transformers",
    "audiocraft"
)

# FastAPI app
web_app = FastAPI()

class AudioAnalysisRequest(BaseModel):
    audio_url: str
    analysis_type: str = "full"

class AgentGoalRequest(BaseModel):
    goal: str
    context: dict = {}

@app.function(image=image, gpu="A10G", timeout=600)
@modal.asgi_app()
def fastapi_app():
    from api.routes import audio, ml, agent, analysis
    
    web_app.include_router(audio.router, prefix="/audio")
    web_app.include_router(ml.router, prefix="/ml")
    web_app.include_router(agent.router, prefix="/agent")
    web_app.include_router(analysis.router, prefix="/analysis")
    
    return web_app

@app.function(image=image, gpu="A100", timeout=1800)
def train_model(dataset_path: str, model_config: dict):
    """Long-running model training job"""
    from services.ml.training.trainer import ModelTrainer
    trainer = ModelTrainer(model_config)
    return trainer.train(dataset_path)

@app.function(image=image, gpu="A10G")
def separate_stems(audio_bytes: bytes) -> dict:
    """GPU-accelerated stem separation using Demucs"""
    from services.audio.stem_separation import DemucsProcessor
    processor = DemucsProcessor()
    return processor.separate(audio_bytes)

@app.function(image=image, gpu="A10G")
def quantize_audio(audio_bytes: bytes, target_bits: int) -> dict:
    """Real SVDQuant audio quantization"""
    from services.ml.quantization.svdquant import SVDQuantAudio
    quantizer = SVDQuantAudio(target_bits=target_bits)
    return quantizer.quantize_from_bytes(audio_bytes)
```

## Migration Phases

### Phase 1: Infrastructure Setup (Week 1-2)
- [ ] Set up Modal.com account and GPU allocation
- [ ] Create Python backend repository structure
- [ ] Implement FastAPI skeleton with auth middleware
- [ ] Create Supabase Edge Function gateway to Python backend

### Phase 2: Audio Processing (Week 3-4)
- [ ] Port stem separation to local Demucs (remove Replicate dependency)
- [ ] Implement Essentia/Librosa feature extraction
- [ ] Create real SVDQuant implementation with PyTorch
- [ ] Add audio effects processing (sidechain, filters)

### Phase 3: ML Models (Week 5-6)
- [ ] Port authenticity model to PyTorch
- [ ] Implement real genre classifier with CNN
- [ ] Create element selector neural network
- [ ] Add ONNX export for edge deployment

### Phase 4: Agent Framework (Week 7-8)
- [ ] Implement LangChain agent orchestration
- [ ] Create custom tools for audio processing
- [ ] Add FAISS vector store for semantic search
- [ ] Implement multi-agent collaboration

### Phase 5: Integration (Week 9-10)
- [ ] Update Supabase Edge Functions to route to Python backend
- [ ] Implement caching layer for expensive operations
- [ ] Add monitoring and logging
- [ ] Performance optimization and load testing

## Cost Estimation

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| Modal.com A10G | 100 hours | ~$100-150 |
| Modal.com A100 (training) | 20 hours | ~$80-100 |
| Supabase Pro | Database + Edge | $25 |
| **Total** | | **~$205-275/mo** |

## Research Benefits for PhD

1. **True Phase-Coherent Quantization**: Real SVD implementation with PyTorch
2. **Proper Benchmarking**: FAD, SNR, perceptual metrics with reference implementations
3. **Reproducible Training**: Full training pipelines with logging
4. **Agent Research**: LangChain/AutoGen for multi-agent experiments
5. **Publication-Ready**: Code quality suitable for academic artifacts

## Next Steps

1. **Immediate**: Create Modal.com account, test GPU availability
2. **Short-term**: Implement proof-of-concept FastAPI + Demucs
3. **Medium-term**: Migrate stem separation away from Replicate
4. **Long-term**: Full agent framework with LangChain
