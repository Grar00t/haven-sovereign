const { chromium } = require('playwright');

const TARGET_URL = 'http://127.0.0.1:4173/ide';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleMessages.push(`[pageerror] ${err.stack || err.message}`));

  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: 'C:/Users/Iqd20/OneDrive/OFFICIAL/playwright-ide-home.png', fullPage: true });
  console.log('TITLE:', await page.title());
  console.log('URL:', page.url());
  console.log('BUTTONS:', await page.locator('button').count());
  const sample = await page.locator('button').evaluateAll(btns => btns.slice(0, 20).map(b => ({ text: b.textContent?.trim(), title: b.getAttribute('title'), aria: b.getAttribute('aria-label') })));
  console.log('BUTTON_SAMPLE:', JSON.stringify(sample, null, 2));
  console.log('MESSAGES_START');
  for (const m of consoleMessages) console.log(m);
  console.log('MESSAGES_END');
  await browser.close();
})();
