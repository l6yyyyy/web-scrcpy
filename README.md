# Web Scrcpy

📱 基于 Web 的 Android 设备投屏和控制工具

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-support-blue.svg)](https://www.docker.com/)

## ✨ 功能特性

- 🖥️ **Web 界面**: 无需安装客户端,通过浏览器直接访问
- 📡 **实时投屏**: 使用 WebSocket 实现实时屏幕镜像
- 🎮 **设备控制**: 支持触摸、滑动手势、按键操作
- 🔌 **多设备支持**: 同时管理多个 Android 设备
- 🚀 **Docker 部署**: 完美适配飞牛NAS等 Docker 环境
- 📱 **无线连接**: 支持 ADB 无线调试连接

## 🏗️ 技术栈

- **后端**: Node.js + Express + Socket.IO
- **前端**: 原生 JavaScript + Canvas API
- **ADB**: Android Debug Bridge
- **容器**: Docker + Docker Compose

## 📦 快速开始

### 方法一: Docker 部署(推荐)

#### 飞牛NAS 部署

1. **克隆项目到飞牛NAS**
   ```bash
   git clone https://github.com/yourusername/web-scrcpy.git
   cd web-scrcpy
   ```

2. **使用 Docker Compose 启动**
   ```bash
   docker-compose up -d
   ```

3. **访问 Web 界面**
   ```
   http://飞牛NAS_IP:3000
   ```

#### 其他平台部署

```bash
# 克隆项目
git clone https://github.com/yourusername/web-scrcpy.git
cd web-scrcpy

# 使用 Docker Compose
docker-compose up -d

# 或者使用 Docker 命令
docker build -t web-scrcpy .
docker run -d --name web-scrcpy -p 3000:3000 --network host web-scrcpy
```

### 方法二: 本地开发

#### 环境要求

- Node.js 16+ 
- ADB (Android Debug Bridge)
- Android 设备 (5.0+)

#### 安装步骤

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置 ADB**
   
   - 下载 [Android SDK Platform Tools](https://developer.android.com/studio/releases/platform-tools)
   - 解压并将 adb 添加到系统 PATH

3. **启动服务**
   ```bash
   npm start
   ```

4. **访问应用**
   ```
   http://localhost:3000
   ```

## 📱 使用说明

### 1. 连接 Android 设备

#### USB 连接

1. 在手机上开启 USB 调试
   - 进入「设置」→「关于手机」
   - 连续点击「版本号」7次,开启开发者模式
   - 进入「开发者选项」→ 开启「USB 调试」

2. 使用 USB 线连接设备

3. 授权电脑 USB 调试

#### 无线连接

1. 确保手机和 NAS 在同一局域网

2. 在手机上开启「无线调试」
   - 进入「开发者选项」→「无线调试」
   - 获取 IP 地址和端口

3. 在 Web 界面中输入设备的 IP 地址和端口
   - 默认端口: 5555

### 2. 开始投屏

1. 在设备列表中选择要投屏的设备

2. 点击「开始投屏」按钮

3. 等待屏幕镜像加载

### 3. 控制设备

#### 触摸控制

- 直接点击屏幕画面模拟触摸操作

#### 虚拟按键

- **HOME**: 返回主页
- **返回**: 返回上一级
- **音量+**: 增大音量
- **音量-**: 减小音量
- **电源**: 电源键
- **Menu**: 菜单键

## 🔧 配置说明

### 环境变量

可以在 `docker-compose.yml` 中配置以下环境变量:

```yaml
environment:
  - NODE_ENV=production      # 运行环境
  - PORT=3000                 # 服务端口
  - TZ=Asia/Shanghai          # 时区
```

### 端口映射

- **3000**: Web 服务端口

### 目录挂载

```yaml
volumes:
  - ./config:/app/config      # 配置文件
  - ./screenshots:/app/screenshots  # 截图缓存
  - ./tmp:/app/tmp            # 临时文件
```

## 📁 项目结构

```
web-scrcpy/
├── adbManager.js          # ADB 管理模块
├── server.js              # 主服务器
├── package.json           # 依赖配置
├── Dockerfile             # Docker 镜像
├── docker-compose.yml     # Docker Compose 配置
├── public/
│   └── index.html         # 前端页面
├── screenshots/           # 截图缓存目录
├── tmp/                   # 临时文件目录
└── README.md              # 项目文档
```

## 🔍 故障排除

### 无法发现设备

1. 检查 USB 调试是否开启
2. 尝试重新连接 USB 线
3. 检查 ADB 服务是否正常运行
   ```bash
   adb devices
   ```

### 无线连接失败

1. 确认设备在局域网内
2. 检查防火墙设置
3. 尝试使用 host 网络模式

### 投屏卡顿

1. 减少投屏刷新率(修改 server.js 中的间隔时间)
2. 检查网络连接质量
3. 降低屏幕分辨率

### Docker 容器无法启动

1. 检查端口是否被占用
2. 查看容器日志:
   ```bash
   docker logs web-scrcpy
   ```

## 🔒 安全建议

1. **限制访问**: 在生产环境中,建议配置反向代理(如 Nginx)并添加认证
2. **网络安全**: 不要在公网环境中直接暴露服务
3. **设备授权**: 仅连接可信的 Android 设备

## 📄 License

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📮 联系方式

- GitHub Issues: [提交问题](https://github.com/yourusername/web-scrcpy/issues)

## 🙏 致谢

- [scrcpy](https://github.com/Genymobile/scrcpy) - 原始项目灵感来源
- [adb](https://developer.android.com/studio/command-line/adb) - Android Debug Bridge

---

**注意**: 本项目仅供学习和个人使用,请遵守相关法律法规。
