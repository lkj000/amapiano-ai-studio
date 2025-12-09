"""
Production-grade Audio Feature Extraction using Essentia and Librosa
Replaces JavaScript approximations with proper DSP algorithms
"""

import numpy as np
from typing import Optional
from dataclasses import dataclass

# Conditional imports for flexibility
try:
    import essentia.standard as es
    ESSENTIA_AVAILABLE = True
except ImportError:
    ESSENTIA_AVAILABLE = False

try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False


@dataclass
class AudioFeatures:
    """Comprehensive audio feature container"""
    # Rhythm
    bpm: float
    beat_positions: list[float]
    beat_strength: float
    onset_rate: float
    
    # Tonal
    key: str
    scale: str  # major/minor
    key_strength: float
    tuning_frequency: float
    
    # Spectral
    spectral_centroid: float
    spectral_rolloff: float
    spectral_bandwidth: float
    spectral_flatness: float
    spectral_contrast: list[float]
    
    # Energy
    rms_energy: float
    loudness: float
    dynamic_range: float
    
    # Timbre
    mfcc: list[float]  # 13 coefficients
    mfcc_delta: list[float]
    zero_crossing_rate: float
    
    # High-level
    danceability: float
    energy: float
    valence: float  # musical positivity
    
    # Amapiano-specific
    log_drum_presence: float
    bass_prominence: float
    groove_rating: float


class AudioFeatureExtractor:
    """
    Production-grade audio feature extraction using Essentia and Librosa.
    
    This replaces the JavaScript approximations with proper DSP algorithms
    that are standard in academic audio ML research.
    """
    
    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate
        self._init_extractors()
    
    def _init_extractors(self):
        """Initialize Essentia extractors"""
        if ESSENTIA_AVAILABLE:
            # Rhythm
            self.rhythm_extractor = es.RhythmExtractor2013(method="multifeature")
            self.onset_rate = es.OnsetRate()
            
            # Tonal
            self.key_extractor = es.KeyExtractor()
            self.tuning_freq = es.TuningFrequency()
            
            # Spectral
            self.spectral_centroid = es.SpectralCentroidTime()
            self.spectral_peaks = es.SpectralPeaks()
            
            # Energy
            self.loudness = es.Loudness()
            self.dynamic_complexity = es.DynamicComplexity()
            
            # Timbre
            self.mfcc = es.MFCC(numberCoefficients=13)
            
            # High-level
            self.danceability = es.Danceability()
    
    def extract_features(self, audio: np.ndarray) -> AudioFeatures:
        """
        Extract comprehensive audio features.
        
        Args:
            audio: Mono audio signal as numpy array
            
        Returns:
            AudioFeatures dataclass with all extracted features
        """
        # Ensure mono
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=0)
        
        # Ensure float32 for Essentia
        audio = audio.astype(np.float32)
        
        # Extract all features
        rhythm = self._extract_rhythm(audio)
        tonal = self._extract_tonal(audio)
        spectral = self._extract_spectral(audio)
        energy = self._extract_energy(audio)
        timbre = self._extract_timbre(audio)
        highlevel = self._extract_highlevel(audio)
        amapiano = self._extract_amapiano_features(audio)
        
        return AudioFeatures(
            # Rhythm
            bpm=rhythm['bpm'],
            beat_positions=rhythm['beat_positions'],
            beat_strength=rhythm['beat_strength'],
            onset_rate=rhythm['onset_rate'],
            
            # Tonal
            key=tonal['key'],
            scale=tonal['scale'],
            key_strength=tonal['key_strength'],
            tuning_frequency=tonal['tuning_frequency'],
            
            # Spectral
            spectral_centroid=spectral['centroid'],
            spectral_rolloff=spectral['rolloff'],
            spectral_bandwidth=spectral['bandwidth'],
            spectral_flatness=spectral['flatness'],
            spectral_contrast=spectral['contrast'],
            
            # Energy
            rms_energy=energy['rms'],
            loudness=energy['loudness'],
            dynamic_range=energy['dynamic_range'],
            
            # Timbre
            mfcc=timbre['mfcc'],
            mfcc_delta=timbre['mfcc_delta'],
            zero_crossing_rate=timbre['zcr'],
            
            # High-level
            danceability=highlevel['danceability'],
            energy=highlevel['energy'],
            valence=highlevel['valence'],
            
            # Amapiano
            log_drum_presence=amapiano['log_drum_presence'],
            bass_prominence=amapiano['bass_prominence'],
            groove_rating=amapiano['groove_rating']
        )
    
    def _extract_rhythm(self, audio: np.ndarray) -> dict:
        """Extract rhythm features"""
        if ESSENTIA_AVAILABLE:
            bpm, beats, beats_confidence, _, beat_intervals = self.rhythm_extractor(audio)
            onset_rate = self.onset_rate(audio)[0]
            
            return {
                'bpm': float(bpm),
                'beat_positions': beats.tolist() if hasattr(beats, 'tolist') else list(beats),
                'beat_strength': float(beats_confidence),
                'onset_rate': float(onset_rate)
            }
        elif LIBROSA_AVAILABLE:
            tempo, beat_frames = librosa.beat.beat_track(y=audio, sr=self.sample_rate)
            beat_times = librosa.frames_to_time(beat_frames, sr=self.sample_rate)
            onset_env = librosa.onset.onset_strength(y=audio, sr=self.sample_rate)
            
            return {
                'bpm': float(tempo[0]) if hasattr(tempo, '__len__') else float(tempo),
                'beat_positions': beat_times.tolist(),
                'beat_strength': float(np.mean(onset_env)),
                'onset_rate': float(len(librosa.onset.onset_detect(y=audio, sr=self.sample_rate)) / (len(audio) / self.sample_rate))
            }
        else:
            return self._fallback_rhythm(audio)
    
    def _extract_tonal(self, audio: np.ndarray) -> dict:
        """Extract tonal/harmonic features"""
        if ESSENTIA_AVAILABLE:
            key, scale, strength = self.key_extractor(audio)
            tuning = self.tuning_freq(audio)[0]
            
            return {
                'key': key,
                'scale': scale,
                'key_strength': float(strength),
                'tuning_frequency': float(tuning)
            }
        elif LIBROSA_AVAILABLE:
            chromagram = librosa.feature.chroma_cqt(y=audio, sr=self.sample_rate)
            chroma_mean = np.mean(chromagram, axis=1)
            key_idx = np.argmax(chroma_mean)
            keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            
            # Simple major/minor detection
            major_profile = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1]
            minor_profile = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0]
            
            rolled_chroma = np.roll(chroma_mean, -key_idx)
            major_corr = np.corrcoef(rolled_chroma, major_profile)[0, 1]
            minor_corr = np.corrcoef(rolled_chroma, minor_profile)[0, 1]
            
            return {
                'key': keys[key_idx],
                'scale': 'major' if major_corr > minor_corr else 'minor',
                'key_strength': float(max(major_corr, minor_corr)),
                'tuning_frequency': 440.0
            }
        else:
            return self._fallback_tonal(audio)
    
    def _extract_spectral(self, audio: np.ndarray) -> dict:
        """Extract spectral features"""
        if LIBROSA_AVAILABLE:
            centroid = librosa.feature.spectral_centroid(y=audio, sr=self.sample_rate)
            rolloff = librosa.feature.spectral_rolloff(y=audio, sr=self.sample_rate)
            bandwidth = librosa.feature.spectral_bandwidth(y=audio, sr=self.sample_rate)
            flatness = librosa.feature.spectral_flatness(y=audio)
            contrast = librosa.feature.spectral_contrast(y=audio, sr=self.sample_rate)
            
            return {
                'centroid': float(np.mean(centroid)),
                'rolloff': float(np.mean(rolloff)),
                'bandwidth': float(np.mean(bandwidth)),
                'flatness': float(np.mean(flatness)),
                'contrast': np.mean(contrast, axis=1).tolist()
            }
        else:
            return self._fallback_spectral(audio)
    
    def _extract_energy(self, audio: np.ndarray) -> dict:
        """Extract energy features"""
        rms = np.sqrt(np.mean(audio ** 2))
        
        if ESSENTIA_AVAILABLE:
            loudness = self.loudness(audio)
            dynamic = self.dynamic_complexity(audio)[0]
            
            return {
                'rms': float(rms),
                'loudness': float(loudness),
                'dynamic_range': float(dynamic)
            }
        elif LIBROSA_AVAILABLE:
            rms_frames = librosa.feature.rms(y=audio)
            db = librosa.amplitude_to_db(rms_frames)
            
            return {
                'rms': float(rms),
                'loudness': float(np.mean(db)),
                'dynamic_range': float(np.max(db) - np.min(db))
            }
        else:
            return {
                'rms': float(rms),
                'loudness': float(20 * np.log10(rms + 1e-10)),
                'dynamic_range': 0.0
            }
    
    def _extract_timbre(self, audio: np.ndarray) -> dict:
        """Extract timbre features (MFCCs)"""
        if ESSENTIA_AVAILABLE:
            # Frame-based MFCC extraction
            frame_size = 2048
            hop_size = 512
            
            mfccs = []
            for i in range(0, len(audio) - frame_size, hop_size):
                frame = audio[i:i + frame_size]
                _, mfcc_coeffs = self.mfcc(es.Spectrum()(es.Windowing()(frame)))
                mfccs.append(mfcc_coeffs)
            
            mfcc_mean = np.mean(mfccs, axis=0).tolist() if mfccs else [0.0] * 13
            mfcc_delta = np.diff(mfccs, axis=0).mean(axis=0).tolist() if len(mfccs) > 1 else [0.0] * 13
            zcr = float(np.mean(np.abs(np.diff(np.sign(audio)))) / 2)
            
            return {
                'mfcc': mfcc_mean,
                'mfcc_delta': mfcc_delta,
                'zcr': zcr
            }
        elif LIBROSA_AVAILABLE:
            mfcc = librosa.feature.mfcc(y=audio, sr=self.sample_rate, n_mfcc=13)
            mfcc_delta = librosa.feature.delta(mfcc)
            zcr = librosa.feature.zero_crossing_rate(audio)
            
            return {
                'mfcc': np.mean(mfcc, axis=1).tolist(),
                'mfcc_delta': np.mean(mfcc_delta, axis=1).tolist(),
                'zcr': float(np.mean(zcr))
            }
        else:
            return self._fallback_timbre(audio)
    
    def _extract_highlevel(self, audio: np.ndarray) -> dict:
        """Extract high-level music descriptors"""
        if ESSENTIA_AVAILABLE:
            danceability, _ = self.danceability(audio)
            
            # Energy from spectral features
            spectral_energy = float(np.mean(np.abs(np.fft.rfft(audio)) ** 2))
            
            return {
                'danceability': float(danceability),
                'energy': min(1.0, spectral_energy / 1e6),
                'valence': 0.5  # Would need trained model
            }
        else:
            # Approximate from basic features
            tempo_energy = self._extract_rhythm(audio)['onset_rate'] / 10
            spectral = self._extract_spectral(audio)
            
            return {
                'danceability': min(1.0, tempo_energy + spectral['flatness']),
                'energy': min(1.0, spectral['centroid'] / 5000),
                'valence': 0.5
            }
    
    def _extract_amapiano_features(self, audio: np.ndarray) -> dict:
        """Extract Amapiano-specific features"""
        # Log drum detection (low frequency transient analysis)
        if LIBROSA_AVAILABLE:
            # Low-pass filter for bass content
            S = np.abs(librosa.stft(audio))
            freqs = librosa.fft_frequencies(sr=self.sample_rate)
            
            # Log drums typically in 60-120Hz range
            log_drum_band = (freqs >= 60) & (freqs <= 120)
            log_drum_energy = np.mean(S[log_drum_band, :])
            
            # Bass prominence (sub-bass to bass ratio)
            sub_bass = (freqs >= 20) & (freqs < 80)
            bass = (freqs >= 80) & (freqs < 250)
            bass_prominence = np.mean(S[sub_bass, :]) / (np.mean(S[bass, :]) + 1e-10)
            
            # Groove rating from rhythm regularity
            onset_env = librosa.onset.onset_strength(y=audio, sr=self.sample_rate)
            autocorr = np.correlate(onset_env, onset_env, mode='full')
            autocorr = autocorr[len(autocorr)//2:]
            groove = float(np.max(autocorr[1:]) / (autocorr[0] + 1e-10))
            
            return {
                'log_drum_presence': min(1.0, float(log_drum_energy) / 100),
                'bass_prominence': min(1.0, float(bass_prominence)),
                'groove_rating': min(1.0, groove)
            }
        else:
            return {
                'log_drum_presence': 0.5,
                'bass_prominence': 0.5,
                'groove_rating': 0.5
            }
    
    # Fallback methods for when no audio libraries are available
    def _fallback_rhythm(self, audio: np.ndarray) -> dict:
        # Basic onset detection using energy
        frame_size = 1024
        energy = []
        for i in range(0, len(audio) - frame_size, frame_size // 2):
            energy.append(np.sum(audio[i:i + frame_size] ** 2))
        
        energy = np.array(energy)
        diff = np.diff(energy)
        onsets = np.where(diff > np.mean(diff) + np.std(diff))[0]
        
        if len(onsets) > 1:
            avg_interval = np.mean(np.diff(onsets)) * (frame_size // 2) / self.sample_rate
            bpm = 60 / avg_interval if avg_interval > 0 else 120
        else:
            bpm = 120
        
        return {
            'bpm': float(np.clip(bpm, 60, 200)),
            'beat_positions': [],
            'beat_strength': 0.5,
            'onset_rate': float(len(onsets) / (len(audio) / self.sample_rate))
        }
    
    def _fallback_tonal(self, audio: np.ndarray) -> dict:
        return {
            'key': 'A',
            'scale': 'minor',
            'key_strength': 0.5,
            'tuning_frequency': 440.0
        }
    
    def _fallback_spectral(self, audio: np.ndarray) -> dict:
        fft = np.abs(np.fft.rfft(audio))
        freqs = np.fft.rfftfreq(len(audio), 1 / self.sample_rate)
        
        centroid = np.sum(freqs * fft) / (np.sum(fft) + 1e-10)
        
        return {
            'centroid': float(centroid),
            'rolloff': float(centroid * 1.5),
            'bandwidth': float(centroid * 0.5),
            'flatness': 0.5,
            'contrast': [0.5] * 7
        }
    
    def _fallback_timbre(self, audio: np.ndarray) -> dict:
        zcr = float(np.mean(np.abs(np.diff(np.sign(audio)))) / 2)
        return {
            'mfcc': [0.0] * 13,
            'mfcc_delta': [0.0] * 13,
            'zcr': zcr
        }
