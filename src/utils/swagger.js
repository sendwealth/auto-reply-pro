const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auto-Reply Pro API',
      version: '1.0.0',
      description: 'AI驱动的智能消息平台API文档',
      contact: {
        name: 'CLAW AI',
        email: 'support@claw.id'
      }
    },
    servers: [
      {
        url: 'http://localhost:3004',
        description: '开发环境'
      },
      {
        url: 'https://auto-reply.claw.id',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Message: {
          type: 'object',
          properties: {
            platform: {
              type: 'string',
              enum: ['discord', 'feishu', 'wechat', 'email', 'web'],
              description: '目标平台'
            },
            message: {
              type: 'string',
              description: '消息内容'
            },
            recipient: {
              type: 'string',
              description: '接收者ID（可选）'
            },
            template: {
              type: 'string',
              description: '使用的模板名称（可选）'
            }
          },
          required: ['platform', 'message']
        },
        MessageResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            messageId: { type: 'string' },
            platform: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            uptime: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' },
            services: {
              type: 'object',
              properties: {
                discord: { type: 'boolean' },
                feishu: { type: 'boolean' },
                wechat: { type: 'boolean' },
                email: { type: 'boolean' }
              }
            }
          }
        },
        ChatRequest: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            userId: { type: 'string' },
            context: { type: 'object' }
          },
          required: ['message']
        },
        ChatResponse: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            intent: { type: 'string' },
            confidence: { type: 'number' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/index-secure.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
