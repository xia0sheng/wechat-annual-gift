const express = require('express');
const http = require('http');
const { initDB } = require('./config/database');

const app = express();
const server = http.createServer(app);

// 错误处理
process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的拒绝:', reason);
});

// 初始化数据库
initDB().catch(err => {
    console.error('数据库初始化失败:', err);
    process.exit(1);
});

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 导入路由
const { router: wechatAuthRouter } = require('./routes/wechat-auth');
const usersRouter = require('./routes/users');
const programsRouter = require('./routes/programs');
const { router: bigScreenRouter, initWebSocket } = require('./routes/big-screen');

// 初始化 WebSocket
const wss = initWebSocket(server);

// 路由注册 - 注意顺序
app.use('/wechat', wechatAuthRouter);
app.use('/users', usersRouter);
app.use('/programs', programsRouter);
app.use('/api/big-screen', bigScreenRouter);

// 默认路由
app.get('/', (req, res) => {
    res.send('欢迎访问微信授权服务！请访问 /wechat/auth 开始授权。');
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});

// 404 处理
app.use((req, res) => {
    res.status(404).send('404 - 未找到页面');
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// 如果有 module.exports，确保在 listen 之后
module.exports = { app, server };
