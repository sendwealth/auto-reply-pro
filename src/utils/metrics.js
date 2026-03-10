const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

const messagesProcessed = new client.Counter({
  name: 'messages_processed_total',
  help: 'Total messages processed',
  labelNames: ['platform', 'type'],
  registers: [register]
});

const responseTime = new client.Histogram({
  name: 'response_time_seconds',
  help: 'Response time in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [register]
});

module.exports = {
  register,
  httpRequestsTotal,
  messagesProcessed,
  responseTime
};
