const fs = require('fs');

const dataPath = './public/temp_data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// More Dictionaries
const categoryMap = {
  "随型水晶": "Irregular Quartz",
  "随形水晶": "Irregular Quartz",
  "柠檬晶": "Lemon Quartz",
  "随形": "Irregular ",
  "随型": "Irregular ",
  "算盘": "Abacus ",
  "方糖": "Cube ",
  "方块": "Square ",
  "南瓜": "Pumpkin ",
  "貔貅": "Pixiu ",
  "莲花": "Lotus ",
  "狐狸": "Fox ",
  "猫爪": "Cat Paw ",
  "圆珠": "Round Bead ",
  "水滴": "Water Drop ",
  "小": "Small ",
  "大": "Large ",
  "中": "Medium ",
  "微": "Micro "
};

function translateName(name) {
  if (!name) return name;
  let translated = name;
  
  for (const [cn, en] of Object.entries(categoryMap)) {
    if (translated.includes(cn)) {
      translated = translated.replace(new RegExp(cn, 'g'), en);
    }
  }

  return translated.trim();
}

if (data.data && Array.isArray(data.data)) {
  data.data.forEach(item => {
    if (item.categoryName) {
      item.categoryName = translateName(item.categoryName);
    }
    if (item.name) {
      item.name = translateName(item.name);
    }
  });
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Pass 2 Translation complete!');