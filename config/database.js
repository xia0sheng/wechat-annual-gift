const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 初始化数据库连接
async function initDB() {
    try {
        // 检查并创建 users 表（如果不存在）
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                openid VARCHAR(100) UNIQUE NOT NULL,
                nickname VARCHAR(100),
                sex TINYINT,
                language VARCHAR(50),
                city VARCHAR(100),
                province VARCHAR(100),
                country VARCHAR(100),
                headimgurl VARCHAR(500),
                privilege JSON,
                role ENUM('user', 'admin') DEFAULT 'user',
                rockets INT DEFAULT 0,
                real_name VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 检查并创建 programs 表（如果不存在）
        await pool.query(`
            CREATE TABLE IF NOT EXISTS programs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL COMMENT '节目名称',
                description TEXT COMMENT '节目描述',
                performers VARCHAR(200) COMMENT '表演者',
                order_num INT DEFAULT 0 COMMENT '节目顺序',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 检查并创建 rocket_gifts 表（如果不存在）
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rocket_gifts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                program_id INT NOT NULL COMMENT '节目ID',
                user_id INT NOT NULL COMMENT '赠送者ID',
                rockets INT NOT NULL DEFAULT 1 COMMENT '赠送火箭数量',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (program_id) REFERENCES programs(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        console.log('数据库初始化成功');
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    }
}

module.exports = {
    pool,
    initDB
}; 