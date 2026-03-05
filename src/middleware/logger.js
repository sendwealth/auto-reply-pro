/**
 * 日志工具 - 支持脱敏和分级日志
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(config = {}) {
    this.config = {
      level: config.level || process.env.LOG_LEVEL || 'info',
      logFile: config.logFile || process.env.LOG_FILE,
      enableConsole: config.enableConsole !== false,
      sensitiveFields: config.sensitiveFields || [
        'password',
        'token',
        'apiKey',
        'secret',
        'authorization',
        'creditCard',
        'ssn'
      ],
      maskChar: config.maskChar || '******',
      ...config
    };

    // 日志级别
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    // 日志文件
    if (this.config.logFile) {
      this.logStream = fs.createWriteStream(this.config.logFile, { flags: 'a' });
    }
  }

  /**
   * 脱敏数据
   */
  mask(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const masked = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // 检查是否是敏感字段
      const isSensitive = this.config.sensitiveFields.some(field =>
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        masked[key] = this.config.maskChar;
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.mask(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * 格式化日志
   */
  format(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const maskedData = data ? this.mask(data) : null;

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(maskedData && { data: maskedData })
    };

    return JSON.stringify(logEntry);
  }

  /**
   * 写入日志
   */
  write(level, message, data = null) {
    // 检查日志级别
    if (this.levels[level] > this.levels[this.config.level]) {
      return;
    }

    const formattedLog = this.format(level, message, data);

    // 控制台输出
    if (this.config.enableConsole) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](formattedLog);
    }

    // 文件输出
    if (this.logStream) {
      this.logStream.write(formattedLog + '\n');
    }
  }

  /**
   * 日志方法
   */
  error(message, data = null) {
    this.write('error', message, data);
  }

  warn(message, data = null) {
    this.write('warn', message, data);
  }

  info(message, data = null) {
    this.write('info', message, data);
  }

  debug(message, data = null) {
    this.write('debug', message, data);
  }

  /**
   * HTTP 请求日志
   */
  logRequest(req, res, next) {
    const startTime = Date.now();

    // 请求开始
    this.info('Request started', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // 响应结束
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      this.info('Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    });

    next();
  }

  /**
   * 错误日志
   */
  logError(error, req = null) {
    this.error('Error occurred', {
      message: error.message,
      stack: error.stack,
      ...(req && {
        method: req.method,
        url: req.url,
        body: this.mask(req.body)
      })
    });
  }

  /**
   * 关闭日志流
   */
  close() {
    if (this.logStream) {
      this.logStream.end();
    }
  }
}

// 单例模式
let instance = null;

function getLogger(config) {
  if (!instance) {
    instance = new Logger(config);
  }
  return instance;
}

module.exports = {
  Logger,
  getLogger
};
