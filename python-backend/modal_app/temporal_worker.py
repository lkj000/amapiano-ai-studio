"""
AURA-X Temporal Worker — Modal Deployment
==========================================
Runs Temporal workflow workers on Modal with GPU access for audio processing.

Deploy:  modal deploy modal_app/temporal_worker.py
Run:     modal run modal_app/temporal_worker.py

Connects to Temporal Cloud (auraxdev.y6hje) and listens on 'aura-x-agent-queue'.
"""

import modal
import os
import json
import asyncio
from datetime import timedelta
from dataclasses import dataclass
from typing import Optional

# ── Modal App Setup ──────────────────────────────────────────────

app = modal.App("aura-x-temporal-worker")

# Image with Temporal SDK + audio processing deps
worker_image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "temporalio>=1.7.1",
    "httpx==0.25.0",
    "numpy",
    "scipy",
    "pydantic>=2.0",
)

# Secrets from Modal (set via `modal secret create temporal-creds ...`)
temporal_secret = modal.Secret.from_name(
    "temporal-creds",
    required_keys=["TEMPORAL_API_KEY", "TEMPORAL_NAMESPACE", "TEMPORAL_ENDPOINT"],
)

# Optional: if you've created a 'modal-backend-url' secret, uncomment below
# modal_backend_secret = modal.Secret.from_name("modal-backend-url", required_keys=["MODAL_BACKEND_URL"])


# ── Workflow Input/Output Schemas ────────────────────────────────

@dataclass
class ProductionInput:
    genre: str = "amapiano"
    bpm: int = 115
    key: str = "Cm"
    mood: Optional[str] = None
    region: Optional[str] = None
    duration: Optional[int] = None
    goal: Optional[str] = None
    context: Optional[dict] = None
    max_steps: int = 10


@dataclass
class ProductionResult:
    status: str = "completed"
    audio_url: Optional[str] = None
    analysis: Optional[dict] = None
    steps_completed: int = 0
    message: str = ""


@dataclass
class MasteringInput:
    audio_url: str = ""
    preset: Optional[str] = None
    target_platform: Optional[str] = None


@dataclass
class MixdownInput:
    stems: dict = None
    target_lufs: float = -14.0
    preset: Optional[str] = None

    def __post_init__(self):
        if self.stems is None:
            self.stems = {}


@dataclass
class AnalysisInput:
    audio_url: str = ""
    analysis_type: Optional[str] = None


@dataclass
class AmapianorizeInput:
    audio_url: str = ""
    region: str = "gauteng"
    intensity: float = 0.7
    elements: list = None

    def __post_init__(self):
        if self.elements is None:
            self.elements = ["log_drum", "percussion", "bass"]


@dataclass
class WorkflowProgress:
    stage: str = "initializing"
    percent: int = 0
    current_step: str = ""
    steps_completed: int = 0
    total_steps: int = 1


# ── Activity Definitions ────────────────────────────────────────
# Activities are the actual GPU-powered work units

from temporalio import activity, workflow
from temporalio.client import Client
from temporalio.worker import Worker


@activity.defn
async def analyze_audio(audio_url: str, analysis_type: str = "full") -> dict:
    """Call Modal GPU backend for audio analysis (BPM, key, LUFS, spectral)."""
    import httpx

    backend_url = os.environ.get("MODAL_BACKEND_URL", "https://mabgwej--aura-x-backend-fastapi-app.modal.run")
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{backend_url.rstrip('/')}/audio/analyze",
            json={"audio_url": audio_url, "analysis_type": analysis_type},
        )
        resp.raise_for_status()
        return resp.json()


@activity.defn
async def separate_stems(audio_url: str) -> dict:
    """Call Modal GPU backend for stem separation (Demucs)."""
    import httpx

    backend_url = os.environ.get("MODAL_BACKEND_URL", "https://mabgwej--aura-x-backend-fastapi-app.modal.run")
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{backend_url.rstrip('/')}/audio/separate",
            json={"audio_url": audio_url},
        )
        resp.raise_for_status()
        return resp.json()


@activity.defn
async def generate_audio(params: dict) -> dict:
    """Call Modal GPU backend for audio generation."""
    import httpx

    backend_url = os.environ.get("MODAL_BACKEND_URL", "https://mabgwej--aura-x-backend-fastapi-app.modal.run")
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{backend_url.rstrip('/')}/audio/generate",
            json=params,
        )
        resp.raise_for_status()
        return resp.json()


@activity.defn
async def master_audio(audio_url: str, preset: str = "default", target_platform: str = "streaming") -> dict:
    """Call Modal GPU backend for mastering."""
    import httpx

    backend_url = os.environ.get("MODAL_BACKEND_URL", "https://mabgwej--aura-x-backend-fastapi-app.modal.run")
    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(
            f"{backend_url.rstrip('/')}/audio/master",
            json={
                "audio_url": audio_url,
                "preset": preset,
                "target_platform": target_platform,
            },
        )
        resp.raise_for_status()
        return resp.json()


@activity.defn
async def amapianorize_audio(audio_url: str, region: str, intensity: float, elements: list) -> dict:
    """Call Modal GPU backend for Amapiano cultural transformation."""
    import httpx

    backend_url = os.environ.get("MODAL_BACKEND_URL", "https://mabgwej--aura-x-backend-fastapi-app.modal.run")
    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(
            f"{backend_url.rstrip('/')}/audio/amapianorize",
            json={
                "audio_url": audio_url,
                "region": region,
                "intensity": intensity,
                "elements": elements,
            },
        )
        resp.raise_for_status()
        return resp.json()


# ── Workflow Definitions ─────────────────────────────────────────

@workflow.defn(name="ProductionWorkflow")
class ProductionWorkflow:
    """Full track production pipeline: plan → generate → analyze → refine → master."""

    def __init__(self):
        self._progress = WorkflowProgress(stage="queued", total_steps=5)
        self._feedback = None

    @workflow.query(name="progress")
    def get_progress(self) -> dict:
        return {
            "stage": self._progress.stage,
            "percent": self._progress.percent,
            "currentStep": self._progress.current_step,
            "stepsCompleted": self._progress.steps_completed,
            "totalSteps": self._progress.total_steps,
        }

    @workflow.signal(name="user-feedback")
    async def receive_feedback(self, feedback: dict):
        self._feedback = feedback

    @workflow.run
    async def run(self, input_data: dict) -> dict:
        genre = input_data.get("genre", "amapiano")
        bpm = input_data.get("bpm", 115)
        key = input_data.get("key", "Cm")
        mood = input_data.get("mood", "energetic")
        goal = input_data.get("goal", f"Produce a {genre} track at {bpm} BPM in {key}")

        results = {"goal": goal, "steps": []}

        # Step 1: Generate base audio
        self._progress = WorkflowProgress(
            stage="generating", percent=10,
            current_step="Generating base audio", steps_completed=0, total_steps=5,
        )
        try:
            gen_result = await workflow.execute_activity(
                generate_audio,
                args=[{"genre": genre, "bpm": bpm, "key": key, "mood": mood}],
                start_to_close_timeout=timedelta(seconds=120),
                retry_policy=workflow.RetryPolicy(maximum_attempts=3),
            )
            results["steps"].append({"step": "generate", "result": gen_result})
            audio_url = gen_result.get("audio_url", "")
        except Exception as e:
            results["error"] = f"Generation failed: {str(e)}"
            results["status"] = "failed"
            return results

        # Step 2: Analyze generated audio
        self._progress = WorkflowProgress(
            stage="analyzing", percent=30,
            current_step="Analyzing audio quality", steps_completed=1, total_steps=5,
        )
        try:
            analysis = await workflow.execute_activity(
                analyze_audio,
                args=[audio_url, "full"],
                start_to_close_timeout=timedelta(seconds=60),
                retry_policy=workflow.RetryPolicy(maximum_attempts=2),
            )
            results["steps"].append({"step": "analyze", "result": analysis})
            results["analysis"] = analysis
        except Exception as e:
            workflow.logger.warning(f"Analysis failed (non-fatal): {e}")

        # Step 3: Wait for optional user feedback (up to 5 minutes)
        self._progress = WorkflowProgress(
            stage="awaiting_feedback", percent=50,
            current_step="Awaiting user feedback", steps_completed=2, total_steps=5,
        )
        try:
            await workflow.wait_condition(lambda: self._feedback is not None, timeout=timedelta(minutes=5))
        except asyncio.TimeoutError:
            workflow.logger.info("No feedback received, continuing with defaults")

        if self._feedback and self._feedback.get("rating", 5) < 3:
            # Re-generate with adjustments if rating is low
            self._progress.current_step = "Re-generating with adjustments"
            adjustments = self._feedback.get("adjustments", {})
            try:
                gen_result = await workflow.execute_activity(
                    generate_audio,
                    args=[{**{"genre": genre, "bpm": bpm, "key": key, "mood": mood}, **adjustments}],
                    start_to_close_timeout=timedelta(seconds=120),
                )
                audio_url = gen_result.get("audio_url", audio_url)
                results["steps"].append({"step": "regenerate", "result": gen_result})
            except Exception as e:
                workflow.logger.warning(f"Regeneration failed: {e}")

        # Step 4: Master the final audio
        self._progress = WorkflowProgress(
            stage="mastering", percent=75,
            current_step="Mastering final audio", steps_completed=3, total_steps=5,
        )
        try:
            master_result = await workflow.execute_activity(
                master_audio,
                args=[audio_url, "default", "streaming"],
                start_to_close_timeout=timedelta(seconds=90),
            )
            results["steps"].append({"step": "master", "result": master_result})
            results["audio_url"] = master_result.get("audio_url", audio_url)
        except Exception as e:
            workflow.logger.warning(f"Mastering failed (non-fatal): {e}")
            results["audio_url"] = audio_url

        # Step 5: Complete
        self._progress = WorkflowProgress(
            stage="completed", percent=100,
            current_step="Production complete", steps_completed=5, total_steps=5,
        )
        results["status"] = "completed"
        results["message"] = f"Successfully produced {genre} track at {bpm} BPM"
        return results


@workflow.defn(name="MasteringWorkflow")
class MasteringWorkflow:
    """AI mastering pipeline."""

    def __init__(self):
        self._progress = WorkflowProgress(stage="queued", total_steps=3)

    @workflow.query(name="progress")
    def get_progress(self) -> dict:
        return {
            "stage": self._progress.stage,
            "percent": self._progress.percent,
            "currentStep": self._progress.current_step,
            "stepsCompleted": self._progress.steps_completed,
            "totalSteps": self._progress.total_steps,
        }

    @workflow.run
    async def run(self, input_data: dict) -> dict:
        audio_url = input_data.get("audio_url", "")
        preset = input_data.get("preset", "default")
        target_platform = input_data.get("target_platform", "streaming")

        # Step 1: Analyze input
        self._progress = WorkflowProgress(stage="analyzing", percent=20, current_step="Analyzing input audio", steps_completed=0, total_steps=3)
        analysis = await workflow.execute_activity(
            analyze_audio, args=[audio_url, "mastering"],
            start_to_close_timeout=timedelta(seconds=60),
        )

        # Step 2: Master
        self._progress = WorkflowProgress(stage="mastering", percent=60, current_step="Applying mastering chain", steps_completed=1, total_steps=3)
        result = await workflow.execute_activity(
            master_audio, args=[audio_url, preset, target_platform],
            start_to_close_timeout=timedelta(seconds=90),
        )

        # Step 3: Done
        self._progress = WorkflowProgress(stage="completed", percent=100, current_step="Mastering complete", steps_completed=3, total_steps=3)
        return {"status": "completed", "audio_url": result.get("audio_url", audio_url), "analysis": analysis}


@workflow.defn(name="MixdownWorkflow")
class MixdownWorkflow:
    """Multi-stem mixdown."""

    def __init__(self):
        self._progress = WorkflowProgress(stage="queued", total_steps=2)

    @workflow.query(name="progress")
    def get_progress(self) -> dict:
        return {"stage": self._progress.stage, "percent": self._progress.percent, "currentStep": self._progress.current_step, "stepsCompleted": self._progress.steps_completed, "totalSteps": self._progress.total_steps}

    @workflow.run
    async def run(self, input_data: dict) -> dict:
        stems = input_data.get("stems", {})
        target_lufs = input_data.get("target_lufs", -14.0)

        self._progress = WorkflowProgress(stage="mixing", percent=50, current_step="Mixing stems", steps_completed=0, total_steps=2)
        result = await workflow.execute_activity(
            generate_audio, args=[{"action": "mixdown", "stems": stems, "target_lufs": target_lufs}],
            start_to_close_timeout=timedelta(seconds=120),
        )

        self._progress = WorkflowProgress(stage="completed", percent=100, current_step="Mixdown complete", steps_completed=2, total_steps=2)
        return {"status": "completed", "audio_url": result.get("audio_url", ""), "mix_data": result}


@workflow.defn(name="AnalysisWorkflow")
class AnalysisWorkflow:
    """Deep audio analysis."""

    def __init__(self):
        self._progress = WorkflowProgress(stage="queued", total_steps=1)

    @workflow.query(name="progress")
    def get_progress(self) -> dict:
        return {"stage": self._progress.stage, "percent": self._progress.percent, "currentStep": self._progress.current_step, "stepsCompleted": self._progress.steps_completed, "totalSteps": self._progress.total_steps}

    @workflow.run
    async def run(self, input_data: dict) -> dict:
        audio_url = input_data.get("audio_url", "")
        analysis_type = input_data.get("analysis_type", "full")

        self._progress = WorkflowProgress(stage="analyzing", percent=50, current_step="Running deep analysis", steps_completed=0, total_steps=1)
        result = await workflow.execute_activity(
            analyze_audio, args=[audio_url, analysis_type],
            start_to_close_timeout=timedelta(seconds=60),
        )

        self._progress = WorkflowProgress(stage="completed", percent=100, current_step="Analysis complete", steps_completed=1, total_steps=1)
        return {"status": "completed", "analysis": result}


@workflow.defn(name="AmapianorizeWorkflow")
class AmapianorizeWorkflow:
    """Cultural transformation pipeline."""

    def __init__(self):
        self._progress = WorkflowProgress(stage="queued", total_steps=3)

    @workflow.query(name="progress")
    def get_progress(self) -> dict:
        return {"stage": self._progress.stage, "percent": self._progress.percent, "currentStep": self._progress.current_step, "stepsCompleted": self._progress.steps_completed, "totalSteps": self._progress.total_steps}

    @workflow.signal(name="user-feedback")
    async def receive_feedback(self, feedback: dict):
        self._feedback = feedback

    @workflow.run
    async def run(self, input_data: dict) -> dict:
        audio_url = input_data.get("audio_url", "")
        region = input_data.get("region", "gauteng")
        intensity = input_data.get("intensity", 0.7)
        elements = input_data.get("elements", ["log_drum", "percussion", "bass"])

        # Step 1: Analyze source
        self._progress = WorkflowProgress(stage="analyzing", percent=20, current_step="Analyzing source audio", steps_completed=0, total_steps=3)
        analysis = await workflow.execute_activity(
            analyze_audio, args=[audio_url, "full"],
            start_to_close_timeout=timedelta(seconds=60),
        )

        # Step 2: Separate stems
        self._progress = WorkflowProgress(stage="separating", percent=50, current_step="Separating stems", steps_completed=1, total_steps=3)
        stems = await workflow.execute_activity(
            separate_stems, args=[audio_url],
            start_to_close_timeout=timedelta(seconds=120),
        )

        # Step 3: Apply cultural transformation
        self._progress = WorkflowProgress(stage="transforming", percent=80, current_step="Applying Amapiano elements", steps_completed=2, total_steps=3)
        result = await workflow.execute_activity(
            amapianorize_audio, args=[audio_url, region, intensity, elements],
            start_to_close_timeout=timedelta(seconds=90),
        )

        self._progress = WorkflowProgress(stage="completed", percent=100, current_step="Transformation complete", steps_completed=3, total_steps=3)
        return {
            "status": "completed",
            "audio_url": result.get("audio_url", audio_url),
            "analysis": analysis,
            "stems": stems,
            "transformation": result,
        }


# ── Modal Class: Persistent Temporal Worker ──────────────────────
# Uses @modal.enter() so the worker auto-starts on `modal deploy`
# when min_containers=1 spins up the container.

@app.cls(
    image=worker_image,
    secrets=[temporal_secret],
    timeout=86400,  # 24h max container lifetime
    min_containers=1,  # Always keep 1 running — worker starts on deploy
)
class TemporalWorkerService:
    @modal.enter()
    async def start_worker(self):
        """Runs automatically when the container starts (on deploy or scale-up)."""
        namespace = os.environ["TEMPORAL_NAMESPACE"]
        api_key = os.environ["TEMPORAL_API_KEY"]
        endpoint = os.environ.get("TEMPORAL_ENDPOINT", "us-east-1.aws.api.temporal.io:7233")

        print(f"[WORKER] Connecting to Temporal Cloud: {endpoint} / {namespace}")

        self.client = await Client.connect(
            endpoint,
            namespace=namespace,
            api_key=api_key,
            tls=True,
        )

        print("[WORKER] Connected! Starting worker on queue: aura-x-agent-queue")

        self.worker = Worker(
            self.client,
            task_queue="aura-x-agent-queue",
            workflows=[
                ProductionWorkflow,
                MasteringWorkflow,
                MixdownWorkflow,
                AnalysisWorkflow,
                AmapianorizeWorkflow,
            ],
            activities=[
                analyze_audio,
                separate_stems,
                generate_audio,
                master_audio,
                amapianorize_audio,
            ],
        )

        print("[WORKER] Worker started. Listening for workflows...")
        # Run the worker in the background — it polls Temporal via gRPC
        self._worker_task = asyncio.create_task(self.worker.run())

    @modal.method()
    async def health(self) -> dict:
        """Health check endpoint for monitoring."""
        return {
            "status": "running",
            "task_queue": "aura-x-agent-queue",
            "workflows": ["ProductionWorkflow", "MasteringWorkflow", "MixdownWorkflow", "AnalysisWorkflow", "AmapianorizeWorkflow"],
        }

    @modal.exit()
    async def shutdown(self):
        """Graceful shutdown when container is recycled."""
        print("[WORKER] Shutting down gracefully...")
        if hasattr(self, '_worker_task'):
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        print("[WORKER] Shutdown complete.")


# ── Entrypoint (for `modal run` testing) ─────────────────────────

@app.local_entrypoint()
def main():
    """
    For testing: modal run modal_app/temporal_worker.py
    For production: modal deploy modal_app/temporal_worker.py
      (worker auto-starts via min_containers=1 + @modal.enter)
    """
    print("Starting AURA-X Temporal Worker on Modal...")
    svc = TemporalWorkerService()
    svc.health.remote()
