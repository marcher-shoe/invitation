const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

  const filePath = 'file://' + path.resolve(__dirname, 'record.html');
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // Wait for all animations to finish (10s should show everything)
  await new Promise(r => setTimeout(r, 12000));

  // Screenshot just the card element
  const card = await page.$('.card');
  await card.screenshot({
    path: path.resolve(__dirname, 'thiep_the_ritual.png'),
    type: 'png'
  });

  console.log('✅ PNG exported: thiep_the_ritual.png (1080×1920)');
  await browser.close();
})();
