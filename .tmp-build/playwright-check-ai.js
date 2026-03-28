const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const logs = [];

  page.on('console', msg => logs.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`));

  await page.goto('http://localhost:3000/ide', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  await page.locator("button[aria-label='HAVEN AI']").click({ timeout: 10000 });
  await page.waitForTimeout(1200);
  const bodyAfterAi = await page.locator('body').innerText();

  let clickedOffline = false;
  const offlineBtn = page.locator("button[aria-label^='AI Status:']");
  if (await offlineBtn.count()) {
    await offlineBtn.click();
    clickedOffline = true;
    await page.waitForTimeout(9000);
  }

  const bodyAfterConnect = await page.locator('body').innerText();
  const textareaCount = await page.locator('textarea').count();

  const screenshot = 'C:/Users/Iqd20/OneDrive/OFFICIAL/.tmp-build/ai-panel-connected.png';
  await page.screenshot({ path: screenshot, fullPage: true });

  console.log(JSON.stringify({
    clickedOffline,
    textareaCount,
    bodyAfterAi: bodyAfterAi.slice(0, 2000),
    bodyAfterConnect: bodyAfterConnect.slice(0, 3000),
    logs: logs.slice(-25),
    screenshot,
  }, null, 2));

  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
