/**
 * Plugin Instance Manager
 * Manages lifecycle of multiple plugin instances in a session
 */

import { wasmPluginLoader, WasmPluginInstance } from './WasmPluginLoader';

export interface PluginSession {
  id: string;
  name: string;
  instances: string[]; // Instance IDs
  connections: AudioConnection[];
  createdAt: Date;
}

export interface AudioConnection {
  fromInstanceId: string;
  toInstanceId: string;
  fromChannel?: number;
  toChannel?: number;
}

export class PluginInstanceManager {
  private static instance: PluginInstanceManager;
  private sessions: Map<string, PluginSession> = new Map();
  private activeSessionId: string | null = null;

  private constructor() {}

  static getInstance(): PluginInstanceManager {
    if (!PluginInstanceManager.instance) {
      PluginInstanceManager.instance = new PluginInstanceManager();
    }
    return PluginInstanceManager.instance;
  }

  createSession(name: string): PluginSession {
    const session: PluginSession = {
      id: crypto.randomUUID(),
      name,
      instances: [],
      connections: [],
      createdAt: new Date()
    };

    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;

    console.log(`[PluginInstanceManager] Session created:`, session.id);
    return session;
  }

  getSession(sessionId: string): PluginSession | undefined {
    return this.sessions.get(sessionId);
  }

  getActiveSession(): PluginSession | null {
    return this.activeSessionId ? this.sessions.get(this.activeSessionId) || null : null;
  }

  setActiveSession(sessionId: string): void {
    if (this.sessions.has(sessionId)) {
      this.activeSessionId = sessionId;
    }
  }

  async addPluginToSession(
    sessionId: string,
    pluginName: string,
    wasmBinary: Uint8Array,
    manifest: any
  ): Promise<string | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error('[PluginInstanceManager] Session not found:', sessionId);
      return null;
    }

    const result = await wasmPluginLoader.loadPlugin(pluginName, wasmBinary, manifest);
    
    if (result.success && result.instance) {
      session.instances.push(result.instance.id);
      console.log(`[PluginInstanceManager] Plugin added to session:`, {
        sessionId,
        instanceId: result.instance.id,
        pluginName
      });
      return result.instance.id;
    }

    return null;
  }

  removePluginFromSession(sessionId: string, instanceId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Remove instance
    session.instances = session.instances.filter(id => id !== instanceId);

    // Remove connections
    session.connections = session.connections.filter(
      conn => conn.fromInstanceId !== instanceId && conn.toInstanceId !== instanceId
    );

    // Unload plugin
    wasmPluginLoader.unloadPlugin(instanceId);

    console.log(`[PluginInstanceManager] Plugin removed from session:`, {
      sessionId,
      instanceId
    });
  }

  connectPlugins(
    sessionId: string,
    fromInstanceId: string,
    toInstanceId: string,
    fromChannel?: number,
    toChannel?: number
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const connection: AudioConnection = {
      fromInstanceId,
      toInstanceId,
      fromChannel,
      toChannel
    };

    session.connections.push(connection);

    console.log(`[PluginInstanceManager] Plugins connected:`, connection);
  }

  disconnectPlugins(sessionId: string, fromInstanceId: string, toInstanceId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.connections = session.connections.filter(
      conn => !(conn.fromInstanceId === fromInstanceId && conn.toInstanceId === toInstanceId)
    );

    console.log(`[PluginInstanceManager] Plugins disconnected:`, {
      fromInstanceId,
      toInstanceId
    });
  }

  getSessionInstances(sessionId: string): WasmPluginInstance[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.instances
      .map(id => wasmPluginLoader.getInstance(id))
      .filter((inst): inst is WasmPluginInstance => inst !== undefined);
  }

  async processSessionAudio(
    sessionId: string,
    inputBuffer: Float32Array
  ): Promise<Float32Array> {
    const instances = this.getSessionInstances(sessionId);
    
    let buffer = inputBuffer;
    
    // Process through each plugin in chain
    for (const instance of instances) {
      buffer = await wasmPluginLoader.processAudio(instance.id, buffer);
    }

    return buffer;
  }

  deleteSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Unload all plugins in session
    session.instances.forEach(instanceId => {
      wasmPluginLoader.unloadPlugin(instanceId);
    });

    this.sessions.delete(sessionId);

    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }

    console.log(`[PluginInstanceManager] Session deleted:`, sessionId);
  }

  getAllSessions(): PluginSession[] {
    return Array.from(this.sessions.values());
  }

  dispose(): void {
    this.sessions.forEach((session, id) => {
      this.deleteSession(id);
    });
    this.sessions.clear();
    this.activeSessionId = null;
  }
}

export const pluginInstanceManager = PluginInstanceManager.getInstance();
