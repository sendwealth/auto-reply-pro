// 测试 metrics 模块
const metrics = require('./src/utils/metrics');

console.log('Testing Prometheus metrics module...\n');

// 测试指标是否正确导出
console.log('✓ Register:', typeof metrics.register);
console.log('✓ httpRequestsTotal:', typeof metrics.httpRequestsTotal);
console.log('✓ messagesProcessed:', typeof metrics.messagesProcessed);
console.log('✓ responseTime:', typeof metrics.responseTime);

// 测试计数器
metrics.httpRequestsTotal.labels('GET', '/test', 200).inc();
metrics.messagesProcessed.labels('web', 'text').inc();

// 测试直方图
metrics.responseTime.labels('GET', '/test').observe(0.15);

// 输出指标
metrics.register.metrics().then(metricsText => {
  console.log('\n✓ Metrics output sample:');
  console.log(metricsText.substring(0, 500));
  console.log('\n✅ All metrics tests passed!');
}).catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
