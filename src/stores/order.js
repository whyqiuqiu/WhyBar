import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'

export const useOrderStore = defineStore('order', () => {
  // 状态 - 按用户ID存储订单数据
  const userOrders = ref({}) // { userId: { orders: [], loading: false, lastUpdate: timestamp } }

  // 计算属性
  const currentUserOrders = computed(() => {
    const userStore = useUserStore()
    const userId = userStore.userId
    if (!userId) return []
    
    return userOrders.value[userId]?.orders || []
  })

  const isLoading = computed(() => {
    const userStore = useUserStore()
    const userId = userStore.userId
    if (!userId) return false
    
    return userOrders.value[userId]?.loading || false
  })

  // 根据状态筛选订单
  const getOrdersByStatus = computed(() => (status) => {
    if (status === -1) return currentUserOrders.value // 全部订单
    return currentUserOrders.value.filter(order => order.status === status)
  })

  // 订单统计
  const orderStats = computed(() => {
    const orders = currentUserOrders.value
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 0).length,    // 待支付
      paid: orders.filter(o => o.status === 1).length,       // 待发货
      shipped: orders.filter(o => o.status === 2).length,    // 待收货
      completed: orders.filter(o => o.status === 3).length,  // 已完成
      cancelled: orders.filter(o => o.status === 4).length   // 已取消
    }
  })

  // 动作
  const initUserOrders = (userId) => {
    if (!userOrders.value[userId]) {
      userOrders.value[userId] = {
        orders: [],
        loading: false,
        lastUpdate: 0
      }
    }
  }

  const setLoading = (userId, loading) => {
    initUserOrders(userId)
    userOrders.value[userId].loading = loading
  }

  const setUserOrderList = (userId, orders) => {
    initUserOrders(userId)
    userOrders.value[userId].orders = orders || []
    userOrders.value[userId].lastUpdate = Date.now()
  }

  const addOrder = (userId, order) => {
    initUserOrders(userId)
    // 添加新订单
    userOrders.value[userId].orders.push(order)
    
    // 重新按时间排序，确保最新的订单在前面
    userOrders.value[userId].orders.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return timeB - timeA; // 降序排列，最新的在前
    });
    
    console.log('添加订单后重新排序，当前订单列表:', userOrders.value[userId].orders.map(o => ({
      id: o.id,
      created_at: o.created_at
    })));
  }

  const updateOrder = (userId, orderId, updatedOrder) => {
    initUserOrders(userId)
    const orders = userOrders.value[userId].orders
    const index = orders.findIndex(order => order.id === orderId)
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updatedOrder }
    }
  }

  const updateOrderStatus = (userId, orderId, status) => {
    initUserOrders(userId)
    const orders = userOrders.value[userId].orders
    const order = orders.find(order => order.id === orderId)
    if (order) {
      order.status = status
      order.updated_at = new Date().toISOString()
    }
  }

  // API请求方法
  const fetchUserOrders = async (userId, params = {}) => {
    if (!userId) return []
    
    setLoading(userId, true)
    
    try {
      const app = getApp()
      console.log('fetchUserOrders 调用API获取订单列表，参数:', params)
      const data = await app.globalData.api.orders.getList(params)
      
      if (data && data.list) {
        // 始终获取完整的订单数据，在前端进行状态过滤
        // 这样确保store中始终有完整的订单数据
        console.log('从API获取到订单数据，数量:', data.list.length)
        
        // 如果传了status参数，说明这是特定状态的请求，我们需要额外请求完整数据
        if (params.status !== undefined) {
          console.log('检测到状态过滤请求，重新获取完整订单数据以确保数据完整性')
          try {
            const allData = await app.globalData.api.orders.getList({})
            if (allData && allData.list) {
              console.log('获取到完整订单数据，数量:', allData.list.length)
              setUserOrderList(userId, allData.list)
              return allData.list
            }
          } catch (error) {
            console.log('获取完整数据失败，使用当前数据:', error)
          }
        }
        
        setUserOrderList(userId, data.list)
        return data.list
      } else {
        // 使用Mock数据作为后备，包含各种订单状态
        const mockOrders = [
          {
            id: 'ORD1700000001',
            order_no: 'ORD1700000001',
            user_id: userId,
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
            ],
            total_amount: 112,
            goods_amount: 112,
            delivery_fee: 0,
            status: 0, // 待支付
            payment_method: 'wechat',
            remark: '请尽快配送',
            created_at: '2024-01-17 10:30:00',
            address: {
              name: '张三',
              phone: '13800138001',
              province: '广东省',
              city: '深圳市',
              district: '南山区',
              detail: '科技园南区8栋101'
            }
          },
          {
            id: 'ORD1700000002',
            order_no: 'ORD1700000002',
            user_id: userId,
            items: [
              {
                id: 3,
                name: '玛格丽特',
                price: 38,
                image: '/static/images/margarita.png',
                quantity: 1
              }
            ],
            total_amount: 38,
            goods_amount: 38,
            delivery_fee: 0,
            status: 1, // 待发货
            payment_method: 'wechat',
            remark: '',
            created_at: '2024-01-16 19:20:00',
            address: {
              name: '张三',
              phone: '13800138001',
              province: '广东省',
              city: '深圳市',
              district: '南山区',
              detail: '科技园南区8栋101'
            }
          },
          {
            id: 'ORD1700000003',
            order_no: 'ORD1700000003',
            user_id: userId,
            items: [
              {
                id: 4,
                name: '朗姆可乐',
                price: 32,
                image: '/static/images/rum-cola.png',
                quantity: 2
              }
            ],
            total_amount: 64,
            goods_amount: 64,
            delivery_fee: 0,
            status: 2, // 待收货
            payment_method: 'alipay',
            remark: '',
            created_at: '2024-01-13 20:15:00',
            address: {
              name: '张三',
              phone: '13800138001',
              province: '广东省',
              city: '深圳市',
              district: '南山区',
              detail: '科技园南区8栋101'
            }
          },
          {
            id: 'ORD1700000004',
            order_no: 'ORD1700000004',
            user_id: userId,
            items: [
              {
                id: 5,
                name: '紫色梦境',
                price: 45,
                image: '/static/images/purple-dream.png',
                quantity: 1
              },
              {
                id: 6,
                name: '浆果气泡',
                price: 28,
                image: '/static/images/berry-fizz.png',
                quantity: 2
              }
            ],
            total_amount: 101,
            goods_amount: 101,
            delivery_fee: 0,
            status: 3, // 已完成
            payment_method: 'wechat',
            remark: '非常好喝，下次还会再买',
            created_at: '2024-01-12 16:45:00',
            address: {
              name: '张三',
              phone: '13800138001',
              province: '广东省',
              city: '深圳市',
              district: '南山区',
              detail: '科技园南区8栋101'
            }
          }
        ]
        
        // 按下单时间排序：最新的订单排在前面
        mockOrders.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeB - timeA; // 降序排列，最新的在前
        });
        
        console.log('Mock订单数据排序后:', mockOrders.map(o => ({
          id: o.id,
          created_at: o.created_at,
          status: o.status
        })));
        
        setUserOrderList(userId, mockOrders)
        return mockOrders
      }
    } catch (error) {
      console.error('获取用户订单失败:', error)
      return []
    } finally {
      setLoading(userId, false)
    }
  }

  const getOrderDetail = async (userId, orderId) => {
    if (!userId || !orderId) return null
    
    try {
      const app = getApp()
      const orderDetail = await app.globalData.api.orders.getDetail(orderId)
      return orderDetail
    } catch (error) {
      console.error('获取订单详情失败:', error)
      
      // 从本地订单列表中查找
      const orders = userOrders.value[userId]?.orders || []
      const localOrder = orders.find(order => order.id === orderId)
      
      if (localOrder) {
        return localOrder
      }
      
      // 返回Mock数据
      return {
        id: orderId,
        order_no: `ORD${orderId}`,
        user_id: userId,
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
          }
        ]
      }
    }
  }

  const createOrder = async (userId, orderData) => {
    if (!userId) throw new Error('用户未登录')
    
    try {
      const app = getApp()
      console.log('Pinia store - 准备调用API创建订单:', {
        address_id: orderData.address_id,
        remark: orderData.remark,
        payment_type: orderData.payment_type,
        items: orderData.items
      })
      
      const result = await app.globalData.api.orders.create(
        orderData.address_id,
        orderData.remark,
        orderData.payment_type,
        orderData.items  // 传递items参数
      )
      
      console.log('订单创建成功，返回结果:', result)
      
      // 将新订单添加到用户订单列表
      if (result) {
        addOrder(userId, result)
        console.log('已将新订单添加到Pinia store，当前用户订单数量:', currentUserOrders.value.length)
      }
      
      return result
    } catch (error) {
      console.error('创建订单失败:', error)
      throw error
    }
  }

  const payOrder = async (userId, orderId) => {
    if (!userId || !orderId) throw new Error('参数错误')
    
    try {
      const app = getApp()
      const payResult = await app.globalData.api.orders.pay(orderId)
      
      console.log('订单支付成功，支付结果:', payResult)
      
      // 更新本地订单状态（与Mock服务器保持一致：支付后直接变为已发货状态）
      updateOrderStatus(userId, orderId, 2) // 更新为已发货状态
      
      console.log('已更新订单状态为已发货，当前用户订单统计:', orderStats.value)
      
      return true
    } catch (error) {
      console.error('支付订单失败:', error)
      throw error
    }
  }

  const cancelOrder = async (userId, orderId) => {
    if (!userId || !orderId) throw new Error('参数错误')
    
    try {
      const app = getApp()
      await app.globalData.api.orders.cancel(orderId)
      
      // 更新本地订单状态
      updateOrderStatus(userId, orderId, 4) // 更新为已取消状态
      
      return true
    } catch (error) {
      console.error('取消订单失败:', error)
      throw error
    }
  }

  const confirmOrder = async (userId, orderId) => {
    if (!userId || !orderId) throw new Error('参数错误')
    
    try {
      const app = getApp()
      await app.globalData.api.orders.confirm(orderId)
      
      // 更新本地订单状态
      updateOrderStatus(userId, orderId, 3) // 更新为已完成状态
      
      return true
    } catch (error) {
      console.error('确认收货失败:', error)
      throw error
    }
  }

  return {
    // 状态
    userOrders,
    
    // 计算属性
    currentUserOrders,
    isLoading,
    getOrdersByStatus,
    orderStats,
    
    // 动作
    initUserOrders,
    setLoading,
    setUserOrderList,
    addOrder,
    updateOrder,
    updateOrderStatus,
    
    // API方法
    fetchUserOrders,
    getOrderDetail,
    createOrder,
    payOrder,
    cancelOrder,
    confirmOrder
  }
}) 