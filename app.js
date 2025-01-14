const express = require('express');
const { initDB } = require('./config/database');

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

const app = express();

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
const { router: wechatAuthRouter } = require('./routes/wechat-auth');
const usersRouter = require('./routes/users');
const programsRouter = require('./routes/programs');

app.use('/wechat', wechatAuthRouter);
app.use('/users', usersRouter);
app.use('/programs', programsRouter);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});
