const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const logs = [];
  page.on('console', msg => logs.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`));

  await page.goto('http://localhost:3000/ide', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.locator("button[aria-label='HAVEN AI']").click();
  await page.waitForTimeout(1200);
  await page.locator("button[aria-label^='AI Status:']").click();
  await page.waitForTimeout(6000);

  const input = page.locator("input[placeholder*='Ask HAVEN AI']").first();
  const prompt = 'اعطني 3 نقاط قصيرة فقط عن حالة المشروع الحالية';
  await input.fill(prompt);

  const before = await page.locator('body').innerText();
  const started = Date.now();
  await input.press('Enter');

  let body = before;
  let detected = false;
  while (Date.now() - started < 30000) {
    await page.waitForTimeout(1000);
    body = await page.locator('body').innerText();
    if (body.includes('You') || body.includes(prompt) || body.includes('الفص')) {
      if (body !== before && (body.includes('You') || body.includes(prompt))) {
        detected = true;
        break;
      }
    }
  }

  const elapsedMs = Date.now() - started;
  const screenshot = 'C:/Users/Iqd20/OneDrive/OFFICIAL/.tmp-build/ai-response-measure.png';
  await page.screenshot({ path: screenshot, fullPage: true });

  console.log(JSON.stringify({
    detected,
    elapsedMs,
    snippet: body.slice(0, 3500),
    logs: logs.slice(-30),
    screenshot,
  }, null, 2));

  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
