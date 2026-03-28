const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  await page.goto('http://localhost:3000/ide', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.locator("button[aria-label='HAVEN AI']").click();
  await page.waitForTimeout(1200);
  await page.locator("button[aria-label^='AI Status:']").click();
  await page.waitForTimeout(5000);

  const elements = await page.locator('input, textarea, [contenteditable="true"]').evaluateAll(nodes =>
    nodes.map((n, i) => ({
      i,
      tag: n.tagName,
      type: n.getAttribute('type'),
      placeholder: n.getAttribute('placeholder'),
      aria: n.getAttribute('aria-label'),
      cls: n.className,
      text: (n.innerText || '').trim().slice(0, 100),
    }))
  );

  console.log(JSON.stringify(elements, null, 2));
  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
