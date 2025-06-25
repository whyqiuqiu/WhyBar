const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./auth');
const cocktailRoutes = require('./cocktail');
const categoryRoutes = require('./category');
const cartRoutes = require('./cart');
const orderRoutes = require('./order');
const userRoutes = require('./user');

const app = express();

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 模拟网络延迟
app.use((req, res, next) => {
  setTimeout(next, 300);
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '鸡尾酒点单应用API服务',
    version: '1.0.0'
  });
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/cocktails', cocktailRoutes);
app.use('/api/cocktail-categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/user', userRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在',
    data: null
  });
});

// 启动服务器函数
function startServer(port = 3001) {
  const server = app.listen(port, (err) => {
    if (err) {
      console.error('启动服务器失败:', err);
      return;
    }
    
    console.log(`Mock服务器运行在 http://localhost:${port}`);
    console.log('\n可用的Mock接口:');
    console.log('=== 认证相关 ===');
    console.log('[POST] /auth/login - 账号密码登录');
    console.log('[POST] /auth/login/sms - 短信验证码登录');
    console.log('[POST] /auth/sms - 发送短信验证码');
    console.log('[POST] /auth/register - 用户注册');
    console.log('[POST] /auth/reset-password - 重置密码');
    console.log('[POST] /auth/logout - 退出登录');
    
    console.log('\n=== 鸡尾酒相关 ===');
    console.log('[GET] /cocktails - 获取鸡尾酒列表');
    console.log('[GET] /cocktails/:id - 获取鸡尾酒详情');
    console.log('[GET] /cocktails/recommended - 获取推荐鸡尾酒');
    console.log('[GET] /cocktail-categories - 获取鸡尾酒分类');
    
    console.log('\n=== 购物车相关 ===');
    console.log('[GET] /cart - 获取购物车列表');
    console.log('[POST] /cart/add - 添加商品到购物车');
    console.log('[POST] /cart/update - 更新购物车商品数量');
    console.log('[POST] /cart/remove - 删除购物车商品');
    console.log('[POST] /cart/select - 更新购物车商品选中状态');
    console.log('[POST] /cart/select-all - 全选/取消全选购物车商品');
    console.log('[POST] /cart/clear - 清空购物车');
    
    console.log('\n=== 订单相关 ===');
    console.log('[GET] /orders - 获取订单列表');
    console.log('[GET] /orders/:id - 获取订单详情');
    console.log('[POST] /orders - 创建订单');
    console.log('[POST] /orders/:id/pay - 支付订单');
    console.log('[POST] /orders/:id/cancel - 取消订单');
    console.log('[POST] /orders/:id/confirm - 确认收货');
    
    console.log('\n=== 用户相关 ===');
    console.log('[GET] /user - 获取用户信息');
    console.log('[PUT] /user - 更新用户信息');
    console.log('[PUT] /user/password - 修改密码');
    console.log('[GET] /user/addresses - 获取收货地址列表');
    console.log('[POST] /user/addresses - 新增收货地址');
    console.log('[PUT] /user/addresses/:id - 更新收货地址');
    console.log('[DELETE] /user/addresses/:id - 删除收货地址');
    console.log('[POST] /user/addresses/:id/default - 设置默认收货地址');
    
    console.log('\n按 Ctrl+C 停止服务器');
  });

  // 处理端口冲突错误
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`端口 ${port} 已被占用，尝试使用端口 ${port + 1}`);
      server.close();
      startServer(port + 1);
    } else {
      console.error('服务器启动失败:', err);
    }
  });

  return server;
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭Mock服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭Mock服务器...');
  process.exit(0);
});

module.exports = { app, startServer }; 