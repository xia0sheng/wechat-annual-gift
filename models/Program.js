const { pool } = require('../config/database');

class Program {
    static async findAll() {
        const [rows] = await pool.query(`
            SELECT 
                p.*,
                COALESCE(SUM(rg.rockets), 0) as total_rockets,
                COUNT(DISTINCT rg.user_id) as gifters_count
            FROM programs p
            LEFT JOIN rocket_gifts rg ON p.id = rg.program_id
            GROUP BY p.id
            ORDER BY p.order_num ASC
        `);
        return rows;
    }

    static async findById(id) {
        console.log('Finding program by ID:', id);
        const [[program], [gifts]] = await Promise.all([
            pool.query(
                `SELECT 
                    p.*,
                    COALESCE(SUM(rg.rockets), 0) as total_rockets,
                    COUNT(DISTINCT rg.user_id) as gifters_count
                FROM programs p
                LEFT JOIN rocket_gifts rg ON p.id = rg.program_id
                WHERE p.id = ?
                GROUP BY p.id`,
                [id]
            ),
            pool.query(
                `SELECT 
                    rg.*,
                    u.nickname,
                    u.headimgurl
                FROM rocket_gifts rg
                JOIN users u ON rg.user_id = u.id
                WHERE rg.program_id = ?
                ORDER BY rg.created_at DESC`,
                [id]
            )
        ]);

        console.log('Raw program data:', program);
        console.log('Raw gifts data:', gifts);

        if (!program) return null;

        // 确保返回的是普通对象而不是 RowDataPacket
        const result = {
            id: program.id,
            name: program.name,
            description: program.description,
            performers: program.performers,
            order_num: program.order_num,
            total_rockets: program.total_rockets,
            gifters_count: program.gifters_count,
            created_at: program.created_at,
            updated_at: program.updated_at,
            gifts: Array.isArray(gifts) ? gifts.map(gift => ({
                id: gift.id,
                user_id: gift.user_id,
                rockets: gift.rockets,
                created_at: gift.created_at,
                nickname: gift.nickname,
                headimgurl: gift.headimgurl
            })) : []
        };
        console.log('Processed result:', result);
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