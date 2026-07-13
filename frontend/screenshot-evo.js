const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('ERR:', msg.text());
  });

  // 1. Login as RS (Responsable Support)
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.fill('#username', 'rs_support');
  await page.fill('#password', 'support123');
  await page.click('button.btn-primary');
  await page.waitForTimeout(8000);
  console.log('URL after login:', page.url());

  // 2. Click Power BI tab
  const pbiTab = page.locator('button:has-text("Power BI")').first();
  if (await pbiTab.isVisible().catch(() => false)) {
    console.log('Found Power BI tab');
    await pbiTab.click();
    await page.waitForTimeout(5000);
  } else {
    console.log('Power BI tab NOT found');
    const btns = await page.locator('button').allTextContents();
    console.log('Buttons:', btns.filter(t => t.trim().length > 0).slice(0, 20));
    await browser.close();
    return;
  }

  await page.screenshot({ path: 'C:/Users/EmsiC/Desktop/Temp/evo-1-pbi.png', fullPage: false });

  // 3. Click "Évolution complète" sub-tab
  const evoTab = page.locator('button:has-text("volution")').first();
  if (await evoTab.isVisible().catch(() => false)) {
    console.log('Found Evolution tab');
    await evoTab.click();
    await page.waitForTimeout(6000);
  } else {
    console.log('Evolution tab NOT found');
    const btns = await page.locator('button').allTextContents();
    console.log('All buttons:', btns.filter(t => t.trim().length > 0 && t.trim().length < 50));
  }

  // 4. Screenshot header with selectors
  await page.screenshot({ path: 'C:/Users/EmsiC/Desktop/Temp/evo-2-header.png', fullPage: false });
  console.log('Screenshot: header + month selectors');

  // 5. Scroll to bar charts
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/EmsiC/Desktop/Temp/evo-3-bars.png', fullPage: false });
  console.log('Screenshot: bar charts');

  // 6. Scroll to radar/decision
  await page.evaluate(() => window.scrollTo(0, 1100));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/EmsiC/Desktop/Temp/evo-4-radar.png', fullPage: false });
  console.log('Screenshot: radar + decision');

  // 7. Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, 1800));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/EmsiC/Desktop/Temp/evo-5-bottom.png', fullPage: false });
  console.log('Screenshot: bottom section');

  // 8. Full page
  await page.screenshot({ path: 'C:/Users/EmsiC/Desktop/Temp/evo-full.png', fullPage: true });
  console.log('All screenshots done!');

  await browser.close();
})();
