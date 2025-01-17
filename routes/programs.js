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
        console.log('\n[Gift Route] ====== Start Gift Process ======');
        console.log(`[Gift Route] Program ID: ${req.params.id}, User ID: ${req.user.id}`);
        const { rockets } = req.body;
        console.log(`[Gift Route] Rockets count: ${rockets}`);
        
        // 获取完整的用户信息
        const [[user]] = await pool.query(`
            SELECT id, nickname, real_name, headimgurl, rockets as current_rockets
            FROM users 
            WHERE id = ?
        `, [req.user.id]);
        console.log('[Gift Route] User info:', {
            id: user.id,
            nickname: user.nickname,
            real_name: user.real_name,
            current_rockets: user.current_rockets
        });

        const program = await Program.findById(req.params.id);
        console.log('[Gift Route] Program info:', {
            id: program.id,
            name: program.name,
            current_total_rockets: program.total_rockets
        });

        // 更新火箭数量
        console.log('[Gift Route] Starting transaction for rocket gift...');
        await Program.giftRocket(req.params.id, req.user.id, rockets);
        console.log('[Gift Route] Transaction completed successfully');

        // 广播礼物消息
        console.log('[Gift Route] Preparing to broadcast gift message...');
        const giftData = {
            type: 'gift',
            sender: user.nickname,
            senderAvatar: user.headimgurl,
            realName: user.real_name || user.nickname,
            programName: program.name,
            giftType: 'rocket',
            giftCount: rockets,
            timestamp: Date.now()
        };
        console.log('[Gift Route] Gift data prepared:', giftData);
        
        broadcastGift(giftData);
        console.log('[Gift Route] Broadcast completed');

        console.log('[Gift Route] ====== End Gift Process ======\n');
        res.json({
            success: true,
            message: '赠送成功'
        });
    } catch (error) {
        console.error('[Gift Route] ====== Error in Gift Process ======');
        console.error('[Gift Route] Error details:', error);
        console.error('[Gift Route] Stack:', error.stack);
        console.error('[Gift Route] ====== End Error ======\n');
        res.status(500).json({
            success: false,
            message: error.message || '赠送火箭失败'
        });
    }
});

module.exports = router; 