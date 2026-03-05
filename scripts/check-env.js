/**
 * 环境检查工具
 * 验证所有必要配置是否正确
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Auto-Reply Pro 环境检查\n');
console.log('='.repeat(60));

// 检查结果
const results = {
  passed: [],
  warnings: [],
  errors: []
};

// 1. 检查 Node.js 版本
console.log('\n📦 系统环境\n');
const nodeVersion = process.version;
const nodeVersionNum = parseFloat(nodeVersion.slice(1));
if (nodeVersionNum >= 16) {
  console.log(`✅ Node.js 版本: ${nodeVersion}`);
  results.passed.push('Node.js 版本');
} else {
  console.log(`❌ Node.js 版本过低: ${nodeVersion} (需要 >= 16)`);
  results.errors.push('Node.js 版本过低');
}

// 2. 检查依赖
console.log('\n📚 依赖检查\n');
const requiredPackages = [
  'express',
  'node-fetch',
  'node-cron',
  'uuid',
  'nodemailer'
];

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const installedPackages = fs.existsSync('node_modules');

if (installedPackages) {
  for (const pkg of requiredPackages) {
    if (fs.existsSync(`node_modules/${pkg}`)) {
      console.log(`✅ ${pkg}`);
      results.passed.push(`依赖: ${pkg}`);
    } else {
      console.log(`❌ ${pkg} 未安装`);
      results.errors.push(`依赖缺失: ${pkg}`);
    }
  }
} else {
  console.log('⚠️  node_modules 不存在，请运行 npm install');
  results.warnings.push('依赖未安装');
}

// 3. 检查环境变量
console.log('\n⚙️  环境变量\n');
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('⚠️  .env 文件不存在');
    console.log('💡 提示: cp .env.example .env');
    results.warnings.push('.env 文件不存在');
  } else {
    console.log('❌ .env 和 .env.example 都不存在');
    results.errors.push('配置文件缺失');
  }
} else {
  require('dotenv').config({ path: envPath });

  // 检查必需配置
  const requiredEnvVars = {
    'DEEPSEEK_API_KEY': 'AI 配置（必需）',
    'PORT': 'Web 服务端口（可选）',
    'DASHBOARD_PORT': '管理面板端口（可选）'
  };

  const optionalEnvVars = {
    'FEISHU_APP_ID': '飞书 App ID',
    'FEISHU_APP_SECRET': '飞书 App Secret',
    'WECHAT_CORP_ID': '企业微信 Corp ID',
    'WECHAT_AGENT_ID': '企业微信 Agent ID',
    'WECHAT_SECRET': '企业微信 Secret',
    'DISCORD_BOT_TOKEN': 'Discord Bot Token',
    'SMTP_HOST': 'SMTP 服务器',
    'SMTP_USER': 'SMTP 用户名',
    'SMTP_PASS': 'SMTP 密码'
  };

  // 必需配置
  for (const [key, desc] of Object.entries(requiredEnvVars)) {
    if (process.env[key]) {
      if (key.includes('SECRET') || key.includes('KEY') || key.includes('PASS')) {
        console.log(`✅ ${desc}: ******`);
      } else {
        console.log(`✅ ${desc}: ${process.env[key]}`);
      }
      results.passed.push(desc);
    } else if (key === 'DEEPSEEK_API_KEY') {
      console.log(`❌ ${desc}: 未配置（必需）`);
      results.errors.push(`${desc} 未配置`);
    } else {
      console.log(`⚠️  ${desc}: 使用默认值`);
      results.warnings.push(`${desc} 未配置`);
    }
  }

  // 可选配置
  let hasOptional = false;
  for (const [key, desc] of Object.entries(optionalEnvVars)) {
    if (process.env[key]) {
      if (!hasOptional) {
        console.log('\n✅ 已配置的平台:');
        hasOptional = true;
      }
      console.log(`  - ${desc}`);
      results.passed.push(`平台: ${desc}`);
    }
  }

  if (!hasOptional) {
    console.log('\n⚠️  未配置任何平台');
    results.warnings.push('未配置平台');
  }
}

// 4. 检查端口占用
console.log('\n🌐 端口检查\n');
const net = require('net');

const checkPort = (port, name) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  ${name}: 端口 ${port} 已被占用`);
        results.warnings.push(`${name} 端口占用`);
      }
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      console.log(`✅ ${name}: 端口 ${port} 可用`);
      results.passed.push(`${name} 端口`);
      resolve(true);
    });
    server.listen(port);
  });
};

(async () => {
  await checkPort(3002, 'Web Chat');
  await checkPort(3003, '管理面板');

  // 5. 生成报告
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 检查结果\n');
  console.log(`✅ 通过: ${results.passed.length}`);
  console.log(`⚠️  警告: ${results.warnings.length}`);
  console.log(`❌ 错误: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\n❌ 发现错误，请修复后再启动:\n');
    results.errors.forEach(err => console.log(`  - ${err}`));
    process.exit(1);
  } else if (results.warnings.length > 0) {
    console.log('\n⚠️  存在警告，建议优化:\n');
    results.warnings.forEach(warn => console.log(`  - ${warn}`));
    console.log('\n💡 可以启动，但建议完善配置');
    process.exit(0);
  } else {
    console.log('\n✅ 所有检查通过，可以启动服务！');
    console.log('\n🚀 启动命令: node src/index-full.js');
    process.exit(0);
  }
})();
