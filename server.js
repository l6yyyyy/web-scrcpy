const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const ADBManager = require('./adbManager');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const adbManager = new ADBManager();

// Store active device monitoring intervals
const monitoringIntervals = new Map();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API Routes
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await adbManager.getDevices();
    res.json({ success: true, devices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/connect', async (req, res) => {
  try {
    const { ip, port } = req.body;
    const result = await adbManager.connectDevice(ip, port);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/disconnect', async (req, res) => {
  try {
    const { deviceId } = req.body;
    const result = await adbManager.disconnectDevice(deviceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/device/:id/properties', async (req, res) => {
  try {
    const deviceId = req.params.id;
    const properties = await adbManager.getDeviceProperties(deviceId);
    res.json({ success: true, properties });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Socket.IO for real-time communication
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Start monitoring a device
  socket.on('start-monitor', async (data) => {
    const { deviceId } = data;
    console.log(`Starting monitor for device: ${deviceId}`);

    // Clear existing interval for this device
    if (monitoringIntervals.has(deviceId)) {
      clearInterval(monitoringIntervals.get(deviceId));
    }

    // Start screen capture
    await adbManager.startScreenCapture(deviceId);

    // Set up interval to capture and send screenshots
    const interval = setInterval(async () => {
      try {
        const result = await adbManager.captureScreen(deviceId);
        if (result.success) {
          socket.emit('screen-update', {
            deviceId,
            image: result.data,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Screen capture error:', error);
        socket.emit('error', { message: error.message });
      }
    }, 500); // Capture every 500ms

    monitoringIntervals.set(deviceId, interval);
    socket.emit('monitor-started', { deviceId });
  });

  // Stop monitoring a device
  socket.on('stop-monitor', (data) => {
    const { deviceId } = data;
    console.log(`Stopping monitor for device: ${deviceId}`);

    if (monitoringIntervals.has(deviceId)) {
      clearInterval(monitoringIntervals.get(deviceId));
      monitoringIntervals.delete(deviceId);
    }

    adbManager.stopScreenCapture(deviceId);
    socket.emit('monitor-stopped', { deviceId });
  });

  // Handle touch events
  socket.on('touch', async (data) => {
    const { deviceId, x, y, action } = data;
    try {
      const result = await adbManager.sendTouchEvent(deviceId, x, y, action);
      socket.emit('touch-ack', { success: result.success });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle swipe events
  socket.on('swipe', async (data) => {
    const { deviceId, startX, startY, endX, endY, duration } = data;
    try {
      const result = await adbManager.swipe(deviceId, startX, startY, endX, endY, duration);
      socket.emit('swipe-ack', { success: result.success });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle key events
  socket.on('key', async (data) => {
    const { deviceId, keyCode } = data;
    try {
      const result = await adbManager.sendKeyEvent(deviceId, keyCode);
      socket.emit('key-ack', { success: result.success });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Get device list
  socket.on('get-devices', async () => {
    try {
      const devices = await adbManager.getDevices();
      socket.emit('devices-list', { devices });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Clean up monitoring intervals for this socket
    for (const [deviceId, interval] of monitoringIntervals) {
      clearInterval(interval);
      monitoringIntervals.delete(deviceId);
      adbManager.stopScreenCapture(deviceId);
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Web Scrcpy server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  
  for (const interval of monitoringIntervals.values()) {
    clearInterval(interval);
  }
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
