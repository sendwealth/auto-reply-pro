/**
 * FeishuAdapter - 飞书平台适配器
 * 支持发送文本、富文本、卡片消息
 */

const fetch = require('node-fetch');

class FeishuAdapter {
  constructor(config = {}) {
    this.config = {
      appId: config.appId || process.env.FEISHU_APP_ID,
      appSecret: config.appSecret || process.env.FEISHU_APP_SECRET,
      apiBase: 'https://open.feishu.cn/open-apis',
      ...config
    };

    this.tenantToken = null;
    this.tokenExpireTime = 0;
  }

  /**
   * 获取 tenant_access_token
   */
  async getTenantToken() {
    // 如果 token 还有效，直接返回
    if (this.tenantToken && Date.now() < this.tokenExpireTime) {
      return this.tenantToken;
    }

    try {
      const response = await fetch(`${this.config.apiBase}/auth/v3/tenant_access_token/internal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: this.config.appId,
          app_secret: this.config.appSecret
        })
      });

      const data = await response.json();

      if (data.code !== 0) {
        throw new Error(`获取 token 失败: ${data.msg}`);
      }

      this.tenantToken = data.tenant_access_token;
      // token 有效期 2 小时，提前 5 分钟刷新
      this.tokenExpireTime = Date.now() + (data.expire - 300) * 1000;

      console.log('✅ 飞书 token 已更新');
      return this.tenantToken;

    } catch (error) {
      console.error('❌ 获取飞书 token 失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送消息
   */
  async sendMessage(receiveId, receiveIdType, msgType, content) {
    const token = await this.getTenantToken();

    try {
      const response = await fetch(
        `${this.config.apiBase}/im/v1/messages?receive_id_type=${receiveIdType}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            receive_id: receiveId,
            msg_type: msgType,
            content: typeof content === 'string' ? content : JSON.stringify(content)
          })
        }
      );

      const data = await response.json();

      if (data.code !== 0) {
        throw new Error(`发送消息失败: ${data.msg}`);
      }

      console.log(`✅ 飞书消息已发送 (${receiveIdType}: ${receiveId})`);

      return {
        success: true,
        messageId: data.data?.message_id,
        createTime: data.data?.create_time
      };

    } catch (error) {
      console.error('❌ 发送飞书消息失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送文本消息
   */
  async sendTextMessage(receiveId, receiveIdType, text) {
    return await this.sendMessage(receiveId, receiveIdType, 'text', {
      text
    });
  }

  /**
   * 发送富文本消息
   */
  async sendRichMessage(receiveId, receiveIdType, title, content) {
    const richContent = {
      zh_cn: {
        title,
        content: [
          [
            { tag: 'text', text: content }
          ]
        ]
      }
    };

    return await this.sendMessage(receiveId, receiveIdType, 'post', richContent);
  }

  /**
   * 发送卡片消息
   */
  async sendCardMessage(receiveId, receiveIdType, card) {
    return await this.sendMessage(receiveId, receiveIdType, 'interactive', card);
  }

  /**
   * 批量发送消息
   */
  async sendBatchMessages(recipients, message) {
    const results = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendTextMessage(
          recipient.id,
          recipient.type || 'open_id',
          message
        );

        results.push({
          recipientId: recipient.id,
          success: true,
          messageId: result.messageId
        });

        // 速率限制：每秒最多5条
        await this.delay(200);

      } catch (error) {
        results.push({
          recipientId: recipient.id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`📊 批量发送完成: ${successCount}/${results.length}`);

    return results;
  }

  /**
   * 发送简单通知卡片
   */
  async sendNotification(receiveId, receiveIdType, title, content, link) {
    const card = {
      config: {
        wide_screen_mode: true
      },
      elements: [
        {
          tag: 'div',
          text: {
            content,
            tag: 'lark_md'
          }
        }
      ]
    };

    if (link) {
      card.elements.push({
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              content: '查看详情',
              tag: 'plain_text'
            },
            url: link,
            type: 'primary'
          }
        ]
      });
    }

    return await this.sendCardMessage(receiveId, receiveIdType, card);
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId) {
    const token = await this.getTenantToken();

    const response = await fetch(
      `${this.config.apiBase}/contact/v3/users/${userId}?user_id_type=open_id`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(`获取用户信息失败: ${data.msg}`);
    }

    return data.data.user;
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
      platform: 'feishu',
      configured: !!(this.config.appId && this.config.appSecret),
      tokenValid: this.tenantToken && Date.now() < this.tokenExpireTime
    };
  }
}

module.exports = FeishuAdapter;
