const express = require('express');
const router = express.Router();

// 模拟用户数据
const users = [
  {
    id: 1,
    username: 'user1',
    password: '123456',
    phone: '13800138001',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    nickname: '鸡尾酒爱好者',
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

// 模拟验证码
const smsCodes = {};

// 生成token
const generateToken = (userId) => {
  return `mock_token_${userId}_${Date.now()}`;
};

// 账号密码登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => (u.username === username || u.phone === username) && u.password === password);
  
  if (user) {
    const token = generateToken(user.id);
    const userInfo = { ...user };
    delete userInfo.password;
    
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user_info: userInfo
      }
    });
  } else {
    res.json({
      code: 400,
      message: '用户名或密码错误',
      data: null
    });
  }
});

// 短信验证码登录
router.post('/login/sms', (req, res) => {
  const { phone, code } = req.body;
  
  const user = users.find(u => u.phone === phone);
  const validCode = smsCodes[phone];
  
  if (user && validCode && validCode === code) {
    const token = generateToken(user.id);
    const userInfo = { ...user };
    delete userInfo.password;
    
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user_info: userInfo
      }
    });
  } else {
    res.json({
      code: 400,
      message: '手机号或验证码错误',
      data: null
    });
  }
});

// 发送短信验证码
router.post('/sms', (req, res) => {
  const { phone, type } = req.body;
  
  if (!phone) {
    return res.json({
      code: 400,
      message: '手机号不能为空',
      data: null
    });
  }
  
  // 生成6位随机验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  smsCodes[phone] = code;
  
  console.log(`向 ${phone} 发送${type}验证码: ${code}`);
  
  res.json({
    code: 200,
    message: '验证码发送成功',
    data: null
  });
});

// 用户注册
router.post('/register', (req, res) => {
  const { phone, code, password, confirm_password } = req.body;
  
  if (password !== confirm_password) {
    return res.json({
      code: 400,
      message: '两次输入的密码不一致',
      data: null
    });
  }
  
  const validCode = smsCodes[phone];
  if (!validCode || validCode !== code) {
    return res.json({
      code: 400,
      message: '验证码错误',
      data: null
    });
  }
  
  if (users.some(u => u.phone === phone)) {
    return res.json({
      code: 400,
      message: '该手机号已注册',
      data: null
    });
  }
  
  // 创建新用户
  const newUser = {
    id: users.length + 1,
    username: `user${users.length + 1}`,
    password,
    phone,
    avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${users.length + 1}.jpg`,
    nickname: `用户${phone.substring(7)}`,
    gender: 0,
    birthday: null,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  
  users.push(newUser);
  
  const token = generateToken(newUser.id);
  const userInfo = { ...newUser };
  delete userInfo.password;
  
  res.json({
    code: 200,
    message: '注册成功',
    data: {
      token,
      user_info: userInfo
    }
  });
});

// 重置密码
router.post('/reset-password', (req, res) => {
  const { phone, code, password, confirm_password } = req.body;
  
  if (password !== confirm_password) {
    return res.json({
      code: 400,
      message: '两次输入的密码不一致',
      data: null
    });
  }
  
  const validCode = smsCodes[phone];
  if (!validCode || validCode !== code) {
    return res.json({
      code: 400,
      message: '验证码错误',
      data: null
    });
  }
  
  const user = users.find(u => u.phone === phone);
  if (!user) {
    return res.json({
      code: 400,
      message: '该手机号未注册',
      data: null
    });
  }
  
  // 更新密码
  user.password = password;
  
  res.json({
    code: 200,
    message: '密码重置成功',
    data: null
  });
});

// 退出登录
router.post('/logout', (req, res) => {
  res.json({
    code: 200,
    message: '退出登录成功',
    data: null
  });
});

module.exports = router; 