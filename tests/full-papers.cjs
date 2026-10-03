const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.SITE_URL || 'http://127.0.0.1:4184/';
const executablePath = process.env.CHROME_PATH;

(async () => {
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const page = await browser.newPage({ viewport: { width: 1365, height: 820 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (let paperNumber = 1; paperNumber <= 4; paperNumber++) {
    await page.goto(base + `#setup/paper-${paperNumber}`);
    await page.locator('input[value="end"]').check();
    await page.locator('[data-action="start"]').click();
    const answerKey = await page.evaluate(index => window.CCAF_MOCKS.papers[index].scenarios.flatMap(s => s.questions).map(q => q.correct), paperNumber - 1);
    for (let index = 0; index < 60; index++) {
      assert.match(await page.locator('.question-meta').innerText(), new RegExp(`Question ${index + 1} of 60`));
      for (const choice of answerKey[index]) await page.locator(`[data-choice="${choice}"]`).click();
      assert.equal(await page.locator('.feedback').count(), 0);
      await page.locator('[data-action="next"]').click();
      if (index === 59) await page.locator('#confirm-dialog [value="confirm"]').click();
    }
    await page.waitForFunction(expected => location.hash === `#results/paper-${expected}`, paperNumber);
    assert.match(await page.locator('.result-score').innerText(), /60\/60/);
    assert.equal(await page.locator('.review-item').count(), 60);
    console.log(`paper-${paperNumber}: 60/60 interaction and scoring pass`);
  }
  assert.deepEqual(errors, []);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
