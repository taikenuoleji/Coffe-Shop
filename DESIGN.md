# Coffee Shop 微信小程序项目设计文档

> 文档版本：v1.0  
> 更新日期：2026-05-14  
> 项目类型：微信小程序 · 咖啡商城电商应用

---

## 一、项目概述与背景

### 1.1 项目简介

Coffee Shop 是一款基于微信小程序平台开发的咖啡商城应用，为用户提供咖啡商品的浏览、分类筛选、购物车管理及模拟结算等核心电商功能。项目采用微信云开发（CloudBase）作为后端服务，实现商品数据的动态加载与购物车状态的全局管理。

### 1.2 技术选型

| 技术栈 | 用途说明 |
|--------|---------|
| **微信小程序框架** | 核心开发框架（.wxml + .wxss + .js） |
| **微信云开发 CloudBase** | 云函数、云数据库、文件存储服务 |
| **自定义 tabBar** | 实现统一的底部导航组件 |
| **本地存储 (wx.setStorageSync)** | 购物车数据持久化 |

### 1.3 项目功能矩阵

| 功能模块 | 功能点 | 实现状态 |
|----------|--------|----------|
| **商品展示** | 商品列表加载、分类筛选 | ✅ 已完成 |
| | 商品详情查看 | ✅ 已完成 |
| | 商品评分展示 | ✅ 已完成 |
| **购物车** | 加入购物车 | ✅ 已完成 |
| | 增减商品数量 | ✅ 已完成 |
| | 删除单个商品 | ✅ 已完成 |
| | 清空购物车 | ✅ 已完成 |
| | 全选/取消全选 | ✅ 已完成 |
| | 选中状态切换 | ✅ 已完成 |
| | 合计金额计算 | ✅ 已完成 |
| **结算** | 结算确认弹窗 | ✅ 已完成 |
| | 模拟支付成功 | ✅ 已完成 |
| **自定义导航** | 首页底部导航 | ✅ 已完成 |
| | 购物车页底部导航 | ✅ 已完成 |
| | 购物车数量角标 | ✅ 已完成 |

---

## 二、系统架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户端                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  首页 (index) │  │购物车(cart) │  │商品详情(goods-detail)│ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│         └────────────────┴──────────────────────┘            │
│                              │                               │
│                    ┌─────────▼─────────┐                     │
│                    │   App (globalData) │  ← 全局状态管理中心 │
│                    │  • cartList        │                     │
│                    │  • cartUpdateCallbacks│                  │
│                    └─────────┬─────────┘                     │
└──────────────────────────────┼──────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  本地存储        │  │  云函数          │  │  云数据库        │
│ (wx.setStorage) │  │ (initGoods)      │  │ (goods collection)│
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2.2 自定义 tabBar 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    custom-tab-bar 组件                       │
├─────────────────────────────────────────────────────────────┤
│  Component({                                                │
│    data: {                                                  │
│      active: 0,          // 当前激活的 tab                   │
│      cartCount: 0        // 购物车商品总数                   │
│    },                                                        │
│    pageLifetimes: {                                         │
│      show() { this.updateActive(); this.updateCartCount(); }│
│    },                                                        │
│    methods: {                                                │
│      onTabTap(e) → wx.switchTab()                           │
│    }                                                         │
│  })                                                          │
└─────────────────────────────────────────────────────────────┘
         │
         │  app.globalData.tabBarConfig
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    app.js 全局状态                           │
│  • cartList: []            购物车商品列表                    │
│  • tabBarConfig: { cartCount: 0 }                            │
│  • cartUpdateCallbacks: []  跨页面更新回调队列                │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 状态管理流程

```
购物车变更操作
     │
     ▼
┌──────────────────────┐
│ 调用 app.js 方法     │
│ addToCart()          │
│ removeFromCart()     │
│ updateCartQuantity() │
│ clearCart()           │
└──────────┬───────────┘
           │
           ▼
    ┌──────────────┐
    │ 1. 更新      │
    │    globalData│
    │    .cartList │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐     ┌──────────────────────┐
    │ 2. 保存到    │     │ 3. 通知所有页面      │
    │    本地存储  │     │    notifyCartUpdate │
    └──────┬───────┘     └──────────┬───────────┘
           │                        │
           ▼                        ▼
    ┌──────────────┐     ┌──────────────────────┐
    │ 更新 tabBar  │     │ 触发回调函数队列      │
    │ 角标数量     │     │ • 首页 updateCartInfo│
    └──────────────┘     │ • 自定义 tabBar 更新  │
                         └──────────────────────┘
```

---

## 三、核心模块划分与职责说明

### 3.1 应用入口模块 (app.js)

**文件路径**：`miniprogram/app.js`

**职责**：
- 微信云开发初始化
- 全局购物车状态管理
- 跨页面数据同步机制

**核心 API**：

| 方法名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|----------|
| `addToCart(goods)` | Object | boolean | 添加商品到购物车 |
| `removeFromCart(goodsId)` | string | void | 从购物车移除商品 |
| `updateCartQuantity(goodsId, quantity)` | string, number | void | 更新商品数量 |
| `clearCart()` | - | void | 清空购物车 |
| `getCartCount()` | - | number | 获取购物车商品总数 |
| `getCartTotalPrice()` | - | number | 获取选中商品总金额 |
| `registerCartUpdate(callback)` | Function | void | 注册购物车更新回调 |
| `notifyCartUpdate()` | - | void | 触发所有已注册的回调 |

### 3.2 首页模块 (pages/index)

**文件路径**：`miniprogram/pages/index/`

**页面生命周期**：

| 生命周期 | 处理逻辑 |
|----------|----------|
| `onLoad()` | 调用 `loadGoodsList()` 加载商品列表 |
| `onShow()` | 调用 `updateCartInfo()` 刷新购物车信息 |
| `onReady()` | 调用 `app.registerCartUpdate()` 注册回调 |
| `onPullDownRefresh()` | 重新加载商品列表 |

**核心交互**：

| 事件 | 绑定方法 | 功能 |
|------|----------|------|
| 分类切换 | `onCategoryTap` | 筛选指定分类商品 |
| 商品点击 | `onProductTap` | 跳转商品详情页 |
| 加入购物车 | `onAddToCart` | 调用 `app.addToCart()` |
| 底部导航 | `onNavTap` | 跳转 tabBar 页面 |

### 3.3 购物车模块 (pages/cart)

**文件路径**：`miniprogram/pages/cart/`

**页面生命周期**：

| 生命周期 | 处理逻辑 |
|----------|----------|
| `onLoad()` | 设置 `app.globalData.currentPage = 'cart'` |
| `onShow()` | 调用 `loadCartData()` 刷新购物车 |

**核心交互**：

| 事件 | 绑定方法 | 功能描述 |
|------|----------|----------|
| 切换选中 | `onToggleSelect` | 切换单个商品选中状态 |
| 全选切换 | `onToggleSelectAll` | 全选/取消全选 |
| 增加数量 | `onIncrease` | 商品数量 +1 |
| 减少数量 | `onDecrease` | 商品数量 -1（到0时删除） |
| 删除商品 | `onDeleteItem` | 确认后移除单个商品 |
| 清空购物车 | `onClearCart` | 确认后清空所有商品 |
| 结算 | `onCheckout` | 弹出结算确认框 |

**核心计算逻辑** (`updateCartAndRecalculate`)：

```javascript
// 计算选中商品的总金额
const totalPrice = selectedItems.reduce((sum, item) => {
  const price = parseFloat(item.price) || 0;
  const quantity = parseInt(item.quantity) || 0;
  return sum + price * quantity;  // 总金额 = 单价 × 数量
}, 0);
```

### 3.4 商品详情模块 (pages/goods-detail)

**文件路径**：`miniprogram/pages/goods-detail/`

**职责**：展示单个商品的完整信息，支持加入购物车操作。

### 3.5 自定义 TabBar 组件 (custom-tab-bar)

**文件路径**：`miniprogram/custom-tab-bar/`

**组件生命周期**：

| 生命周期 | 处理逻辑 |
|----------|----------|
| `attached()` | 初始化购物车数量 |
| `pageLifetimes.show()` | 更新当前 tab 状态和购物车数量 |

**数据流向**：

```
用户切换 tab → onTabTap(e)
                    │
                    ▼
            parseInt(e.currentTarget.dataset.index)
                    │
         ┌──────────┴──────────┐
         │                     │
    index === 0           index === 1
         │                     │
         ▼                     ▼
   wx.switchTab({          wx.switchTab({
     url: '/pages/index'      url: '/pages/cart'
   })                       })
```

---

## 四、数据模型与存储结构

### 4.1 云数据库模型 (goods collection)

**集合名称**：`goods`

| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `_id` | string | 是 | 商品唯一标识（云数据库自动生成） |
| `name` | string | 是 | 商品名称 |
| `price` | number | 是 | 商品单价 |
| `originalPrice` | number | 否 | 商品原价 |
| `category` | string | 是 | 商品分类（玛奇朵/拿铁/美式咖啡/摩卡/馥芮白） |
| `image` | string | 是 | 商品图片 URL |
| `description` | string | 否 | 商品描述 |
| `rating` | number | 否 | 商品评分（默认 4.8） |
| `stock` | number | 否 | 库存数量（默认 999） |

### 4.2 购物车数据模型

**存储位置**：本地 Storage（`wx.setStorageSync('cartList', cartList)`）

**数据结构**：

```javascript
// cartList: Array<CartItem>

CartItem = {
  _id: string,           // 商品ID（对应 goods._id）
  name: string,          // 商品名称
  price: number,         // 商品单价
  originalPrice: number, // 原价
  image: string,         // 商品图片
  category: string,      // 分类
  quantity: number,      // 购买数量
  stock: number,         // 库存
  selected: boolean,     // 是否选中（默认 true）
  addTime: number        // 添加时间戳
}
```

**数据类型规范**：

| 字段 | 类型 | 转换方式 |
|------|------|----------|
| `price` | number | `parseFloat(value) \|\| 0` |
| `quantity` | number | `parseInt(value) \|\| 0` |
| `selected` | boolean | `value !== false` |

> ⚠️ **重要**：从 Storage 读取的数据需要显式转换类型，避免 JavaScript 隐式类型转换导致的计算错误（如 `"1" + 1 = "11"`）。

### 4.3 云函数数据模型

**云函数名称**：`initGoods`

**支持的 action 参数**：

| action | 参数 | 返回数据 |
|--------|------|----------|
| `getGoodsList` | `{ category?: string }` | 商品列表数组 |
| `getGoodsDetail` | `{ goodsId: string }` | 单个商品详情对象 |

**响应格式**：

```javascript
// 成功响应
{
  code: 0,
  data: [...] | {...},
  message: 'success'
}

// 失败响应
{
  code: 非0数字,
  data: null,
  message: '错误描述'
}
```

---

## 五、关键接口与交互流程

### 5.1 商品列表加载流程

```
用户进入首页 (onLoad)
        │
        ▼
┌───────────────────────┐
│ wx.showLoading()      │
│ 调用云函数 initGoods   │
│ action: 'getGoodsList' │
└───────────┬───────────┘
            │
       ┌────┴────┐
       │ 响应解析 │
       └────┬────┘
            │
    ┌───────┴───────┐
    │ code === 0 ?  │
    └───┬───────┬───┘
        │是      │否
        ▼        ▼
┌─────────────┐ ┌─────────────────┐
│ 设置 products│ │ 设置 errorMsg   │
│ 渲染商品列表 │ │ 显示错误提示    │
└─────────────┘ └─────────────────┘
```

### 5.2 加入购物车流程

```
用户点击 "+" 按钮
        │
        ▼
┌───────────────────────┐
│ 获取商品信息           │
│ app.addToCart(goods)  │
└───────────┬───────────┘
            │
    ┌───────┴───────┐
    │ 商品已存在?    │
    └───┬───────┬───┘
        │是      │否
        ▼        ▼
┌─────────────┐ ┌─────────────┐
│ quantity+1  │ │ push 新商品 │
│ selected=true│ │ quantity=1 │
└──────┬──────┘ └──────┬──────┘
       │                │
       └────────┬───────┘
                ▼
        ┌───────────────┐
        │ 更新全局状态   │
        │ 保存本地存储   │
        │ 触发更新通知   │
        └───────┬───────┘
                │
    ┌───────────┴───────────┐
    │ 通知回调队列执行      │
    │ • 首页角标 +1         │
    │ • tabBar 角标更新     │
    └───────────────────────┘
```

### 5.3 购物车数量增减流程

```
用户点击 "+"/"-" 按钮
        │
        ▼
┌───────────────────────┐
│ 获取 index            │
│ 深拷贝 cartList       │
│ 转换 quantity 为数字   │
└───────────┬───────────┘
            │
       ┌────┴────┐
       │ 判断操作 │
       └────┬────┘
     ┌──────┼──────┐
     ▼      ▼      ▼
  +按钮  -按钮  数量=1
     │      │     -
     │      │     │
     ▼      ▼     ▼
┌─────────────┐ ┌─────────────┐
│ quantity+1  │ │ quantity-1  │
│ (≤stock?)  │ │ (≥1?)       │→弹出删除确认
└──────┬──────┘ └──────┬──────┘
       │                │
       └───────┬────────┘
               ▼
       ┌───────────────┐
       │ updateCartAnd │
       │ Recalculate() │
       └───────┬───────┘
               │
               ▼
       ┌───────────────────────┐
       │ • 计算新的 totalPrice │
       │ • 更新 app.globalData │
       │ • 保存本地存储        │
       │ • setData 刷新UI      │
       │ • notifyCartUpdate   │
       └───────────────────────┘
```

### 5.4 跨页面状态同步机制

```
app.js 中的回调队列：
cartUpdateCallbacks: [
  首页页面的 updateCartInfo 函数,
  其他页面的更新函数...
]

触发时机：
1. addToCart() 成功后
2. removeFromCart() 成功后
3. updateCartQuantity() 成功后
4. clearCart() 成功后
5. 购物车页面操作后 (updateCartAndRecalculate)

通知流程：
app.notifyCartUpdate()
        │
        ▼
┌───────────────────────┐
│ 遍历 callbacks 数组   │
│ 依次执行回调函数       │
│ 捕获异常防止中断       │
└───────────────────────┘
```

---

## 六、部署与配置说明

### 6.1 项目目录结构

```
Coffee-Shop/
├── wechat/
│   └── miniprogram/
│       ├── app.js              # 应用入口，全局状态管理
│       ├── app.json            # 应用配置（页面路由、tabBar）
│       ├── app.wxss            # 全局样式
│       ├── custom-tab-bar/     # 自定义 tabBar 组件
│       │   ├── index.js
│       │   ├── index.wxml
│       │   ├── index.wxss
│       │   └── index.json
│       ├── images/             # 静态资源
│       │   └── assets/         # SVG 图标资源
│       ├── pages/
│       │   ├── index/          # 首页
│       │   ├── cart/           # 购物车页
│       │   ├── goods-detail/   # 商品详情页
│       │   └── example/        # 示例页
│       ├── components/         # 通用组件
│       ├── envList.js          # 云开发环境列表
│       └── sitemap.json        # SEO 配置
├── cloud/                      # 云函数目录（需单独部署）
│   └── initGoods/              # 商品操作云函数
│       ├── index.js
│       └── package.json
└── README.md                   # 项目说明文档
```

### 6.2 云开发配置

**环境 ID**：`cloudbase-d3gn3lk6650bdc2ce`

**初始化代码**（app.js）：
```javascript
wx.cloud.init({
  env: 'cloudbase-d3gn3lk6650bdc2ce',
  traceUser: true
});
```

**云函数调用示例**：
```javascript
wx.cloud.callFunction({
  name: 'initGoods',
  data: {
    action: 'getGoodsList',
    data: { category: '拿铁' }
  }
}).then(res => {
  console.log(res.result);
});
```

### 6.3 tabBar 配置 (app.json)

```json
{
  "tabBar": {
    "custom": true,           // 启用自定义 tabBar
    "color": "#999999",       // 默认文字颜色
    "selectedColor": "#C67C4E", // 选中文字颜色（咖啡棕）
    "backgroundColor": "#FFFFFF",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页"
      },
      {
        "pagePath": "pages/cart/cart",
        "text": "购物车"
      }
    ]
  }
}
```

### 6.4 样式主题配置

| 主题色 | 色值 | 应用场景 |
|--------|------|----------|
| 咖啡棕 | `#C67C4E` | 选中状态、主按钮、高亮文字 |
| 背景灰 | `#F9F9F9` | 页面背景色 |
| 警告红 | `#FF6B6B` | 购物车角标、删除按钮 |
| 深灰 | `#999999` | 未选中文字、次要信息 |

### 6.5 本地存储 Key

| Key | 数据类型 | 描述 |
|-----|----------|------|
| `cartList` | Array\<CartItem\> | 购物车商品列表 |

---

## 七、已修复的历史 Bug 记录

### Bug 1：购物车图标数字显示不正确

**问题描述**：首页购物车图标显示的数字与实际购物车商品总数不符。

**根本原因**：`app.js` 的 `getCartCount()` 方法中 `item.quantity` 未进行 `parseInt` 转换，导致从 Storage 读取的字符串类型数据参与数值计算时发生字符串拼接。

**修复方案**：
```javascript
// 修复前
getCartCount() {
  return this.globalData.cartList.reduce((sum, item) => sum + item.quantity, 0);
}

// 修复后
getCartCount() {
  return this.globalData.cartList.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
}
```

### Bug 2：购物车数量增减时总金额未更新

**问题描述**：点击 "+" 或 "-" 按钮时，页面上的总金额未重新计算。

**根本原因**：
1. `onIncrease` / `onDecrease` 方法中 `quantity += 1` 操作未确保 `quantity` 为数字类型，导致字符串拼接（如 `"1" + 1 = "11"`）
2. 缺少购物车更新通知机制，导致跨页面状态不同步

**修复方案**：
```javascript
// 深拷贝时统一转换类型
const cartList = this.data.cartList.map(item => ({
  ...item,
  quantity: parseInt(item.quantity) || 0,  // 显式转为数字
  price: parseFloat(item.price) || 0
}));

// 确保使用数字加法
const currentQty = cartList[index].quantity;
cartList[index].quantity = currentQty + 1;
```

---

## 八、后续迭代建议

| 优先级 | 功能点 | 说明 |
|--------|--------|------|
| P0 | 真实支付接口对接 | 替换模拟结算为微信支付 |
| P1 | 商品分类数据持久化 | 从云数据库加载分类，而非硬编码 |
| P1 | 用户登录态管理 | 对接微信授权登录 |
| P2 | 收藏功能 | 实现商品收藏与收藏列表 |
| P2 | 地址管理 | 收货地址的增删改查 |
| P3 | 订单历史 | 订单列表与订单详情页 |
| P3 | 搜索功能 | 商品搜索与关键字匹配 |

---

*文档结束*
