const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const router = express.Router();

// 配置信息从环境变量中读取
const APPID = process.env.WECHAT_APPID;
const APPSECRET = process.env.WECHAT_APPSECRET;
const REDIRECT_URI = encodeURIComponent(process.env.WECHAT_REDIRECT_URI);
const TOKEN = process.env.WECHAT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;

// 日志函数
const log = (message, data = '') => {
    console.log(`[${new Date().toISOString()}] ${message}`, data);
};

// 错误处理函数
const handleError = (res, error, message = '操作失败') => {
    log('错误:', error);
    res.status(500).json({
        success: false,
        message: message,
        error: error.message
    });
};

// 验证签名的函数
const verifySignature = (signature, timestamp, nonce) => {
    const arr = [TOKEN, timestamp, nonce].sort();
    const str = arr.join('');
    const hash = crypto.createHash('sha1').update(str).digest('hex');
    return hash === signature;
};

// 生成 JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id,
            openid: user.openid 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// 处理授权回调
async function handleCallback(code, res) {
    try {
        log('处理授权回调, code:', code);

        const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APPID}&secret=${APPSECRET}&code=${code}&grant_type=authorization_code`;
        const tokenRes = await axios.get(tokenUrl);
        const { access_token, openid } = tokenRes.data;

        if (!access_token || !openid) {
            return res.status(500).json({ success: false, message: '获取access_token失败' });
        }

        const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
        const userInfoRes = await axios.get(userInfoUrl);
        const wxUserInfo = userInfoRes.data;

        // 查找或创建用户
        let user = await User.findByOpenid(wxUserInfo.openid);
        if (!user) {
            user = await User.create(wxUserInfo);
        } else {
            // 更新用户信息
            user = await User.update(wxUserInfo.openid, wxUserInfo);
        }

        // 生成 JWT token
        const token = generateToken(user);

        // 重定向到管理界面并带上 token
        const adminUrl = `https://wx.thunis.com/admin/#/users?token=${token}`;
        log('重定向到管理界面:', adminUrl);
        res.redirect(adminUrl);

    } catch (error) {
        handleError(res, error, '授权回调处理失败');
    }
}

// JWT 验证中间件
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: '未提供认证令牌' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: '无效的认证令牌' });
    }
};

// 获取当前用户信息的路由
router.get('/user', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        handleError(res, error, '获取用户信息失败');
    }
});

// 回调路由
router.get('/', (req, res) => {
    log('收到请求:', req.url);
    const { signature, timestamp, nonce, echostr, code } = req.query;
    if (signature && timestamp && nonce && echostr) {
        log('处理服务器验证请求');
        return verifySignature(signature, timestamp, nonce) ? res.send(echostr) : res.status(401).send('签名验证失败');
    }

    if (code) {
        log('处理授权回调');
        return handleCallback(code, res);
    }

    res.send('服务器正常运行中');
});

// 授权路由
router.get('/auth', (req, res) => {
    log('开始微信授权');
    const scope = 'snsapi_userinfo';
    const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APPID}&redirect_uri=${REDIRECT_URI}/wechat&response_type=code&scope=${scope}&state=STATE#wechat_redirect`;
    log('重定向到:', authUrl);
    res.redirect(authUrl);
});

module.exports = {
    router,
    authMiddleware
};
