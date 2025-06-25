const express = require('express');
const router = express.Router();

// 订单数据存储（用户ID -> 订单数组）
const userOrders = {
  1: [
    {
      id: 'ORD1700000001',
      order_no: 'ORD1700000001',
      user_id: 1,
      address_id: 1,
      items: [
        {
          id: 1,
          cocktail_id: 1,
          name: '莫吉托',
          price: 35,
          image: '/static/images/mojito.png',
          quantity: 2,
          selected: true
        },
        {
          id: 2,
          cocktail_id: 4,
          name: '威士忌酸酒',
          price: 42,
          image: '/static/images/whiskey-sour.png',
          quantity: 1,
          selected: true
        }
      ],
      total_amount: 112,
      remark: '少冰，谢谢',
      payment_type: 'wechat',
      status: 0, // 0: 待支付, 1: 已支付, 2: 已发货, 3: 已完成, 4: 已取消
      created_at: '2024-01-17 10:30:00',
      paid_at: null,
      delivered_at: null,
      completed_at: null,
      cancelled_at: null
    },
    {
      id: 'ORD1700000002',
      order_no: 'ORD1700000002',
      user_id: 1,
      address_id: 1,
      items: [
        {
          id: 3,
          cocktail_id: 2,
          name: '玛格丽特',
          price: 38,
          image: '/static/images/margarita.png',
          quantity: 1,
          selected: true
        },
        {
          id: 4,
          cocktail_id: 5,
          name: '紫色梦境',
          price: 45,
          image: '/static/images/purple-dream.png',
          quantity: 1,
          selected: true
        }
      ],
      total_amount: 83,
      remark: '',
      payment_type: 'wechat',
      status: 1, // 已支付
      created_at: '2024-01-16 19:20:00',
      paid_at: '2024-01-14 19:22:00',
      delivered_at: null,
      completed_at: null,
      cancelled_at: null
    },
    {
      id: 'ORD1700000003',
      order_no: 'ORD1700000003',
      user_id: 1,
      address_id: 2,
      items: [
        {
          id: 5,
          cocktail_id: 3,
          name: '朗姆可乐',
          price: 30,
          image: '/static/images/rum-cola.png',
          quantity: 3,
          selected: true
        }
      ],
      total_amount: 90,
      remark: '配送时间：下午6点后',
      payment_type: 'alipay',
      status: 3, // 已完成
      created_at: '2024-01-12 16:45:00',
      paid_at: '2024-01-13 16:46:00',
      delivered_at: '2024-01-13 18:30:00',
      completed_at: '2024-01-13 20:15:00',
      cancelled_at: null
    },
    {
      id: 'ORD1700000004',
      order_no: 'ORD1700000004',
      user_id: 1,
      address_id: 1,
      items: [
        {
          id: 6,
          cocktail_id: 6,
          name: '浆果气泡',
          price: 36,
          image: '/static/images/berry-fizz.png',
          quantity: 2,
          selected: true
        }
      ],
      total_amount: 72,
      remark: '',
      payment_type: 'wechat',
      status: 2, // 待收货
      created_at: '2024-01-15 10:15:00',
      paid_at: '2024-01-16 10:16:00',
      delivered_at: '2024-01-16 11:30:00',
      completed_at: null,
      cancelled_at: null
    },
    {
      id: 'ORD1700000005',
      order_no: 'ORD1700000005',
      user_id: 1,
      address_id: 1,
      items: [
        {
          id: 7,
          cocktail_id: 1,
          name: '莫吉托',
          price: 35,
          image: '/static/images/mojito.png',
          quantity: 1,
          selected: true
        }
      ],
      total_amount: 35,
      remark: '新订单测试',
      payment_type: 'wechat',
      status: 0, // 待支付
      created_at: '2024-01-18 15:20:00',
      paid_at: null,
      delivered_at: null,
      completed_at: null,
      cancelled_at: null
    }
  ]
};

// 中间件：验证用户是否登录
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  console.log('认证中间件 - Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('用户ID token 不存在，使用默认用户');
    // 开发环境下如果没有token，使用默认用户ID 1
    req.userId = 1;
    
    // 确保该用户的订单数组存在
    if (!userOrders[1]) {
      userOrders[1] = [];
    }
    
    next();
    return;
  }
  
  const token = authHeader.split(' ')[1];
  console.log('解析到的token:', token);
  
  // 开发环境的特殊token处理
  if (token === 'mock-token-for-development') {
    // 使用默认用户ID 1
    req.userId = 1;
    console.log('使用开发环境token，设置用户ID为:', 1);
    
    // 确保该用户的订单数组存在
    if (!userOrders[1]) {
      userOrders[1] = [];
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
  
  console.log('解析到的用户ID字符串:', userId);
  
  if (!userId) {
    console.log('无法解析用户ID，使用默认用户');
    req.userId = 1;
    
    // 确保该用户的订单数组存在
    if (!userOrders[1]) {
      userOrders[1] = [];
    }
    
    next();
    return;
  }
  
  // 将用户ID转换为数字
  const numericUserId = parseInt(userId);
  console.log('转换后的数字用户ID:', numericUserId);
  
  // 如果转换失败，使用默认用户ID
  if (isNaN(numericUserId)) {
    console.log('用户ID转换失败，使用默认用户');
    req.userId = 1;
    
    // 确保该用户的订单数组存在
    if (!userOrders[1]) {
      userOrders[1] = [];
    }
  } else {
    // 将用户ID添加到请求对象中
    req.userId = numericUserId;
    
    // 确保该用户的订单数组存在
    if (!userOrders[numericUserId]) {
      userOrders[numericUserId] = [];
    }
  }
  
  next();
};

// 创建订单
router.post('/', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { address_id, remark, payment_type, items } = req.body;
  
  // 添加调试信息
  console.log('Mock服务器接收到的订单数据:');
  console.log('- userId:', userId);
  console.log('- address_id:', address_id);
  console.log('- remark:', remark);
  console.log('- payment_type:', payment_type);
  console.log('- items:', items);
  console.log('- items类型:', typeof items);
  console.log('- items是否为数组:', Array.isArray(items));
  console.log('- items长度:', items ? items.length : 'undefined');
  console.log('- req.body完整内容:', JSON.stringify(req.body, null, 2));
  
  if (!address_id) {
    return res.json({
      code: 400,
      message: '收货地址不能为空',
      data: null
    });
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    console.log('订单商品验证失败 - items:', items);
    return res.json({
      code: 400,
      message: '订单商品不能为空',
      data: null
    });
  }
  
  // 使用前端传递的商品数据
  const cartItems = items.map(item => ({
    id: item.id || Date.now() + Math.random(),
    cocktail_id: item.cocktail_id || item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity,
    selected: true
  }));
  
  // 计算订单总金额
  const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  
  // 创建新订单，使用当前准确时间
  const now = new Date();
  const timestamp = now.getTime();
  const formattedTime = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
  
  // 生成唯一订单编号
  const orderNo = `ORD${timestamp}`;
  
  const newOrder = {
    id: orderNo,          // 使用订单编号作为唯一ID
    order_no: orderNo,    // 订单编号字段
    user_id: userId,
    address_id: parseInt(address_id),
    items: cartItems,
    total_amount: totalAmount,
    remark: remark || '',
    payment_type: payment_type || 'wechat',
    status: 0, // 0: 待支付, 1: 已支付, 2: 已发货, 3: 已完成, 4: 已取消
    created_at: formattedTime,
    paid_at: null,
    delivered_at: null,
    completed_at: null,
    cancelled_at: null
  };
  
  console.log('创建新订单，下单时间:', formattedTime, '时间戳:', timestamp);
  
  userOrders[userId].push(newOrder);
  
  res.json({
    code: 200,
    message: '创建订单成功',
    data: newOrder
  });
});

// 获取订单列表
router.get('/', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { page = 1, limit = 10, status } = req.query;
  
  let filteredOrders = [...userOrders[userId]];
  
  // 按状态筛选
  if (status !== undefined) {
    filteredOrders = filteredOrders.filter(o => o.status === parseInt(status));
  }
  
  // 按下单时间排序：最新的订单排在前面
  filteredOrders.sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return timeB - timeA; // 降序排列，最新的在前
  });
  
  console.log('订单列表排序后:', filteredOrders.map(o => ({
    id: o.id,
    created_at: o.created_at,
    status: o.status
  })));
  
  // 分页
  const pageNum = parseInt(page);
  const pageSize = parseInt(limit);
  const startIndex = (pageNum - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
  
  res.json({
    code: 200,
    message: '获取订单列表成功',
    data: {
      total: filteredOrders.length,
      page: pageNum,
      limit: pageSize,
      list: paginatedOrders
    }
  });
});

// 获取订单详情
router.get('/:id', authMiddleware, (req, res) => {
  const userId = req.userId;
  const orderId = req.params.id;
  
  const order = userOrders[userId].find(o => o.id === orderId);
  
  if (order) {
    res.json({
      code: 200,
      message: '获取订单详情成功',
      data: order
    });
  } else {
    res.json({
      code: 404,
      message: '订单不存在',
      data: null
    });
  }
});

// 支付订单
router.post('/:id/pay', authMiddleware, (req, res) => {
  const userId = req.userId;
  const orderId = req.params.id;
  const { payment_type } = req.body;
  
  const order = userOrders[userId].find(o => o.id === orderId);
  
  if (!order) {
    return res.json({
      code: 404,
      message: '订单不存在',
      data: null
    });
  }
  
  if (order.status !== 0) {
    return res.json({
      code: 400,
      message: '订单状态错误，无法支付',
      data: null
    });
  }
  
  // 更新订单状态 - 支付成功后自动发货（模拟快速处理）
  order.status = 2; // 直接设为已发货状态，用户需要确认收货
  order.payment_type = payment_type || order.payment_type;
  
  // 使用当前准确时间记录支付时间
  const now = new Date();
  const paidTime = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
  
  order.paid_at = paidTime;
  
  // 模拟立即发货
  setTimeout(() => {
    const deliveryTime = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
    order.delivered_at = deliveryTime;
  }, 1000);
  
  console.log('订单支付成功，支付时间:', paidTime);
  
  console.log(`订单 ${orderId} 支付成功，状态更新为: ${order.status} (已发货，等待收货)`);
  
  res.json({
    code: 200,
    message: '支付成功，商家正在准备发货',
    data: order
  });
});

// 取消订单
router.post('/:id/cancel', authMiddleware, (req, res) => {
  const userId = req.userId;
  const orderId = req.params.id;
  const { reason } = req.body;
  
  const order = userOrders[userId].find(o => o.id === orderId);
  
  if (!order) {
    return res.json({
      code: 404,
      message: '订单不存在',
      data: null
    });
  }
  
  if (order.status !== 0) {
    return res.json({
      code: 400,
      message: '订单状态错误，无法取消',
      data: null
    });
  }
  
  // 更新订单状态
  order.status = 4;
  order.cancel_reason = reason || '用户取消';
  
  // 使用当前准确时间记录取消时间
  const cancelTime = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
  
  order.cancelled_at = cancelTime;
  
  console.log('订单取消成功，取消时间:', cancelTime);
  
  res.json({
    code: 200,
    message: '取消订单成功',
    data: order
  });
});

// 确认收货
router.post('/:id/confirm', authMiddleware, (req, res) => {
  const userId = req.userId;
  const orderId = req.params.id;
  
  const order = userOrders[userId].find(o => o.id === orderId);
  
  if (!order) {
    return res.json({
      code: 404,
      message: '订单不存在',
      data: null
    });
  }
  
  if (order.status !== 2) {
    return res.json({
      code: 400,
      message: '订单状态错误，无法确认收货',
      data: null
    });
  }
  
  // 更新订单状态
  order.status = 3;
  
  // 使用当前准确时间记录完成时间
  const completedTime = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
  
  order.completed_at = completedTime;
  
  console.log('确认收货成功，完成时间:', completedTime);
  
  res.json({
    code: 200,
    message: '确认收货成功',
    data: order
  });
});

module.exports = router; 