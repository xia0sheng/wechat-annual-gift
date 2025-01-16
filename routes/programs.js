const express = require('express');
const router = express.Router();
const Program = require('../models/Program');
const { authMiddleware, adminMiddleware } = require('./wechat-auth');
const { User } = require('../models/user');
const { broadcastGift } = require('./big-screen');

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
        await Program.giftRocket(req.params.id, req.user.id, rockets);

        // 获取节目和用户信息
        const program = await Program.findById(req.params.id);
        
        // 添加广播礼物消息
        broadcastGift({
            sender: req.user.nickname || req.user.username,
            programName: program.name,
            giftType: 'rocket',
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

// 修改送礼物的路由
router.post('/:id/send-gift', authMiddleware, async (req, res) => {
    try {
        const program = await Program.findById(req.params.id);
        if (!program) {
            return res.status(404).json({ message: '节目不存在' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }

        // 更新礼物记录
        program.gifts.push({
            type: 'rocket',
            sender: user._id,
            senderName: user.nickname || user.username,
            timestamp: new Date()
        });
        await program.save();

        // 广播礼物消息到大屏
        broadcastGift({
            sender: user.nickname || user.username,
            programName: program.name,
            giftType: 'rocket',
            timestamp: Date.now()
        });

        res.json({ 
            success: true, 
            message: '礼物发送成功',
            gifts: program.gifts 
        });
    } catch (error) {
        console.error('发送礼物错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router; 