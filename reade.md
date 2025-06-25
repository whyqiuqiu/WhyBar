# 鸡尾酒点单应用 Mock 数据

这个目录包含了鸡尾酒点单应用的Mock数据和Mock服务器，用于前端开发过程中模拟API响应。

## 目录结构

```
mock/
  ├── index.js          # Mock数据入口文件
  ├── server.js         # Mock服务器
  ├── auth.js           # 认证相关Mock数据
  ├── cocktail.js       # 鸡尾酒相关Mock数据
  ├── category.js       # 分类相关Mock数据
  ├── cart.js           # 购物车相关Mock数据
  ├── order.js          # 订单相关Mock数据
  └── user.js           # 用户相关Mock数据
```

## 使用方法

### 启动Mock服务器

```bash
# 安装依赖
npm install

# 启动Mock服务器
npm run mock

# 或者使用开发模式（自动重启）
npm run mock:dev
```

启动后，Mock服务器将运行在 http://localhost:3001

### 前端开发集成

在前端开发中，可以配置API基础URL指向Mock服务器：

```javascript
// 开发环境使用Mock服务器
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001' 
  : 'https://api.example.com';
```

### 可用的Mock接口

启动Mock服务器后，控制台会输出所有可用的Mock接口。主要包括：

#### 认证相关
- `[POST] /auth/login` - 账号密码登录
- `[POST] /auth/login/sms` - 短信验证码登录
- `[POST] /auth/sms/send` - 发送短信验证码
- `[POST] /auth/register` - 用户注册
- `[POST] /auth/reset/password` - 重置密码
- `[POST] /auth/logout` - 退出登录

#### 鸡尾酒相关
- `[GET] /cocktails` - 获取鸡尾酒列表
- `[GET] /cocktails/{id}` - 获取鸡尾酒详情
- `[GET] /cocktails/recommended` - 获取推荐鸡尾酒

#### 分类相关
- `[GET] /categories` - 获取分类列表
- `[GET] /categories/{id}` - 获取分类详情

#### 购物车相关
- `[GET] /cart` - 获取购物车列表
- `[POST] /cart/add` - 添加商品到购物车
- `[POST] /cart/update` - 更新购物车商品数量
- `[POST] /cart/remove` - 删除购物车商品
- `[POST] /cart/clear` - 清空购物车
- `[POST] /cart/select` - 选择或取消选择购物车商品

#### 订单相关
- `[GET] /orders` - 获取订单列表
- `[GET] /orders/{id}` - 获取订单详情
- `[POST] /orders/create` - 创建订单
- `[POST] /orders/pay` - 支付订单
- `[POST] /orders/cancel` - 取消订单

#### 用户相关
- `[GET] /user` - 获取用户信息
- `[POST] /user/update` - 更新用户信息
- `[GET] /user/addresses` - 获取地址列表
- `[GET] /user/addresses/{id}` - 获取地址详情
- `[POST] /user/addresses/add` - 添加地址
- `[POST] /user/addresses/update` - 更新地址
- `[POST] /user/addresses/delete` - 删除地址
- `[POST] /user/addresses/set/default` - 设置默认地址

## 自定义Mock数据

如需自定义Mock数据，可以修改对应模块的js文件。例如，要修改鸡尾酒列表数据，可以编辑 `cocktail.js` 文件中的 `cocktailList` 数组。

## 注意事项

1. Mock数据仅用于前端开发阶段，不应在生产环境中使用。
2. Mock服务器默认在端口3001上运行，可通过环境变量PORT修改。
3. 所有接口都有300ms的模拟延迟，以模拟真实网络环境。 