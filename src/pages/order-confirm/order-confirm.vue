<template>
  <view class="container">
    <!-- 收货地址 -->
    <view class="address-section">
      <view class="address-header">
        <view class="section-title">收货地址</view>
        <view class="address-manage" @tap="selectAddress">
          <text>选择地址</text>
          <view class="fa fa-chevron-right"></view>
        </view>
      </view>
      
      <view class="address-card" v-if="selectedAddress">
        <view class="address-info">
          <view class="address-name">{{ selectedAddress.name }} {{ selectedAddress.phone }}</view>
          <view class="address-detail">
            {{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }}{{ selectedAddress.detail }}
          </view>
        </view>
      </view>
      
      <view class="no-address" v-else @tap="addAddress">
        <view class="fa fa-plus"></view>
        <text>添加收货地址</text>
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="goods-section">
      <view class="section-title">商品清单</view>
      <view class="goods-list">
        <view class="goods-item" v-for="item in orderItems" :key="item.id">
          <image class="goods-image" :src="item.image" mode="aspectFill"></image>
          <view class="goods-info">
            <view class="goods-name">{{ item.name }}</view>
            <view class="goods-price">¥{{ item.price }}</view>
          </view>
          <view class="goods-quantity">x{{ item.quantity }}</view>
        </view>
      </view>
    </view>

    <!-- 配送信息 -->
    <view class="delivery-section">
      <view class="section-title">配送信息</view>
      <view class="delivery-item">
        <text class="delivery-label">配送方式</text>
        <text class="delivery-value">标准配送</text>
      </view>
      <view class="delivery-item">
        <text class="delivery-label">配送费</text>
        <text class="delivery-value">免配送费</text>
      </view>
    </view>

    <!-- 订单备注 -->
    <view class="remark-section">
      <view class="section-title">订单备注</view>
      <input 
        class="remark-input" 
        placeholder="请输入订单备注（选填）" 
        v-model="orderRemark"
        maxlength="100"
      />
    </view>

    <!-- 支付方式 -->
    <view class="payment-section">
      <view class="section-title">支付方式</view>
      <view class="payment-options">
        <view 
          class="payment-option" 
          :class="{ active: selectedPayment === 'wechat' }"
          @tap="selectPayment('wechat')"
        >
          <view class="payment-icon wechat">
            <view class="fa fa-comments"></view>
          </view>
          <text class="payment-name">微信支付</text>
          <view class="payment-radio" :class="{ checked: selectedPayment === 'wechat' }"></view>
        </view>
        
        <view 
          class="payment-option" 
          :class="{ active: selectedPayment === 'alipay' }"
          @tap="selectPayment('alipay')"
        >
          <view class="payment-icon alipay">
            <view class="fa fa-credit-card"></view>
          </view>
          <text class="payment-name">支付宝</text>
          <view class="payment-radio" :class="{ checked: selectedPayment === 'alipay' }"></view>
        </view>
      </view>
    </view>

    <!-- 底部结算栏 -->
    <view class="bottom-bar">
      <view class="price-info">
        <view class="total-price">
          <text class="price-label">合计：</text>
          <text class="price-value">¥{{ totalPrice.toFixed(2) }}</text>
        </view>
        <view class="price-detail">
          共{{ totalQuantity }}件商品
        </view>
      </view>
      
      <view 
        class="submit-btn" 
        :class="{ disabled: !canSubmit }"
        @tap="submitOrder"
      >
        <text v-if="!isSubmitting">提交订单并支付</text>
        <view v-else class="loading-spinner"></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useUserStore } from '../../stores/user.js';
import { useOrderStore } from '../../stores/order.js';

// 获取全局App实例
const app = getApp();

// 使用Pinia stores
const userStore = useUserStore();
const orderStore = useOrderStore();

// 页面状态
const selectedAddress = ref(null);
const orderItems = ref([]);
const orderRemark = ref('');
const selectedPayment = ref('wechat');
const isSubmitting = ref(false);

// 计算属性
const totalPrice = computed(() => {
  return orderItems.value.reduce((total, item) => total + item.price * item.quantity, 0);
});

const totalQuantity = computed(() => {
  return orderItems.value.reduce((total, item) => total + item.quantity, 0);
});

const canSubmit = computed(() => {
  return selectedAddress.value && orderItems.value.length > 0 && !isSubmitting.value;
});

// 页面加载时获取数据
onLoad(async (options) => {
  await loadOrderData();
  await loadDefaultAddress();
});

// 页面显示时刷新地址（从地址选择页面返回时）
onShow(() => {
  // 检查是否从地址选择页面返回
  const pages = getCurrentPages();
  if (pages.length > 1) {
    const prevPage = pages[pages.length - 2];
    if (prevPage.route === 'pages/address-list/address-list') {
      loadDefaultAddress();
    }
  }
});

// 加载订单数据
const loadOrderData = async () => {
  try {
    // 从购物车获取商品
    const cartItems = app.globalData.getCartItems();
    console.log('原始购物车数据:', cartItems);
    
    // 如果购物车为空，提示用户
    if (cartItems.length === 0) {
      uni.showModal({
        title: '购物车为空',
        content: '购物车中没有商品，请先添加商品到购物车',
        showCancel: false,
        confirmText: '去购物',
        success: () => {
          uni.switchTab({
            url: '/pages/home/home'
          });
        }
      });
      return;
    }
    
         // 如果没有选中的商品，自动选中所有商品
     let selectedItems = cartItems.filter(item => item.selected);
     if (selectedItems.length === 0) {
       // 自动选中所有商品
       cartItems.forEach(item => {
         if (!item.selected) {
           item.selected = true;
         }
       });
       selectedItems = cartItems;
       // 保存更新后的购物车状态
       app.globalData.triggerCartUpdate();
      
      uni.showToast({
        title: '已自动选中所有商品',
        icon: 'none'
      });
    }
    
    orderItems.value = selectedItems;
    console.log('最终订单商品:', orderItems.value);
    
  } catch (error) {
    console.error('加载订单数据失败:', error);
    uni.showModal({
      title: '加载失败',
      content: '无法加载购物车数据，请重试',
      confirmText: '重试',
      cancelText: '返回',
      success: (res) => {
        if (res.confirm) {
          loadOrderData();
        } else {
          uni.navigateBack();
        }
      }
    });
  }
};

// 加载默认地址
const loadDefaultAddress = async () => {
  try {
    const addresses = await app.globalData.api.user.getAddresses();
    const defaultAddress = addresses.find(addr => addr.is_default);
    if (defaultAddress) {
      selectedAddress.value = defaultAddress;
    }
  } catch (error) {
    console.error('加载地址失败:', error);
    // 使用默认地址
    selectedAddress.value = {
      id: 1,
      name: '张三',
      phone: '13800138001',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      detail: '科技园南区8栋101',
      is_default: true
    };
  }
};

// 选择地址
const selectAddress = () => {
  uni.navigateTo({
    url: '/pages/address-list/address-list?select=true'
  });
};

// 添加地址
const addAddress = () => {
  uni.navigateTo({
    url: '/pages/address-edit/address-edit'
  });
};

// 选择支付方式
const selectPayment = (payment) => {
  selectedPayment.value = payment;
};

// 提交订单
const submitOrder = async () => {
  if (!canSubmit.value) {
    return;
  }
  
  if (!selectedAddress.value) {
    uni.showToast({
      title: '请选择收货地址',
      icon: 'none'
    });
    return;
  }
  
  if (!userStore.userId) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    // 检查商品数据
    console.log('提交订单 - 原始商品数据:', orderItems.value);
    
    if (!orderItems.value || orderItems.value.length === 0) {
      uni.showToast({
        title: '购物车为空，请先添加商品',
        icon: 'none'
      });
      isSubmitting.value = false;
      return;
    }
    
    // 准备订单数据
    const orderData = {
      address_id: selectedAddress.value.id,
      remark: orderRemark.value,
      payment_type: selectedPayment.value,
      items: orderItems.value.map(item => ({
        id: item.id,
        cocktail_id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity
      }))
    };
    
    console.log('提交订单 - 准备发送的数据:', orderData);
    console.log('提交订单 - items详细数据:', JSON.stringify(orderData.items, null, 2));
    
    // 第一步：创建订单
    uni.showLoading({
      title: '创建订单中...'
    });
    
    const result = await orderStore.createOrder(userStore.userId, orderData);
    
    uni.hideLoading();
    
    if (!result || !result.id) {
      throw new Error('订单创建失败，未返回订单ID');
    }
    
    uni.showToast({
      title: '订单创建成功',
      icon: 'success'
    });
    
    // 等待1秒后进行支付
    setTimeout(async () => {
      await processPayment(result.id);
    }, 1000);
    
  } catch (error) {
    uni.hideLoading();
    console.error('创建订单失败:', error);
    uni.showToast({
      title: error.message || '订单创建失败',
      icon: 'none'
    });
    isSubmitting.value = false;
  }
};

// 处理支付流程
const processPayment = async (orderId) => {
  try {
    // 第二步：进行支付
    uni.showLoading({
      title: '支付中...'
    });
    
    // 模拟支付过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 调用支付API
    await orderStore.payOrder(userStore.userId, orderId);
    
    uni.hideLoading();
    
    // 支付成功后刷新用户订单数据
    try {
      // 清空旧数据，强制从服务器获取最新数据
      orderStore.setUserOrderList(userStore.userId, []);
      await orderStore.fetchUserOrders(userStore.userId, { force: true });
      console.log('支付成功后刷新订单数据完成，当前订单数量:', orderStore.currentUserOrders.length);
    } catch (error) {
      console.error('刷新订单数据失败:', error);
    }
    
    // 支付成功
    uni.showModal({
      title: '支付成功',
      content: '恭喜您，订单支付成功！',
      showCancel: false,
      confirmText: '查看订单',
      success: (res) => {
        if (res.confirm) {
          // 清空购物车中已结算的商品
          orderItems.value.forEach(item => {
            app.globalData.removeFromCart(item.id);
          });
          
          // 跳转到订单详情页面
          uni.redirectTo({
            url: `/pages/order-detail/order-detail?id=${orderId}`
          });
        }
      }
    });
    
  } catch (error) {
    uni.hideLoading();
    console.error('支付失败:', error);
    
    // 支付失败，询问用户是否重试或稍后支付
    uni.showModal({
      title: '支付失败',
      content: '支付过程中出现问题，您可以稍后在"我的订单"中继续支付',
      confirmText: '查看订单',
      cancelText: '重新支付',
      success: (res) => {
        if (res.confirm) {
          // 查看订单（即使支付失败，订单也已创建）
          orderItems.value.forEach(item => {
            app.globalData.removeFromCart(item.id);
          });
          
          uni.redirectTo({
            url: `/pages/order-detail/order-detail?id=${orderId}`
          });
        } else {
          // 重新支付
          processPayment(orderId);
        }
      }
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

/* 通用样式 */
.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

/* 收货地址 */
.address-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.address-manage {
  display: flex;
  align-items: center;
  color: #8e44ad;
  font-size: 28rpx;
}

.address-manage .fa {
  margin-left: 10rpx;
  font-size: 24rpx;
}

.address-card {
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 30rpx;
}

.address-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 10rpx;
}

.address-detail {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

.no-address {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  border: 2rpx dashed #ddd;
  border-radius: 12rpx;
  color: #999;
  font-size: 28rpx;
}

.no-address .fa {
  margin-right: 10rpx;
  font-size: 32rpx;
}

/* 商品列表 */
.goods-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.goods-list {
  border-radius: 12rpx;
  border: 1rpx solid #e0e0e0;
  overflow: hidden;
}

.goods-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.goods-item:last-child {
  border-bottom: none;
}

.goods-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
}

.goods-info {
  flex: 1;
}

.goods-name {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.goods-price {
  font-size: 28rpx;
  color: #8e44ad;
  font-weight: 600;
}

.goods-quantity {
  font-size: 28rpx;
  color: #666;
  margin-left: 20rpx;
}

/* 配送信息 */
.delivery-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.delivery-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.delivery-item:last-child {
  border-bottom: none;
}

.delivery-label {
  font-size: 28rpx;
  color: #666;
}

.delivery-value {
  font-size: 28rpx;
  color: #333;
}

/* 订单备注 */
.remark-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.remark-input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  margin-top: 20rpx;
}

/* 支付方式 */
.payment-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.payment-options {
  margin-top: 20rpx;
}

.payment-option {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.payment-option:last-child {
  border-bottom: none;
}

.payment-option.active {
  background-color: #f8f4ff;
}

.payment-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  font-size: 32rpx;
  color: #fff;
}

.payment-icon.wechat {
  background-color: #1aad19;
}

.payment-icon.alipay {
  background-color: #1677ff;
}

.payment-name {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.payment-radio {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 50%;
  position: relative;
}

.payment-radio.checked {
  border-color: #8e44ad;
}

.payment-radio.checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20rpx;
  height: 20rpx;
  background-color: #8e44ad;
  border-radius: 50%;
}

/* 底部结算栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 30rpx;
  box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price-info {
  flex: 1;
}

.total-price {
  margin-bottom: 5rpx;
}

.price-label {
  font-size: 28rpx;
  color: #666;
}

.price-value {
  font-size: 36rpx;
  font-weight: 600;
  color: #ff4757;
}

.price-detail {
  font-size: 24rpx;
  color: #999;
}

.submit-btn {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: #fff;
  padding: 20rpx 60rpx;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 200rpx;
}

.submit-btn.disabled {
  opacity: 0.6;
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
</style> 