/**
 * Auto-Reply Pro - Web 管理界面 API
 * 提供可视化管理、监控、配置功能
 */

const express = require('express');
const path = require('path');

class WebDashboard {
  constructor(config) {
    this.config = {
      port: config.port || 3003,
      ...config
    };

    this.app = express();
    this.server = null;
    this.messageScheduler = config.messageScheduler;
    this.messageGenerator = config.messageGenerator;
    this.templateManager = config.templateManager;

    this.setupRoutes();
  }

  /**
   * 设置路由
   */
  setupRoutes() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });

    // ========== 仪表盘 API ==========

    // 获取概览数据
    this.app.get('/api/dashboard/overview', (req, res) => {
      try {
        const schedulerStatus = this.messageScheduler?.getQueueStatus() || {};
        const generatorStats = this.messageGenerator?.getStats() || {};

        res.json({
          success: true,
          data: {
            totalMessages: schedulerStatus.total || 0,
            sentMessages: schedulerStatus.sent || 0,
            failedMessages: schedulerStatus.failed || 0,
            pendingMessages: schedulerStatus.pending || 0,
            platforms: schedulerStatus.platforms || [],
            aiProvider: generatorStats.provider || 'none',
            templateCount: generatorStats.templateCount || 0
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ========== 消息管理 API ==========

    // 获取消息队列
    this.app.get('/api/messages/queue', (req, res) => {
      try {
        const status = this.messageScheduler?.getQueueStatus() || {};
        res.json({
          success: true,
          data: status
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 创建消息任务
    this.app.post('/api/messages/schedule', async (req, res) => {
      try {
        const { platform, recipients, message, sendAt, priority } = req.body;

        const taskId = this.messageScheduler?.scheduleMessage({
          platform,
          recipients,
          message,
          sendAt,
          priority
        });

        res.json({
          success: true,
          data: { taskId }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 生成消息
    this.app.post('/api/messages/generate', async (req, res) => {
      try {
        const { recipients, template, variables, useAI } = req.body;

        const messages = await this.messageGenerator?.generateBatch(
          recipients,
          template,
          variables
        );

        res.json({
          success: true,
          data: messages
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ========== 模板管理 API ==========

    // 获取模板列表
    this.app.get('/api/templates', (req, res) => {
      try {
        const templates = this.templateManager?.listTemplates() || [];
        res.json({
          success: true,
          data: templates
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 添加模板
    this.app.post('/api/templates', (req, res) => {
      try {
        const { name, template } = req.body;
        this.templateManager?.addCustomTemplate(name, template);

        res.json({
          success: true,
          message: '模板已添加'
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 渲染模板
    this.app.post('/api/templates/render', (req, res) => {
      try {
        const { template, variables } = req.body;
        const rendered = this.templateManager?.render(template, variables);

        res.json({
          success: true,
          data: rendered
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ========== 平台管理 API ==========

    // 获取平台状态
    this.app.get('/api/platforms/status', (req, res) => {
      try {
        const platforms = [
          { name: 'feishu', adapter: 'FeishuAdapter', status: 'available' },
          { name: 'wechat', adapter: 'WeChatAdapter', status: 'available' },
          { name: 'email', adapter: 'EmailAdapter', status: 'available' },
          { name: 'discord', adapter: 'DiscordAdapter', status: 'available' },
          { name: 'web', adapter: 'WebAdapter', status: 'available' }
        ];

        res.json({
          success: true,
          data: platforms
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ========== 健康检查 ==========

    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        service: 'auto-reply-pro-dashboard',
        timestamp: new Date().toISOString()
      });
    });

    // ========== 主页 ==========

    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });
  }

  /**
   * 获取仪表盘 HTML
   */
  getDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auto-Reply Pro - 管理面板</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header h1 { color: #667eea; margin-bottom: 10px; }
        .header p { color: #666; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .card h3 { color: #667eea; margin-bottom: 15px; }
        .stat { font-size: 32px; font-weight: bold; color: #333; }
        .stat-label { color: #999; font-size: 14px; margin-top: 5px; }
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .status-active { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-inactive { background: #f8d7da; color: #721c24; }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            margin-right: 10px;
        }
        .btn:hover { background: #5568d3; }
        .section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section h2 { color: #667eea; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; color: #666; font-weight: 600; }
        .refresh-btn {
            background: transparent;
            border: 1px solid #667eea;
            color: #667eea;
            padding: 5px 15px;
            border-radius: 5px;
            cursor: pointer;
            float: right;
        }
        .refresh-btn:hover { background: #667eea; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Auto-Reply Pro</h1>
            <p>智能消息管理与发送平台</p>
        </div>

        <div class="grid">
            <div class="card">
                <h3>📨 总消息数</h3>
                <div class="stat" id="totalMessages">0</div>
                <div class="stat-label">累计发送</div>
            </div>
            <div class="card">
                <h3>✅ 成功发送</h3>
                <div class="stat" id="sentMessages">0</div>
                <div class="stat-label">成功送达</div>
            </div>
            <div class="card">
                <h3>⏳ 待发送</h3>
                <div class="stat" id="pendingMessages">0</div>
                <div class="stat-label">队列中</div>
            </div>
            <div class="card">
                <h3>❌ 失败</h3>
                <div class="stat" id="failedMessages">0</div>
                <div class="stat-label">发送失败</div>
            </div>
        </div>

        <div class="section">
            <h2>🎯 快速操作</h2>
            <button class="btn" onclick="location.href='/api/messages/queue'">查看消息队列</button>
            <button class="btn" onclick="loadOverview()">刷新数据</button>
        </div>

        <div class="section">
            <h2>📊 平台状态</h2>
            <table>
                <thead>
                    <tr>
                        <th>平台</th>
                        <th>适配器</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="platformTable">
                    <tr>
                        <td>飞书</td>
                        <td>FeishuAdapter</td>
                        <td><span class="status-badge status-active">可用</span></td>
                        <td><button class="btn">配置</button></td>
                    </tr>
                    <tr>
                        <td>企业微信</td>
                        <td>WeChatAdapter</td>
                        <td><span class="status-badge status-active">可用</span></td>
                        <td><button class="btn">配置</button></td>
                    </tr>
                    <tr>
                        <td>邮件</td>
                        <td>EmailAdapter</td>
                        <td><span class="status-badge status-active">可用</span></td>
                        <td><button class="btn">配置</button></td>
                    </tr>
                    <tr>
                        <td>Discord</td>
                        <td>DiscordAdapter</td>
                        <td><span class="status-badge status-active">可用</span></td>
                        <td><button class="btn">配置</button></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>📝 模板列表</h2>
            <p id="templateList">加载中...</p>
        </div>
    </div>

    <script>
        async function loadOverview() {
            try {
                const res = await fetch('/api/dashboard/overview');
                const data = await res.json();
                
                if (data.success) {
                    document.getElementById('totalMessages').textContent = data.data.totalMessages;
                    document.getElementById('sentMessages').textContent = data.data.sentMessages;
                    document.getElementById('pendingMessages').textContent = data.data.pendingMessages;
                    document.getElementById('failedMessages').textContent = data.data.failedMessages;
                }
            } catch (error) {
                console.error('加载数据失败:', error);
            }
        }

        async function loadTemplates() {
            try {
                const res = await fetch('/api/templates');
                const data = await res.json();
                
                if (data.success) {
                    document.getElementById('templateList').textContent = 
                        data.data.length > 0 
                            ? data.data.join(', ') 
                            : '暂无模板';
                }
            } catch (error) {
                console.error('加载模板失败:', error);
            }
        }

        // 初始化
        loadOverview();
        loadTemplates();

        // 自动刷新
        setInterval(loadOverview, 30000);
    </script>
</body>
</html>
    `;
  }

  /**
   * 启动服务
   */
  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, () => {
        console.log('✅ Web 管理面板已启动');
        console.log(`🌐 访问地址: http://localhost:${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * 停止服务
   */
  async stop() {
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(resolve);
      });
      console.log('🔌 Web 管理面板已停止');
    }
  }
}

module.exports = WebDashboard;
