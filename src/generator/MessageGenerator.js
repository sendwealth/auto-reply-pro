/**
 * MessageGenerator - 消息生成引擎
 * 支持 AI 生成和模板渲染
 */

const fetch = require('node-fetch');

class MessageGenerator {
  constructor(config = {}) {
    this.config = {
      aiProvider: config.aiProvider || 'deepseek',
      apiKey: config.apiKey || process.env.DEEPSEEK_API_KEY,
      apiEndpoint: config.apiEndpoint || 'https://api.deepseek.com/v1/chat/completions',
      ...config
    };

    this.templateManager = config.templateManager || null;
  }

  /**
   * 生成个性化消息
   */
  async generatePersonalizedMessage(context) {
    const { recipient, template, variables, useAI } = context;

    // 方式1: 基于模板
    if (template && this.templateManager && !useAI) {
      const personalizedVars = { ...variables, ...recipient };
      return this.templateManager.render(template, personalizedVars);
    }

    // 方式2: AI 生成
    if (useAI || !template) {
      return await this.generateWithAI(recipient, variables);
    }

    // 方式3: 简单变量替换
    return this.simpleRender(template, { ...variables, ...recipient });
  }

  /**
   * 使用 AI 生成消息
   */
  async generateWithAI(recipient, variables) {
    const prompt = this.buildPrompt(recipient, variables);

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的消息助手，擅长生成个性化、友好的商务消息。消息要简洁、专业、有行动号召。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      const data = await response.json();
      const message = data.choices[0].message.content.trim();

      console.log(`✅ AI 消息已生成 (收件人: ${recipient.name})`);

      return message;

    } catch (error) {
      console.error('❌ AI 生成失败:', error.message);
      // 降级到模板
      return this.getFallbackMessage(recipient, variables);
    }
  }

  /**
   * 构建提示词
   */
  buildPrompt(recipient, variables) {
    const { name, company, position, tags } = recipient;
    const { purpose, productName, action } = variables;

    let prompt = `请为以下收件人生成一条个性化的商务消息：\n\n`;
    prompt += `收件人信息：\n`;
    prompt += `- 姓名：${name || '客户'}\n`;
    if (company) prompt += `- 公司：${company}\n`;
    if (position) prompt += `- 职位：${position}\n`;
    if (tags && tags.length > 0) prompt += `- 标签：${tags.join('、')}\n`;

    prompt += `\n消息目的：${purpose || '产品介绍'}\n`;
    if (productName) prompt += `产品名称：${productName}\n`;
    if (action) prompt += `期望行动：${action}\n`;

    prompt += `\n要求：\n`;
    prompt += `1. 语气友好专业，避免过于推销\n`;
    prompt += `2. 个性化，提到收件人的信息\n`;
    prompt += `3. 简洁明了（100字以内）\n`;
    prompt += `4. 包含明确的行动号召\n`;
    prompt += `5. 不要使用表情符号\n\n`;
    prompt += `请直接生成消息内容：`;

    return prompt;
  }

  /**
   * 降级消息
   */
  getFallbackMessage(recipient, variables) {
    const { name } = recipient;
    const { purpose, productName } = variables;

    return `${name ? name + '，' : ''}您好！我是来自 CLAW.AI 的产品经理。想向您介绍我们的新产品 ${productName || 'Auto-Reply Pro'}，${purpose || '可以帮助您提升工作效率'}。如有兴趣，我们可以约个时间详细聊聊。`;
  }

  /**
   * 批量生成
   */
  async generateBatch(recipients, template, commonVariables) {
    const messages = [];

    for (const recipient of recipients) {
      try {
        const message = await this.generatePersonalizedMessage({
          recipient,
          template,
          variables: commonVariables,
          useAI: true
        });

        messages.push({
          recipientId: recipient.id,
          recipientName: recipient.name,
          message,
          success: true
        });

        // 避免触发 API 速率限制
        await this.delay(100);

      } catch (error) {
        messages.push({
          recipientId: recipient.id,
          recipientName: recipient.name,
          message: null,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`✅ 批量生成完成: ${messages.filter(m => m.success).length}/${messages.length}`);

    return messages;
  }

  /**
   * 简单模板渲染
   */
  simpleRender(template, variables) {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, value || '');
    }

    return result;
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取生成统计
   */
  getStats() {
    return {
      provider: this.config.aiProvider,
      templateCount: this.templateManager?.listTemplates()?.length || 0
    };
  }
}

module.exports = MessageGenerator;
