const puppeteer = require('puppeteer');
const path = require('path');

const templates = [
  { file: 'index.html', out: 'preview_tpl1.png' },
  { file: 'record.html', out: 'preview_tpl2.png' },
  { file: 'record2.html', out: 'preview_tpl3.png' },
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  for (const tpl of templates) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 0.25 });

    await page.goto('file://' + path.resolve(__dirname, tpl.file) + '?name=Preview', { waitUntil: 'networkidle0' });

    // Bypass gate + video intro, show card directly
    await page.evaluate(() => {
      // Remove gate
      const gate = document.querySelector('.gate');
      if (gate) gate.remove();
      // Remove video overlay
      const intro = document.querySelector('.intro-overlay');
      if (intro) intro.remove();
      // Unpause animations
      const wrap = document.querySelector('.wrap');
      if (wrap) wrap.classList.remove('anim-paused');
    });

    // Wait for animations to play
    await new Promise(r => setTimeout(r, 12000));

    // Screenshot the card element
    const card = await page.$('.card');
    if (card) {
      await card.screenshot({ path: path.resolve(__dirname, tpl.out), type: 'png' });
    } else {
      await page.screenshot({ path: path.resolve(__dirname, tpl.out), type: 'png' });
    }
    console.log(`✅ ${tpl.out} saved`);
    await page.close();
  }

  await browser.close();
})();
