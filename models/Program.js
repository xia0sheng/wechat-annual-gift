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

    static async findById(id, page = 1, pageSize = 10) {
        // 1. 先获取节目基本信息
        const [programRows] = await pool.query(`
            SELECT 
                p.*,
                COALESCE(SUM(rg.rockets), 0) as total_rockets,
                COUNT(DISTINCT rg.user_id) as gifters_count
            FROM programs p
            LEFT JOIN rocket_gifts rg ON p.id = rg.program_id
            WHERE p.id = ?
            GROUP BY p.id
        `, [id]);

        if (!programRows[0]) return null;

        // 2. 获取礼物记录总数
        const [[{ total }]] = await pool.query(`
            SELECT COUNT(*) as total
            FROM rocket_gifts rg
            WHERE rg.program_id = ?
        `, [id]);

        // 3. 分页获取礼物记录
        const [giftRows] = await pool.query(`
            SELECT 
                rg.id,
                rg.user_id,
                rg.rockets,
                rg.created_at,
                u.nickname,
                u.headimgurl,
                u.real_name
            FROM rocket_gifts rg
            LEFT JOIN users u ON rg.user_id = u.id
            WHERE rg.program_id = ?
            ORDER BY rg.created_at DESC
            LIMIT ? OFFSET ?
        `, [id, pageSize, (page - 1) * pageSize]);

        // 4. 组合数据
        const program = programRows[0];
        program.gifts = giftRows;
        program.gifts_pagination = {
            total,
            current_page: page,
            page_size: pageSize,
            total_pages: Math.ceil(total / pageSize)
        };

        return program;
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