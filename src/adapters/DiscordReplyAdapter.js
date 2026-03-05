// Discord 自动回复适配器
// 文件: src/adapters/DiscordReplyAdapter.js

const { Client, GatewayIntentBits } = require('discord.js');

class DiscordReplyAdapter {
  constructor() {
    this.client = null;
    this.ready = false;
  }

  async initialize(token) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    return new Promise((resolve, reject) => {
      this.client.on('ready', () => {
        console.log(`✅ Discord 自动回复 Bot 已连接: ${this.client.user.tag}`);
        this.ready = true;
        resolve();
      });

      this.client.on('error', (error) => {
        console.error('❌ Discord 错误:', error);
        reject(error);
      });

      this.client.login(token);
    });
  }

  /**
   * 监听消息
   */
  onMessage(callback) {
    this.client.on('messageCreate', (message) => {
      // 忽略机器人消息
      if (message.author.bot) return;

      const formattedMessage = {
        platform: 'discord',
        channelId: message.channelId,
        channelName: message.channel.name,
        userId: message.author.id,
        username: message.author.username,
        author: message.author.username,
        content: message.content,
        timestamp: message.createdAt.toISOString(),
        metadata: {
          guildId: message.guildId,
          guildName: message.guild?.name
        }
      };

      callback(formattedMessage);
    });
  }

  /**
   * 发送回复
   */
  async sendReply(channelId, content) {
    if (!this.ready) {
      throw new Error('Discord Bot 未就绪');
    }

    try {
      const channel = await this.client.channels.fetch(channelId);

      if (!channel) {
        throw new Error(`频道不存在: ${channelId}`);
      }

      const sent = await channel.send(content);

      console.log(`✅ [Discord] 自动回复已发送到频道 ${channel.name}`);

      return {
        success: true,
        messageId: sent.id
      };

    } catch (error) {
      console.error('❌ [Discord] 发送失败:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.ready = false;
      console.log('🔌 Discord 自动回复 Bot 已断开');
    }
  }
}

module.exports = DiscordReplyAdapter;
