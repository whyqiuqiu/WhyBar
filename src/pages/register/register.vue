<template>
  <view class="container">
    <view class="register-box">
      <!-- 返回按钮 -->
      <view class="back-btn" @tap="goBack">
        <view class="fa fa-arrow-left"></view>
      </view>
      
      <!-- 标题 -->
      <view class="title-box">
        <text class="title">注册账号</text>
        <text class="subtitle">创建一个新账号，开启鸡尾酒之旅</text>
      </view>
      
      <!-- 注册表单 -->
      <view class="form-box">
        <!-- 手机号 -->
        <view class="form-item">
          <view class="form-icon">
            <view class="fa fa-mobile"></view>
          </view>
          <input 
            type="number" 
            placeholder="手机号" 
            class="form-input" 
            v-model="registerForm.phone"
            maxlength="11"
            @blur="validatePhone"
          />
        </view>
        <view class="form-error" v-if="errors.phone">{{ errors.phone }}</view>
        
        <!-- 验证码 -->
        <view class="form-item">
          <view class="form-icon">
            <view class="fa fa-shield"></view>
          </view>
          <input 
            type="number" 
            placeholder="验证码" 
            class="form-input" 
            v-model="registerForm.code"
            maxlength="6"
            @blur="validateCode"
          />
          <view 
            class="code-btn" 
            :class="{ disabled: isSending || !isPhoneValid }"
            @tap="sendCode"
          >
            <text>{{ codeButtonText }}</text>
          </view>
        </view>
        <view class="form-error" v-if="errors.code">{{ errors.code }}</view>
        
        <!-- 密码 -->
        <view class="form-item">
          <view class="form-icon">
            <view class="fa fa-lock"></view>
          </view>
          <input 
            :type="showPassword ? 'text' : 'password'" 
            placeholder="密码 (至少6位)" 
            class="form-input" 
            v-model="registerForm.password"
            @blur="validatePassword"
          />
          <view class="form-icon right" @tap="togglePasswordVisibility">
            <view :class="showPassword ? 'fa fa-eye-slash' : 'fa fa-eye'"></view>
          </view>
        </view>
        <view class="form-error" v-if="errors.password">{{ errors.password }}</view>
        
        <!-- 确认密码 -->
        <view class="form-item">
          <view class="form-icon">
            <view class="fa fa-lock"></view>
          </view>
          <input 
            :type="showConfirmPassword ? 'text' : 'password'" 
            placeholder="确认密码" 
            class="form-input" 
            v-model="registerForm.confirmPassword"
            @blur="validateConfirmPassword"
          />
          <view class="form-icon right" @tap="toggleConfirmPasswordVisibility">
            <view :class="showConfirmPassword ? 'fa fa-eye-slash' : 'fa fa-eye'"></view>
          </view>
        </view>
        <view class="form-error" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</view>
        
        <!-- 注册按钮 -->
        <view 
          class="register-btn" 
          :class="{ disabled: isRegistering || !isFormValid }" 
          @tap="register"
        >
          <text v-if="!isRegistering">注册</text>
          <view v-else class="loading-spinner"></view>
        </view>
      </view>
      
      <!-- 登录链接 -->
      <view class="login-link">
        <text>已有账号？</text>
        <text class="login-text" @tap="goToLogin">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

// 获取全局App实例
const app = getApp();

// 注册表单数据
const registerForm = reactive({
  phone: '',
  code: '',
  password: '',
  confirmPassword: ''
});

// 表单错误信息
const errors = reactive({
  phone: '',
  code: '',
  password: '',
  confirmPassword: '',
  general: ''
});

// 表单状态
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isRegistering = ref(false);
const isSending = ref(false);
const countdown = ref(0);
const codeButtonText = computed(() => {
  return countdown.value > 0 ? `${countdown.value}秒后重发` : '获取验证码';
});

// 计算属性：手机号是否有效
const isPhoneValid = computed(() => {
  return /^1[3-9]\d{9}$/.test(registerForm.phone);
});

// 计算属性：表单是否有效
const isFormValid = computed(() => {
  return (
    isPhoneValid.value && 
    registerForm.code.length === 6 && 
    registerForm.password.length >= 6 && 
    registerForm.password === registerForm.confirmPassword
  );
});

// 表单验证
const validatePhone = () => {
  if (!registerForm.phone) {
    errors.phone = '请输入手机号';
    return false;
  }
  if (!isPhoneValid.value) {
    errors.phone = '请输入正确的手机号';
    return false;
  }
  errors.phone = '';
  return true;
};

const validateCode = () => {
  if (!registerForm.code) {
    errors.code = '请输入验证码';
    return false;
  }
  if (registerForm.code.length !== 6) {
    errors.code = '验证码应为6位数字';
    return false;
  }
  errors.code = '';
  return true;
};

const validatePassword = () => {
  if (!registerForm.password) {
    errors.password = '请输入密码';
    return false;
  }
  if (registerForm.password.length < 6) {
    errors.password = '密码长度不能小于6位';
    return false;
  }
  errors.password = '';
  // 如果确认密码已填写，则同时验证确认密码
  if (registerForm.confirmPassword) {
    validateConfirmPassword();
  }
  return true;
};

const validateConfirmPassword = () => {
  if (!registerForm.confirmPassword) {
    errors.confirmPassword = '请确认密码';
    return false;
  }
  if (registerForm.password !== registerForm.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致';
    return false;
  }
  errors.confirmPassword = '';
  return true;
};

const validateForm = () => {
  return (
    validatePhone() &&
    validateCode() &&
    validatePassword() &&
    validateConfirmPassword()
  );
};

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// 发送验证码
const sendCode = async () => {
  if (isSending.value || countdown.value > 0 || !isPhoneValid.value) return;
  
  if (!validatePhone()) return;
  
  isSending.value = true;
  
  try {
    await app.globalData.api.auth.sendSmsCode(registerForm.phone, 'register');
    
    // 开始倒计时
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    uni.showToast({
      title: '验证码已发送',
      icon: 'success'
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    uni.showToast({
      title: error.message || '发送验证码失败，请稍后重试',
      icon: 'none'
    });
  } finally {
    isSending.value = false;
  }
};

// 注册
const register = async () => {
  if (!validateForm()) return;
  
  isRegistering.value = true;
  errors.general = '';
  
  try {
    // 调用注册API
    const data = await app.globalData.api.auth.register(
      registerForm.phone,
      registerForm.code,
      registerForm.password,
      registerForm.confirmPassword
    );
    
    // 存储token和用户信息
    uni.setStorageSync('token', data.token);
    uni.setStorageSync('userInfo', JSON.stringify(data.user_info));
    
    // 注册成功提示
    uni.showToast({
      title: '注册成功',
      icon: 'success'
    });
    
    // 跳转到首页
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/home/home'
      });
    }, 1500);
  } catch (error) {
    console.error('注册失败:', error);
    errors.general = error.message || '注册失败，请检查输入信息';
    
    uni.showToast({
      title: errors.general,
      icon: 'none'
    });
  } finally {
    isRegistering.value = false;
  }
};

// 页面跳转方法
const goBack = () => {
  uni.navigateBack();
};

const goToLogin = () => {
  uni.navigateBack();
};
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

.register-box {
  width: 100%;
  max-width: 600rpx;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
  padding: 60rpx 40rpx;
  position: relative;
}

/* 返回按钮 */
.back-btn {
  position: absolute;
  left: 40rpx;
  top: 40rpx;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 32rpx;
}

/* 标题样式 */
.title-box {
  text-align: center;
  margin-bottom: 60rpx;
  margin-top: 20rpx;
}

.title {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}

.subtitle {
  font-size: 26rpx;
  color: #999;
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

.code-btn {
  background-color: #8e44ad;
  color: #fff;
  font-size: 24rpx;
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
  margin-left: 20rpx;
}

.code-btn.disabled {
  background-color: #ccc;
}

.form-error {
  color: #ff4d4f;
  font-size: 24rpx;
  margin-bottom: 20rpx;
  height: 30rpx;
}

.register-btn {
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
  margin-top: 60rpx;
  margin-bottom: 40rpx;
}

.register-btn.disabled {
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

/* 登录链接 */
.login-link {
  text-align: center;
  margin-top: 40rpx;
  font-size: 28rpx;
  color: #666;
}

.login-text {
  color: #8e44ad;
  margin-left: 10rpx;
}
</style> 