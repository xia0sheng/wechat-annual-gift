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
            (openid, nickname, sex, language, city, province, country, headimgurl, privilege) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [openid, nickname, sex, language, city, province, country, headimgurl, JSON.stringify(privilege)]
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
        const numOffset = Number(offset);
        const numLimit = Number(limit);
        const [rows] = await pool.execute(
            'SELECT * FROM users ORDER BY created_at DESC LIMIT ?, ?',
            [numOffset, numLimit]
        );
        return rows;
    }
}

module.exports = User; 