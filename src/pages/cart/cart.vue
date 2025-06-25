<template>
  <view class="container">
    <!-- 页面标题 -->
    <view class="header">
      <text class="title"></text>
    </view>
    
    <!-- 加载状态 -->
    <view class="loading-container" v-if="isLoading">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 购物车内容 -->
    <view class="cart-content" v-else-if="cartItems.length > 0">
      <!-- 商品列表 -->
      <view class="cart-items">
        <view 
          class="cart-item"
          v-for="(item, index) in cartItems"
          :key="index"
        >
          <view class="item-checkbox" @tap="toggleSelect(item.id)">
            <view class="checkbox" :class="{ selected: item.selected }">
              <view class="fa fa-check" v-if="item.selected"></view>
            </view>
          </view>
          <view class="item-image">
            <image :src="item.image" mode="aspectFill"></image>
          </view>
          <view class="item-info">
            <text class="item-name">{{ item.name }}</text>
            <view class="item-bottom">
              <text class="item-price">¥{{ item.price }}</text>
              <view class="quantity-control">
                <view class="quantity-btn minus" @tap="decreaseQuantity(item.id)">
                  <view class="fa fa-minus">-</view>
                </view>
                <text class="quantity-value">{{ item.quantity }}</text>
                <view class="quantity-btn plus" @tap="increaseQuantity(item.id)">
                  <view class="fa fa-plus">+</view>
                </view>
              </view>
            </view>
          </view>
          <view class="item-delete" @tap="removeItem(item.id)">
            <view class="fa fa-trash"></view>
          </view>
        </view>
      </view>
      
      <!-- 推荐商品 -->
      <view class="recommended-section" v-if="recommendedItems.length > 0">
        <view class="section-header">
          <text class="section-title">猜你喜欢</text>
        </view>
        <view class="loading-container" v-if="isRecommendedLoading">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
        <scroll-view v-else class="recommended-scroll" scroll-x="true" show-scrollbar="false">
          <view class="recommended-list">
            <view 
              class="recommended-item"
              v-for="(item, index) in recommendedItems"
              :key="index"
              @tap="viewDetail(item)"
            >
              <view class="recommended-image">
                <image :src="item.image" mode="aspectFill"></image>
              </view>
              <text class="recommended-name">{{ item.name }}</text>
              <text class="recommended-price">¥{{ item.price }}</text>
              <view class="add-btn" @tap.stop="addToCart(item)">
                <view class="fa fa-plus">+</view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
    
    <!-- 空购物车 -->
    <view class="empty-cart" v-else>
      <image src="/static/images/empty-cart.png" mode="aspectFit" class="empty-image"></image>
      <text class="empty-text">购物车还是空的</text>
      <text class="empty-subtext">去挑选你喜欢的鸡尾酒吧</text>
      <view class="go-shopping-btn" @tap="goShopping">
        <text>去逛逛</text>
      </view>
    </view>
    
    <!-- 底部结算栏 -->
    <view class="checkout-bar" v-if="cartItems.length > 0">
      <view class="select-all" @tap="toggleSelectAll">
        <view class="checkbox" :class="{ selected: allSelected }">
          <view class="fa fa-check" v-if="allSelected"></view>
        </view>
        <text class="select-all-text">全选</text>
      </view>
      <view class="price-info">
        <text class="total-label">合计:</text>
        <text class="total-price">¥{{ totalPrice }}</text>
      </view>
      <view class="checkout-btn" @tap="checkout">
        <text>结算({{ selectedCount }})</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { onShow, onLoad, onUnload } from '@dcloudio/uni-app';

// 获取全局App实例
const app = getApp();

// 购物车商品数据
const cartItems = ref([]);

// 加载状态
const isLoading = ref(false);

// 推荐商品数据
const recommendedItems = ref([]);
const isRecommendedLoading = ref(false);

// 使用响应式数据而非计算属性
const totalPrice = ref('0.00');
const selectedCount = ref(0);
const allSelected = ref(false);

// 存储回调函数引用
let cartUpdateCallback = null;

// 更新总价和选中状态
const updateTotalAndSelection = () => {
  totalPrice.value = app.globalData.getCartTotal().toFixed(2);
  
  selectedCount.value = cartItems.value
    .filter(item => item.selected)
    .reduce((count, item) => count + item.quantity, 0);
    
  allSelected.value = cartItems.value.length > 0 && cartItems.value.every(item => item.selected);
};

// 获取购物车数据
const getCartData = async () => {
  isLoading.value = true;
  
  try {
    // 先使用本地数据
    updateCartItems();
    
    // 然后尝试从API获取数据
    const data = await app.globalData.api.cart.getList();
    
    if (data && data.items) {
      // 使用API返回的数据更新本地购物车
      app.globalData.cartItems = data.items.map(item => ({
        id: item.id,
        cocktail_id: item.cocktail_id,
        name: item.name,
        price: Number(item.price),
        image: item.image,
        quantity: item.quantity,
        selected: item.selected
      }));
      
      // 更新本地显示
      updateCartItems();
    }
  } catch (error) {
    console.error('获取购物车数据失败:', error);
    // 这里不显示错误，因为已经使用本地数据
  } finally {
    isLoading.value = false;
  }
};

// 获取推荐商品
const getRecommendedItems = async () => {
  isRecommendedLoading.value = true;
  
  try {
    const data = await app.globalData.api.cocktails.getRecommended(4);
    
    if (data) {
      recommendedItems.value = data;
      
      // 过滤掉已在购物车中的商品
      const cartItemIds = cartItems.value.map(item => item.id);
      recommendedItems.value = recommendedItems.value.filter(item => !cartItemIds.includes(item.id));
    }
  } catch (error) {
    console.error('获取推荐商品失败:', error);
    // 使用默认推荐数据
    recommendedItems.value = [
      {
        id: 2,
        name: '朗姆可乐',
        price: 38,
        image: '/static/images/rum-cola.png',
        description: '简单清爽的朗姆酒调饮，加入可乐更添风味'
      },
      {
        id: 4,
        name: '玛格丽特',
        price: 58,
        image: '/static/images/margarita.png',
        description: '墨西哥经典，龙舌兰酒基底，盐边杯口'
      }
    ];
  } finally {
    isRecommendedLoading.value = false;
  }
};

// 方法
const toggleSelect = async (itemId) => {
  // 先更新本地状态
  app.globalData.toggleItemSelection(itemId);
  updateCartItems();
  
  // 然后同步到服务器
  try {
    const item = cartItems.value.find(item => item.id === itemId);
    if (item) {
      await app.globalData.api.cart.select(itemId, item.selected);
    }
  } catch (error) {
    console.error('更新选中状态失败:', error);
    // 这里不显示错误，因为本地已经更新
  }
};

const toggleSelectAll = async () => {
  const newState = !allSelected.value;
  
  // 先更新本地状态
  app.globalData.toggleAllSelection(newState);
  updateCartItems();
  
  // 然后同步到服务器
  try {
    await app.globalData.api.cart.selectAll(newState);
  } catch (error) {
    console.error('全选/取消全选失败:', error);
    // 这里不显示错误，因为本地已经更新
  }
};

const increaseQuantity = async (itemId) => {
  const item = cartItems.value.find(item => item.id === itemId);
  if (item && item.quantity < 99) {
    // 先更新本地状态
    app.globalData.updateCartItemQuantity(itemId, item.quantity + 1);
    updateCartItems();
    
    // 然后同步到服务器
    try {
      await app.globalData.api.cart.update(itemId, item.quantity + 1);
    } catch (error) {
      console.error('更新数量失败:', error);
      // 这里不显示错误，因为本地已经更新
    }
  }
};

const decreaseQuantity = async (itemId) => {
  const item = cartItems.value.find(item => item.id === itemId);
  if (item) {
    if (item.quantity > 1) {
      // 先更新本地状态
      app.globalData.updateCartItemQuantity(itemId, item.quantity - 1);
      updateCartItems();
      
      // 然后同步到服务器
      try {
        await app.globalData.api.cart.update(itemId, item.quantity - 1);
      } catch (error) {
        console.error('更新数量失败:', error);
        // 这里不显示错误，因为本地已经更新
      }
    } else {
      removeItem(itemId);
    }
  }
};

const removeItem = (itemId) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这个商品吗？',
    success: async function(res) {
      if (res.confirm) {
        // 先更新本地状态
        app.globalData.removeFromCart(itemId);
        updateCartItems();
        
        // 然后同步到服务器
        try {
          await app.globalData.api.cart.remove(itemId);
        } catch (error) {
          console.error('删除商品失败:', error);
          // 这里不显示错误，因为本地已经更新
        }
      }
    }
  });
};

const viewDetail = (item) => {
  uni.navigateTo({
    url: `/pages/cocktail-detail/cocktail-detail?id=${item.id}`
  });
};

const addToCart = (item) => {
  // 确保价格是数字
  const itemToAdd = {
    ...item,
    price: Number(item.price)
  };
  
  // 先更新本地状态
  app.globalData.addToCart(itemToAdd);
  updateCartItems();
  
  // 然后同步到服务器
  try {
    app.globalData.api.cart.add(item.id, 1);
  } catch (error) {
    console.error('添加到购物车失败:', error);
    // 这里不显示错误，因为本地已经更新
  }
  
  uni.showToast({
    title: '已添加到购物车',
    icon: 'success'
  });
};

const goShopping = () => {
  uni.switchTab({
    url: '/pages/home/home'
  });
};

const checkout = () => {
  if (selectedCount.value === 0) {
    uni.showToast({
      title: '请选择要结算的商品',
      icon: 'none'
    });
    return;
  }
  
  // 检查登录状态
  const token = uni.getStorageSync('token');
  const userInfo = uni.getStorageSync('userInfo');
  
  if (!token || !userInfo) {
    // 未登录，提示用户登录
    uni.showModal({
      title: '需要登录',
      content: '结算前需要先登录，是否现在登录？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/index/index'
          });
        }
      }
    });
    return;
  }
  
  // 跳转到订单确认页面
  uni.navigateTo({
    url: '/pages/order-confirm/order-confirm'
  });
};

// 更新购物车商品
const updateCartItems = () => {
  cartItems.value = [...app.globalData.getCartItems()];
  updateTotalAndSelection();
};

// 购物车更新回调函数
const handleCartUpdate = () => {
  updateCartItems();
};

// 页面加载时注册回调
onLoad(() => {
  // 保存回调引用以便后续移除
  cartUpdateCallback = app.globalData.onCartUpdate(handleCartUpdate);
});

// 页面卸载时移除回调（避免内存泄漏）
onUnload(() => {
  if (cartUpdateCallback) {
    app.globalData.offCartUpdate(cartUpdateCallback);
  }
});

// 页面显示时更新购物车数据
onShow(() => {
  // 获取购物车数据
  getCartData();
  
  // 获取推荐商品
  getRecommendedItems();
});
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 120rpx; /* 为底部结算栏留出空间 */
}

/* 页面标题 */
.header {
  padding: 30rpx;
  background-color: #fff;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

/* 加载状态样式 */
.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx 0;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #8e44ad;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

/* 购物车内容 */
.cart-content {
  flex: 1;
}

/* 商品列表 */
.cart-items {
  margin-top: 20rpx;
  background-color: #fff;
  padding: 0 20rpx;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-checkbox {
  margin-right: 20rpx;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox.selected {
  background-color: #8e44ad;
  border-color: #8e44ad;
}

.checkbox .fa {
  color: #fff;
  font-size: 24rpx;
}

.item-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  overflow: hidden;
  margin-right: 20rpx;
}

.item-image image {
  width: 100%;
  height: 100%;
}

.item-info {
  flex: 1;
  height: 160rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price {
  font-size: 32rpx;
  color: #8e44ad;
  font-weight: 600;
}

.quantity-control {
  display: flex;
  align-items: center;
}

.quantity-btn {
  width: 50rpx;
  height: 50rpx;
  border-radius: 25rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-btn.minus {
  background-color: #f5f5f5;
}

.quantity-btn.plus {
  background-color: #8e44ad;
}

.quantity-btn .fa {
  font-size: 20rpx;
  font-size: small;
}

.quantity-btn.minus .fa {
  color: #999;
}

.quantity-btn.plus .fa {
  color: #fff;
}

.quantity-value {
  width: 50rpx;
  text-align: center;
  font-size: 28rpx;
  color: #333;
}

.item-delete {
  padding: 20rpx;
  color: #999;
}

.item-delete .fa {
  font-size: 32rpx;
}

/* 推荐商品 */
.recommended-section {
  margin-top: 20rpx;
  background-color: #fff;
  padding: 30rpx 0;
}

.section-header {
  padding: 0 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  position: relative;
  padding-left: 20rpx;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8rpx;
  height: 30rpx;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  border-radius: 4rpx;
}

.recommended-scroll {
  white-space: nowrap;
}

.recommended-list {
  display: flex;
  padding: 0 20rpx;
}

.recommended-item {
  width: 200rpx;
  margin-right: 20rpx;
  display: inline-block;
  position: relative;
}

.recommended-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 10rpx;
}

.recommended-image image {
  width: 100%;
  height: 100%;
}

.recommended-name {
  font-size: 26rpx;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.recommended-price {
  font-size: 28rpx;
  color: #8e44ad;
  font-weight: 500;
  display: block;
  margin-top: 6rpx;
}

.add-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 50rpx;
  height: 50rpx;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4rpx 8rpx rgba(142, 68, 173, 0.3);
}

.add-btn .fa {
  font-size: 20rpx;
  color: #fff;
}

/* 空购物车 */
.empty-cart {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-image {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 10rpx;
}

.empty-subtext {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.go-shopping-btn {
  width: 300rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
}

/* 底部结算栏 */
.checkout-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.select-all {
  display: flex;
  align-items: center;
}

.select-all-text {
  font-size: 28rpx;
  color: #333;
  margin-left: 10rpx;
}

.price-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-right: 20rpx;
}

.total-label {
  font-size: 28rpx;
  color: #333;
}

.total-price {
  font-size: 36rpx;
  color: #8e44ad;
  font-weight: 600;
  margin-left: 10rpx;
}

.checkout-btn {
  width: 220rpx;
  height: 70rpx;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  border-radius: 35rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
}
</style> 