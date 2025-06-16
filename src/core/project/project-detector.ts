/**
 * Project Detection implementation for Advanced Memory Bank MCP
 */

import path from 'path';
import { IProjectDetector, ProjectInfo } from './project-interfaces.js';
import { ProjectDetectionError, withErrorRecovery, ErrorRecoveryService } from '../errors/index.js';

export class ProjectDetector implements IProjectDetector {
  private activeProject: string | null = null;
  private autoDetectedProjectName: string;
  private errorRecovery: ErrorRecoveryService;

  constructor() {
    this.errorRecovery = new ErrorRecoveryService();
    this.autoDetectedProjectName = this.detectProjectName();
  }

  /**
   * Detect project name automatically from current working directory
   */
  detectProjectName(): string {
    try {
      // Use process.cwd() to get current directory
      const cwd = process.cwd();
      const projectName = path.basename(cwd);
      
      // Validate detected name
      if (!projectName || projectName === '.' || projectName === '/' || projectName === '\\') {
        if (process.env.DEBUG_MEMORY_BANK === 'true') {
          console.warn(`[ProjectDetector] Invalid directory name detected: ${projectName}, using default`);
        }
        return this.sanitizeProjectName('default-project');
      }
      
      const sanitizedName = this.sanitizeProjectName(projectName);
      
      if (process.env.DEBUG_MEMORY_BANK === 'true') {
        console.log(`[ProjectDetector] Auto-detected project: ${projectName} → ${sanitizedName}`);
      }
      
      return sanitizedName;
    } catch (error) {
      if (process.env.DEBUG_MEMORY_BANK === 'true') {
        console.warn(`[ProjectDetector] Error detecting project name:`, error);
      }
      
      return this.sanitizeProjectName('default-project');
    }
  }

  /**
   * Sanitize project name to be safe for filesystem use
   */
  sanitizeProjectName(name: string): string {
    if (!name || typeof name !== 'string') {
      return 'default-project';
    }
    
    // Convert to lowercase and replace invalid characters
    let sanitized = name
      .toLowerCase()
      .trim()
      // Replace spaces and special characters with hyphens
      .replace(/[^a-z0-9\-_]/g, '-')
      // Remove multiple consecutive hyphens
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-|-$/g, '');
    
    // Ensure we have a valid name
    if (!sanitized || sanitized.length === 0) {
      sanitized = 'default-project';
    }
    
    // Limit length to reasonable size
    if (sanitized.length > 50) {
      sanitized = sanitized.substring(0, 50).replace(/-$/, '');
    }
    
    // Ensure it doesn't start with numbers or special characters
    if (!/^[a-z]/.test(sanitized)) {
      sanitized = 'project-' + sanitized;
    }
    
    return sanitized;
  }

  /**
   * Get effective project name (manual override or auto-detected)
   */
  getEffectiveProjectName(): string {
    if (this.activeProject && this.activeProject.trim()) {
      return this.sanitizeProjectName(this.activeProject);
    }
    
    return this.autoDetectedProjectName;
  }

  /**
   * Get current project name (alias for getEffectiveProjectName)
   */
  getCurrentProjectName(): string {
    return this.getEffectiveProjectName();
  }

  /**
   * Set active project manually (overrides auto-detection)
   */
  setActiveProject(projectName: string): void {
    if (projectName && projectName.trim()) {
      this.activeProject = this.sanitizeProjectName(projectName);
      
      if (process.env.DEBUG_MEMORY_BANK === 'true') {
        console.log(`[ProjectDetector] Manual project set: ${projectName} → ${this.activeProject}`);
      }
    } else {
      this.activeProject = null;
      
      if (process.env.DEBUG_MEMORY_BANK === 'true') {
        console.log(`[ProjectDetector] Reset to auto-detected project: ${this.autoDetectedProjectName}`);
      }
    }
  }

  /**
   * Get detailed project information
   */
  getProjectInfo(): ProjectInfo {
    const currentName = this.getCurrentProjectName();
    
    return {
      name: currentName,
      sanitizedName: currentName,
      path: process.cwd(),
      isDefault: currentName === 'default-project',
      detectionMethod: this.activeProject ? 'manual' : 
                      currentName === 'default-project' ? 'fallback' : 'auto'
    };
  }

  /**
   * Refresh auto-detected project name
   */
  refreshDetection(): string {
    try {
      this.autoDetectedProjectName = this.detectProjectName();
      
      // If no manual override is set, this will be the new effective name
      if (!this.activeProject) {
        if (process.env.DEBUG_MEMORY_BANK === 'true') {
          console.log(`[ProjectDetector] Refreshed auto-detection: ${this.autoDetectedProjectName}`);
        }
      }
      
      return this.autoDetectedProjectName;
    } catch (error) {
      // Fallback to current auto-detected name on error
      if (process.env.DEBUG_MEMORY_BANK === 'true') {
        console.warn(`[ProjectDetector] Failed to refresh detection:`, error);
      }
      return this.autoDetectedProjectName;
    }
  }

  /**
   * Clear manual project override
   */
  clearActiveProject(): void {
    this.activeProject = null;
    
    if (process.env.DEBUG_MEMORY_BANK === 'true') {
      console.log(`[ProjectDetector] Cleared manual override, using auto-detected: ${this.autoDetectedProjectName}`);
    }
  }

  /**
   * Check if current project name is manually set
   */
  isManuallySet(): boolean {
    return this.activeProject !== null;
  }

  /**
   * Get auto-detected name (without manual override)
   */
  getAutoDetectedName(): string {
    return this.autoDetectedProjectName;
  }

  /**
   * Get manual override name (if set)
   */
  getManualOverride(): string | null {
    return this.activeProject;
  }

  /**
   * Validate a project name before using it
   */
  validateProjectName(name: string): { isValid: boolean; errors: string[]; sanitized: string } {
    const errors: string[] = [];
    
    if (!name || typeof name !== 'string') {
      errors.push('Project name must be a non-empty string');
    }
    
    if (name && name.length > 100) {
      errors.push('Project name is too long (max 100 characters)');
    }
    
    const sanitized = this.sanitizeProjectName(name);
    
    if (sanitized === 'default-project' && name !== 'default-project') {
      errors.push('Project name contains only invalid characters');
    }
    
    if (sanitized.length < 1) {
      errors.push('Project name results in empty string after sanitization');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * Get project name suggestions based on current directory structure
   */
  getProjectSuggestions(): string[] {
    try {
      const cwd = process.cwd();
      const suggestions: string[] = [];
      
      // Current directory name
      const currentDir = path.basename(cwd);
      if (currentDir && currentDir !== '.' && currentDir !== '/' && currentDir !== '\\') {
        suggestions.push(this.sanitizeProjectName(currentDir));
      }
      
      // Parent directory name (for nested projects)
      const parentDir = path.basename(path.dirname(cwd));
      if (parentDir && parentDir !== currentDir) {
        suggestions.push(this.sanitizeProjectName(parentDir));
      }
      
      // Combination of parent-current
      if (parentDir && currentDir && parentDir !== currentDir) {
        suggestions.push(this.sanitizeProjectName(`${parentDir}-${currentDir}`));
      }
      
      // Remove duplicates and invalid names
      return [...new Set(suggestions)].filter(name => 
        name && name !== 'default-project' && name.length > 0
      );
    } catch {
      return [];
    }
  }
}
