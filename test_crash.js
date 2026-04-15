const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:6662', { waitUntil: 'networkidle0' });
  
  // Wait for the beads to load
  await page.waitForSelector('.grid > div');
  await page.screenshot({ path: 'test_before.png' });
  
  console.log("Adding bead...");
  // click the first bead in the grid
  await page.evaluate(() => {
    document.querySelector('.grid > div').click();
  });
  
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'test_after.png' });
  
  console.log("Checking errors...");
  
  await browser.close();
})();