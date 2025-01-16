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
        const [rows] = await pool.query('SELECT * FROM programs WHERE id = ?', [id]);
        return rows[0];
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