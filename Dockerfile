FROM node:18-alpine

# 安装 Android SDK 和必要的工具
RUN apk add --no-cache \
    openjdk11-jre \
    wget \
    unzip \
    python3 \
    py3-pip \
    git \
    bash

# 下载并安装 Android SDK Platform Tools (包含 adb)
RUN cd /tmp && \
    wget https://dl.google.com/android/repository/platform-tools-latest-linux.zip && \
    unzip platform-tools-latest-linux.zip && \
    mv platform-tools/adb /usr/local/bin/adb && \
    chmod +x /usr/local/bin/adb && \
    rm -rf platform-tools platform-tools-latest-linux.zip

# 创建应用目录
WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 安装依赖
RUN npm install --omit=dev

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p screenshots tmp config

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/devices', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# 启动应用
CMD ["npm", "start"]


