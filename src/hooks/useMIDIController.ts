import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface MIDIDevice {
  id: string;
  name: string;
  manufacturer?: string;
  type: 'input' | 'output';
  state: 'connected' | 'disconnected';
  connection: 'open' | 'closed' | 'pending';
}

export interface MIDIMessage {
  type: 'noteon' | 'noteoff' | 'controlchange' | 'programchange' | 'pitchbend' | 'aftertouch';
  channel: number;
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
  program?: number;
  pressure?: number;
  bend?: number;
  timestamp: number;
}

export interface MIDIMapping {
  id: string;
  controllerId: string;
  controllerName: string;
  parameterPath: string; // e.g., 'track.1.volume', 'effect.reverb.wetness'
  parameterName: string;
  minValue: number;
  maxValue: number;
  curve: 'linear' | 'exponential' | 'logarithmic';
  isActive: boolean;
}

export interface MIDIControllerPreset {
  id: string;
  name: string;
  deviceName: string;
  mappings: MIDIMapping[];
  createdAt: string;
  author: string;
}

// Popular MIDI controller presets
const createDefaultPresets = (): MIDIControllerPreset[] => [
  {
    id: 'akai-mpk-mini-mk3',
    name: 'Akai MPK Mini MK3',
    deviceName: 'MPK mini 3',
    author: 'Lovable DAW',
    createdAt: new Date().toISOString(),
    mappings: [
      {
        id: 'knob1-master-volume',
        controllerId: '1',
        controllerName: 'Knob 1',
        parameterPath: 'master.volume',
        parameterName: 'Master Volume',
        minValue: 0,
        maxValue: 1,
        curve: 'linear',
        isActive: true
      },
      {
        id: 'knob2-track1-volume',
        controllerId: '2',
        controllerName: 'Knob 2',
        parameterPath: 'track.1.volume',
        parameterName: 'Track 1 Volume',
        minValue: 0,
        maxValue: 1,
        curve: 'linear',
        isActive: true
      },
      {
        id: 'knob3-track2-volume',
        controllerId: '3',
        controllerName: 'Knob 3',
        parameterPath: 'track.2.volume',
        parameterName: 'Track 2 Volume',
        minValue: 0,
        maxValue: 1,
        curve: 'linear',
        isActive: true
      },
      {
        id: 'knob4-filter-cutoff',
        controllerId: '4',
        controllerName: 'Knob 4',
        parameterPath: 'track.selected.filter.cutoff',
        parameterName: 'Filter Cutoff',
        minValue: 20,
        maxValue: 20000,
        curve: 'exponential',
        isActive: true
      }
    ]
  },
  {
    id: 'novation-launchkey-mini',
    name: 'Novation Launchkey Mini',
    deviceName: 'Launchkey Mini',
    author: 'Lovable DAW',
    createdAt: new Date().toISOString(),
    mappings: [
      {
        id: 'knob1-master-volume',
        controllerId: '21',
        controllerName: 'Knob 1',
        parameterPath: 'master.volume',
        parameterName: 'Master Volume',
        minValue: 0,
        maxValue: 1,
        curve: 'linear',
        isActive: true
      },
      {
        id: 'knob2-reverb-wetness',
        controllerId: '22',
        controllerName: 'Knob 2',
        parameterPath: 'effect.reverb.wetness',
        parameterName: 'Reverb Wetness',
        minValue: 0,
        maxValue: 1,
        curve: 'linear',
        isActive: true
      }
    ]
  }
];

export function useMIDIController() {
  const [devices, setDevices] = useState<MIDIDevice[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<MIDIDevice[]>([]);
  const [mappings, setMappings] = useState<MIDIMapping[]>([]);
  const [presets, setPresets] = useState<MIDIControllerPreset[]>(createDefaultPresets());
  const [activePreset, setActivePreset] = useState<MIDIControllerPreset | null>(null);
  const [isLearningMode, setIsLearningMode] = useState(false);
  const [lastMIDIMessage, setLastMIDIMessage] = useState<MIDIMessage | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const inputsRef = useRef<Map<string, MIDIInput>>(new Map());
  const outputsRef = useRef<Map<string, MIDIOutput>>(new Map());
  const parametersRef = useRef<Map<string, (value: number) => void>>(new Map());

  // Initialize MIDI system
  useEffect(() => {
    const initMIDI = async () => {
      try {
        if (!navigator.requestMIDIAccess) {
          console.warn('Web MIDI API not supported');
          setIsSupported(false);
          return;
        }

        const access = await navigator.requestMIDIAccess();
        midiAccessRef.current = access;
        setIsSupported(true);

        // Set up event listeners
        access.addEventListener('statechange', handleMIDIStateChange);

        // Initialize devices
        updateDeviceList(access);
        
        toast.success('MIDI system initialized');
      } catch (error) {
        console.error('Failed to initialize MIDI:', error);
        toast.error('Failed to initialize MIDI system');
        setIsSupported(false);
      }
    };

    initMIDI();

    return () => {
      // Cleanup
      if (midiAccessRef.current) {
        midiAccessRef.current.removeEventListener('statechange', handleMIDIStateChange);
      }
      inputsRef.current.forEach(input => {
        input.removeEventListener('midimessage', handleMIDIMessage);
      });
    };
  }, []);

  const updateDeviceList = useCallback((access: MIDIAccess) => {
    const deviceList: MIDIDevice[] = [];
    const connectedList: MIDIDevice[] = [];

    // Add inputs
    access.inputs.forEach((input) => {
      const device: MIDIDevice = {
        id: input.id,
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer,
        type: 'input',
        state: input.state as 'connected' | 'disconnected',
        connection: input.connection as 'open' | 'closed' | 'pending'
      };
      
      deviceList.push(device);
      
      if (device.state === 'connected') {
        connectedList.push(device);
        
        // Set up message handler
        input.addEventListener('midimessage', handleMIDIMessage);
        inputsRef.current.set(input.id, input);
      }
    });

    // Add outputs
    access.outputs.forEach((output) => {
      const device: MIDIDevice = {
        id: output.id,
        name: output.name || 'Unknown Device',
        manufacturer: output.manufacturer,
        type: 'output',
        state: output.state as 'connected' | 'disconnected',
        connection: output.connection as 'open' | 'closed' | 'pending'
      };
      
      deviceList.push(device);
      
      if (device.state === 'connected') {
        connectedList.push(device);
        outputsRef.current.set(output.id, output);
      }
    });

    setDevices(deviceList);
    setConnectedDevices(connectedList);

    // Auto-load preset for connected devices
    connectedList.forEach(device => {
      if (device.type === 'input') {
        const matchingPreset = presets.find(preset => 
          device.name.toLowerCase().includes(preset.deviceName.toLowerCase())
        );
        if (matchingPreset && !activePreset) {
          loadPreset(matchingPreset);
        }
      }
    });
  }, [presets, activePreset]);

  const handleMIDIStateChange = useCallback((event: Event) => {
    if (midiAccessRef.current) {
      updateDeviceList(midiAccessRef.current);
    }
  }, [updateDeviceList]);

  const handleMIDIMessage = useCallback((event: Event) => {
    const midiEvent = event as MIDIMessageEvent;
    const [status, data1, data2] = midiEvent.data;
    
    const channel = status & 0x0F;
    const messageType = status & 0xF0;
    
    let message: MIDIMessage | null = null;
    
    switch (messageType) {
      case 0x90: // Note on
        if (data2 > 0) {
          message = {
            type: 'noteon',
            channel,
            note: data1,
            velocity: data2,
            timestamp: midiEvent.timeStamp
          };
        } else {
          message = {
            type: 'noteoff',
            channel,
            note: data1,
            velocity: data2,
            timestamp: midiEvent.timeStamp
          };
        }
        break;
      case 0x80: // Note off
        message = {
          type: 'noteoff',
          channel,
          note: data1,
          velocity: data2,
          timestamp: midiEvent.timeStamp
        };
        break;
      case 0xB0: // Control change
        message = {
          type: 'controlchange',
          channel,
          controller: data1,
          value: data2,
          timestamp: midiEvent.timeStamp
        };
        break;
      case 0xC0: // Program change
        message = {
          type: 'programchange',
          channel,
          program: data1,
          timestamp: midiEvent.timeStamp
        };
        break;
      case 0xE0: // Pitch bend
        message = {
          type: 'pitchbend',
          channel,
          bend: (data2 << 7) | data1,
          timestamp: midiEvent.timeStamp
        };
        break;
    }
    
    if (message) {
      setLastMIDIMessage(message);
      
      // Handle control changes for mapped parameters
      if (message.type === 'controlchange') {
        handleControllerMapping(message.controller!, message.value!);
      }
    }
  }, []);

  const handleControllerMapping = useCallback((controller: number, value: number) => {
    const mapping = mappings.find(m => 
      m.isActive && parseInt(m.controllerId) === controller
    );
    
    if (mapping) {
      // Convert MIDI value (0-127) to parameter range
      let normalizedValue = value / 127;
      
      // Apply curve
      switch (mapping.curve) {
        case 'exponential':
          normalizedValue = Math.pow(normalizedValue, 2);
          break;
        case 'logarithmic':
          normalizedValue = Math.log10(1 + normalizedValue * 9) / Math.log10(10);
          break;
        // 'linear' is default, no transformation needed
      }
      
      const paramValue = mapping.minValue + (normalizedValue * (mapping.maxValue - mapping.minValue));
      
      // Execute parameter callback
      const callback = parametersRef.current.get(mapping.parameterPath);
      if (callback) {
        callback(paramValue);
      }
    }
  }, [mappings]);

  const registerParameter = useCallback((path: string, callback: (value: number) => void) => {
    parametersRef.current.set(path, callback);
    
    return () => {
      parametersRef.current.delete(path);
    };
  }, []);

  const createMapping = useCallback((
    controllerId: string,
    controllerName: string,
    parameterPath: string,
    parameterName: string,
    minValue: number = 0,
    maxValue: number = 1,
    curve: 'linear' | 'exponential' | 'logarithmic' = 'linear'
  ): MIDIMapping => {
    const mapping: MIDIMapping = {
      id: `mapping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      controllerId,
      controllerName,
      parameterPath,
      parameterName,
      minValue,
      maxValue,
      curve,
      isActive: true
    };
    
    setMappings(prev => [...prev, mapping]);
    return mapping;
  }, []);

  const removeMapping = useCallback((mappingId: string) => {
    setMappings(prev => prev.filter(m => m.id !== mappingId));
  }, []);

  const toggleMapping = useCallback((mappingId: string) => {
    setMappings(prev => prev.map(m => 
      m.id === mappingId ? { ...m, isActive: !m.isActive } : m
    ));
  }, []);

  const loadPreset = useCallback((preset: MIDIControllerPreset) => {
    setMappings(preset.mappings);
    setActivePreset(preset);
    toast.success(`Loaded preset: ${preset.name}`);
  }, []);

  const savePreset = useCallback((name: string, deviceName: string): MIDIControllerPreset => {
    const preset: MIDIControllerPreset = {
      id: `preset_${Date.now()}`,
      name,
      deviceName,
      mappings: [...mappings],
      createdAt: new Date().toISOString(),
      author: 'User'
    };
    
    setPresets(prev => [...prev, preset]);
    setActivePreset(preset);
    toast.success(`Saved preset: ${name}`);
    return preset;
  }, [mappings]);

  const startLearning = useCallback(() => {
    setIsLearningMode(true);
    toast.info('MIDI Learn mode active - move a controller to map it');
  }, []);

  const stopLearning = useCallback(() => {
    setIsLearningMode(false);
  }, []);

  const sendMIDIMessage = useCallback((deviceId: string, message: number[]) => {
    const output = outputsRef.current.get(deviceId);
    if (output) {
      output.send(message);
    }
  }, []);

  return {
    // State
    devices,
    connectedDevices,
    mappings,
    presets,
    activePreset,
    isLearningMode,
    lastMIDIMessage,
    isSupported,
    
    // Actions
    createMapping,
    removeMapping,
    toggleMapping,
    loadPreset,
    savePreset,
    startLearning,
    stopLearning,
    sendMIDIMessage,
    registerParameter,
    
    // Utils
    getConnectedInputs: () => connectedDevices.filter(d => d.type === 'input'),
    getConnectedOutputs: () => connectedDevices.filter(d => d.type === 'output')
  };
}