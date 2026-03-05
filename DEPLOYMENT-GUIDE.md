# Auto-Reply Pro - 部署指南

**更新时间**: 2026-03-05 12:00
**适用版本**: v1.0
**部署难度**: ⭐⭐☆☆☆

---

## 🚀 快速部署

### 方式1: Docker 部署（推荐）

```bash
# 1. 克隆项目
cd ~/clawd/products/auto-reply-pro

# 2. 配置环境变量
cp .env.example .env
nano .env

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

# 5. 访问服务
# - Web Chat: http://localhost:3002
# - 管理面板: http://localhost:3003
```

### 方式2: 本地部署

```bash
# 1. 安装依赖
npm install

# 2. 配置环境
cp .env.example .env
nano .env

# 3. 启动服务
node src/index-full.js

# 或使用 PM2
npm install -g pm2
pm2 start src/index-full.js --name auto-reply-pro
pm2 save
pm2 startup
```

### 方式3: 一键部署脚本

```bash
# 使用快速启动脚本
./scripts/quick-start.sh
```

---

## 📋 部署前检查

### 使用环境检查工具

```bash
# 安装 dotenv（如果未安装）
npm install dotenv

# 运行检查
node scripts/check-env.js
```

**检查项目**:
- ✅ Node.js 版本（>= 16）
- ✅ 必需依赖
- ✅ 环境变量配置
- ✅ 端口可用性

---

## 🔧 环境配置

### 必需配置

```bash
# .env 文件

# AI 配置（必需）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Web 服务端口
PORT=3002
DASHBOARD_PORT=3003
```

### 平台配置（至少配置一个）

```bash
# 飞书
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 企业微信
WECHAT_CORP_ID=wwxxxxxxxxxxxxxxxx
WECHAT_AGENT_ID=1000001
WECHAT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Discord
DISCORD_BOT_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 邮件
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Auto-Reply Pro <your_email@gmail.com>"
```

---

## 🐳 Docker 部署详解

### Docker Compose 配置

```yaml
version: '3.8'

services:
  auto-reply-pro:
    build: .
    container_name: auto-reply-pro
    restart: unless-stopped
    ports:
      - "3002:3002"
      - "3003:3003"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Docker 命令

```bash
# 构建镜像
docker build -t auto-reply-pro:latest .

# 运行容器
docker run -d \
  --name auto-reply-pro \
  -p 3002:3002 \
  -p 3003:3003 \
  --env-file .env \
  --restart unless-stopped \
  auto-reply-pro:latest

# 查看日志
docker logs -f auto-reply-pro

# 进入容器
docker exec -it auto-reply-pro sh

# 停止容器
docker stop auto-reply-pro

# 删除容器
docker rm auto-reply-pro
```

---

## 🔐 生产环境配置

### Nginx 反向代理

```nginx
# /etc/nginx/sites-available/auto-reply-pro

server {
    listen 80;
    server_name your-domain.com;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Web Chat API
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Web Dashboard
    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL 证书（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 📊 监控与日志

### 日志管理

```bash
# 查看应用日志
tail -f logs/app.log

# 使用 PM2 日志
pm2 logs auto-reply-pro

# Docker 日志
docker-compose logs -f
```

### 性能监控

```bash
# PM2 监控
pm2 monit

# 安装 PM2 监控面板
pm2 install pm2-logrotate
```

---

## 🔄 更新与维护

### 更新应用

```bash
# Docker 部署
git pull
docker-compose down
docker-compose build
docker-compose up -d

# PM2 部署
git pull
npm install
pm2 restart auto-reply-pro
```

### 备份数据

```bash
# 备份配置和数据
tar -czf auto-reply-backup-$(date +%Y%m%d).tar.gz \
  .env \
  data/ \
  logs/
```

---

## 🚨 故障排查

### 常见问题

#### 1. 端口被占用

```bash
# 检查端口占用
lsof -i :3002
lsof -i :3003

# 终止进程
kill -9 <PID>
```

#### 2. 环境变量未加载

```bash
# 检查 .env 文件
cat .env

# 测试环境变量
node -e "require('dotenv').config(); console.log(process.env.DEEPSEEK_API_KEY)"
```

#### 3. Docker 容器无法启动

```bash
# 查看容器日志
docker logs auto-reply-pro

# 检查容器状态
docker ps -a

# 重新构建
docker-compose build --no-cache
```

---

## 🎯 性能优化

### Node.js 优化

```bash
# 启用集群模式
pm2 start src/index-full.js -i max

# 设置内存限制
pm2 start src/index-full.js --max-memory-restart 500M
```

### Redis 缓存（可选）

```bash
# 启动 Redis
docker run -d --name redis -p 6379:6379 redis:alpine

# 配置应用使用 Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 📞 技术支持

- **文档**: 查看 `DEPLOYMENT-GUIDE.md`
- **问题**: 查看 `TROUBLESHOOTING.md`
- **社区**: GitHub Issues

---

**部署完成后**:
1. ✅ 检查服务状态
2. ✅ 测试各平台功能
3. ✅ 配置监控告警
4. ✅ 设置自动备份

---

**更新时间**: 2026-03-05 12:00
**版本**: v1.0
