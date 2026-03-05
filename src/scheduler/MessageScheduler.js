/**
 * MessageScheduler - 消息调度引擎
 * 支持定时发送、批量发送、优先级队列
 */

const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');

class MessageScheduler {
  constructor(config = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent || 10,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 5000,
      ...config
    };

    // 任务队列（优先级队列）
    this.taskQueue = [];

    // 定时任务
    this.cronJobs = new Map();

    // 速率限制器
    this.rateLimiters = new Map();

    // 平台适配器
    this.platformAdapters = new Map();

    // 统计
    this.stats = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0
    };
  }

  /**
   * 注册平台适配器
   */
  registerPlatform(name, adapter) {
    this.platformAdapters.set(name, adapter);
    console.log(`✅ 平台适配器已注册: ${name}`);
  }

  /**
   * 调度消息任务
   */
  scheduleMessage(task) {
    const taskId = uuidv4();

    const scheduledTask = {
      id: taskId,
      platform: task.platform,
      recipients: task.recipients,
      message: task.message,
      sendAt: task.sendAt ? new Date(task.sendAt) : new Date(),
      priority: task.priority || 'normal',
      status: 'pending',
      createdAt: new Date(),
      attempts: 0,
      metadata: task.metadata || {}
    };

    // 加入队列（按优先级排序）
    this.addToQueue(scheduledTask);

    this.stats.total++;
    this.stats.pending++;

    console.log(`📋 任务已调度: ${taskId} (平台: ${task.platform}, 优先级: ${scheduledTask.priority})`);

    return taskId;
  }

  /**
   * 添加到队列（按优先级）
   */
  addToQueue(task) {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const priority = priorityOrder[task.priority] || 1;

    // 找到插入位置
    let inserted = false;
    for (let i = 0; i < this.taskQueue.length; i++) {
      const currentPriority = priorityOrder[this.taskQueue[i].priority] || 1;
      if (priority < currentPriority) {
        this.taskQueue.splice(i, 0, task);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.taskQueue.push(task);
    }
  }

  /**
   * 批量发送
   */
  async sendBatch(tasks) {
    const results = [];

    for (const task of tasks) {
      try {
        const result = await this.sendSingle(task);
        results.push({
          taskId: task.id,
          success: true,
          result
        });

        this.stats.sent++;
        this.stats.pending--;

      } catch (error) {
        results.push({
          taskId: task.id,
          success: false,
          error: error.message
        });

        this.stats.failed++;
        this.stats.pending--;
      }
    }

    return results;
  }

  /**
   * 发送单个任务
   */
  async sendSingle(task) {
    const adapter = this.platformAdapters.get(task.platform);

    if (!adapter) {
      throw new Error(`平台适配器未找到: ${task.platform}`);
    }

    // 检查速率限制
    if (!this.checkRateLimit(task.platform)) {
      throw new Error('平台发送频率超限');
    }

    // 执行发送
    task.attempts++;
    task.status = 'sending';

    try {
      const result = await adapter.sendBatchMessages(
        task.recipients,
        task.message
      );

      task.status = 'sent';
      task.sentAt = new Date();

      console.log(`✅ 任务发送成功: ${task.id}`);

      return result;

    } catch (error) {
      task.status = 'failed';
      task.error = error.message;

      // 重试逻辑
      if (task.attempts < this.config.retryAttempts) {
        console.log(`⚠️ 任务发送失败，准备重试 (${task.attempts}/${this.config.retryAttempts}): ${task.id}`);
        await this.delay(this.config.retryDelay);
        return await this.sendSingle(task);
      }

      throw error;
    }
  }

  /**
   * 检查速率限制
   */
  checkRateLimit(platform) {
    if (!this.rateLimiters.has(platform)) {
      this.rateLimiters.set(platform, {
        count: 0,
        lastReset: Date.now()
      });
    }

    const limiter = this.rateLimiters.get(platform);

    // 每分钟重置
    if (Date.now() - limiter.lastReset > 60000) {
      limiter.count = 0;
      limiter.lastReset = Date.now();
    }

    // 速率限制配置
    const limits = {
      feishu: 300, // 5条/秒 = 300条/分钟
      wechat: 100,
      telegram: 1800, // 30条/秒
      discord: 50
    };

    const limit = limits[platform] || 100;

    if (limiter.count >= limit) {
      return false;
    }

    limiter.count++;
    return true;
  }

  /**
   * 处理待发送任务
   */
  async processPendingTasks() {
    const now = new Date();
    const tasksToSend = [];

    // 找出需要发送的任务
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue[0];

      if (task.sendAt <= now && task.status === 'pending') {
        tasksToSend.push(this.taskQueue.shift());
      } else {
        break;
      }
    }

    // 批量发送
    if (tasksToSend.length > 0) {
      console.log(`📤 开始发送 ${tasksToSend.length} 个任务...`);
      const results = await this.sendBatch(tasksToSend);
      console.log(`✅ 发送完成: ${results.filter(r => r.success).length} 成功, ${results.filter(r => !r.success).length} 失败`);
    }
  }

  /**
   * 启动定时任务
   */
  start() {
    // 每5分钟检查待发送任务
    this.cronJobs.set('main', cron.schedule('*/5 * * * *', () => {
      this.processPendingTasks();
    }));

    console.log('🚀 消息调度引擎已启动');
    console.log('⏰ 定时检查: 每5分钟');
  }

  /**
   * 停止定时任务
   */
  stop() {
    for (const [name, job] of this.cronJobs) {
      job.stop();
      console.log(`⏹️ 定时任务已停止: ${name}`);
    }
  }

  /**
   * 获取队列状态
   */
  getQueueStatus() {
    return {
      total: this.stats.total,
      sent: this.stats.sent,
      failed: this.stats.failed,
      pending: this.stats.pending,
      queueLength: this.taskQueue.length,
      platforms: Array.from(this.platformAdapters.keys())
    };
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MessageScheduler;
