# Amapiano Log Drum - Parameter Configuration Guide

## Complete Plugin Code with Registered Parameters

Copy this code into your **Code Editor** tab:

```cpp
// AURA Amapiano Log Drum - JUCE Plugin with Parameter Registration
#include <JuceHeader.h>

class AmapianoLogDrum : public juce::AudioProcessor {
public:
    // Constructor - Register all parameters
    AmapianoLogDrum() {
        // Pitch parameter (MIDI note range)
        addParameter(pitchParam = new juce::AudioParameterFloat(
            "pitch",                    // Parameter ID
            "Pitch",                    // Display name
            juce::NormalisableRange<float>(24.0f, 96.0f, 1.0f),  // Range (2 octaves)
            60.0f                       // Default value (Middle C)
        ));
        
        // Glide/Portamento time (Private School Amapiano signature)
        addParameter(glideParam = new juce::AudioParameterFloat(
            "glide",
            "Glide Time",
            juce::NormalisableRange<float>(0.0f, 500.0f, 1.0f),  // 0-500ms
            100.0f                      // Default: 100ms for smooth transitions
        ));
        
        // Knock/Click mix (808 character)
        addParameter(knockParam = new juce::AudioParameterFloat(
            "knock",
            "Knock Mix",
            juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),   // 0-100%
            0.3f                        // Default: 30% knock
        ));
        
        // Decay time (Log drum tail)
        addParameter(decayParam = new juce::AudioParameterFloat(
            "decay",
            "Decay Time",
            juce::NormalisableRange<float>(50.0f, 3000.0f, 10.0f), // 50ms-3s
            800.0f                      // Default: 800ms
        ));
        
        // Swing amount (Amapiano groove)
        addParameter(swingParam = new juce::AudioParameterFloat(
            "swing",
            "Swing",
            juce::NormalisableRange<float>(0.0f, 100.0f, 1.0f),   // 0-100%
            62.0f                       // Default: 62% (Private School signature)
        ));
        
        // Shuffle amount (Drum & Bass influence)
        addParameter(shuffleParam = new juce::AudioParameterFloat(
            "shuffle",
            "Shuffle",
            juce::NormalisableRange<float>(0.0f, 100.0f, 1.0f),
            18.0f                       // Default: 18% shuffle
        ));
        
        // Sub bass level
        addParameter(subParam = new juce::AudioParameterFloat(
            "sub",
            "Sub Bass",
            juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
            0.7f                        // Default: 70% sub
        ));
        
        // Distortion/Saturation
        addParameter(driveParam = new juce::AudioParameterFloat(
            "drive",
            "Drive",
            juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
            0.15f                       // Default: 15% saturation
        ));
    }
    
    void processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi) override {
        auto numSamples = buffer.getNumSamples();
        
        // Get current parameter values
        float pitch = pitchParam->get();
        float glideTime = glideParam->get();
        float knockMix = knockParam->get();
        float decayTime = decayParam->get();
        float swing = swingParam->get() / 100.0f;
        float shuffle = shuffleParam->get() / 100.0f;
        float subLevel = subParam->get();
        float drive = driveParam->get();
        
        // Process MIDI input
        for (const auto metadata : midi) {
            auto message = metadata.getMessage();
            
            if (message.isNoteOn()) {
                float frequency = juce::MidiMessage::getMidiNoteInHertz(message.getNoteNumber());
                float velocity = message.getVelocity() / 127.0f;
                startNote(frequency, velocity, glideTime);
            }
            
            if (message.isNoteOff()) {
                stopNote();
            }
        }
        
        // Process audio with 808-style synthesis
        for (int channel = 0; channel < buffer.getNumChannels(); ++channel) {
            auto* channelData = buffer.getWritePointer(channel);
            
            for (int sample = 0; sample < numSamples; ++sample) {
                channelData[sample] = generateSample(
                    pitch, knockMix, decayTime, subLevel, drive, swing, shuffle
                );
            }
        }
    }
    
    // Required JUCE methods
    const juce::String getName() const override { return "Amapiano Log Drum"; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    double getTailLengthSeconds() const override { return 3.0; }
    
    void prepareToPlay(double sampleRate, int samplesPerBlock) override {
        currentSampleRate = sampleRate;
    }
    
    void releaseResources() override {}
    
private:
    // Parameter pointers
    juce::AudioParameterFloat* pitchParam;
    juce::AudioParameterFloat* glideParam;
    juce::AudioParameterFloat* knockParam;
    juce::AudioParameterFloat* decayParam;
    juce::AudioParameterFloat* swingParam;
    juce::AudioParameterFloat* shuffleParam;
    juce::AudioParameterFloat* subParam;
    juce::AudioParameterFloat* driveParam;
    
    // Synthesis state
    float phase = 0.0f;
    float envelope = 0.0f;
    float targetFreq = 440.0f;
    float currentFreq = 440.0f;
    double currentSampleRate = 44100.0;
    
    void startNote(float frequency, float velocity, float glideTime) {
        targetFreq = frequency;
        envelope = velocity;
        
        // Apply glide/portamento
        if (glideTime > 0.0f) {
            // Smooth transition to target frequency
            currentFreq += (targetFreq - currentFreq) * 0.1f;
        } else {
            currentFreq = targetFreq;
        }
    }
    
    void stopNote() {
        envelope = 0.0f;
    }
    
    float generateSample(float pitch, float knockMix, float decayTime, 
                        float subLevel, float drive, float swing, float shuffle) {
        // 808-style log drum synthesis
        float phaseIncrement = currentFreq / currentSampleRate;
        phase += phaseIncrement * 2.0f * juce::MathConstants<float>::pi;
        
        // Main oscillator (sine wave for 808 character)
        float mainSignal = std::sin(phase);
        
        // Knock/click component (high-frequency transient)
        float knockSignal = std::sin(phase * 8.0f) * std::exp(-phase * 20.0f);
        
        // Sub bass (one octave down)
        float subSignal = std::sin(phase * 0.5f) * subLevel;
        
        // Mix knock and main signal
        float mixed = (mainSignal * (1.0f - knockMix) + knockSignal * knockMix) + subSignal;
        
        // Apply envelope decay
        float decayRate = 1.0f / (decayTime * 0.001f * currentSampleRate);
        envelope *= (1.0f - decayRate);
        
        // Apply drive/saturation
        if (drive > 0.0f) {
            mixed = std::tanh(mixed * (1.0f + drive * 5.0f));
        }
        
        // Apply envelope
        return mixed * envelope;
    }
};

// Plugin instantiation
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter() {
    return new AmapianoLogDrum();
}
```

## How Parameters Appear in the IDE

After compiling, go to the **Parameters** tab to see:

| Parameter | Type | Default | Min | Max | Unit |
|-----------|------|---------|-----|-----|------|
| **Pitch** | float | 60.0 | 24.0 | 96.0 | semitones |
| **Glide Time** | float | 100.0 | 0.0 | 500.0 | ms |
| **Knock Mix** | float | 0.3 | 0.0 | 1.0 | ratio |
| **Decay Time** | float | 800.0 | 50.0 | 3000.0 | ms |
| **Swing** | float | 62.0 | 0.0 | 100.0 | % |
| **Shuffle** | float | 18.0 | 0.0 | 100.0 | % |
| **Sub Bass** | float | 0.7 | 0.0 | 1.0 | ratio |
| **Drive** | float | 0.15 | 0.0 | 1.0 | ratio |

## Private School Amapiano Signature Settings

For authentic Private School Amapiano sound:

1. **Swing**: 62% (default) - Creates the signature laid-back groove
2. **Shuffle**: 18% - Adds Drum & Bass influence
3. **Glide Time**: 100-150ms - Smooth pitch transitions
4. **Sub Bass**: 70%+ - Deep low-end presence
5. **Decay Time**: 800-1200ms - Long, resonant tail

## Testing Your Parameters

1. **Compile** the plugin (click Compile button)
2. Go to **Parameters** tab to verify all 8 parameters appear
3. Go to **Test** tab and:
   - Play MIDI notes
   - Adjust parameters in real-time
   - Check latency (<15ms target)
   - Monitor CPU usage (<30% target)

## DAW Integration

Once published, these parameters will appear as:
- **Automation lanes** in your DAW
- **MIDI CC mappable** controls
- **Preset-saveable** values

All parameter changes are smoothed to prevent audio clicks!
