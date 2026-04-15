const fs = require('fs');
const path = require('path');

const oldDataPath = path.join(__dirname, 'public/temp_data.json');
const newDataPath = path.join(__dirname, '../products_peijian_diaozhui.json');

const oldData = JSON.parse(fs.readFileSync(oldDataPath, 'utf8'));
let newDataObj = JSON.parse(fs.readFileSync(newDataPath, 'utf8'));
const newData = Array.isArray(newDataObj) ? newDataObj : (newDataObj.data || []);

// Filter out old "Accessories" and "Pendants" (we translate them previously, so we keep only "Beads")
// We will just keep items that are "Beads"
const beadsData = (oldData.data || oldData).filter(item => item.parentCategoryName === 'Beads');

// Dictionaries for new items
const parentMap = {
  "珠子": "Beads",
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
  "南瓜": "Pumpkin"
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
  "黄": "Yellow "
};

function translateName(name) {
  if (!name) return "";
  let translated = name;
  
  const sizeMatch = translated.match(/\((.*?)\)/);
  let sizeStr = "";
  if (sizeMatch) {
    sizeStr = ` (${sizeMatch[1]})`;
    translated = translated.replace(/\(.*?\)/, '');
  }

  for (const [cn, en] of Object.entries(categoryMap)) {
    if (translated.includes(cn)) {
      translated = translated.replace(new RegExp(cn, 'g'), en);
    }
  }
  
  for (const [cn, en] of Object.entries(wordMap)) {
    if (translated.includes(cn)) {
      translated = translated.replace(new RegExp(cn, 'g'), en);
    }
  }

  if (/[\u4e00-\u9fa5]/.test(translated)) {
    translated = translated.replace(/吊坠/g, 'Pendant')
                           .replace(/配饰/g, 'Accessory')
                           .replace(/隔片/g, 'Spacer')
                           .replace(/小/g, 'Small ')
                           .replace(/大/g, 'Large ');
  }

  return translated.trim() + sizeStr;
}

const newTranslatedData = newData.map(item => {
  let parent = item.parentCategoryName;
  if (parentMap[parent]) {
    parent = parentMap[parent];
  }
  
  let cat = item.categoryName;
  if (categoryMap[cat]) {
    cat = categoryMap[cat];
  } else {
    cat = translateName(cat).replace(/\(.*?\)/, '').trim();
  }
  
  let name = translateName(item.name);

  return {
    ...item,
    parentCategoryName: parent,
    categoryName: cat,
    name: name
  };
});

// Combine
const combinedData = [...beadsData, ...newTranslatedData];

// Write back to temp_data.json
fs.writeFileSync(oldDataPath, JSON.stringify({ data: combinedData }, null, 2), 'utf8');
console.log('Merged and translated successfully. Total items:', combinedData.length);
