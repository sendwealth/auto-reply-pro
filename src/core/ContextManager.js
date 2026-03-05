/**
 * ContextManager - 上下文管理器
 * 负责管理对话历史、用户状态和会话信息
 */

class ContextManager {
  constructor(config = {}) {
    this.config = {
      maxHistoryLength: config.maxHistoryLength || 10,
      sessionTimeout: config.sessionTimeout || 3600000, // 1小时
      enablePersistence: config.enablePersistence || false,
      ...config
    };

    // 内存存储
    this.sessions = new Map();
    this.userProfiles = new Map();

    // 统计
    this.stats = {
      totalSessions: 0,
      activeSessions: 0,
      averageSessionLength: 0
    };
  }

  /**
   * 获取或创建会话上下文
   */
  async getContext(message) {
    const sessionId = this.getSessionId(message);
    const userId = message.source.userId;

    // 获取或创建会话
    let session = this.sessions.get(sessionId);

    if (!session || this.isSessionExpired(session)) {
      session = await this.createNewSession(sessionId, message);
      this.sessions.set(sessionId, session);
      this.stats.totalSessions++;
    }

    // 更新最后活动时间
    session.lastActivity = Date.now();

    // 获取用户档案
    const userProfile = await this.getUserProfile(userId);

    return {
      session,
      userProfile,
      history: session.history,
      metadata: session.metadata
    };
  }

  /**
   * 更新上下文
   */
  async updateContext(message, response) {
    const sessionId = this.getSessionId(message);

    const session = this.sessions.get(sessionId);
    if (!session) return;

    // 添加到历史记录
    session.history.push({
      timestamp: Date.now(),
      message: {
        text: message.content.text,
        userId: message.source.userId,
        platform: message.source.platform
      },
      response: {
        text: response.content,
        intent: response.intent
      }
    });

    // 限制历史长度
    if (session.history.length > this.config.maxHistoryLength) {
      session.history = session.history.slice(-this.config.maxHistoryLength);
    }

    // 更新会话统计
    session.messageCount++;

    // 更新统计
    this.updateStats();
  }

  /**
   * 创建新会话
   */
  async createNewSession(sessionId, message) {
    return {
      id: sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      history: [],
      metadata: {
        platform: message.source.platform,
        channelId: message.source.channelId,
        startedBy: message.source.userId
      }
    };
  }

  /**
   * 获取会话ID
   */
  getSessionId(message) {
    // 使用 channelId + userId 组合作为会话ID
    // 或者使用 conversationId（如果平台提供）
    return message.context.conversationId ||
           `${message.source.platform}:${message.source.channelId}:${message.source.userId}`;
  }

  /**
   * 检查会话是否过期
   */
  isSessionExpired(session) {
    return Date.now() - session.lastActivity > this.config.sessionTimeout;
  }

  /**
   * 获取用户档案
   */
  async getUserProfile(userId) {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        id: userId,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        messageCount: 0,
        preferences: {},
        tags: []
      });
    }

    const profile = this.userProfiles.get(userId);
    profile.lastSeen = Date.now();
    profile.messageCount++;

    return profile;
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions() {
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (this.isSessionExpired(session)) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 清理了 ${cleaned} 个过期会话`);
    }

    this.updateStats();
    return cleaned;
  }

  /**
   * 获取上下文摘要（用于 AI 提示）
   */
  getContextSummary(context) {
    const { session, userProfile, history } = context;

    let summary = `用户ID: ${userProfile.id}\n`;
    summary += `平台: ${session.metadata.platform}\n`;
    summary += `会话消息数: ${session.messageCount}\n`;

    if (history.length > 0) {
      summary += `\n最近对话:\n`;
      const recentHistory = history.slice(-3);
      recentHistory.forEach((item, index) => {
        summary += `${index + 1}. 用户: ${item.message.text}\n`;
        summary += `   回复: ${item.response.text}\n`;
      });
    }

    return summary;
  }

  /**
   * 更新统计信息
   */
  updateStats() {
    this.stats.activeSessions = this.sessions.size;

    if (this.sessions.size > 0) {
      let totalLength = 0;
      for (const session of this.sessions.values()) {
        totalLength += session.messageCount;
      }
      this.stats.averageSessionLength = Math.round(totalLength / this.sessions.size);
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    this.updateStats();
    return {
      ...this.stats,
      totalUsers: this.userProfiles.size,
      timestamp: Date.now()
    };
  }

  /**
   * 导出数据（用于持久化）
   */
  export() {
    return {
      sessions: Array.from(this.sessions.entries()),
      userProfiles: Array.from(this.userProfiles.entries()),
      stats: this.stats
    };
  }

  /**
   * 导入数据（用于恢复）
   */
  import(data) {
    if (data.sessions) {
      this.sessions = new Map(data.sessions);
    }
    if (data.userProfiles) {
      this.userProfiles = new Map(data.userProfiles);
    }
    if (data.stats) {
      this.stats = data.stats;
    }
    console.log('✅ 上下文数据已恢复');
  }
}

module.exports = ContextManager;
