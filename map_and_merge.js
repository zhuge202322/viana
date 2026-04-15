const fs = require('fs');
const path = require('path');

const oldDataPath = path.join(__dirname, 'public/temp_data.json');
const newDataPath = path.join(__dirname, '../products_peijian_diaozhui.json');

const oldData = JSON.parse(fs.readFileSync(oldDataPath, 'utf8'));
let newDataObj = JSON.parse(fs.readFileSync(newDataPath, 'utf8'));
const rawNewData = Array.isArray(newDataObj) ? newDataObj : (newDataObj.data || []);

const beadsData = (oldData.data || oldData).filter(item => item.parentCategoryName === 'Beads');

const parentMap = {
  "配饰": "Accessories",
  "吊坠": "Pendants"
};

const categoryMap = {
  "全部": "All",
  "隔珠": "Spacer",
  "环": "Ring",
  "扣": "Clasp",
  "链": "Chain",
  "星": "Star",
  "月": "Moon",
  "心": "Heart",
  "花": "Flower",
  "叶": "Leaf",
  "蝴蝶": "Butterfly",
  "结": "Knot",
  "十字": "Cross",
  "福": "Blessing",
  "财": "Wealth",
  "平安": "Peace",
  "猫爪": "Cat Paw",
  "貔貅": "Pixiu",
  "莲花": "Lotus",
  "南瓜": "Pumpkin",
  "雕刻件": "Carved",
  "生肖": "Zodiac",
  "圆珠": "Round Bead",
  "水滴": "Drop"
};

const wordMap = {
  "银": "Silver ",
  "金": "Gold ",
  "铜": "Copper ",
  "合金": "Alloy ",
  "复古": "Vintage ",
  "迷你": "Mini ",
  "大号": "Large ",
  "小号": "Small ",
  "彩色": "Color ",
  "彩": "Color ",
  "红": "Red ",
  "黑": "Black ",
  "白": "White ",
  "蓝": "Blue ",
  "绿": "Green ",
  "紫": "Purple ",
  "粉": "Pink ",
  "黄": "Yellow ",
  "狐狸": "Fox",
  "莲蓬": "Lotus Seedpod",
  "卍字": "Swastika",
  "大象": "Elephant",
  "流苏": "Tassel",
  "葫芦": "Gourd",
  "兔子": "Rabbit",
  "铃兰": "Lily of the Valley",
  "水草": "Aquatic",
  "樱花": "Sakura",
  "玫瑰": "Rose",
  "南红": "South Red",
  "朱砂": "Cinnabar",
  "玛瑙": "Agate",
  "水晶": "Quartz"
};

function translateName(name) {
  if (!name) return "";
  let translated = name;
  
  for (const [cn, en] of Object.entries(categoryMap)) {
    if (translated.includes(cn)) {
      translated = translated.replace(new RegExp(cn, 'g'), en + " ");
    }
  }
  
  for (const [cn, en] of Object.entries(wordMap)) {
    if (translated.includes(cn)) {
      translated = translated.replace(new RegExp(cn, 'g'), en);
    }
  }

  if (/[\u4e00-\u9fa5]/.test(translated)) {
    translated = translated.replace(/吊坠/g, 'Pendant ')
                           .replace(/配饰/g, 'Accessory ')
                           .replace(/隔片/g, 'Spacer ')
                           .replace(/小/g, 'Small ')
                           .replace(/大/g, 'Large ')
                           .replace(/头/g, 'Head ');
  }

  // Clean up double spaces
  return translated.replace(/\s+/g, ' ').trim();
}

const newMappedData = rawNewData.map(item => {
  let parent = item._parent_category;
  if (parentMap[parent]) {
    parent = parentMap[parent];
  } else {
    parent = parent === '吊坠' ? 'Pendants' : 'Accessories'; // fallback
  }
  
  let cat = item._sub_category;
  if (categoryMap[cat]) {
    cat = categoryMap[cat];
  } else {
    cat = translateName(cat);
  }
  
  let name = translateName(item.name);
  
  let price = 0;
  let stock = 0;
  let size = '10mm';
  let image = item.cover_url;
  
  if (item.sku_list && item.sku_list.length > 0) {
    const sku = item.sku_list[0];
    price = sku.price;
    stock = sku.stock;
    if (sku.pic) image = sku.pic;
    
    if (sku.specs) {
      try {
        const specs = JSON.parse(sku.specs);
        if (specs.size) {
          size = specs.size + 'mm';
        } else if (specs.high) {
          size = specs.high + 'mm';
        }
      } catch (e) {}
    }
  }
  
  let weight = 1.0;
  if (item.detail_desc && item.detail_desc.weight) {
    weight = parseFloat(item.detail_desc.weight) || 1.0;
  }

  return {
    id: item.id,
    categoryId: item.category_id,
    name: name,
    image: image,
    price: price,
    stock: stock,
    weight: weight,
    size: size,
    categoryName: cat,
    parentCategoryName: parent
  };
});

const combinedData = [...beadsData, ...newMappedData];

fs.writeFileSync(oldDataPath, JSON.stringify({ data: combinedData }, null, 2), 'utf8');
console.log('Mapped and translated successfully. Total items:', combinedData.length);
