/**
 * DAW Bridge Engine
 * WebSocket/OSC bridge for real-time DAW integration
 * 
 * Implements:
 * - OSC message protocol for DAW communication
 * - MIDI-over-WebSocket for pattern sync
 * - Real-time parameter automation
 * - Project state synchronization
 */

// ============= OSC Protocol Types =============

export interface OSCMessage {
  address: string;
  args: OSCArgument[];
  timestamp?: number;
}

export type OSCArgument = 
  | { type: 'i'; value: number }   // int32
  | { type: 'f'; value: number }   // float32
  | { type: 's'; value: string }   // string
  | { type: 'b'; value: Uint8Array } // blob
  | { type: 'T'; value: true }     // true
  | { type: 'F'; value: false };   // false

export interface MIDIMessage {
  type: 'noteon' | 'noteoff' | 'cc' | 'pitchbend' | 'clock' | 'start' | 'stop';
  channel: number;
  data: number[];
  timestamp: number;
}

// ============= Bridge Configuration =============

export interface DAWBridgeConfig {
  wsUrl?: string;
  oscHost?: string;
  oscPort?: number;
  dawType: DAWType;
  autoReconnect: boolean;
  heartbeatInterval: number;
}

export type DAWType = 
  | 'ableton'
  | 'fl_studio'
  | 'logic'
  | 'bitwig'
  | 'reaper'
  | 'generic';

export interface DAWCapabilities {
  supportsOSC: boolean;
  supportsMIDI: boolean;
  supportsRemoteScript: boolean;
  maxTracks: number;
  maxEffectsPerTrack: number;
  features: string[];
}

const DAW_CAPABILITIES: Record<DAWType, DAWCapabilities> = {
  ableton: {
    supportsOSC: true,
    supportsMIDI: true,
    supportsRemoteScript: true,
    maxTracks: 999,
    maxEffectsPerTrack: 12,
    features: ['clip_launch', 'scene_launch', 'device_control', 'mixer', 'transport']
  },
  fl_studio: {
    supportsOSC: true,
    supportsMIDI: true,
    supportsRemoteScript: false,
    maxTracks: 500,
    maxEffectsPerTrack: 10,
    features: ['mixer', 'transport', 'pattern_control', 'playlist']
  },
  logic: {
    supportsOSC: true,
    supportsMIDI: true,
    supportsRemoteScript: false,
    maxTracks: 1000,
    maxEffectsPerTrack: 15,
    features: ['mixer', 'transport', 'region_control']
  },
  bitwig: {
    supportsOSC: true,
    supportsMIDI: true,
    supportsRemoteScript: true,
    maxTracks: 999,
    maxEffectsPerTrack: 16,
    features: ['clip_launch', 'device_control', 'mixer', 'transport', 'modulation']
  },
  reaper: {
    supportsOSC: true,
    supportsMIDI: true,
    supportsRemoteScript: true,
    maxTracks: 999,
    maxEffectsPerTrack: 999,
    features: ['mixer', 'transport', 'fx_control', 'item_control']
  },
  generic: {
    supportsOSC: true,
    supportsMIDI: true,
    supportsRemoteScript: false,
    maxTracks: 128,
    maxEffectsPerTrack: 8,
    features: ['transport', 'mixer']
  }
};

// ============= Bridge State =============

export interface BridgeState {
  connected: boolean;
  dawType: DAWType;
  transport: TransportState;
  mixer: MixerState;
  activeProject: ProjectState | null;
  lastSync: number;
}

export interface TransportState {
  isPlaying: boolean;
  isRecording: boolean;
  bpm: number;
  timeSignature: [number, number];
  position: {
    bars: number;
    beats: number;
    ticks: number;
    seconds: number;
  };
  loop: {
    enabled: boolean;
    start: number;
    end: number;
  };
}

export interface MixerState {
  tracks: TrackState[];
  masterVolume: number;
  masterPan: number;
  masterMute: boolean;
}

export interface TrackState {
  index: number;
  name: string;
  type: 'audio' | 'midi' | 'bus' | 'master';
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  armed: boolean;
  effects: EffectState[];
}

export interface EffectState {
  index: number;
  name: string;
  enabled: boolean;
  params: Map<string, number>;
}

export interface ProjectState {
  name: string;
  bpm: number;
  key: string;
  timeSignature: [number, number];
  trackCount: number;
  duration: number;
}

// ============= Event Types =============

export type BridgeEventType = 
  | 'connected'
  | 'disconnected'
  | 'transport_change'
  | 'mixer_change'
  | 'track_change'
  | 'effect_change'
  | 'project_change'
  | 'midi_received'
  | 'osc_received'
  | 'error';

export interface BridgeEvent {
  type: BridgeEventType;
  data: any;
  timestamp: number;
}

export type BridgeEventHandler = (event: BridgeEvent) => void;

// ============= DAW Bridge Engine =============

export class DAWBridgeEngine {
  private static instance: DAWBridgeEngine;
  
  private config: DAWBridgeConfig;
  private state: BridgeState;
  private ws: WebSocket | null = null;
  private eventHandlers: Map<BridgeEventType, BridgeEventHandler[]> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private messageQueue: OSCMessage[] = [];

  static getInstance(): DAWBridgeEngine {
    if (!this.instance) {
      this.instance = new DAWBridgeEngine();
    }
    return this.instance;
  }

  private constructor() {
    this.config = {
      wsUrl: 'ws://localhost:9000',
      oscHost: '127.0.0.1',
      oscPort: 8000,
      dawType: 'generic',
      autoReconnect: true,
      heartbeatInterval: 1000
    };

    this.state = {
      connected: false,
      dawType: 'generic',
      transport: {
        isPlaying: false,
        isRecording: false,
        bpm: 112,
        timeSignature: [4, 4],
        position: { bars: 1, beats: 1, ticks: 0, seconds: 0 },
        loop: { enabled: false, start: 0, end: 16 }
      },
      mixer: {
        tracks: [],
        masterVolume: 0.8,
        masterPan: 0,
        masterMute: false
      },
      activeProject: null,
      lastSync: 0
    };
  }

  /**
   * Configure the bridge
   */
  configure(config: Partial<DAWBridgeConfig>): void {
    this.config = { ...this.config, ...config };
    this.state.dawType = this.config.dawType;
  }

  /**
   * Connect to DAW via WebSocket
   */
  async connect(): Promise<boolean> {
    if (this.state.connected) {
      console.log('[DAWBridge] Already connected');
      return true;
    }

    return new Promise((resolve) => {
      try {
        console.log(`[DAWBridge] Connecting to ${this.config.wsUrl}...`);
        
        this.ws = new WebSocket(this.config.wsUrl || 'ws://localhost:9000');

        this.ws.onopen = () => {
          console.log('[DAWBridge] Connected');
          this.state.connected = true;
          this.emit('connected', { dawType: this.config.dawType });
          this.startHeartbeat();
          this.requestFullState();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[DAWBridge] WebSocket error:', error);
          this.emit('error', { message: 'Connection error' });
        };

        this.ws.onclose = () => {
          console.log('[DAWBridge] Disconnected');
          this.state.connected = false;
          this.stopHeartbeat();
          this.emit('disconnected', {});
          
          if (this.config.autoReconnect) {
            this.scheduleReconnect();
          }
          resolve(false);
        };

        // Timeout for connection
        setTimeout(() => {
          if (!this.state.connected) {
            console.log('[DAWBridge] Connection timeout');
            this.ws?.close();
            resolve(false);
          }
        }, 5000);

      } catch (error) {
        console.error('[DAWBridge] Connection failed:', error);
        resolve(false);
      }
    });
  }

  /**
   * Disconnect from DAW
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
    this.state.connected = false;
  }

  /**
   * Get current bridge state
   */
  getState(): BridgeState {
    return { ...this.state };
  }

  /**
   * Get DAW capabilities
   */
  getCapabilities(): DAWCapabilities {
    return DAW_CAPABILITIES[this.config.dawType];
  }

  // ============= Transport Control =============

  play(): void {
    this.sendOSC('/transport/play', []);
  }

  stop(): void {
    this.sendOSC('/transport/stop', []);
  }

  pause(): void {
    this.sendOSC('/transport/pause', []);
  }

  record(): void {
    this.sendOSC('/transport/record', []);
  }

  setBPM(bpm: number): void {
    this.sendOSC('/transport/bpm', [{ type: 'f', value: bpm }]);
    this.state.transport.bpm = bpm;
  }

  setPosition(bars: number, beats: number = 1): void {
    this.sendOSC('/transport/position', [
      { type: 'i', value: bars },
      { type: 'i', value: beats }
    ]);
  }

  setLoop(enabled: boolean, start?: number, end?: number): void {
    this.sendOSC('/transport/loop', [
      { type: 'i', value: enabled ? 1 : 0 },
      { type: 'i', value: start ?? this.state.transport.loop.start },
      { type: 'i', value: end ?? this.state.transport.loop.end }
    ]);
  }

  // ============= Mixer Control =============

  setTrackVolume(trackIndex: number, volume: number): void {
    this.sendOSC(`/mixer/track/${trackIndex}/volume`, [{ type: 'f', value: volume }]);
  }

  setTrackPan(trackIndex: number, pan: number): void {
    this.sendOSC(`/mixer/track/${trackIndex}/pan`, [{ type: 'f', value: pan }]);
  }

  setTrackMute(trackIndex: number, mute: boolean): void {
    this.sendOSC(`/mixer/track/${trackIndex}/mute`, [{ type: 'i', value: mute ? 1 : 0 }]);
  }

  setTrackSolo(trackIndex: number, solo: boolean): void {
    this.sendOSC(`/mixer/track/${trackIndex}/solo`, [{ type: 'i', value: solo ? 1 : 0 }]);
  }

  setMasterVolume(volume: number): void {
    this.sendOSC('/mixer/master/volume', [{ type: 'f', value: volume }]);
    this.state.mixer.masterVolume = volume;
  }

  // ============= Track Operations =============

  createTrack(name: string, type: 'audio' | 'midi'): void {
    this.sendOSC('/track/create', [
      { type: 's', value: name },
      { type: 's', value: type }
    ]);
  }

  deleteTrack(trackIndex: number): void {
    this.sendOSC(`/track/${trackIndex}/delete`, []);
  }

  renameTrack(trackIndex: number, name: string): void {
    this.sendOSC(`/track/${trackIndex}/name`, [{ type: 's', value: name }]);
  }

  // ============= MIDI Operations =============

  sendMIDI(message: MIDIMessage): void {
    const data = this.encodeMIDI(message);
    this.sendOSC('/midi/send', [{ type: 'b', value: data }]);
  }

  sendMIDINote(channel: number, note: number, velocity: number, duration: number): void {
    // Note on
    this.sendMIDI({
      type: 'noteon',
      channel,
      data: [note, velocity],
      timestamp: Date.now()
    });

    // Schedule note off
    setTimeout(() => {
      this.sendMIDI({
        type: 'noteoff',
        channel,
        data: [note, 0],
        timestamp: Date.now()
      });
    }, duration * 1000);
  }

  sendMIDICC(channel: number, cc: number, value: number): void {
    this.sendMIDI({
      type: 'cc',
      channel,
      data: [cc, value],
      timestamp: Date.now()
    });
  }

  // ============= Clip/Pattern Operations =============

  createClip(trackIndex: number, startBar: number, lengthBars: number, name?: string): void {
    this.sendOSC(`/track/${trackIndex}/clip/create`, [
      { type: 'i', value: startBar },
      { type: 'i', value: lengthBars },
      { type: 's', value: name || 'New Clip' }
    ]);
  }

  insertMIDIPattern(trackIndex: number, startBar: number, notes: Array<{
    pitch: number;
    velocity: number;
    startBeat: number;
    duration: number;
  }>): void {
    const encodedNotes = notes.map(n => 
      `${n.pitch}:${n.velocity}:${n.startBeat}:${n.duration}`
    ).join(',');

    this.sendOSC(`/track/${trackIndex}/clip/midi`, [
      { type: 'i', value: startBar },
      { type: 's', value: encodedNotes }
    ]);
  }

  // ============= Effect Operations =============

  insertEffect(trackIndex: number, effectName: string, slot?: number): void {
    this.sendOSC(`/track/${trackIndex}/effect/insert`, [
      { type: 's', value: effectName },
      { type: 'i', value: slot ?? -1 }
    ]);
  }

  setEffectParam(trackIndex: number, effectIndex: number, param: string, value: number): void {
    this.sendOSC(`/track/${trackIndex}/effect/${effectIndex}/param`, [
      { type: 's', value: param },
      { type: 'f', value: value }
    ]);
  }

  bypassEffect(trackIndex: number, effectIndex: number, bypass: boolean): void {
    this.sendOSC(`/track/${trackIndex}/effect/${effectIndex}/bypass`, [
      { type: 'i', value: bypass ? 1 : 0 }
    ]);
  }

  // ============= Project Operations =============

  saveProject(): void {
    this.sendOSC('/project/save', []);
  }

  exportAudio(format: 'wav' | 'mp3' | 'flac' = 'wav'): void {
    this.sendOSC('/project/export', [{ type: 's', value: format }]);
  }

  // ============= Event Handling =============

  on(event: BridgeEventType, handler: BridgeEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: BridgeEventType, handler: BridgeEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(type: BridgeEventType, data: any): void {
    const event: BridgeEvent = { type, data, timestamp: Date.now() };
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  // ============= Private Methods =============

  private sendOSC(address: string, args: OSCArgument[]): void {
    const message: OSCMessage = { address, args, timestamp: Date.now() };
    
    if (!this.state.connected || !this.ws) {
      this.messageQueue.push(message);
      console.log(`[DAWBridge] Queued: ${address}`);
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      if (message.address) {
        this.handleOSCMessage(message as OSCMessage);
      } else if (message.type) {
        this.handleMIDIMessage(message as MIDIMessage);
      }
    } catch (error) {
      console.error('[DAWBridge] Parse error:', error);
    }
  }

  private handleOSCMessage(message: OSCMessage): void {
    const { address, args } = message;

    // Transport updates
    if (address.startsWith('/transport')) {
      if (address === '/transport/playing') {
        this.state.transport.isPlaying = args[0]?.value === 1;
        this.emit('transport_change', this.state.transport);
      } else if (address === '/transport/bpm') {
        this.state.transport.bpm = args[0]?.value as number;
        this.emit('transport_change', this.state.transport);
      } else if (address === '/transport/position') {
        this.state.transport.position = {
          bars: args[0]?.value as number,
          beats: args[1]?.value as number,
          ticks: args[2]?.value as number || 0,
          seconds: args[3]?.value as number || 0
        };
        this.emit('transport_change', this.state.transport);
      }
    }

    // Mixer updates
    if (address.startsWith('/mixer')) {
      this.emit('mixer_change', message);
    }

    // Track updates
    if (address.startsWith('/track')) {
      this.emit('track_change', message);
    }

    this.emit('osc_received', message);
  }

  private handleMIDIMessage(message: MIDIMessage): void {
    this.emit('midi_received', message);
  }

  private encodeMIDI(message: MIDIMessage): Uint8Array {
    const status = this.getMIDIStatus(message.type, message.channel);
    return new Uint8Array([status, ...message.data]);
  }

  private getMIDIStatus(type: MIDIMessage['type'], channel: number): number {
    const statusMap: Record<string, number> = {
      noteoff: 0x80,
      noteon: 0x90,
      cc: 0xB0,
      pitchbend: 0xE0
    };
    return (statusMap[type] || 0x90) + (channel & 0x0F);
  }

  private requestFullState(): void {
    this.sendOSC('/state/request', []);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.state.connected) {
        this.sendOSC('/heartbeat', [{ type: 'i', value: Date.now() }]);
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      console.log('[DAWBridge] Attempting reconnect...');
      this.connect();
    }, 3000);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.state.connected) {
      const message = this.messageQueue.shift();
      if (message && this.ws) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }
}

// Export singleton
export const dawBridge = DAWBridgeEngine.getInstance();
