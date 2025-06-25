const express = require('express');
const router = express.Router();

// 鸡尾酒数据
const cocktails = [
  {
    id: 1,
    name: '莫吉托',
    name_en: 'Mojito',
    price: 35.00,
    description: '莫吉托是一种传统的古巴鸡尾酒，以朗姆酒为酒基，加入薄荷叶、青柠汁、糖和苏打水制成。清爽提神，是夏日的经典选择。',
    image: '/static/images/mojito.png',
    ingredients: '朗姆酒、薄荷叶、青柠、糖浆、苏打水',
    alcohol_degree: 15,
    category_id: 1,
    tags: ['经典', '清爽', '朗姆酒'],
    is_recommended: true,
    sales: 156,
    rating: 4.8,
    created_at: '2023-01-01 00:00:00'
  },
  {
    id: 2,
    name: '玛格丽特',
    name_en: 'Margarita',
    price: 38.00,
    description: '玛格丽特是一款经典的墨西哥鸡尾酒，以龙舌兰酒为基酒，混合橙味利口酒和新鲜青柠汁，杯口常用盐调味。酸甜平衡，清爽怡人。',
    image: '/static/images/margarita.png',
    ingredients: '龙舌兰酒、君度橙酒、青柠汁、盐',
    alcohol_degree: 20,
    category_id: 1,
    tags: ['经典', '酸甜', '龙舌兰酒'],
    is_recommended: true,
    sales: 142,
    rating: 4.7,
    created_at: '2023-01-02 00:00:00'
  },
  {
    id: 3,
    name: '朗姆可乐',
    name_en: 'Rum & Coke',
    price: 30.00,
    description: '朗姆可乐是一款简单而受欢迎的鸡尾酒，将朗姆酒与可乐混合，加入一片青柠增添风味。这款饮品也被称为"自由古巴"。',
    image: '/static/images/rum-cola.png',
    ingredients: '朗姆酒、可乐、青柠',
    alcohol_degree: 12,
    category_id: 2,
    tags: ['简单', '经济', '朗姆酒'],
    is_recommended: false,
    sales: 198,
    rating: 4.5,
    created_at: '2023-01-03 00:00:00'
  },
  {
    id: 4,
    name: '威士忌酸酒',
    name_en: 'Whiskey Sour',
    price: 42.00,
    description: '威士忌酸酒是一款经典的美国鸡尾酒，以威士忌为基酒，混合新鲜柠檬汁和糖浆，有时会加入蛋白增加质感。口感酸甜平衡，回味悠长。',
    image: '/static/images/whiskey-sour.png',
    ingredients: '威士忌、柠檬汁、糖浆、可选蛋白',
    alcohol_degree: 22,
    category_id: 1,
    tags: ['经典', '酸甜', '威士忌'],
    is_recommended: true,
    sales: 112,
    rating: 4.6,
    created_at: '2023-01-04 00:00:00'
  },
  {
    id: 5,
    name: '紫色梦境',
    name_en: 'Purple Dream',
    price: 45.00,
    description: '紫色梦境是一款视觉效果惊艳的创意鸡尾酒，以伏特加为基酒，混合蓝柑橘利口酒、蔓越莓汁和柠檬汁，呈现梦幻的紫色渐变效果。',
    image: '/static/images/purple-dream.png',
    ingredients: '伏特加、蓝柑橘利口酒、蔓越莓汁、柠檬汁、糖浆',
    alcohol_degree: 18,
    category_id: 3,
    tags: ['创意', '水果', '伏特加'],
    is_recommended: true,
    sales: 89,
    rating: 4.9,
    created_at: '2023-01-05 00:00:00'
  },
  {
    id: 6,
    name: '浆果气泡',
    name_en: 'Berry Fizz',
    price: 36.00,
    description: '浆果气泡是一款清爽的果味鸡尾酒，混合新鲜草莓、蓝莓、覆盆子与金酒，加入苏打水增添气泡感。酸甜可口，果香浓郁。',
    image: '/static/images/berry-fizz.png',
    ingredients: '金酒、混合浆果、柠檬汁、糖浆、苏打水',
    alcohol_degree: 14,
    category_id: 2,
    tags: ['水果', '气泡', '金酒'],
    is_recommended: false,
    sales: 76,
    rating: 4.7,
    created_at: '2023-01-06 00:00:00'
  }
];

// 鸡尾酒分类
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
  }
];

// 获取鸡尾酒列表
router.get('/', (req, res) => {
  const { page = 1, limit = 10, category_id, keyword, tag } = req.query;
  
  let filteredCocktails = [...cocktails];
  
  // 按分类筛选
  if (category_id) {
    filteredCocktails = filteredCocktails.filter(c => c.category_id === parseInt(category_id));
  }
  
  // 按关键词搜索
  if (keyword) {
    const searchKeyword = keyword.toLowerCase();
    filteredCocktails = filteredCocktails.filter(c => 
      c.name.toLowerCase().includes(searchKeyword) || 
      c.name_en.toLowerCase().includes(searchKeyword) || 
      c.description.toLowerCase().includes(searchKeyword)
    );
  }
  
  // 按标签筛选
  if (tag) {
    filteredCocktails = filteredCocktails.filter(c => c.tags.includes(tag));
  }
  
  // 分页
  const pageNum = parseInt(page);
  const pageSize = parseInt(limit);
  const startIndex = (pageNum - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCocktails = filteredCocktails.slice(startIndex, endIndex);
  
  res.json({
    code: 200,
    message: '获取鸡尾酒列表成功',
    data: {
      total: filteredCocktails.length,
      page: pageNum,
      limit: pageSize,
      list: paginatedCocktails
    }
  });
});

// 获取推荐鸡尾酒
router.get('/recommended', (req, res) => {
  const { limit = 6 } = req.query;
  const recommendedCocktails = cocktails
    .filter(c => c.is_recommended)
    .slice(0, parseInt(limit));
  
  res.json({
    code: 200,
    message: '获取推荐鸡尾酒成功',
    data: recommendedCocktails
  });
});

// 获取鸡尾酒详情
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const cocktail = cocktails.find(c => c.id === id);
  
  if (cocktail) {
    res.json({
      code: 200,
      message: '获取鸡尾酒详情成功',
      data: cocktail
    });
  } else {
    res.json({
      code: 404,
      message: '鸡尾酒不存在',
      data: null
    });
  }
});

module.exports = router; 