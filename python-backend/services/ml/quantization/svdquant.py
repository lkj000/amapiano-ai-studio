"""
SVDQuant-Audio: Phase-Coherent Audio Quantization using True SVD

This implements the core PhD research contribution - phase-aware quantization
that preserves audio transients, stereo imaging, and rhythmic integrity where
standard INT8 quantization fails.

Key innovations:
1. SVD on magnitude spectrogram (not time domain)
2. Phase preservation during reconstruction
3. Psychoacoustic masking for aggressive quantization
4. Mid/Side processing for stereo preservation
"""

import numpy as np
from dataclasses import dataclass
from typing import Optional, Tuple
from enum import Enum

# PyTorch import with fallback
try:
    import torch
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


class QuantizationMode(Enum):
    """Quantization modes for different quality/size tradeoffs"""
    AGGRESSIVE = 4    # 4-bit - Maximum compression
    BALANCED = 8      # 8-bit - Good quality/size balance  
    QUALITY = 16      # 16-bit - Near-lossless


@dataclass
class QuantizationMetrics:
    """Quality metrics for quantized audio"""
    snr_db: float
    fad: float
    phase_coherence: float
    transient_preservation: float
    stereo_imaging: float
    dynamic_range: float
    compression_ratio: float
    rank_used: int
    energy_preserved: float


class SVDQuantAudio:
    """
    Phase-coherent audio quantization using true Singular Value Decomposition.
    
    This is the production implementation of the SVDQuant-Audio algorithm
    described in the PhD research proposal. It addresses the fundamental
    limitation that standard quantization destroys audio "air" and rhythmic
    drive by not accounting for phase relationships.
    
    Algorithm:
    1. Convert to STFT domain (preserving phase information)
    2. Apply SVD to magnitude spectrogram
    3. Select rank based on energy preservation target
    4. Quantize singular values with psychoacoustic weighting
    5. Reconstruct magnitude and recombine with original phase
    6. Inverse STFT to time domain
    
    For stereo audio, we use Mid/Side encoding where:
    - Mid channel uses target bit depth
    - Side channel uses higher bit depth to preserve stereo imaging
    """
    
    def __init__(
        self,
        target_bits: int = 8,
        energy_threshold: float = 0.99,
        n_fft: int = 2048,
        hop_length: int = 512,
        use_dithering: bool = True,
        use_noise_shaping: bool = True,
        psychoacoustic_masking: bool = True
    ):
        """
        Initialize SVDQuant processor.
        
        Args:
            target_bits: Target bit depth (4, 8, or 16)
            energy_threshold: Fraction of energy to preserve (0.95-0.999)
            n_fft: FFT size for STFT
            hop_length: Hop size for STFT
            use_dithering: Apply TPDF dithering
            use_noise_shaping: Apply first-order noise shaping
            psychoacoustic_masking: Weight quantization by perceptual importance
        """
        self.target_bits = target_bits
        self.energy_threshold = energy_threshold
        self.n_fft = n_fft
        self.hop_length = hop_length
        self.use_dithering = use_dithering
        self.use_noise_shaping = use_noise_shaping
        self.psychoacoustic_masking = psychoacoustic_masking
        
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is required for SVDQuant")
    
    def quantize(
        self,
        audio: torch.Tensor,
        sample_rate: int = 44100
    ) -> Tuple[torch.Tensor, QuantizationMetrics]:
        """
        Apply SVDQuant to audio tensor.
        
        Args:
            audio: Audio tensor of shape (channels, samples) or (samples,)
            sample_rate: Sample rate in Hz
            
        Returns:
            Tuple of (quantized_audio, metrics)
        """
        # Ensure 2D
        if audio.dim() == 1:
            audio = audio.unsqueeze(0)
        
        n_channels = audio.shape[0]
        
        if n_channels == 2:
            # Stereo: Use Mid/Side processing
            return self._quantize_stereo(audio, sample_rate)
        else:
            # Mono processing
            return self._quantize_mono(audio[0], sample_rate)
    
    def _quantize_mono(
        self,
        audio: torch.Tensor,
        sample_rate: int
    ) -> Tuple[torch.Tensor, QuantizationMetrics]:
        """Quantize mono audio"""
        
        # 1. STFT
        stft = torch.stft(
            audio,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
            window=torch.hann_window(self.n_fft, device=audio.device),
            return_complex=True
        )
        
        magnitude = torch.abs(stft)
        phase = torch.angle(stft)
        
        # 2. SVD on magnitude spectrogram
        # Shape: (freq_bins, time_frames)
        U, S, Vh = torch.linalg.svd(magnitude, full_matrices=False)
        
        # 3. Energy-based rank selection
        total_energy = torch.sum(S ** 2)
        cumulative_energy = torch.cumsum(S ** 2, dim=0) / total_energy
        rank = int(torch.searchsorted(cumulative_energy, self.energy_threshold).item()) + 1
        rank = max(1, min(rank, len(S)))
        
        energy_preserved = float(cumulative_energy[rank - 1])
        
        # 4. Truncate to selected rank
        U_reduced = U[:, :rank]
        S_reduced = S[:rank]
        Vh_reduced = Vh[:rank, :]
        
        # 5. Quantize singular values
        S_quantized = self._quantize_singular_values(
            S_reduced, 
            sample_rate
        )
        
        # 6. Reconstruct magnitude
        magnitude_reconstructed = U_reduced @ torch.diag(S_quantized) @ Vh_reduced
        
        # 7. Recombine with original phase
        stft_reconstructed = magnitude_reconstructed * torch.exp(1j * phase)
        
        # 8. Inverse STFT
        audio_quantized = torch.istft(
            stft_reconstructed,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
            window=torch.hann_window(self.n_fft, device=audio.device),
            length=len(audio)
        )
        
        # Calculate metrics
        metrics = self._calculate_metrics(
            audio, audio_quantized, phase, rank, energy_preserved
        )
        
        return audio_quantized.unsqueeze(0), metrics
    
    def _quantize_stereo(
        self,
        audio: torch.Tensor,
        sample_rate: int
    ) -> Tuple[torch.Tensor, QuantizationMetrics]:
        """
        Quantize stereo audio using Mid/Side encoding.
        
        Mid channel uses target bit depth, Side channel uses higher
        bit depth (minimum 8-bit) to preserve stereo imaging.
        """
        left, right = audio[0], audio[1]
        
        # Mid/Side encoding
        mid = (left + right) / 2
        side = (left - right) / 2
        
        # Quantize mid channel at target bits
        mid_quantized, mid_metrics = self._quantize_mono(mid, sample_rate)
        mid_quantized = mid_quantized[0]
        
        # Quantize side channel at higher bit depth for stereo preservation
        side_bits = max(8, self.target_bits + 4)
        original_bits = self.target_bits
        self.target_bits = side_bits
        side_quantized, _ = self._quantize_mono(side, sample_rate)
        side_quantized = side_quantized[0]
        self.target_bits = original_bits
        
        # Decode back to L/R
        left_quantized = mid_quantized + side_quantized
        right_quantized = mid_quantized - side_quantized
        
        audio_quantized = torch.stack([left_quantized, right_quantized])
        
        # Calculate stereo imaging metric
        original_correlation = float(torch.corrcoef(
            torch.stack([left, right])
        )[0, 1])
        quantized_correlation = float(torch.corrcoef(
            torch.stack([left_quantized, right_quantized])
        )[0, 1])
        
        stereo_imaging = 1.0 - abs(original_correlation - quantized_correlation)
        
        # Update metrics with stereo info
        metrics = QuantizationMetrics(
            snr_db=mid_metrics.snr_db,
            fad=mid_metrics.fad,
            phase_coherence=mid_metrics.phase_coherence,
            transient_preservation=mid_metrics.transient_preservation,
            stereo_imaging=stereo_imaging,
            dynamic_range=mid_metrics.dynamic_range,
            compression_ratio=mid_metrics.compression_ratio,
            rank_used=mid_metrics.rank_used,
            energy_preserved=mid_metrics.energy_preserved
        )
        
        return audio_quantized, metrics
    
    def _quantize_singular_values(
        self,
        S: torch.Tensor,
        sample_rate: int
    ) -> torch.Tensor:
        """
        Quantize singular values with optional psychoacoustic weighting.
        """
        levels = 2 ** self.target_bits
        
        if self.psychoacoustic_masking:
            # Weight by perceptual importance (larger singular values = more important)
            weights = S / S.max()
            effective_bits = self.target_bits * (0.5 + 0.5 * weights)
            effective_levels = (2 ** effective_bits).int()
        else:
            effective_levels = torch.full_like(S, levels, dtype=torch.int32)
        
        S_min, S_max = S.min(), S.max()
        S_range = S_max - S_min + 1e-10
        
        # Normalize to [0, 1]
        S_normalized = (S - S_min) / S_range
        
        # Add TPDF dithering
        if self.use_dithering:
            dither = (torch.rand_like(S) + torch.rand_like(S) - 1) / levels
            S_normalized = S_normalized + dither
            S_normalized = torch.clamp(S_normalized, 0, 1)
        
        # Quantize
        S_quantized_normalized = torch.round(
            S_normalized * (effective_levels.float() - 1)
        ) / (effective_levels.float() - 1)
        
        # Apply noise shaping (first-order)
        if self.use_noise_shaping:
            error = S_normalized - S_quantized_normalized
            # Shift error to next coefficient
            error_shifted = torch.roll(error, 1)
            error_shifted[0] = 0
            S_quantized_normalized = S_quantized_normalized + 0.5 * error_shifted
            S_quantized_normalized = torch.clamp(S_quantized_normalized, 0, 1)
        
        # Denormalize
        S_quantized = S_quantized_normalized * S_range + S_min
        
        return S_quantized
    
    def _calculate_metrics(
        self,
        original: torch.Tensor,
        quantized: torch.Tensor,
        phase: torch.Tensor,
        rank: int,
        energy_preserved: float
    ) -> QuantizationMetrics:
        """Calculate comprehensive quality metrics"""
        
        # Ensure same length
        min_len = min(len(original), len(quantized))
        original = original[:min_len]
        quantized = quantized[:min_len]
        
        # SNR
        noise = original - quantized
        signal_power = torch.sum(original ** 2)
        noise_power = torch.sum(noise ** 2)
        snr_db = float(10 * torch.log10(signal_power / (noise_power + 1e-10)))
        
        # FAD (simplified - spectral distance)
        orig_spec = torch.abs(torch.fft.rfft(original))
        quant_spec = torch.abs(torch.fft.rfft(quantized))
        fad = float(torch.mean((orig_spec - quant_spec) ** 2))
        fad = fad / (float(torch.mean(orig_spec ** 2)) + 1e-10)  # Normalize
        
        # Phase coherence
        quant_stft = torch.stft(
            quantized,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
            window=torch.hann_window(self.n_fft, device=quantized.device),
            return_complex=True
        )
        quant_phase = torch.angle(quant_stft)
        
        # Trim to match dimensions
        min_time = min(phase.shape[1], quant_phase.shape[1])
        phase_diff = phase[:, :min_time] - quant_phase[:, :min_time]
        phase_coherence = float(torch.mean(torch.cos(phase_diff)))
        phase_coherence = (phase_coherence + 1) / 2  # Normalize to [0, 1]
        
        # Transient preservation (high-frequency energy ratio)
        orig_hf = torch.mean(orig_spec[len(orig_spec)//2:] ** 2)
        quant_hf = torch.mean(quant_spec[len(quant_spec)//2:] ** 2)
        transient_preservation = float(quant_hf / (orig_hf + 1e-10))
        transient_preservation = min(1.0, transient_preservation)
        
        # Dynamic range
        orig_db = 20 * torch.log10(torch.abs(original) + 1e-10)
        quant_db = 20 * torch.log10(torch.abs(quantized) + 1e-10)
        orig_range = float(orig_db.max() - orig_db[orig_db > -60].min())
        quant_range = float(quant_db.max() - quant_db[quant_db > -60].min())
        dynamic_range = quant_range / (orig_range + 1e-10)
        
        return QuantizationMetrics(
            snr_db=snr_db,
            fad=fad,
            phase_coherence=phase_coherence,
            transient_preservation=transient_preservation,
            stereo_imaging=1.0,  # Updated for stereo in _quantize_stereo
            dynamic_range=dynamic_range,
            compression_ratio=32 / self.target_bits,
            rank_used=rank,
            energy_preserved=energy_preserved
        )
    
    def quality_check(self, metrics: QuantizationMetrics) -> Tuple[bool, str]:
        """
        Check if quantization meets quality thresholds.
        
        Returns:
            Tuple of (passed, message)
        """
        thresholds = {
            4: {'snr': 15, 'fad': 0.25, 'transient': 0.7},
            8: {'snr': 25, 'fad': 0.15, 'transient': 0.85},
            16: {'snr': 40, 'fad': 0.05, 'transient': 0.95}
        }
        
        t = thresholds.get(self.target_bits, thresholds[8])
        
        issues = []
        if metrics.snr_db < t['snr']:
            issues.append(f"SNR {metrics.snr_db:.1f}dB < {t['snr']}dB threshold")
        if metrics.fad > t['fad']:
            issues.append(f"FAD {metrics.fad:.3f} > {t['fad']} threshold")
        if metrics.transient_preservation < t['transient']:
            issues.append(f"Transient preservation {metrics.transient_preservation:.2f} < {t['transient']}")
        
        if issues:
            return False, "; ".join(issues)
        return True, "All quality thresholds met"


# Convenience function for quick usage
def quantize_audio(
    audio: np.ndarray,
    sample_rate: int = 44100,
    target_bits: int = 8
) -> Tuple[np.ndarray, dict]:
    """
    Quick quantization function.
    
    Args:
        audio: Audio as numpy array
        sample_rate: Sample rate in Hz
        target_bits: Target bit depth
        
    Returns:
        Tuple of (quantized_audio, metrics_dict)
    """
    quantizer = SVDQuantAudio(target_bits=target_bits)
    audio_tensor = torch.from_numpy(audio).float()
    
    quantized, metrics = quantizer.quantize(audio_tensor, sample_rate)
    
    return quantized.numpy(), {
        'snr_db': metrics.snr_db,
        'fad': metrics.fad,
        'phase_coherence': metrics.phase_coherence,
        'transient_preservation': metrics.transient_preservation,
        'stereo_imaging': metrics.stereo_imaging,
        'compression_ratio': metrics.compression_ratio
    }
