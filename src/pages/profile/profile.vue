<template>
  <view class="container">
    <!-- 用户信息区域 -->
    <view class="user-section">
      <view class="user-header">
        <view class="user-avatar" @tap="editProfile">
          <image v-if="userInfo.avatar" :src="userInfo.avatar" mode="aspectFill"></image>
          <view v-else class="default-avatar">
            <view class="fa fa-user"></view>
          </view>
        </view>
        <view class="user-info">
          <text class="user-name">{{ userInfo.nickname || userInfo.username || '用户' }}</text>
          <text class="user-phone">{{ userInfo.phone || '未绑定手机号' }}</text>
          <text class="user-id">ID: {{ userInfo.id || 'N/A' }}</text>
        </view>
        <view class="edit-btn" @tap="editProfile">
          <view class="fa fa-edit"></view>
        </view>
      </view>
      
      <!-- 用户统计信息 -->
      <view class="user-stats">
        <view class="stat-item">
          <text class="stat-number">{{ userStats.totalOrders }}</text>
          <text class="stat-label">总订单</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ userStats.totalSpent }}</text>
          <text class="stat-label">总消费</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ userStats.favoriteCount }}</text>
          <text class="stat-label">收藏</text>
        </view>
      </view>
    </view>

    <!-- 订单管理 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">我的订单</text>
        <view class="more-btn" @tap="viewAllOrders">
          <text>查看全部</text>
          <view class="fa fa-chevron-right"></view>
        </view>
      </view>
      
      <view class="order-types">
        <view class="order-type" @tap="viewOrders('pending')">
          <view class="order-icon pending">
            <view class="fa fa-clock"></view>
          </view>
          <text class="order-text">待支付</text>
          <view class="order-badge" v-if="orderCounts.pending > 0">{{ orderCounts.pending }}</view>
        </view>
        
        <view class="order-type" @tap="viewOrders('paid')">
          <view class="order-icon paid">
            <view class="fa fa-check-circle"></view>
          </view>
          <text class="order-text">待发货</text>
          <view class="order-badge" v-if="orderCounts.paid > 0">{{ orderCounts.paid }}</view>
        </view>
        
        <view class="order-type" @tap="viewOrders('shipped')">
          <view class="order-icon shipped">
            <view class="fa fa-truck"></view>
          </view>
          <text class="order-text">待收货</text>
          <view class="order-badge" v-if="orderCounts.shipped > 0">{{ orderCounts.shipped }}</view>
        </view>
        
        <view class="order-type" @tap="viewOrders('delivered')">
          <view class="order-icon delivered">
            <view class="fa fa-star"></view>
          </view>
          <text class="order-text">待评价</text>
          <view class="order-badge" v-if="orderCounts.delivered > 0">{{ orderCounts.delivered }}</view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="section">
      <view class="menu-list">
        <view class="menu-item" @tap="viewAddresses">
          <view class="menu-icon">
            <view class="fa fa-map-marker-alt"></view>
          </view>
          <text class="menu-text">收货地址</text>
          <view class="menu-badge" v-if="addressCount > 0">{{ addressCount }}</view>
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
        
        <view class="menu-item" @tap="viewFavorites">
          <view class="menu-icon">
            <view class="fa fa-heart"></view>
          </view>
          <text class="menu-text">我的收藏</text>
          <view class="menu-arrow">
            <view class="fa fa-chevron-right"></view>
          </view>
        </view>
        
        <view class="menu-item" @tap="viewCustomerService">
          <view class="menu-icon">
            <view class="fa fa-headset"></view>
          </view>
          <text class="menu-text">客服帮助</text>
          <view class="menu-arrow">
            <view class="fa fa-chevron-right"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 设置菜单 -->
    <view class="section">
      <view class="menu-list">
        <view class="menu-item" @tap="viewSettings">
          <view class="menu-icon">
            <view class="fa fa-cog"></view>
          </view>
          <text class="menu-text">设置</text>
          <view class="menu-arrow">
            <view class="fa fa-chevron-right"></view>
          </view>
        </view>
        
        <view class="menu-item" @tap="viewAbout">
          <view class="menu-icon">
            <view class="fa fa-info-circle"></view>
          </view>
          <text class="menu-text">关于我们</text>
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

    <!-- 修改密码弹窗 -->
    <view class="password-modal" v-if="showPasswordModal" @tap="closePasswordModal">
      <view class="password-dialog" @tap.stop="">
        <view class="dialog-header">
          <text class="dialog-title">修改密码</text>
          <view class="close-btn" @tap="closePasswordModal">
            <view class="fa fa-times"></view>
          </view>
        </view>
        <view class="dialog-content">
          <view class="form-item">
            <text class="form-label">原密码</text>
            <input 
              type="password" 
              class="form-input" 
              v-model="passwordForm.oldPassword" 
              placeholder="请输入原密码"
            />
          </view>
          <view class="form-item">
            <text class="form-label">新密码</text>
            <input 
              type="password" 
              class="form-input" 
              v-model="passwordForm.newPassword" 
              placeholder="请输入新密码"
            />
          </view>
          <view class="form-item">
            <text class="form-label">确认密码</text>
            <input 
              type="password" 
              class="form-input" 
              v-model="passwordForm.confirmPassword" 
              placeholder="请再次输入新密码"
            />
          </view>
        </view>
        <view class="dialog-actions">
          <button class="cancel-btn" @tap="closePasswordModal">取消</button>
          <button class="confirm-btn" @tap="confirmPasswordChange" :disabled="isChangingPassword">
            {{ isChangingPassword ? '修改中...' : '确认' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '../../stores/user.js';
import { useOrderStore } from '../../stores/order.js';

// 获取全局App实例
const app = getApp();

// 使用Pinia stores
const userStore = useUserStore();
const orderStore = useOrderStore();

// 用户信息从store获取
const userInfo = computed(() => userStore.userInfo || {});

// 订单统计从store获取
const orderStats = computed(() => orderStore.orderStats);

// 用户统计信息（从服务器和本地计算结合）
const userStats = ref({
  totalOrders: 0,
  totalSpent: '0.00',
  favoriteCount: 0
});

// 计算统计信息
const calculateUserStats = () => {
  const orders = orderStore.currentUserOrders;
  
  // 计算总订单数（包括所有状态的订单，除了已取消的）
  const totalOrders = orders.filter(order => order.status !== 4).length;
  
  // 计算总消费（已支付、已发货、已完成的订单）
  let totalSpent = 0;
  orders.forEach(order => {
    if (order.status >= 1) { // 已支付状态及以上（不包括待支付）
      totalSpent += parseFloat(order.total_amount || 0);
    }
  });
  
  userStats.value = {
    totalOrders: totalOrders || 0,
    totalSpent: totalSpent > 0 ? totalSpent.toFixed(2) : '0.00',
    favoriteCount: userStats.value.favoriteCount || 0
  };
  
  console.log('用户统计信息计算:', {
    订单详情: orders.map(order => ({
      id: order.id,
      status: order.status,
      total_amount: order.total_amount,
      statusText: ['待支付', '已支付', '已发货', '已完成', '已取消'][order.status]
    })),
    总订单数: userStats.value.totalOrders,
    总消费: userStats.value.totalSpent
  });
};

// 订单数量统计
const orderCounts = computed(() => {
  const orders = orderStore.currentUserOrders;
  const counts = {
    pending: orders.filter(o => o.status === 0).length,    // 待支付
    paid: orders.filter(o => o.status === 1).length,       // 待发货  
    shipped: orders.filter(o => o.status === 2).length,    // 待收货
    delivered: orders.filter(o => o.status === 3).length   // 已完成
  };
  
  console.log('订单数量统计:', {
    订单总数: orders.length,
    待支付: counts.pending,
    待发货: counts.paid,
    待收货: counts.shipped,
    已完成: counts.delivered,
    订单详情: orders.map(o => ({ id: o.id, status: o.status }))
  });
  
  return counts;
});

// 地址数量
const addressCount = ref(0);

// 修改密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 修改密码状态
const isChangingPassword = ref(false);

// 显示密码弹窗
const showPasswordModal = ref(false);

// 页面加载时获取数据
onMounted(() => {
  loadData();
});

// 页面显示时刷新数据
onShow(() => {
  console.log('个人中心页面显示，开始刷新数据');
  // 强制刷新数据，确保获取最新的订单信息
  loadData(true); // 传入true表示强制刷新
});

// 加载数据
const loadData = async (forceRefresh = false) => {
  // 确保用户已登录
  if (!userStore.userId) {
    userStore.initUserFromStorage();
  }
  
  if (userStore.userId) {
    try {
      // 强制从服务器重新加载用户订单数据
      console.log('正在从服务器加载用户订单数据..., forceRefresh:', forceRefresh);
      
      // 清空旧的订单数据，确保获取最新数据
      if (forceRefresh) {
        orderStore.setUserOrderList(userStore.userId, []);
      }
      
      await orderStore.fetchUserOrders(userStore.userId, { force: forceRefresh });
      
      // 等待一下确保数据更新完成
      await nextTick();
      
      // 重新计算用户统计信息
      calculateUserStats();
      
      // 从服务器获取用户其他统计信息
      await loadUserStats();
      
      console.log('数据加载完成:', {
        用户ID: userStore.userId,
        当前用户订单数量: orderStore.currentUserOrders.length,
        统计信息: userStats.value,
        订单计数: orderCounts.value,
        订单详情: orderStore.currentUserOrders.map(order => ({
          id: order.id,
          status: order.status,
          total_amount: order.total_amount,
          created_at: order.created_at
        }))
      });
      
      // 加载地址数量
      await loadAddressCount();
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }
};

// 从服务器加载用户统计信息
const loadUserStats = async () => {
  try {
    // 获取用户收藏数量等其他统计信息
    if (app.globalData.api.user.getFavorites) {
      const favorites = await app.globalData.api.user.getFavorites();
      userStats.value.favoriteCount = favorites ? favorites.length : 0;
    }
  } catch (error) {
    console.error('获取用户统计信息失败:', error);
  }
};

// 加载地址数量
const loadAddressCount = async () => {
  try {
    const addresses = await app.globalData.api.user.getAddresses();
    addressCount.value = addresses ? addresses.length : 0;
  } catch (error) {
    console.error('获取地址数量失败:', error);
    // 使用默认值
    addressCount.value = 2;
  }
};

// 编辑个人资料
const editProfile = () => {
  uni.navigateTo({
    url: '/pages/profile-edit/profile-edit'
  });
};

// 查看订单
const viewOrders = (statusType) => {
  // 将字符串状态转换为数字状态
  const statusMap = {
    'pending': 0,    // 待支付
    'paid': 1,       // 待发货
    'shipped': 2,    // 待收货
    'delivered': 3   // 已完成
  };
  
  const status = statusMap[statusType];
  uni.navigateTo({
    url: `/pages/order-list/order-list?status=${status}`
  });
};

// 查看所有订单
const viewAllOrders = () => {
  uni.navigateTo({
    url: '/pages/order-list/order-list'
  });
};

// 查看地址
const viewAddresses = () => {
  uni.navigateTo({
    url: '/pages/address-list/address-list'
  });
};

// 修改密码
const changePassword = () => {
  // 重置表单
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
  
  // 显示弹窗
  showPasswordModal.value = true;
};

// 取消修改密码
const closePasswordModal = () => {
  showPasswordModal.value = false;
};

// 确认修改密码
const confirmPasswordChange = async () => {
  // 表单验证
  if (!passwordForm.oldPassword) {
    uni.showToast({
      title: '请输入原密码',
      icon: 'none'
    });
    return;
  }
  
  if (!passwordForm.newPassword) {
    uni.showToast({
      title: '请输入新密码',
      icon: 'none'
    });
    return;
  }
  
  if (passwordForm.newPassword.length < 6) {
    uni.showToast({
      title: '新密码不能少于6位',
      icon: 'none'
    });
    return;
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    uni.showToast({
      title: '两次输入的密码不一致',
      icon: 'none'
    });
    return;
  }
  
  isChangingPassword.value = true;
  
  try {
    await app.globalData.api.user.updatePassword(
      passwordForm.oldPassword,
      passwordForm.newPassword,
      passwordForm.confirmPassword
    );
    
    uni.showToast({
      title: '密码修改成功',
      icon: 'success'
    });
    
    // 关闭弹窗
    showPasswordModal.value = false;
    
    // 重置表单
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    
  } catch (error) {
    console.error('修改密码失败:', error);
    uni.showToast({
      title: error.message || '修改密码失败',
      icon: 'none'
    });
  } finally {
    isChangingPassword.value = false;
  }
};

// 查看收藏
const viewFavorites = () => {
  uni.showToast({
    title: '收藏功能开发中...',
    icon: 'none'
  });
};

// 客服帮助
const viewCustomerService = () => {
  uni.showModal({
    title: '客服帮助',
    content: '如需帮助，请联系客服电话：400-123-4567',
    showCancel: false
  });
};

// 设置
const viewSettings = () => {
  uni.navigateTo({
    url: '/pages/settings/settings'
  });
};

// 关于我们
const viewAbout = () => {
  uni.showModal({
    title: '关于我们',
    content: 'WhyQiuQiu鸡尾酒点单应用\n版本：1.0.0\n提供优质的鸡尾酒点单服务',
    showCancel: false
  });
};

// 退出登录
const logout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 调用退出登录API
          await app.globalData.api.auth.logout();
        } catch (error) {
          console.error('退出登录API调用失败:', error);
        }
        
        // 使用Pinia清空用户状态
        userStore.logout();
        
        // 清空购物车
        app.globalData.clearCart();
        
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        });
        
        // 跳转到登录页
        setTimeout(() => {
          uni.reLaunch({
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
}

/* 用户信息区域 */
.user-section {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  padding: 60rpx 30rpx 40rpx;
  color: #fff;
}

.user-header {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 30rpx;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar image {
  width: 100%;
  height: 100%;
}

.default-avatar {
  font-size: 48rpx;
  color: rgba(255, 255, 255, 0.8);
}

.user-info {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.user-phone {
  font-size: 26rpx;
  opacity: 0.8;
}

.user-id {
  font-size: 26rpx;
  opacity: 0.8;
}

.edit-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

/* 用户统计信息 */
.user-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 20rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.stat-label {
  font-size: 26rpx;
  opacity: 0.8;
}

/* 区块样式 */
.section {
  background-color: #fff;
  margin-top: 20rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.more-btn {
  display: flex;
  align-items: center;
  color: #8e44ad;
  font-size: 26rpx;
}

.more-btn .fa {
  margin-left: 10rpx;
  font-size: 22rpx;
}

/* 订单类型 */
.order-types {
  display: flex;
  justify-content: space-between;
}

.order-type {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 20rpx;
  border-radius: 12rpx;
  transition: background-color 0.3s;
}

.order-type:active {
  background-color: #f8f9fa;
}

.order-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #fff;
  margin-bottom: 15rpx;
}

.order-icon.pending {
  background-color: #f39c12;
}

.order-icon.paid {
  background-color: #3498db;
}

.order-icon.shipped {
  background-color: #2ecc71;
}

.order-icon.delivered {
  background-color: #e74c3c;
}

.order-text {
  font-size: 24rpx;
  color: #666;
}

.order-badge {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  background-color: #ff4757;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 20rpx;
  min-width: 20rpx;
  text-align: center;
  line-height: 1;
}

/* 菜单列表 */
.menu-list {
  border-radius: 12rpx;
  overflow: hidden;
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

.menu-badge {
  background-color: #ff4757;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 20rpx;
  margin-right: 10rpx;
}

.menu-arrow {
  color: #999;
  font-size: 24rpx;
}

/* 退出登录 */
.logout-section {
  margin-top: 40rpx;
  padding: 0 30rpx 60rpx;
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

/* 修改密码弹窗样式 */
.password-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.password-dialog {
  background-color: #fff;
  border-radius: 20rpx;
  width: 600rpx;
  max-width: 90%;
  margin: 0 30rpx;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 30rpx 20rpx;
  border-bottom: 1rpx solid #eee;
}

.dialog-title {
  font-size: 32rpx;
  font-weight: 600;
}

.close-btn {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #666;
}

.dialog-content {
  padding: 30rpx;
}

.dialog-content .form-item {
  margin-bottom: 30rpx;
}

.dialog-content .form-item:last-child {
  margin-bottom: 0;
}

.dialog-content .form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
  font-weight: 500;
}

.dialog-content .form-input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  background-color: #f8f9fa;
}

.dialog-content .form-input:focus {
  border-color: #8e44ad;
  background-color: #fff;
}

.dialog-actions {
  display: flex;
  border-top: 1rpx solid #eee;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  height: 90rpx;
  border: none;
  background-color: transparent;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-btn {
  color: #666;
  border-right: 1rpx solid #eee;
}

.confirm-btn {
  color: #8e44ad;
  font-weight: 500;
}

.confirm-btn:disabled {
  opacity: 0.6;
  color: #ccc;
}
</style> 