# 飞牛NAS 部署指南

本文档详细介绍如何在飞牛NAS上部署 Web Scrcpy。

## 📋 前置条件

- 飞牛NAS 系统已安装 Docker
- 飞牛NAS 与 Android 设备在同一局域网
- 有 SSH 访问权限(可选)

## 🚀 部署步骤

### 方案一: 通过飞牛NAS Docker 界面部署

#### 1. 准备工作

1. 登录飞牛NAS 管理界面
2. 进入「应用中心」→「Docker」
3. 确认 Docker 服务已启动

#### 2. 下载项目

在飞牛NAS 上执行以下命令:

```bash
# SSH 登录到飞牛NAS
ssh admin@你的NAS_IP

# 克隆项目
cd /volume1/docker  # 或其他你喜欢的目录
git clone https://github.com/yourusername/web-scrcpy.git
cd web-scrcpy

# 如果无法使用 git,可以先在本地下载然后上传到 NAS
```

#### 3. 使用 Docker Compose 启动

1. 在飞牛NAS Docker 界面中:
   - 点击「项目」→「新增」
   - 项目名称: `web-scrcpy`
   - 路径: 选择刚才克隆的项目目录
   - 选择「使用 Docker Compose」
   - 粘贴以下配置:

```yaml
version: '3.8'

services:
  web-scrcpy:
    build: .
    container_name: web-scrcpy
    restart: unless-stopped
    network_mode: host
    environment:
      - NODE_ENV=production
      - PORT=3000
      - TZ=Asia/Shanghai
    volumes:
      - ./config:/app/config
      - ./screenshots:/app/screenshots
      - ./tmp:/app/tmp
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
```

2. 点击「完成」,容器将自动构建和启动

#### 4. 访问应用

打开浏览器,访问:
```
http://你的NAS_IP:3000
```

### 方案二: 命令行部署

如果你喜欢使用 SSH 命令行:

```bash
# SSH 登录飞牛NAS
ssh admin@你的NAS_IP

# 进入 Docker 目录
cd /volume1/docker

# 克隆项目
git clone https://github.com/yourusername/web-scrcpy.git
cd web-scrcpy

# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看运行状态
docker-compose ps
```

## 📱 连接 Android 设备

### 方法一: USB 连接(推荐用于首次连接)

1. 在 Android 设备上开启 USB 调试:
   - 进入「设置」→「关于手机」
   - 连续点击「版本号」7次
   - 进入「开发者选项」→ 开启「USB 调试」

2. 使用 USB 线将设备连接到飞牛NAS

3. 在 Web 界面中授权 USB 调试

### 方法二: 无线连接(推荐用于日常使用)

1. 确保手机和 NAS 在同一局域网

2. 在手机上开启「无线调试」:
   - 进入「开发者选项」→「无线调试」
   - 记下显示的 IP 地址和端口(通常是 5555)

3. 在 Web 界面的「连接设备」区域:
   - 输入手机的 IP 地址
   - 端口保持 5555
   - 点击「连接设备」

4. 在手机上授权调试

## ⚙️ 配置优化

### 网络模式

默认使用 `network_mode: host`,这样可以:
- 直接访问局域网中的设备
- 更好的性能
- 简化端口配置

如果 host 模式不可用,可以使用桥接模式:

```yaml
services:
  web-scrcpy:
    build: .
    container_name: web-scrcpy
    restart: unless-stopped
    ports:
      - "3000:3000"
    # 其他配置...
```

### 资源限制

根据飞牛NAS 配置调整资源限制:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'        # CPU 核心数
      memory: 1G       # 最大内存
    reservations:
      cpus: '0.5'      # 保留 CPU
      memory: 256M     # 保留内存
```

### 自动启动

配置 `restart: unless-stopped` 确保容器:
- 自动启动
- 崩溃后自动重启
- 可以手动停止

### 日志管理

防止日志占用过多空间:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"    # 单个日志文件最大 10MB
    max-file: "3"      # 保留最近 3 个日志文件
```

## 🔧 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 查看状态
docker-compose ps

# 更新项目
cd /volume1/docker/web-scrcpy
git pull
docker-compose down
docker-compose up -d --build

# 进入容器调试
docker exec -it web-scrcpy sh

# 测试 ADB 连接
docker exec -it web-scrcpy adb devices
```

## 🐛 故障排除

### 1. 容器无法启动

检查端口占用:
```bash
docker ps
netstat -tuln | grep 3000
```

查看日志:
```bash
docker logs web-scrcpy
```

### 2. 无法连接设备

测试 ADB:
```bash
docker exec -it web-scrcpy adb devices
```

检查网络模式:
- 确认使用 `network_mode: host`
- 或正确配置端口映射

### 3. 投屏卡顿

优化配置:
- 减少投屏刷新率(修改 server.js)
- 检查网络连接
- 调整资源限制

### 4. 权限问题

如果遇到权限错误,尝试:
```yaml
services:
  web-scrcpy:
    # ... 其他配置
    privileged: true
```

## 🔒 安全建议

1. **限制访问范围**:
   ```yaml
   environment:
     - ALLOWED_IPS=192.168.1.0/24  # 只允许局域网访问
   ```

2. **使用 HTTPS**(需要配置反向代理):
   ```yaml
   # 使用 Nginx 反向代理
   services:
     nginx:
       image: nginx:alpine
       ports:
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
   ```

3. **添加认证**:
   - 配置 Nginx Basic Auth
   - 或使用 OAuth2 认证

## 📊 监控和维护

### 查看资源使用

```bash
# 查看容器资源使用
docker stats web-scrcpy

# 查看 ADB 连接
docker exec -it web-scrcpy adb devices -l
```

### 定期清理

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的卷
docker volume prune
```

### 备份配置

```bash
# 备份配置文件
tar -czf web-scrcpy-backup-$(date +%Y%m%d).tar.gz \
  /volume1/docker/web-scrcpy/config \
  /volume1/docker/web-scrcpy/screenshots
```

## 🎯 最佳实践

1. **使用固定 IP**: 为飞牛NAS 设置静态 IP
2. **定期更新**: 定期 pull 最新代码和镜像
3. **监控日志**: 定期检查错误日志
4. **备份数据**: 备份重要的配置和数据
5. **限制资源**: 根据实际需求设置合理的资源限制

## 📞 获取帮助

如果遇到问题:
1. 查看日志文件
2. 检查 GitHub Issues
3. 提交新的 Issue 并附上详细的错误信息

---

祝您使用愉快! 🎉
