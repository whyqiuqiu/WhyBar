<script>
import { useUserStore } from './stores/user.js';

export default {
  onLaunch: function () {
    console.log('App Launch')
    // 初始化时从本地存储加载购物车数据
    try {
      const cartData = uni.getStorageSync('cartItems');
      if (cartData) {
        this.globalData.cartItems = JSON.parse(cartData);
      }
    } catch (e) {
      console.error('读取购物车数据失败:', e);
    }
    
    // 初始化用户状态
    this.initUserState();
  },
  
  // 初始化用户状态
  initUserState() {
    try {
      const userStore = useUserStore();
      userStore.initUserFromStorage();
    } catch (error) {
      console.error('初始化用户状态失败:', error);
    }
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
  globalData: {
    cartItems: [],
    cartUpdateCallbacks: [],
    // API配置
    apiConfig: {
      // 开发环境使用Mock服务器，生产环境使用实际API
      baseUrl: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/api'  // Mock服务器地址
        : 'https://bkefcrjemrja.sealoshzh.site/api',  // 生产环境API地址
      timeout: 10000
    },
    
    // 注册购物车更新回调
    onCartUpdate(callback) {
      this.cartUpdateCallbacks.push(callback);
      return callback; // 返回回调函数以便后续移除
    },
    
    // 移除购物车更新回调
    offCartUpdate(callback) {
      const index = this.cartUpdateCallbacks.indexOf(callback);
      if (index !== -1) {
        this.cartUpdateCallbacks.splice(index, 1);
        return true;
      }
      return false;
    },
    
    // 触发购物车更新事件
    triggerCartUpdate() {
      this.cartUpdateCallbacks.forEach(callback => {
        callback();
      });
      
      // 更新时保存到本地存储
      try {
        uni.setStorageSync('cartItems', JSON.stringify(this.cartItems));
      } catch (e) {
        console.error('保存购物车数据失败:', e);
      }
    },
    
    addToCart(item, quantity = 1) {
      // 检查商品是否已在购物车中
      const existingItem = this.cartItems.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        // 如果已存在，增加数量
        existingItem.quantity += quantity;
      } else {
        // 如果不存在，添加新商品
        this.cartItems.push({
          id: item.id,
          name: item.name,
          price: Number(item.price), // 确保价格是数字类型
          image: item.image,
          quantity: quantity,
          selected: true
        });
      }
      
      // 触发购物车更新事件
      this.triggerCartUpdate();
      
      // 返回当前购物车商品数量
      return this.getCartCount();
    },
    
    removeFromCart(itemId) {
      const index = this.cartItems.findIndex(item => item.id === itemId);
      if (index !== -1) {
        this.cartItems.splice(index, 1);
        // 触发购物车更新事件
        this.triggerCartUpdate();
      }
    },
    
    updateCartItemQuantity(itemId, quantity) {
      const item = this.cartItems.find(item => item.id === itemId);
      if (item) {
        item.quantity = quantity;
        // 触发购物车更新事件
        this.triggerCartUpdate();
      }
    },
    
    getCartItems() {
      return this.cartItems;
    },
    
    getCartCount() {
      return this.cartItems.reduce((count, item) => count + item.quantity, 0);
    },
    
    getCartTotal() {
      return this.cartItems.reduce((total, item) => {
        if (item.selected) {
          // 确保价格和数量都是数字类型
          const price = Number(item.price);
          const quantity = Number(item.quantity);
          return total + (price * quantity);
        }
        return total;
      }, 0);
    },
    
    toggleItemSelection(itemId) {
      const item = this.cartItems.find(item => item.id === itemId);
      if (item) {
        item.selected = !item.selected;
        // 触发购物车更新事件
        this.triggerCartUpdate();
      }
    },
    
    toggleAllSelection(selected) {
      this.cartItems.forEach(item => {
        item.selected = selected;
      });
      // 触发购物车更新事件
      this.triggerCartUpdate();
    },
    
    clearCart() {
      this.cartItems = [];
      // 触发购物车更新事件
      this.triggerCartUpdate();
    },
    
    // API请求方法
    async request(options) {
      let token = uni.getStorageSync('token');
      
      // 开发环境下，如果没有token，使用测试token
      if (!token && process.env.NODE_ENV === 'development') {
        token = 'mock-token-for-development';
        // 同时设置一个测试用户信息
        if (!uni.getStorageSync('userInfo')) {
          uni.setStorageSync('userInfo', {
            id: 1,
            username: 'user1',
            phone: '13800138001',
            nickname: '测试用户'
          });
          uni.setStorageSync('token', token);
        }
      }
      
      const defaultOptions = {
        url: this.apiConfig.baseUrl + options.url,
        method: options.method || 'GET',
        header: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...options.header
        },
        data: options.data,
        timeout: this.apiConfig.timeout
      };
      
      try {
        const response = await new Promise((resolve, reject) => {
          uni.request({
            ...defaultOptions,
            success: (res) => {
              const { data } = res;
              
              // 处理错误状态码
              if (data.code !== 200) {
                // 401: 未登录或token过期
                if (data.code === 401) {
                  // 开发环境下使用Mock服务器，不强制跳转登录
                  if (process.env.NODE_ENV !== 'development') {
                    // 清除token并跳转到登录页
                    uni.removeStorageSync('token');
                    uni.removeStorageSync('userInfo');
                    
                    uni.showToast({
                      title: '登录已过期，请重新登录',
                      icon: 'none'
                    });
                    
                    setTimeout(() => {
                      uni.navigateTo({ url: '/pages/index/index' });
                    }, 1500);
                  } else {
                    // 开发环境下只显示提示，不跳转
                    console.warn('开发环境：模拟登录状态');
                  }
                }
                
                reject(new Error(data.message || '请求失败'));
                return;
              }
              
              resolve(data.data);
            },
            fail: (err) => {
              reject(err);
            }
          });
        });
        
        return response;
      } catch (error) {
        console.error('请求错误:', error);
        throw error;
      }
    },
    
    // API接口方法
    api: {
      // 用户认证相关接口
      auth: {
        // 账号密码登录
        login(username, password, remember = true) {
          return getApp().globalData.request({
            url: '/auth/login',
            method: 'POST',
            data: { username, password, remember }
          });
        },
        
        // 短信验证码登录
        loginBySms(phone, code) {
          return getApp().globalData.request({
            url: '/auth/login/sms',
            method: 'POST',
            data: { phone, code }
          });
        },
        
        // 发送短信验证码
        sendSmsCode(phone, type) {
          return getApp().globalData.request({
            url: '/auth/sms',
            method: 'POST',
            data: { phone, type }
          });
        },
        
        // 用户注册
        register(phone, code, password, confirm_password) {
          return getApp().globalData.request({
            url: '/auth/register',
            method: 'POST',
            data: { phone, code, password, confirm_password }
          });
        },
        
        // 重置密码
        resetPassword(phone, code, password, confirm_password) {
          return getApp().globalData.request({
            url: '/auth/reset-password',
            method: 'POST',
            data: { phone, code, password, confirm_password }
          });
        },
        
        // 退出登录
        logout() {
          return getApp().globalData.request({
            url: '/auth/logout',
            method: 'POST'
          });
        }
      },
      
      // 鸡尾酒相关接口
      cocktails: {
        // 获取鸡尾酒列表
        getList(params = {}) {
          const { page = 1, limit = 10, category_id, keyword, tag } = params;
          let url = `/cocktails?page=${page}&limit=${limit}`;
          
          if (category_id) url += `&category_id=${category_id}`;
          if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
          if (tag) url += `&tag=${encodeURIComponent(tag)}`;
          
          return getApp().globalData.request({ url });
        },
        
        // 获取鸡尾酒详情
        getDetail(id) {
          return getApp().globalData.request({
            url: `/cocktails/${id}`
          });
        },
        
        // 获取鸡尾酒分类列表
        getCategories() {
          return getApp().globalData.request({
            url: '/cocktail-categories'
          });
        },
        
        // 获取推荐鸡尾酒列表
        getRecommended(limit = 6) {
          return getApp().globalData.request({
            url: `/cocktails/recommended?limit=${limit}`
          });
        }
      },
      
      // 购物车相关接口
      cart: {
        // 获取购物车列表
        getList() {
          return getApp().globalData.request({
            url: '/cart'
          });
        },
        
        // 添加商品到购物车
        add(cocktail_id, quantity = 1) {
          return getApp().globalData.request({
            url: '/cart/add',
            method: 'POST',
            data: { cocktail_id, quantity }
          });
        },
        
        // 更新购物车商品数量
        update(cart_id, quantity) {
          return getApp().globalData.request({
            url: '/cart/update',
            method: 'POST',
            data: { cart_id, quantity }
          });
        },
        
        // 删除购物车商品
        remove(cart_id) {
          return getApp().globalData.request({
            url: '/cart/remove',
            method: 'POST',
            data: { cart_id }
          });
        },
        
        // 更新购物车商品选中状态
        select(cart_id, selected) {
          return getApp().globalData.request({
            url: '/cart/select',
            method: 'POST',
            data: { cart_id, selected }
          });
        },
        
        // 全选/取消全选购物车商品
        selectAll(selected) {
          return getApp().globalData.request({
            url: '/cart/select-all',
            method: 'POST',
            data: { selected }
          });
        },
        
        // 清空购物车
        clear() {
          return getApp().globalData.request({
            url: '/cart/clear',
            method: 'POST'
          });
        }
      },
      
      // 订单相关接口
      orders: {
        // 创建订单
        create(address_id, remark, payment_type, items) {
          return getApp().globalData.request({
            url: '/orders',
            method: 'POST',
            data: { address_id, remark, payment_type, items }
          });
        },
        
        // 获取订单列表
        getList(params = {}) {
          const { page = 1, limit = 10, status } = params;
          let url = `/orders?page=${page}&limit=${limit}`;
          
          // 只有当status参数存在时才添加到URL中
          if (status !== undefined) {
            url += `&status=${status}`;
          }
          
          console.log('API orders.getList 请求URL:', url, '原始参数:', params);
          
          return getApp().globalData.request({
            url: url
          });
        },
        
        // 获取订单详情
        getDetail(id) {
          return getApp().globalData.request({
            url: `/orders/${id}`
          });
        },
        
        // 取消订单
        cancel(id, reason) {
          return getApp().globalData.request({
            url: `/orders/${id}/cancel`,
            method: 'POST',
            data: { reason }
          });
        },
        
        // 确认收货
        confirm(id) {
          return getApp().globalData.request({
            url: `/orders/${id}/confirm`,
            method: 'POST'
          });
        },
        
        // 订单支付
        pay(id, payment_type) {
          return getApp().globalData.request({
            url: `/orders/${id}/pay`,
            method: 'POST',
            data: { payment_type }
          });
        }
      },
      
      // 用户相关接口
      user: {
        // 获取用户信息
        getInfo() {
          return getApp().globalData.request({
            url: '/user'
          });
        },
        
        // 更新用户信息
        updateInfo(data) {
          return getApp().globalData.request({
            url: '/user',
            method: 'PUT',
            data
          });
        },
        
        // 修改密码
        updatePassword(old_password, new_password, confirm_password) {
          return getApp().globalData.request({
            url: '/user/password',
            method: 'PUT',
            data: { old_password, new_password, confirm_password }
          });
        },
        
        // 获取收货地址列表
        getAddresses() {
          return getApp().globalData.request({
            url: '/user/addresses'
          });
        },
        
        // 新增收货地址
        addAddress(data) {
          return getApp().globalData.request({
            url: '/user/addresses',
            method: 'POST',
            data
          });
        },
        
        // 更新收货地址
        updateAddress(id, data) {
          return getApp().globalData.request({
            url: `/user/addresses/${id}`,
            method: 'PUT',
            data
          });
        },
        
        // 删除收货地址
        deleteAddress(id) {
          return getApp().globalData.request({
            url: `/user/addresses/${id}`,
            method: 'DELETE'
          });
        },
        
        // 设置默认收货地址
        setDefaultAddress(id) {
          return getApp().globalData.request({
            url: `/user/addresses/${id}/default`,
            method: 'POST'
          });
        }
      }
    }
  }
}
</script>

<style>
/* 引入图标字体 */
@import url('./static/iconfont.css');
@import url('./static/fontawesome/all.css');

/* 全局样式 */
page {
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
</style>
