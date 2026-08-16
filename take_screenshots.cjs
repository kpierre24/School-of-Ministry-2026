const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'ss_top.png' });

  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'ss_mid1.png' });

  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'ss_mid2.png' });

  await page.evaluate(() => window.scrollBy(0, 900));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'ss_bot.png' });

  await browser.close();
  console.log('Screenshots saved.');
})();
