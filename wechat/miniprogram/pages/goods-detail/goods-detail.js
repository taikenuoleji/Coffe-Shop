// pages/goods-detail/goods-detail.js
const app = getApp();

Page({
  data: {
    // 商品ID
    goodsId: "",
    // 商品详情数据
    goods: {},
    // 加载状态
    loading: true,
    // 错误信息
    errorMsg: "",
    // 购物车中该商品的数量
    cartQuantity: 0
  },

  onLoad(options) {
    // 获取页面参数中的商品ID
    const { id } = options || {};
    
    if (id) {
      this.setData({ goodsId: id });
      this.loadGoodsDetail(id);
    } else {
      this.setData({
        loading: false,
        errorMsg: "商品ID不存在",
      });
    }
  },

  onShow() {
    // 每次显示页面时更新购物车数量
    this.updateCartQuantity();
  },

  /**
   * 更新该商品在购物车中的数量
   */
  updateCartQuantity() {
    const { goodsId } = this.data;
    if (goodsId) {
      const quantity = app.getGoodsQuantityInCart(goodsId);
      this.setData({ cartQuantity: quantity });
    }
  },

  /**
   * 加载商品详情
   * @param {string} goodsId - 商品ID
   */
  loadGoodsDetail(goodsId) {
    this.setData({ loading: true, errorMsg: "" });

    wx.showLoading({ title: "加载中..." });

    const db = wx.cloud.database();
    db.collection("goods").doc(goodsId).get()
      .then((res) => {
        wx.hideLoading();
        console.log("商品详情返回：", res);

        const goods = res.data || {};
        this.setData({
          loading: false,
          goods: goods,
          cartQuantity: app.getGoodsQuantityInCart(goods._id)
        });
      })
      .catch((err) => {
        wx.hideLoading();
        console.error("加载商品详情失败（直查），尝试云函数：", err);
        
        // 直查失败时尝试云函数
        wx.cloud.callFunction({
          name: "initGoods",
          data: { action: "getGoodsDetail", data: { goodsId: goodsId } }
        }).then((res) => {
          if (res.result.code === 0) {
            const goods = res.result.data || {};
            this.setData({
              loading: false,
              goods: goods,
              cartQuantity: app.getGoodsQuantityInCart(goods._id)
            });
          } else {
            this.setData({ loading: false, errorMsg: "获取商品详情失败" });
          }
        }).catch((cfErr) => {
          console.error("云函数也失败：", cfErr);
          this.setData({ loading: false, errorMsg: "网络错误，请检查网络连接" });
        });
      });
  },

  /**
   * 重新加载
   */
  onRetry() {
    const { goodsId } = this.data;
    if (goodsId) {
      this.loadGoodsDetail(goodsId);
    }
  },

  /**
   * 返回上一页
   */
  onBack() {
    wx.navigateBack({
      fail: () => {
        // 如果没有上一页，跳转到首页
        wx.switchTab({ url: "/pages/index/index" });
      },
    });
  },

  /**
   * 收藏商品
   */
  onFavorite() {
    const { goods } = this.data;
    wx.showToast({
      title: `已收藏 ${goods.name}`,
      icon: "success",
      duration: 1500,
    });
  },

  /**
   * 加入购物车
   */
  onAddToCart() {
    const { goods } = this.data;
    
    if (!goods || !goods._id) {
      wx.showToast({
        title: '商品信息有误',
        icon: 'none'
      });
      return;
    }

    // 调用全局购物车方法
    const success = app.addToCart({
      _id: goods._id,
      name: goods.name,
      price: goods.price,
      originalPrice: goods.originalPrice,
      image: goods.image,
      category: goods.category,
      stock: goods.stock
    });

    if (success) {
      // 更新页面显示的购物车数量
      const newQuantity = app.getGoodsQuantityInCart(goods._id);
      this.setData({ cartQuantity: newQuantity });
      
      wx.showToast({
        title: `${goods.name} 已加入购物车`,
        icon: "success",
        duration: 1500,
      });
    }
  },

  /**
   * 去购物车结算
   */
  onGoToCart() {
    wx.switchTab({
      url: '/pages/cart/cart'
    });
  }
});
