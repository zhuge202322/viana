const fs = require('fs');

const dataPath = './public/temp_data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Dictionaries
const parentMap = {
  "珠子": "Beads",
  "配饰": "Accessories",
  "吊坠": "Pendants"
};

const categoryMap = {
  "全部": "All",
  "曜石": "Obsidian",
  "紫水晶": "Amethyst",
  "月光": "Moonstone",
  "白水晶": "Clear Quartz",
  "粉水晶": "Rose Quartz",
  "黄水晶": "Citrine",
  "蓝水晶": "Blue Quartz",
  "绿水晶": "Green Quartz",
  "虎眼": "Tiger Eye",
  "幽灵": "Phantom",
  "胶花": "Jiaohua",
  "超七": "Super Seven",
  "玉石": "Jade",
  "发晶": "Rutilated Quartz",
  "茶晶": "Smoky Quartz",
  "石榴石": "Garnet",
  "兔毛": "Rabbit Hair",
  "木珠": "Wood Beads",
  "贝珠": "Shell Beads",
  "太赫兹": "Terahertz",
  "隔珠": "Spacer",
  "玛瑙": "Agate",
  "草莓晶": "Strawberry Quartz",
  "海蓝宝": "Aquamarine",
  "天河石": "Amazonite",
  "拉长石": "Labradorite",
  "萤石": "Fluorite",
  "碧玺": "Tourmaline",
  "孔雀石": "Malachite",
  "绿松石": "Turquoise",
  "青金石": "Lapis Lazuli",
  "珍珠": "Pearl",
  "琥珀": "Amber",
  "蜜蜡": "Amber",
  "南红": "South Red Agate",
  "朱砂": "Cinnabar",
  "绿幽灵": "Green Phantom",
  "金发晶": "Gold Rutilated Quartz",
  "黑发晶": "Black Rutilated Quartz",
  "绿发晶": "Green Rutilated Quartz",
  "红兔毛": "Red Rabbit Hair",
  "紫玉髓": "Purple Chalcedony",
  "粉玉髓": "Pink Chalcedony",
  "蓝玉髓": "Blue Chalcedony",
  "绿玉髓": "Green Chalcedony",
  "黄玉髓": "Yellow Chalcedony",
  "黑玉髓": "Black Chalcedony",
  "白玉髓": "White Chalcedony",
  "红玛瑙": "Red Agate",
  "黑玛瑙": "Black Agate",
  "绿玛瑙": "Green Agate",
  "蓝玛瑙": "Blue Agate",
  "紫玛瑙": "Purple Agate",
  "黄玛瑙": "Yellow Agate",
  "白玛瑙": "White Agate",
  "阿拉善玛瑙": "Alashan Agate",
  "盐源玛瑙": "Yanyuan Agate",
  "战国红玛瑙": "Zhanguo Red Agate",
  "樱花玛瑙": "Sakura Agate",
  "水草玛瑙": "Aquatic Agate",
  "紫龙晶": "Charoite",
  "舒俱来": "Sugilite",
  "绿龙晶": "Seraphinite",
  "紫云母": "Lepidolite",
  "太阳石": "Sunstone",
  "紫锂辉": "Kunzite"
};

const wordMap = {
  "冰": "Ice ",
  "金": "Gold ",
  "银": "Silver ",
  "黑": "Black ",
  "红": "Red ",
  "绿": "Green ",
  "蓝": "Blue ",
  "紫": "Purple ",
  "黄": "Yellow ",
  "白": "White ",
  "粉": "Pink ",
  "彩色": "Color ",
  "彩": "Color ",
  "草莓": "Strawberry ",
  "天然": "Natural ",
  "玫瑰": "Rose ",
  "猫眼": "Cat Eye ",
  "星光": "Starlight "
};

function translateName(name) {
  if (!name) return name;
  let translated = name;
  
  // First extract size if present e.g. (8mm)
  const sizeMatch = translated.match(/\((.*?)\)/);
  let sizeStr = "";
  if (sizeMatch) {
    sizeStr = ` (${sizeMatch[1]})`;
    translated = translated.replace(/\(.*?\)/, '');
  }

  // Replace known categories
  for (const [cn, en] of Object.entries(categoryMap)) {
    if (translated.includes(cn)) {
      translated = translated.replace(cn, en);
    }
  }
  
  // Replace known modifier words
  for (const [cn, en] of Object.entries(wordMap)) {
    if (translated.includes(cn)) {
      translated = translated.replace(cn, en);
    }
  }

  // If still contains chinese characters, try generic fallback
  if (/[\u4e00-\u9fa5]/.test(translated)) {
    // If it's a pendant or accessory, maybe just transliterate or strip
    translated = translated.replace(/吊坠/g, 'Pendant')
                           .replace(/配饰/g, 'Accessory')
                           .replace(/隔珠/g, 'Spacer')
                           .replace(/珠/g, 'Bead')
                           .replace(/环/g, 'Ring')
                           .replace(/扣/g, 'Clasp')
                           .replace(/链/g, 'Chain')
                           .replace(/星/g, 'Star')
                           .replace(/月/g, 'Moon')
                           .replace(/心/g, 'Heart')
                           .replace(/花/g, 'Flower')
                           .replace(/叶/g, 'Leaf')
                           .replace(/蝴蝶/g, 'Butterfly')
                           .replace(/结/g, 'Knot')
                           .replace(/十字/g, 'Cross')
                           .replace(/福/g, 'Blessing')
                           .replace(/财/g, 'Wealth')
                           .replace(/平安/g, 'Peace');
  }

  return translated.trim() + sizeStr;
}

if (data.data && Array.isArray(data.data)) {
  data.data.forEach(item => {
    if (item.parentCategoryName && parentMap[item.parentCategoryName]) {
      item.parentCategoryName = parentMap[item.parentCategoryName];
    }
    
    if (item.categoryName && categoryMap[item.categoryName]) {
      item.categoryName = categoryMap[item.categoryName];
    } else if (item.categoryName) {
      // Translate remaining categories loosely
      item.categoryName = translateName(item.categoryName).replace(/\(.*?\)/, '').trim();
    }
    
    if (item.name) {
      item.name = translateName(item.name);
    }
  });
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Translation complete!');