const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required']
  });
  
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625
  });
  const page = await context.newPage();

  console.log('Navigating to game...');
  await page.goto('http://127.0.0.1:5173/');

  // Wait for auth screen
  await page.waitForSelector('button:has-text("Play as Guest")', { timeout: 12000 });

  // Click Play as Guest
  await page.click('button:has-text("Play as Guest")');
  await page.waitForTimeout(2500);

  // Dismiss daily modal if present
  try {
    const closeBtn = await page.$('div[class*="z-[9700]"] button:has-text("✕")');
    if (closeBtn) await closeBtn.click();
  } catch (e) {}

  await page.waitForTimeout(1000);

  // Screen 1: EMPIRE
  console.log('Capturing Screen 1: EMPIRE...');
  await page.screenshot({ path: 'store-assets/raw/screen_1_empire.png' });

  // Screen 2: MARKET
  console.log('Capturing Screen 2: MARKET...');
  await page.click('button:has-text("MARKET")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'store-assets/raw/screen_2_market.png' });

  // In Market, click BTC card to show candlestick chart modal
  const btcCard = await page.$('div:has-text("BTC")');
  if (btcCard) {
    console.log('Opening BTC Stock/Crypto chart...');
    await btcCard.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'store-assets/raw/screen_2b_chart.png' });
    // Go back
    const backBtn = await page.$('button:has-text("←")');
    if (backBtn) await backBtn.click();
    await page.waitForTimeout(1000);
  }

  // Screen 4: SHOP
  console.log('Capturing Screen 4: SHOP...');
  await page.click('button:has-text("SHOP")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'store-assets/raw/screen_4_shop.png' });

  // Screen 5: STATUS
  console.log('Capturing Screen 5: STATUS...');
  await page.click('button:has-text("STATUS")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'store-assets/raw/screen_5_status.png' });

  await browser.close();
  console.log('ALL SCREENS CAPTURED WITH DYNAMIC CONTENT!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
