const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('./wechat-auth');

// 获取用户列表（分页）- 仅管理员可访问
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // 获取总数和分页数据
        const [total] = await User.getTotalCount();
        const users = await User.findAll(offset, limit);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    total: total.count,
                    current_page: page,
                    per_page: limit,
                    total_pages: Math.ceil(total.count / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败',
            error: error.message
        });
    }
});

// 根据 openid 获取用户信息
router.get('/:openid', authMiddleware, async (req, res) => {
    try {
        const { openid } = req.params;
        const user = await User.findByOpenid(openid);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户信息失败',
            error: error.message
        });
    }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户信息失败',
            error: error.message
        });
    }
});

module.exports = router; 