# 微信 OAuth2.0 授权登录系统

基于 Node.js 的微信 OAuth2.0 授权登录系统，实现微信登录、用户信息获取、JWT 认证等功能。

## 功能特性

- 微信 OAuth2.0 授权登录
- 获取微信用户基本信息（头像、昵称等）
- JWT 用户身份认证
- MySQL 数据持久化存储
- 环境变量配置
- 日志记录和错误处理

## 技术栈

- Node.js
- Express.js
- MySQL
- JSON Web Tokens (JWT)
- Axios

## 快速开始

### 1. 环境要求

- Node.js >= 14
- MySQL >= 5.7
- npm 或 yarn

### 2. 安装步骤

```bash
# 克隆项目
git clone [项目地址]
cd [项目目录]

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
```

### 3. 环境变量配置

编辑 `.env` 文件，填入以下配置：

```env
# 微信配置
WECHAT_APPID=           # 微信公众号 APPID
WECHAT_APPSECRET=       # 微信公众号 APPSECRET
WECHAT_TOKEN=           # 微信服务器配置的 Token
WECHAT_REDIRECT_URI=    # 授权回调地址

# JWT配置
JWT_SECRET=             # JWT 加密密钥

# 数据库配置
DB_HOST=localhost       # 数据库地址
DB_USER=root           # 数据库用户名
DB_PASSWORD=           # 数据库密码
DB_NAME=wechat_auth    # 数据库名
DB_PORT=3306           # 数据库端口
```

### 4. 数据库初始化

```sql
CREATE DATABASE wechat_auth;
```

用户表会在应用首次启动时自动创建。

### 5. 启动服务

```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

## API 接口说明

### 1. 微信授权登录
- 路径：`GET /wechat/auth`
- 功能：重定向到微信授权页面

### 2. 授权回调处理
- 路径：`GET /wechat`
- 功能：处理微信回调，获取用户信息
- 返回：用户信息和 JWT token

### 3. 获取用户信息
- 路径：`GET /wechat/user`
- 功能：获取当前登录用户信息
- 认证：需要 JWT token
- 请求头：`Authorization: Bearer <token>`

## 项目结构

```
.
├── config/
│   └── database.js     # 数据库配置
├── models/
│   └── User.js         # 用户模型
├── routes/
│   └── wechat-auth.js  # 微信授权路由
├── .env                # 环境变量
├── .env.example        # 环境变量示例
├── .gitignore         # Git 忽略文件
├── app.js             # 应用入口
└── package.json       # 项目配置
```

## 部署说明

### 1. 服务器环境准备
```bash
# 安装 Node.js
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MySQL
sudo apt-get install mysql-server
```

### 2. 项目部署
```bash
# 拉取代码
git clone [项目地址]

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
vim .env

# 启动服务
npm start
```

### 3. 使用 PM2 管理进程（推荐）
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start app.js --name wechat-auth

# 查看日志
pm2 logs wechat-auth
```

## 安全建议

1. 环境变量保护
   - 不要将 .env 文件提交到版本控制
   - 定期更换 JWT_SECRET
   - 使用强密码

2. 服务器配置
   - 启用 HTTPS
   - 配置防火墙
   - 定期更新系统和依赖包

3. 数据安全
   - 定期备份数据库
   - 加密敏感信息
   - 设置合适的数据库权限

## 常见问题

1. 授权失败
   - 检查微信配置是否正确
   - 确认回调域名是否已配置
   - 查看服务器日志

2. 数据库连接问题
   - 验证数据库配置信息
   - 确保 MySQL 服务正常运行
   - 检查数据库用户权限

## 维护与支持

- 定期检查依赖更新
- 监控服务器状态
- 查看错误日志
- 及时处理安全更新

## License

MIT License
