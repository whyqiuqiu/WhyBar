<template>
  <view class="container">
    <!-- 加载状态 -->
    <view class="loading-container" v-if="isLoading">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 鸡尾酒详情内容 -->
    <block v-else>
      <!-- 鸡尾酒图片 -->
      <view class="cocktail-image">
        <image :src="cocktail.image" mode="aspectFill"></image>
        <view class="back-btn" @tap="goBack">
          <view class="fa fa-arrow-left"></view>
        </view>
      </view>
      
      <!-- 内容滚动区域 -->
      <scroll-view class="content-scroll" scroll-y="true" :show-scrollbar="false">
        <!-- 基本信息 -->
        <view class="info-section">
          <view class="name-price">
            <text class="cocktail-name">{{ cocktail.name }}</text>
            <text class="cocktail-price">¥{{ cocktail.price }}</text>
          </view>
          <text class="cocktail-desc">{{ cocktail.description }}</text>
          
          <!-- 评分 -->
          <view class="rating-box">
            <view class="rating-stars">
              <view class="fa fa-star" v-for="i in 5" :key="i" :class="{ active: i <= cocktail.rating }"></view>
            </view>
            <text class="rating-value">{{ cocktail.rating }}/5</text>
            <text class="rating-count">({{ cocktail.ratingCount }}人评价)</text>
          </view>
        </view>
        
        <!-- 配料 -->
        <view class="section">
          <view class="section-header">
            <text class="section-title">配料</text>
          </view>
          <view class="ingredients-list">
            <view class="ingredient-item" v-for="(item, index) in cocktail.ingredients" :key="index">
              <view class="ingredient-dot"></view>
              <text class="ingredient-name">{{ item.name }}</text>
              <text class="ingredient-amount">{{ item.amount }}</text>
            </view>
          </view>
        </view>
        
        <!-- 制作方法 -->
        <view class="section">
          <view class="section-header">
            <text class="section-title">制作方法</text>
          </view>
          <view class="steps-list">
            <view class="step-item" v-for="(step, index) in cocktail.steps" :key="index">
              <view class="step-number">{{ index + 1 }}</view>
              <text class="step-text">{{ step }}</text>
            </view>
          </view>
        </view>
        
        <!-- 酒精含量 -->
        <view class="section">
          <view class="section-header">
            <text class="section-title">酒精含量</text>
          </view>
          <view class="alcohol-meter">
            <view class="alcohol-bar">
              <view class="alcohol-fill" :style="{ width: cocktail.alcoholPercentage + '%' }"></view>
            </view>
            <text class="alcohol-text">{{ cocktail.alcoholPercentage }}%</text>
          </view>
        </view>
        
        <!-- 底部空白区域，为底部购买栏留出空间 -->
        <view class="bottom-space"></view>
      </scroll-view>
      
      <!-- 底部购买栏 -->
      <view class="bottom-bar">
        <view class="quantity-control">
          <view class="quantity-btn minus" @tap="decreaseQuantity">
            <view class="fa fa-minus">-</view>
          </view>
          <text class="quantity-value">{{ quantity }}</text>
          <view class="quantity-btn plus" @tap="increaseQuantity">
            <view class="fa fa-plus">+</view>
          </view>
        </view>
        <view class="add-to-cart-btn" @tap="addToCart">
          <text>加入购物车</text>
        </view>
      </view>
    </block>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// 获取全局App实例
const app = getApp();

// 商品数量
const quantity = ref(1);

// 商品ID
const cocktailId = ref(0);

// 加载状态
const isLoading = ref(true);

// 鸡尾酒数据
const cocktail = reactive({
  id: 0,
  name: '',
  description: '',
  price: 0,
  image: '',
  rating: 0,
  ratingCount: 0,
  alcoholPercentage: 0,
  ingredients: [],
  steps: []
});

// 获取鸡尾酒详情
const getCocktailDetail = async (id) => {
  isLoading.value = true;
  
  try {
    const data = await app.globalData.api.cocktails.getDetail(id);
    
    if (data) {
      // 更新鸡尾酒数据
      Object.assign(cocktail, {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
        rating: data.rating,
        ratingCount: data.rating_count,
        alcoholPercentage: data.alcohol_percentage,
        ingredients: data.ingredients || [],
        steps: data.steps || []
      });
    }
  } catch (error) {
    console.error('获取鸡尾酒详情失败:', error);
    uni.showToast({
      title: '获取详情失败',
      icon: 'none'
    });
    
    // 失败后返回上一页
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } finally {
    isLoading.value = false;
  }
};

// 增加数量
const increaseQuantity = () => {
  if (quantity.value < 99) {
    quantity.value++;
  }
};

// 减少数量
const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

// 添加到购物车
const addToCart = () => {
  // 确保价格是数字
  const itemToAdd = {
    ...cocktail,
    price: Number(cocktail.price)
  };
  
  // 使用全局购物车方法添加商品
  app.globalData.addToCart(itemToAdd, quantity.value);
  
  // 同时调用API添加到购物车
  try {
    app.globalData.api.cart.add(cocktail.id, quantity.value);
  } catch (error) {
    console.error('添加到购物车失败:', error);
    // 这里不显示错误，因为本地购物车已经添加成功
  }
  
  uni.showToast({
    title: `已添加${quantity.value}杯${cocktail.name}到购物车`,
    icon: 'success'
  });
  
  // 添加后返回上一页
  setTimeout(() => {
    uni.navigateBack();
  }, 1500);
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 页面加载时获取商品ID
onLoad((options) => {
  if (options.id) {
    cocktailId.value = parseInt(options.id);
    // 获取鸡尾酒详情
    getCocktailDetail(cocktailId.value);
  } else {
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    });
    
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  }
});
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f9fa;
}

/* 加载状态样式 */
.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

/* 鸡尾酒图片 */
.cocktail-image {
  width: 100%;
  height: 500rpx;
  position: relative;
  flex-shrink: 0;
  background-color: #eee;
}

.cocktail-image image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.back-btn {
  position: absolute;
  top: 80rpx;
  left: 30rpx;
  width: 70rpx;
  height: 70rpx;
  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10rpx);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn .fa {
  color: #fff;
  font-size: 30rpx;
}

/* 内容滚动区域 */
.content-scroll {
  flex: 1;
  overflow: hidden;
}

/* 基本信息 */
.info-section {
  padding: 30rpx;
  background-color: #fff;
  border-radius: 30rpx 30rpx 0 0;
  margin-top: -30rpx;
  position: relative;
  z-index: 1;
}

.name-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.cocktail-name {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}

.cocktail-price {
  font-size: 40rpx;
  color: #8e44ad;
  font-weight: 600;
}

.cocktail-desc {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

/* 评分 */
.rating-box {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
}

.rating-stars {
  display: flex;
}

.rating-stars .fa {
  color: #ddd;
  font-size: 28rpx;
  margin-right: 6rpx;
}

.rating-stars .fa.active {
  color: #ffb400;
}

.rating-value {
  font-size: 26rpx;
  color: #333;
  margin: 0 10rpx;
}

.rating-count {
  font-size: 24rpx;
  color: #999;
}

/* 内容区块 */
.section {
  margin: 20rpx 30rpx;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.section-header {
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

/* 配料列表 */
.ingredients-list {
  display: flex;
  flex-direction: column;
}

.ingredient-item {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.ingredient-dot {
  width: 12rpx;
  height: 12rpx;
  background-color: #8e44ad;
  border-radius: 50%;
  margin-right: 16rpx;
}

.ingredient-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.ingredient-amount {
  font-size: 28rpx;
  color: #999;
}

/* 制作步骤 */
.steps-list {
  display: flex;
  flex-direction: column;
}

.step-item {
  display: flex;
  margin-bottom: 24rpx;
}

.step-number {
  width: 40rpx;
  height: 40rpx;
  background-color: #8e44ad;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.step-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

/* 酒精含量 */
.alcohol-meter {
  display: flex;
  align-items: center;
}

.alcohol-bar {
  flex: 1;
  height: 16rpx;
  background-color: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
  margin-right: 20rpx;
}

.alcohol-fill {
  height: 100%;
  background: linear-gradient(90deg, #9b59b6, #8e44ad);
  border-radius: 8rpx;
}

.alcohol-text {
  font-size: 28rpx;
  color: #8e44ad;
  font-weight: 500;
}

/* 底部空白区域 */
.bottom-space {
  height: 120rpx;
}

/* 底部购买栏 */
.bottom-bar {
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

.quantity-control {
  display: flex;
  align-items: center;
  margin-right: 30rpx;
}

.quantity-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 30rpx;
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
  font-size: small;
}

.quantity-btn.minus .fa {
  color: #999;
}

.quantity-btn.plus .fa {
  color: #fff;
}

.quantity-value {
  width: 60rpx;
  text-align: center;
  font-size: 30rpx;
  color: #333;
}

.add-to-cart-btn {
  flex: 1;
  height: 80rpx;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
}
</style> 