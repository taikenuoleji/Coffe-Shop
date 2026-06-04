// index.js - Coffee Shop Home Page
const app = getApp();

Page({
  data: {
    // 当前选中的分类索引
    activeCategory: 0,
    
    // 分类列表
    categories: [
      { id: 0, name: '全部咖啡' },
      { id: 1, name: '玛奇朵' },
      { id: 2, name: '拿铁' },
      { id: 3, name: '美式咖啡' },
      { id: 4, name: '摩卡' },
      { id: 5, name: '馥芮白' }
    ],
    
    // 商品列表（从数据库加载）
    products: [],
    
    // 加载状态
    loading: true,
    
    // 错误信息
    errorMsg: "",
    
    // 购物车数量
    cartCount: 0,
    
    // 收藏数量
    favoritesCount: 0
  },

  onLoad() {
    // 页面加载时获取商品列表
    console.log('Coffee Shop Home Page Loaded');
    this.loadGoodsList();
  },

  onShow() {
    // 每次显示页面时刷新购物车数量和总金额
    this.updateCartInfo();
  },

  onReady() {
    // 页面渲染完成后注册购物车更新回调
    app.registerCartUpdate && app.registerCartUpdate(() => {
      this.updateCartInfo();
    });
  },

  /**
   * 更新购物车信息（数量和总金额）
   */
  updateCartInfo() {
    const cartList = app.globalData.cartList || [];
    const cartCount = cartList.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    const totalPrice = cartList.reduce((sum, item) => {
      if (item.selected !== false) {
        return sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
      }
      return sum;
    }, 0);
    
    this.setData({ 
      cartCount: cartCount,
      cartTotalPrice: totalPrice.toFixed(2)
    });
  },

  /**
   * 从云数据库加载商品列表（直接查询数据库，稳定性更好）
   */
  loadGoodsList() {
    this.setData({ loading: true, errorMsg: '' });
    
    wx.showLoading({ title: '加载中...' });
    
    const db = wx.cloud.database();
    db.collection('goods')
      .where({ isAvailable: true })
      .orderBy('category', 'asc')
      .get()
      .then((res) => {
        wx.hideLoading();
        console.log('商品列表返回：', res);
        
        const products = (res.data || []).map(item => ({
          ...item,
          rating: item.rating || 4.8
        }));
        
        this.setData({
          loading: false,
          products: products
        });
      })
      .catch((err) => {
        wx.hideLoading();
        console.error('加载商品列表失败：', err);
        
        // 直接查询失败，尝试云函数作为备选方案
        this.loadGoodsListFallback();
      });
  },

  /**
   * 备选方案：通过云函数加载商品列表
   */
  loadGoodsListFallback() {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'initGoods',
      data: { action: 'getGoodsList' }
    }).then((res) => {
      wx.hideLoading();
      if (res.result.code === 0) {
        const products = (res.result.data || []).map(item => ({
          ...item,
          rating: item.rating || 4.8
        }));
        this.setData({ loading: false, products: products });
      } else {
        this.setData({ loading: false, products: [], errorMsg: '数据加载失败' });
      }
    }).catch((err) => {
      wx.hideLoading();
      console.error('备选方案也失败：', err);
      this.setData({ loading: false, products: [], errorMsg: '网络错误，请检查网络连接' });
      wx.showToast({ title: '加载失败，请下拉刷新', icon: 'none', duration: 2000 });
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadGoodsList();
    // 停止下拉刷新动画
    wx.stopPullDownRefresh();
  },

  // 分类切换
  onCategoryTap(e) {
    const index = e.currentTarget.dataset.index;
    const category = this.data.categories[index];
    
    this.setData({
      activeCategory: index
    });
    
    // 根据分类筛选商品
    this.filterByCategory(category.name);
  },

  /**
   * 根据分类筛选商品（直接查询数据库）
   * @param {string} categoryName - 分类名称
   */
  filterByCategory(categoryName) {
    wx.showLoading({ title: '加载中...' });
    
    const db = wx.cloud.database();
    const query = categoryName && categoryName !== '全部咖啡'
      ? db.collection('goods').where({ isAvailable: true, category: categoryName })
      : db.collection('goods').where({ isAvailable: true });
    
    query.orderBy('category', 'asc').get()
      .then((res) => {
        wx.hideLoading();
        const products = (res.data || []).map(item => ({
          ...item,
          rating: item.rating || 4.8
        }));
        this.setData({ products: products });
      })
      .catch((err) => {
        wx.hideLoading();
        console.error('筛选商品失败：', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      });
  },

  /**
   * 添加到购物车
   */
  onAddToCart(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p._id === productId);
    
    if (!product) {
      wx.showToast({
        title: '商品信息有误',
        icon: 'none'
      });
      return;
    }
    
    // 调用全局购物车方法
    const success = app.addToCart({
      _id: product._id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
      stock: product.stock
    });
    
    if (success) {
      // 更新页面购物车数量
      this.updateCartCount();
      
      wx.showToast({
        title: `${product.name} 已加入购物车`,
        icon: 'success',
        duration: 1500
      });
    }
  },

  // 商品点击 - 跳转到详情页
  onProductTap(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/goods-detail/goods-detail?id=${productId}`
    });
  },

  // 搜索点击
  onSearchTap() {
    wx.showToast({
      title: '搜索功能开发中',
      icon: 'none',
      duration: 1000
    });
  },

  // 筛选点击
  onFilterTap() {
    wx.showToast({
      title: '筛选功能开发中',
      icon: 'none',
      duration: 1000
    });
  },

  // 导航栏点击
  onNavTap(e) {
    const type = e.currentTarget.dataset.type;
    
    switch(type) {
      case 'home':
        // 已经在首页
        break;
      case 'favorites':
        wx.showToast({
          title: '收藏功能开发中',
          icon: 'none',
          duration: 1000
        });
        break;
      case 'cart':
        // 跳转到购物车页面
        wx.switchTab({
          url: '/pages/cart/cart'
        });
        break;
      case 'notification':
        wx.showToast({
          title: '通知功能开发中',
          icon: 'none',
          duration: 1000
        });
        break;
    }
  },

  // 位置选择
  onLocationTap() {
    wx.showToast({
      title: '位置选择开发中',
      icon: 'none',
      duration: 1000
    });
  }
});
