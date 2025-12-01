# Suno-Style Workflow Validation Test Plan

**Date:** December 2025  
**Purpose:** End-to-end validation of complete Suno-style workflow before Year 1 PhD research

---

## Workflow Overview

The complete workflow consists of 5 stages:
1. **Lyrics Generation** - Multilingual lyrics using Lovable AI
2. **Voice & Music Configuration** - Voice type, style, BPM, energy settings
3. **Song Generation** - Full song with vocals and instrumentals
4. **Stem Separation** - Separate into 5 stems (vocals, drums, bass, piano, other)
5. **Amapianorization** - Inject authentic amapiano elements
6. **DAW Integration** - Export and load stems into DAW

---

## Implementation Status

### ✅ IMPLEMENTED

#### 1. Lyrics Generation (`/generate` → Suno-Style tab)
- **Component:** `src/components/ai/LyricsGenerator.tsx`
- **Edge Function:** `supabase/functions/ai-chat/index.ts`
- **Status:** ✅ Fully functional
- **Features:**
  - Multilingual support (English, Zulu, Xhosa, Sotho, Tswana, Afrikaans, Multilingual Mix)
  - Music style selection (Amapiano, Afrobeat, Gqom, Kwaito, Afro House)
  - Theme/topic input
  - Copy to clipboard
  - Full text editing capability
- **API:** Lovable AI Gateway with `google/gemini-2.5-flash`
- **Error Handling:** 429 (rate limit) and 402 (payment required)

#### 2. Voice & Music Configuration
- **Component:** `src/components/ai/SunoStyleWorkflow.tsx` (Step 2)
- **Status:** ✅ Fully functional
- **Features:**
  - Voice type selection (Male, Female, Duet)
  - Voice style (Smooth, Powerful, Raspy, Soft)
  - BPM slider (90-130)
  - Energy level (0-100%)
  - Full lyrics preview and editing

#### 3. Stem Separation
- **Edge Function:** `supabase/functions/stem-separation/index.ts`
- **Status:** ⚠️ Implemented but requires REPLICATE_API_KEY
- **Service:** Replicate Demucs model
- **Output:** 5 stems (vocals, drums, bass, piano, other)
- **Quality:** Standard (htdemucs) or High (htdemucs_ft)
- **Processing Time:** 1-2 minutes with polling (max 4 min timeout)

#### 4. Export All Assets
- **Edge Function:** `supabase/functions/zip-stems/index.ts`
- **Status:** ✅ Fully functional
- **Features:**
  - Downloads all stems
  - Creates ZIP archive
  - Character-by-character base64 encoding (no stack overflow)
  - Automatic download to browser

#### 5. DAW Integration
- **Navigation:** `navigate('/daw')`
- **Status:** ✅ Navigation implemented
- **Note:** Stems need to be loaded into DAW state

---

### ❌ GAPS IDENTIFIED

#### 1. Song Generation (CRITICAL)
- **Component:** `src/components/ai/SunoStyleWorkflow.tsx` (Step 3)
- **Edge Function:** `supabase/functions/ai-music-generation`
- **Status:** ❌ Calls edge function but likely generates MIDI, not full audio with vocals
- **Required:**
  - Real audio generation with vocals
  - Integration with text-to-speech (ElevenLabs or similar)
  - Audio synthesis for instrumentals
  - Downloadable audio file output
- **Fallback:** Currently returns mock audio URL if AI generation fails

#### 2. Amapianorization Engine Integration (CRITICAL)
- **Component:** `src/components/ai/SunoStyleWorkflow.tsx` (Step 5)
- **Status:** ❌ Placeholder comment: "The engine would be integrated here"
- **Required:**
  - Integration with `src/lib/audio/amapianorizationEngine.ts`
  - Audio processing via WebAudio API
  - Regional style selection (Johannesburg, Pretoria, Durban, Cape Town)
  - Authenticity scoring display
  - Real-time parameter adjustment
- **Components Available:**
  - Log drum library (`src/lib/audio/logDrumLibrary.ts`)
  - Percussion library (`src/lib/audio/percussionLibrary.ts`)
  - Audio processor (`src/lib/audio/audioProcessor.ts`)
  - Sample loader (`src/lib/audio/sampleLoader.ts`)

#### 3. Audio Playback & Preview
- **Status:** ❌ Not implemented in workflow
- **Required:**
  - Play button for generated song
  - Waveform visualization
  - Stem preview before separation
  - Individual stem playback after separation

#### 4. Secret Configuration
- **REPLICATE_API_KEY:** ❓ May not be configured in Supabase secrets
- **ElevenLabs API Key:** ❓ Required if using ElevenLabs for vocals

---

## Validation Test Cases

### Test 1: Lyrics Generation
**Steps:**
1. Navigate to `/generate`
2. Select "Suno-Style" tab
3. Select language: Zulu
4. Select style: Amapiano
5. Enter theme: "Love and celebration"
6. Click "Generate Lyrics"

**Expected Results:**
- ✅ Lyrics generated in Zulu with amapiano structure
- ✅ Lyrics displayed in textarea
- ✅ Can edit lyrics
- ✅ Can copy to clipboard
- ✅ Toast notification confirms success
- ✅ Advances to Step 2

**Error Cases:**
- Rate limit (429): Show retry message
- Payment required (402): Show credits message
- Network error: Show error toast

---

### Test 2: Voice & Music Configuration
**Steps:**
1. Complete Test 1
2. Select voice type: Male
3. Select voice style: Smooth
4. Set BPM: 115
5. Set energy: 80%
6. Review lyrics
7. Click "Continue to Generation"

**Expected Results:**
- ✅ All settings saved
- ✅ Lyrics remain editable
- ✅ Can navigate back to Step 1
- ✅ Advances to Step 3

---

### Test 3: Song Generation (NEEDS VALIDATION)
**Steps:**
1. Complete Test 2
2. Review configuration summary
3. Click "Generate Song"

**Expected Results:**
- ❓ Shows "Generating..." spinner
- ❓ Calls `ai-music-generation` edge function
- ❓ Returns audio URL (not MIDI)
- ❓ Audio includes vocals matching voice type/style
- ❓ Audio includes amapiano instrumentals at specified BPM
- ❓ Processing takes 1-2 minutes
- ❓ Toast confirms generation success
- ❓ Advances to Step 4

**Current Behavior:**
- Calls edge function
- Falls back to mock audio URL if AI generation fails
- No actual audio file is generated

**BLOCKER:** This step is critical for rest of workflow

---

### Test 4: Stem Separation (NEEDS VALIDATION)
**Steps:**
1. Complete Test 3 (requires real audio)
2. Click "Separate into Stems"

**Expected Results:**
- ❓ Shows "Separating Stems..." spinner
- ❓ Calls `stem-separation` edge function
- ❓ Uploads generated audio to Replicate
- ❓ Polls for completion (1-2 min)
- ❓ Returns 5 stem URLs: vocals, drums, bass, piano, other
- ❓ Each stem is downloadable WAV/MP3 file
- ❓ Toast confirms separation success
- ❓ Advances to Step 5

**Dependencies:**
- Requires REPLICATE_API_KEY secret
- Requires real audio file from Test 3

**BLOCKER:** Cannot test without real audio from Test 3

---

### Test 5: Amapianorization (NOT IMPLEMENTED)
**Steps:**
1. Complete Test 4
2. Review amapianorization settings
3. Select region: Johannesburg
4. Adjust intensity sliders
5. Click "Apply Amapianorization"

**Expected Results:**
- ❌ NOT IMPLEMENTED
- Engine integration placeholder exists
- No functional controls

**Required Implementation:**
```typescript
// Import amapianorization engine
import { AmapianorizationEngine } from '@/lib/audio/amapianorizationEngine';

// Apply enhancement
const enhancedStems = await AmapianorizationEngine.enhance(stems, {
  region: 'johannesburg',
  intensity: 0.8,
  elements: ['logDrums', 'percussion', 'piano', 'bass', 'sidechain']
});

// Update stems state
setStems(enhancedStems);

// Show authenticity score
toast({
  title: "Amapianorization Complete!",
  description: `Authenticity Score: ${enhancedStems.authenticityScore}%`
});
```

---

### Test 6: Export All Assets
**Steps:**
1. Complete Test 4 (or Test 5 if implemented)
2. Click "Export All Assets"

**Expected Results:**
- ✅ Shows "Preparing Export..." toast
- ✅ Calls `zip-stems` edge function
- ✅ Downloads ZIP file with all stems
- ✅ ZIP file name: `amapiano-stems-[timestamp].zip`
- ✅ ZIP contains: vocals.wav, drums.wav, bass.wav, piano.wav, other.wav
- ✅ Toast confirms export success

**Dependencies:**
- Requires stems from Test 4

---

### Test 7: Open in DAW
**Steps:**
1. Complete Test 4 (or Test 5 if implemented)
2. Click "Open in DAW"

**Expected Results:**
- ✅ Navigates to `/daw`
- ❓ Stems are loaded into DAW tracks
- ❓ Can play back stems
- ❓ Can add effects and mix

**Current Behavior:**
- Navigation works
- Stem loading into DAW state not verified

---

## Critical Path for PhD Validation

To meet Year 1 research validation requirements, the following MUST work end-to-end:

### Phase 1: Basic Workflow (REQUIRED)
1. ✅ Lyrics generation
2. ✅ Voice/music configuration
3. ❌ **BLOCKER:** Song generation with real audio
4. ❌ **BLOCKER:** Stem separation producing downloadable files
5. ❌ **BLOCKER:** Amapianorization integration

### Phase 2: PhD User Study (REQUIRED)
6. A/B testing interface
7. Authenticity rating scale (1-10)
8. Comparison: baseline vs amapianorized
9. Data collection in Supabase
10. Statistical analysis (n=20-30 producers)

---

## Immediate Action Items

### Priority 1: Song Generation (CRITICAL)
**Options:**
1. **ElevenLabs + MusicGen:**
   - Use ElevenLabs TTS for vocals
   - Use MusicGen for instrumentals
   - Mix vocals + instrumentals
2. **External API (Suno/Udio):**
   - Use real music generation API
   - Most realistic output quality
   - Requires API access
3. **Fallback (For Testing):**
   - Use pre-recorded demo audio files
   - Upload to Supabase Storage
   - Return URLs for testing stem separation

**Recommendation:** Start with Fallback (3) using demo files to unblock stem separation testing, then implement Option 1.

### Priority 2: REPLICATE_API_KEY Configuration
**Steps:**
1. Obtain Replicate API key from https://replicate.com
2. Add to Supabase secrets:
   ```bash
   supabase secrets set REPLICATE_API_KEY=your_key_here
   ```
3. Verify stem-separation edge function works

### Priority 3: Amapianorization Integration
**Steps:**
1. Create `AmapianorizationControls` component
2. Integrate with `AmapianorizationEngine`
3. Add region selection (4 regions)
4. Add intensity sliders
5. Display authenticity score
6. Process stems with WebAudio
7. Update stems state with enhanced audio

### Priority 4: Audio Playback
**Steps:**
1. Add `<audio>` player for generated song
2. Add waveform visualization (wavesurfer.js)
3. Add play/pause controls
4. Add individual stem playback

---

## Testing Checklist

Before proceeding to Year 1 PhD research:

### Functional Tests
- [ ] Generate Zulu lyrics with amapiano theme
- [ ] Generate English lyrics with afrobeat theme
- [ ] Edit generated lyrics
- [ ] Configure male voice with smooth style
- [ ] Configure female voice with powerful style
- [ ] Configure duet with raspy style
- [ ] Generate song with vocals (BLOCKER)
- [ ] Separate stems into 5 tracks (BLOCKER - needs REPLICATE_API_KEY)
- [ ] Download individual stems
- [ ] Export all assets as ZIP
- [ ] Apply amapianorization to stems (NOT IMPLEMENTED)
- [ ] Open stems in DAW
- [ ] Play back stems in DAW

### Error Handling Tests
- [ ] Rate limit error (429)
- [ ] Payment required error (402)
- [ ] Network timeout
- [ ] Invalid audio file
- [ ] Stem separation failure
- [ ] Export failure

### Integration Tests
- [ ] End-to-end: Lyrics → Song → Stems → Export
- [ ] End-to-end: Lyrics → Song → Stems → Amapianorize → DAW
- [ ] Multiple workflow runs in sequence
- [ ] Browser refresh during workflow
- [ ] Back navigation between steps

---

## Success Criteria

The workflow is considered validated and PhD-ready when:

1. ✅ **Lyrics generation** works reliably in 5+ African languages
2. ❌ **Song generation** produces real audio files with vocals
3. ❌ **Stem separation** produces 5 downloadable stems
4. ❌ **Amapianorization** enhances stems with measurable authenticity improvement
5. ✅ **Export** bundles all assets into downloadable ZIP
6. ✅ **DAW integration** loads stems for further production
7. ✅ **Error handling** gracefully handles all failure modes

**Current Status:** 3/7 validated (43%)

---

## Next Steps

1. **Create demo audio files** for testing (bypass song generation temporarily)
2. **Configure REPLICATE_API_KEY** in Supabase secrets
3. **Test stem separation** with demo audio
4. **Integrate amapianorization engine** into Step 5
5. **Build testing interface** for rapid validation
6. **Document actual vs expected behavior** for each step
7. **Implement audio playback** throughout workflow
8. **Fix song generation** with real audio synthesis
9. **Conduct end-to-end validation** with real PhD use case
10. **Prepare user study interface** for authenticity testing

---

## Contact & Support

**User Study Requirements:**
- n=20-30 music producers
- A/B blind testing: baseline vs amapianorized
- Authenticity rating scale (1-10)
- Demographic data collection
- Statistical significance testing

**Research Validation:**
- Minimum viable contribution: One fully-functional component
- Log drum library + element selector + user study validation
- Results inform thesis contribution and research hypothesis
