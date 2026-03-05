/**
 * TemplateManager - 模板管理器
 * 管理回复模板，支持变量替换和条件渲染
 */

class TemplateManager {
  constructor(config = {}) {
    this.config = {
      templateDir: config.templateDir || './templates',
      defaultLanguage: config.defaultLanguage || 'zh-CN',
      ...config
    };

    // 模板存储
    this.templates = new Map();

    // 加载默认模板
    this.loadDefaultTemplates();
  }

  /**
   * 加载默认模板
   */
  loadDefaultTemplates() {
    // 问候模板
    this.registerTemplate('greeting', {
      zh: '您好！我是智能客服助手，很高兴为您服务。请问有什么可以帮助您的吗？',
      en: 'Hello! I\'m your intelligent customer service assistant. How can I help you today?'
    });

    // 价格咨询模板
    this.registerTemplate('pricing', {
      zh: '感谢您对我们产品的关注！我们的定价方案如下：\n\n基础版：¥99/月\n专业版：¥299/月\n企业版：¥999/月\n\n需要我为您详细介绍吗？',
      en: 'Thank you for your interest! Our pricing plans are:\n\nBasic: $15/month\nPro: $45/month\nEnterprise: $150/month\n\nWould you like more details?'
    });

    // 功能介绍模板
    this.registerTemplate('features', {
      zh: '我们的产品具有以下核心功能：\n\n1. 🤖 AI 智能回复\n2. 🚀 多平台支持\n3. ⚡ 实时响应\n4. 📊 数据分析\n\n想了解具体哪个功能？',
      en: 'Our product offers these core features:\n\n1. 🤖 AI-powered responses\n2. 🚀 Multi-platform support\n3. ⚡ Real-time response\n4. 📊 Analytics\n\nWhich feature interests you?'
    });

    // 技术支持模板
    this.registerTemplate('support', {
      zh: '我理解您遇到了技术问题。请告诉我：\n\n1. 问题的具体表现\n2. 使用的平台（Discord/Web/Email）\n3. 错误信息（如有）\n\n我会尽快为您解决！',
      en: 'I understand you\'re experiencing an issue. Please tell me:\n\n1. What\'s the problem?\n2. Which platform are you using?\n3. Any error messages?\n\nI\'ll help you resolve it quickly!'
    });

    // 演示请求模板
    this.registerTemplate('demo', {
      zh: '太好了！我可以为您安排产品演示。请提供：\n\n1. 您的公司名称\n2. 联系方式（邮箱/电话）\n3. 方便的时间\n\n我们的团队会尽快联系您！',
      en: 'Great! I\'d love to schedule a demo for you. Please provide:\n\n1. Company name\n2. Contact info\n3. Preferred time\n\nOur team will reach out soon!'
    });

    // 通用兜底模板
    this.registerTemplate('fallback', {
      zh: '抱歉，我没有完全理解您的问题。您可以：\n\n1. 重新描述一下\n2. 选择具体话题：价格、功能、技术支持\n3. 联系人工客服\n\n我会尽力帮助您！',
      en: 'Sorry, I didn\'t quite understand. You can:\n\n1. Rephrase your question\n2. Choose a topic: pricing, features, support\n3. Contact human support\n\nI\'m here to help!'
    });

    // 感谢模板
    this.registerTemplate('thanks', {
      zh: '不客气！很高兴能帮助到您。如果还有其他问题，随时告诉我！😊',
      en: 'You\'re welcome! Happy to help. Feel free to ask if you have more questions! 😊'
    });

    // 再见模板
    this.registerTemplate('goodbye', {
      zh: '感谢您的咨询！祝您有美好的一天！👋',
      en: 'Thank you for chatting! Have a great day! 👋'
    });
  }

  /**
   * 注册模板
   */
  registerTemplate(name, template) {
    this.templates.set(name, template);
    console.log(`✅ 模板已注册: ${name}`);
  }

  /**
   * 获取模板
   */
  getTemplate(name, language = this.config.defaultLanguage) {
    const template = this.templates.get(name);

    if (!template) {
      console.warn(`⚠️ 模板未找到: ${name}`);
      return this.templates.get('fallback')[language] || this.templates.get('fallback')['en'];
    }

    // 如果模板是字符串，直接返回
    if (typeof template === 'string') {
      return template;
    }

    // 如果模板是多语言对象，返回对应语言
    return template[language] || template['en'] || template[Object.keys(template)[0]];
  }

  /**
   * 渲染模板（替换变量）
   */
  render(templateName, variables = {}, language = this.config.defaultLanguage) {
    let template = this.getTemplate(templateName, language);

    // 替换变量 {{variable}}
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(placeholder, value);
    }

    return template;
  }

  /**
   * 根据意图获取合适的模板
   */
  getTemplateForIntent(intent, language = this.config.defaultLanguage) {
    const intentTemplateMap = {
      'greeting': 'greeting',
      'pricing': 'pricing',
      'features': 'features',
      'support': 'support',
      'demo': 'demo',
      'thanks': 'thanks',
      'goodbye': 'goodbye',
      'general': 'fallback'
    };

    const templateName = intentTemplateMap[intent] || 'fallback';
    return this.getTemplate(templateName, language);
  }

  /**
   * 添加自定义模板
   */
  addCustomTemplate(name, template) {
    this.registerTemplate(name, template);
  }

  /**
   * 列出所有模板
   */
  listTemplates() {
    return Array.from(this.templates.keys());
  }

  /**
   * 导出所有模板
   */
  exportTemplates() {
    return Object.fromEntries(this.templates);
  }

  /**
   * 导入模板
   */
  importTemplates(templates) {
    for (const [name, template] of Object.entries(templates)) {
      this.registerTemplate(name, template);
    }
    console.log(`✅ 导入了 ${Object.keys(templates).length} 个模板`);
  }
}

module.exports = TemplateManager;
