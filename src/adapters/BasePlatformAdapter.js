/**
 * DiscordAdapter - Discord 平台适配器
 */

const { Client, GatewayIntentBits } = require('discord.js');

class DiscordAdapter {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.messageHandler = null;
    this.isConnected = false;
  }

  /**
   * 连接到 Discord
   */
  async connect() {
    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent
        ]
      });

      // 监听消息
      this.client.on('messageCreate', async (message) => {
        // 忽略机器人消息
        if (message.author.bot) return;

        // 转换为统一消息格式
        const universalMessage = this.toUniversalMessage(message);

        // 调用消息处理器
        if (this.messageHandler) {
          await this.messageHandler(universalMessage);
        }
      });

      // 登录
      await this.client.login(this.config.token);
      this.isConnected = true;

      console.log('✅ Discord 适配器已连接');
      console.log(`🤖 机器人名称: ${this.client.user.tag}`);

    } catch (error) {
      console.error('❌ Discord 连接失败:', error);
      throw error;
    }
  }

  /**
   * 设置消息处理器
   */
  onMessage(handler) {
    this.messageHandler = handler;
  }

  /**
   * 转换为统一消息格式
   */
  toUniversalMessage(discordMessage) {
    return {
      id: discordMessage.id,
      timestamp: new Date(discordMessage.createdTimestamp),
      source: {
        platform: 'discord',
        channelId: discordMessage.channelId,
        userId: discordMessage.author.id,
        userName: discordMessage.author.username,
        metadata: {
          guildId: discordMessage.guild?.id,
          guildName: discordMessage.guild?.name
        }
      },
      content: {
        text: discordMessage.content,
        type: 'text',
        attachments: discordMessage.attachments.map(att => ({
          url: att.url,
          name: att.name
        }))
      },
      context: {
        conversationId: discordMessage.channelId,
        threadId: discordMessage.thread?.id
      },
      flags: {
        priority: 'normal',
        requiresResponse: true,
        processed: false
      },
      // 原始消息引用（用于回复）
      _raw: discordMessage
    };
  }

  /**
   * 发送回复
   */
  async sendReply(originalMessage, replyContent) {
    try {
      const discordMessage = originalMessage._raw;
      await discordMessage.reply(replyContent);
      console.log(`✅ Discord 回复已发送: ${replyContent.substring(0, 50)}...`);
      return true;
    } catch (error) {
      console.error('❌ Discord 回复失败:', error);
      return false;
    }
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.isConnected = false;
      console.log('🔌 Discord 适配器已断开');
    }
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      platform: 'discord',
      connected: this.isConnected,
      botName: this.client?.user?.tag || null,
      guilds: this.client?.guilds?.cache.size || 0
    };
  }
}

// PlatformRegistry - 平台注册表
class PlatformRegistry {
  constructor() {
    this.platforms = new Map();
  }

  register(name, adapter) {
    this.platforms.set(name, adapter);
  }

  get(name) {
    return this.platforms.get(name);
  }

  getAll() {
    return Array.from(this.platforms.entries());
  }

  has(name) {
    return this.platforms.has(name);
  }
}

module.exports = { DiscordAdapter, PlatformRegistry };
