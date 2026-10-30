// Unit check of generated problems (run: node tools/check.cjs)
const M = require('../js/money.js');
let bad = 0; const fail = (m, p) => { if (bad++ < 10) console.error('FAIL', m, JSON.stringify(p && { l: p.lines.map(x => [x.q, x.price]), t: p.total, pay: p.pay, ch: p.change, purse: p.purse })); };
for (let L = 1; L <= 6; L++) {
  const cfg = M.LEVELS[L]; const seen = new Set();
  for (let i = 0; i < 5000; i++) {
    const p = M.gen(L);
    const t = p.lines.reduce((s, l) => s + l.q * l.price, 0);
    if (t !== p.total || !Number.isInteger(t)) fail('total', p);
    if (t < cfg.range[0] || t > cfg.range[1]) fail('range', p);
    if (p.lines.some(l => l.price < 1 || l.q < 1)) fail('neg', p);
    if (new Set(p.lines.map(l => l.prod.id)).size !== p.lines.length) fail('dup prod', p);
    for (const l of p.lines) if (!p.shelf.some(s => s.prod.id === l.prod.id && s.price === l.price)) fail('shelf', p);
    if (new Set(p.shelf.map(s => s.prod.id)).size !== 6) fail('shelf size', p);
    if (cfg.pays) {
      if (!(p.pay > t) || p.change !== p.pay - t || p.change < 1) fail('change', p);
      if (!M.greedy(p.change, M.DRAWER)) fail('change not payable', p);
      if (p.purse.length !== 1 || p.purse[0] !== p.pay) fail('purse note', p);
      for (const ok of [true, false]) { const r = M.returned(p.change, ok); if (M.sum(r.coins) !== r.value || r.value < 1 || (ok ? r.value !== p.change : r.value === p.change)) fail('returned', p); }
    } else {
      if (p.pay !== null || p.change !== 0) fail('exact', p);
      if (!M.canMake(p.purse, t)) fail('purse cannot pay', p);
      if (p.purse.length > 10 || p.purse.some(c => !cfg.den.includes(c))) fail('purse den', p);
      if (!M.greedy(t, M.DRAWER)) fail('customer coins', p);
    }
    for (const a of [t, p.change].filter(x => x > 0)) { const o = M.options(a); if (o.length !== 3 || new Set(o).size !== 3 || !o.includes(a) || o.some(x => x < 1)) fail('options', p); }
    seen.add(t);
  }
  console.log('level', L, 'ok — totals seen', Math.min(...seen) + '..' + Math.max(...seen), cfg.pays ? '(change)' : '(exact)');
}
console.log(bad ? bad + ' FAILURES' : 'ALL CHECKS OK'); process.exit(bad ? 1 : 0);
