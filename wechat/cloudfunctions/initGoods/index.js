// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event;

  try {
    switch (action) {
      // 初始化商品数据
      case 'initGoods': {
        const goodsData = [
          {
            name: '摩卡咖啡',
            price: 4.53,
            originalPrice: 5.53,
            image: '../../images/assets/18.png',
            description: '浓郁的意式浓缩与香滑巧克力的完美融合，覆盖绵密的奶泡，带来丝绒般的口感体验。',
            category: '摩卡',
            tags: ['热卖', '经典'],
            stock: 100,
            isAvailable: true
          },
          {
            name: '馥芮白',
            price: 3.53,
            originalPrice: 4.53,
            image: '../../images/assets/20.png',
            description: '细腻的微泡牛奶与经典浓缩咖啡相结合，口感顺滑饱满，是咖啡爱好者的心头好。',
            category: '馥芮白',
            tags: ['新品', '绵密奶泡'],
            stock: 80,
            isAvailable: true
          },
          {
            name: '融合摩卡',
            price: 7.53,
            originalPrice: 8.53,
            image: '../../images/assets/19.png',
            description: '创新融合多种咖啡风味，搭配香草与焦糖，带来层次丰富的味觉享受。冰热可选。',
            category: '摩卡',
            tags: ['新品', '冰热可选'],
            stock: 60,
            isAvailable: true
          },
          {
            name: '奶油咖啡',
            price: 5.53,
            originalPrice: 6.53,
            image: '../../images/assets/17.png',
            description: '丝滑的鲜奶油覆盖在香浓咖啡之上，甜而不腻，入口即化。冰热可选。',
            category: '美式咖啡',
            tags: ['买一送一', '冰热可选'],
            stock: 120,
            isAvailable: true
          },
          {
            name: '经典拿铁',
            price: 4.28,
            originalPrice: 5.28,
            image: '../../images/assets/20.png',
            description: '正宗意式拿铁，浓缩咖啡与蒸煮牛奶的经典搭配，奶香浓郁，回味悠长。',
            category: '拿铁',
            tags: ['经典', '绵密奶泡'],
            stock: 150,
            isAvailable: true
          },
          {
            name: '焦糖玛奇朵',
            price: 5.28,
            originalPrice: 6.28,
            image: '../../images/assets/19.png',
            description: '香甜焦糖与浓缩咖啡的完美结合，顶层覆盖绵密奶泡，甜蜜与苦涩的交织。',
            category: '玛奇朵',
            tags: ['热卖', '甜品咖啡'],
            stock: 90,
            isAvailable: true
          },
          {
            name: '美式咖啡',
            price: 3.28,
            originalPrice: 4.28,
            image: '../../images/assets/18.png',
            description: '双份浓缩咖啡加入热水，还原咖啡最纯粹的味道，苦涩中带着醇香。',
            category: '美式咖啡',
            tags: ['提神', '黑咖啡'],
            stock: 200,
            isAvailable: true
          },
          {
            name: '香草拿铁',
            price: 4.98,
            originalPrice: 5.98,
            image: '../../images/assets/17.png',
            description: '经典拿铁加入天然香草糖浆，芳香四溢，甜度适中，深受女士喜爱。',
            category: '拿铁',
            tags: ['新品', '香草风味'],
            stock: 70,
            isAvailable: true
          }
        ];

        // 批量插入（goods 集合已存在）
        const tasks = goodsData.map(item => db.collection('goods').add({ data: item }));
        const results = await Promise.all(tasks);

        return {
          code: 0,
          data: {
            insertedCount: results.length,
            ids: results.map(r => r._id)
          },
          message: `商品数据初始化成功，共插入 ${results.length} 条`
        };
      }

      // 获取商品列表
      case 'getGoodsList': {
        const { category } = data || {};
        
        if (category && category !== '全部咖啡') {
          const result = await db.collection('goods')
            .where({ category: category, isAvailable: true })
            .orderBy('category', 'asc')
            .get();
          
          return { code: 0, data: result.data, message: 'success' };
        } else {
          const result = await db.collection('goods')
            .where({ isAvailable: true })
            .orderBy('category', 'asc')
            .get();
          
          return { code: 0, data: result.data, message: 'success' };
        }
      }

      // 获取商品详情
      case 'getGoodsDetail': {
        const { goodsId } = data;
        
        if (!goodsId) {
          return { code: 400, data: null, message: '商品ID不能为空' };
        }

        try {
          const result = await db.collection('goods').doc(goodsId).get();

          return { code: 0, data: result.data, message: 'success' };
        } catch (e) {
          if (e.errCode === -1 || e.errCode === -1001) {
            return { code: 404, data: null, message: '商品不存在' };
          }
          throw e;
        }
      }

      default:
        return { code: 400, data: null, message: '未知的操作类型' };
    }
  } catch (error) {
    console.error('云函数错误:', error);
    return { code: 500, data: null, message: error.message || '服务器错误' };
  }
};
