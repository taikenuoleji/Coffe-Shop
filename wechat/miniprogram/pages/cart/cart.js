// pages/cart/cart.js
const app = getApp();

Page({
  data: {
    // 购物车列表
    cartList: [],
    // 加载状态
    loading: true,
    // 是否全选
    isAllSelected: false,
    // 已选商品数量
    selectedCount: 0,
    // 合计金额
    totalPrice: '0.00'
  },

  onLoad() {
    // 设置购物车页面标识
    app.globalData.currentPage = 'cart';
  },

  onShow() {
    // 每次显示页面时刷新购物车数据
    this.loadCartData();
  },

  /**
   * 加载购物车数据
   */
  loadCartData() {
    this.setData({ loading: true });
    
    // 从全局购物车获取数据
    const cartList = app.globalData.cartList || [];
    
    // 确保每项都有 selected 属性（默认为 true）
    const list = cartList.map(item => ({
      ...item,
      selected: item.selected !== false,
      // 确保价格和数量是数字类型
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1
    }));

    // 计算合计
    const selectedItems = list.filter(item => item.selected);
    const totalPrice = selectedItems.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    this.setData({
      cartList: list,
      loading: false,
      selectedCount: selectedItems.length,
      totalPrice: totalPrice.toFixed(2),
      isAllSelected: list.length > 0 && selectedItems.length === list.length
    });

    // 更新 tabBar 购物车数量
    app.updateTabBarCartCount();
  },

  /**
   * 切换单个商品选中状态
   */
  onToggleSelect(e) {
    const index = e.currentTarget.dataset.index;
    // 深拷贝并确保数值类型正确
    const cartList = this.data.cartList.map(item => ({
      ...item,
      quantity: parseInt(item.quantity) || 0,
      price: parseFloat(item.price) || 0,
      selected: item.selected !== false
    }));
    cartList[index].selected = !cartList[index].selected;

    this.updateCartAndRecalculate(cartList);
  },

  /**
   * 切换全选状态
   */
  onToggleSelectAll() {
    const isAllSelected = !this.data.isAllSelected;
    const cartList = this.data.cartList.map(item => ({
      ...item,
      selected: isAllSelected,
      quantity: parseInt(item.quantity) || 0,
      price: parseFloat(item.price) || 0
    }));

    this.updateCartAndRecalculate(cartList);
  },

  /**
   * 增加商品数量
   */
  onIncrease(e) {
    const index = e.currentTarget.dataset.index;
    // 深拷贝并确保 quantity 为数字类型
    const cartList = this.data.cartList.map(item => ({
      ...item,
      quantity: parseInt(item.quantity) || 0,
      price: parseFloat(item.price) || 0
    }));
    
    const currentQty = cartList[index].quantity;

    // 检查库存
    const maxStock = cartList[index].stock || 999;
    if (currentQty >= maxStock) {
      wx.showToast({
        title: '库存不足',
        icon: 'none'
      });
      return;
    }

    cartList[index].quantity = currentQty + 1;
    this.updateCartAndRecalculate(cartList);
  },

  /**
   * 减少商品数量
   */
  onDecrease(e) {
    const index = e.currentTarget.dataset.index;
    // 深拷贝并确保 quantity 为数字类型
    const cartList = this.data.cartList.map(item => ({
      ...item,
      quantity: parseInt(item.quantity) || 0,
      price: parseFloat(item.price) || 0
    }));

    const currentQty = cartList[index].quantity;

    if (currentQty <= 1) {
      // 数量为1时，再次点击删除
      wx.showModal({
        title: '提示',
        content: `确定从购物车移除「${cartList[index].name}」？`,
        success: (res) => {
          if (res.confirm) {
            cartList.splice(index, 1);
            this.updateCartAndRecalculate(cartList);
          }
        }
      });
      return;
    }

    cartList[index].quantity = currentQty - 1;
    this.updateCartAndRecalculate(cartList);
  },

  /**
   * 删除单个商品
   */
  onDeleteItem(e) {
    const goodsId = e.currentTarget.dataset.id;
    const cartList = this.data.cartList;
    
    wx.showModal({
      title: '提示',
      content: '确定从购物车移除该商品？',
      success: (res) => {
        if (res.confirm) {
          const newList = cartList.filter(item => item._id !== goodsId);
          this.updateCartAndRecalculate(newList);
          
          wx.showToast({
            title: '已移除',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  },

  /**
   * 清空购物车
   */
  onClearCart() {
    if (this.data.cartList.length === 0) {
      return;
    }

    wx.showModal({
      title: '提示',
      content: '确定清空购物车？',
      success: (res) => {
        if (res.confirm) {
          this.updateCartAndRecalculate([]);
          
          wx.showToast({
            title: '已清空',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  },

  /**
   * 更新购物车数据并重新计算
   */
  updateCartAndRecalculate(cartList) {
    // 计算选中商品
    const selectedItems = cartList.filter(item => item.selected);
    
    // 计算合计金额（使用 toFixed(2) 处理精度问题）
    const totalPrice = selectedItems.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + price * quantity;
    }, 0);

    // 更新全局数据
    app.globalData.cartList = cartList;
    
    // 同步到本地存储
    this.saveCartToStorage(cartList);

    // 更新页面状态
    this.setData({
      cartList: cartList,
      selectedCount: selectedItems.length,
      totalPrice: totalPrice.toFixed(2),
      isAllSelected: cartList.length > 0 && selectedItems.length === cartList.length
    });

    // 更新 tabBar 购物车数量
    app.updateTabBarCartCount();

    // 通知所有页面购物车已更新（包括首页）
    app.notifyCartUpdate();
  },

  /**
   * 保存购物车到本地存储
   */
  saveCartToStorage(cartList) {
    try {
      wx.setStorageSync('cartList', cartList);
    } catch (e) {
      console.error('保存购物车失败:', e);
    }
  },

  /**
   * 去购物
   */
  goShopping() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  /**
   * 结算
   */
  onCheckout() {
    const { selectedCount, totalPrice } = this.data;

    if (selectedCount === 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      });
      return;
    }

    // 获取已选商品
    const selectedItems = this.data.cartList.filter(item => item.selected);
    
    // TODO: 跳转到结算页面
    wx.showModal({
      title: '结算确认',
      content: `共 ${selectedCount} 件商品，合计 ¥${totalPrice}`,
      confirmText: '确认支付',
      success: (res) => {
        if (res.confirm) {
          // 模拟支付成功，移除已购买的商品
          const remainingCart = this.data.cartList.filter(
            item => !item.selected
          );
          
          this.updateCartAndRecalculate(remainingCart);
          
          wx.showToast({
            title: '支付成功',
            icon: 'success'
          });
        }
      }
    });
  }
});
