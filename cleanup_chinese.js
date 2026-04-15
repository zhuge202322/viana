const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public/temp_data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

if (data.data && Array.isArray(data.data)) {
  data.data.forEach(item => {
    if (item.name) {
      item.name = item.name.replace(/[\u4e00-\u9fa5]/g, '').replace(/\s+/g, ' ').trim();
      if (!item.name) item.name = item.parentCategoryName + ' Item';
    }
    if (item.categoryName) {
      item.categoryName = item.categoryName.replace(/[\u4e00-\u9fa5]/g, '').replace(/\s+/g, ' ').trim();
      if (!item.categoryName) item.categoryName = 'Other';
    }
  });
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Chinese characters stripped successfully.');
