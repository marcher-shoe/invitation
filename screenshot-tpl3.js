const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 0.25 });

  await page.goto('file://' + path.resolve(__dirname, 'record2.html') + '?name=Preview', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 12000));
  const card = await page.$('.card');
  if (card) {
    await card.screenshot({ path: path.resolve(__dirname, 'preview_tpl3.png'), type: 'png' });
    console.log('✅ Template 3 preview saved');
  } else {
    await page.screenshot({ path: path.resolve(__dirname, 'preview_tpl3.png'), type: 'png' });
    console.log('✅ Template 3 preview saved (fullpage)');
  }

  await browser.close();
})();
