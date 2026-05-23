# ☕ Coffee Shop · 咖啡商城小程序

<p align="center">
  <img src="https://img.shields.io/badge/微信小程序-green?style=flat&logo=wechat&logoColor=white" alt="WeChat Mini Program">
  <img src="https://img.shields.io/badge/CloudBase-云开发-blue?style=flat&logo=tencent-cloud" alt="CloudBase">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat" alt="License">
</p>

基于**微信小程序 + CloudBase 云开发**的咖啡商城点单应用，实现商品浏览、分类筛选、购物车管理与模拟结算等核心电商功能。

> 📖 详细设计文档：[DESIGN.md](./DESIGN.md) | 数据库设计：[database-design.md](./database-design.md)

---

## ✨ 功能概览

| 模块 | 功能点 | 状态 |
|------|--------|:--:|
| 🏠 **首页** | 商品列表加载、分类筛选、商品评分展示 | ✅ |
| 📦 **商品详情** | 商品完整信息展示、加入购物车 | ✅ |
| 🛒 **购物车** | 数量增减、删除/清空、全选/取消全选 | ✅ |
| 💰 **结算** | 合计金额实时计算、结算确认、模拟支付 | ✅ |
| 🧭 **导航** | 自定义 tabBar、购物车数量角标实时更新 | ✅ |
| 🔄 **状态管理** | 跨页面购物车数据同步、本地持久化 | ✅ |

---

## 🏗 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | 微信小程序原生框架 | `.wxml` + `.wxss` + `.js` |
| 后端服务 | CloudBase 云开发 | 云函数 + 云数据库 + 存储 |
| 数据持久化 | `wx.setStorageSync` | 购物车数据本地存储 |
| 全局状态 | `app.globalData` | 跨页面购物车同步与回调机制 |
| 导航组件 | 自定义 tabBar | 底部导航 + 购物车角标 |

---

## 📂 项目结构

```
Coffee-Shop/
├── assets/                    # 项目静态资源素材
│   ├── *.svg                  # Figma 导出图标（25 个）
│   └── *.png                  # 商品与 UI 图片（6 个）
├── back-end/                  # 后台管理系统（Element UI + TypeScript）
├── wechat/                    # 微信小程序端
│   ├── cloudfunctions/        # 云函数（如 initGoods）
│   ├── miniprogram/           # 小程序主目录
│   │   ├── app.js             # 🚀 应用入口 · 全局状态管理
│   │   ├── app.json           # 应用配置 · tabBar 定义
│   │   ├── app.wxss           # 全局样式
│   │   ├── pages/             # 页面目录
│   │   │   ├── index/         # 首页（商品列表 + 分类筛选）
│   │   │   ├── cart/          # 购物车页（数量管理 + 结算）
│   │   │   └── goods-detail/  # 商品详情页
│   │   ├── custom-tab-bar/    # 自定义底部导航栏
│   │   ├── images/            # 图片资源
│   │   ├── components/        # 公共组件
│   │   └── utils/             # 工具函数
│   └── project.config.json    # 小程序项目配置
├── database-design.md         # 数据库设计文档（11 个集合）
├── DESIGN.md                  # 项目设计文档（架构 + 交互流程）
├── figma.md                   # Figma 设计稿说明
└── README.md                  # 本文件
```

---

## 🚀 快速开始

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（最新稳定版）
- 微信小程序 AppID（[注册获取](https://mp.weixin.qq.com/)）
- CloudBase 云开发环境（在微信开发者工具中开通）

### 本地运行

```bash
# 1. 克隆仓库
git clone https://github.com/taikenuoleji/Coffe-Shop.git
cd Coffee-Shop

# 2. 使用微信开发者工具打开 wechat 目录
#    文件 → 导入项目 → 选择 wechat/ 文件夹

# 3. 配置云开发环境
#    在 app.js 中修改 env 为你自己的环境 ID
#    env: "your-cloudbase-env-id"
```

### 初始化数据

1. 在 CloudBase 控制台创建 `goods` 集合
2. 导入示例数据或调用 `initGoods` 云函数初始化商品

---

## 📊 核心架构

```
┌──────────────────────────────────────────────────────────────┐
│                         用户端                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐          │
│  │ 首页(index)│  │购物车(cart)│  │详情(goods-detail)│          │
│  └─────┬─────┘  └─────┬─────┘  └───────┬──────────┘          │
│        │              │                │                     │
│        └──────────────┴────────────────┘                     │
│                       │                                      │
│             ┌─────────▼─────────┐                            │
│             │  App (globalData) │  ← 全局状态管理中心         │
│             │  · cartList       │                            │
│             │  · cartCallbacks  │                            │
│             └─────────┬─────────┘                            │
└───────────────────────┼──────────────────────────────────────┘
                        │
      ┌─────────────────┼─────────────────┐
      ▼                 ▼                 ▼
┌───────────┐  ┌──────────────┐  ┌──────────────┐
│  本地存储  │  │   云函数      │  │   云数据库    │
│ wx.storage│  │  initGoods   │  │ goods 集合   │
└───────────┘  └──────────────┘  └──────────────┘
```

**跨页面状态同步机制**：

- 所有购物车操作通过 `app.js` 中的全局方法统一管理
- `app.globalData.cartList` 作为唯一数据源
- 注册回调函数 `registerCartUpdate()` 实现数据变更时多页面实时响应

---

## 🔧 项目配置

| 配置项 | 路径 | 说明 |
|--------|------|------|
| 云环境 ID | `wechat/miniprogram/app.js` → `globalData.env` | CloudBase 环境标识 |
| tabBar 配置 | `wechat/miniprogram/app.json` → `tabBar` | 自定义底部导航 |
| 购物车存储 | `wx.setStorageSync('cartList')` | 本地持久化 Key |
| 商品集合 | 云数据库 `goods` | 首页商品数据源 |

---

## 🎨 设计规范

| 项目 | 值 |
|------|-----|
| 主色调 | 棕色系（咖啡主题） |
| 主题背景 | `#f9f7f2`（浅米色） |
| 价格颜色 | `#eb7e2a`（橙色） |
| 圆角风格 | 卡片圆角 `20rpx`，按钮圆角 `49rpx` |

---

## 📚 相关文档

- [项目设计文档 (DESIGN.md)](./DESIGN.md) — 架构设计、模块说明、交互流程
- [数据库设计 (database-design.md)](./database-design.md) — 11 个数据集合、字段定义、索引建议
- [Figma 设计稿说明 (figma.md)](./figma.md) — UI 设计规格

---

## 📝 License

MIT © 2026 Coffee Shop
