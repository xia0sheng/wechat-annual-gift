const { pool } = require('../config/database');

class User {
    static async findByOpenid(openid) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE openid = ?',
            [openid]
        );
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async create(userData) {
        const { openid, nickname, sex, language, city, province, country, headimgurl, privilege } = userData;
        const [result] = await pool.query(
            `INSERT INTO users 
            (openid, nickname, sex, language, city, province, country, headimgurl, privilege, role)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'user')`,
            [openid, nickname, sex, language, city, province, country, headimgurl, JSON.stringify(privilege), 'user']
        );
        return this.findById(result.insertId);
    }

    static async update(openid, userData) {
        const { nickname, sex, language, city, province, country, headimgurl, privilege } = userData;
        await pool.query(
            `UPDATE users SET 
            nickname = ?, 
            sex = ?, 
            language = ?, 
            city = ?, 
            province = ?, 
            country = ?, 
            headimgurl = ?, 
            privilege = ?,
            last_login = CURRENT_TIMESTAMP
            WHERE openid = ?`,
            [nickname, sex, language, city, province, country, headimgurl, JSON.stringify(privilege), openid]
        );
        return this.findByOpenid(openid);
    }

    static async getTotalCount() {
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
        return rows;
    }

    static async findAll(offset = 0, limit = 10) {
        const [rows] = await pool.query(
            'SELECT * FROM users ORDER BY created_at DESC LIMIT ?, ?',
            [Number(offset), Number(limit)]
        );
        return rows;
    }

    static async isAdmin(userId) {
        const [rows] = await pool.query(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );
        return rows[0]?.role === 'admin';
    }

    static async updateUserInfo(id, { rockets, real_name }) {
        const updates = [];
        const values = [];
        
        if (rockets !== undefined) {
            updates.push('rockets = ?');
            values.push(rockets);
        }
        
        if (real_name !== undefined) {
            updates.push('real_name = ?');
            values.push(real_name);
        }
        
        if (updates.length === 0) return null;
        
        values.push(id);
        const [result] = await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        return this.findById(id);
    }
}

module.exports = User; 