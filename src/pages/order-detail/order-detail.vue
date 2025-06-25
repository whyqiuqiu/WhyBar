<template>
  <view class="container">
    <!-- 订单状态 -->
    <view class="status-section">
      <view class="status-icon" :class="getStatusClass(order.status)">
        <text class="status-icon-text">{{ getStatusIcon(order.status) }}</text>
      </view>
      <view class="status-info">
        <text class="status-text">{{ getStatusText(order.status) }}</text>
        <text class="status-desc">{{ getStatusDesc(order.status) }}</text>
      </view>
    </view>

    <!-- 收货地址 -->
    <view class="address-section">
      <view class="section-title">
        <text class="section-icon">📍</text>
        <text>收货地址</text>
      </view>
      <view class="address-content">
        <view class="contact-info">{{ order.address?.name }} {{ order.address?.phone }}</view>
        <view class="address-detail">
          {{ order.address?.province }}{{ order.address?.city }}{{ order.address?.district }}{{ order.address?.detail }}
        </view>
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="goods-section">
      <view class="section-title">
        <text class="section-icon">📋</text>
        <text>商品清单</text>
      </view>
      <view class="goods-list">
        <view class="goods-item" v-for="item in order.items" :key="item.id">
          <image class="goods-image" :src="item.image" mode="aspectFill"></image>
          <view class="goods-info">
            <view class="goods-name">{{ item.name }}</view>
            <view class="goods-price">¥{{ item.price }}</view>
          </view>
          <view class="goods-quantity">x{{ item.quantity }}</view>
        </view>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="order-info-section">
      <view class="section-title">
        <text class="section-icon">ℹ️</text>
        <text>订单信息</text>
      </view>
      <view class="info-list">
        <view class="info-item">
          <text class="info-label">订单编号</text>
          <text class="info-value">{{ order.order_no || order.id || '获取中...' }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">下单时间</text>
          <text class="info-value">{{ formatDate(order.created_at) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">支付方式</text>
          <text class="info-value">{{ getPaymentText(order.payment_method) }}</text>
        </view>
        <view class="info-item" v-if="order.remark">
          <text class="info-label">订单备注</text>
          <text class="info-value">{{ order.remark }}</text>
        </view>
      </view>
    </view>

    <!-- 价格详情 -->
    <view class="price-section">
      <view class="section-title">
        <text class="section-icon">🧮</text>
        <text>价格详情</text>
      </view>
      <view class="price-list">
        <view class="price-item">
          <text class="price-label">商品总价</text>
          <text class="price-value">¥{{ order.goods_amount?.toFixed(2) }}</text>
        </view>
        <view class="price-item">
          <text class="price-label">配送费</text>
          <text class="price-value">¥{{ order.delivery_fee?.toFixed(2) }}</text>
        </view>
        <view class="price-item total">
          <text class="price-label">实付金额</text>
          <text class="price-value">¥{{ order.total_amount?.toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section" v-if="showActions">
      <view 
        class="action-btn primary" 
        v-if="order.status === 2"
        @tap="confirmReceived"
      >
        确认收货
      </view>
    </view>
    
    <!-- 订单状态说明 -->
    <view class="status-tips" v-if="order.status === 0">
      <view class="tips-content">
        <text class="tips-icon">ℹ️</text>
        <text>此订单等待支付，支付操作请在下单时完成</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useUserStore } from '../../stores/user.js';
import { useOrderStore } from '../../stores/order.js';

// 获取全局App实例
const app = getApp();

// 使用Pinia stores
const userStore = useUserStore();
const orderStore = useOrderStore();

// 页面状态
const order = ref({});
const orderId = ref(null);
const isLoading = ref(false);

// 计算属性
const showActions = computed(() => {
  // 只在待收货状态显示确认收货按钮
  // 待支付状态的订单应该在订单确认页面完成支付
  return order.value.status === 2; // 2-待收货
});

// 页面加载时获取参数
onLoad((options) => {
  if (options && options.id) {
    orderId.value = options.id;
    loadOrderDetail();
  }
});

// 页面显示时刷新数据
onShow(() => {
  if (orderId.value) {
    loadOrderDetail();
  }
});

// 加载订单详情
const loadOrderDetail = async () => {
  if (!orderId.value || !userStore.userId) return;
  
  isLoading.value = true;
  try {
    const orderDetail = await orderStore.getOrderDetail(userStore.userId, orderId.value);
    if (orderDetail) {
      order.value = orderDetail;
    }
  } catch (error) {
    console.error('加载订单详情失败:', error);
    // 使用Mock数据作为后备
    order.value = {
      id: orderId.value,
      order_no: `ORD${orderId.value}`,
      status: 0,
      total_amount: 73,
      goods_amount: 73,
      delivery_fee: 0,
      payment_method: 'wechat',
      remark: '请尽快配送',
      created_at: '2024-01-15 14:30:00',
      address: {
        name: '张三',
        phone: '13800138001',
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        detail: '科技园南区8栋101'
      },
      items: [
        {
          id: 1,
          name: '莫吉托',
          price: 35,
          image: '/static/images/mojito.png',
          quantity: 2
        },
        {
          id: 2,
          name: '威士忌酸酒',
          price: 42,
          image: '/static/images/whiskey-sour.png',
          quantity: 1
        }
      ]
    };
    
    uni.showToast({
      title: '使用演示数据',
      icon: 'none'
    });
  } finally {
    isLoading.value = false;
  }
};

// 获取状态图标
const getStatusIcon = (status) => {
  const icons = {
    0: '⏰',
    1: '✅',
    2: '🚚',
    3: '📦',
    4: '❌'
  };
  return icons[status] || '❓';
};

// 获取状态样式类
const getStatusClass = (status) => {
  const classes = {
    0: 'pending',
    1: 'paid',
    2: 'shipped',
    3: 'delivered',
    4: 'cancelled'
  };
  return classes[status] || 'pending';
};

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    0: '待支付',
    1: '待发货',
    2: '待收货',
    3: '已完成',
    4: '已取消'
  };
  return texts[status] || '未知状态';
};

// 获取状态描述
const getStatusDesc = (status) => {
  const descs = {
    0: '请尽快完成支付',
    1: '商家正在准备您的订单',
    2: '商品正在配送中',
    3: '订单已完成',
    4: '订单已取消'
  };
  return descs[status] || '';
};

// 获取支付方式文本
const getPaymentText = (paymentMethod) => {
  const texts = {
    wechat: '微信支付',
    alipay: '支付宝',
    cash: '货到付款'
  };
  return texts[paymentMethod] || '未知';
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 确认收货
const confirmReceived = () => {
  uni.showModal({
    title: '确认收货',
    content: '确认已收到商品吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await orderStore.confirmOrder(userStore.userId, orderId.value);
          uni.showToast({
            title: '确认收货成功',
            icon: 'success'
          });
          // 刷新订单详情
          setTimeout(() => {
            loadOrderDetail();
          }, 1500);
        } catch (error) {
          console.error('确认收货失败:', error);
          uni.showToast({
            title: '操作失败',
            icon: 'none'
          });
        }
      }
    }
  });
};
</script>

<style>
.container {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

/* 订单状态 */
.status-section {
  background-color: #fff;
  padding: 40rpx 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
}

.status-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 30rpx;
  color: #fff;
}

.status-icon-text {
  font-size: 48rpx;
}

.status-icon.pending {
  background-color: #f39c12;
}

.status-icon.paid {
  background-color: #27ae60;
}

.status-icon.shipped {
  background-color: #3498db;
}

.status-icon.delivered {
  background-color: #2ecc71;
}

.status-icon.cancelled {
  background-color: #e74c3c;
}

.status-info {
  flex: 1;
}

.status-text {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 10rpx;
}

.status-desc {
  font-size: 28rpx;
  color: #666;
}

/* 通用区块样式 */
.address-section,
.goods-section,
.order-info-section,
.price-section {
  background-color: #fff;
  margin-bottom: 20rpx;
  padding: 30rpx;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.section-icon {
  margin-right: 15rpx;
  font-size: 32rpx;
}

.section-title text:last-child {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

/* 收货地址 */
.contact-info {
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

/* 商品列表 */
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

/* 订单信息 */
.info-list {
  border-radius: 12rpx;
  border: 1rpx solid #e0e0e0;
  overflow: hidden;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 30rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  max-width: 400rpx;
  text-align: right;
  word-break: break-all;
}

/* 价格详情 */
.price-list {
  border-radius: 12rpx;
  border: 1rpx solid #e0e0e0;
  overflow: hidden;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 30rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.price-item:last-child {
  border-bottom: none;
}

.price-item.total {
  background-color: #f8f4ff;
  font-weight: 600;
}

.price-label {
  font-size: 28rpx;
  color: #666;
}

.price-item.total .price-label {
  color: #333;
}

.price-value {
  font-size: 28rpx;
  color: #333;
}

.price-item.total .price-value {
  color: #8e44ad;
  font-size: 32rpx;
}

/* 操作按钮 */
.action-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 30rpx;
  box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
}

.action-btn.primary {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: #fff;
}

.action-btn.secondary {
  background-color: #f8f9fa;
  color: #666;
  border: 2rpx solid #e0e0e0;
}

/* 订单状态说明 */
.status-tips {
  background-color: #fff;
  margin-bottom: 20rpx;
  padding: 30rpx;
}

.tips-content {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #fff3cd;
  border: 1rpx solid #ffeaa7;
  border-radius: 12rpx;
}

.tips-icon {
  margin-right: 15rpx;
  font-size: 28rpx;
}

.tips-content text:last-child {
  font-size: 26rpx;
  color: #856404;
  line-height: 1.5;
}
</style> 