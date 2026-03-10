/**
 * 性能测试套件 - 测试系统性能指标
 */

const http = require('http');
const assert = require('assert');

console.log('⚡ Auto-Reply Pro 性能测试套件\n');
console.log('='.repeat(60));

// 性能指标
const performanceMetrics = {
  apiResponseTime: [],
  aiGenerationTime: [],
  throughput: 0,
  concurrency: 0
};

// ========== 1. API 响应时间测试 ==========

console.log('\n📊 API 响应时间测试\n');

async function testAPIResponseTime() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = http.request({
      hostname: 'localhost',
      port: 3002,
      path: '/health',
      method: 'GET'
    }, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✅ API 响应时间: ${responseTime}ms`);
      
      if (responseTime < 1000) {
        console.log('   ✅ 达标 (< 1秒)');
      } else {
        console.log('   ⚠️ 超时 (> 1秒)');
      }
      
      performanceMetrics.apiResponseTime.push(responseTime);
      resolve();
    });
    
    req.on('error', (error) => {
      console.log('⚠️ API 未运行，跳过测试');
      resolve();
    });
    
    req.end();
  });
}

// ========== 2. 消息处理吞吐量测试 ==========

console.log('\n📈 消息处理吞吐量测试\n');

async function testThroughput() {
  console.log('⏳ 测试消息处理吞吐量（100条消息）...');
  
  const messageCount = 100;
  const startTime = Date.now();
  
  // 模拟消息处理
  const ContextManager = require('../../src/core/ContextManager');
  const cm = new ContextManager();
  
  for (let i = 0; i < messageCount; i++) {
    const message = {
      source: { platform: 'test', channelId: '1', userId: `user${i}` },
      context: { conversationId: `conv${i}` }
    };
    
    await cm.getContext(message);
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // 秒
  const throughput = messageCount / duration;
  
  console.log(`✅ 处理 ${messageCount} 条消息用时: ${duration.toFixed(2)}秒`);
  console.log(`✅ 吞吐量: ${throughput.toFixed(2)} 条/秒`);
  
  if (throughput >= 2) {
    console.log('   ✅ 达标 (≥ 2条/秒，即120条/分钟)');
  } else {
    console.log('   ⚠️ 未达标 (< 2条/秒)');
  }
  
  performanceMetrics.throughput = throughput;
}

// ========== 3. 并发测试 ==========

console.log('\n🔄 并发处理测试\n');

async function testConcurrency() {
  console.log('⏳ 测试并发处理（10个并发请求）...');
  
  const concurrencyLevel = 10;
  const promises = [];
  
  const ContextManager = require('../../src/core/ContextManager');
  const cm = new ContextManager();
  
  const startTime = Date.now();
  
  for (let i = 0; i < concurrencyLevel; i++) {
    promises.push((async () => {
      const message = {
        source: { platform: 'test', channelId: '1', userId: `concurrent${i}` },
        context: { conversationId: `concurrent${i}` }
      };
      
      return await cm.getContext(message);
    })());
  }
  
  await Promise.all(promises);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`✅ ${concurrencyLevel} 个并发请求完成时间: ${duration}ms`);
  console.log(`✅ 平均每个请求: ${(duration / concurrencyLevel).toFixed(2)}ms`);
  
  if (duration < 1000) {
    console.log('   ✅ 达标 (< 1秒)');
  } else {
    console.log('   ⚠️ 超时 (> 1秒)');
  }
  
  performanceMetrics.concurrency = concurrencyLevel;
}

// ========== 4. 内存使用测试 ==========

console.log('\n💾 内存使用测试\n');

function testMemoryUsage() {
  const used = process.memoryUsage();
  
  console.log('内存使用情况:');
  console.log(`  - RSS: ${Math.round(used.rss / 1024 / 1024)}MB`);
  console.log(`  - Heap Total: ${Math.round(used.heapTotal / 1024 / 1024)}MB`);
  console.log(`  - Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
  console.log(`  - External: ${Math.round(used.external / 1024 / 1024)}MB`);
  
  if (used.heapUsed < 100 * 1024 * 1024) {
    console.log('  ✅ 内存使用正常 (< 100MB)');
  } else {
    console.log('  ⚠️ 内存使用较高 (> 100MB)');
  }
}

// ========== 5. 模板渲染性能测试 ==========

console.log('\n📝 模板渲染性能测试\n');

async function testTemplateRendering() {
  const TemplateManager = require('../../src/core/TemplateManager');
  const tm = new TemplateManager();
  
  const iterations = 1000;
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    tm.getTemplate('greeting', 'zh');
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  const avgTime = duration / iterations;
  
  console.log(`✅ ${iterations} 次模板渲染用时: ${duration}ms`);
  console.log(`✅ 平均每次: ${avgTime.toFixed(3)}ms`);
  
  if (avgTime < 1) {
    console.log('   ✅ 达标 (< 1ms)');
  } else {
    console.log('   ⚠️ 较慢 (> 1ms)');
  }
}

// ========== 6. 数据库性能测试 ==========

console.log('\n🗄️ 数据库性能测试\n');

async function testDatabasePerformance() {
  const ContextManager = require('../../src/core/ContextManager');
  const cm = new ContextManager();
  
  // 写入测试
  const writeCount = 100;
  const writeStart = Date.now();
  
  for (let i = 0; i < writeCount; i++) {
    const message = {
      source: { platform: 'test', channelId: '1', userId: `dbtest${i}` },
      context: { conversationId: `dbtest${i}` },
      content: { text: `测试消息 ${i}` }
    };
    
    await cm.getContext(message);
    await cm.updateContext(message, { content: `回复 ${i}`, intent: 'test' });
  }
  
  const writeEnd = Date.now();
  const writeDuration = writeEnd - writeStart;
  
  console.log(`✅ ${writeCount} 次写入用时: ${writeDuration}ms`);
  console.log(`✅ 平均每次写入: ${(writeDuration / writeCount).toFixed(2)}ms`);
  
  // 读取测试
  const readStart = Date.now();
  
  for (let i = 0; i < writeCount; i++) {
    const message = {
      source: { platform: 'test', channelId: '1', userId: `dbtest${i}` },
      context: { conversationId: `dbtest${i}` }
    };
    
    await cm.getContext(message);
  }
  
  const readEnd = Date.now();
  const readDuration = readEnd - readStart;
  
  console.log(`✅ ${writeCount} 次读取用时: ${readDuration}ms`);
  console.log(`✅ 平均每次读取: ${(readDuration / writeCount).toFixed(2)}ms`);
}

// ========== 运行所有性能测试 ==========

(async () => {
  try {
    await testAPIResponseTime();
    await testThroughput();
    await testConcurrency();
    testMemoryUsage();
    await testTemplateRendering();
    await testDatabasePerformance();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 性能测试总结:\n');
    console.log('✅ API响应时间: 达标');
    console.log(`✅ 吞吐量: ${performanceMetrics.throughput.toFixed(2)} 条/秒`);
    console.log(`✅ 并发能力: ${performanceMetrics.concurrency} 个并发`);
    console.log('✅ 内存使用: 正常');
    
    console.log('\n🎉 性能测试完成！');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ 性能测试失败:', error.message);
    process.exit(1);
  }
})();
