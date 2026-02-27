// VST3 Export Scaffolding - Phase 2
import type { DSPModule, DSPParameter } from './types';

export interface VST3ExportOptions {
  pluginName: string;
  manufacturer: string;
  version: string;
  category: 'Fx' | 'Instrument' | 'Analyzer';
  modules: DSPModule[];
  uniqueId: string;
}

export interface VST3ExportResult {
  success: boolean;
  files: {
    path: string;
    content: string;
  }[];
  buildInstructions: string;
  errors?: string[];
}

export class VST3Exporter {
  export(options: VST3ExportOptions): VST3ExportResult {
    try {
      const files: { path: string; content: string }[] = [];

      // Generate main processor header
      files.push({
        path: `${options.pluginName}Processor.h`,
        content: this.generateProcessorHeader(options)
      });

      // Generate main processor implementation
      files.push({
        path: `${options.pluginName}Processor.cpp`,
        content: this.generateProcessorImpl(options)
      });

      // Generate controller header
      files.push({
        path: `${options.pluginName}Controller.h`,
        content: this.generateControllerHeader(options)
      });

      // Generate controller implementation
      files.push({
        path: `${options.pluginName}Controller.cpp`,
        content: this.generateControllerImpl(options)
      });

      // Generate plugin entry point
      files.push({
        path: `${options.pluginName}Entry.cpp`,
        content: this.generateEntryPoint(options)
      });

      // Generate CMakeLists.txt
      files.push({
        path: 'CMakeLists.txt',
        content: this.generateCMakeLists(options)
      });

      // Generate build instructions
      const buildInstructions = this.generateBuildInstructions(options);

      return {
        success: true,
        files,
        buildInstructions
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        buildInstructions: '',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private generateProcessorHeader(options: VST3ExportOptions): string {
    const { pluginName, modules } = options;
    const allParams = modules.flatMap(m => m.parameters);

    return `#pragma once

#include "public.sdk/source/vst/vstaudioeffect.h"

namespace Steinberg {
namespace Vst {

class ${pluginName}Processor : public AudioEffect {
public:
    ${pluginName}Processor();
    ~${pluginName}Processor() SMTG_OVERRIDE;

    static FUnknown* createInstance(void* /*context*/) {
        return (IAudioProcessor*)new ${pluginName}Processor;
    }

    tresult PLUGIN_API initialize(FUnknown* context) SMTG_OVERRIDE;
    tresult PLUGIN_API terminate() SMTG_OVERRIDE;
    tresult PLUGIN_API setActive(TBool state) SMTG_OVERRIDE;
    tresult PLUGIN_API process(Vst::ProcessData& data) SMTG_OVERRIDE;
    tresult PLUGIN_API setState(IBStream* state) SMTG_OVERRIDE;
    tresult PLUGIN_API getState(IBStream* state) SMTG_OVERRIDE;

    // Parameter tags
    enum ParamTags {
${allParams.map((p, i) => `        k${p.id.charAt(0).toUpperCase() + p.id.slice(1)} = ${i}`).join(',\n')}
    };

private:
${allParams.map(p => `    ${this.getParamType(p)} ${p.id};`).join('\n')}
};

} // namespace Vst
} // namespace Steinberg
`;
  }

  private generateProcessorImpl(options: VST3ExportOptions): string {
    const { pluginName, uniqueId, modules } = options;
    const allParams = modules.flatMap(m => m.parameters);

    return `#include "${pluginName}Processor.h"
#include "pluginterfaces/base/ibstream.h"
#include "pluginterfaces/vst/ivstparameterchanges.h"

namespace Steinberg {
namespace Vst {

${pluginName}Processor::${pluginName}Processor() {
${allParams.map(p => `    ${p.id} = ${this.getDefaultValue(p)};`).join('\n')}
}

${pluginName}Processor::~${pluginName}Processor() {}

tresult PLUGIN_API ${pluginName}Processor::initialize(FUnknown* context) {
    tresult result = AudioEffect::initialize(context);
    if (result != kResultOk) return result;

    addAudioInput(STR16("Stereo In"), SpeakerArr::kStereo);
    addAudioOutput(STR16("Stereo Out"), SpeakerArr::kStereo);

    return kResultOk;
}

tresult PLUGIN_API ${pluginName}Processor::terminate() {
    return AudioEffect::terminate();
}

tresult PLUGIN_API ${pluginName}Processor::setActive(TBool state) {
    return AudioEffect::setActive(state);
}

tresult PLUGIN_API ${pluginName}Processor::process(Vst::ProcessData& data) {
    // Read parameter changes
    if (data.inputParameterChanges) {
        int32 numParamsChanged = data.inputParameterChanges->getParameterCount();
        for (int32 i = 0; i < numParamsChanged; i++) {
            IParamValueQueue* paramQueue = data.inputParameterChanges->getParameterData(i);
            if (paramQueue) {
                int32 sampleOffset;
                ParamValue value;
                if (paramQueue->getPoint(paramQueue->getPointCount() - 1, sampleOffset, value) == kResultTrue) {
                    switch (paramQueue->getParameterId()) {
${allParams.map((p, i) => `                        case k${p.id.charAt(0).toUpperCase() + p.id.slice(1)}: ${p.id} = ${this.getConversion(p, 'value')}; break;`).join('\n')}
                    }
                }
            }
        }
    }

    // Process audio
    if (data.numInputs == 0 || data.numOutputs == 0) return kResultOk;

    int32 numChannels = data.inputs[0].numChannels;
    int32 numSamples = data.numSamples;

    float** in = data.inputs[0].channelBuffers32;
    float** out = data.outputs[0].channelBuffers32;

    // DSP processing is delegated to the Modal backend at runtime via the web layer
    // (see VST3Exporter.ts processAudio). In the compiled native plugin we perform
    // an identity pass so the plugin loads and passes audio without silence or
    // corruption when the backend is unreachable.
    for (int32 channel = 0; channel < numChannels; channel++) {
        for (int32 sample = 0; sample < numSamples; sample++) {
            out[channel][sample] = in[channel][sample];
        }
    }

    return kResultOk;
}

tresult PLUGIN_API ${pluginName}Processor::setState(IBStream* state) {
    // Load state from stream using FStreamer (see getState for write order)
    IBStreamer streamer(state, kLittleEndian);
${allParams.map(p => `    streamer.readFloat(${p.id});`).join('\n')}
    return kResultOk;
}

tresult PLUGIN_API ${pluginName}Processor::getState(IBStream* state) {
    // Save state to stream; order must match setState above
    IBStreamer streamer(state, kLittleEndian);
${allParams.map(p => `    streamer.writeFloat(${p.id});`).join('\n')}
    return kResultOk;
}

} // namespace Vst
} // namespace Steinberg
`;
  }

  private generateControllerHeader(options: VST3ExportOptions): string {
    const { pluginName } = options;

    return `#pragma once

#include "public.sdk/source/vst/vsteditcontroller.h"

namespace Steinberg {
namespace Vst {

class ${pluginName}Controller : public EditController {
public:
    ${pluginName}Controller();
    ~${pluginName}Controller() SMTG_OVERRIDE;

    static FUnknown* createInstance(void* /*context*/) {
        return (IEditController*)new ${pluginName}Controller;
    }

    tresult PLUGIN_API initialize(FUnknown* context) SMTG_OVERRIDE;
};

} // namespace Vst
} // namespace Steinberg
`;
  }

  private generateControllerImpl(options: VST3ExportOptions): string {
    const { pluginName, modules } = options;
    const allParams = modules.flatMap(m => m.parameters);

    return `#include "${pluginName}Controller.h"
#include "base/source/fstreamer.h"
#include "pluginterfaces/base/ibstream.h"

namespace Steinberg {
namespace Vst {

${pluginName}Controller::${pluginName}Controller() {}

${pluginName}Controller::~${pluginName}Controller() {}

tresult PLUGIN_API ${pluginName}Controller::initialize(FUnknown* context) {
    tresult result = EditController::initialize(context);
    if (result != kResultOk) return result;

    // Add parameters
${allParams.map((p, i) => this.generateParameterRegistration(p, i)).join('\n')}

    return kResultOk;
}

} // namespace Vst
} // namespace Steinberg
`;
  }

  private generateEntryPoint(options: VST3ExportOptions): string {
    const { pluginName, manufacturer, version, category, uniqueId } = options;

    return `#include "public.sdk/source/main/pluginfactory.h"
#include "${pluginName}Processor.h"
#include "${pluginName}Controller.h"

#define PLUGIN_VERSION "${version}"

using namespace Steinberg::Vst;

BEGIN_FACTORY_DEF("${manufacturer}", 
                  "https://yourwebsite.com", 
                  "mailto:info@yourwebsite.com")

    DEF_CLASS2(INLINE_UID_FROM_FUID(FUID(${uniqueId})),
               PClassInfo::kManyInstances,
               kVstAudioEffectClass,
               "${pluginName}",
               Vst::kDistributable,
               Vst::PlugType::k${category},
               PLUGIN_VERSION,
               kVstVersionString,
               ${pluginName}Processor::createInstance)

    DEF_CLASS2(INLINE_UID_FROM_FUID(FUID(${this.generateControllerId(uniqueId)})),
               PClassInfo::kManyInstances,
               kVstComponentControllerClass,
               "${pluginName}Controller",
               0,
               "",
               PLUGIN_VERSION,
               kVstVersionString,
               ${pluginName}Controller::createInstance)

END_FACTORY
`;
  }

  private generateCMakeLists(options: VST3ExportOptions): string {
    const { pluginName } = options;

    return `cmake_minimum_required(VERSION 3.15)
project(${pluginName})

set(CMAKE_CXX_STANDARD 17)
set(VST3_SDK_ROOT "/path/to/VST_SDK/vst3sdk" CACHE PATH "Path to VST3 SDK")

add_subdirectory(\${VST3_SDK_ROOT} vst3sdk)

smtg_add_vst3plugin(${pluginName}
    ${pluginName}Processor.cpp
    ${pluginName}Controller.cpp
    ${pluginName}Entry.cpp
)

target_link_libraries(${pluginName}
    PRIVATE
        sdk
)
`;
  }

  private generateBuildInstructions(options: VST3ExportOptions): string {
    return `# VST3 Build Instructions

## Prerequisites
1. Download VST3 SDK from: https://github.com/steinbergmedia/vst3sdk
2. Install CMake (3.15 or higher)
3. Install a C++ compiler (Visual Studio, Xcode, or GCC)

## Build Steps

### Windows (Visual Studio)
\`\`\`bash
mkdir build
cd build
cmake .. -DVST3_SDK_ROOT="C:/path/to/VST_SDK/vst3sdk"
cmake --build . --config Release
\`\`\`

### macOS (Xcode)
\`\`\`bash
mkdir build
cd build
cmake .. -GXcode -DVST3_SDK_ROOT="/path/to/VST_SDK/vst3sdk"
cmake --build . --config Release
\`\`\`

### Linux
\`\`\`bash
mkdir build
cd build
cmake .. -DVST3_SDK_ROOT="/path/to/VST_SDK/vst3sdk"
cmake --build . --config Release
\`\`\`

## Installation
The built VST3 plugin will be in: build/VST3/Release/${options.pluginName}.vst3

Copy this to your system's VST3 folder:
- Windows: C:\\Program Files\\Common Files\\VST3
- macOS: /Library/Audio/Plug-Ins/VST3
- Linux: ~/.vst3
`;
  }

  private generateParameterRegistration(param: DSPParameter, index: number): string {
    const title = param.label;
    const units = param.unit || '';
    const min = param.min ?? 0;
    const max = param.max ?? 1;
    const defaultNorm = param.default !== undefined 
      ? (Number(param.default) - min) / (max - min) 
      : 0.5;

    return `    parameters.addParameter(STR16("${title}"), STR16("${units}"), 0, ${defaultNorm}, ParameterInfo::kCanAutomate, ${index});`;
  }

  private getParamType(param: DSPParameter): string {
    switch (param.type) {
      case 'bool': return 'bool';
      case 'int': return 'int32';
      case 'float': return 'float';
      case 'enum': return 'int32';
      default: return 'float';
    }
  }

  private getDefaultValue(param: DSPParameter): string {
    if (param.default === undefined) return '0';
    if (typeof param.default === 'boolean') return param.default ? 'true' : 'false';
    return String(param.default);
  }

  private getConversion(param: DSPParameter, valueVar: string): string {
    const min = param.min ?? 0;
    const max = param.max ?? 1;
    
    if (param.type === 'bool') {
      return `${valueVar} > 0.5`;
    } else if (param.type === 'int') {
      return `static_cast<int32>(${valueVar} * ${max - min} + ${min})`;
    } else {
      return `static_cast<float>(${valueVar} * ${max - min} + ${min})`;
    }
  }

  private generateControllerId(processorId: string): string {
    // Simple transformation for controller ID
    return processorId.replace(/0x([0-9A-F]{8})/, (_, p1) => {
      const num = parseInt(p1, 16);
      return '0x' + (num + 1).toString(16).toUpperCase().padStart(8, '0');
    });
  }
}

  /**
   * Route audio processing to the Modal backend.
   * If Modal is unavailable (network error or non-2xx), the input is returned
   * unchanged (identity transform) so the host never receives silence.
   */
  async processAudio(
    pluginId: string,
    audioData: Float32Array,
    parameters: Record<string, number>
  ): Promise<Float32Array> {
    const modalUrl = `${import.meta.env.VITE_MODAL_API_URL || 'https://mabgwej--aura-x-backend-fastapi-app.modal.run'}/audio/process`;
    try {
      const response = await fetch(modalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plugin_id: pluginId,
          parameters,
          audio_data: Array.from(audioData),
        }),
      });
      if (!response.ok) {
        console.warn(`VST3Exporter: Modal backend returned ${response.status} — passing audio through unchanged.`);
        return audioData;
      }
      const json = await response.json();
      return new Float32Array(json.audio_data as number[]);
    } catch (err) {
      console.warn('VST3Exporter: Modal backend unreachable — passing audio through unchanged.', err);
      return audioData;
    }
  }

  /**
   * Persist plugin state to localStorage using JSON serialization.
   */
  saveState(pluginId: string, state: Record<string, unknown>): void {
    localStorage.setItem(`vst3_state_${pluginId}`, JSON.stringify(state));
  }

  /**
   * Restore plugin state from localStorage.
   * Returns null if no previously saved state exists for this plugin.
   */
  loadState(pluginId: string): Record<string, unknown> | null {
    return JSON.parse(localStorage.getItem(`vst3_state_${pluginId}`) || 'null');
  }
}

export const vst3Exporter = new VST3Exporter();
