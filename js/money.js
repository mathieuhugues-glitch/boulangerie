/* La boulangerie / Bageriet - money (SEK), products and problem generator. Pure logic: also runs in Node (tools/check.cjs). */
(function (root) {
  'use strict';
  const BUN = '<svg viewBox="0 0 100 100" class="bun"><circle cx="50" cy="54" r="40" fill="#c9843f"/><circle cx="50" cy="50" r="40" fill="#e0a35c"/>' +
    '<path d="M50 50 m0 -4 a4 4 0 1 1 -4 6 a10 10 0 1 1 16 -10 a18 18 0 1 1 -28 20 a26 26 0 1 1 42 -30" fill="none" stroke="#8a4f1d" stroke-width="7" stroke-linecap="round"/>' +
    '<g fill="#fff"><circle cx="30" cy="30" r="3"/><circle cx="66" cy="28" r="3"/><circle cx="72" cy="62" r="3"/><circle cx="34" cy="70" r="3"/><circle cx="52" cy="80" r="3"/></g></svg>';
  // [article, singular, plural] per language
  const PRODUCTS = [
    { id: 'croissant', pic: '🥐', fr: ['un', 'croissant', 'croissants'], sv: ['en', 'croissant', 'croissanter'] },
    { id: 'bulle', pic: BUN, fr: ['une', 'brioche à la cannelle', 'brioches à la cannelle'], sv: ['en', 'kanelbulle', 'kanelbullar'] },
    { id: 'pain', pic: '🍞', fr: ['un', 'pain', 'pains'], sv: ['ett', 'bröd', 'bröd'] },
    { id: 'baguette', pic: '🥖', fr: ['une', 'baguette', 'baguettes'], sv: ['en', 'baguette', 'baguetter'] },
    { id: 'cookie', pic: '🍪', fr: ['un', 'cookie', 'cookies'], sv: ['en', 'kaka', 'kakor'] },
    { id: 'cupcake', pic: '🧁', fr: ['un', 'cupcake', 'cupcakes'], sv: ['en', 'muffin', 'muffins'] },
    { id: 'tarte', pic: '🥧', fr: ['une', 'tarte', 'tartes'], sv: ['en', 'paj', 'pajer'] },
    { id: 'donut', pic: '🍩', fr: ['un', 'donut', 'donuts'], sv: ['en', 'munk', 'munkar'] },
    { id: 'gateau', pic: '🍰', fr: ['une', 'part de gâteau', 'parts de gâteau'], sv: ['en', 'tårtbit', 'tårtbitar'] },
    { id: 'bretzel', pic: '🥨', fr: ['un', 'bretzel', 'bretzels'], sv: ['en', 'kringla', 'kringlor'] }
  ];
  const DRAWER = [1, 2, 5, 10, 20];
  // level: unit price range, number of lines, exact payment or change, payment options when change
  const LEVELS = {
    1: { unit: [1, 10], range: [1, 10], den: [1, 2, 5, 10] },
    2: { unit: [10, 30], range: [10, 30], den: [1, 2, 5, 10, 20] },
    3: { unit: [2, 19], range: [2, 19], pays: [10, 20] },
    4: { unit: [2, 12], range: [4, 24], den: [1, 2, 5, 10, 20] },
    5: { unit: [3, 20], range: [8, 45], pays: [10, 20, 50] },
    6: { unit: [3, 15], range: [20, 95], pays: [20, 50, 100] }
  };
  const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  function greedy(v, den) { const out = []; for (const d of den.slice().sort((a, b) => b - a)) while (v >= d) { out.push(d); v -= d; } return v === 0 ? out : null; }
  function canMake(coins, target) { let s = new Set([0]); for (const c of coins) { const n = new Set(s); for (const x of s) if (x + c <= target) n.add(x + c); s = n; } return s.has(target); }
  function tryGen(L, r) {
    const cfg = LEVELS[L], prods = shuffle(PRODUCTS.slice(), r);
    let lines;
    if (L <= 3) lines = [{ q: 1, price: ri(r, cfg.unit[0], cfg.unit[1]) }];
    else if (L <= 5) lines = [{ q: 1, price: ri(r, cfg.unit[0], cfg.unit[1]) }, { q: 1, price: ri(r, cfg.unit[0], cfg.unit[1]) }];
    else { lines = Array.from({ length: ri(r, 2, 3) }, () => ({ q: ri(r, 1, 3), price: ri(r, cfg.unit[0], cfg.unit[1]) })); if (!lines.some(l => l.q > 1)) lines[0].q = ri(r, 2, 3); }
    if (L === 3 && lines[0].price === 10) return null;
    lines.forEach((l, i) => { l.prod = prods[i]; });
    const total = sum(lines.map(l => l.q * l.price));
    if (total < cfg.range[0] || total > cfg.range[1]) return null;
    let pay = null, change = 0, purse;
    if (cfg.pays) { pay = cfg.pays.find(p => p > total); if (!pay) return null; change = pay - total; purse = [pay]; }
    else {
      purse = greedy(total, cfg.den);
      const small = cfg.den.filter(d => d <= Math.max(5, total));
      for (let k = ri(r, 3, 5); k > 0 && purse.length < 10; k--) purse.push(small[ri(r, 0, small.length - 1)]);
      purse.sort((a, b) => b - a);
    }
    const others = prods.slice(lines.length, 6).map(prod => ({ prod, price: ri(r, cfg.unit[0], cfg.unit[1]) }));
    const shelf = shuffle(lines.map(l => ({ prod: l.prod, price: l.price })).concat(others), r);
    return { level: L, lines, total, pay, change, purse, shelf };
  }
  function gen(L, r) { r = r || Math.random; for (let i = 0; i < 500; i++) { const p = tryGen(L, r); if (p) return p; } throw new Error('gen failed ' + L); }
  // 3 distinct positive options, one is the answer
  function options(ans, r) {
    r = r || Math.random; const set = new Set([ans]);
    const deltas = shuffle([-1, 1, -2, 2, -5, 5, -10, 10, 3, -3], r);
    for (const d of deltas) { if (set.size >= 3) break; if (ans + d >= 1) set.add(ans + d); }
    return shuffle(Array.from(set), r);
  }
  // coins a cashier returns: correct (greedy) or slightly wrong
  function returned(change, correct, r) {
    r = r || Math.random; if (correct) return { coins: greedy(change, DRAWER), value: change };
    const ds = shuffle([-2, -1, 1, 2, 5], r).filter(d => change + d >= 1);
    const v = change + ds[0]; return { coins: greedy(v, DRAWER), value: v };
  }
  /* ---- drawings ---- */
  const COIN = { 1: ['#e3e6ea', '#9aa1ab', 36], 2: ['#d5d9df', '#8a919b', 42], 5: ['#e8b04a', '#a8761c', 46], 10: ['#f5d04c', '#b8921a', 40] };
  const NOTE = { 20: ['#b79be0', '#7a55b8'], 50: ['#f6b26b', '#c97a22'], 100: ['#7cb4ee', '#3d7cc4'], 200: ['#86cf8a', '#3d9447'] };
  function moneySVG(v) {
    if (COIN[v]) {
      const [f, s, rr] = COIN[v];
      return '<svg viewBox="0 0 100 100"><circle cx="50" cy="52" r="' + rr + '" fill="' + s + '"/><circle cx="50" cy="50" r="' + rr + '" fill="' + f + '" stroke="' + s + '" stroke-width="4"/>' +
        '<circle cx="50" cy="50" r="' + (rr - 8) + '" fill="none" stroke="' + s + '" stroke-width="2" stroke-dasharray="' + (v >= 5 ? '3 3' : '0') + '"/>' +
        '<text x="50" y="' + (v >= 10 ? 55 : 57) + '" text-anchor="middle" font-size="' + (v >= 10 ? 30 : 36) + '" font-weight="800" fill="#4a3a10" font-family="Rubik,Arial,sans-serif">' + v + '</text>' +
        '<text x="50" y="' + (50 + rr - 12) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#4a3a10" font-family="Rubik,Arial,sans-serif">kr</text></svg>';
    }
    const [f, s] = NOTE[v];
    return '<svg viewBox="0 0 160 84"><rect x="2" y="4" width="156" height="78" rx="8" fill="' + s + '"/><rect x="2" y="2" width="156" height="76" rx="8" fill="' + f + '"/>' +
      '<rect x="8" y="8" width="144" height="64" rx="5" fill="none" stroke="' + s + '" stroke-width="2"/><circle cx="42" cy="40" r="22" fill="#fff" opacity=".45"/>' +
      '<circle cx="42" cy="33" r="8" fill="' + s + '" opacity=".6"/><path d="M28 56 q14 -18 28 0" fill="' + s + '" opacity=".6"/>' +
      '<text x="112" y="50" text-anchor="middle" font-size="36" font-weight="800" fill="#2b2140" font-family="Rubik,Arial,sans-serif">' + v + '</text>' +
      '<text x="112" y="68" text-anchor="middle" font-size="13" font-weight="700" fill="#2b2140" font-family="Rubik,Arial,sans-serif">kr</text></svg>';
  }
  const api = { PRODUCTS, LEVELS, DRAWER, gen, tryGen, options, returned, greedy, canMake, sum, moneySVG, shuffle };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BMoney = api;
})(this);
