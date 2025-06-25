# 鸡尾酒点单应用 - 前端对接文档

## 概述

本文档详细描述了鸡尾酒点单应用API的前端对接方式，包括接口调用方法、认证机制、错误处理等内容，帮助前端开发人员快速集成后端API。

## 基础信息

### 基础URL
根据服务器实际响应情况，目前API仅支持根路径访问：

```
https://bkefcrjemrja.sealoshzh.site
```

> **重要提示**：我们检测到API服务器正在运行，但目前仅有根路径(`/`)可以正常访问，返回`{"message":"鸡尾酒点单应用API服务","version":"1.0.0"}`。所有其他路径（包括`/auth/login`、`/v1/auth/login`等）均返回404错误。这表明API服务器可能尚未完全部署或存在路由配置问题。

### API服务器状态排查

我们已经进行了以下测试，确认API服务器状态：

1. 根路径访问成功：
```
$ curl https://bkefcrjemrja.sealoshzh.site
{"message":"鸡尾酒点单应用API服务","version":"1.0.0"}
```

2. 尝试访问登录接口（失败）：
```
$ curl https://bkefcrjemrja.sealoshzh.site/v1/auth/login
{"code":404,"message":"请求的资源不存在","data":null}
```

3. 尝试不带前缀访问（失败）：
```
$ curl https://bkefcrjemrja.sealoshzh.site/auth/login
{"code":404,"message":"请求的资源不存在","data":null}
```

### 临时解决方案

在API服务器完全部署前，前端可以采取以下临时解决方案：

1. **使用Mock服务器**：使用我们提供的Mock服务器模拟API响应
2. **使用本地开发服务器**：在本地运行API服务器进行开发
3. **联系后端开发人员**：确认API部署状态和正确的接口路径

### 请求头设置
当API服务可用时，所有需要认证的接口都需要在请求头中携带token：
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`  // token由登录接口获取
};
```

### 响应格式
所有接口返回的数据格式统一为：
```json
{
  "code": 200,      // 状态码，200表示成功，非200表示失败
  "message": "操作成功", // 提示信息
  "data": {}        // 返回的数据，可能是对象、数组或null
}
```

### 错误处理
前端应统一处理API返回的错误码：

| 错误码 | 说明 | 前端处理建议 |
| ----- | ---- | ----------- |
| 200   | 成功 | 正常处理响应数据 |
| 400   | 请求参数错误 | 提示用户参数错误信息 |
| 401   | 未授权（未登录或token失效） | 跳转到登录页面，清除本地token |
| 403   | 权限不足 | 提示用户无权限访问 |
| 404   | 资源不存在 | 提示用户请求的资源不存在 |
| 500   | 服务器内部错误 | 提示系统异常，请稍后重试 |

## 前端开发建议

### 1. 使用Mock数据进行开发

由于API服务器尚未完全部署，我们提供了一个完整的Mock数据服务器，可以模拟所有API接口的响应：

#### 启动Mock服务器

```bash
# 进入项目目录
cd project

# 安装依赖
npm install

# 启动Mock服务器
npm run mock

# 或者使用开发模式（自动重启）
npm run mock:dev
```

启动后，Mock服务器将运行在 http://localhost:3001，并在控制台输出所有可用的Mock接口。

#### 配置前端使用Mock服务器

在前端项目中，配置API基础URL指向Mock服务器：

```javascript
// api/config.js
export const API_CONFIG = {
  // API基础URL，根据环境变量选择
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3001'  // 开发环境使用Mock服务器
    : 'https://bkefcrjemrja.sealoshzh.site',  // 生产环境使用实际API
  // 超时时间
  timeout: 10000
};
```

#### Mock服务器提供的接口

Mock服务器提供了与实际API完全一致的接口，包括：

- **认证相关**：登录、注册、短信验证码等
- **鸡尾酒相关**：鸡尾酒列表、详情、推荐等
- **分类相关**：分类列表、详情等
- **购物车相关**：购物车操作、商品管理等
- **订单相关**：订单创建、支付、查询等
- **用户相关**：用户信息、地址管理等

完整的接口列表请参考 `mock/README.md` 文件或启动Mock服务器后在控制台查看。

#### 自定义Mock数据

如需自定义Mock数据，可以修改 `mock` 目录下对应模块的js文件。例如，要修改鸡尾酒列表数据，可以编辑 `mock/cocktail.js` 文件中的 `cocktailList` 数组。

### 2. 配置可切换的API环境

创建一个可以在Mock服务器和实际API之间切换的配置：

```javascript
// api/index.js
import axios from 'axios';
import { API_CONFIG } from './config';

// 创建axios实例
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: { 'Content-Type': 'application/json' }
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.code !== 200) {
      if (res.code === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
      }
      return Promise.reject(new Error(res.message || '请求失败'));
    } else {
      return res.data;
    }
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 封装API请求函数
export const apiRequest = async (method, url, data) => {
  try {
    let response;
    if (method === 'get') {
      response = await api.get(url, { params: data });
    } else {
      response = await api[method](url, data);
    }
    return response;
  } catch (error) {
    console.error(`${method.toUpperCase()} ${url} 请求失败:`, error);
    throw error;
  }
};

// API函数
export const login = (username, password, remember) => {
  return apiRequest('post', '/auth/login', { username, password, remember });
};

export const getUser = () => {
  return apiRequest('get', '/user');
};

// 更多API函数...
```

### 3. 使用本地开发服务器

如果您有权限访问API源代码，可以在本地运行API服务器：

```bash
# 克隆API仓库
git clone <api-repository-url>

# 安装依赖
cd api-project
npm install

# 启动本地服务器
npm run dev
```

然后配置前端项目使用本地API：

```javascript
// .env.development
VUE_APP_API_BASE_URL = 'http://localhost:8080'
```

## 后续步骤

1. **联系后端开发团队**：确认API部署状态和正确的接口路径
2. **监控API服务器状态**：定期检查API服务器是否已完全部署
3. **更新文档**：一旦API服务器完全部署，更新此文档

## 联系与支持

如有API对接问题，请联系后端开发团队：
- 邮箱：support@whyqiuqiu.com
- 技术支持QQ群：123456789 