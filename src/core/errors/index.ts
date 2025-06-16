/**
 * Error handling module exports
 */

// Custom error classes
export {
  MemoryBankError,
  ProjectError,
  ProjectNotFoundError,
  ProjectDetectionError,
  MemoryOperationError,
  MemoryNotFoundError,
  MemoryValidationError,
  BackupError,
  BackupFailedError,
  BackupCorruptedError,
  StorageError,
  FileSystemError,
  ConfigurationError,
  type ErrorContext,
  type ErrorRecoveryOptions
} from './custom-errors.js';

// Error recovery service
export {
  ErrorRecoveryService,
  withErrorRecovery,
  type RecoveryResult,
  type RetryContext
} from './error-recovery.js';
