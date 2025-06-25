<template>
  <view class="container">
    <!-- 状态筛选 -->
    <view class="filter-tabs">
      <view 
        class="filter-tab" 
        :class="{ active: currentStatus === item.value }"
        v-for="item in statusTabs" 
        :key="item.value"
        @tap="switchStatus(item.value)"
      >
        <text>{{ item.label }}</text>
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view 
      class="order-list" 
      scroll-y="true"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="refreshData"
    >
      <view class="list-container">
        <view 
          class="order-item"
          v-for="order in orders"
          :key="order.id"
          @tap="viewOrderDetail(order.id)"
        >
          <!-- 订单头部 -->
          <view class="order-header">
            <text class="order-no">订单号：{{ order.order_no || order.id }}</text>
            <text class="order-status" :class="getStatusClass(order.status)">
              {{ getStatusText(order.status) }}
            </text>
          </view>

          <!-- 商品列表 -->
          <view class="goods-list">
            <view 
              class="goods-item" 
              v-for="item in order.items" 
              :key="item.id"
            >
              <image class="goods-image" :src="item.image" mode="aspectFill"></image>
              <view class="goods-info">
                <text class="goods-name">{{ item.name }}</text>
                <text class="goods-price">¥{{ item.price }}</text>
              </view>
              <text class="goods-quantity">x{{ item.quantity }}</text>
            </view>
          </view>

          <!-- 订单信息 -->
          <view class="order-info">
            <text class="order-time">{{ formatDate(order.created_at) }}</text>
            <text class="order-total">共{{ getTotalQuantity(order.items) }}件商品 合计：¥{{ order.total_amount?.toFixed(2) }}</text>
          </view>

          <!-- 操作按钮 -->
          <view class="order-actions" v-if="getOrderActions(order.status).length > 0">
            <view 
              class="action-btn" 
              :class="action.type"
              v-for="action in getOrderActions(order.status)" 
              :key="action.key"
              @tap.stop="handleAction(action.key, order)"
            >
              {{ action.text }}
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="loading-more" v-if="isLoading">
        <text>加载中...</text>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="orders.length === 0 && !isLoading">
        <view class="empty-icon">
          <view class="fa fa-inbox"></view>
        </view>
        <text class="empty-text">暂无订单</text>
      </view>
    </scroll-view>
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

// 状态筛选
const statusTabs = [
  { label: '全部', value: -1 },
  { label: '待支付', value: 0 },
  { label: '待发货', value: 1 },
  { label: '待收货', value: 2 },
  { label: '已完成', value: 3 }
];

// 页面状态
const currentStatus = ref(-1);
const currentPage = ref(1);
const hasMore = ref(true);
const isRefreshing = ref(false);

// 从Pinia store获取订单数据
const orders = computed(() => {
  const allOrders = orderStore.currentUserOrders;
  let filteredOrders;
  
  if (currentStatus.value === -1) {
    // 全部订单：返回所有订单
    filteredOrders = [...allOrders];
  } else {
    // 按状态过滤订单
    filteredOrders = allOrders.filter(order => order.status === currentStatus.value);
  }
  
  // 按下单时间排序：越接近现在的时间越靠前（降序排列）
  filteredOrders.sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return timeB - timeA; // 降序：最新的在前面
  });
  
  console.log('订单列表计算属性更新 - 已按时间排序:', {
    当前状态: currentStatus.value,
    状态文本: currentStatus.value === -1 ? '全部' : ['待支付', '待发货', '待收货', '已完成'][currentStatus.value],
    总订单数: allOrders.length,
    过滤后订单数: filteredOrders.length,
    所有订单状态分布: allOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {}),
    排序后订单时间顺序: filteredOrders.map(o => ({ 
      id: o.id,
      order_no: o.order_no, 
      status: o.status, 
      created_at: o.created_at,
      name: o.items?.[0]?.name 
    }))
  });
  
  return filteredOrders;
});
const isLoading = computed(() => orderStore.isLoading);

// 页面加载时获取参数
onLoad((options) => {
  if (options && options.status !== undefined) {
    currentStatus.value = parseInt(options.status);
  }
  loadOrders(true);
});

// 页面显示时刷新数据
onShow(() => {
  console.log('订单列表页面显示，用户ID:', userStore.userId, '当前状态:', currentStatus.value);
  if (userStore.userId) {
    loadOrders(true);
  }
});

// 切换状态
const switchStatus = (status) => {
  if (currentStatus.value === status) return;
  currentStatus.value = status;
  loadOrders(true);
};

// 加载订单列表
const loadOrders = async (reset = false) => {
  if (!userStore.userId) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    return;
  }
  
  if (reset) {
    currentPage.value = 1;
    hasMore.value = true;
  }
  
  if (!hasMore.value) return;
  
  try {
    // 对于"全部订单"，始终确保加载完整数据
    if (currentStatus.value === -1) {
      // 强制重新加载所有订单数据，不传status参数
      console.log('加载全部订单，强制从服务器获取完整数据');
      await orderStore.fetchUserOrders(userStore.userId, { force: true });
      hasMore.value = false; // 全部订单不需要分页
    } else {
      // 对于特定状态，可以使用分页和过滤
      const params = {
        page: currentPage.value,
        limit: 10,
        status: currentStatus.value
      };
      
      console.log('加载特定状态订单，当前状态:', currentStatus.value, '请求参数:', params);
      
      const orderList = await orderStore.fetchUserOrders(userStore.userId, params);
      
      if (orderList && orderList.length > 0) {
        currentPage.value++;
        hasMore.value = orderList.length >= params.limit;
      } else {
        hasMore.value = false;
      }
    }
  } catch (error) {
    console.error('获取订单列表失败:', error);
    hasMore.value = false;
  } finally {
    isRefreshing.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (hasMore.value && !isLoading.value) {
    loadOrders();
  }
};

// 下拉刷新
const refreshData = () => {
  isRefreshing.value = true;
  loadOrders(true);
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
  return texts[status] || '未知';
};

// 获取状态样式类
const getStatusClass = (status) => {
  const classes = {
    0: 'pending',
    1: 'paid',
    2: 'shipped',
    3: 'completed',
    4: 'cancelled'
  };
  return classes[status] || '';
};

// 获取商品总数量
const getTotalQuantity = (items) => {
  return items?.reduce((total, item) => total + item.quantity, 0) || 0;
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

// 获取订单操作按钮
const getOrderActions = (status) => {
  const actions = [];
  
  switch (status) {
    case 0: // 待支付
      actions.push(
        { key: 'cancel', text: '取消订单', type: 'secondary' },
        { key: 'pay', text: '立即支付', type: 'primary' }
      );
      break;
    case 1: // 待发货
      actions.push(
        { key: 'cancel', text: '申请退款', type: 'secondary' }
      );
      break;
    case 2: // 待收货
      actions.push(
        { key: 'confirm', text: '确认收货', type: 'primary' }
      );
      break;
    case 3: // 已完成
      actions.push(
        { key: 'review', text: '评价', type: 'secondary' },
        { key: 'rebuy', text: '再次购买', type: 'primary' }
      );
      break;
  }
  
  return actions;
};

// 处理操作按钮点击
const handleAction = async (action, order) => {
  switch (action) {
    case 'pay':
      await payOrder(order);
      break;
    case 'cancel':
      await cancelOrder(order);
      break;
    case 'confirm':
      await confirmOrder(order);
      break;
    case 'review':
      reviewOrder(order);
      break;
    case 'rebuy':
      rebuyOrder(order);
      break;
  }
};

// 支付订单
const payOrder = async (order) => {
  try {
    await orderStore.payOrder(userStore.userId, order.id);
    uni.showToast({
      title: '支付成功',
      icon: 'success'
    });
    // 刷新列表
    setTimeout(() => {
      loadOrders(true);
    }, 1500);
  } catch (error) {
    console.error('支付失败:', error);
    uni.showToast({
      title: '支付失败',
      icon: 'none'
    });
  }
};

// 取消订单
const cancelOrder = (order) => {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消这个订单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await orderStore.cancelOrder(userStore.userId, order.id);
          uni.showToast({
            title: '订单已取消',
            icon: 'success'
          });
          // 刷新列表
          setTimeout(() => {
            loadOrders(true);
          }, 1500);
        } catch (error) {
          console.error('取消订单失败:', error);
          uni.showToast({
            title: '取消失败',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 确认收货
const confirmOrder = (order) => {
  uni.showModal({
    title: '确认收货',
    content: '确认已收到商品吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await orderStore.confirmOrder(userStore.userId, order.id);
          uni.showToast({
            title: '确认收货成功',
            icon: 'success'
          });
          // 刷新列表
          setTimeout(() => {
            loadOrders(true);
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

// 评价订单
const reviewOrder = (order) => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  });
};

// 再次购买
const rebuyOrder = (order) => {
  // 将订单商品加入购物车
  order.items.forEach(item => {
    app.globalData.addToCart(item, item.quantity);
  });
  
  uni.showToast({
    title: '已加入购物车',
    icon: 'success'
  });
  
  // 跳转到购物车
  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/cart/cart'
    });
  }, 1500);
};

// 查看订单详情
const viewOrderDetail = (orderId) => {
  uni.navigateTo({
    url: `/pages/order-detail/order-detail?id=${orderId}`
  });
};
</script>

<style>
.container {
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* 状态筛选 */
.filter-tabs {
  display: flex;
  background-color: #fff;
  padding: 0 20rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.filter-tab {
  flex: 1;
  text-align: center;
  padding: 30rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.filter-tab.active {
  color: #8e44ad;
  font-weight: 500;
}

.filter-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #8e44ad;
  border-radius: 2rpx;
}

/* 订单列表 */
.order-list {
  flex: 1;
  padding: 20rpx;
}

.list-container {
  padding-bottom: 40rpx;
}

.order-item {
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

/* 订单头部 */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.order-no {
  font-size: 26rpx;
  color: #666;
}

.order-status {
  font-size: 26rpx;
  font-weight: 500;
}

.order-status.pending {
  color: #f39c12;
}

.order-status.paid {
  color: #3498db;
}

.order-status.shipped {
  color: #2ecc71;
}

.order-status.completed {
  color: #27ae60;
}

.order-status.cancelled {
  color: #e74c3c;
}

/* 商品列表 */
.goods-list {
  margin-bottom: 20rpx;
}

.goods-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.goods-item:last-child {
  margin-bottom: 0;
}

.goods-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.goods-info {
  flex: 1;
}

.goods-name {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.goods-price {
  font-size: 26rpx;
  color: #8e44ad;
  font-weight: 500;
}

.goods-quantity {
  font-size: 26rpx;
  color: #666;
  margin-left: 20rpx;
}

/* 订单信息 */
.order-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.order-time {
  font-size: 24rpx;
  color: #999;
}

.order-total {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

/* 操作按钮 */
.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}

.action-btn {
  padding: 15rpx 30rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  text-align: center;
  min-width: 120rpx;
  border: 1rpx solid #e0e0e0;
}

.action-btn.primary {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: #fff;
  border-color: #8e44ad;
}

.action-btn.secondary {
  background-color: #fff;
  color: #666;
}

/* 加载更多 */
.loading-more {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 26rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  color: #ddd;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style> 