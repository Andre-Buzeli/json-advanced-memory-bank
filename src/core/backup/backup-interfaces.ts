/**
 * Backup management interface definitions
 */

export interface BackupMetadata {
  projectName: string;
  timestamp: string;
  filePath: string;
  fileSize: number;
  checksum?: string;
  isCompressed: boolean;
  version: string;
}

export interface BackupOptions {
  force: boolean;
  compress: boolean;
  includeDatabaseData: boolean;
  customPath?: string;
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  oldestBackup: Date | null;
  newestBackup: Date | null;
  averageSize: number;
}

export interface IBackupManager {
  createBackup(projectName: string, options?: Partial<BackupOptions>): Promise<string>;
  restoreBackup(backupPath: string, projectName?: string): Promise<void>;
  listBackups(projectName?: string): Promise<BackupMetadata[]>;
  deleteBackup(backupPath: string): Promise<void>;
  cleanupOldBackups(projectName: string, maxBackups?: number): Promise<number>;
  validateBackup(backupPath: string): Promise<boolean>;
  getBackupStats(projectName?: string): Promise<BackupStats>;
  canCreateBackup(projectName: string, force?: boolean): boolean;
}

export interface ICleanupService {
  cleanupOldBackups(projectName: string, maxBackups: number): Promise<number>;
  cleanupOrphanedBackups(): Promise<number>;
  cleanupCorruptedBackups(): Promise<number>;
  getCleanupStats(): Promise<{
    orphanedBackups: number;
    corruptedBackups: number;
    oldBackupsRemoved: number;
  }>;
}
