# 快速开始指南

5 分钟内在飞牛NAS上部署 Web Scrcpy!

## 🚀 最快部署方式(3步)

### 第 1 步: 克隆项目

在飞牛NAS 的终端或 SSH 中执行:

```bash
cd /volume1/docker
git clone https://github.com/你的用户名/web-scrcpy.git
cd web-scrcpy
```

### 第 2 步: 启动服务

```bash
docker-compose up -d
```

### 第 3 步: 访问应用

在浏览器中打开:
```
http://你的NAS_IP:3000
```

## 📱 连接你的第一个设备

### 方式一: 无线连接(最简单)

1. 在手机上:
   - 进入「设置」→「关于手机」
   - 连续点击「版本号」7次开启开发者模式
   - 进入「开发者选项」→「无线调试」
   - 记下显示的 IP 地址(如: 192.168.1.100)

2. 在 Web 界面:
   - 输入手机的 IP 地址
   - 端口保持 5555
   - 点击「连接设备」

3. 在手机上授权调试

4. 在设备列表中选择设备,点击「开始投屏」

完成! 🎉

## ⚡ 常用命令

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新项目
git pull && docker-compose up -d --build
```

## 🆘 遇到问题?

### 看不到设备?

```bash
# 检查 ADB 连接
docker exec -it web-scrcpy adb devices
```

### 无法连接?

1. 确认手机和 NAS 在同一网络
2. 检查手机是否开启「无线调试」
3. 尝试重启 Docker 容器

### 投屏卡顿?

1. 检查网络速度
2. 关闭其他占用网络的程序
3. 考虑使用有线连接

## 📚 更多信息

- [完整文档](README.md)
- [部署指南](DEPLOYMENT.md)
- [GitHub 上传指南](../GITHUB_UPLOAD_GUIDE.md)

---

祝你使用愉快! 🎊
