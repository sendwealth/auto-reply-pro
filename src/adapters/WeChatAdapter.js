/**
 * WeChatAdapter - 企业微信平台适配器
 * 支持发送文本、卡片、图文消息
 */

const fetch = require('node-fetch');

class WeChatAdapter {
  constructor(config = {}) {
    this.config = {
      corpId: config.corpId || process.env.WECHAT_CORP_ID,
      agentId: config.agentId || process.env.WECHAT_AGENT_ID,
      secret: config.secret || process.env.WECHAT_SECRET,
      apiBase: 'https://qyapi.weixin.qq.com/cgi-bin',
      ...config
    };

    this.accessToken = null;
    this.tokenExpireTime = 0;
  }

  /**
   * 获取 access_token
   */
  async getAccessToken() {
    // 如果 token 还有效，直接返回
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      const response = await fetch(
        `${this.config.apiBase}/gettoken?corpid=${this.config.corpId}&corpsecret=${this.config.secret}`
      );

      const data = await response.json();

      if (data.errcode !== 0) {
        throw new Error(`获取 token 失败: ${data.errmsg}`);
      }

      this.accessToken = data.access_token;
      // token 有效期 2 小时，提前 5 分钟刷新
      this.tokenExpireTime = Date.now() + (data.expires_in - 300) * 1000;

      console.log('✅ 企业微信 token 已更新');
      return this.accessToken;

    } catch (error) {
      console.error('❌ 获取企业微信 token 失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送消息
   */
  async sendMessage(messageData) {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.apiBase}/message/send?access_token=${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...messageData,
            agentid: this.config.agentId
          })
        }
      );

      const data = await response.json();

      if (data.errcode !== 0) {
        throw new Error(`发送消息失败: ${data.errmsg}`);
      }

      console.log(`✅ 企业微信消息已发送`);

      return {
        success: true,
        messageId: data.msgid,
        invalidUser: data.invaliduser,
        invalidParty: data.invalidparty
      };

    } catch (error) {
      console.error('❌ 发送企业微信消息失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送文本消息
   */
  async sendTextMessage(toUser, content, toParty = null, toTag = null) {
    const messageData = {
      touser: toUser,
      toparty: toParty,
      totag: toTag,
      msgtype: 'text',
      text: {
        content
      },
      safe: 0
    };

    return await this.sendMessage(messageData);
  }

  /**
   * 发送卡片消息
   */
  async sendCardMessage(toUser, title, description, url, btntxt = '详情') {
    const messageData = {
      touser: toUser,
      msgtype: 'textcard',
      textcard: {
        title,
        description,
        url,
        btntxt
      }
    };

    return await this.sendMessage(messageData);
  }

  /**
   * 发送图文消息
   */
  async sendNewsMessage(toUser, articles) {
    const messageData = {
      touser: toUser,
      msgtype: 'news',
      news: {
        articles: articles.map(article => ({
          title: article.title,
          description: article.description,
          url: article.url,
          picurl: article.picurl
        }))
      }
    };

    return await this.sendMessage(messageData);
  }

  /**
   * 发送 Markdown 消息
   */
  async sendMarkdownMessage(toUser, content) {
    const messageData = {
      touser: toUser,
      msgtype: 'markdown',
      markdown: {
        content
      }
    };

    return await this.sendMessage(messageData);
  }

  /**
   * 批量发送消息
   */
  async sendBatchMessages(recipients, message) {
    const results = [];

    // 企业微信支持批量发送（用 | 分隔用户ID）
    const batchSize = 1000; // 企业微信单次最多1000人
    const batches = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      try {
        const userList = batch.map(r => r.id).join('|');
        const result = await this.sendTextMessage(userList, message);

        results.push({
          count: batch.length,
          success: true,
          messageId: result.messageId,
          invalidUsers: result.invalidUser ? result.invalidUser.split('|') : []
        });

        // 速率限制：每分钟最多100次
        await this.delay(600);

      } catch (error) {
        results.push({
          count: batch.length,
          success: false,
          error: error.message
        });
      }
    }

    const totalCount = results.reduce((sum, r) => sum + r.count, 0);
    const successCount = results.filter(r => r.success).reduce((sum, r) => sum + r.count, 0);

    console.log(`📊 批量发送完成: ${successCount}/${totalCount}`);

    return results;
  }

  /**
   * 发送应用菜单消息
   */
  async sendTemplateCardMessage(toUser, card) {
    const messageData = {
      touser: toUser,
      msgtype: 'template_card',
      template_card: card
    };

    return await this.sendMessage(messageData);
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId) {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.config.apiBase}/user/get?access_token=${token}&userid=${userId}`
    );

    const data = await response.json();

    if (data.errcode !== 0) {
      throw new Error(`获取用户信息失败: ${data.errmsg}`);
    }

    return {
      userId: data.userid,
      name: data.name,
      position: data.position,
      mobile: data.mobile,
      email: data.email,
      avatar: data.avatar,
      status: data.status
    };
  }

  /**
   * 获取部门列表
   */
  async getDepartmentList(id = null) {
    const token = await this.getAccessToken();

    let url = `${this.config.apiBase}/department/list?access_token=${token}`;
    if (id) {
      url += `&id=${id}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.errcode !== 0) {
      throw new Error(`获取部门列表失败: ${data.errmsg}`);
    }

    return data.department;
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取适配器状态
   */
  getStatus() {
    return {
      platform: 'wechat',
      configured: !!(this.config.corpId && this.config.agentId && this.config.secret),
      tokenValid: this.accessToken && Date.now() < this.tokenExpireTime
    };
  }
}

module.exports = WeChatAdapter;
