const express = require('express');
const router = express.Router();

// 引入鸡尾酒数据
const cocktailsRouter = require('./cocktail');
const cocktails = [];

// 获取鸡尾酒数据（模拟）
for (let i = 1; i <= 6; i++) {
  cocktails.push({
    id: i,
    name: ['莫吉托', '玛格丽特', '朗姆可乐', '威士忌酸酒', '紫色梦境', '浆果气泡'][i-1],
    price: [35, 38, 30, 42, 45, 36][i-1],
    image: `/static/images/${['mojito', 'margarita', 'rum-cola', 'whiskey-sour', 'purple-dream', 'berry-fizz'][i-1]}.png`
  });
}

// 购物车数据存储（用户ID -> 购物车数组）
const userCarts = {};

// 中间件：验证用户是否登录
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
      code: 401,
      message: '请先登录',
      data: null
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  // 开发环境的特殊token处理
  if (token === 'mock-token-for-development') {
    // 使用默认用户ID 1
    req.userId = 1;
    
    // 确保该用户的购物车存在
    if (!userCarts[1]) {
      userCarts[1] = [];
    }
    
    next();
    return;
  }
  
  // 处理其他token格式
  let userId;
  
  // 尝试解析不同格式的token
  if (token.includes('_')) {
    // 格式: token_userId
    userId = token.split('_')[1];
  } else if (token.startsWith('user')) {
    // 格式: user1, user2
    userId = token.replace('user', '');
  } else {
    // 直接是用户ID
    userId = token;
  }
  
  if (!userId) {
    return res.json({
      code: 401,
      message: '无效的登录凭证',
      data: null
    });
  }
  
  // 将用户ID转换为数字
  const numericUserId = parseInt(userId);
  
  // 将用户ID添加到请求对象中
  req.userId = numericUserId;
  
  // 确保该用户的购物车存在
  if (!userCarts[numericUserId]) {
    userCarts[numericUserId] = [];
  }
  
  next();
};

// 获取购物车列表
router.get('/', authMiddleware, (req, res) => {
  const userId = req.userId;
  const cart = userCarts[userId] || [];
  
  res.json({
    code: 200,
    message: '获取购物车成功',
    data: cart
  });
});

// 添加商品到购物车
router.post('/add', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { cocktail_id, quantity = 1 } = req.body;
  
  if (!cocktail_id) {
    return res.json({
      code: 400,
      message: '商品ID不能为空',
      data: null
    });
  }
  
  const cocktail = cocktails.find(c => c.id === parseInt(cocktail_id));
  if (!cocktail) {
    return res.json({
      code: 404,
      message: '商品不存在',
      data: null
    });
  }
  
  const cart = userCarts[userId];
  const existingItem = cart.find(item => item.cocktail_id === parseInt(cocktail_id));
  
  if (existingItem) {
    existingItem.quantity += parseInt(quantity);
  } else {
    cart.push({
      id: Date.now(), // 购物车项ID
      cocktail_id: parseInt(cocktail_id),
      name: cocktail.name,
      price: cocktail.price,
      image: cocktail.image,
      quantity: parseInt(quantity),
      selected: true
    });
  }
  
  res.json({
    code: 200,
    message: '添加到购物车成功',
    data: cart
  });
});

// 更新购物车商品数量
router.post('/update', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { cart_id, quantity } = req.body;
  
  if (!cart_id || !quantity) {
    return res.json({
      code: 400,
      message: '参数错误',
      data: null
    });
  }
  
  const cart = userCarts[userId];
  const cartItem = cart.find(item => item.id === parseInt(cart_id));
  
  if (!cartItem) {
    return res.json({
      code: 404,
      message: '购物车商品不存在',
      data: null
    });
  }
  
  cartItem.quantity = parseInt(quantity);
  
  res.json({
    code: 200,
    message: '更新购物车成功',
    data: cart
  });
});

// 删除购物车商品
router.post('/remove', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { cart_id } = req.body;
  
  if (!cart_id) {
    return res.json({
      code: 400,
      message: '参数错误',
      data: null
    });
  }
  
  const cart = userCarts[userId];
  const index = cart.findIndex(item => item.id === parseInt(cart_id));
  
  if (index === -1) {
    return res.json({
      code: 404,
      message: '购物车商品不存在',
      data: null
    });
  }
  
  cart.splice(index, 1);
  
  res.json({
    code: 200,
    message: '删除购物车商品成功',
    data: cart
  });
});

// 更新购物车商品选中状态
router.post('/select', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { cart_id, selected } = req.body;
  
  if (!cart_id || selected === undefined) {
    return res.json({
      code: 400,
      message: '参数错误',
      data: null
    });
  }
  
  const cart = userCarts[userId];
  const cartItem = cart.find(item => item.id === parseInt(cart_id));
  
  if (!cartItem) {
    return res.json({
      code: 404,
      message: '购物车商品不存在',
      data: null
    });
  }
  
  cartItem.selected = !!selected;
  
  res.json({
    code: 200,
    message: '更新选中状态成功',
    data: cart
  });
});

// 全选/取消全选购物车商品
router.post('/select-all', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { selected } = req.body;
  
  if (selected === undefined) {
    return res.json({
      code: 400,
      message: '参数错误',
      data: null
    });
  }
  
  const cart = userCarts[userId];
  cart.forEach(item => {
    item.selected = !!selected;
  });
  
  res.json({
    code: 200,
    message: selected ? '全选成功' : '取消全选成功',
    data: cart
  });
});

// 清空购物车
router.post('/clear', authMiddleware, (req, res) => {
  const userId = req.userId;
  userCarts[userId] = [];
  
  res.json({
    code: 200,
    message: '清空购物车成功',
    data: []
  });
});

module.exports = router; 