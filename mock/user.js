const express = require('express');
const router = express.Router();

// 用户数据存储
const users = [
  {
    id: 1,
    username: 'user1',
    password: '123456',
    phone: '15925661344',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    nickname: '管理员',
    gender: 1,
    birthday: '1990-01-01',
    created_at: '2023-01-01 00:00:00'
  },
  {
    id: 2,
    username: 'user2',
    password: '123456',
    phone: '13800138002',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    nickname: '调酒师小王',
    gender: 2,
    birthday: '1992-02-02',
    created_at: '2023-02-02 00:00:00'
  }
];

// 用户地址存储（用户ID -> 地址数组）
const userAddresses = {
  1: [
    {
      id: 1,
      user_id: 1,
      name: '张三',
      phone: '13800138001',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      detail: '科技园南区8栋101',
      is_default: true
    },
    {
      id: 2,
      user_id: 1,
      name: '张三(公司)',
      phone: '13800138001',
      province: '广东省',
      city: '深圳市',
      district: '福田区',
      detail: '车公庙泰然大厦B座302',
      is_default: false
    }
  ],
  2: [
    {
      id: 3,
      user_id: 2,
      name: '李四',
      phone: '13800138002',
      province: '广东省',
      city: '广州市',
      district: '天河区',
      detail: '天河路123号',
      is_default: true
    }
  ]
};

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
    req.user = { ...users[0] };
    delete req.user.password;
    
    // 确保该用户的地址数组存在
    if (!userAddresses[1]) {
      userAddresses[1] = [...(userAddresses['1'] || [])]; // 复制字符串key的数据
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
  
  // 确保该用户存在
  const user = users.find(u => u.id === numericUserId);
  if (!user) {
    // 如果用户不存在，使用默认用户
    console.log(`用户ID ${userId} 不存在，使用默认用户`);
    req.userId = 1;
    req.user = { ...users[0] };
    delete req.user.password;
    
    // 确保该用户的地址数组存在
    if (!userAddresses[1]) {
      userAddresses[1] = [...(userAddresses['1'] || [])];
    }
  } else {
    // 将用户ID添加到请求对象中
    req.userId = numericUserId;
    
    // 将用户对象添加到请求中
    req.user = { ...user };
    delete req.user.password;
    
    // 确保该用户的地址数组存在
    if (!userAddresses[numericUserId]) {
      userAddresses[numericUserId] = [];
    }
  }
  
  next();
};

// 获取用户信息
router.get('/', authMiddleware, (req, res) => {
  res.json({
    code: 200,
    message: '获取用户信息成功',
    data: req.user
  });
});

// 更新用户信息
router.put('/', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { nickname, avatar, gender, birthday } = req.body;
  
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.json({
      code: 400,
      message: '用户不存在',
      data: null
    });
  }
  
  if (nickname) user.nickname = nickname;
  if (avatar) user.avatar = avatar;
  if (gender !== undefined) user.gender = parseInt(gender);
  if (birthday) user.birthday = birthday;
  
  const userInfo = { ...user };
  delete userInfo.password;
  
  res.json({
    code: 200,
    message: '更新用户信息成功',
    data: userInfo
  });
});

// 修改密码
router.put('/password', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { old_password, new_password, confirm_password } = req.body;
  
  if (!old_password || !new_password || !confirm_password) {
    return res.json({
      code: 400,
      message: '参数错误',
      data: null
    });
  }
  
  if (new_password !== confirm_password) {
    return res.json({
      code: 400,
      message: '两次输入的新密码不一致',
      data: null
    });
  }
  
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.json({
      code: 400,
      message: '用户不存在',
      data: null
    });
  }
  
  if (user.password !== old_password) {
    return res.json({
      code: 400,
      message: '原密码错误',
      data: null
    });
  }
  
  user.password = new_password;
  
  res.json({
    code: 200,
    message: '密码修改成功',
    data: null
  });
});

// 获取收货地址列表
router.get('/addresses', authMiddleware, (req, res) => {
  const userId = req.userId;
  const addresses = userAddresses[userId] || [];
  
  res.json({
    code: 200,
    message: '获取收货地址列表成功',
    data: addresses
  });
});

// 新增收货地址
router.post('/addresses', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { name, phone, province, city, district, detail, is_default } = req.body;
  
  if (!name || !phone || !province || !city || !district || !detail) {
    return res.json({
      code: 400,
      message: '请填写完整的地址信息',
      data: null
    });
  }
  
  const addresses = userAddresses[userId];
  
  // 如果设置为默认地址，先取消其他默认地址
  if (is_default) {
    addresses.forEach(addr => {
      addr.is_default = false;
    });
  }
  
  // 创建新地址
  const newAddress = {
    id: Date.now(),
    user_id: parseInt(userId),
    name,
    phone,
    province,
    city,
    district,
    detail,
    is_default: is_default || addresses.length === 0 // 如果是第一个地址，自动设为默认
  };
  
  addresses.push(newAddress);
  
  res.json({
    code: 200,
    message: '添加收货地址成功',
    data: newAddress
  });
});

// 更新收货地址
router.put('/addresses/:id', authMiddleware, (req, res) => {
  const userId = req.userId;
  const addressId = parseInt(req.params.id);
  const { name, phone, province, city, district, detail, is_default } = req.body;
  
  const addresses = userAddresses[userId];
  const address = addresses.find(addr => addr.id === addressId);
  
  if (!address) {
    return res.json({
      code: 404,
      message: '地址不存在',
      data: null
    });
  }
  
  // 更新地址信息
  if (name) address.name = name;
  if (phone) address.phone = phone;
  if (province) address.province = province;
  if (city) address.city = city;
  if (district) address.district = district;
  if (detail) address.detail = detail;
  
  // 如果设置为默认地址，先取消其他默认地址
  if (is_default) {
    addresses.forEach(addr => {
      addr.is_default = addr.id === addressId;
    });
  }
  
  res.json({
    code: 200,
    message: '更新收货地址成功',
    data: address
  });
});

// 删除收货地址
router.delete('/addresses/:id', authMiddleware, (req, res) => {
  const userId = req.userId;
  const addressId = parseInt(req.params.id);
  
  const addresses = userAddresses[userId];
  const index = addresses.findIndex(addr => addr.id === addressId);
  
  if (index === -1) {
    return res.json({
      code: 404,
      message: '地址不存在',
      data: null
    });
  }
  
  // 如果删除的是默认地址，且还有其他地址，则将第一个地址设为默认
  const isDefault = addresses[index].is_default;
  addresses.splice(index, 1);
  
  if (isDefault && addresses.length > 0) {
    addresses[0].is_default = true;
  }
  
  res.json({
    code: 200,
    message: '删除收货地址成功',
    data: null
  });
});

// 设置默认收货地址
router.post('/addresses/:id/default', authMiddleware, (req, res) => {
  const userId = req.userId;
  const addressId = parseInt(req.params.id);
  
  const addresses = userAddresses[userId];
  const address = addresses.find(addr => addr.id === addressId);
  
  if (!address) {
    return res.json({
      code: 404,
      message: '地址不存在',
      data: null
    });
  }
  
  // 取消其他默认地址，设置当前地址为默认
  addresses.forEach(addr => {
    addr.is_default = addr.id === addressId;
  });
  
  res.json({
    code: 200,
    message: '设置默认地址成功',
    data: address
  });
});

module.exports = router; 