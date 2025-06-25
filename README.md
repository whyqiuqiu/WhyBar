# 🍹 鸡尾酒点单小程序

一个基于 uni-app + Vue3 的微信小程序，提供完整的鸡尾酒点单体验。

## 📱 项目简介

这是一个功能完整的鸡尾酒点单移动端应用，包含用户注册登录、商品展示、购物车、订单管理等核心功能。采用现代化的紫色主题设计，界面美观且用户体验流畅。

## ✨ 主要功能

### 🔐 用户认证
- 用户注册/登录
- 忘记密码功能
- 用户信息管理

### 🏠 商品展示
- 鸡尾酒商品列表
- 商品详情页面
- 分类浏览功能

### 🛒 购物功能
- 购物车管理
- 商品数量调整
- 价格计算

### 📋 订单管理
- 订单确认
- 订单列表（全部/待支付/待发货/待收货/已完成）
- 订单详情
- 订单状态更新

### 👤 个人中心
- 个人信息编辑
- 收货地址管理
- 系统设置

## 🛠 技术栈

- **框架**: uni-app + Vue3
- **状态管理**: Pinia
- **样式**: SCSS
- **开发工具**: HBuilderX
- **后端模拟**: Express.js Mock服务

## 📦 项目结构

```
myWhyqiuqiu/
├── src/                    # 源码目录
│   ├── pages/             # 页面文件
│   │   ├── index/         # 登录页
│   │   ├── home/          # 首页
│   │   ├── cart/          # 购物车
│   │   ├── order-list/    # 订单列表
│   │   ├── order-detail/  # 订单详情
│   │   └── profile/       # 个人中心
│   ├── static/            # 静态资源
│   ├── stores/            # Pinia状态管理
│   ├── App.vue            # 应用主组件
│   └── main.js            # 应用入口
├── mock/                  # Mock服务器
│   ├── server.js          # 服务器入口
│   ├── auth.js            # 认证相关API
│   ├── cocktail.js        # 商品相关API
│   ├── cart.js            # 购物车相关API
│   └── order.js           # 订单相关API
├── public/                # 公共资源
├── package.json           # 项目配置
└── README.md              # 项目说明
```

## 🚀 快速开始

### 环境要求
- Node.js >= 14.0.0
- npm 或 yarn
- HBuilderX（推荐）

### 安装依赖
```bash
npm install
```

### 启动Mock服务器
```bash
npm run mock
```
Mock服务器将在 http://localhost:3000 启动

### 运行项目
1. 使用HBuilderX打开项目
2. 选择运行到微信开发者工具
3. 确保Mock服务器已启动

## 🎨 设计特色

### 色彩方案
- **主色调**: #8e44ad (紫色)
- **辅助色**: #9b59b6, #732d91
- **强调色**: #e74c3c (红色), #f39c12 (橙色)

### UI特点
- 现代化扁平设计
- 紫色渐变主题
- 圆角卡片布局
- 流畅的交互动画
- 响应式布局适配

## 📊 核心功能演示

### 订单编号系统
- 格式：`ORD + 时间戳`（如：ORD1750842151618）
- 唯一性保证：基于毫秒级时间戳
- 完整的订单生命周期管理

### 状态管理
使用Pinia进行状态管理，包括：
- 用户状态
- 购物车状态
- 订单状态
- 商品状态

### Mock数据
完整的Mock服务器，模拟真实API环境：
- RESTful API设计
- 完整的CRUD操作
- 真实的数据结构

## 🔧 配置说明

### API配置
Mock服务器地址配置在 `src/main.js` 中：
```javascript
const api = {
  baseURL: 'http://localhost:3000',
  // ... API配置
}
```

### 页面配置
页面路由配置在 `src/pages.json` 中，包括：
- 页面路径
- 导航栏样式
- TabBar配置

## 📝 开发说明

### 新增页面
1. 在 `src/pages/` 目录下创建页面文件夹
2. 在 `src/pages.json` 中添加页面配置
3. 根据需要添加对应的API和状态管理

### Mock数据修改
Mock数据存储在 `mock/` 目录下，修改对应的 `.js` 文件即可。

### 样式开发
- 全局样式：`src/uni.scss`
- 组件样式：每个`.vue`文件的`<style>`标签内

## 🐛 常见问题

1. **Mock服务器连接失败**
   - 确保Mock服务器已启动
   - 检查端口3000是否被占用

2. **图片资源加载失败**
   - 检查图片路径是否正确
   - 确保图片文件存在于 `src/static/images/` 目录

3. **页面跳转失败**
   - 检查页面路径配置
   - 确认 `pages.json` 中已注册页面

## 🤝 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👨‍💻 作者

- [@whyqiuqiu](https://github.com/whyqiuqiu)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者们！

---

如果这个项目对你有帮助，请给它一个 ⭐️！ 