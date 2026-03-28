const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const logs = [];
  page.on('console', msg => logs.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`));

  await page.goto('http://localhost:3000/ide', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  await page.locator("button[aria-label='Sovereign Arsenal']").click();
  await page.waitForTimeout(2500);
  const arsenalText = await page.locator('body').innerText();

  await page.locator("button[aria-label='Extensions']").click();
  await page.waitForTimeout(1500);
  const extensionsText = await page.locator('body').innerText();

  console.log(JSON.stringify({
    arsenalHasToolkit: arsenalText.includes('Toolkit') || arsenalText.includes('Arsenal') || arsenalText.includes('WebRTC Candidate Audit') || arsenalText.includes('LOCAL ONLY'),
    extensionsHasLocalCapabilities: extensionsText.includes('LOCAL CAPABILITIES'),
    blackScreenLikely: extensionsText.replace(/\s+/g, '').length < 80 || arsenalText.replace(/\s+/g, '').length < 80,
    logs: logs.slice(-30),
    arsenalSnippet: arsenalText.slice(0, 2500),
    extensionsSnippet: extensionsText.slice(0, 2500),
  }, null, 2));

  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
