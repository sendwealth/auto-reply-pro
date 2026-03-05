/**
 * EmailAdapter - 邮件平台适配器
 * 支持发送文本、HTML、带附件的邮件
 */

const nodemailer = require('nodemailer');

class EmailAdapter {
  constructor(config = {}) {
    this.config = {
      host: config.host || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: config.port || process.env.SMTP_PORT || 587,
      secure: config.secure || false,
      user: config.user || process.env.SMTP_USER,
      pass: config.pass || process.env.SMTP_PASS,
      from: config.from || process.env.SMTP_FROM,
      ...config
    };

    this.transporter = null;
    this.isConnected = false;
  }

  /**
   * 创建邮件传输器
   */
  async connect() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.pass
        }
      });

      // 验证连接
      await this.transporter.verify();
      this.isConnected = true;

      console.log('✅ 邮件服务器连接成功');
      console.log(`📧 SMTP: ${this.config.host}:${this.config.port}`);

    } catch (error) {
      console.error('❌ 邮件服务器连接失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送邮件
   */
  async sendEmail(to, subject, content, options = {}) {
    if (!this.transporter) {
      await this.connect();
    }

    try {
      const mailOptions = {
        from: this.config.from,
        to,
        subject,
        text: content,
        html: options.html || null,
        attachments: options.attachments || []
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`✅ 邮件已发送: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };

    } catch (error) {
      console.error('❌ 发送邮件失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送文本邮件
   */
  async sendTextEmail(to, subject, content) {
    return await this.sendEmail(to, subject, content);
  }

  /**
   * 发送 HTML 邮件
   */
  async sendHtmlEmail(to, subject, htmlContent) {
    return await this.sendEmail(to, subject, '', { html: htmlContent });
  }

  /**
   * 发送带附件的邮件
   */
  async sendEmailWithAttachments(to, subject, content, attachments) {
    return await this.sendEmail(to, subject, content, { attachments });
  }

  /**
   * 批量发送邮件
   */
  async sendBatchEmails(recipients, subject, contentGenerator) {
    const results = [];

    for (const recipient of recipients) {
      try {
        // 生成个性化内容
        const personalizedContent = typeof contentGenerator === 'function'
          ? await contentGenerator(recipient)
          : contentGenerator;

        const personalizedSubject = `${subject} - ${recipient.name || ''}`.trim();

        const result = await this.sendEmail(
          recipient.email || recipient.id,
          personalizedSubject,
          personalizedContent
        );

        results.push({
          recipientId: recipient.id,
          success: true,
          messageId: result.messageId
        });

        // 速率限制：每秒最多1封
        await this.delay(1000);

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
   * 发送模板邮件
   */
  async sendTemplateEmail(to, templateData) {
    const { subject, template, variables } = templateData;

    // 简单的模板渲染
    let content = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(placeholder, value || '');
    }

    return await this.sendEmail(to, subject, content);
  }

  /**
   * 发送通知邮件
   */
  async sendNotification(to, title, message, link = null) {
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${title}</h2>
        <p style="color: #666; line-height: 1.6;">${message}</p>
        ${link ? `<a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">查看详情</a>` : ''}
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">此邮件由 Auto-Reply Pro 自动发送</p>
      </div>
    `;

    return await this.sendHtmlEmail(to, title, html);
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 关闭连接
   */
  async disconnect() {
    if (this.transporter) {
      this.transporter.close();
      this.isConnected = false;
      console.log('🔌 邮件适配器已断开');
    }
  }

  /**
   * 获取适配器状态
   */
  getStatus() {
    return {
      platform: 'email',
      configured: !!(this.config.user && this.config.pass),
      connected: this.isConnected,
      host: this.config.host
    };
  }
}

module.exports = EmailAdapter;
