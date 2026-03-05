FROM node:18-alpine

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S auto-reply -u 1001 -G nodejs

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 复制源代码
COPY . .

# 更改文件所有者
RUN chown -R auto-reply:nodejs /app

# 切换到非 root 用户
USER auto-reply

# 暴露端口
EXPOSE 3002 3003

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "src/index-secure.js"]
