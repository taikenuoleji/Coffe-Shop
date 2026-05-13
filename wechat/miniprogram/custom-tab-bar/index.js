// custom-tab-bar/index.js
Component({
  data: {
    active: 0,
    cartCount: 0
  },

  attached() {
    // 获取购物车数量
    this.updateCartCount();
  },

  pageLifetimes: {
    show() {
      // 页面显示时更新购物车数量
      this.updateCartCount();
      // 更新当前 tab
      this.updateActive();
    },
    hide() {
      // 页面隐藏时不做处理
    }
  },

  methods: {
    /**
     * 更新购物车数量
     */
    updateCartCount() {
      const app = getApp();
      const count = app.getCartCount();
      this.setData({ cartCount: count });
      
      // 保存引用，以便其他页面调用
      app.updateTabBar = () => this.updateCartCount();
    },

    /**
     * 更新当前 tab 状态
     */
    updateActive() {
      const pages = getCurrentPages();
      if (pages.length === 0) return;
      
      const currentPage = pages[pages.length - 1];
      const route = currentPage.route;
      
      let active = 0;
      if (route.includes('cart')) {
        active = 1;
      }
      
      this.setData({ active });
    },

    /**
     * tab 点击处理
     */
    onTabTap(e) {
      const index = parseInt(e.currentTarget.dataset.index);
      
      // 始终允许切换到不同 tab
      if (index === 0) {
        wx.switchTab({
          url: '/pages/index/index',
          fail: (err) => {
            console.error('切换到首页失败:', err);
          }
        });
      } else if (index === 1) {
        wx.switchTab({
          url: '/pages/cart/cart',
          fail: (err) => {
            console.error('切换到购物车失败:', err);
          }
        });
      }
    }
  }
});
