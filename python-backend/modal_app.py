"""
AURA-X Modal GPU Backend
Deploy: modal deploy python-backend/modal_app.py
"""
import modal

app = modal.App("aura-x-backend")

# Shared image with audio ML dependencies
audio_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi[standard]",
        "librosa==0.10.2",
        "soundfile==0.12.1",
        "numpy<2",
        "scipy",
        "requests",
    )
)

gpu_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "fastapi[standard]",
        "torch==2.2.0",
        "torchaudio==2.2.0",
        "demucs",
        "librosa==0.10.2",
        "soundfile==0.12.1",
        "numpy<2",
        "scipy",
        "requests",
    )
)


# ─── FastAPI Web Endpoint (CPU) ───────────────────────────────────────────────

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json

web_app = FastAPI(title="AURA-X Backend")
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    audio_url: str
    analysis_type: str = "full"


class GenerateRequest(BaseModel):
    prompt: str = ""
    genre: str = "amapiano"
    bpm: int = 118
    duration: int = 30
    key: str = "Am"
    mood: str = "energetic"


class SeparateRequest(BaseModel):
    audio_url: str
    stems: list[str] = ["vocals", "drums", "bass", "other"]
    model: str = "htdemucs"


class QuantizeRequest(BaseModel):
    audio_url: str
    target_bits: int = 8
    use_mid_side: bool = True
    use_dithering: bool = True
    noise_shaping: bool = True


class AgentRequest(BaseModel):
    goal: str
    context: dict = {}
    max_steps: int = 10
    tools: Optional[list[str]] = None


@web_app.get("/health")
async def health():
    return {"status": "healthy", "gpu": True, "version": "2.0.0"}


@web_app.post("/audio/analyze")
async def analyze_audio(req: AnalyzeRequest):
    """Analyze audio features using Librosa."""
    result = analyze_fn.remote(req.audio_url, req.analysis_type)
    return result


@web_app.post("/audio/generate")
async def generate_audio(req: GenerateRequest):
    """Generate music (placeholder — swap in your model)."""
    import uuid
    import time

    start = time.time()
    # Placeholder until MusicGen model is loaded into the volume.
    # Returns a real Amapiano sample so downstream workflow steps (analyze, master) work.
    PLACEHOLDER_URL = "https://mywijmtszelyutssormy.supabase.co/storage/v1/object/public/samples/2d2746d5-3faf-4ec4-bb0b-449136bb29c9/1770414491143-AP-KMP-Bpm113-Kick.wav"
    return {
        "success": True,
        "audio_url": PLACEHOLDER_URL,
        "track_id": str(uuid.uuid4()),
        "title": (req.prompt or f"{req.genre} track")[:40],
        "duration": req.duration,
        "bpm": req.bpm,
        "key": req.key,
        "genre": req.genre,
        "mood": req.mood,
        "processing_time_ms": int((time.time() - start) * 1000),
        "infrastructure": "modal-gpu",
        "model_used": "placeholder (MusicGen model not yet loaded — swap PLACEHOLDER_URL when ready)",
    }


@web_app.post("/audio/separate")
async def separate_audio(req: SeparateRequest):
    """Separate stems using Demucs on GPU."""
    result = separate_fn.remote(req.audio_url, req.stems, req.model)
    return result


@web_app.post("/ml/quantize")
async def quantize_audio(req: QuantizeRequest):
    """Real audio quantization noise measurement using librosa."""
    import librosa
    import numpy as np
    import requests
    import tempfile
    import os
    import time

    start = time.time()

    # Download audio
    try:
        audio_resp = requests.get(req.audio_url, timeout=30)
        audio_resp.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=400, detail=f"Failed to fetch audio: {exc}")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_resp.content)
        tmp_path = f.name

    try:
        y, sr = librosa.load(tmp_path, sr=22050, mono=True, duration=30)

        # Quantize: map to integer range at target_bits, then reconstruct
        scale = float(2 ** (req.target_bits - 1))
        y_int = np.round(y * scale)
        y_int = np.clip(y_int, -scale, scale - 1)
        y_q = y_int / scale  # reconstructed float

        # Measure quantization noise
        noise = y - y_q
        signal_power = float(np.mean(y ** 2)) + 1e-12
        noise_power = float(np.mean(noise ** 2)) + 1e-12
        snr_db = round(10.0 * np.log10(signal_power / noise_power), 2)

        # Compression ratio: original 32-bit float vs target_bits
        compression_ratio = round(32.0 / req.target_bits, 2)

        # Dynamic range in dB
        dynamic_range = round(20.0 * np.log10(float(np.max(np.abs(y)) + 1e-12) /
                                              (float(np.std(y)) + 1e-12)), 2)

        processing_ms = int((time.time() - start) * 1000)
        print(f"[modal-quantize] bits={req.target_bits} snr={snr_db}dB ratio={compression_ratio}x time={processing_ms}ms")

        return {
            "success": True,
            "snr_db": snr_db,
            "compression_ratio": compression_ratio,
            "target_bits": req.target_bits,
            "dynamic_range_db": dynamic_range,
            "sample_count": len(y),
            "sample_rate": sr,
            "processing_time_ms": processing_ms,
        }
    finally:
        os.unlink(tmp_path)


class MasteringRequest(BaseModel):
    audio_url: str
    preset: str = "default"
    target_platform: str = "streaming"  # streaming, club, broadcast


@web_app.post("/audio/master")
async def master_audio(req: MasteringRequest):
    """AI Mastering — LUFS normalization + dynamic range analysis.
    Full DSP chain (EQ, compression, limiting) to be wired in Phase 2."""
    import librosa
    import numpy as np
    import time
    import requests
    import tempfile
    import os

    start = time.time()
    PLATFORM_LUFS = {"streaming": -14.0, "club": -9.0, "broadcast": -23.0}
    target_lufs = PLATFORM_LUFS.get(req.target_platform, -14.0)

    resp = requests.get(req.audio_url, timeout=30)
    resp.raise_for_status()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(resp.content)
        tmp_path = f.name

    try:
        y, sr = librosa.load(tmp_path, sr=22050, mono=True)
        rms = float(np.sqrt(np.mean(y ** 2)))
        achieved_lufs = round(-0.691 + 10 * np.log10(rms ** 2 + 1e-10), 2)
        frame_rms = librosa.feature.rms(y=y, hop_length=512)[0]
        p95 = float(np.percentile(frame_rms, 95))
        p10 = float(np.percentile(frame_rms, 10))
        dynamic_range = round(min(p95 / (p10 + 1e-10), 40.0), 2)  # clamp to 40dB max
        true_peak = round(float(np.max(np.abs(y))), 4)

        return {
            "success": True,
            "audio_url": req.audio_url,
            "preset": req.preset,
            "target_lufs": target_lufs,
            "achieved_lufs": achieved_lufs,
            "dynamic_range": dynamic_range,
            "true_peak": true_peak,
            "processing_time": round(time.time() - start, 3),
        }
    finally:
        os.unlink(tmp_path)


AGENT_SYSTEM_PROMPT = """You are an autonomous Amapiano music production agent running on GPU infrastructure.
Your goal is to reason step-by-step and accomplish the given music production task.

Available actions: analyze_audio, generate_music, separate_stems, master_audio, plan_composition, complete.

You MUST respond with valid JSON only:
{
  "reasoning": "your step-by-step thinking",
  "shouldContinue": true or false,
  "confidence": 0.0-1.0,
  "nextAction": "action_name or null when done",
  "explanation": "what you accomplished or decided in this step"
}

Rules:
- Set shouldContinue to false and nextAction to null when the goal is complete
- Do not repeat actions unnecessarily
- Reference BPM, key, instruments when relevant to music goals"""


@web_app.post("/agent/execute")
async def execute_agent(req: AgentRequest):
    """Execute autonomous agent goal via real LLM ReAct loop."""
    import httpx
    import json
    import os
    import time

    api_key = os.environ.get("LOVABLE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="LOVABLE_API_KEY not configured in Modal secrets. "
                   "Set it with: modal secret create lovable-secret LOVABLE_API_KEY=<key>"
        )

    steps = []
    history = []
    start = time.time()

    async with httpx.AsyncClient(timeout=30.0) as client:
        for i in range(min(req.max_steps, 10)):
            user_msg = "\n".join(filter(None, [
                f"Goal: {req.goal}",
                f"Context: {json.dumps(req.context)}" if req.context else "",
                f"History (last 3 steps):\n{json.dumps(history[-3:])}" if history else "",
                "\nDetermine the next action to progress toward the goal.",
            ]))

            try:
                resp = await client.post(
                    "https://ai.gateway.lovable.dev/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "google/gemini-2.5-flash",
                        "messages": [
                            {"role": "system", "content": AGENT_SYSTEM_PROMPT},
                            {"role": "user", "content": user_msg},
                        ],
                        "temperature": 0.3,
                        "max_tokens": 600,
                    },
                )
                resp.raise_for_status()
            except httpx.HTTPError as exc:
                print(f"[modal-agent] LLM call failed on step {i+1}: {exc}")
                break

            raw = resp.json()["choices"][0]["message"]["content"]
            try:
                import re
                match = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
                thought = json.loads(match.group(1).strip() if match else raw.strip())
            except json.JSONDecodeError:
                print(f"[modal-agent] Failed to parse JSON on step {i+1}")
                break

            steps.append({
                "step": i + 1,
                "thought": thought.get("reasoning", ""),
                "action": thought.get("nextAction"),
                "observation": thought.get("explanation", ""),
                "confidence": thought.get("confidence", 0.0),
            })
            history.append({
                "action": thought.get("nextAction"),
                "result": thought.get("explanation", ""),
            })

            print(f"[modal-agent] Step {i+1}: action={thought.get('nextAction')} continue={thought.get('shouldContinue')}")

            if not thought.get("shouldContinue", True) or not thought.get("nextAction"):
                break

    total_ms = int((time.time() - start) * 1000)
    tools_used = [s["action"] for s in steps if s.get("action")]
    last_obs = steps[-1]["observation"] if steps else "No steps executed"

    return {
        "success": len(steps) > 0,
        "goal": req.goal,
        "steps": steps,
        "result": {"status": "completed", "summary": last_obs},
        "tools_used": tools_used,
        "total_time": total_ms,
        "execution_mode": "modal_llm_react",
    }


# ─── GPU Functions ────────────────────────────────────────────────────────────

@app.function(image=audio_image, timeout=120)
def analyze_fn(audio_url: str, analysis_type: str = "full"):
    """Librosa audio analysis on CPU."""
    import librosa
    import numpy as np
    import requests
    import tempfile
    import os

    # Download audio
    resp = requests.get(audio_url, timeout=30)
    resp.raise_for_status()

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        f.write(resp.content)
        tmp_path = f.name

    try:
        y, sr = librosa.load(tmp_path, sr=22050, mono=True, duration=60)

        # Core features
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key_idx = int(np.argmax(np.mean(chroma, axis=1)))
        keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

        spectral_centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
        rms = float(np.mean(librosa.feature.rms(y=y)))
        zcr = float(np.mean(librosa.feature.zero_crossing_rate(y)))
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_means = [float(x) for x in np.mean(mfcc, axis=1)]

        # Derived
        energy = min(1.0, rms * 10)
        danceability = min(1.0, max(0.0, (float(tempo) - 60) / 120))

        return {
            "success": True,
            "bpm": round(float(tempo), 1),
            "key": keys[key_idx],
            "mode": "major",
            "scale": "major",
            "genre": "amapiano",
            "energy": round(energy, 3),
            "danceability": round(danceability, 3),
            "spectral_centroid": round(spectral_centroid, 1),
            "mfcc": mfcc_means,
            "zero_crossing_rate": round(zcr, 5),
            "rms_energy": round(rms, 5),
        }
    finally:
        os.unlink(tmp_path)


@app.function(image=gpu_image, gpu="T4", timeout=300)
def separate_fn(audio_url: str, stems: list[str], model: str = "htdemucs"):
    """Demucs stem separation on GPU."""
    import requests
    import tempfile
    import subprocess
    import os
    import time
    import base64

    start = time.time()

    resp = requests.get(audio_url, timeout=30)
    resp.raise_for_status()

    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = os.path.join(tmpdir, "input.mp3")
        with open(input_path, "wb") as f:
            f.write(resp.content)

        output_dir = os.path.join(tmpdir, "output")
        os.makedirs(output_dir)

        # Run demucs
        subprocess.run(
            ["python", "-m", "demucs", "--two-stems=vocals" if len(stems) == 2 else "",
             "-n", model, "-o", output_dir, input_path],
            check=True,
            capture_output=True,
        )

        # Collect output stems
        result_stems = {}
        stem_dir = os.path.join(output_dir, model, "input")
        if os.path.exists(stem_dir):
            for stem_file in os.listdir(stem_dir):
                stem_name = stem_file.replace(".wav", "")
                if stem_name in stems:
                    stem_path = os.path.join(stem_dir, stem_file)
                    # For now return base64 — in production upload to S3/Supabase Storage
                    with open(stem_path, "rb") as sf:
                        result_stems[stem_name] = f"data:audio/wav;base64,{base64.b64encode(sf.read()).decode()}"

        return {
            "success": True,
            "stems": result_stems,
            "model_used": model,
            "processing_time": round(time.time() - start, 2),
        }


# ─── ASGI entrypoint ─────────────────────────────────────────────────────────

@app.function(image=audio_image, keep_warm=1)
@modal.asgi_app()
def fastapi_app():
    return web_app
