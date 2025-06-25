<template>
  <view class="container">
    <!-- 页面头部 -->
    <view class="header">
      <view class="header-content">
        <text class="title">ORDER</text>
        <view class="search-box">
          <view class="fa fa-search"></view>
          <input type="text" placeholder="搜索鸡尾酒" class="search-input" v-model="searchKeyword" @confirm="searchCocktails" />
        </view>
      </view>
    </view>
    
    <!-- 分类选择 -->
    <scroll-view class="category-scroll" scroll-x="true" show-scrollbar="false">
      <view class="category-list">
        <view 
          class="category-item" 
          :class="{ active: selectedCategoryId === 0 }"
          @tap="selectCategory(0)"
        >
          <text>全部</text>
        </view>
        <view 
          class="category-item" 
          :class="{ active: selectedCategoryId === item.id }"
          v-for="item in categories" 
          :key="item.id"
          @tap="selectCategory(item.id)"
        >
          <text>{{ item.name }}</text>
        </view>
      </view>
    </scroll-view>
    
    <!-- 商品列表 -->
    <scroll-view 
      class="cocktail-list" 
      scroll-y="true"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="refreshData"
    >
      <view class="list-container">
        <view 
          class="cocktail-item"
          v-for="(item, index) in cocktails"
          :key="index"
          @tap="viewDetail(item)"
        >
          <view class="cocktail-image">
            <image :src="item.image" mode="aspectFill"></image>
            <view class="cocktail-tag" v-if="item.tag">{{ item.tag }}</view>
          </view>
          <view class="cocktail-info">
            <text class="cocktail-name">{{ item.name }}</text>
            <text class="cocktail-desc">{{ item.description }}</text>
            <view class="cocktail-bottom">
              <text class="cocktail-price">¥{{ item.price }}</text>
              <view class="add-btn" @tap.stop="addToCart(item)">
                <view class="fa fa-plus">+</view>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view class="loading-more" v-if="isLoading">
        <text>加载中...</text>
      </view>
      
      <!-- 无数据提示 -->
      <view class="no-data" v-if="cocktails.length === 0 && !isLoading">
        <text>暂无数据</text>
      </view>
    </scroll-view>
    
    <!-- 购物车浮动按钮 -->
    <view class="cart-btn" @tap="viewCart" v-if="cartCount > 0">
      <view class="cart-icon">
        <view class="fa fa-shopping-cart"></view>
        <view class="cart-badge" v-if="cartCount > 0">{{ cartCount }}</view>
      </view>
      <view class="cart-price" v-if="cartTotal > 0">¥{{ cartTotal }}</view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';

// 获取全局App实例
const app = getApp();

// 搜索关键词
const searchKeyword = ref('');

// 分类数据
const categories = ref([]);
const selectedCategoryId = ref(0);

// 鸡尾酒数据
const cocktails = ref([]);
const currentPage = ref(1);
const hasMore = ref(true);
const isLoading = ref(false);
const isRefreshing = ref(false);

// 购物车数据
const cartCount = ref(0);
const cartTotal = ref(0);

// 获取鸡尾酒分类
const getCategories = async () => {
  try {
    const data = await app.globalData.api.cocktails.getCategories();
    categories.value = data || [];
  } catch (error) {
    console.error('获取分类失败:', error);
    // 使用本地分类数据作为后备方案
    categories.value = [
      { id: 1, name: '经典鸡尾酒' },
      { id: 2, name: '简易鸡尾酒' },
      { id: 3, name: '创意鸡尾酒' }
    ];
  }
};

// 获取鸡尾酒列表
const getCocktails = async (reset = false) => {
  if (isLoading.value) return;
  
  if (reset) {
    currentPage.value = 1;
    hasMore.value = true;
    cocktails.value = [];
  }
  
  if (!hasMore.value) return;
  
  isLoading.value = true;
  
  try {
    const params = {
      page: currentPage.value,
      limit: 10
    };
    
    // 添加分类过滤
    if (selectedCategoryId.value > 0) {
      params.category_id = selectedCategoryId.value;
    }
    
    // 添加搜索关键词
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value;
    }
    
    const data = await app.globalData.api.cocktails.getList(params);
    
    if (data && data.list) {
      if (reset) {
        cocktails.value = data.list;
      } else {
        cocktails.value = [...cocktails.value, ...data.list];
      }
      
      currentPage.value++;
      hasMore.value = currentPage.value <= data.last_page;
    } else {
      hasMore.value = false;
    }
  } catch (error) {
    console.error('获取鸡尾酒列表失败:', error);
    
    // 使用本地数据作为后备方案
    const localCocktails = [
      {
        id: 1,
        name: '莫吉托',
        price: 35.00,
        description: '莫吉托是一种传统的古巴鸡尾酒，以朗姆酒为酒基，加入薄荷叶、青柠汁、糖和苏打水制成。清爽提神，是夏日的经典选择。',
        image: '/static/images/mojito.png',
        category_id: 1,
        tag: '经典'
      },
      {
        id: 2,
        name: '玛格丽特',
        price: 38.00,
        description: '玛格丽特是一款经典的墨西哥鸡尾酒，以龙舌兰酒为基酒，混合橙味利口酒和新鲜青柠汁，杯口常用盐调味。酸甜平衡，清爽怡人。',
        image: '/static/images/margarita.png',
        category_id: 1,
        tag: '经典'
      },
      {
        id: 3,
        name: '朗姆可乐',
        price: 30.00,
        description: '朗姆可乐是一款简单而受欢迎的鸡尾酒，将朗姆酒与可乐混合，加入一片青柠增添风味。这款饮品也被称为"自由古巴"。',
        image: '/static/images/rum-cola.png',
        category_id: 2,
        tag: '简单'
      },
      {
        id: 4,
        name: '威士忌酸酒',
        price: 42.00,
        description: '威士忌酸酒是一款经典的美国鸡尾酒，以威士忌为基酒，混合新鲜柠檬汁和糖浆，有时会加入蛋白增加质感。口感酸甜平衡，回味悠长。',
        image: '/static/images/whiskey-sour.png',
        category_id: 1,
        tag: '经典'
      },
      {
        id: 5,
        name: '紫色梦境',
        price: 45.00,
        description: '紫色梦境是一款视觉效果惊艳的创意鸡尾酒，以伏特加为基酒，混合蓝柑橘利口酒、蔓越莓汁和柠檬汁，呈现梦幻的紫色渐变效果。',
        image: '/static/images/purple-dream.png',
        category_id: 3,
        tag: '创意'
      },
      {
        id: 6,
        name: '浆果气泡',
        price: 36.00,
        description: '浆果气泡是一款清爽的果味鸡尾酒，混合新鲜草莓、蓝莓、覆盆子与金酒，加入苏打水增添气泡感。酸甜可口，果香浓郁。',
        image: '/static/images/berry-fizz.png',
        category_id: 2,
        tag: '水果'
      }
    ];
    
    // 根据分类和搜索关键词过滤本地数据
    let filteredCocktails = [...localCocktails];
    
    if (selectedCategoryId.value > 0) {
      filteredCocktails = filteredCocktails.filter(c => c.category_id === selectedCategoryId.value);
    }
    
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase();
      filteredCocktails = filteredCocktails.filter(c => 
        c.name.toLowerCase().includes(keyword) || 
        c.description.toLowerCase().includes(keyword)
      );
    }
    
    if (reset) {
      cocktails.value = filteredCocktails;
    } else {
      cocktails.value = [...cocktails.value, ...filteredCocktails];
    }
    
    hasMore.value = false; // 本地数据不需要分页
    
    // 只在确实没有数据时显示toast
    if (filteredCocktails.length === 0) {
      uni.showToast({
        title: '没有找到相关鸡尾酒',
        icon: 'none'
      });
    }
  } finally {
    isLoading.value = false;
    isRefreshing.value = false;
  }
};

// 选择分类
const selectCategory = (categoryId) => {
  if (selectedCategoryId.value === categoryId) return;
  
  selectedCategoryId.value = categoryId;
  getCocktails(true);
};

// 搜索鸡尾酒
const searchCocktails = () => {
  getCocktails(true);
};

// 加载更多
const loadMore = () => {
  if (hasMore.value && !isLoading.value) {
    getCocktails();
  }
};

// 下拉刷新
const refreshData = () => {
  isRefreshing.value = true;
  getCocktails(true);
};

// 方法
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
  
  // 使用全局购物车方法添加商品
  cartCount.value = app.globalData.addToCart(itemToAdd);
  updateCartTotal();
  
  // 同时调用API添加到购物车
  try {
    app.globalData.api.cart.add(item.id, 1);
  } catch (error) {
    console.error('添加到购物车失败:', error);
    // 这里不显示错误，因为本地购物车已经添加成功
  }
  
  uni.showToast({
    title: '已添加到购物车',
    icon: 'success'
  });
};

const viewCart = () => {
  uni.navigateTo({
    url: '/pages/cart/cart'
  });
};

// 更新购物车总价
const updateCartTotal = () => {
  cartTotal.value = app.globalData.getCartTotal();
};

// 页面显示时更新购物车数据
onShow(() => {
  cartCount.value = app.globalData.getCartCount();
  updateCartTotal();
});

// 页面加载
onLoad(() => {
  console.log('Home page loaded');
  // 初始化购物车数据
  cartCount.value = app.globalData.getCartCount();
  updateCartTotal();
  
  // 获取分类数据
  getCategories();
  
  // 获取鸡尾酒列表
  getCocktails();
});
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f9fa;
}

/* 头部样式 */
.header {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  padding: 40rpx 30rpx 30rpx;
  color: #fff;
  position: relative;
}
.uni-input-placeholder{
  color: #fefe;
}
.header-content {
  padding-top: 40rpx;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
  display: block;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 40rpx;
  padding: 12rpx 24rpx;
}

.search-box .fa {
  color: #fff;
  font-size: 28rpx;
  margin-right: 10rpx;
}

.search-input {
  flex: 1;
  height: 60rpx;
  color: #fff;
  font-size: 28rpx;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.8);
}

/* 分类样式 */
.category-scroll {
  background-color: #fff;
  height: 80rpx;
  white-space: nowrap;
}

.category-list {
  display: flex;
  padding: 0 20rpx;
  height: 100%;
}

.category-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 30rpx;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.category-item.active {
  color: #8e44ad;
  font-weight: 500;
}

.category-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background-color: #8e44ad;
  border-radius: 2rpx;
}

/* 商品列表样式 */
.cocktail-list {
  flex: 1;
  padding: 20rpx;
}

.list-container {
  display: flex;
  flex-direction: column;
  padding-bottom: 120rpx; /* 为底部购物车按钮留出空间 */
}

.cocktail-item {
  display: flex;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.cocktail-image {
  width: 200rpx;
  height: 200rpx;
  position: relative;
}

.cocktail-image image {
  width: 100%;
  height: 100%;
}

.cocktail-tag {
  position: absolute;
  top: 16rpx;
  left: 0;
  background-color: #8e44ad;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 0 20rpx 20rpx 0;
}

.cocktail-info {
  flex: 1;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.cocktail-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.cocktail-desc {
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
}

.cocktail-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
}

.cocktail-price {
  font-size: 32rpx;
  color: #8e44ad;
  font-weight: 600;
}

.add-btn {
  width: 60rpx;
  height: 60rpx;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4rpx 8rpx rgba(142, 68, 173, 0.3);
}

.add-btn .fa {
  font-size: 24rpx;
}

/* 加载更多 */
.loading-more {
  text-align: center;
  padding: 20rpx 0;
  color: #999;
  font-size: 24rpx;
}

/* 无数据提示 */
.no-data {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
  font-size: 28rpx;
}

/* 购物车浮动按钮 */
.cart-btn {
  position: fixed;
  bottom: 3.5625rem;
  left: 0.5625rem;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  border-radius: 40rpx;
  height: 90rpx;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  box-shadow: 0 6rpx 16rpx rgba(142, 68, 173, 0.4);
  z-index: 100;
}

.cart-icon {
  position: relative;
  margin-right: 16rpx;
}

.cart-icon .fa {
  color: #fff;
  font-size: 40rpx;
}

.cart-badge {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  background-color: #ff4d4f;
  color: #fff;
  font-size: 20rpx;
  min-width: 32rpx;
  height: 32rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
}

.cart-price {
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
}
</style> 