<template>
  <view class="container">
    <view class="login-box">
      <!-- Logo -->
      <view class="logo-box">
        <image src="/static/logo.svg" mode="aspectFit" class="logo-image"></image>
        <text class="logo-text">WhyQiuQiu</text>
      </view>
      
      <!-- 登录表单 -->
      <view class="form-box">
        <view class="form-item">
          <view class="form-icon">
            <view class="fa fa-user"></view>
          </view>
          <input 
            type="text" 
            placeholder="用户名/手机号" 
            class="form-input" 
            v-model="loginForm.username"
            @blur="validateUsername"
          />
        </view>
        <view class="form-error" v-if="errors.username">{{ errors.username }}</view>
        
        <view class="form-item">
          <view class="form-icon">
            <view class="fa fa-lock"></view>
          </view>
          <input 
            :type="showPassword ? 'text' : 'password'" 
            placeholder="密码" 
            class="form-input" 
            v-model="loginForm.password"
            @blur="validatePassword"
          />
          <view class="form-icon right" @tap="togglePasswordVisibility">
            <view :class="showPassword ? 'fa fa-eye-slash' : 'fa fa-eye'"></view>
          </view>
        </view>
        <view class="form-error" v-if="errors.password">{{ errors.password }}</view>
        
        <view class="form-options">
          <view class="remember-me">
            <view 
              class="checkbox" 
              :class="{ selected: loginForm.remember }" 
              @tap="toggleRemember"
            >
              <view class="fa fa-check" v-if="loginForm.remember"></view>
            </view>
            <text class="remember-text">记住我</text>
          </view>
          <view class="forgot-password" @tap="goToForgotPassword">忘记密码？</view>
        </view>
        
        <view 
          class="login-btn" 
          :class="{ disabled: isLoading || !isFormValid }" 
          @tap="login"
        >
          <text v-if="!isLoading">登录</text>
          <view v-else class="loading-spinner"></view>
        </view>
        
        <view class="divider">
          <view class="divider-line"></view>
          <text class="divider-text">或</text>
          <view class="divider-line"></view>
        </view>
        
        <view class="sms-login-btn" @tap="goToSmsLogin">
          <view class="fa fa-comment"></view>
          <text>短信验证码登录</text>
        </view>
      </view>
      
      <!-- 注册链接 -->
      <view class="register-link">
        <text>还没有账号？</text>
        <text class="register-text" @tap="goToRegister">立即注册</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// 获取全局App实例
const app = getApp();

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  remember: true
});

// 表单错误信息
const errors = reactive({
  username: '',
  password: '',
  general: ''
});

// 表单状态
const showPassword = ref(false);
const isLoading = ref(false);

// 表单验证
const validateUsername = () => {
  if (!loginForm.username) {
    errors.username = '请输入用户名或手机号';
    return false;
  }
  errors.username = '';
  return true;
};

const validatePassword = () => {
  if (!loginForm.password) {
    errors.password = '请输入密码';
    return false;
  }
  if (loginForm.password.length < 6) {
    errors.password = '密码长度不能小于6位';
    return false;
  }
  errors.password = '';
  return true;
};

const validateForm = () => {
  return validateUsername() && validatePassword();
};

// 计算属性：表单是否有效
const isFormValid = computed(() => {
  return loginForm.username && loginForm.password && loginForm.password.length >= 6;
});

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 切换记住我
const toggleRemember = () => {
  loginForm.remember = !loginForm.remember;
};

// 登录方法
const login = async () => {
  if (!validateForm()) return;
  
  isLoading.value = true;
  errors.general = '';
  
  try {
    // 调用登录API
    const data = await app.globalData.api.auth.login(
      loginForm.username,
      loginForm.password,
      loginForm.remember
    );
    
    // 存储token和用户信息
    uni.setStorageSync('token', data.token);
    uni.setStorageSync('userInfo', JSON.stringify(data.user_info));
    
    // 登录成功提示
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    });
    
    // 跳转到首页
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/home/home'
      });
    }, 1500);
  } catch (error) {
    console.error('登录失败:', error);
    errors.general = error.message || '登录失败，请检查用户名和密码';
    
    uni.showToast({
      title: errors.general,
      icon: 'none'
    });
  } finally {
    isLoading.value = false;
  }
};

// 页面跳转方法
const goToForgotPassword = () => {
  uni.navigateTo({
    url: '/pages/forgot-password/forgot-password'
  });
};

const goToSmsLogin = () => {
  uni.showToast({
    title: '短信登录功能开发中...',
    icon: 'none'
  });
};

const goToRegister = () => {
  uni.navigateTo({
    url: '/pages/register/register'
  });
};

// 页面加载
onLoad(() => {
  // 检查是否已登录
  const token = uni.getStorageSync('token');
  if (token) {
    uni.switchTab({
      url: '/pages/home/home'
    });
  }
});
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  padding: 40rpx;
}

.login-box {
  width: 100%;
  max-width: 600rpx;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Logo样式 */
.logo-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.logo-image {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 20rpx;
}

.logo-text {
  font-size: 40rpx;
  font-weight: 600;
  color: #8e44ad;
}

/* 表单样式 */
.form-box {
  width: 100%;
}

.form-item {
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #eee;
  padding: 20rpx 0;
  margin-bottom: 10rpx;
}

.form-icon {
  color: #999;
  margin-right: 20rpx;
}

.form-icon.right {
  margin-right: 0;
  margin-left: 20rpx;
}

.form-input {
  flex: 1;
  height: 60rpx;
  font-size: 28rpx;
}

.form-error {
  color: #ff4d4f;
  font-size: 24rpx;
  margin-bottom: 20rpx;
  height: 30rpx;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20rpx 0 40rpx;
}

.remember-me {
  display: flex;
  align-items: center;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border-radius: 6rpx;
  border: 2rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10rpx;
}

.checkbox.selected {
  background-color: #8e44ad;
  border-color: #8e44ad;
}

.checkbox .fa {
  color: #fff;
  font-size: 20rpx;
}

.remember-text {
  font-size: 26rpx;
  color: #666;
}

.forgot-password {
  font-size: 26rpx;
  color: #8e44ad;
}

.login-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  margin-bottom: 40rpx;
}

.login-btn.disabled {
  opacity: 0.7;
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  border-top: 3rpx solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.divider {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background-color: #eee;
}

.divider-text {
  padding: 0 20rpx;
  color: #999;
  font-size: 26rpx;
}

.sms-login-btn {
  width: 100%;
  height: 90rpx;
  background-color: #f5f5f5;
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 30rpx;
}

.sms-login-btn .fa {
  margin-right: 10rpx;
}

/* 注册链接 */
.register-link {
  margin-top: 60rpx;
  font-size: 28rpx;
  color: #666;
}

.register-text {
  color: #8e44ad;
  margin-left: 10rpx;
}
</style>
