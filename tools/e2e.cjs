// Minimal smoke test: one customer as "Cliente" (level 1, exact coins) and one as "Caissière" (level 5, numpad + change).
// Usage: serve the folder on :8772, then NODE_PATH=/workspace/geo-party-build/node_modules node tools/e2e.cjs
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8772/';
const SHOTS = __dirname + '/../screens/';
let fails = 0; const check = (c, m) => { if (!c) { fails++; console.error('FAIL:', m); } else console.log('ok:', m); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const phase = (page, ph) => page.waitForFunction(p => window.__boul && window.__boul.phase === p, ph, { timeout: 10000 });
function subset(coins, target) { // returns list of values summing to target
  const best = new Map([[0, []]]);
  for (const c of coins) for (const [s, l] of Array.from(best)) if (s + c <= target && !best.has(s + c)) best.set(s + c, l.concat(c));
  return best.get(target);
}
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (!r.url().startsWith(BASE)) errors.push('external request: ' + r.url()); });
  await page.goto(BASE); await page.evaluate(() => localStorage.clear()); await page.reload();
  // ---- Cliente, level 1 ----
  await page.click('#levels button >> nth=0'); await page.click('.role[data-role="client"]'); await phase(page, 'shop');
  const p1 = await page.evaluate(() => window.__boul.p);
  for (const l of p1.lines) for (let i = 0; i < l.q; i++) { await page.click(`.prod[data-id="${l.prod.id}"]`, { force: true }); await sleep(150); }
  await phase(page, 'pay');
  const purse = await page.$$eval('#bottom .money', els => els.map(e => +e.dataset.v));
  const pay = subset(purse, p1.total); check(!!pay, 'purse can pay ' + p1.total + ' with ' + purse.join(','));
  for (let i = 0; i < pay.length; i++) { await page.click(`#bottom .money[data-v="${pay[i]}"]`, { force: true }); await sleep(200);
    if (i === pay.length - 2 || pay.length === 1) await page.screenshot({ path: SHOTS + '01-cliente-ipad.png' }); }
  await page.waitForFunction(() => window.__boul.done === 1, null, { timeout: 8000 });
  check(true, 'cliente: bought ' + p1.lines.map(l => l.q + '×' + l.prod.id).join('+') + ' = ' + p1.total + ' kr, paid ' + pay.join('+'));
  // ---- Caissière, level 5 ----
  await page.click('#home'); await page.click('#levels button >> nth=4'); await page.click('.role[data-role="cashier"]'); await phase(page, 'ring');
  const p2 = await page.evaluate(() => window.__boul.p);
  check(await page.isVisible('.numpad'), 'numpad shown at level 5');
  for (const d of String(p2.total)) { await page.click(`#bottom .keys button[data-k="${d}"]`); await sleep(80); }
  await page.click('#bottom .keys button[data-k="✅"]');
  await phase(page, 'receive'); await page.click('#bubble .take', { force: true });
  await phase(page, 'give');
  const ch = []; let v = p2.change; for (const d of [20, 10, 5, 2, 1]) while (v >= d) { ch.push(d); v -= d; }
  for (let i = 0; i < ch.length; i++) { await page.click(`#bottom .money[data-v="${ch[i]}"]`, { force: true }); await sleep(200);
    if (i === ch.length - 2 || ch.length === 1) { await page.click('#hintBtn'); await sleep(300); await page.screenshot({ path: SHOTS + '02-caissiere-ipad.png' }); await page.click('#hint'); } }
  await page.waitForFunction(() => window.__boul.done === 1, null, { timeout: 8000 });
  check(p2.change === p2.pay - p2.total && p2.change > 0, 'caissière: ' + p2.total + ' kr, paid ' + p2.pay + ', gave back ' + ch.join('+') + ' = ' + p2.change);
  check(errors.length === 0, 'no page errors / external requests ' + errors.join(' | '));
  await browser.close(); console.log(fails ? fails + ' FAILED' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
