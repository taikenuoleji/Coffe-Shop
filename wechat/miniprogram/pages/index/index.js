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
    
    // 商品列表（当前展示）
    products: [],
    // 全部商品（缓存，用于搜索/筛选）
    allProducts: [],
    
    // 加载状态
    loading: true,
    
    // 错误信息
    errorMsg: "",
    
    // 搜索相关
    searchKeyword: '',
    isSearching: false,
    searchEmpty: false,
    
    // 购物车数量
    cartCount: 0,
    
    // 收藏数量
    favoritesCount: 0
  },

  // 防抖定时器
  _searchTimer: null,

  onLoad() {
    console.log('Coffee Shop Home Page Loaded');
    this.loadGoodsList();
  },

  onShow() {
    this.updateCartInfo();
  },

  onReady() {
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
        const products = (res.data || []).map(item => ({
          ...item,
          rating: item.rating || 4.8,
          _searchText: this.buildSearchText(item)
        }));
        
        this.setData({
          loading: false,
          products: products,
          allProducts: products
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
          rating: item.rating || 4.8,
          _searchText: this.buildSearchText(item)
        }));
        this.setData({ loading: false, products: products, allProducts: products });
      } else {
        this.setData({ loading: false, products: [], errorMsg: '数据加载失败' });
      }
    }).catch((err) => {
      wx.hideLoading();
      console.error('备选也失败：', err);
      this.setData({ loading: false, products: [], errorMsg: '网络错误，请检查网络连接' });
      wx.showToast({ title: '加载失败，请下拉刷新', icon: 'none', duration: 2000 });
    });
  },

  /**
   * 构建搜索文本（拼接 name + description + tags）
   */
  buildSearchText(item) {
    const tags = (item.tags || []).join(' ');
    return [item.name, item.description, item.category, tags].filter(Boolean).join(' ').toLowerCase();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadGoodsList();
    wx.stopPullDownRefresh();
  },

  // ────────── 搜索功能 ──────────

  /**
   * 搜索输入（带防抖 300ms）
   */
  onSearchInput(e) {
    const keyword = e.detail.value || '';
    this.setData({ searchKeyword: keyword });

    // 清除之前的定时器
    if (this._searchTimer) clearTimeout(this._searchTimer);

    if (!keyword.trim()) {
      // 空关键字：退出搜索模式，恢复分类筛选
      this.exitSearchMode();
      return;
    }

    // 防抖
    this._searchTimer = setTimeout(() => {
      this.performSearch(keyword.trim());
    }, 300);
  },

  /**
   * 搜索确认（点击键盘搜索按钮）
   */
  onSearchConfirm(e) {
    const keyword = e.detail.value || this.data.searchKeyword;
    if (keyword.trim()) {
      this.performSearch(keyword.trim());
    }
  },

  /**
   * 执行搜索
   */
  performSearch(keyword) {
    const lower = keyword.toLowerCase();
    const { allProducts } = this.data;
    
    const filtered = allProducts.filter(item => {
      const searchText = item._searchText || this.buildSearchText(item);
      return searchText.includes(lower);
    });

    const empty = filtered.length === 0;

    this.setData({
      isSearching: true,
      searchEmpty: empty,
      searchKeyword: keyword,
      activeCategory: 0,
      products: filtered,
      loading: false,
      errorMsg: ''
    });
  },

  /**
   * 清空搜索
   */
  onSearchClear() {
    this.setData({ searchKeyword: '' });
    this.exitSearchMode();
  },

  /**
   * 取消搜索
   */
  onSearchCancel() {
    this.setData({ searchKeyword: '' });
    this.exitSearchMode();
  },

  /**
   * 退出搜索模式
   */
  exitSearchMode() {
    this.setData({
      isSearching: false,
      searchEmpty: false,
      searchKeyword: ''
    });
    // 恢复当前分类下的商品
    this.restoreCategoryFilter();
  },

  /**
   * 恢复当前分类筛选
   */
  restoreCategoryFilter() {
    const { activeCategory, categories, allProducts } = this.data;
    if (activeCategory > 0 && categories[activeCategory]) {
      this.filterByCategory(categories[activeCategory].name);
    } else {
      this.setData({ products: allProducts });
    }
  },

  // ────────── 分类筛选 ──────────

  onCategoryTap(e) {
    const index = e.currentTarget.dataset.index;
    const category = this.data.categories[index];
    
    // 如果正在搜索，退出搜索模式
    if (this.data.isSearching) {
      this.exitSearchMode();
    }
    
    this.setData({ activeCategory: index });
    this.filterByCategory(category.name);
  },

  /**
   * 根据分类筛选商品（直接查询数据库）
   * @param {string} categoryName - 分类名称
   */
  filterByCategory(categoryName) {
    const { allProducts } = this.data;
    const filtered = categoryName && categoryName !== '全部咖啡'
      ? allProducts.filter(item => item.category === categoryName)
      : allProducts;
    
    this.setData({
      products: filtered,
      loading: false
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

  // 筛选按钮点击
  onFilterTap() {
    const { activeCategory, categories } = this.data;
    const nextIndex = (activeCategory + 1) % categories.length;
    const category = categories[nextIndex];
    this.setData({ activeCategory: nextIndex });
    this.filterByCategory(category.name);
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
