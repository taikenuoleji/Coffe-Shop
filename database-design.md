# 咖啡商城小程序 - 云数据库设计文档

## 概述

本文档为咖啡商城小程序设计云数据库集合，包含 **11 个核心数据集合**，涵盖商品管理、订单处理、用户数据等核心业务模块。

### 本地存储说明

购物车数据采用 **本地存储 (localStorage)** + **全局状态管理** 实现，具有以下特点：

| 特性 | 说明 |
|------|------|
| 存储方式 | `wx.setStorageSync('cartList', [...])` |
| 全局访问 | 通过 `app.globalData.cartList` 全局共享 |
| 实时同步 | 增删改操作后自动更新界面和存储 |
| 持久化 | 小程序关闭后重新打开数据保留 |
| 角标更新 | tabBar 图标实时显示购物车商品总数 |

**购物车数据结构**：

```javascript
// cartList 数组元素结构
{
  _id: "商品ID",
  name: "商品名称",
  price: 4.53,           // 单价
  originalPrice: 5.53,   // 原价
  image: "图片URL",
  category: "摩卡",
  quantity: 1,           // 购买数量
  stock: 100,            // 库存
  selected: true,        // 是否选中（用于结算）
  addTime: 1704067200000 // 添加时间戳
}
```

---

## 一、商品集合 (goods) ⭐ 首页使用

### 功能说明
存储咖啡商品信息，用于首页商品列表展示，支持分类筛选和上下架管理。

### 字段设计

| 字段名 | 类型 | 必填 | 中文注释 |
|--------|------|------|----------|
| `_id` | String | 是 | 商品唯一标识符（自动生成） |
| `name` | String | 是 | 商品名称，如"摩卡咖啡"、"馥芮白" |
| `price` | Number | 是 | 商品单价（单位：元，保留两位小数） |
| `originalPrice` | Number | 否 | 原价（用于显示划线价格） |
| `image` | String | 是 | 商品主图URL |
| `description` | String | 是 | 商品描述/简介 |
| `category` | String | 是 | 商品分类：玛奇朵、拿铁、美式咖啡、摩卡、馥芮白 |
| `tags` | Array\<String\> | 否 | 标签数组，如["热卖", "买一送一"] |
| `stock` | Number | 否 | 库存数量，默认100 |
| `isAvailable` | Boolean | 否 | 是否上架，默认true（仅上架商品显示） |

### 索引建议

| 索引字段 | 索引类型 | 用途 |
|----------|----------|------|
| `isAvailable` | 普通索引 | 筛选已上架商品 |
| `category` | 普通索引 | 按分类筛选商品 |

### 示例数据

```json
{
  "_id": "goods_001",
  "name": "摩卡咖啡",
  "price": 4.53,
  "originalPrice": 5.53,
  "image": "../../images/assets/18.png",
  "description": "浓郁的意式浓缩与香滑巧克力的完美融合，覆盖绵密的奶泡，带来丝绒般的口感体验。",
  "category": "摩卡",
  "tags": ["热卖", "经典"],
  "stock": 100,
  "isAvailable": true
}
```

---

## 二、商品分类集合 (categories)

### 功能说明
存储咖啡商品的分类信息，支持商品筛选和分类管理。

### 字段设计

| 字段名 | 类型 | 必填 | 中文注释 |
|--------|------|------|----------|
| `_id` | String | 是 | 分类唯一标识符（自动生成） |
| `name` | String | 是 | 分类名称，如"全部咖啡"、"玛奇朵"、"拿铁"、"美式咖啡" |
| `name_en` | String | 否 | 分类英文名称（用于国际化） |
| `icon` | String | 否 | 分类图标URL（云存储文件ID） |
| `sort_order` | Number | 否 | 排序权重，数字越小排序越靠前 |
| `is_active` | Boolean | 否 | 是否启用，false为隐藏该分类 |
| `create_time` | Number | 是 | 创建时间（时间戳，毫秒） |
| `update_time` | Number | 是 | 更新时间（时间戳，毫秒） |

### 示例数据

```json
{
  "_id": "cat_001",
  "name": "全部咖啡",
  "name_en": "All Coffee",
  "icon": "cloud://xxx/categories/all.png",
  "sort_order": 0,
  "is_active": true,
  "create_time": 1704067200000,
  "update_time": 1704067200000
}
```

---

## 三、完整商品集合 (products)

### 功能说明
存储咖啡商品详细信息，包括名称、价格、图片、规格等核心数据。（用于商品详情页完整展示）

### 字段设计

| 字段名 | 类型 | 必填 | 中文注释 |
|--------|------|------|----------|
| `_id` | String | 是 | 商品唯一标识符（自动生成） |
| `name` | String | 是 | 商品名称，如"摩卡咖啡"、"馥芮白"、"融合摩卡" |
| `name_en` | String | 否 | 商品英文名称 |
| `description` | String | 是 | 商品简短描述，如"绵密奶泡"、"浓缩咖啡" |
| `description_detail` | String | 否 | 商品详细介绍（富文本） |
| `category_id` | String | 是 | 关联的分类ID（指向categories集合） |
| `price` | Number | 是 | 商品单价（单位：元，保留两位小数） |
| `original_price` | Number | 否 | 原价（用于显示划线价格） |
| `stock` | Number | 否 | 库存数量，默认0表示无限库存 |
| `unit` | String | 否 | 计量单位，默认"杯" |
| `image` | String | 是 | 商品主图URL（云存储文件ID） |
| `images` | Array\<String\> | 否 | 商品图片列表（多图） |
| `rating` | Number | 否 | 商品评分（1-5，保留一位小数），默认5.0 |
| `sales_count` | Number | 否 | 销量统计，默认0 |
| `is_recommend` | Boolean | 否 | 是否推荐商品，默认false |
| `is_new` | Boolean | 否 | 是否新品，默认false |
| `is_hot` | Boolean | 否 | 是否热卖，默认false |
| `specs` | Array\<Object\> | 否 | 商品规格选项列表 |
| `tags` | Array\<String\> | 否 | 商品标签，如["热卖", "新品"] |
| `status` | Number | 否 | 商品状态：0-下架，1-上架，默认1 |
| `create_time` | Number | 是 | 创建时间（时间戳） |
| `update_time` | Number | 是 | 更新时间（时间戳） |

### 规格字段 specs 子对象结构

```json
{
  "name": "温度",
  "options": ["热", "冰", "去冰"],
  "required": true
}
```

### 示例数据

```json
{
  "_id": "prod_001",
  "name": "摩卡咖啡",
  "name_en": "Caffe Mocha",
  "description": "绵密奶泡",
  "description_detail": "浓郁的意式浓缩与香滑巧克力的完美融合，覆盖绵密的奶泡，带来丝绒般的口感体验。",
  "category_id": "cat_001",
  "price": 4.53,
  "original_price": 5.53,
  "stock": 100,
  "unit": "杯",
  "image": "cloud://xxx/products/mocha.png",
  "images": [
    "cloud://xxx/products/mocha_1.png",
    "cloud://xxx/products/mocha_2.png"
  ],
  "rating": 4.8,
  "sales_count": 156,
  "is_recommend": true,
  "is_new": false,
  "is_hot": true,
  "specs": [
    { "name": "温度", "options": ["热", "冰", "去冰"], "required": true },
    { "name": "糖度", "options": ["正常糖", "少糖", "无糖"], "required": false }
  ],
  "tags": ["热卖", "经典"],
  "status": 1,
  "create_time": 1704067200000,
  "update_time": 1704153600000
}
```

---

## 四、用户信息集合 (users)

### 功能说明
存储用户的基本信息，用于用户画像、会员管理等功能。

### 字段设计

| 字段名 | 类型 | 必填 | 中文注释 |
|--------|------|------|----------|
| `_id` | String | 是 | 用户唯一标识（使用微信OpenId） |
| `openid` | String | 是 | 微信用户的OpenId |
| `nickname` | String | 否 | 用户昵称 |
| `avatar_url` | String | 否 | 用户头像URL |
| `gender` | Number | 否 | 性别：0-未知，1-男性，2-女性 |
| `phone` | String | 否 | 用户手机号（需加密存储） |
| `birthday` | String | 否 | 生日（格式：YYYY-MM-DD） |
| `member_level` | Number | 否 | 会员等级：1-普通，2-银卡，3-金卡，4-黑卡 |
| `member_points` | Number | 否 | 会员积分 |
| `total_orders` | Number | 否 | 累计订单数 |
| `total_spent` | Number | 否 | 累计消费金额（单位：元） |
| `default_address_id` | String | 否 | 默认收货地址ID |
| `last_login_time` | Number | 否 | 最后登录时间（时间戳） |
| `last_login_location` | String | 否 | 最后登录位置 |
| `subscribe_notifications` | Boolean | 否 | 是否订阅通知，默认true |
| `tags` | Array\<String\> | 否 | 用户标签 |
| `status` | Number | 否 | 账号状态：1-正常，0-禁用 |
| `create_time` | Number | 是 | 注册时间（时间戳） |
| `update_time` | Number | 是 | 更新时间（时间戳） |

### 示例数据

```json
{
  "_id": "user_openid_xxx",
  "openid": "oXXXX_xxxxxxxxxxxxx",
  "nickname": "咖啡爱好者",
  "avatar_url": "https://xxx/wxavatar.jpg",
  "gender": 1,
  "phone": "138****8888",
  "birthday": "1995-06-15",
  "member_level": 2,
  "member_points": 1250,
  "total_orders": 28,
  "total_spent": 568.50,
  "default_address_id": "addr_001",
  "last_login_time": 1704153600000,
  "last_login_location": "北京市朝阳区",
  "subscribe_notifications": true,
  "tags": ["咖啡爱好者", "新品尝鲜"],
  "status": 1,
  "create_time": 1703971200000,
  "update_time": 1704153600000
}
```

---

## 五、收货地址集合 (addresses)

### 功能说明
存储用户的收货地址信息，支持多地址管理和默认地址设置。

### 字段设计

| 字段名 | 类型 | 必填 | 中文注释 |
|--------|------|------|----------|
| `_id` | String | 是 | 地址唯一标识符（自动生成） |
| `user_id` | String | 是 | 所属用户ID（指向users集合的openid） |
| `consignee` | String | 是 | 收货人姓名 |
| `phone` | String | 是 | 联系电话 |
| `province` | String | 是 | 省份 |
| `city` | String | 是 | 城市 |
| `district` | String | 是 | 区县 |
| `address` | String | 是 | 详细地址 |
| `postal_code` | String | 否 | 邮政编码 |
| `is_default` | Boolean | 否 | 是否设为默认地址，每用户仅一个默认地址 |
| `label` | String | 否 | 地址标签，如"家"、"公司"、"学校" |
| `longitude` | Number | 否 | 地址经度 |
| `latitude` | Number | 否 | 地址纬度 |
| `status` | Number | 否 | 地址状态：1-正常，0-删除 |
| `create_time` | Number | 是 | 创建时间（时间戳） |
| `update_time` | Number | 是 | 更新时间（时间戳） |

### 示例数据

```json
{
  "_id": "addr_001",
  "user_id": "user_openid_xxx",
  "consignee": "张三",
  "phone": "13812345678",
  "province": "北京市",
  "city": "北京市",
  "district": "朝阳区",
  "address": "建国路88号SOHO现代城A座1201室",
  "postal_code": "100022",
  "is_default": true,
  "label": "家",
  "longitude": 116.478928,
  "latitude": 39.914935,
  "status": 1,
  "create_time": 1704067200000,
  "update_time": 1704067200000
}
```

---

## 六、购物车集合 (cart)

### 功能说明
存储用户的购物车商品，支持不同规格和数量的商品管理。

### 字段设计

| 字段名 | 类型 | 必填 | 中文注释 |
|--------|------|------|----------|
| `_id` | String | 是 | 购物车项唯一标识符（自动生成） |
| `user_id` | String | 是 | 所属用户ID（指向users集合的openid） |
| `product_id` | String | 是 | 商品ID（指向products集合） |
| `product_name` | String | 是 | 商品名称（冗余存储，防止商品下架后无法显示） |
| `product_image` | String | 是 | 商品图片URL（冗余存储） |
| `price` | Number | 是 | 购买时的单价（单位：元） |
| `quantity` | Number | 是 | 购买数量，默认1，最小1 |
| `specs` | String | 否 | 规格选项JSON字符串，如"{\"温度\":\"热\",\"糖度\":\"少糖\"}" |
| `notes` | String | 否 | 用户备注，如"少冰多糖" |
| `status` | Number | 否 | 状态：1-有效，0-已删除 |
| `create_time` | Number | 是 | 添加时间（时间戳） |
| `update_time` | Number | 是 | 更新时间（时间戳） |

### 示例数据

```json
{
  "_id": "cart_001",
  "user_id": "user_openid_xxx",
  "product_id": "prod_001",
  "product_name": "摩卡咖啡",
  "product_image": "cloud://xxx/products/mocha.png",
  "price": 4.53,
  "quantity": 2,
  "specs": "{\"温度\":\"热\",\"糖度\":\"少糖\"}",
  "notes": "打包带走",
  "status": 1,
  "create_time": 1704153600000,
  "update_time": 1704153600000
}
```

---

## 七、订单集合 (orders)

### 功能说明
存储用户订单信息，包含订单状态、支付信息、配送信息等核心数据。

### 字段设计

| 字段名 | 类型 | 必填 | 中文注释 |
|--------|------|------|----------|
| `_id` | String | 是 | 订单唯一标识符（自动生成） |
| `order_no` | String | 是 | 订单编号（业务主键，需唯一） |
| `user_id` | String | 是 | 下单用户ID（指向users集合的openid） |
| `order_type` | Number | 否 | 订单类型：1-普通订单，2-拼团订单，3-秒杀订单 |
| `status` | Number | 是 | 订单状态：0-待支付，1-已支付，2-制作中，3-待取餐，4-已完成，5-已取消，6-已退款 |
| `pay_status` | Number | 否 | 支付状态：0-未支付，1-已支付，2-已退款 |
| `pay_time` | Number | 否 | 支付时间（时间戳） |
| `pay_method` | String | 否 | 支付方式：wechat-微信支付，balance-余额支付 |
| `total_amount` | Number | 是 | 订单总金额（单位：元） |
| `discount_amount` | Number | 否 | 优惠金额（单位：元） |
| `actual_amount` | Number | 是 | 实付金额（单位：元） |
| `points_deduct` | Number | 否 | 积分抵扣金额 |
| `coupon_id` | String | 否 | 使用的优惠券ID |
| `coupon_discount` | Number | 否 | 优惠券优惠金额 |
| `items` | Array\<Object\> | 是 | 订单商品明细列表 |
| `address_id` | String | 否 | 收货地址ID（外卖订单需要） |
| `address_info` | Object | 否 | 收货地址快照（下单时的地址副本） |
| `pickup_code` | String | 否 | 取餐码（到店自取使用） |
| `delivery_type` | Number | 否 | 配送方式：1-到店自取，2-外卖配送 |
| `estimate_time` | Number | 否 | 预计完成时间（时间戳） |
| `complete_time` | Number | 否 | 完成时间（时间戳） |
| `cancel_time` | Number | 否 | 取消时间（时间戳） |
| `cancel_reason` | String | 否 | 取消原因 |
| `remarks` | String | 否 | 订单备注 |
| `create_time` | Number | 是 | 创建时间（时间戳） |
| `update_time` | Number | 是 | 更新时间（时间戳） |

### 订单商品明细 items 子对象结构

```json
{
  "product_id": "prod_001",
  "product_name": "摩卡咖啡",
  "product_image": "cloud://xxx/products/mocha.png",
  "price": 4.53,
  "quantity": 2,
  "specs": "{\"温度\":\"热\",\"糖度\":\"少糖\"}",
  "subtotal": 9.06
}
```

### 地址快照 address_info 结构

```json
{
  "consignee": "张三",
  "phone": "13812345678",
  "province": "北京市",
  "city": "北京市",
  "district": "朝阳区",
  "address": "建国路88号SOHO现代城"
}
```

### 示例数据

```json
{
  "_id": "order_001",
  "order_no": "CO202401151200001",
  "user_id": "user_openid_xxx",
  "order_type": 1,
  "status": 2,
  "pay_status": 1,
  "pay_time": 1704153600000,
  "pay_method": "wechat",
  "total_amount": 15.59,
  "discount_amount": 2.00,
  "actual_amount": 13.59,
  "points_deduct": 0,
  "coupon_id": "coupon_001",
  "coupon_discount": 2.00,
  "items": [
    {
      "product_id": "prod_001",
      "product_name": "摩卡咖啡",
      "product_image": "cloud://xxx/products/mocha.png",
      "price": 4.53,
      "quantity": 2,
      "specs": "{\"温度\":\"热\"}",
      "subtotal": 9.06
    },
    {
      "product_id": "prod_002",
      "product_name": "馥芮白",
      "product_image": "cloud://xxx/products/flatwhite.png",
      "price": 3.53,
      "quantity": 1,
      "specs": "{\"温度\":\"冰\"}",
      "subtotal": 3.53
    }
  ],
  "delivery_type": 1,
  "pickup_code": "A005",
  "estimate_time": 1704154500000,
  "remarks": "打包带走",
  "create_time": 1704153500000,
  "update_time": 1704153600000
}
```

---

## 八、收藏集合 (favorites)

### 功能说明
存储用户收藏的商品列表，用于商品收藏/取消收藏功能。

### 字段设计

| 字段名 | 类型 | 必填 | 中文注释 |
|--------|------|------|----------|
| `_id` | String | 是 | 收藏唯一标识符（自动生成） |
| `user_id` | String | 是 | 所属用户ID（指向users集合的openid） |
| `product_id` | String | 是 | 收藏的商品ID（指向products集合） |
| `product_info` | Object | 否 | 商品信息快照（下单时的商品副本） |
| `status` | Number | 否 | 状态：1-收藏中，0-已取消 |
| `create_time` | Number | 是 | 收藏时间（时间戳） |
| `update_time` | Number | 是 | 更新时间（时间戳） |

### 商品快照 product_info 结构

```json
{
  "name": "摩卡咖啡",
  "image": "cloud://xxx/products/mocha.png",
  "price": 4.53,
  "rating": 4.8
}
```

### 示例数据

```json
{
  "_id": "fav_001",
  "user_id": "user_openid_xxx",
  "product_id": "prod_001",
  "product_info": {
    "name": "摩卡咖啡",
    "image": "cloud://xxx/products/mocha.png",
    "price": 4.53,
    "rating": 4.8
  },
  "status": 1,
  "create_time": 1704153600000,
  "update_time": 1704153600000
}
```

---

## 九、优惠券集合 (coupons)

### 功能说明
存储优惠券信息，支持满减券、折扣券等类型，用于订单优惠抵扣。

### 字段设计

| 字段名 | 类型 | 必填 | 中文注释 |
|--------|------|------|----------|
| `_id` | String | 是 | 优惠券唯一标识符（自动生成） |
| `name` | String | 是 | 优惠券名称，如"新人专享券"、"满50减10" |
| `type` | Number | 是 | 优惠券类型：1-满减券，2-折扣券 |
| `value` | Number | 是 | 优惠值，满减券为减去的金额，折扣券为折扣比例（0-1） |
| `min_amount` | Number | 否 | 最低消费金额（满减条件） |
| `max_deduct` | Number | 否 | 最大抵扣金额（折扣券上限） |
| `total_count` | Number | 是 | 发行总数量 |
| `remain_count` | Number | 否 | 剩余数量 |
| `per_limit` | Number | 否 | 每人限领数量，默认1 |
| `valid_type` | Number | 是 | 有效期类型：1-固定日期，2-领取后N天生效 |
| `start_date` | String | 否 | 有效期开始日期（valid_type=1时使用，格式：YYYY-MM-DD） |
| `end_date` | String | 否 | 有效期结束日期（valid_type=1时使用） |
| `valid_days` | Number | 否 | 领取后有效天数（valid_type=2时使用） |
| `applicable_products` | Array\<String\> | 否 | 适用商品ID列表，空表示全部商品 |
| `applicable_categories` | Array\<String\> | 否 | 适用分类ID列表，空表示全部分类 |
| `status` | Number | 否 | 状态：1-正常，0-已下架 |
| `create_time` | Number | 是 | 创建时间（时间戳） |
| `update_time` | Number | 是 | 更新时间（时间戳） |

### 示例数据

```json
{
  "_id": "coupon_001",
  "name": "新人专享满20减5",
  "type": 1,
  "value": 5,
  "min_amount": 20,
  "max_deduct": 10,
  "total_count": 1000,
  "remain_count": 856,
  "per_limit": 1,
  "valid_type": 2,
  "valid_days": 7,
  "applicable_products": [],
  "applicable_categories": [],
  "status": 1,
  "create_time": 1704067200000,
  "update_time": 1704067200000
}
```

---

## 十、用户优惠券关联集合 (user_coupons)

### 功能说明
存储用户已领取的优惠券信息，记录优惠券的领取和使用状态。

### 字段设计

| 字段名 | 类型 | 必填 | 中文注释 |
|--------|------|------|----------|
| `_id` | String | 是 | 记录唯一标识符（自动生成） |
| `user_id` | String | 是 | 所属用户ID（指向users集合的openid） |
| `coupon_id` | String | 是 | 优惠券ID（指向coupons集合） |
| `coupon_info` | Object | 是 | 优惠券信息快照 |
| `status` | Number | 否 | 状态：0-未使用，1-已使用，2-已过期，3-已失效 |
| `receive_time` | Number | 是 | 领取时间（时间戳） |
| `use_time` | Number | 否 | 使用时间（时间戳） |
| `expire_time` | Number | 否 | 过期时间（时间戳） |
| `used_order_id` | String | 否 | 使用该券的订单ID（指向orders集合） |
| `create_time` | Number | 是 | 创建时间（时间戳） |
| `update_time` | Number | 是 | 更新时间（时间戳） |

### 示例数据

```json
{
  "_id": "uc_001",
  "user_id": "user_openid_xxx",
  "coupon_id": "coupon_001",
  "coupon_info": {
    "name": "新人专享满20减5",
    "type": 1,
    "value": 5
  },
  "status": 0,
  "receive_time": 1704153600000,
  "expire_time": 1704758400000,
  "create_time": 1704153600000,
  "update_time": 1704153600000
}
```

---

## 十一、通知消息集合 (notifications)

### 功能说明
存储系统通知和用户消息，支持订单状态变更、活动推送等场景。

### 字段设计

| 字段名 | 类型 | 必填 | 中文注释 |
|--------|------|------|----------|
| `_id` | String | 是 | 通知唯一标识符（自动生成） |
| `user_id` | String | 是 | 接收用户ID（指向users集合的openid） |
| `type` | Number | 是 | 消息类型：1-系统通知，2-订单通知，3-优惠活动，4-会员提醒 |
| `title` | String | 是 | 通知标题 |
| `content` | String | 是 | 通知内容 |
| `image` | String | 否 | 通知配图URL |
| `link_type` | String | 否 | 跳转类型：order-订单页，product-商品页，coupon-优惠券页，custom-自定义 |
| `link_id` | String | 否 | 跳转关联ID（如订单ID、商品ID等） |
| `link_url` | String | 否 | 自定义跳转链接 |
| `is_read` | Boolean | 否 | 是否已读，默认false |
| `read_time` | Number | 否 | 阅读时间（时间戳） |
| `status` | Number | 否 | 状态：1-有效，0-已删除 |
| `priority` | Number | 否 | 优先级：1-低，2-普通，3-高，4-紧急 |
| `create_time` | Number | 是 | 创建时间（时间戳） |
| `update_time` | Number | 是 | 更新时间（时间戳） |

### 示例数据

```json
{
  "_id": "notif_001",
  "user_id": "user_openid_xxx",
  "type": 2,
  "title": "订单已完成",
  "content": "您的订单CO202401151200001已制作完成，请凭取餐码A005到店取餐。",
  "image": "cloud://xxx/notifications/order_done.png",
  "link_type": "order",
  "link_id": "order_001",
  "is_read": false,
  "priority": 2,
  "status": 1,
  "create_time": 1704154500000,
  "update_time": 1704154500000
}
```

---

## 数据库索引设计建议

### 性能优化索引

| 集合名 | 索引字段 | 索引类型 | 用途 |
|--------|----------|----------|------|
| goods | isAvailable | 普通索引 | 筛选已上架商品 |
| goods | category | 普通索引 | 按分类筛选商品 |
| products | category_id, status | 复合索引 | 商品列表按分类筛选 |
| products | is_recommend, status | 复合索引 | 推荐商品查询 |
| products | sales_count, status | 复合索引 | 热卖商品查询 |
| orders | user_id, status | 复合索引 | 用户订单列表查询 |
| orders | order_no | 唯一索引 | 订单号查询 |
| orders | create_time | 普通索引 | 按时间排序查询 |
| cart | user_id, status | 复合索引 | 用户购物车查询 |
| favorites | user_id, product_id | 复合唯一索引 | 用户收藏商品查询 |
| user_coupons | user_id, status | 复合索引 | 用户可用优惠券查询 |
| notifications | user_id, is_read | 复合索引 | 未读消息查询 |
| addresses | user_id, is_default | 复合索引 | 用户默认地址查询 |

---

## 安全规则配置建议

### 集合权限说明

| 集合名 | 用户读 | 用户写 | 管理员读 | 管理员写 |
|--------|--------|--------|----------|----------|
| goods | 所有人 | 仅管理员 | 是 | 是 |
| categories | 所有人 | 仅管理员 | 是 | 是 |
| products | 所有人 | 仅管理员 | 是 | 是 |
| users | 仅本人 | 仅本人 | 是 | 是 |
| addresses | 仅本人 | 仅本人 | 是 | 是 |
| cart | 仅本人 | 仅本人 | 是 | 是 |
| orders | 仅本人 | 仅本人 | 是 | 是 |
| favorites | 仅本人 | 仅本人 | 是 | 是 |
| coupons | 所有人 | 仅管理员 | 是 | 是 |
| user_coupons | 仅本人 | 仅本人 | 是 | 是 |
| notifications | 仅本人 | 仅管理员 | 是 | 是 |

### 建议安全规则示例 (products集合)

```json
{
  "read": true,
  "create": "doc => auth.uid == 'admin'",
  "update": "doc => auth.uid == 'admin'",
  "delete": "doc => auth.uid == 'admin'"
}
```

---

## 版本历史

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| 1.0 | 2026-05-13 | 初始版本，包含8个核心数据集合设计 |
| 1.1 | 2026-05-13 | 新增首页商品集合(goods)，用于首页快速展示，共11个集合 |
