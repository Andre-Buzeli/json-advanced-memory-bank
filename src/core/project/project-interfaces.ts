/**
 * Project management interface definitions
 */

export interface ProjectInfo {
  name: string;
  sanitizedName: string;
  path: string;
  isDefault: boolean;
  detectionMethod: 'auto' | 'manual' | 'fallback';
}

export interface IProjectDetector {
  detectProjectName(): string;
  sanitizeProjectName(name: string): string;
  getEffectiveProjectName(): string;
  getCurrentProjectName(): string;
  setActiveProject(projectName: string): void;
  getProjectInfo(): ProjectInfo;
}

export interface ConfigurationOptions {
  memoryBankRoot: string;
  memoryBankBackup: string;
  pruningThreshold: number;
  similarityThreshold: number;
  maxMemoryEntries: number;
  jsonCacheLifetime: number;
  backupCooldownMs: number;
  maxBackupsPerProject: number;
  enableDatabase: boolean;
  debugMode: boolean;
}

export interface IConfigManager {
  getConfig(): ConfigurationOptions;
  updateConfig(updates: Partial<ConfigurationOptions>): void;
  resetToDefaults(): void;
  validateConfig(): { isValid: boolean; errors: string[] };
  getConfigPath(): string;
  saveConfig(): Promise<void>;
  loadConfig(): Promise<void>;
}
