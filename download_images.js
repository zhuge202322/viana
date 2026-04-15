const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const dataPath = path.join(__dirname, 'public/temp_data.json');
const imgDir = path.join(__dirname, 'public/images/beads');

if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let toDownload = [];
data.data.forEach(item => {
  if (item.image && item.image.startsWith('http')) {
    // some images might have query params, strip them for filename
    const urlObj = new URL(item.image);
    const filename = path.basename(urlObj.pathname);
    const localPath = path.join(imgDir, filename);
    
    // Only download if it doesn't already exist locally
    if (!fs.existsSync(localPath)) {
      toDownload.push({ url: item.image, localPath, filename });
    }
  }
});

// Remove duplicates by URL just in case
const uniqueDownloads = Array.from(new Map(toDownload.map(item => [item.url, item])).values());

console.log(`Found ${uniqueDownloads.length} unique new images to download.`);

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
        if (res.statusCode === 301 || res.statusCode === 302) {
           return downloadImage(res.headers.location, dest).then(resolve).catch(reject);
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        res.resume(); // consume response data to free up memory
        reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
      }
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    // Set a timeout to avoid hanging
    req.setTimeout(10000, () => {
        req.abort();
        reject(new Error('Request Timeout'));
    });
  });
}

async function downloadAll() {
  const BATCH_SIZE = 10;
  for (let i = 0; i < uniqueDownloads.length; i += BATCH_SIZE) {
    const batch = uniqueDownloads.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (item, idx) => {
      const currentIdx = i + idx + 1;
      try {
        await downloadImage(item.url, item.localPath);
        console.log(`[${currentIdx}/${uniqueDownloads.length}] Downloaded ${item.filename}`);
      } catch (err) {
        console.error(`[${currentIdx}/${uniqueDownloads.length}] Failed to download ${item.filename}: ${err.message}`);
      }
    }));
  }
  console.log('All downloads completed!');
}

downloadAll();
