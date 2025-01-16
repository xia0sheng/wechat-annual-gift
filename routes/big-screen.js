const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const url = require('url');

// 存储所有连接的客户端
const clients = new Set();

// 创建 WebSocket 服务器
const initWebSocket = (server) => {
  const wss = new WebSocket.Server({ noServer: true });

  // 处理升级请求
  server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;

    if (pathname === '/ws/gift') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  // 处理连接
  wss.on('connection', (ws) => {
    // 添加新客户端
    clients.add(ws);

    // 处理连接关闭
    ws.on('close', () => {
      clients.delete(ws);
    });

    // 处理错误
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  return wss;
};

// 广播礼物消息给所有客户端
const broadcastGift = (giftData) => {
  const message = JSON.stringify({
    type: 'gift',
    ...giftData
  });

  console.log('Broadcasting gift:', message);
  console.log('Connected clients:', clients.size);

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      console.log('Message sent to client');
    } else {
      console.log('Client not ready:', client.readyState);
    }
  });
};

// REST API 路由
router.get('/', async (req, res) => {
  try {
    res.json({ message: 'Big Screen API endpoint' });
  } catch (error) {
    console.error('Big Screen error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 处理送礼请求
router.post('/send-gift', async (req, res) => {
  try {
    const { sender, programName, giftType } = req.body;
    
    // 验证请求数据
    if (!sender || !programName || !giftType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 广播礼物消息
    broadcastGift({
      sender,
      programName,
      giftType,
      timestamp: Date.now()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Send gift error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 添加测试接口
router.post('/test-gift', async (req, res) => {
  try {
    // 发送测试礼物消息
    broadcastGift({
      type: 'gift',
      sender: '测试用户',
      programName: '测试节目',
      giftType: 'rocket',
      timestamp: Date.now()
    });

    res.json({ success: true, message: '测试礼物已发送' });
  } catch (error) {
    console.error('Test gift error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = { 
  router, 
  initWebSocket,
  broadcastGift
}; 