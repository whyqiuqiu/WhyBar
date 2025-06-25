const express = require('express');
const router = express.Router();

// 鸡尾酒分类数据
const categories = [
  {
    id: 1,
    name: '经典鸡尾酒',
    description: '经典永不过时，这些鸡尾酒经历了时间的考验，成为调酒史上的里程碑。',
    image: '/static/images/classic-cocktails.jpg',
    sort_order: 1
  },
  {
    id: 2,
    name: '简易鸡尾酒',
    description: '简单易制作，但口感不简单，这些鸡尾酒适合初学者尝试。',
    image: '/static/images/easy-cocktails.jpg',
    sort_order: 2
  },
  {
    id: 3,
    name: '创意鸡尾酒',
    description: '打破传统，创新调配，这些鸡尾酒代表着现代调酒的无限可能。',
    image: '/static/images/creative-cocktails.jpg',
    sort_order: 3
  },
  {
    id: 4,
    name: '无酒精鸡尾酒',
    description: '同样美味但不含酒精，适合不饮酒人士和需要开车的客人。',
    image: '/static/images/non-alcoholic-cocktails.jpg',
    sort_order: 4
  }
];

// 获取所有分类
router.get('/', (req, res) => {
  res.json({
    code: 200,
    message: '获取分类列表成功',
    data: categories
  });
});

// 获取分类详情
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const category = categories.find(c => c.id === id);
  
  if (category) {
    res.json({
      code: 200,
      message: '获取分类详情成功',
      data: category
    });
  } else {
    res.json({
      code: 404,
      message: '分类不存在',
      data: null
    });
  }
});

module.exports = router; 