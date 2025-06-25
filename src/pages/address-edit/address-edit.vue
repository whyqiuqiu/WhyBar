<template>
  <view class="container">
    <view class="form-section">
      <!-- 联系人信息 -->
      <view class="form-group">
        <text class="label">收货人姓名</text>
        <input 
          class="input" 
          type="text" 
          placeholder="请输入收货人姓名"
          v-model="formData.name"
          maxlength="20"
        />
      </view>
      
      <view class="form-group">
        <text class="label">手机号码</text>
        <input 
          class="input" 
          type="number" 
          placeholder="请输入手机号码"
          v-model="formData.phone"
          maxlength="11"
        />
      </view>
      
      <!-- 地区选择 -->
      <view class="form-group">
        <text class="label">所在地区</text>
        <view class="region-picker" @tap="selectRegion">
          <text class="region-text" v-if="regionText">{{ regionText }}</text>
          <text class="region-placeholder" v-else>请选择省市区</text>
          <view class="fa fa-chevron-right"></view>
        </view>
      </view>
      
      <!-- 详细地址 -->
      <view class="form-group">
        <text class="label">详细地址</text>
        <textarea 
          class="textarea" 
          placeholder="请输入详细地址（街道、门牌号等）"
          v-model="formData.detail"
          maxlength="200"
          :show-confirm-bar="false"
        />
      </view>
      
      <!-- 设为默认地址 -->
      <view class="form-group checkbox-group">
        <text class="label">设为默认地址</text>
        <switch 
          :checked="formData.is_default" 
          @change="onDefaultChange"
          color="#8e44ad"
        />
      </view>
    </view>
    
    <!-- 保存按钮 -->
    <view class="save-btn" @tap="saveAddress">
      <text v-if="!isSubmitting">{{ isEdit ? '更新地址' : '保存地址' }}</text>
      <view v-else class="loading-spinner"></view>
    </view>
    
    <!-- 地区选择器 -->
    <picker-view 
      v-if="showRegionPicker"
      class="region-picker-modal"
      :value="pickerValue"
      @change="onPickerChange"
    >
      <picker-view-column>
        <view v-for="(province, index) in provinces" :key="index">
          {{ province.name }}
        </view>
      </picker-view-column>
      <picker-view-column>
        <view v-for="(city, index) in cities" :key="index">
          {{ city.name }}
        </view>
      </picker-view-column>
      <picker-view-column>
        <view v-for="(district, index) in districts" :key="index">
          {{ district.name }}
        </view>
      </picker-view-column>
    </picker-view>
    
    <!-- 地区选择确认按钮 -->
    <view v-if="showRegionPicker" class="picker-actions">
      <view class="picker-btn cancel" @tap="cancelRegionSelect">取消</view>
      <view class="picker-btn confirm" @tap="confirmRegionSelect">确定</view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';

// 获取全局App实例
const app = getApp();

// 页面状态
const isEdit = ref(false);
const addressId = ref(null);
const isSubmitting = ref(false);
const showRegionPicker = ref(false);

// 表单数据
const formData = reactive({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  is_default: false
});

// 地区选择相关
const provinces = ref([]);
const cities = ref([]);
const districts = ref([]);
const pickerValue = ref([0, 0, 0]);

// 计算属性
const regionText = computed(() => {
  if (formData.province && formData.city && formData.district) {
    return `${formData.province} ${formData.city} ${formData.district}`;
  }
  return '';
});

// 页面加载时获取参数
onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options || {};
  
  if (options.id) {
    isEdit.value = true;
    addressId.value = parseInt(options.id);
    loadAddressData();
  }
  
  initRegionData();
});

// 加载地址数据（编辑模式）
const loadAddressData = async () => {
  try {
    const addresses = await app.globalData.api.user.getAddresses();
    const address = addresses.find(addr => addr.id === addressId.value);
    
    if (address) {
      Object.assign(formData, address);
    }
  } catch (error) {
    console.error('加载地址数据失败:', error);
    uni.showToast({
      title: '加载数据失败',
      icon: 'none'
    });
  }
};

// 初始化地区数据（简化版，实际项目中应该从API获取）
const initRegionData = () => {
  provinces.value = [
    { name: '北京市', code: '110000' },
    { name: '上海市', code: '310000' },
    { name: '广东省', code: '440000' },
    { name: '江苏省', code: '320000' },
    { name: '浙江省', code: '330000' }
  ];
  
  cities.value = [
    { name: '市辖区', code: '110100' }
  ];
  
  districts.value = [
    { name: '东城区', code: '110101' },
    { name: '西城区', code: '110102' },
    { name: '朝阳区', code: '110105' },
    { name: '丰台区', code: '110106' }
  ];
};

// 选择地区
const selectRegion = () => {
  showRegionPicker.value = true;
};

// 地区选择器变化
const onPickerChange = (e) => {
  pickerValue.value = e.detail.value;
  // 这里应该根据选择的省市更新对应的市区数据
};

// 确认地区选择
const confirmRegionSelect = () => {
  const [provinceIndex, cityIndex, districtIndex] = pickerValue.value;
  
  formData.province = provinces.value[provinceIndex]?.name || '';
  formData.city = cities.value[cityIndex]?.name || '';
  formData.district = districts.value[districtIndex]?.name || '';
  
  showRegionPicker.value = false;
};

// 取消地区选择
const cancelRegionSelect = () => {
  showRegionPicker.value = false;
};

// 默认地址开关变化
const onDefaultChange = (e) => {
  formData.is_default = e.detail.value;
};

// 表单验证
const validateForm = () => {
  if (!formData.name.trim()) {
    uni.showToast({
      title: '请输入收货人姓名',
      icon: 'none'
    });
    return false;
  }
  
  if (!formData.phone.trim()) {
    uni.showToast({
      title: '请输入手机号码',
      icon: 'none'
    });
    return false;
  }
  
  if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
    uni.showToast({
      title: '请输入正确的手机号码',
      icon: 'none'
    });
    return false;
  }
  
  if (!formData.province || !formData.city || !formData.district) {
    uni.showToast({
      title: '请选择所在地区',
      icon: 'none'
    });
    return false;
  }
  
  if (!formData.detail.trim()) {
    uni.showToast({
      title: '请输入详细地址',
      icon: 'none'
    });
    return false;
  }
  
  return true;
};

// 保存地址
const saveAddress = async () => {
  if (!validateForm() || isSubmitting.value) return;
  
  isSubmitting.value = true;
  
  try {
    if (isEdit.value) {
      // 更新地址
      await app.globalData.api.user.updateAddress(addressId.value, formData);
      uni.showToast({
        title: '更新成功',
        icon: 'success'
      });
    } else {
      // 新增地址
      await app.globalData.api.user.addAddress(formData);
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      });
    }
    
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
    
  } catch (error) {
    console.error('保存地址失败:', error);
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

.form-section {
  background-color: #fff;
  margin: 20rpx;
  border-radius: 12rpx;
  padding: 40rpx 30rpx;
}

.form-group {
  margin-bottom: 40rpx;
}

.form-group:last-child {
  margin-bottom: 0;
}

.label {
  display: block;
  font-size: 30rpx;
  color: #333;
  margin-bottom: 20rpx;
  font-weight: 600;
}

.input {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  background-color: #fafafa;
}

.input:focus {
  border-color: #8e44ad;
  background-color: #fff;
}

.textarea {
  width: 100%;
  min-height: 120rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  background-color: #fafafa;
  line-height: 1.5;
}

.textarea:focus {
  border-color: #8e44ad;
  background-color: #fff;
}

.region-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 0 20rpx;
  background-color: #fafafa;
}

.region-text {
  font-size: 28rpx;
  color: #333;
}

.region-placeholder {
  font-size: 28rpx;
  color: #999;
}

.region-picker .fa {
  color: #999;
  font-size: 24rpx;
}

.checkbox-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.checkbox-group .label {
  margin-bottom: 0;
}

/* 保存按钮 */
.save-btn {
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

/* 地区选择器 */
.region-picker-modal {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 500rpx;
  background-color: #fff;
  z-index: 1000;
}

.picker-actions {
  position: fixed;
  bottom: 500rpx;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  border-bottom: 1rpx solid #e0e0e0;
  z-index: 1001;
}

.picker-btn {
  padding: 15rpx 30rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.picker-btn.cancel {
  color: #666;
}

.picker-btn.confirm {
  background-color: #8e44ad;
  color: #fff;
}
</style> 