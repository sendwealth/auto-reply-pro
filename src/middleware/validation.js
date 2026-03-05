/**
 * 输入验证和清理中间件
 * 防止 XSS、注入等攻击
 */

class ValidationMiddleware {
  constructor() {
    // 危险字符模式
    this.patterns = {
      xss: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      htmlTags: /<[^>]*>/g,
      javascript: /javascript:/gi,
      eventHandlers: /on\w+\s*=/gi,
      sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|DECLARE)\b)/gi,
      pathTraversal: /(\.\.\/|\.\.\\)/g
    };
  }

  /**
   * 清理字符串输入
   */
  sanitizeString(input) {
    if (typeof input !== 'string') {
      return input;
    }

    let sanitized = input;

    // HTML 实体编码
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    // 移除危险的 JavaScript
    sanitized = sanitized.replace(this.patterns.javascript, '');

    // 移除事件处理器
    sanitized = sanitized.replace(this.patterns.eventHandlers, '');

    return sanitized;
  }

  /**
   * 深度清理对象
   */
  sanitizeObject(obj) {
    if (obj === null || typeof obj !== 'object') {
      return typeof obj === 'string' ? this.sanitizeString(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key);
      sanitized[sanitizedKey] = this.sanitizeObject(value);
    }

    return sanitized;
  }

  /**
   * 验证输入
   */
  validate(input, rules = {}) {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = input[field];

      // 必填检查
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      // 类型检查
      if (value !== undefined && rule.type) {
        if (rule.type === 'string' && typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        } else if (rule.type === 'number' && typeof value !== 'number') {
          errors.push(`${field} must be a number`);
        } else if (rule.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`${field} must be a boolean`);
        } else if (rule.type === 'array' && !Array.isArray(value)) {
          errors.push(`${field} must be an array`);
        } else if (rule.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
          errors.push(`${field} must be an object`);
        }
      }

      // 长度检查
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${field} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${field} must be at most ${rule.maxLength} characters`);
        }
      }

      // 范围检查
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${field} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${field} must be at most ${rule.max}`);
        }
      }

      // 正则检查
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }

      // 自定义验证
      if (rule.custom && typeof rule.custom === 'function') {
        const result = rule.custom(value);
        if (result !== true) {
          errors.push(result);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 检测危险内容
   */
  detectThreats(input) {
    const threats = [];
    const str = typeof input === 'string' ? input : JSON.stringify(input);

    // XSS 检测
    if (this.patterns.xss.test(str)) {
      threats.push({ type: 'XSS', severity: 'HIGH', description: 'Script injection detected' });
    }

    // SQL 注入检测
    if (this.patterns.sqlInjection.test(str)) {
      threats.push({ type: 'SQL_INJECTION', severity: 'HIGH', description: 'SQL keywords detected' });
    }

    // 路径遍历检测
    if (this.patterns.pathTraversal.test(str)) {
      threats.push({ type: 'PATH_TRAVERSAL', severity: 'MEDIUM', description: 'Path traversal attempt detected' });
    }

    return {
      safe: threats.length === 0,
      threats
    };
  }

  /**
   * Express 中间件 - 清理请求体
   */
  sanitizeMiddleware() {
    return (req, res, next) => {
      // 清理 body
      if (req.body) {
        req.body = this.sanitizeObject(req.body);
      }

      // 清理 query
      if (req.query) {
        req.query = this.sanitizeObject(req.query);
      }

      // 清理 params
      if (req.params) {
        req.params = this.sanitizeObject(req.params);
      }

      next();
    };
  }

  /**
   * Express 中间件 - 威胁检测
   */
  threatDetectionMiddleware() {
    return (req, res, next) => {
      const input = JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params
      });

      const result = this.detectThreats(input);

      if (!result.safe) {
        return res.status(400).json({
          success: false,
          error: 'Security threat detected',
          threats: result.threats
        });
      }

      next();
    };
  }

  /**
   * 验证中间件
   */
  validateMiddleware(rules) {
    return (req, res, next) => {
      const result = this.validate(req.body, rules);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: result.errors
        });
      }

      next();
    };
  }
}

// 单例模式
let instance = null;

function getValidationMiddleware() {
  if (!instance) {
    instance = new ValidationMiddleware();
  }
  return instance;
}

module.exports = {
  ValidationMiddleware,
  getValidationMiddleware
};
