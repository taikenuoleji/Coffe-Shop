// app.js
App({
  globalData: {
    // 云开发环境ID
    env: "cloudbase-d3gn3lk6650bdc2ce",
    
    // 购物车列表
    cartList: [],
    
    // 当前页面标识
    currentPage: '',
    
    // tabBar 配置
    tabBarConfig: {
      cartCount: 0  // 购物车商品总数量
    },

    // 购物车更新回调函数列表
    cartUpdateCallbacks: []
  },

  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }

    // 加载本地购物车数据
    this.loadCartFromStorage();
  },

  /**
   * 从本地存储加载购物车数据
   */
  loadCartFromStorage() {
    try {
      const cartList = wx.getStorageSync('cartList') || [];
      this.globalData.cartList = cartList;
      this.updateTabBarCartCount();
    } catch (e) {
      console.error('加载购物车数据失败:', e);
      this.globalData.cartList = [];
    }
  },

  /**
   * 添加商品到购物车
   * @param {Object} goods - 商品信息
   * @returns {boolean} 是否添加成功
   */
  addToCart(goods) {
    if (!goods || !goods._id) {
      console.error('添加购物车失败：商品信息不完整');
      return false;
    }

    const cartList = this.globalData.cartList;
    
    // 检查商品是否已存在
    const existIndex = cartList.findIndex(item => item._id === goods._id);
    
    if (existIndex !== -1) {
      // 商品已存在，数量+1（确保转换为数字再相加）
      cartList[existIndex].quantity = (parseInt(cartList[existIndex].quantity) || 0) + 1;
      cartList[existIndex].selected = true;
    } else {
      // 商品不存在，添加到购物车
      cartList.push({
        _id: goods._id,
        name: goods.name,
        price: parseFloat(goods.price) || 0,
        originalPrice: parseFloat(goods.originalPrice) || 0,
        image: goods.image,
        category: goods.category || '',
        quantity: 1,
        stock: goods.stock || 999,
        selected: true,  // 新增商品默认选中
        addTime: Date.now()  // 添加时间戳
      });
    }

    // 更新全局数据
    this.globalData.cartList = cartList;
    
    // 保存到本地存储
    this.saveCartToStorage();
    
    // 更新 tabBar 购物车数量
    this.updateTabBarCartCount();

    // 通知所有页面购物车已更新
    this.notifyCartUpdate();

    return true;
  },

  /**
   * 从购物车移除商品
   * @param {string} goodsId - 商品ID
   */
  removeFromCart(goodsId) {
    const cartList = this.globalData.cartList;
    const newList = cartList.filter(item => item._id !== goodsId);
    
    this.globalData.cartList = newList;
    this.saveCartToStorage();
    this.updateTabBarCartCount();

    // 通知所有页面购物车已更新
    this.notifyCartUpdate();
  },

  /**
   * 更新购物车商品数量
   * @param {string} goodsId - 商品ID
   * @param {number} quantity - 新数量
   */
  updateCartQuantity(goodsId, quantity) {
    const cartList = this.globalData.cartList;
    const index = cartList.findIndex(item => item._id === goodsId);
    
    if (index !== -1) {
      if (quantity <= 0) {
        // 数量为0或负数时移除商品
        cartList.splice(index, 1);
      } else {
        cartList[index].quantity = quantity;
      }
      
      this.globalData.cartList = cartList;
      this.saveCartToStorage();
      this.updateTabBarCartCount();

      // 通知所有页面购物车已更新
      this.notifyCartUpdate();
    }
  },

  /**
   * 清空购物车
   */
  clearCart() {
    this.globalData.cartList = [];
    this.saveCartToStorage();
    this.updateTabBarCartCount();

    // 通知所有页面购物车已更新
    this.notifyCartUpdate();
  },

  /**
   * 获取购物车商品总数量
   * @returns {number}
   */
  getCartCount() {
    return this.globalData.cartList.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
  },

  /**
   * 获取购物车商品总数量（用于tabBar显示）
   * @returns {number}
   */
  getTabBarCartCount() {
    return this.globalData.tabBarConfig.cartCount;
  },

  /**
   * 更新 tabBar 购物车数量角标
   */
  updateTabBarCartCount() {
    const count = this.getCartCount();
    this.globalData.tabBarConfig.cartCount = count;
    
    // 更新 tabBar
    if (this.updateTabBar) {
      this.updateTabBar();
    }
  },

  /**
   * 保存购物车到本地存储
   */
  saveCartToStorage() {
    try {
      wx.setStorageSync('cartList', this.globalData.cartList);
    } catch (e) {
      console.error('保存购物车失败:', e);
    }
  },

  /**
   * 检查商品是否在购物车中
   * @param {string} goodsId - 商品ID
   * @returns {boolean}
   */
  isInCart(goodsId) {
    return this.globalData.cartList.some(item => item._id === goodsId);
  },

  /**
   * 获取购物车中商品的数量
   * @param {string} goodsId - 商品ID
   * @returns {number}
   */
  getGoodsQuantityInCart(goodsId) {
    const item = this.globalData.cartList.find(item => item._id === goodsId);
    return item ? item.quantity : 0;
  },

  /**
   * 获取购物车选中商品的总金额
   * @returns {number}
   */
  getCartTotalPrice() {
    return this.globalData.cartList.reduce((sum, item) => {
      if (item.selected !== false) {
        return sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
      }
      return sum;
    }, 0);
  },

  /**
   * 注册购物车更新回调函数
   * @param {Function} callback - 回调函数
   */
  registerCartUpdate(callback) {
    if (typeof callback === 'function') {
      const callbacks = this.globalData.cartUpdateCallbacks || [];
      if (!callbacks.includes(callback)) {
        callbacks.push(callback);
        this.globalData.cartUpdateCallbacks = callbacks;
      }
    }
  },

  /**
   * 通知所有页面购物车已更新
   */
  notifyCartUpdate() {
    const callbacks = this.globalData.cartUpdateCallbacks || [];
    callbacks.forEach(callback => {
      if (typeof callback === 'function') {
        try {
          callback();
        } catch (e) {
          console.error('购物车更新回调执行失败:', e);
        }
      }
    });
  }
});
