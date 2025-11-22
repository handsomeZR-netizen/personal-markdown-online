/**
 * 离线功能错误码枚举
 */
export enum OfflineErrorCode {
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  INDEXEDDB_NOT_SUPPORTED = 'INDEXEDDB_NOT_SUPPORTED',
  SYNC_FAILED = 'SYNC_FAILED',
  SYNC_IN_PROGRESS = 'SYNC_IN_PROGRESS',
  CONFLICT_DETECTED = 'CONFLICT_DETECTED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INVALID_OPERATION = 'INVALID_OPERATION',
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  STORAGE_ERROR = 'STORAGE_ERROR',
  OFFLINE_MODE_DISABLED = 'OFFLINE_MODE_DISABLED',
}

/**
 * 离线功能错误类
 */
export class OfflineError extends Error {
  public readonly code: OfflineErrorCode;
  public readonly timestamp: number;
  public readonly details?: unknown;

  constructor(message: string, code: OfflineErrorCode, details?: unknown) {
    super(message);
    this.name = 'OfflineError';
    this.code = code;
    this.timestamp = Date.now();
    this.details = details;

    // 维护正确的原型链
    Object.setPrototypeOf(this, OfflineError.prototype);
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserFriendlyMessage(): string {
    return ERROR_MESSAGES[this.code] || this.message;
  }

  /**
   * 记录错误到控制台
   */
  log(): void {
    console.error('[OfflineError]', {
      code: this.code,
      message: this.message,
      timestamp: new Date(this.timestamp).toISOString(),
      details: this.details,
    });
  }

  /**
   * 转换为 JSON 格式
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.getUserFriendlyMessage(),
      timestamp: this.timestamp,
      details: this.details,
    };
  }
}

/**
 * 用户友好的错误消息映射
 */
export const ERROR_MESSAGES: Record<OfflineErrorCode, string> = {
  [OfflineErrorCode.STORAGE_QUOTA_EXCEEDED]:
    '存储空间不足，请清理缓存或删除不需要的笔记',
  [OfflineErrorCode.INDEXEDDB_NOT_SUPPORTED]:
    '您的浏览器不支持离线功能，请使用现代浏览器',
  [OfflineErrorCode.SYNC_FAILED]:
    '同步失败，请检查网络连接后重试',
  [OfflineErrorCode.SYNC_IN_PROGRESS]:
    '同步正在进行中，请稍候',
  [OfflineErrorCode.CONFLICT_DETECTED]:
    '检测到数据冲突，请选择保留哪个版本',
  [OfflineErrorCode.NETWORK_ERROR]:
    '网络连接失败，已切换到离线模式',
  [OfflineErrorCode.DATABASE_ERROR]:
    '数据库操作失败，请稍后重试',
  [OfflineErrorCode.INVALID_OPERATION]:
    '无效的操作，请检查输入参数',
  [OfflineErrorCode.DATA_NOT_FOUND]:
    '未找到请求的数据',
  [OfflineErrorCode.STORAGE_ERROR]:
    '存储管理操作失败，请稍后重试',
  [OfflineErrorCode.OFFLINE_MODE_DISABLED]:
    '离线模式已禁用，请在设置中启用离线功能',
};

/**
 * 错误日志记录器
 */
export class ErrorLogger {
  private static logs: Array<{
    error: OfflineError;
    context?: string;
  }> = [];

  private static readonly MAX_LOGS = 100;

  /**
   * 记录错误
   */
  static log(error: OfflineError, context?: string): void {
    error.log();

    this.logs.push({ error, context });

    // 限制日志数量
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }
  }

  /**
   * 获取所有错误日志
   */
  static getLogs() {
    return [...this.logs];
  }

  /**
   * 清除所有日志
   */
  static clear(): void {
    this.logs = [];
  }

  /**
   * 获取最近的错误
   */
  static getRecent(count: number = 10) {
    return this.logs.slice(-count);
  }

  /**
   * 按错误码过滤日志
   */
  static filterByCode(code: OfflineErrorCode) {
    return this.logs.filter(log => log.error.code === code);
  }
}

/**
 * 创建 OfflineError 的辅助函数
 */
export function createOfflineError(
  code: OfflineErrorCode,
  message?: string,
  details?: unknown
): OfflineError {
  const errorMessage = message || ERROR_MESSAGES[code];
  return new OfflineError(errorMessage, code, details);
}

/**
 * 检查是否为 OfflineError
 */
export function isOfflineError(error: unknown): error is OfflineError {
  return error instanceof OfflineError;
}
