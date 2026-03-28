const { chromium } = require('playwright');

const TARGET_URL = 'http://127.0.0.1:4173/ide';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const messages = [];
  page.on('console', msg => messages.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => messages.push(`[pageerror] ${err.stack || err.message}`));

  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByLabel('Sovereign Arsenal').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/Iqd20/OneDrive/OFFICIAL/playwright-arsenal.png', fullPage: true });
  await page.getByRole('button', { name: /Toolkit/i }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/Iqd20/OneDrive/OFFICIAL/playwright-toolkit.png', fullPage: true });
  console.log('URL:', page.url());
  console.log('BODY_TEXT_START');
  console.log((await page.locator('body').innerText()).slice(0, 4000));
  console.log('BODY_TEXT_END');
  console.log('MESSAGES_START');
  for (const m of messages) console.log(m);
  console.log('MESSAGES_END');
  await browser.close();
})();
