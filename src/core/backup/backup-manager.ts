/**
 * Backup Manager implementation for Advanced Memory Bank MCP
 * Handles all backup operations with cooldown, cleanup, and validation
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { 
  IBackupManager, 
  BackupMetadata, 
  BackupOptions, 
  BackupStats,
  ICleanupService 
} from './backup-interfaces.js';
import { MemoryBankError, BackupError } from '../errors/custom-errors.js';

export class BackupManager implements IBackupManager {
  private backupRoot: string;
  private lastBackupTimes: Map<string, number> = new Map();
  private cooldownMs: number = 2 * 60 * 1000; // 2 minutes

  constructor(backupRoot: string, cooldownMs?: number) {
    this.backupRoot = backupRoot;
    if (cooldownMs) this.cooldownMs = cooldownMs;
    
    // Ensure backup directory exists
    fs.ensureDirSync(this.backupRoot);
  }

  /**
   * Check if backup can be created (respects cooldown)
   */
  canCreateBackup(projectName: string, force = false): boolean {
    if (force) return true;
    
    const lastBackupTime = this.lastBackupTimes.get(projectName);
    if (!lastBackupTime) return true;
    
    return Date.now() - lastBackupTime >= this.cooldownMs;
  }

  /**
   * Create backup for a project
   */
  async createBackup(projectName: string, options: Partial<BackupOptions> = {}): Promise<string> {
    const opts: BackupOptions = {
      force: false,
      compress: false,
      includeDatabaseData: false,
      ...options
    };

    // Check cooldown unless forced
    if (!this.canCreateBackup(projectName, opts.force)) {
      throw new BackupError(
        `Backup cooldown active for project ${projectName}`,
        'COOLDOWN_ACTIVE',
        { 
          operation: 'createBackup',
          projectName, 
          cooldownMs: this.cooldownMs,
          timestamp: new Date().toISOString()
        }
      );
    }

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFileName = `${projectName}_${timestamp}.json`;
    
    // Use custom path or default backup location
    const projectBackupDir = opts.customPath || path.join(this.backupRoot, projectName);
    fs.ensureDirSync(projectBackupDir);
    
    const backupPath = path.join(projectBackupDir, backupFileName);
    
    try {
      // Source file path
      const sourceFile = path.join(process.env.MEMORY_BANK_ROOT || './memory-banks', `${projectName}.json`);
      
      if (!await fs.pathExists(sourceFile)) {
        throw new BackupError(
          `Source file not found: ${sourceFile}`,
          'SOURCE_NOT_FOUND',
          { 
            operation: 'createBackup',
            sourceFile, 
            projectName,
            timestamp: new Date().toISOString()
          }
        );
      }

      // Copy file to backup location
      await fs.copy(sourceFile, backupPath);
      
      // Update last backup time
      this.lastBackupTimes.set(projectName, Date.now());
      
      // Cleanup old backups automatically
      await this.cleanupOldBackups(projectName, 25);
      
      return backupPath;
    } catch (error) {
      throw new BackupError(
        `Failed to create backup for ${projectName}: ${error}`,
        'BACKUP_FAILED',
        { 
          operation: 'createBackup',
          projectName, 
          backupPath, 
          error: error.message,
          timestamp: new Date().toISOString()
        }
      );
    }
  }

  /**
   * Restore backup to active memory
   */
  async restoreBackup(backupPath: string, projectName?: string): Promise<void> {
    try {
      if (!await fs.pathExists(backupPath)) {
        throw new BackupError(
          `Backup file not found: ${backupPath}`,
          'BACKUP_NOT_FOUND',
          { backupPath }
        );
      }

      // Validate backup integrity
      const isValid = await this.validateBackup(backupPath);
      if (!isValid) {
        throw new BackupError(
          `Backup file is corrupted: ${backupPath}`,
          'BACKUP_CORRUPTED',
          { backupPath }
        );
      }

      // Determine project name
      const detectedProjectName = projectName || this.extractProjectNameFromPath(backupPath);
      const targetFile = path.join(process.env.MEMORY_BANK_ROOT || './memory-banks', `${detectedProjectName}.json`);
      
      // Copy backup to active location
      await fs.copy(backupPath, targetFile);
    } catch (error) {
      throw new BackupError(
        `Failed to restore backup: ${error}`,
        'RESTORE_FAILED',
        { backupPath, projectName, error: error.message }
      );
    }
  }

  /**
   * List all backups for a project or all projects
   */
  async listBackups(projectName?: string): Promise<BackupMetadata[]> {
    const backups: BackupMetadata[] = [];
    
    try {
      if (projectName) {
        // List backups for specific project
        const projectBackupDir = path.join(this.backupRoot, projectName);
        if (await fs.pathExists(projectBackupDir)) {
          const files = await fs.readdir(projectBackupDir);
          for (const file of files) {
            if (file.endsWith('.json')) {
              const metadata = await this.getBackupMetadata(path.join(projectBackupDir, file));
              backups.push(metadata);
            }
          }
        }
      } else {
        // List all backups
        const projectDirs = await fs.readdir(this.backupRoot);
        for (const dir of projectDirs) {
          const projectBackupDir = path.join(this.backupRoot, dir);
          const stat = await fs.lstat(projectBackupDir);
          if (stat.isDirectory()) {
            const projectBackups = await this.listBackups(dir);
            backups.push(...projectBackups);
          }
        }
      }
      
      // Sort by timestamp (newest first)
      return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch (error) {
      throw new BackupError(
        `Failed to list backups: ${error}`,
        'LIST_FAILED',
        { projectName, error: error.message }
      );
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupPath: string): Promise<void> {
    try {
      if (!await fs.pathExists(backupPath)) {
        throw new BackupError(
          `Backup file not found: ${backupPath}`,
          'BACKUP_NOT_FOUND',
          { backupPath }
        );
      }
      
      await fs.remove(backupPath);
    } catch (error) {
      throw new BackupError(
        `Failed to delete backup: ${error}`,
        'DELETE_FAILED',
        { backupPath, error: error.message }
      );
    }
  }

  /**
   * Cleanup old backups, keeping only the most recent
   */
  async cleanupOldBackups(projectName: string, maxBackups = 25): Promise<number> {
    try {
      const backups = await this.listBackups(projectName);
      
      if (backups.length <= maxBackups) {
        return 0; // No cleanup needed
      }
      
      // Sort by timestamp and keep only the most recent
      const sortedBackups = backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      const backupsToDelete = sortedBackups.slice(maxBackups);
      
      let deletedCount = 0;
      for (const backup of backupsToDelete) {
        try {
          await this.deleteBackup(backup.filePath);
          deletedCount++;
        } catch (error) {
          // Continue deleting other backups even if one fails
          process.stderr.write(`[BackupManager] Failed to delete backup ${backup.filePath}: ${error}\n`);
        }
      }
      
      return deletedCount;
    } catch (error) {
      throw new BackupError(
        `Failed to cleanup old backups: ${error}`,
        'CLEANUP_FAILED',
        { projectName, maxBackups, error: error.message }
      );
    }
  }

  /**
   * Validate backup file integrity
   */
  async validateBackup(backupPath: string): Promise<boolean> {
    try {
      if (!await fs.pathExists(backupPath)) {
        return false;
      }
      
      // Check if file is valid JSON
      const content = await fs.readFile(backupPath, 'utf-8');
      JSON.parse(content);
      
      // Additional validation: check if it's a valid memory bank structure
      const data = JSON.parse(content);
      return typeof data === 'object' && data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(projectName?: string): Promise<BackupStats> {
    const backups = await this.listBackups(projectName);
    
    if (backups.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
        averageSize: 0
      };
    }
    
    const totalSize = backups.reduce((sum, backup) => sum + backup.fileSize, 0);
    const timestamps = backups.map(b => new Date(b.timestamp)).sort();
    
    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup: timestamps[0],
      newestBackup: timestamps[timestamps.length - 1],
      averageSize: Math.round(totalSize / backups.length)
    };
  }

  /**
   * Get metadata for a specific backup file
   */
  private async getBackupMetadata(filePath: string): Promise<BackupMetadata> {
    const stat = await fs.lstat(filePath);
    const fileName = path.basename(filePath);
    const projectName = this.extractProjectNameFromPath(filePath);
    
    // Extract timestamp from filename
    const timestampMatch = fileName.match(/_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
    const timestamp = timestampMatch ? timestampMatch[1].replace('_', 'T') + 'Z' : stat.birthtime.toISOString();
    
    return {
      projectName,
      timestamp,
      filePath,
      fileSize: stat.size,
      isCompressed: fileName.endsWith('.gz'),
      version: '1.0.0'
    };
  }

  /**
   * Extract project name from backup file path
   */
  private extractProjectNameFromPath(backupPath: string): string {
    const fileName = path.basename(backupPath, '.json');
    const parts = fileName.split('_');
    
    // Remove timestamp part (last part should be timestamp)
    if (parts.length > 1) {
      parts.pop();
      return parts.join('_');
    }
    
    return fileName;
  }
}

/**
 * Cleanup service for backup maintenance
 */
export class CleanupService implements ICleanupService {
  private backupManager: BackupManager;

  constructor(backupManager: BackupManager) {
    this.backupManager = backupManager;
  }

  async cleanupOldBackups(projectName: string, maxBackups: number): Promise<number> {
    return this.backupManager.cleanupOldBackups(projectName, maxBackups);
  }

  async cleanupOrphanedBackups(): Promise<number> {
    // Implementation for cleaning up backups without corresponding project files
    let cleanedCount = 0;
    try {
      const allBackups = await this.backupManager.listBackups();
      const memoryBankRoot = process.env.MEMORY_BANK_ROOT || './memory-banks';
      
      for (const backup of allBackups) {
        const projectFile = path.join(memoryBankRoot, `${backup.projectName}.json`);
        if (!await fs.pathExists(projectFile)) {
          await this.backupManager.deleteBackup(backup.filePath);
          cleanedCount++;
        }
      }
    } catch (error) {
      throw new BackupError(
        `Failed to cleanup orphaned backups: ${error}`,
        'CLEANUP_ORPHANED_FAILED',
        { error: error.message }
      );
    }
    
    return cleanedCount;
  }

  async cleanupCorruptedBackups(): Promise<number> {
    let cleanedCount = 0;
    try {
      const allBackups = await this.backupManager.listBackups();
      
      for (const backup of allBackups) {
        const isValid = await this.backupManager.validateBackup(backup.filePath);
        if (!isValid) {
          await this.backupManager.deleteBackup(backup.filePath);
          cleanedCount++;
        }
      }
    } catch (error) {
      throw new BackupError(
        `Failed to cleanup corrupted backups: ${error}`,
        'CLEANUP_CORRUPTED_FAILED',
        { error: error.message }
      );
    }
    
    return cleanedCount;
  }

  async getCleanupStats(): Promise<{
    orphanedBackups: number;
    corruptedBackups: number;
    oldBackupsRemoved: number;
  }> {
    const allBackups = await this.backupManager.listBackups();
    const memoryBankRoot = process.env.MEMORY_BANK_ROOT || './memory-banks';
    
    let orphanedBackups = 0;
    let corruptedBackups = 0;
    
    for (const backup of allBackups) {
      // Check for orphaned backups
      const projectFile = path.join(memoryBankRoot, `${backup.projectName}.json`);
      if (!await fs.pathExists(projectFile)) {
        orphanedBackups++;
      }
      
      // Check for corrupted backups
      const isValid = await this.backupManager.validateBackup(backup.filePath);
      if (!isValid) {
        corruptedBackups++;
      }
    }
    
    return {
      orphanedBackups,
      corruptedBackups,
      oldBackupsRemoved: 0 // Would be set by actual cleanup operation
    };
  }
}
