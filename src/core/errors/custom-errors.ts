/**
 * Custom error types for Advanced Memory Bank MCP
 */

export interface ErrorContext {
  operation: string;
  projectName?: string;
  fileName?: string;
  sourceFile?: string;
  backupPath?: string;
  cooldownMs?: number;
  maxBackups?: number;
  error?: string;
  details?: Record<string, any>;
  timestamp: string;
  stackTrace?: string;
}

export interface ErrorRecoveryOptions {
  canRetry: boolean;
  maxRetries?: number;
  retryDelay?: number;
  fallbackAction?: string;
  userMessage?: string;
}

/**
 * Base error class for all Memory Bank errors
 */
export class MemoryBankError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly recoveryOptions: ErrorRecoveryOptions;
  public severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext> = {},
    recoveryOptions: Partial<ErrorRecoveryOptions> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    
    this.context = {
      operation: 'unknown',
      timestamp: new Date().toISOString(),
      stackTrace: this.stack,
      ...context
    };
    
    this.recoveryOptions = {
      canRetry: false,
      userMessage: this.generateUserMessage(),
      ...recoveryOptions
    };
  }

  private generateUserMessage(): string {
    const suggestions = this.getSuggestions();
    return suggestions.length > 0 
      ? `${this.message}\n\nSuggestions:\n${suggestions.map(s => `• ${s}`).join('\n')}`
      : this.message;
  }

  protected getSuggestions(): string[] {
    return [];
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      recoveryOptions: this.recoveryOptions
    };
  }
}

/**
 * Project-related errors
 */
export class ProjectError extends MemoryBankError {
  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext> = {},
    recoveryOptions: Partial<ErrorRecoveryOptions> = {}
  ) {
    super(message, code, context, recoveryOptions, 'medium');
  }
}

export class ProjectNotFoundError extends ProjectError {
  constructor(projectName: string, context: Partial<ErrorContext> = {}) {
    super(
      `Project "${projectName}" not found`,
      'PROJECT_NOT_FOUND',
      { ...context, projectName, operation: 'project_access' },
      { 
        canRetry: false,
        fallbackAction: 'create_project',
        userMessage: `Project "${projectName}" does not exist. Would you like to create it?`
      }
    );
  }

  protected getSuggestions(): string[] {
    return [
      `Create the project first using memory_bank_write`,
      `Check if the project name is spelled correctly`,
      `List available projects using list_projects`
    ];
  }
}

export class ProjectDetectionError extends ProjectError {
  constructor(reason: string, context: Partial<ErrorContext> = {}) {
    super(
      `Failed to detect project name: ${reason}`,
      'PROJECT_DETECTION_FAILED',
      { ...context, operation: 'project_detection' },
      { 
        canRetry: true,
        maxRetries: 3,
        fallbackAction: 'use_default_project'
      }
    );
  }

  protected getSuggestions(): string[] {
    return [
      `Ensure you're running from a valid project directory`,
      `Set a manual project name using setActiveProject()`,
      `Check directory permissions`
    ];
  }
}

/**
 * Memory operation errors
 */
export class MemoryOperationError extends MemoryBankError {
  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext> = {},
    recoveryOptions: Partial<ErrorRecoveryOptions> = {}
  ) {
    super(message, code, context, recoveryOptions, 'medium');
  }
}

export class MemoryNotFoundError extends MemoryOperationError {
  constructor(fileName: string, projectName: string, context: Partial<ErrorContext> = {}) {
    super(
      `Memory "${fileName}" not found in project "${projectName}"`,
      'MEMORY_NOT_FOUND',
      { ...context, fileName, projectName, operation: 'memory_read' },
      { 
        canRetry: false,
        fallbackAction: 'create_memory'
      }
    );
  }

  protected getSuggestions(): string[] {
    return [
      `Check if the memory file name is correct`,
      `List available memories using list_project_files`,
      `Create the memory using memory_bank_write`
    ];
  }
}

export class MemoryValidationError extends MemoryOperationError {
  constructor(fileName: string, reason: string, context: Partial<ErrorContext> = {}) {
    super(
      `Memory "${fileName}" validation failed: ${reason}`,
      'MEMORY_VALIDATION_FAILED',
      { ...context, fileName, operation: 'memory_validation' },
      { 
        canRetry: false,
        fallbackAction: 'fix_validation'
      }
    );
  }

  protected getSuggestions(): string[] {
    return [
      `Check the content format and encoding`,
      `Ensure the content is valid UTF-8`,
      `Remove any special characters that might cause issues`
    ];
  }
}

/**
 * Backup operation errors
 */
export class BackupError extends MemoryBankError {
  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext> = {},
    recoveryOptions: Partial<ErrorRecoveryOptions> = {}
  ) {
    super(message, code, context, recoveryOptions, 'high');
  }
}

export class BackupFailedError extends BackupError {
  constructor(projectName: string, reason: string, context: Partial<ErrorContext> = {}) {
    super(
      `Backup failed for project "${projectName}": ${reason}`,
      'BACKUP_FAILED',
      { ...context, projectName, operation: 'backup_create' },
      { 
        canRetry: true,
        maxRetries: 3,
        retryDelay: 5000
      }
    );
  }

  protected getSuggestions(): string[] {
    return [
      `Check disk space availability`,
      `Verify backup directory permissions`,
      `Ensure the project exists and is accessible`,
      `Try manual backup with force option`
    ];
  }
}

export class BackupCorruptedError extends BackupError {
  constructor(backupPath: string, context: Partial<ErrorContext> = {}) {
    super(
      `Backup file corrupted: ${backupPath}`,
      'BACKUP_CORRUPTED',
      { ...context, operation: 'backup_validation' },
      { 
        canRetry: false,
        fallbackAction: 'create_new_backup'
      }
    );
    this.severity = 'critical';
  }

  protected getSuggestions(): string[] {
    return [
      `Try restoring from a different backup`,
      `Check file system integrity`,
      `Create a new backup if source data is available`
    ];
  }
}

/**
 * Storage operation errors
 */
export class StorageError extends MemoryBankError {
  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext> = {},
    recoveryOptions: Partial<ErrorRecoveryOptions> = {}
  ) {
    super(message, code, context, recoveryOptions, 'high');
  }
}

export class FileSystemError extends StorageError {
  constructor(operation: string, path: string, systemError: Error, context: Partial<ErrorContext> = {}) {
    super(
      `File system error during ${operation}: ${systemError.message}`,
      'FILESYSTEM_ERROR',
      { ...context, operation, details: { path, systemError: systemError.message } },
      { 
        canRetry: true,
        maxRetries: 2,
        retryDelay: 1000
      }
    );
  }

  protected getSuggestions(): string[] {
    return [
      `Check file/directory permissions`,
      `Verify disk space availability`,
      `Ensure the path is accessible`,
      `Try running with elevated permissions if necessary`
    ];
  }
}

export class ConfigurationError extends MemoryBankError {
  constructor(setting: string, reason: string, context: Partial<ErrorContext> = {}) {
    super(
      `Configuration error for "${setting}": ${reason}`,
      'CONFIGURATION_ERROR',
      { ...context, operation: 'configuration', details: { setting } },
      { 
        canRetry: false,
        fallbackAction: 'use_default_config'
      },
      'medium'
    );
  }

  protected getSuggestions(): string[] {
    return [
      `Check your environment variables`,
      `Verify configuration file syntax`,
      `Reset to default configuration`,
      `Consult documentation for valid values`
    ];
  }
}
