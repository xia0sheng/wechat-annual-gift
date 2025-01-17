const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const url = require('url');

// 存储所有连接的客户端
let clients = new Set();

// 创建 WebSocket 服务器
const initWebSocket = (server) => {
  const wss = new WebSocket.Server({ server, path: '/ws/gift' });

  wss.on('connection', (ws, req) => {
    // 添加连接 ID 用于调试
    ws.id = Math.random().toString(36).substring(7);
    console.log(`[WebSocket] Client ${ws.id} connected, total clients: ${clients.size}`);
    
    // 检查是否已经存在相同的连接
    clients.forEach(client => {
      if (client.id === ws.id) {
        console.log(`[WebSocket] Duplicate connection detected, closing old connection: ${client.id}`);
        client.close();
        clients.delete(client);
      }
    });
    
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WebSocket] Client ${ws.id} disconnected, remaining clients: ${clients.size}`);
    });
  });

  return wss;
};

// 修改广播函数，添加消息去重机制
const messageCache = new Set();
const MESSAGE_CACHE_TIMEOUT = 5000; // 5秒内的相同消息会被忽略

const broadcastGift = (giftData) => {
  console.log('[WebSocket] Broadcasting gift, data:', giftData); // 添加日志
  
  const messageId = `${giftData.timestamp}-${giftData.sender}-${giftData.giftCount}`;
  console.log('[WebSocket] Generated messageId:', messageId); // 添加日志
  
  if (messageCache.has(messageId)) {
    console.log('[WebSocket] Duplicate message detected, messageId:', messageId);
    return;
  }
  
  messageCache.add(messageId);
  console.log('[WebSocket] Active clients:', clients.size); // 添加日志
  
  const message = JSON.stringify({
    type: 'gift',
    messageId,
    ...giftData
  });
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Sending to client...'); // 添加日志
      client.send(message);
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
    
    if (!sender || !programName || !giftType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 这里不需要再次调用 broadcastGift，因为已经在 programs.js 中调用了
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
      senderAvatar: '/default-avatar.png',
      realName: '测试用户',
      programName: '测试节目',
      giftType: 'rocket',
      giftCount: 1,
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