<template>
  <view class="container">
    <form @submit="submitForm">
      <!-- 头像 -->
      <view class="avatar-section">
        <view class="avatar-wrapper" @tap="chooseAvatar">
          <image v-if="formData.avatar" :src="formData.avatar" mode="aspectFill" class="avatar"></image>
          <view v-else class="default-avatar">
            <view class="fa fa-user"></view>
          </view>
          <view class="edit-badge">
            <view class="fa fa-camera"></view>
          </view>
        </view>
        <text class="avatar-hint">点击更换头像</text>
      </view>
      
      <!-- 表单 -->
      <view class="form-section">
        <view class="form-item">
          <text class="form-label">昵称</text>
          <input 
            class="form-input" 
            type="text" 
            v-model="formData.nickname" 
            placeholder="请输入昵称"
            maxlength="20"
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">用户名</text>
          <input 
            class="form-input" 
            type="text" 
            v-model="formData.username" 
            placeholder="用户名不可修改"
            disabled
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">手机号</text>
          <input 
            class="form-input" 
            type="number" 
            v-model="formData.phone" 
            placeholder="请输入手机号"
            maxlength="11"
            disabled
          />
          <text class="form-hint">手机号暂不支持修改</text>
        </view>
        
        <view class="form-item">
          <text class="form-label">性别</text>
          <view class="gender-options">
            <view 
              class="gender-option" 
              :class="{ active: formData.gender === 1 }"
              @tap="formData.gender = 1"
            >
              <view class="fa fa-mars"></view>
              <text>男</text>
            </view>
            <view 
              class="gender-option" 
              :class="{ active: formData.gender === 2 }"
              @tap="formData.gender = 2"
            >
              <view class="fa fa-venus"></view>
              <text>女</text>
            </view>
            <view 
              class="gender-option" 
              :class="{ active: formData.gender === 0 }"
              @tap="formData.gender = 0"
            >
              <view class="fa fa-user-secret"></view>
              <text>保密</text>
            </view>
          </view>
        </view>
        
        <view class="form-item">
          <text class="form-label">生日</text>
          <picker 
            mode="date" 
            :value="formData.birthday" 
            start="1900-01-01" 
            :end="currentDate" 
            @change="onBirthdayChange"
          >
            <view class="picker-value">
              <text>{{ formData.birthday || '请选择生日' }}</text>
              <view class="fa fa-chevron-right"></view>
            </view>
          </picker>
        </view>
      </view>
      
      <!-- 提交按钮 -->
      <view class="btn-section">
        <button class="submit-btn" form-type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '保存中...' : '保存修改' }}
        </button>
      </view>
    </form>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';

// 获取全局App实例
const app = getApp();

// 表单数据
const formData = reactive({
  avatar: '',
  nickname: '',
  username: '',
  phone: '',
  gender: 0,  // 0: 保密, 1: 男, 2: 女
  birthday: ''
});

// 当前日期（用于生日选择器的结束日期）
const currentDate = computed(() => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
});

// 提交状态
const isSubmitting = ref(false);

// 页面加载时获取用户信息
onMounted(() => {
  loadUserInfo();
});

// 页面显示时刷新数据
onShow(() => {
  loadUserInfo();
});

// 加载用户信息
const loadUserInfo = async () => {
  try {
    // 先从本地存储获取
    const localUserInfo = uni.getStorageSync('userInfo');
    if (localUserInfo) {
      const userInfo = typeof localUserInfo === 'string' ? JSON.parse(localUserInfo) : localUserInfo;
      Object.assign(formData, {
        avatar: userInfo.avatar || '',
        nickname: userInfo.nickname || '',
        username: userInfo.username || '',
        phone: userInfo.phone || '',
        gender: userInfo.gender !== undefined ? userInfo.gender : 0,
        birthday: userInfo.birthday || ''
      });
    }
    
    // 再从API获取最新信息
    const data = await app.globalData.api.user.getInfo();
    if (data) {
      Object.assign(formData, {
        avatar: data.avatar || formData.avatar,
        nickname: data.nickname || formData.nickname,
        username: data.username || formData.username,
        phone: data.phone || formData.phone,
        gender: data.gender !== undefined ? data.gender : formData.gender,
        birthday: data.birthday || formData.birthday
      });
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    // 使用本地存储的数据作为后备
    const localUserInfo = uni.getStorageSync('userInfo');
    if (localUserInfo) {
      const userInfo = typeof localUserInfo === 'string' ? JSON.parse(localUserInfo) : localUserInfo;
      Object.assign(formData, {
        avatar: userInfo.avatar || '',
        nickname: userInfo.nickname || '',
        username: userInfo.username || '',
        phone: userInfo.phone || '',
        gender: userInfo.gender !== undefined ? userInfo.gender : 0,
        birthday: userInfo.birthday || ''
      });
    } else {
      // 提供默认用户信息
      Object.assign(formData, {
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        nickname: '管理员',
        username: 'user1',
        phone: '15925661344',
        gender: 1,
        birthday: '1990-01-01'
      });
    }
  }
};

// 选择头像
const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0];
      // 这里应该上传到服务器，暂时直接使用本地路径
      formData.avatar = tempFilePath;
      
      uni.showToast({
        title: '头像已选择',
        icon: 'success'
      });
    },
    fail: (err) => {
      console.error('选择头像失败:', err);
      uni.showToast({
        title: '选择头像失败',
        icon: 'none'
      });
    }
  });
};

// 生日改变事件
const onBirthdayChange = (e) => {
  formData.birthday = e.detail.value;
};

// 表单验证
const validateForm = () => {
  if (!formData.nickname || formData.nickname.trim() === '') {
    uni.showToast({
      title: '请输入昵称',
      icon: 'none'
    });
    return false;
  }
  
  if (formData.nickname.length > 20) {
    uni.showToast({
      title: '昵称不能超过20个字符',
      icon: 'none'
    });
    return false;
  }
  
  if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    });
    return false;
  }
  
  return true;
};

// 提交表单
const submitForm = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    // 准备提交数据
    const updateData = {
      nickname: formData.nickname.trim(),
      gender: formData.gender,
      birthday: formData.birthday
    };
    
    // 如果头像有变化，添加头像字段
    if (formData.avatar && !formData.avatar.startsWith('https://randomuser.me')) {
      updateData.avatar = formData.avatar;
    }
    
    // 调用更新用户信息API
    const updatedUserInfo = await app.globalData.api.user.updateInfo(updateData);
    
    // 更新本地存储
    const currentUserInfo = uni.getStorageSync('userInfo');
    const userInfo = typeof currentUserInfo === 'string' ? JSON.parse(currentUserInfo) : currentUserInfo;
    const newUserInfo = { ...userInfo, ...updatedUserInfo };
    uni.setStorageSync('userInfo', JSON.stringify(newUserInfo));
    
    uni.showToast({
      title: '保存成功',
      icon: 'success'
    });
    
    // 延迟返回上一页
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
    
  } catch (error) {
    console.error('更新用户信息失败:', error);
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none'
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style>
.container {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

/* 头像区域 */
.avatar-section {
  background-color: #fff;
  padding: 60rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20rpx;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 20rpx;
}

.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  border: 4rpx solid #8e44ad;
}

.default-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
  color: #999;
  border: 4rpx solid #8e44ad;
}

.edit-badge {
  position: absolute;
  bottom: 10rpx;
  right: 10rpx;
  width: 50rpx;
  height: 50rpx;
  background-color: #8e44ad;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24rpx;
  border: 3rpx solid #fff;
}

.avatar-hint {
  font-size: 26rpx;
  color: #666;
}

/* 表单区域 */
.form-section {
  background-color: #fff;
  padding: 0 30rpx;
}

.form-item {
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
  font-weight: 500;
}

.form-input {
  width: 100%;
  height: 80rpx;
  font-size: 28rpx;
  color: #333;
  background-color: #f8f9fa;
  border-radius: 10rpx;
  padding: 0 20rpx;
  border: 1rpx solid #e0e0e0;
}

.form-input:disabled {
  color: #999;
  background-color: #f5f5f5;
}

.form-hint {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
  display: block;
}

/* 性别选择 */
.gender-options {
  display: flex;
  gap: 20rpx;
}

.gender-option {
  flex: 1;
  height: 80rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  transition: all 0.3s;
}

.gender-option.active {
  border-color: #8e44ad;
  background-color: rgba(142, 68, 173, 0.1);
  color: #8e44ad;
}

.gender-option .fa {
  margin-right: 10rpx;
  font-size: 24rpx;
}

.gender-option text {
  font-size: 28rpx;
}

/* 选择器 */
.picker-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80rpx;
  padding: 0 20rpx;
  background-color: #f8f9fa;
  border-radius: 10rpx;
  border: 1rpx solid #e0e0e0;
  font-size: 28rpx;
  color: #333;
}

.picker-value .fa {
  color: #999;
  font-size: 24rpx;
}

/* 按钮区域 */
.btn-section {
  padding: 40rpx 30rpx;
}

.submit-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: #fff;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:disabled {
  opacity: 0.6;
}

.submit-btn:active {
  opacity: 0.8;
}
</style> 