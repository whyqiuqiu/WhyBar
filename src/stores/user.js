import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref(null)
  const token = ref('')
  const isLoggedIn = ref(false)

  // 计算属性
  const userId = computed(() => userInfo.value?.id || null)
  const userName = computed(() => userInfo.value?.nickname || userInfo.value?.username || '用户')

  // 动作
  const setUserInfo = (info) => {
    userInfo.value = info
    isLoggedIn.value = !!info
    
    // 同步到本地存储
    if (info) {
      uni.setStorageSync('userInfo', JSON.stringify(info))
    } else {
      uni.removeStorageSync('userInfo')
    }
  }

  const setToken = (tokenValue) => {
    token.value = tokenValue
    
    // 同步到本地存储
    if (tokenValue) {
      uni.setStorageSync('token', tokenValue)
    } else {
      uni.removeStorageSync('token')
    }
  }

  const login = (userInfo, tokenValue) => {
    setUserInfo(userInfo)
    setToken(tokenValue)
    isLoggedIn.value = true
  }

  const logout = () => {
    setUserInfo(null)
    setToken('')
    isLoggedIn.value = false
  }

  // 从本地存储初始化用户状态
  const initUserFromStorage = () => {
    try {
      const storedUserInfo = uni.getStorageSync('userInfo')
      const storedToken = uni.getStorageSync('token')
      
      if (storedUserInfo) {
        const parsedUserInfo = typeof storedUserInfo === 'string' 
          ? JSON.parse(storedUserInfo) 
          : storedUserInfo
        setUserInfo(parsedUserInfo)
      }
      
      if (storedToken) {
        setToken(storedToken)
      }
      
      // 开发环境下，如果没有用户信息，使用默认测试用户
      if (!userInfo.value && process.env.NODE_ENV === 'development') {
        const testUser = {
          id: 1,
          username: 'user1',
          phone: '13800138001',
          nickname: '测试用户',
          avatar: ''
        }
        const testToken = 'mock-token-for-development'
        login(testUser, testToken)
      }
    } catch (error) {
      console.error('初始化用户状态失败:', error)
    }
  }

  return {
    // 状态
    userInfo,
    token,
    isLoggedIn,
    
    // 计算属性
    userId,
    userName,
    
    // 动作
    setUserInfo,
    setToken,
    login,
    logout,
    initUserFromStorage
  }
}) 