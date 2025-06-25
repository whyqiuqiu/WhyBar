<template>
  <view class="container">
    <!-- 地址列表 -->
    <view class="address-list" v-if="addresses.length > 0">
      <view 
        class="address-item" 
        v-for="address in addresses" 
        :key="address.id"
        @tap="selectAddressItem(address)"
      >
        <view class="address-content">
          <view class="address-header">
            <text class="contact-info">{{ address.name }} {{ address.phone }}</text>
            <view class="default-tag" v-if="address.is_default">默认</view>
          </view>
          
          <view class="address-detail">
            {{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}
          </view>
        </view>
        
        <view class="address-actions" v-if="!isSelectMode" @tap.stop="">
          <view class="action-btn edit" @tap="editAddress(address)">
            <view class="fa fa-edit"></view>
          </view>
          <view class="action-btn delete" @tap="deleteAddress(address.id)">
            <view class="fa fa-trash"></view>
          </view>
        </view>
        
        <view class="select-indicator" v-if="isSelectMode">
          <view class="fa fa-chevron-right"></view>
        </view>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <view class="empty-icon">
        <view class="fa fa-map-marker-alt"></view>
      </view>
      <text class="empty-text">暂无收货地址</text>
      <view class="empty-action" @tap="addAddress">
        <text>添加地址</text>
      </view>
    </view>
    
    <!-- 添加地址按钮 -->
    <view class="add-btn" @tap="addAddress" v-if="addresses.length > 0">
      <view class="fa fa-plus"></view>
      <text>新增收货地址</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 使用uni-app的生命周期函数
const onShow = uni.$on ? (callback) => {
  const page = getCurrentPages()[getCurrentPages().length - 1];
  if (page && page.$vm) {
    page.$vm.$on('onShow', callback);
  }
} : () => {};

// 获取全局App实例
const app = getApp();

// 页面状态
const addresses = ref([]);
const isSelectMode = ref(false);
const isLoading = ref(false);

// 页面加载时获取参数
onMounted(() => {
  // 检查是否为选择模式
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options || {};
  isSelectMode.value = options.select === 'true';
  
  loadAddresses();
});

// 加载地址列表
const loadAddresses = async () => {
  isLoading.value = true;
  try {
    const addressList = await app.globalData.api.user.getAddresses();
    addresses.value = addressList;
  } catch (error) {
    console.error('加载地址列表失败:', error);
    uni.showToast({
      title: '加载地址失败',
      icon: 'none'
    });
  } finally {
    isLoading.value = false;
  }
};

// 选择地址（选择模式下）
const selectAddressItem = (address) => {
  if (isSelectMode.value) {
    // 通过事件通知订单确认页面
    uni.$emit('addressSelected', address);
    uni.navigateBack();
  }
};

// 添加地址
const addAddress = () => {
  uni.navigateTo({
    url: '/pages/address-edit/address-edit'
  });
};

// 编辑地址
const editAddress = (address) => {
  uni.navigateTo({
    url: `/pages/address-edit/address-edit?id=${address.id}`
  });
};

// 删除地址
const deleteAddress = (addressId) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个地址吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await app.globalData.api.user.deleteAddress(addressId);
          
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          });
          
          // 重新加载地址列表
          loadAddresses();
        } catch (error) {
          console.error('删除地址失败:', error);
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 页面显示时重新加载数据
onShow(() => {
  loadAddresses();
});
</script>

<style>
.container {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding: 20rpx;
}

.address-list {
  margin-bottom: 120rpx;
}

.address-item {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.address-content {
  flex: 1;
}

.address-header {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
}

.contact-info {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-right: 20rpx;
}

.default-tag {
  background-color: #8e44ad;
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.address-detail {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

.address-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #fff;
}

.action-btn.edit {
  background-color: #8e44ad;
}

.action-btn.delete {
  background-color: #e74c3c;
}

.select-indicator {
  color: #8e44ad;
  font-size: 28rpx;
  margin-left: 20rpx;
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
  font-size: 32rpx;
  color: #999;
  margin-bottom: 50rpx;
}

.empty-action {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: #fff;
  padding: 20rpx 40rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
}

/* 添加按钮 */
.add-btn {
  position: fixed;
  bottom: 30rpx;
  left: 30rpx;
  right: 30rpx;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: #fff;
  height: 100rpx;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 20rpx rgba(142, 68, 173, 0.3);
}

.add-btn .fa {
  margin-right: 15rpx;
  font-size: 28rpx;
}
</style> 