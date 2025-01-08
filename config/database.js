const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 测试连接
const connectDB = async () => {
    try {
        await pool.getConnection();
        console.log('MySQL 连接成功');
        
        // 创建用户表
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                openid VARCHAR(255) UNIQUE NOT NULL,
                nickname VARCHAR(255),
                sex INT,
                language VARCHAR(50),
                city VARCHAR(100),
                province VARCHAR(100),
                country VARCHAR(100),
                headimgurl VARCHAR(500),
                privilege JSON,
                last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
    } catch (error) {
        console.error('MySQL 连接失败:', error);
        process.exit(1);
    }
};

module.exports = { pool, connectDB }; 