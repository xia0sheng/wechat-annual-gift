const express = require('express');
const router = express.Router();
const Program = require('../models/Program');
const { authMiddleware, adminMiddleware } = require('./wechat-auth');
const { broadcastGift } = require('./big-screen');
const { pool } = require('../config/database');

// 获取节目列表
router.get('/', async (req, res) => {
    try {
        const programs = await Program.findAll();
        res.json({
            success: true,
            data: programs
        });
    } catch (error) {
        console.error('获取节目列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取节目列表失败',
            error: error.message
        });
    }
});

// 获取节目详情
router.get('/:id', async (req, res) => {
    try {
        console.log('Fetching program with ID:', req.params.id);
        const program = await Program.findById(req.params.id);
        console.log('Found program:', program);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: '节目不存在'
            });
        }
        console.log('Sending response:', JSON.stringify({
            success: true,
            data: program
        }, null, 2));
        res.json({
            success: true,
            data: program
        });
    } catch (error) {
        console.error('获取节目详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取节目详情失败',
            error: error.message
        });
    }
});

// 创建节目（仅管理员）
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const program = await Program.create(req.body);
        res.json({
            success: true,
            data: program
        });
    } catch (error) {
        console.error('创建节目失败:', error);
        res.status(500).json({
            success: false,
            message: '创建节目失败',
            error: error.message
        });
    }
});

// 更新节目（仅管理员）
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const program = await Program.update(req.params.id, req.body);
        res.json({
            success: true,
            data: program
        });
    } catch (error) {
        console.error('更新节目失败:', error);
        res.status(500).json({
            success: false,
            message: '更新节目失败',
            error: error.message
        });
    }
});

// 删除节目（仅管理员）
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Program.delete(req.params.id);
        res.json({
            success: true,
            message: '删除成功'
        });
    } catch (error) {
        console.error('删除节目失败:', error);
        res.status(500).json({
            success: false,
            message: '删除节目失败',
            error: error.message
        });
    }
});

// 赠送火箭
router.post('/:id/gift', authMiddleware, async (req, res) => {
    try {
        const { rockets } = req.body;
        console.log('Current user:', req.user);

        const program = await Program.findById(req.params.id);
        if (!program) {
            return res.status(404).json({ message: '节目不存在' });
        }

        // 更新火箭数量
        await Program.giftRocket(req.params.id, req.user.id, rockets);

        // 广播礼物消息到大屏，使用 nickname 替代 realname
        broadcastGift({
            type: 'gift',
            sender: req.user.nickname,
            senderAvatar: req.user.headimgurl,
            realName: req.user.nickname, // 只使用 nickname
            programName: program.name,
            giftType: 'rocket',
            giftCount: rockets,
            timestamp: Date.now()
        });

        res.json({
            success: true,
            message: '赠送成功'
        });
    } catch (error) {
        console.error('赠送火箭失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '赠送火箭失败'
        });
    }
});

module.exports = router; 