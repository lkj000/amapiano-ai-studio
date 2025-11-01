// Plugin Version Control System - Phase 2
export interface PluginVersion {
  id: string;
  pluginId: string;
  version: string;
  timestamp: number;
  code: string;
  parameters: Record<string, any>;
  changelog?: string;
  author?: string;
  tags?: string[];
}

export interface VersionDiff {
  added: string[];
  removed: string[];
  modified: string[];
  parameterChanges: Record<string, { old: any; new: any }>;
}

export class PluginVersionControl {
  private versions: Map<string, PluginVersion[]> = new Map();
  private maxVersionsPerPlugin = 50;

  saveVersion(
    pluginId: string,
    code: string,
    parameters: Record<string, any>,
    changelog?: string
  ): PluginVersion {
    const versions = this.versions.get(pluginId) || [];
    const version = this.generateVersionNumber(versions);
    
    const newVersion: PluginVersion = {
      id: `${pluginId}-${Date.now()}`,
      pluginId,
      version,
      timestamp: Date.now(),
      code,
      parameters,
      changelog,
      tags: []
    };

    versions.push(newVersion);
    
    // Keep only last N versions
    if (versions.length > this.maxVersionsPerPlugin) {
      versions.shift();
    }
    
    this.versions.set(pluginId, versions);
    return newVersion;
  }

  getVersions(pluginId: string): PluginVersion[] {
    return this.versions.get(pluginId) || [];
  }

  getVersion(pluginId: string, versionId: string): PluginVersion | null {
    const versions = this.versions.get(pluginId) || [];
    return versions.find(v => v.id === versionId) || null;
  }

  rollback(pluginId: string, versionId: string): PluginVersion | null {
    const version = this.getVersion(pluginId, versionId);
    if (!version) return null;

    // Create a new version based on the old one
    return this.saveVersion(
      pluginId,
      version.code,
      version.parameters,
      `Rolled back to version ${version.version}`
    );
  }

  compareVersions(pluginId: string, v1Id: string, v2Id: string): VersionDiff | null {
    const version1 = this.getVersion(pluginId, v1Id);
    const version2 = this.getVersion(pluginId, v2Id);
    
    if (!version1 || !version2) return null;

    const params1 = Object.keys(version1.parameters);
    const params2 = Object.keys(version2.parameters);

    const added = params2.filter(p => !params1.includes(p));
    const removed = params1.filter(p => !params2.includes(p));
    const modified = params1.filter(p => 
      params2.includes(p) && version1.parameters[p] !== version2.parameters[p]
    );

    const parameterChanges: Record<string, { old: any; new: any }> = {};
    modified.forEach(param => {
      parameterChanges[param] = {
        old: version1.parameters[param],
        new: version2.parameters[param]
      };
    });

    return { added, removed, modified, parameterChanges };
  }

  tagVersion(pluginId: string, versionId: string, tag: string): boolean {
    const version = this.getVersion(pluginId, versionId);
    if (!version) return false;
    
    if (!version.tags) version.tags = [];
    if (!version.tags.includes(tag)) {
      version.tags.push(tag);
    }
    return true;
  }

  private generateVersionNumber(versions: PluginVersion[]): string {
    if (versions.length === 0) return '1.0.0';
    
    const lastVersion = versions[versions.length - 1].version;
    const parts = lastVersion.split('.').map(Number);
    parts[2]++; // Increment patch version
    
    if (parts[2] >= 100) {
      parts[1]++;
      parts[2] = 0;
    }
    if (parts[1] >= 100) {
      parts[0]++;
      parts[1] = 0;
    }
    
    return parts.join('.');
  }

  exportVersionHistory(pluginId: string): string {
    const versions = this.getVersions(pluginId);
    return JSON.stringify(versions, null, 2);
  }

  importVersionHistory(pluginId: string, historyJson: string): boolean {
    try {
      const versions = JSON.parse(historyJson) as PluginVersion[];
      this.versions.set(pluginId, versions);
      return true;
    } catch {
      return false;
    }
  }
}

export const pluginVersionControl = new PluginVersionControl();
