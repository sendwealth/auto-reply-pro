/**
 * API 鉴权中间件
 * 支持 API Key 和 JWT 两种鉴权方式
 */

const crypto = require('crypto');

class AuthMiddleware {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.API_KEY,
      jwtSecret: config.jwtSecret || process.env.JWT_SECRET,
      enabled: config.enabled !== false, // 默认启用
      excludePaths: config.excludePaths || ['/health', '/api/health'],
      ...config
    };

    // API Key 黑名单（可选）
    this.blacklistedKeys = new Set();
  }

  /**
   * Express 中间件
   */
  middleware() {
    return (req, res, next) => {
      // 检查是否在排除列表中
      if (this.config.excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // 如果未启用，直接通过
      if (!this.config.enabled) {
        return next();
      }

      // 尝试 API Key 鉴权
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      if (apiKey && this.validateApiKey(apiKey)) {
        req.auth = { type: 'apiKey', key: apiKey };
        return next();
      }

      // 尝试 JWT 鉴权
      const token = this.extractToken(req);
      if (token) {
        try {
          const decoded = this.validateJWT(token);
          req.auth = { type: 'jwt', user: decoded };
          return next();
        } catch (error) {
          return res.status(401).json({
            success: false,
            error: 'Invalid token',
            message: error.message
          });
        }
      }

      // 鉴权失败
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'API key or JWT token required'
      });
    };
  }

  /**
   * 验证 API Key
   */
  validateApiKey(apiKey) {
    if (!apiKey || !this.config.apiKey) {
      return false;
    }

    // 检查黑名单
    if (this.blacklistedKeys.has(apiKey)) {
      return false;
    }

    // 使用时间安全比较
    return crypto.timingSafeEqual(
      Buffer.from(apiKey),
      Buffer.from(this.config.apiKey)
    );
  }

  /**
   * 提取 JWT Token
   */
  extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return req.query.token || req.headers['x-access-token'];
  }

  /**
   * 验证 JWT（简化版，生产环境建议使用 jsonwebtoken 库）
   */
  validateJWT(token) {
    if (!this.config.jwtSecret) {
      throw new Error('JWT secret not configured');
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const [headerB64, payloadB64, signatureB64] = parts;
      
      // 验证签名
      const expectedSignature = crypto
        .createHmac('sha256', this.config.jwtSecret)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');

      if (signatureB64 !== expectedSignature) {
        throw new Error('Invalid signature');
      }

      // 解码 payload
      const payload = JSON.parse(
        Buffer.from(payloadB64, 'base64').toString('utf-8')
      );

      // 检查过期时间
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      throw new Error(`JWT validation failed: ${error.message}`);
    }
  }

  /**
   * 生成 API Key
   */
  generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 生成 JWT Token
   */
  generateJWT(payload, expiresIn = 3600) {
    if (!this.config.jwtSecret) {
      throw new Error('JWT secret not configured');
    }

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    };

    const headerB64 = Buffer.from(JSON.stringify(header))
      .toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(tokenPayload))
      .toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.config.jwtSecret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    return `${headerB64}.${payloadB64}.${signature}`;
  }

  /**
   * 添加到黑名单
   */
  blacklist(apiKey) {
    this.blacklistedKeys.add(apiKey);
  }

  /**
   * 从黑名单移除
   */
  whitelist(apiKey) {
    this.blacklistedKeys.delete(apiKey);
  }

  /**
   * 速率限制中间件
   */
  rateLimit(options = {}) {
    const {
      windowMs = 60000, // 1分钟
      max = 100, // 最多100次
      message = 'Too many requests'
    } = options;

    const requests = new Map();

    return (req, res, next) => {
      const key = req.auth?.key || req.ip;
      const now = Date.now();
      const windowStart = now - windowMs;

      // 清理过期记录
      if (requests.has(key)) {
        const timestamps = requests.get(key).filter(t => t > windowStart);
        requests.set(key, timestamps);
      } else {
        requests.set(key, []);
      }

      const timestamps = requests.get(key);

      if (timestamps.length >= max) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message,
          retryAfter: Math.ceil((timestamps[0] + windowMs - now) / 1000)
        });
      }

      timestamps.push(now);
      next();
    };
  }
}

// 单例模式
let instance = null;

function getAuthMiddleware(config) {
  if (!instance) {
    instance = new AuthMiddleware(config);
  }
  return instance;
}

module.exports = {
  AuthMiddleware,
  getAuthMiddleware
};
