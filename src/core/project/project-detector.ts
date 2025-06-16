/**
 * Project Detection implementation for Advanced Memory Bank MCP v3.0.0
 * Simplified - always uses auto-detection from IDE workspace folder
 */

import path from 'path';
import { 
  IProjectDetector, 
  ProjectInfo 
} from './project-interfaces.js';
import { ErrorRecoveryService } from '../errors/index.js';

export class ProjectDetector implements IProjectDetector {
  private readonly autoDetectedProjectName: string;
  private readonly errorRecovery: ErrorRecoveryService;

  constructor() {
    this.errorRecovery = new ErrorRecoveryService();
    this.autoDetectedProjectName = this.detectProjectName();
  }

  /**
   * Detect project name automatically from current working directory
   * ALWAYS uses the current folder name opened in IDE
   */
  detectProjectName(): string {
    try {
      // Use process.cwd() to get current directory
      const cwd = process.cwd();
      const projectName = path.basename(cwd);
      
      // Validate detected name
      if (!projectName || projectName === '.' || projectName === '/' || projectName === '\\') {
        return this.sanitizeProjectName('default-project');
      }
      
      // ALWAYS use only the current folder name (never combine with parent folder)
      return this.sanitizeProjectName(projectName);
    } catch (error) {
      return this.sanitizeProjectName('default-project');
    }
  }

  /**
   * Sanitize project name to be safe for filesystem use
   */
  sanitizeProjectName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\-_]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get effective project name (always auto-detected in v3.0.0)
   */
  getEffectiveProjectName(): string {
    return this.autoDetectedProjectName;
  }

  /**
   * Get current project name (alias for getEffectiveProjectName)
   */
  getCurrentProjectName(): string {
    return this.getEffectiveProjectName();
  }

  /**
   * Set active project manually (deprecated in v3.0.0 - always auto-detects)
   */
  setActiveProject(projectName: string): void {
    // No-op in v3.0.0 - always uses auto-detection
    // This method is kept for interface compatibility
  }

  /**
   * Get detailed project information
   */
  getProjectInfo(): ProjectInfo {
    const currentName = this.autoDetectedProjectName;
    const isDefault = currentName === 'default-project';
    const detectionMethod = isDefault ? 'fallback' : 'auto';
    
    return {
      name: currentName,
      sanitizedName: currentName,
      path: process.cwd(),
      isDefault,
      detectionMethod
    };
  }

  /**
   * Refresh auto-detected project name
   */
  refreshDetection(): string {
    return this.detectProjectName();
  }

  /**
   * Get auto-detected name (always the same as current in v3.0.0)
   */
  getAutoDetectedName(): string {
    return this.autoDetectedProjectName;
  }
}
