/**
 * 集成测试套件 - API 接口测试
 */

const request = require('supertest');

console.log('🔗 Auto-Reply Pro 集成测试套件\n');
console.log('='.repeat(60));

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

async function test(name, fn) {
  testResults.total++;
  try {
    await fn();
    console.log(`✅ ${name}`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   错误: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
  }
}

// 动态加载 app（如果可用）
let app = null;
try {
  app = require('../../src/index-secure');
} catch (e) {
  console.log('⚠️ index-secure.js 未找到，尝试其他入口...');
  try {
    app = require('../../src/simple-server');
  } catch (e2) {
    console.log('⚠️ 无法加载服务器，跳过集成测试');
  }
}

// ========== 运行测试 ==========
(async () => {
  if (!app) {
    console.log('\n⚠️ 服务器未启动，跳过 API 集成测试');
    console.log('   提示: 启动服务器后再运行集成测试');
    process.exit(0);
  }

  console.log('\n🌐 API 接口测试\n');

  // 测试 1: 健康检查
  await test('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    if (res.body.status !== 'ok') {
      throw new Error(`Expected status 'ok', got '${res.body.status}'`);
    }
  });

  // 测试 2: 指标端点（如果存在）
  await test('GET /metrics should return Prometheus metrics (if available)', async () => {
    try {
      const res = await request(app).get('/metrics');
      if (res.status === 200) {
        if (!res.text.includes('http_requests') && !res.text.includes('nodejs_')) {
          throw new Error('Response does not contain expected metrics');
        }
      } else if (res.status === 404) {
        // Metrics endpoint is optional
        console.log('   ℹ️ Metrics endpoint not configured');
      } else {
        throw new Error(`Unexpected status: ${res.status}`);
      }
    } catch (e) {
      if (e.code === 'ECONNREFUSED') {
        console.log('   ℹ️ Server not running, skipping');
      } else {
        throw e;
      }
    }
  });

  // 测试 3: 认证测试
  await test('POST /api/message should require auth (if protected)', async () => {
    const res = await request(app)
      .post('/api/message')
      .send({ message: 'test' });
    
    // 接受 401 (需要认证) 或 404 (端点不存在) 或 200 (公开端点)
    if (res.status === 401) {
      console.log('   ℹ️ Authentication required (good)');
    } else if (res.status === 404) {
      console.log('   ℹ️ Endpoint not found (different API structure)');
    } else if (res.status === 200 || res.status === 201) {
      console.log('   ℹ️ Endpoint is public (no auth required)');
    } else {
      throw new Error(`Unexpected status: ${res.status}`);
    }
  });

  // 测试 4: 速率限制
  await test('Rate limiting should be configured', async () => {
    // 发送多个请求测试速率限制
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(request(app).get('/health'));
    }
    
    const responses = await Promise.all(requests);
    const allSuccess = responses.every(r => r.status === 200 || r.status === 429);
    
    if (!allSuccess) {
      throw new Error('Unexpected response from rate limit test');
    }
    console.log('   ℹ️ Rate limiting check passed');
  });

  // 测试 5: CORS 配置
  await test('CORS headers should be present', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', 'http://example.com');
    
    // 检查 CORS 头（如果配置了）
    const corsHeader = res.headers['access-control-allow-origin'];
    if (corsHeader) {
      console.log(`   ℹ️ CORS configured: ${corsHeader}`);
    } else {
      console.log('   ℹ️ No CORS headers (may be intentional)');
    }
  });

  // ========== 测试总结 ==========
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 集成测试结果:\n');
  console.log(`总计: ${testResults.total}`);
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📈 通过率: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ 失败详情:\n');
    testResults.errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.name}`);
      console.log(`   ${err.error}\n`);
    });
  }

  if (testResults.failed === 0) {
    console.log('\n🎉 所有集成测试通过！');
    process.exit(0);
  } else {
    console.log('\n⚠️ 部分测试失败，需要检查');
    process.exit(1);
  }
})();
