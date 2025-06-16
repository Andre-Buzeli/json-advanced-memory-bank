/**
 * Error recovery strategies and utilities
 */

import { MemoryBankError, ErrorRecoveryOptions } from './custom-errors.js';

export interface RecoveryResult {
  success: boolean;
  message: string;
  data?: any;
  shouldRetry?: boolean;
}

export interface RetryContext {
  attempt: number;
  maxAttempts: number;
  lastError: MemoryBankError;
  delay: number;
}

/**
 * Error recovery service for handling errors gracefully
 */
export class ErrorRecoveryService {
  private retryAttempts: Map<string, number> = new Map();

  /**
   * Attempt to recover from an error using the provided recovery options
   */
  async attemptRecovery(error: MemoryBankError): Promise<RecoveryResult> {
    const { recoveryOptions } = error;
    
    // If retry is possible, track attempts
    if (recoveryOptions.canRetry) {
      const key = this.getRetryKey(error);
      const attempts = this.retryAttempts.get(key) || 0;
      
      if (attempts < (recoveryOptions.maxRetries || 3)) {
        this.retryAttempts.set(key, attempts + 1);
        
        // Apply retry delay if specified
        if (recoveryOptions.retryDelay) {
          await this.delay(recoveryOptions.retryDelay);
        }
        
        return {
          success: false,
          message: `Retry attempt ${attempts + 1}/${recoveryOptions.maxRetries || 3}`,
          shouldRetry: true
        };
      } else {
        // Max retries exceeded
        this.retryAttempts.delete(key);
        return this.handleFallback(error);
      }
    }
    
    // No retry possible, try fallback
    return this.handleFallback(error);
  }

  /**
   * Handle fallback actions when retry is not possible or has failed
   */
  private async handleFallback(error: MemoryBankError): Promise<RecoveryResult> {
    const { recoveryOptions } = error;
    
    switch (recoveryOptions.fallbackAction) {
      case 'create_project':
        return {
          success: false,
          message: 'Project will be created automatically on next write operation',
          data: { action: 'create_project', projectName: error.context.projectName }
        };
        
      case 'use_default_project':
        return {
          success: true,
          message: 'Using default project name',
          data: { action: 'use_default', projectName: 'default-project' }
        };
        
      case 'create_memory':
        return {
          success: false,
          message: 'Memory file will be created on next write operation',
          data: { action: 'create_memory', fileName: error.context.fileName }
        };
        
      case 'create_new_backup':
        return {
          success: false,
          message: 'A new backup will be created',
          data: { action: 'create_backup', projectName: error.context.projectName }
        };
        
      case 'use_default_config':
        return {
          success: true,
          message: 'Using default configuration',
          data: { action: 'default_config' }
        };
        
      default:
        return {
          success: false,
          message: error.recoveryOptions.userMessage || error.message
        };
    }
  }

  /**
   * Reset retry attempts for a specific error context
   */
  public resetRetryAttempts(error: MemoryBankError): void {
    const key = this.getRetryKey(error);
    this.retryAttempts.delete(key);
  }

  /**
   * Clear all retry attempts
   */
  public clearAllRetryAttempts(): void {
    this.retryAttempts.clear();
  }

  /**
   * Get retry statistics
   */
  public getRetryStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    this.retryAttempts.forEach((attempts, key) => {
      stats[key] = attempts;
    });
    return stats;
  }

  /**
   * Generate a unique key for tracking retry attempts
   */
  private getRetryKey(error: MemoryBankError): string {
    const { code, context } = error;
    const keyParts = [code];
    
    if (context.projectName) keyParts.push(context.projectName);
    if (context.fileName) keyParts.push(context.fileName);
    if (context.operation) keyParts.push(context.operation);
    
    return keyParts.join(':');
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a human-readable error report
   */
  public generateErrorReport(error: MemoryBankError): string {
    const { name, message, code, severity, context, recoveryOptions } = error;
    
    let report = `## Error Report\n\n`;
    report += `**Type:** ${name}\n`;
    report += `**Code:** ${code}\n`;
    report += `**Severity:** ${severity}\n`;
    report += `**Message:** ${message}\n\n`;
    
    if (context.operation) {
      report += `**Operation:** ${context.operation}\n`;
    }
    if (context.projectName) {
      report += `**Project:** ${context.projectName}\n`;
    }
    if (context.fileName) {
      report += `**File:** ${context.fileName}\n`;
    }
    report += `**Timestamp:** ${context.timestamp}\n\n`;
    
    if (recoveryOptions.userMessage) {
      report += `**Recovery Information:**\n${recoveryOptions.userMessage}\n\n`;
    }
    
    if (recoveryOptions.canRetry) {
      report += `**Retry Available:** Yes (max ${recoveryOptions.maxRetries || 3} attempts)\n`;
    } else {
      report += `**Retry Available:** No\n`;
    }
    
    if (recoveryOptions.fallbackAction) {
      report += `**Fallback Action:** ${recoveryOptions.fallbackAction}\n`;
    }
    
    if (context.details) {
      report += `\n**Additional Details:**\n`;
      report += JSON.stringify(context.details, null, 2);
    }
    
    return report;
  }

  /**
   * Log error with appropriate level based on severity
   */
  public logError(error: MemoryBankError, logger?: Console): void {
    const log = logger || console;
    const report = this.generateErrorReport(error);
    
    switch (error.severity) {
      case 'critical':
        log.error('🚨 CRITICAL ERROR:', report);
        break;
      case 'high':
        log.error('🔴 HIGH SEVERITY:', report);
        break;
      case 'medium':
        log.warn('🟡 MEDIUM SEVERITY:', report);
        break;
      case 'low':
        log.info('🟢 LOW SEVERITY:', report);
        break;
    }
  }
}

/**
 * Utility function to wrap async operations with error recovery
 */
export async function withErrorRecovery<T>(
  operation: () => Promise<T>,
  errorContext: Partial<import('./custom-errors.js').ErrorContext>,
  recoveryService: ErrorRecoveryService,
  maxRetries: number = 3
): Promise<T> {
  let lastError: MemoryBankError | null = null;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof MemoryBankError) {
        lastError = error;
        
        // Add attempt info to context
        error.context.details = {
          ...error.context.details,
          attempt,
          maxRetries: maxRetries + 1
        };
        
        if (attempt <= maxRetries) {
          const recovery = await recoveryService.attemptRecovery(error);
          if (recovery.shouldRetry) {
            continue;
          }
        }
        
        throw error;
      } else {
        // Wrap non-MemoryBankError in generic error
        const wrappedError = new MemoryBankError(
          error instanceof Error ? error.message : 'Unknown error',
          'UNKNOWN_ERROR',
          errorContext,
          { canRetry: attempt <= maxRetries, maxRetries },
          'medium'
        );
        lastError = wrappedError;
        
        if (attempt <= maxRetries) {
          continue;
        }
        
        throw wrappedError;
      }
    }
  }
  
  throw lastError;
}
