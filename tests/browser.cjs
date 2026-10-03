const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.env.SITE_URL || 'http://127.0.0.1:4184/';
const executablePath = process.env.CHROME_PATH;

(async () => {
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => console.error('desktop request failed:', request.url(), request.failure()?.errorText));
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const homeResponse = await page.goto(base, { waitUntil: 'networkidle' });
  try { await page.locator('.paper-card').first().waitFor({ timeout: 5000 }); }
  catch (error) { console.error(JSON.stringify({ status: homeResponse?.status(), url: page.url(), errors, papers: await page.evaluate(() => window.CCAF_MOCKS?.papers.map(p => p.id)), resources: await page.evaluate(() => performance.getEntriesByType('resource').filter(x => x.name.includes('/exams/')).map(x => [x.name, x.responseStatus])), body: (await page.locator('body').innerText()).slice(0, 250) })); throw error; }
  assert.equal(await page.locator('.paper-card').count(), 4);
  const audit = await page.evaluate(() => {
    const data = window.CCAF_MOCKS;
    return data.papers.map(paper => {
      const items = paper.scenarios.flatMap(s => s.questions);
      const counts = Object.fromEntries(data.domains.map(d => [d.id, items.filter(q => q.domain === d.id).length]));
      return { scenarios: paper.scenarios.map(s => s.questions.length), items: items.length, counts, objectives: new Set(items.map(q => q.objective)).size, multi: items.filter(q => q.correct.length > 1).length };
    });
  });
  audit.forEach(row => {
    assert.deepEqual(row.scenarios, [15, 15, 15, 15]);
    assert.equal(row.items, 60);
    assert.deepEqual(row.counts, { '1': 16, '2': 11, '3': 12, '4': 12, '5': 9 });
    assert.equal(row.objectives, 30);
    assert.ok(row.multi >= 4);
  });
  await page.screenshot({ path: '/tmp/ccaf-mocks-home-desktop.png' });

  await page.goto(base + '#setup/paper-1');
  assert.equal(await page.locator('.mode-card').count(), 2);
  await page.locator('[data-action="start"]').click();
  await page.waitForFunction(() => location.hash === '#exam/paper-1');
  assert.equal(await page.locator('.answer-option').count(), 4);
  assert.equal(await page.locator('.number-grid button').count(), 60);
  assert.match(await page.locator('#header-timer').innerText(), /^(02:00:00|01:59:\d\d)$/);
  await page.screenshot({ path: '/tmp/ccaf-mocks-question-desktop.png' });
  const correct1 = await page.evaluate(() => window.CCAF_MOCKS.papers[0].scenarios[0].questions[0].correct);
  for (const answer of correct1) await page.locator(`[data-choice="${answer}"]`).click();
  assert.equal(await page.locator('.feedback').count(), 0);
  await page.locator('[data-action="check"]').click();
  assert.match(await page.locator('.feedback').innerText(), /Correct/);
  assert.equal(await page.locator('.answer-option:not([disabled])').count(), 0);
  await page.reload();
  assert.match(await page.locator('.feedback').innerText(), /Correct/);
  await page.locator('[data-action="next"]').click();
  assert.match(await page.locator('.question-meta').innerText(), /Question 2 of 60/);
  await page.locator('[data-action="confirm-submit"]').click();
  assert.equal(await page.locator('#confirm-dialog').isVisible(), true);
  await page.locator('#confirm-dialog [value="confirm"]').click();
  await page.waitForFunction(() => location.hash === '#results/paper-1');
  assert.match(await page.locator('.result-score').innerText(), /1\/60/);
  assert.equal(await page.locator('.review-item').count(), 60);
  await page.screenshot({ path: '/tmp/ccaf-mocks-results-desktop.png' });

  await page.goto(base + '#setup/paper-1');
  await page.locator('[data-action="start"]').click();
  const threeIndex = await page.evaluate(() => window.CCAF_MOCKS.papers[0].scenarios.flatMap(s => s.questions).findIndex(q => q.correct.length === 3));
  await page.locator(`[data-jump="${threeIndex}"]`).click();
  assert.match(await page.locator('.select-instruction').innerText(), /Select THREE/);
  const threeAnswers = await page.evaluate(index => window.CCAF_MOCKS.papers[0].scenarios.flatMap(s => s.questions)[index].correct, threeIndex);
  for (const answer of threeAnswers) await page.locator(`[data-choice="${answer}"]`).click();
  const fourth = [0, 1, 2, 3, 4].find(index => !threeAnswers.includes(index));
  await page.locator(`[data-choice="${fourth}"]`).click();
  assert.equal(await page.locator('.answer-option.selected').count(), 3);
  await page.locator('[data-action="check"]').click();
  assert.match(await page.locator('.feedback').innerText(), /Correct/);

  await page.goto(base + '#setup/paper-2');
  await page.locator('input[value="end"]').check();
  await page.locator('[data-action="start"]').click();
  await page.waitForFunction(() => location.hash === '#exam/paper-2');
  const correct2 = await page.evaluate(() => window.CCAF_MOCKS.papers[1].scenarios[0].questions[0].correct);
  for (const answer of correct2) await page.locator(`[data-choice="${answer}"]`).click();
  assert.equal(await page.locator('.feedback').count(), 0);
  await page.locator('[data-action="next"]').click();
  assert.equal(await page.locator('.feedback').count(), 0);
  await page.reload();
  assert.match(await page.locator('.question-meta').innerText(), /Question 2 of 60/);
  await page.locator('[data-jump="0"]').click();
  for (const answer of correct2) assert.equal(await page.locator(`[data-choice="${answer}"]`).getAttribute('aria-pressed'), 'true');
  await page.locator('[data-action="confirm-submit"]').click();
  await page.locator('#confirm-dialog [value="confirm"]').click();
  await page.waitForFunction(() => location.hash === '#results/paper-2');
  assert.match(await page.locator('#review-1 .review-rationale').innerText(), /./);
  await page.locator('[data-filter="missed"]').click();
  assert.equal(await page.locator('.review-item').count(), 59);

  await page.goto(base + '#setup/paper-3');
  await page.locator('input[value="end"]').check();
  await page.locator('[data-action="start"]').click();
  await page.evaluate(() => {
    const key = 'ccaf-mocks-attempts-v1'; const attempts = JSON.parse(localStorage.getItem(key));
    attempts['paper-3'].startedAt = Date.now() - 121 * 60 * 1000;
    localStorage.setItem(key, JSON.stringify(attempts));
  });
  await page.reload();
  await page.waitForFunction(() => location.hash === '#results/paper-3');
  assert.match(await page.locator('.results>p').innerText(), /timer expired/);

  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const phone = await phoneContext.newPage();
  phone.on('pageerror', error => { errors.push(error.message); console.error('mobile pageerror:', error.message); });
  phone.on('requestfailed', request => console.error('mobile request failed:', request.url(), request.failure()?.errorText));
  const mobileResponse = await phone.goto(base + '#setup/paper-4', { waitUntil: 'networkidle' });
  try { await phone.locator('input[value="end"]').waitFor({ timeout: 5000 }); }
  catch (error) { console.error(JSON.stringify({ status: mobileResponse?.status(), url: phone.url(), errors, body: (await phone.locator('body').innerText()).slice(0, 250) })); throw error; }
  await phone.screenshot({ path: '/tmp/ccaf-mocks-setup-mobile.png' });
  await phone.locator('input[value="end"]').check();
  await phone.locator('[data-action="start"]').click();
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await phone.screenshot({ path: '/tmp/ccaf-mocks-question-mobile.png' });
  await phone.locator('[data-action="open-nav"]').click();
  await phone.waitForTimeout(220);
  await phone.screenshot({ path: '/tmp/ccaf-mocks-nav-mobile.png' });
  assert.equal(await phone.locator('.question-nav').evaluate(el => el.classList.contains('open')), true);
  await phone.locator('[data-jump="59"]').click();
  assert.match(await phone.locator('.question-meta').innerText(), /Question 60 of 60/);
  assert.equal(await phone.locator('.question-nav').evaluate(el => el.classList.contains('open')), false);
  const mobileThree = await phone.evaluate(() => window.CCAF_MOCKS.papers[3].scenarios.flatMap(s => s.questions).findIndex(q => q.correct.length === 3));
  await phone.locator('[data-action="open-nav"]').click();
  await phone.locator(`[data-jump="${mobileThree}"]`).click();
  assert.match(await phone.locator('.select-instruction').innerText(), /Select THREE/);
  const mobileThreeAnswers = await phone.evaluate(index => window.CCAF_MOCKS.papers[3].scenarios.flatMap(s => s.questions)[index].correct, mobileThree);
  for (const answer of mobileThreeAnswers) await phone.locator(`[data-choice="${answer}"]`).click();
  assert.equal(await phone.locator('.feedback').count(), 0);
  assert.equal(await phone.locator('.answer-option.selected').count(), 3);
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ papers: audit.length, items: audit.reduce((n, row) => n + row.items, 0), modes: ['immediate', 'end'], timer: 'pass', desktop: 'pass', mobile: 'pass', errors }));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
