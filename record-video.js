const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CARD_W = 1080;
const CARD_H = 1920;
const FPS = 30;
const DURATION_SEC = 14;
const TOTAL_FRAMES = FPS * DURATION_SEC;
const FRAMES_DIR = path.join(__dirname, '_frames');
const OUTPUT = path.join(__dirname, 'thiepmoi_theritual_template.mp4');

(async () => {
  if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR);

  console.log('🚀 Launching Chrome...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: [`--window-size=${CARD_W},${CARD_H}`]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: CARD_W, height: CARD_H, deviceScaleFactor: 1 });

  // Pause all animations BEFORE page loads via CSS
  await page.evaluateOnNewDocument(() => {
    document.addEventListener('DOMContentLoaded', () => {
      // Immediately pause all animations
      document.getAnimations().forEach(a => a.pause());
    });
  });

  console.log('📄 Loading invitation page...');
  await page.goto('file://' + path.join(__dirname, 'record.html'), { waitUntil: 'networkidle0' });

  // Wait for images
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(r => { img.onload = r; img.onerror = r; });
      })
    );
  });

  // Pause all animations and set to time 0
  await page.evaluate(() => {
    document.getAnimations().forEach(a => {
      a.pause();
      a.currentTime = 0;
    });
  });

  console.log('🎬 Recording ' + TOTAL_FRAMES + ' frames (' + DURATION_SEC + 's @ ' + FPS + 'fps)...');

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const timeMs = (i / FPS) * 1000; // current time in milliseconds

    // Set all animations to exact time position
    await page.evaluate((ms) => {
      document.getAnimations().forEach(a => {
        a.currentTime = ms;
        a.pause();
      });
    }, timeMs);

    // Take screenshot
    const frameNum = String(i).padStart(5, '0');
    await page.screenshot({
      path: path.join(FRAMES_DIR, `frame_${frameNum}.png`),
      fullPage: false,
      clip: { x: 0, y: 0, width: CARD_W, height: CARD_H }
    });

    if (i % FPS === 0) {
      const sec = Math.round(timeMs / 1000);
      console.log(`  ⏱  ${sec}s / ${DURATION_SEC}s  (frame ${i}/${TOTAL_FRAMES})`);
    }
  }

  console.log('✅ All frames captured!');
  await browser.close();

  console.log('🎥 Encoding MP4 (H.264 high quality)...');
  const { execSync } = require('child_process');
  execSync(
    `ffmpeg -y -framerate ${FPS} -i "${FRAMES_DIR}/frame_%05d.png" ` +
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p ` +
    `-vf "scale=1080:1920" "${OUTPUT}"`,
    { stdio: 'inherit' }
  );

  // Cleanup
  fs.rmSync(FRAMES_DIR, { recursive: true });

  const stats = fs.statSync(OUTPUT);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
  console.log(`\n🎉 Done! Output: ${OUTPUT}`);
  console.log(`   Resolution: ${CARD_W}×${CARD_H}`);
  console.log(`   Duration: ${DURATION_SEC}s @ ${FPS}fps`);
  console.log(`   Size: ${sizeMB} MB`);
})();
