# Deep Learning Notebooks for Amapiano-AI Studio

## PhD Research: Full-Stack Algorithm-System Co-Design for Efficient Audio and Music Generation

These Jupyter notebooks implement deep learning models and training pipelines for audio generation research using the MagnaTagATune dataset.

---

## Notebooks

### 1. `01_magnatagatune_data_exploration.ipynb`
**Data Exploration & Preprocessing**
- Download and explore MagnaTagATune dataset
- Audio feature extraction (mel spectrograms, MFCCs, chromagram)
- Amapiano-relevant tag analysis
- PyTorch Dataset class implementation
- Data preprocessing configuration

### 2. `02_cnn_audio_classifier.ipynb`
**CNN Audio Classifier**
- VGG-style CNN architecture for multi-label audio tagging
- Audio augmentation pipeline
- Training with BCEWithLogitsLoss
- ROC-AUC evaluation metrics
- Model export to ONNX

### 3. `03_transformer_audio_generation.ipynb`
**Transformer-Based Audio Generation**
- EnCodec-style audio tokenizer with VQ
- Transformer language model for audio tokens
- Amapiano-specific conditioning (genre, BPM, energy, region)
- Autoregressive generation with top-k sampling
- Complete training pipeline

### 4. `04_svdquant_audio_quantization.ipynb`
**SVDQuant-Audio: Phase-Aware Quantization**
- Phase-coherent model quantization
- TPDF dithering and noise shaping
- SVD-based weight compression
- Audio quality metrics (SNR, phase coherence, transient preservation)
- Fréchet Audio Distance (FAD) calculator

---

## How to Use

### Google Colab (Recommended)
1. Upload notebooks to Google Drive
2. Open with Google Colab
3. Select GPU runtime (Runtime → Change runtime type → GPU)
4. Run cells sequentially

### Local Jupyter
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install torch torchaudio librosa numpy pandas matplotlib scikit-learn tqdm tensorboard transformers

# Start Jupyter
jupyter notebook
```

---

## Dataset

**MagnaTagATune** is used as an interim training baseline:
- ~26,000 audio clips (29 seconds each)
- 188 tags covering instruments, genres, moods
- Download: https://mirg.city.ac.uk/codeapps/the-magnatagatune-dataset

### Amapiano-Relevant Tags
- drums, beat, electronic, dance, bass
- synth, vocal, vocals, piano, house
- techno, ambient, rhythm, groove

---

## Research Alignment

These notebooks support PhD research on:

1. **WP1: Phase-Coherent Quantization (SVDQuant-Audio)**
   - 4-bit/8-bit quantization with <10% FAD degradation
   - Preserves stereo imaging, transients, rhythmic integrity

2. **WP5: Musicality Benchmarking**
   - Beat Consistency Score
   - Key Stability Index
   - Transient Smearing Ratio
   - Fréchet Audio Distance

3. **Cultural Authenticity**
   - Amapiano-specific conditioning
   - Regional style preservation (Johannesburg, Pretoria, Durban, Cape Town)

---

## Model Architectures

| Model | Parameters | Purpose |
|-------|------------|---------|
| AudioCNN | ~5M | Multi-label tagging |
| AudioTokenizer | ~2M | Audio → discrete tokens |
| AudioTransformer | ~25M | Token sequence generation |
| AmapianoGenerator | ~30M | Complete generation pipeline |

---

## Quality Metrics

- **SNR (dB)**: Signal-to-noise ratio
- **Phase Coherence**: 0-1, phase preservation
- **Transient Preservation**: 0-1, attack preservation
- **FAD**: Fréchet Audio Distance (lower is better)
- **ROC-AUC**: Classification performance

---

## Citation

If using these notebooks for research:

```bibtex
@misc{amapiano-ai-studio,
  title={Amapiano-AI Studio: Deep Learning for African Music Generation},
  author={Your Name},
  year={2025},
  howpublished={GitHub Repository}
}
```
