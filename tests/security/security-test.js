/**
 * 安全测试套件 - 验证安全机制
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🔒 Auto-Reply Pro 安全测试套件\n');
console.log('='.repeat(60));

// 安全测试结果
const securityResults = {
  passed: 0,
  failed: 0,
  warnings: [],
  critical: []
};

function securityCheck(name, fn) {
  try {
    const result = fn();
    if (result.safe) {
      console.log(`✅ ${name}`);
      securityResults.passed++;
    } else {
      console.log(`❌ ${name}`);
      console.log(`   ${result.message}`);
      securityResults.failed++;
      if (result.critical) {
        securityResults.critical.push(name);
      }
    }
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   错误: ${error.message}`);
    securityResults.failed++;
  }
}

// ========== 1. 环境变量安全 ==========

console.log('\n🔐 环境变量安全检查\n');

securityCheck('检查 .env 文件权限', () => {
  const envPath = path.join(__dirname, '../../.env');
  
  if (!fs.existsSync(envPath)) {
    return { safe: true, message: '.env 文件不存在（使用示例配置）' };
  }
  
  const stats = fs.statSync(envPath);
  const mode = stats.mode.toString(8);
  
  // 检查文件权限（应该是 600 或 400）
  if (mode.endsWith('600') || mode.endsWith('400')) {
    return { safe: true };
  } else {
    return { 
      safe: false, 
      message: `.env 文件权限过于开放: ${mode}`,
      critical: true
    };
  }
});

securityCheck('检查敏感信息泄露', () => {
  const readmePath = path.join(__dirname, '../../README.md');
  
  if (!fs.existsSync(readmePath)) {
    return { safe: true, message: 'README 文件不存在' };
  }
  
  const content = fs.readFileSync(readmePath, 'utf-8');
  
  // 检查是否包含真实的 API Key
  const suspiciousPatterns = [
    /sk-[a-zA-Z0-9]{20,}/,
    /[a-f0-9]{32}/,
    /password\s*=\s*[^\s]/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return { 
        safe: false, 
        message: '可能包含敏感信息',
        critical: true
      };
    }
  }
  
  return { safe: true };
});

// ========== 2. 依赖安全 ==========

console.log('\n📦 依赖安全检查\n');

securityCheck('检查已知漏洞依赖', () => {
  const packageLockPath = path.join(__dirname, '../../package-lock.json');
  
  if (!fs.existsSync(packageLockPath)) {
    return { safe: true, message: 'package-lock.json 不存在' };
  }
  
  // 简单检查：确保没有已知的不安全包
  const unsafePackages = ['event-stream', 'flatmap-stream'];
  const content = fs.readFileSync(packageLockPath, 'utf-8');
  
  for (const pkg of unsafePackages) {
    if (content.includes(pkg)) {
      return { 
        safe: false, 
        message: `包含不安全依赖: ${pkg}`,
        critical: true
      };
    }
  }
  
  return { safe: true };
});

// ========== 3. 输入验证 ==========

console.log('\n🛡️ 输入验证检查\n');

securityCheck('SQL 注入防护', () => {
  // 检查是否使用参数化查询
  const srcDir = path.join(__dirname, '../../src');
  const files = getAllFiles(srcDir);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // 检查是否有直接的 SQL 拼接
    if (content.includes('SELECT * FROM') && content.includes('+')) {
      return { 
        safe: false, 
        message: `可能存在 SQL 注入风险: ${path.basename(file)}`,
        critical: true
      };
    }
  }
  
  return { safe: true };
});

securityCheck('XSS 防护', () => {
  // 检查是否有 XSS 防护
  const webAdapterPath = path.join(__dirname, '../../src/adapters/WebAdapter.js');
  
  if (!fs.existsSync(webAdapterPath)) {
    return { safe: true, message: 'WebAdapter 不存在' };
  }
  
  const content = fs.readFileSync(webAdapterPath, 'utf-8');
  
  // 检查是否有输入清理
  if (content.includes('sanitize') || content.includes('escape') || content.includes('validator')) {
    return { safe: true };
  }
  
  return { 
    safe: false, 
    message: '未发现 XSS 防护机制',
    critical: false
  };
});

// ========== 4. 访问控制 ==========

console.log('\n🚪 访问控制检查\n');

securityCheck('API 鉴权机制', () => {
  const indexPath = path.join(__dirname, '../../src/index-full.js');
  
  if (!fs.existsSync(indexPath)) {
    return { safe: true, message: 'index-full.js 不存在' };
  }
  
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  // 检查是否有鉴权
  if (content.includes('auth') || content.includes('token') || content.includes('apiKey')) {
    return { safe: true };
  }
  
  return { 
    safe: false, 
    message: '未发现 API 鉴权机制',
    critical: false
  };
});

securityCheck('速率限制', () => {
  const schedulerPath = path.join(__dirname, '../../src/scheduler/MessageScheduler.js');
  
  if (!fs.existsSync(schedulerPath)) {
    return { safe: true, message: 'MessageScheduler 不存在' };
  }
  
  const content = fs.readFileSync(schedulerPath, 'utf-8');
  
  if (content.includes('rateLimit') || content.includes('rateLimiter')) {
    return { safe: true };
  }
  
  return { 
    safe: false, 
    message: '未发现速率限制机制',
    critical: false
  };
});

// ========== 5. 日志安全 ==========

console.log('\n📝 日志安全检查\n');

securityCheck('日志脱敏', () => {
  const srcDir = path.join(__dirname, '../../src');
  const files = getAllFiles(srcDir);
  
  // 检查是否有专门的日志工具（带脱敏功能）
  const loggerPath = path.join(srcDir, 'middleware/logger.js');
  if (fs.existsSync(loggerPath)) {
    const loggerContent = fs.readFileSync(loggerPath, 'utf-8');
    if (loggerContent.includes('mask') || loggerContent.includes('sanitize') || loggerContent.includes('sensitiveFields')) {
      return { safe: true, message: '已配置日志脱敏机制' };
    }
  }
  
  let hasLogging = false;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    if (content.includes('console.log') || content.includes('logger')) {
      hasLogging = true;
      
      // 检查是否直接记录敏感变量（非字符串字面量）
      const sensitiveLogPatterns = [
        /console\.log\([^)]*password[^)]*\)/i,
        /console\.log\([^)]*token[^)]*\)/i,
        /console\.log\([^)]*secret[^)]*\)/i
      ];
      
      for (const pattern of sensitiveLogPatterns) {
        if (pattern.test(content)) {
          return { 
            safe: false, 
            message: '可能记录敏感信息',
            critical: false
          };
        }
      }
    }
  }
  
  if (!hasLogging) {
    return { safe: true, message: '未发现日志记录' };
  }
  
  return { safe: true, message: '日志检查通过' };
});

// ========== 6. Docker 安全 ==========

console.log('\n🐳 Docker 安全检查\n');

securityCheck('Docker 非 root 用户', () => {
  const dockerfilePath = path.join(__dirname, '../../Dockerfile');
  
  if (!fs.existsSync(dockerfilePath)) {
    return { safe: true, message: 'Dockerfile 不存在' };
  }
  
  const content = fs.readFileSync(dockerfilePath, 'utf-8');
  
  if (content.includes('USER')) {
    return { safe: true };
  }
  
  return { 
    safe: false, 
    message: 'Docker 容器可能以 root 用户运行',
    critical: false
  };
});

// ========== 辅助函数 ==========

function getAllFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllFiles(fullPath));
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// ========== 安全测试总结 ==========

console.log('\n' + '='.repeat(60));
console.log('\n🔒 安全测试结果:\n');
console.log(`✅ 通过: ${securityResults.passed}`);
console.log(`❌ 失败: ${securityResults.failed}`);

if (securityResults.critical.length > 0) {
  console.log('\n🚨 严重问题:\n');
  securityResults.critical.forEach((item, index) => {
    console.log(`${index + 1}. ${item}`);
  });
}

if (securityResults.failed === 0) {
  console.log('\n✅ 所有安全测试通过！');
  process.exit(0);
} else if (securityResults.critical.length === 0) {
  console.log('\n⚠️ 存在安全问题，建议修复');
  process.exit(0);
} else {
  console.log('\n❌ 存在严重安全问题，必须修复！');
  process.exit(1);
}
