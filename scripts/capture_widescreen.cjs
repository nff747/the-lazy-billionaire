const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required']
  });

  // 1. Tablet Landscape Context (10-inch Tablet / Chromebook / Desktop): 1920 x 1200
  const tabletCtx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2.0 // results in 2560 x 1600 px native
  });
  const page = await tabletCtx.newPage();

  console.log('Navigating to game on tablet/desktop view...');
  await page.goto('http://127.0.0.1:5173/');

  // Wait for auth screen
  await page.waitForSelector('button:has-text("Play as Guest")', { timeout: 12000 });
  await page.screenshot({ path: 'store-assets/raw/tablet/screen_auth.png' });

  // Click Play as Guest
  await page.click('button:has-text("Play as Guest")');
  await page.waitForTimeout(2500);

  // Dismiss daily modal if present
  try {
    const closeBtn = await page.$('div[class*="z-[9700]"] button:has-text("✕")');
    if (closeBtn) await closeBtn.click();
  } catch (e) {}

  await page.waitForTimeout(1000);

  // Screen 1: Empire
  console.log('Capturing Tablet Screen 1: EMPIRE...');
  await page.screenshot({ path: 'store-assets/raw/tablet/screen_1_empire.png' });

  // Screen 2: Market
  console.log('Capturing Tablet Screen 2: MARKET...');
  await page.click('button:has-text("MARKET")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'store-assets/raw/tablet/screen_2_market.png' });

  // Screen 3: Net (Syndicate)
  console.log('Capturing Tablet Screen 3: NET...');
  await page.click('button:has-text("NET")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'store-assets/raw/tablet/screen_3_net.png' });

  // Screen 4: Shop
  console.log('Capturing Tablet Screen 4: SHOP...');
  await page.click('button:has-text("SHOP")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'store-assets/raw/tablet/screen_4_shop.png' });

  await browser.close();
  console.log('Widescreen captures complete!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
