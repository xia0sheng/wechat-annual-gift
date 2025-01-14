const { pool } = require('../config/database');

class Program {
    static async findAll() {
        const [rows] = await pool.query(`
            SELECT 
                p.id,
                p.name,
                p.description,
                p.performers,
                p.order_num,
                p.created_at,
                p.updated_at,
                COALESCE(SUM(rg.rockets), 0) as total_rockets,
                COUNT(DISTINCT rg.user_id) as gifters_count
            FROM programs p
            LEFT JOIN rocket_gifts rg ON p.id = rg.program_id
            GROUP BY 
                p.id, 
                p.name, 
                p.description, 
                p.performers, 
                p.order_num, 
                p.created_at, 
                p.updated_at
            ORDER BY p.order_num ASC
        `);

        // 确保返回的数据都有默认值
        return rows.map(row => ({
            id: row.id,
            name: row.name || '',
            description: row.description || '',
            performers: row.performers || '',
            order_num: row.order_num || 0,
            total_rockets: parseInt(row.total_rockets) || 0,
            gifters_count: parseInt(row.gifters_count) || 0,
            created_at: row.created_at,
            updated_at: row.updated_at
        }));
    }

    static async findById(id) {
        console.log('Finding program by ID:', id);
        const [programResult, statsResult, giftsResult] = await Promise.all([
            // 基本信息查询
            pool.query(
                `SELECT 
                    id,
                    name,
                    description,
                    performers,
                    order_num,
                    created_at,
                    updated_at
                FROM programs
                WHERE id = ?`,
                [id]
            ),
            // 统计信息查询
            pool.query(
                `SELECT 
                    COALESCE(SUM(rockets), 0) as total_rockets,
                    COUNT(DISTINCT user_id) as gifters_count
                FROM rocket_gifts
                WHERE program_id = ?`,
                [id]
            ),
            // 礼物记录查询
            pool.query(
                `SELECT 
                    rg.id,
                    rg.user_id,
                    rg.rockets,
                    rg.created_at,
                    u.nickname,
                    u.headimgurl
                FROM rocket_gifts rg
                JOIN users u ON rg.user_id = u.id
                WHERE rg.program_id = ?
                ORDER BY rg.created_at DESC`,
                [id]
            )
        ]);

        const program = programResult[0][0];
        const stats = statsResult[0][0];
        const gifts = giftsResult[0];

        if (!program) return null;

        console.log('Raw program:', program);
        console.log('Raw stats:', stats);
        console.log('Raw gifts:', gifts);

        const result = {
            id: program.id,
            name: program.name || '',
            description: program.description || '',
            performers: program.performers || '',
            order_num: program.order_num || 0,
            created_at: program.created_at,
            updated_at: program.updated_at,
            total_rockets: parseInt(stats?.total_rockets) || 0,
            gifters_count: parseInt(stats?.gifters_count) || 0,
            gifts: Array.isArray(gifts) ? gifts.map(gift => ({
                id: gift.id,
                user_id: gift.user_id,
                rockets: parseInt(gift.rockets) || 0,
                created_at: gift.created_at,
                nickname: gift.nickname || '',
                headimgurl: gift.headimgurl || ''
            })) : []
        };

        console.log('Final processed result:', JSON.stringify(result, null, 2));
        return result;
    }

    static async create(data) {
        const { name, description, performers, order_num } = data;
        const [result] = await pool.query(
            'INSERT INTO programs (name, description, performers, order_num) VALUES (?, ?, ?, ?)',
            [name, description, performers, order_num]
        );
        return this.findById(result.insertId);
    }

    static async update(id, data) {
        const { name, description, performers, order_num } = data;
        await pool.query(
            'UPDATE programs SET name = ?, description = ?, performers = ?, order_num = ? WHERE id = ?',
            [name, description, performers, order_num, id]
        );
        return this.findById(id);
    }

    static async delete(id) {
        await pool.query('DELETE FROM rocket_gifts WHERE program_id = ?', [id]);
        await pool.query('DELETE FROM programs WHERE id = ?', [id]);
        return true;
    }

    static async giftRocket(programId, userId, rockets) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 检查用户火箭数量是否足够
            const [[user]] = await conn.query(
                'SELECT rockets FROM users WHERE id = ? FOR UPDATE',
                [userId]
            );

            if (!user || user.rockets < rockets) {
                throw new Error('火箭数量不足');
            }

            // 扣除用户火箭
            await conn.query(
                'UPDATE users SET rockets = rockets - ? WHERE id = ?',
                [rockets, userId]
            );

            // 记录赠送
            await conn.query(
                'INSERT INTO rocket_gifts (program_id, user_id, rockets) VALUES (?, ?, ?)',
                [programId, userId, rockets]
            );

            await conn.commit();
            return true;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }
}

module.exports = Program; 