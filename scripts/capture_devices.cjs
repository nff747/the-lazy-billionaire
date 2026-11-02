const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required']
  });

  // 1. Tablet Portrait (7-inch tablet: 1200 x 1920)
  const tab7Ctx = await browser.newContext({
    viewport: { width: 600, height: 960 },
    deviceScaleFactor: 2.0 // 1200 x 1920
  });
  const page7 = await tab7Ctx.newPage();
  await page7.goto('http://127.0.0.1:5173/');
  await page7.waitForSelector('button:has-text("Play as Guest")', { timeout: 12000 });
  await page7.click('button:has-text("Play as Guest")');
  await page7.waitForTimeout(2500);
  try {
    const closeBtn = await page7.$('div[class*="z-[9700]"] button:has-text("✕")');
    if (closeBtn) await closeBtn.click();
  } catch (e) {}
  await page7.waitForTimeout(1000);
  console.log('Capturing 7-inch tablet screens...');
  await page7.screenshot({ path: 'store-assets/raw/tablet/tab7_1_empire.png' });
  await page7.click('button:has-text("MARKET")');
  await page7.waitForTimeout(1500);
  await page7.screenshot({ path: 'store-assets/raw/tablet/tab7_2_market.png' });
  await tab7Ctx.close();

  // 2. Tablet Landscape (10-inch tablet / Chromebook / Desktop: 1920 x 1200)
  const tab10Ctx = await browser.newContext({
    viewport: { width: 960, height: 600 },
    deviceScaleFactor: 2.0 // 1920 x 1200
  });
  const page10 = await tab10Ctx.newPage();
  await page10.goto('http://127.0.0.1:5173/');
  await page10.waitForSelector('button:has-text("Play as Guest")', { timeout: 12000 });
  await page10.click('button:has-text("Play as Guest")');
  await page10.waitForTimeout(2500);
  try {
    const closeBtn = await page10.$('div[class*="z-[9700]"] button:has-text("✕")');
    if (closeBtn) await closeBtn.click();
  } catch (e) {}
  await page10.waitForTimeout(1000);
  console.log('Capturing 10-inch tablet / Chromebook screens...');
  await page10.screenshot({ path: 'store-assets/raw/tablet/tab10_1_empire.png' });
  await page10.click('button:has-text("MARKET")');
  await page10.waitForTimeout(1500);
  await page10.screenshot({ path: 'store-assets/raw/tablet/tab10_2_market.png' });
  await tab10Ctx.close();

  await browser.close();
  console.log('All tablet device captures complete!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
