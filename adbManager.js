const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ADBManager {
  constructor() {
    this.devices = new Map();
    this.screenshotDir = path.join(__dirname, 'screenshots');
    this.ensureScreenshotDir();
  }

  ensureScreenshotDir() {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async getDevices() {
    return new Promise((resolve, reject) => {
      const adb = spawn('adb', ['devices', '-l']);
      let output = '';

      adb.stdout.on('data', (data) => {
        output += data.toString();
      });

      adb.on('close', (code) => {
        const lines = output.split('\n').filter(line => line.trim());
        const devices = [];

        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].trim().split(/\s+/);
          if (parts.length >= 2) {
            const deviceId = parts[0];
            const status = parts[1];
            
            let model = 'Unknown';
            let product = 'Unknown';
            
            for (let j = 2; j < parts.length; j++) {
              if (parts[j].startsWith('model:')) {
                model = parts[j].substring(6);
              } else if (parts[j].startsWith('product:')) {
                product = parts[j].substring(8);
              }
            }

            devices.push({
              id: deviceId,
              status,
              model,
              product,
              connected: status === 'device'
            });
          }
        }

        resolve(devices);
      });

      adb.on('error', reject);
    });
  }

  async connectDevice(ip, port = 5555) {
    return new Promise((resolve, reject) => {
      const adb = spawn('adb', ['connect', `${ip}:${port}`]);
      let output = '';

      adb.stdout.on('data', (data) => {
        output += data.toString();
      });

      adb.on('close', (code) => {
        if (output.includes('connected')) {
          resolve({ success: true, message: output.trim() });
        } else {
          resolve({ success: false, message: output.trim() });
        }
      });

      adb.on('error', reject);
    });
  }

  async disconnectDevice(deviceId) {
    return new Promise((resolve, reject) => {
      const adb = spawn('adb', ['disconnect', deviceId]);
      adb.on('close', (code) => {
        resolve({ success: true });
      });
      adb.on('error', reject);
    });
  }

  async captureScreen(deviceId) {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const filename = `screen_${deviceId}_${timestamp}.png`;
      const filepath = path.join(this.screenshotDir, filename);

      const adb = spawn('adb', ['-s', deviceId, 'shell', 'screencap', '-p', '/sdcard/screen.png']);

      adb.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error('Screenshot failed'));
          return;
        }

        const pull = spawn('adb', ['-s', deviceId, 'pull', '/sdcard/screen.png', filepath]);
        
        pull.on('close', async (code2) => {
          if (code2 === 0 && fs.existsSync(filepath)) {
            const imageData = fs.readFileSync(filepath);
            fs.unlinkSync(filepath);
            
            // Delete from device
            spawn('adb', ['-s', deviceId, 'shell', 'rm', '/sdcard/screen.png']);
            
            resolve({
              success: true,
              data: `data:image/png;base64,${imageData.toString('base64')}`
            });
          } else {
            reject(new Error('Failed to pull screenshot'));
          }
        });

        pull.on('error', reject);
      });

      adb.on('error', reject);
    });
  }

  async sendTouchEvent(deviceId, x, y, action = 'tap') {
    return new Promise((resolve, reject) => {
      let command;
      
      switch (action) {
        case 'tap':
          command = `input tap ${x} ${y}`;
          break;
        case 'swipe':
          // swipe needs start and end coordinates
          command = `input swipe ${x.start} ${y.start} ${x.end} ${y.end}`;
          break;
        case 'key':
          command = `input keyevent ${x}`;
          break;
        default:
          reject(new Error('Unknown action'));
          return;
      }

      const adb = spawn('adb', ['-s', deviceId, 'shell', command]);
      
      adb.on('close', (code) => {
        resolve({ success: code === 0 });
      });

      adb.on('error', reject);
    });
  }

  async sendKeyEvent(deviceId, keyCode) {
    return this.sendTouchEvent(deviceId, keyCode, 'key');
  }

  async swipe(deviceId, startX, startY, endX, endY, duration = 500) {
    return new Promise((resolve, reject) => {
      const command = `input swipe ${startX} ${startY} ${endX} ${endY} ${duration}`;
      const adb = spawn('adb', ['-s', deviceId, 'shell', command]);
      
      adb.on('close', (code) => {
        resolve({ success: code === 0 });
      });

      adb.on('error', reject);
    });
  }

  async getDeviceProperties(deviceId) {
    return new Promise((resolve, reject) => {
      const adb = spawn('adb', ['-s', deviceId, 'shell', 'getprop']);
      let output = '';

      adb.stdout.on('data', (data) => {
        output += data.toString();
      });

      adb.on('close', (code) => {
        const props = {};
        const lines = output.split('\n');
        
        for (const line of lines) {
          const match = line.match(/\[(.*?)\]: \[(.*?)\]/);
          if (match) {
            props[match[1]] = match[2];
          }
        }

        resolve({
          model: props['ro.product.model'] || 'Unknown',
          manufacturer: props['ro.product.manufacturer'] || 'Unknown',
          androidVersion: props['ro.build.version.release'] || 'Unknown',
          sdkVersion: props['ro.build.version.sdk'] || 'Unknown',
          resolution: props['ro.sf.lcd_density'] || 'Unknown'
        });
      });

      adb.on('error', reject);
    });
  }

  async startScreenCapture(deviceId) {
    return new Promise((resolve, reject) => {
      // Start a continuous screen capture process
      // This is a simplified version - real implementation would use scrcpy server
      const adb = spawn('adb', ['-s', deviceId, 'shell', 'while true; do screencap -p - > /sdcard/screen.png; done']);
      
      this.devices.set(deviceId, {
        process: adb,
        lastUpdate: Date.now()
      });

      resolve({ success: true });
    });
  }

  stopScreenCapture(deviceId) {
    const device = this.devices.get(deviceId);
    if (device && device.process) {
      device.process.kill();
      this.devices.delete(deviceId);
      return { success: true };
    }
    return { success: false };
  }
}

module.exports = ADBManager;
