<template>
  <view class="container">
    <!-- 账户设置 -->
    <view class="section">
      <view class="section-title">账户设置</view>
      <view class="menu-list">
        <view class="menu-item" @tap="editProfile">
          <view class="menu-icon">
            <view class="fa fa-user-edit"></view>
          </view>
          <text class="menu-text">编辑资料</text>
          <view class="menu-arrow">
            <view class="fa fa-chevron-right"></view>
          </view>
        </view>
        
        <view class="menu-item" @tap="changePassword">
          <view class="menu-icon">
            <view class="fa fa-key"></view>
          </view>
          <text class="menu-text">修改密码</text>
          <view class="menu-arrow">
            <view class="fa fa-chevron-right"></view>
          </view>
        </view>
        
        <view class="menu-item" @tap="bindPhone">
          <view class="menu-icon">
            <view class="fa fa-mobile-alt"></view>
          </view>
          <text class="menu-text">绑定手机</text>
          <text class="menu-value">{{ userInfo.phone || '未绑定' }}</text>
          <view class="menu-arrow">
            <view class="fa fa-chevron-right"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 通知设置 -->
    <view class="section">
      <view class="section-title">通知设置</view>
      <view class="menu-list">
        <view class="menu-item">
          <view class="menu-icon">
            <view class="fa fa-bell"></view>
          </view>
          <text class="menu-text">订单通知</text>
          <switch 
            :checked="notificationSettings.order" 
            @change="toggleNotification('order', $event)"
            color="#8e44ad"
          />
        </view>
        
        <view class="menu-item">
          <view class="menu-icon">
            <view class="fa fa-bullhorn"></view>
          </view>
          <text class="menu-text">优惠活动</text>
          <switch 
            :checked="notificationSettings.promotion" 
            @change="toggleNotification('promotion', $event)"
            color="#8e44ad"
          />
        </view>
        
        <view class="menu-item">
          <view class="menu-icon">
            <view class="fa fa-comment"></view>
          </view>
          <text class="menu-text">系统消息</text>
          <switch 
            :checked="notificationSettings.system" 
            @change="toggleNotification('system', $event)"
            color="#8e44ad"
          />
        </view>
      </view>
    </view>

    <!-- 隐私设置 -->
    <view class="section">
      <view class="section-title">隐私设置</view>
      <view class="menu-list">
        <view class="menu-item" @tap="clearCache">
          <view class="menu-icon">
            <view class="fa fa-broom"></view>
          </view>
          <text class="menu-text">清除缓存</text>
          <text class="menu-value">{{ cacheSize }}</text>
          <view class="menu-arrow">
            <view class="fa fa-chevron-right"></view>
          </view>
        </view>
        
        <view class="menu-item" @tap="viewPrivacyPolicy">
          <view class="menu-icon">
            <view class="fa fa-shield-alt"></view>
          </view>
          <text class="menu-text">隐私政策</text>
          <view class="menu-arrow">
            <view class="fa fa-chevron-right"></view>
          </view>
        </view>
        
        <view class="menu-item" @tap="viewUserAgreement">
          <view class="menu-icon">
            <view class="fa fa-file-contract"></view>
          </view>
          <text class="menu-text">用户协议</text>
          <view class="menu-arrow">
            <view class="fa fa-chevron-right"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 应用设置 -->
    <view class="section">
      <view class="section-title">应用设置</view>
      <view class="menu-list">
        <view class="menu-item" @tap="checkUpdate">
          <view class="menu-icon">
            <view class="fa fa-sync-alt"></view>
          </view>
          <text class="menu-text">检查更新</text>
          <text class="menu-value">{{ appVersion }}</text>
          <view class="menu-arrow">
            <view class="fa fa-chevron-right"></view>
          </view>
        </view>
        
        <view class="menu-item" @tap="feedback">
          <view class="menu-icon">
            <view class="fa fa-comment-dots"></view>
          </view>
          <text class="menu-text">意见反馈</text>
          <view class="menu-arrow">
            <view class="fa fa-chevron-right"></view>
          </view>
        </view>
        
        <view class="menu-item" @tap="aboutApp">
          <view class="menu-icon">
            <view class="fa fa-info-circle"></view>
          </view>
          <text class="menu-text">关于应用</text>
          <view class="menu-arrow">
            <view class="fa fa-chevron-right"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <view class="logout-btn" @tap="logout">
        <text>退出登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

// 使用uni-app的生命周期函数
const onShow = uni.$on ? (callback) => {
  const page = getCurrentPages()[getCurrentPages().length - 1];
  if (page && page.$vm) {
    page.$vm.$on('onShow', callback);
  }
} : () => {};

// 获取全局App实例
const app = getApp();

// 用户信息
const userInfo = ref({});

// 通知设置
const notificationSettings = reactive({
  order: true,
  promotion: true,
  system: true
});

// 应用版本
const appVersion = ref('1.0.0');

// 缓存大小
const cacheSize = ref('12.5MB');

// 页面加载时获取数据
onMounted(() => {
  loadUserInfo();
  loadNotificationSettings();
  calculateCacheSize();
});

// 页面显示时刷新数据
onShow(() => {
  loadUserInfo();
});

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const localUserInfo = uni.getStorageSync('userInfo');
    if (localUserInfo) {
      userInfo.value = localUserInfo;
    }
    
    const data = await app.globalData.api.user.getInfo();
    if (data) {
      userInfo.value = data;
      uni.setStorageSync('userInfo', data);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

// 加载通知设置
const loadNotificationSettings = () => {
  const settings = uni.getStorageSync('notificationSettings');
  if (settings) {
    Object.assign(notificationSettings, settings);
  }
};

// 计算缓存大小
const calculateCacheSize = () => {
  // 模拟计算缓存大小
  const size = Math.random() * 20 + 5;
  cacheSize.value = size.toFixed(1) + 'MB';
};

// 编辑个人资料
const editProfile = () => {
  uni.navigateTo({
    url: '/pages/profile-edit/profile-edit'
  });
};

// 修改密码
const changePassword = () => {
  uni.navigateTo({
    url: '/pages/change-password/change-password'
  });
};

// 绑定手机
const bindPhone = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  });
};

// 切换通知设置
const toggleNotification = (type, event) => {
  notificationSettings[type] = event.detail.value;
  
  // 保存到本地存储
  uni.setStorageSync('notificationSettings', notificationSettings);
  
  uni.showToast({
    title: notificationSettings[type] ? '已开启' : '已关闭',
    icon: 'none'
  });
};

// 清除缓存
const clearCache = () => {
  uni.showModal({
    title: '清除缓存',
    content: '确定要清除应用缓存吗？',
    success: (res) => {
      if (res.confirm) {
        // 清除非必要的本地存储
        const keysToKeep = ['token', 'userInfo', 'notificationSettings'];
        const storage = uni.getStorageInfoSync();
        
        storage.keys.forEach(key => {
          if (!keysToKeep.includes(key)) {
            uni.removeStorageSync(key);
          }
        });
        
        // 重新计算缓存大小
        calculateCacheSize();
        
        uni.showToast({
          title: '清除成功',
          icon: 'success'
        });
      }
    }
  });
};

// 查看隐私政策
const viewPrivacyPolicy = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  });
};

// 查看用户协议
const viewUserAgreement = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  });
};

// 检查更新
const checkUpdate = () => {
  uni.showLoading({
    title: '检查中...'
  });
  
  setTimeout(() => {
    uni.hideLoading();
    uni.showToast({
      title: '已是最新版本',
      icon: 'none'
    });
  }, 2000);
};

// 意见反馈
const feedback = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  });
};

// 关于应用
const aboutApp = () => {
  uni.showModal({
    title: '关于应用',
    content: `鸡尾酒点单 v${appVersion.value}\n\n一款专业的鸡尾酒点单应用\n让您轻松享受美味鸡尾酒`,
    showCancel: false,
    confirmText: '确定'
  });
};

// 退出登录
const logout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await app.globalData.api.auth.logout();
        } catch (error) {
          console.error('退出登录API失败:', error);
        }
        
        // 清除登录信息
        uni.removeStorageSync('token');
        uni.removeStorageSync('userInfo');
        
        // 清空购物车
        app.globalData.clearCart();
        
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        });
        
        // 跳转到登录页
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/index/index'
          });
        }, 1500);
      }
    }
  });
};
</script>

<style>
.container {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding: 20rpx;
}

/* 区块样式 */
.section {
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.section-title {
  padding: 30rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  background-color: #f8f9fa;
  border-bottom: 1rpx solid #e0e0e0;
}

/* 菜单列表 */
.menu-list {
  padding: 0 30rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.3s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: #f8f9fa;
}

.menu-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: #8e44ad;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  font-size: 24rpx;
  color: #fff;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.menu-value {
  font-size: 26rpx;
  color: #999;
  margin-right: 10rpx;
}

.menu-arrow {
  color: #999;
  font-size: 24rpx;
}

/* 开关样式调整 */
switch {
  transform: scale(0.8);
}

/* 退出登录 */
.logout-section {
  margin-top: 40rpx;
  padding-bottom: 60rpx;
}

.logout-btn {
  background-color: #fff;
  color: #e74c3c;
  height: 100rpx;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  border: 2rpx solid #e74c3c;
  transition: all 0.3s;
}

.logout-btn:active {
  background-color: #e74c3c;
  color: #fff;
}
</style> 