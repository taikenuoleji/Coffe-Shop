const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// ========== 通用响应格式 ==========
// 返回标准格式：{ code: 0, data: xxx, message: 'success' }
// code: 0-成功，其他-失败

// 获取openid
const getOpenId = async () => {
  const wxContext = cloud.getWXContext();
  return {
    code: 0,
    data: {
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    },
    message: "success",
  };
};

// ========== 商品相关云函数 ==========

/**
 * 获取商品列表（首页）
 * @param {Object} event - 包含 category 可选参数
 * @description 返回已上架商品，支持按分类筛选
 */
const getGoodsList = async (event) => {
  try {
    const { category } = event || {};
    
    // 构建查询条件：只查询上架商品
    let query = db.collection("goods").where({
      isAvailable: true,
    });

    // 如果传入了分类参数，则添加分类筛选
    if (category && category !== "全部咖啡") {
      query = query.where({
        isAvailable: true,
        category: category,
      });
    }

    // 按分类排序后返回
    const result = await query.orderBy("category", "asc").get();

    return {
      code: 0,
      data: result.data,
      message: "success",
    };
  } catch (e) {
    console.error("getGoodsList error:", e);
    return {
      code: -1,
      data: null,
      message: "获取商品列表失败：" + e.message,
    };
  }
};

/**
 * 获取商品详情
 * @param {Object} event - 包含 goodsId 参数
 * @description 根据商品ID获取单个商品的完整信息
 */
const getGoodsDetail = async (event) => {
  try {
    const { goodsId } = event || {};

    if (!goodsId) {
      return {
        code: -1,
        data: null,
        message: "商品ID不能为空",
      };
    }

    // 查询指定商品
    const result = await db.collection("goods").doc(goodsId).get();

    // 判断商品是否存在
    if (!result.data || !result.data._id) {
      return {
        code: -1,
        data: null,
        message: "商品不存在",
      };
    }

    return {
      code: 0,
      data: result.data,
      message: "success",
    };
  } catch (e) {
    console.error("getGoodsDetail error:", e);
    return {
      code: -1,
      data: null,
      message: "获取商品详情失败：" + e.message,
    };
  }
};

// ========== 以下是原有的示例代码 ==========

// 获取小程序二维码
const getMiniProgramCode = async () => {
  const resp = await cloud.openapi.wxacode.get({
    path: "pages/index/index",
  });
  const { buffer } = resp;
  const upload = await cloud.uploadFile({
    cloudPath: "code.png",
    fileContent: buffer,
  });
  return {
    code: 0,
    data: upload.fileID,
    message: "success",
  };
};

// 创建集合
const createCollection = async () => {
  try {
    await db.createCollection("sales");
    await db.collection("sales").add({
      data: {
        region: "华东",
        city: "上海",
        sales: 11,
      },
    });
    await db.collection("sales").add({
      data: {
        region: "华东",
        city: "南京",
        sales: 11,
      },
    });
    await db.collection("sales").add({
      data: {
        region: "华南",
        city: "广州",
        sales: 22,
      },
    });
    await db.collection("sales").add({
      data: {
        region: "华南",
        city: "深圳",
        sales: 22,
      },
    });
    return {
      code: 0,
      data: null,
      message: "success",
    };
  } catch (e) {
    return {
      code: 0,
      data: "create collection success",
      message: "success",
    };
  }
};

// 查询数据
const selectRecord = async () => {
  const result = await db.collection("sales").get();
  return {
    code: 0,
    data: result.data,
    message: "success",
  };
};

// 更新数据
const updateRecord = async (event) => {
  try {
    for (let i = 0; i < event.data.length; i++) {
      await db
        .collection("sales")
        .where({
          _id: event.data[i]._id,
        })
        .update({
          data: {
            sales: event.data[i].sales,
          },
        });
    }
    return {
      code: 0,
      data: event.data,
      message: "success",
    };
  } catch (e) {
    return {
      code: -1,
      data: null,
      message: e.message,
    };
  }
};

// 新增数据
const insertRecord = async (event) => {
  try {
    const insertRecord = event.data;
    await db.collection("sales").add({
      data: {
        region: insertRecord.region,
        city: insertRecord.city,
        sales: Number(insertRecord.sales),
      },
    });
    return {
      code: 0,
      data: event.data,
      message: "success",
    };
  } catch (e) {
    return {
      code: -1,
      data: null,
      message: e.message,
    };
  }
};

// 删除数据
const deleteRecord = async (event) => {
  try {
    await db
      .collection("sales")
      .where({
        _id: event.data._id,
      })
      .remove();
    return {
      code: 0,
      data: null,
      message: "success",
    };
  } catch (e) {
    return {
      code: -1,
      data: null,
      message: e.message,
    };
  }
};

// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.type) {
    case "getOpenId":
      return await getOpenId();
    case "getGoodsList":
      return await getGoodsList(event);
    case "getGoodsDetail":
      return await getGoodsDetail(event);
    case "getMiniProgramCode":
      return await getMiniProgramCode();
    case "createCollection":
      return await createCollection();
    case "selectRecord":
      return await selectRecord();
    case "updateRecord":
      return await updateRecord(event);
    case "insertRecord":
      return await insertRecord(event);
    case "deleteRecord":
      return await deleteRecord(event);
  }
};
