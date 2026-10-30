/* La boulangerie / Bageriet - game (solo, offline) */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s), $$ = (s) => Array.from(document.querySelectorAll(s));
  const M = window.BMoney, S = window.BSound, V = window.BVoice;
  const SESSION = 6, ANIMALS = ['🐰', '🦊', '🐻', '🐷', '🐸', '🐼', '🐨', '🦁', '🐵', '🐯', '🐮', '🐭'];
  const T = {
    fr: { title: 'La <span style="color:#2a9d8f">boulangerie</span>', client: 'Cliente', cashier: 'Caissière', and: ' et ',
      kr: (n) => n === 1 ? 'une couronne' : n + ' couronnes', buy: (l) => 'Achète ' + l + '.', hello: (l) => 'Bonjour ! Je voudrais ' + l + ", s'il te plaît.",
      total: (n) => 'Ça fait ' + T.fr.kr(n) + '.', howMuch: 'Combien ça fait ?', payNote: 'Paye avec ça !', askChange: 'Combien je te rends ?',
      check: "Voici ta monnaie. C'est juste ?", sorry: 'Oups, pardon ! Voilà la bonne monnaie.', here: 'Voilà !', want: "Ma monnaie, s'il te plaît !",
      tooMuch: "Oups, c'est trop !", retry: 'Essaie encore !', thanks: 'Merci ! Au revoir !', bravo: 'Bravo ! Quelle belle journée à la boulangerie !' },
    sv: { title: '<span style="color:#2a9d8f">Bageriet</span>', client: 'Kund', cashier: 'Kassörska', and: ' och ',
      kr: (n) => n === 1 ? 'en krona' : n + ' kronor', buy: (l) => 'Köp ' + l + '.', hello: (l) => 'Hej! Jag vill ha ' + l + ', tack.',
      total: (n) => 'Det blir ' + T.sv.kr(n) + '.', howMuch: 'Hur mycket blir det?', payNote: 'Betala med den här!', askChange: 'Hur mycket ska du få tillbaka?',
      check: 'Här är din växel. Stämmer det?', sorry: 'Oj, förlåt! Här är rätt växel.', here: 'Varsågod!', want: 'Kan jag få växel, tack?',
      tooMuch: 'Hoppsan, det är för mycket!', retry: 'Försök igen!', thanks: 'Tack! Hej då!', bravo: 'Bra jobbat! Vilken fin dag på bageriet!' }
  };
  const t = (k, ...a) => { const v = T[V.lang][k]; return typeof v === 'function' ? v(...a) : v; };
  const say = (s) => V.say(s);
  let level = Math.min(6, Math.max(1, +localStorage.getItem('boul.level') || 1));
  let role = 'client', st = null, cu = null;
  const later = (fn, ms) => { const tok = cu; setTimeout(() => { if (cu === tok) fn(); }, ms); };
  function show(id) { $$('.screen').forEach(s => s.classList.toggle('hidden', s.id !== id)); }
  function setLevel(n) { level = n; localStorage.setItem('boul.level', n); renderLevels(); }
  function paintLang() {
    const other = V.lang === 'fr' ? '🇸🇪' : '🇫🇷'; $('#flag').textContent = other; $('#flag2').textContent = other;
    $('#title').innerHTML = t('title'); $$('[data-t]').forEach(e => { e.textContent = t(e.dataset.t); }); document.documentElement.lang = V.lang;
  }
  function renderLevels() {
    const box = $('#levels'); box.innerHTML = '';
    for (let n = 1; n <= 6; n++) { const b = document.createElement('button'); b.textContent = n; b.className = n === level ? 'on' : ''; b.setAttribute('aria-label', 'Niveau ' + n);
      b.onclick = () => { S.unlock(); S.pick(); setLevel(n); }; box.appendChild(b); }
  }
  const name = (prod, q) => { const [a, s, p] = prod[V.lang]; return q === 1 ? a + ' ' + s : q + ' ' + p; };
  function listText(lines) { const parts = lines.map(l => name(l.prod, l.q)); return parts.length === 1 ? parts[0] : parts.slice(0, -1).join(', ') + t('and') + parts[parts.length - 1]; }
  const orderHTML = (lines) => lines.map(l => '<span class="grp">' + l.prod.pic.repeat(l.q) + '</span>').join('');
  function moneyEl(v) { const b = document.createElement('button'); b.className = 'money v' + v; b.dataset.v = v; b.innerHTML = M.moneySVG(v); b.setAttribute('aria-label', v + ' kr'); return b; }
  function bindMoney(el, act) {
    let sx = 0, sy = 0, drag = false, id = null;
    el.addEventListener('pointerdown', (e) => { id = e.pointerId; sx = e.clientX; sy = e.clientY; drag = false; try { el.setPointerCapture(id); } catch (x) {} S.unlock(); });
    el.addEventListener('pointermove', (e) => { if (e.pointerId !== id) return; const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!drag && Math.hypot(dx, dy) > 10) { drag = true; el.classList.add('drag'); } if (drag) el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.1)'; });
    const end = (e, cancel) => { if (e.pointerId !== id) return; id = null; const moved = drag; drag = false; el.classList.remove('drag');
      if (!moved) { if (!cancel) act(el); return; }
      const far = Math.abs(e.clientY - sy) > 60; el.classList.add('back'); el.style.transform = ''; setTimeout(() => el.classList.remove('back'), 320);
      if (far && !cancel) act(el); };
    el.addEventListener('pointerup', (e) => end(e, false)); el.addEventListener('pointercancel', (e) => end(e, true));
  }
  function wobble(el) { if (!el) return; el.classList.remove('wobble'); void el.offsetWidth; el.classList.add('wobble'); setTimeout(() => el.classList.remove('wobble'), 600); }
  function mistake(el, msg) { cu.miss++; cu.step++; S.boing(); wobble(el); say(msg || t('retry')); if (cu.step >= 2) showHint(); }
  function stepOK() { cu.step = 0; hideHint(); }
  function sparks(n, emojis, from) {
    const fx = $('#fx'), r = (from || $('#mat')).getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let k = 0; k < n; k++) { const s = document.createElement('span'); s.className = 'spark'; s.textContent = emojis[k % emojis.length];
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * Math.min(innerWidth, innerHeight) * 0.35;
      s.style.left = cx + 'px'; s.style.top = cy + 'px'; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px'); fx.appendChild(s); setTimeout(() => s.remove(), 1400); }
  }
  const setPhase = (ph) => { cu.phase = ph; cu.step = 0; hideHint(); window.__boul = { role, level, phase: ph, p: cu.p, variant: cu.variant, ret: cu.ret, done: st.done.length }; };
  const bubble = (html) => { $('#bubble').innerHTML = html; };
  const bottom = (cls) => { const b = $('#bottom'); b.className = 'bottom ' + (cls || ''); b.innerHTML = ''; return b; };
  const matSum = () => M.sum(cu.mat);
  function renderMatMoney(onTap) {
    const box = $('#matitems'); box.innerHTML = '';
    cu.mat.forEach((v, i) => { const el = moneyEl(v); bindMoney(el, () => onTap(i)); box.appendChild(el); });
    $('#matsum').textContent = cu.mat.length ? matSum() + ' kr' : '';
    if (!$('#hint').classList.contains('hidden')) showHint();
  }

  /* ---------- session ---------- */
  function startSession(r) { S.unlock(); V.warm(); role = r; st = { done: [], streak: 0, bad: 0 }; show('game'); nextCustomer(); }
  function renderDots() { $('#dots').innerHTML = Array.from({ length: SESSION }, (_, i) => '<i class="' + (i < st.done.length ? 'ok' : i === st.done.length ? 'cur' : '') + '">🪙</i>').join(''); }
  function nextCustomer() {
    const p = M.gen(level); cu = { p, miss: 0, step: 0, basket: {}, mat: [] }; renderDots();
    const shelf = $('#shelf'); shelf.innerHTML = '';
    p.shelf.forEach(s => { const b = document.createElement('button'); b.className = 'prod'; b.dataset.id = s.prod.id;
      b.innerHTML = '<span class="pic">' + s.prod.pic + '</span><span class="tag">' + s.price + ' kr</span>'; b.onclick = () => tapProduct(s, b); shelf.appendChild(b); });
    const ch = $('#char'); ch.textContent = role === 'client' ? '🧑‍🍳' : ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    ch.className = 'char'; void ch.offsetWidth; ch.classList.add('in');
    $('#matitems').innerHTML = ''; $('#matsum').textContent = ''; bottom(); bubble(orderHTML(p.lines)); S.bell();
    if (role === 'client') { setPhase('shop'); later(() => say(t('buy', listText(p.lines))), 500); }
    else { $('#matitems').innerHTML = p.lines.map(l => l.prod.pic.repeat(l.q)).join(''); setPhase('ring'); later(() => say(t('hello', listText(p.lines))), 700); ringUp(); }
  }
  function tapProduct(s, el) {
    S.unlock();
    if (!(role === 'client' && cu.phase === 'shop')) { say(name(s.prod, 1) + ', ' + t('kr', s.price)); return; }
    const line = cu.p.lines.find(l => l.prod.id === s.prod.id), have = cu.basket[s.prod.id] || 0;
    if (!line || have >= line.q) { mistake(el); return; }
    cu.basket[s.prod.id] = have + 1; S.pick(); say(name(s.prod, 1) + ', ' + t('kr', s.price)); stepOK();
    const span = document.createElement('span'); span.className = 'pop'; span.innerHTML = s.prod.pic; span.style.display = 'inline-flex'; $('#matitems').appendChild(span);
    if (cu.p.lines.every(l => (cu.basket[l.prod.id] || 0) === l.q)) { $$('.prod').forEach(x => x.classList.remove('want')); later(clientTotal, 900); }
  }
  /* ---------- answers ---------- */
  function choices(ans, onOK, fmt) {
    const b = bottom();
    M.options(ans).forEach(v => { const c = document.createElement('button'); c.className = 'choice'; c.dataset.v = v; c.textContent = fmt ? fmt(v) : v + ' kr';
      c.onclick = () => { S.unlock(); if (v === ans) { c.classList.add('ok'); S.star(); stepOK(); onOK(); } else mistake(c); }; b.appendChild(c); });
  }
  function numpad(ans, onOK) {
    const b = bottom(); let val = '';
    b.innerHTML = '<div class="numpad"><div class="disp" id="disp">&nbsp;kr</div><div class="keys"></div></div>';
    const keys = b.querySelector('.keys'), disp = b.querySelector('#disp'), paint = () => { disp.innerHTML = (val || '&nbsp;') + ' kr'; };
    ['1', '2', '3', '4', '5', '⌫', '6', '7', '8', '9', '0', '✅'].forEach(k => { const btn = document.createElement('button'); btn.textContent = k; btn.dataset.k = k;
      if (k === '⌫') btn.className = 'del'; if (k === '✅') btn.className = 'go';
      btn.onclick = () => { S.unlock();
        if (k === '⌫') { val = val.slice(0, -1); S.pick(); }
        else if (k === '✅') { if (!val) return; if (+val === ans) { S.star(); stepOK(); onOK(); return; } val = ''; mistake(disp); }
        else if (val.length < 3) { val = (val === '0' ? '' : val) + k; S.pick(); }
        paint(); };
      keys.appendChild(btn); });
  }
  /* ---------- client ---------- */
  function clientTotal() {
    const p = cu.p; setPhase('total');
    if (level <= 3) { bubble('<span class="big">' + p.total + ' kr</span>'); say(t('total', p.total)); later(clientPay, 1800); }
    else { bubble(orderHTML(p.lines) + '<span class="big">= ? kr</span>'); say(t('howMuch'));
      choices(p.total, () => { bubble('<span class="big">' + p.total + ' kr</span>'); say(t('total', p.total)); bottom(); later(clientPay, 1600); }); }
  }
  function clientPay() {
    const p = cu.p; setPhase('pay'); bubble('<span class="big">' + p.total + ' kr</span>'); cu.mat = []; $('#matitems').innerHTML = '';
    const b = bottom('purse'); cu.purse = p.purse.slice();
    const paintPurse = () => { b.innerHTML = ''; cu.purse.forEach((v, i) => { const el = moneyEl(v); bindMoney(el, () => give(i)); b.appendChild(el); }); };
    const back = (i) => { if (cu.phase !== 'pay') return; const v = cu.mat.splice(i, 1)[0]; cu.purse.push(v); cu.purse.sort((a, c) => c - a); S.pick(); paintPurse(); renderMatMoney(back); };
    const give = (i) => {
      if (cu.phase !== 'pay') return; const v = cu.purse.splice(i, 1)[0]; cu.mat.push(v); S.coin(); say(t('kr', v)); paintPurse(); renderMatMoney(back);
      const s = matSum();
      if (p.pay) { setPhase('wait'); later(clientChange, 900); return; }
      if (s === p.total) { setPhase('wait'); stepOK(); later(finish, 700); }
      else if (s > p.total) mistake($('#matsum'), t('tooMuch'));
    };
    paintPurse(); if (p.pay) say(t('payNote'));
  }
  function clientChange() {
    const p = cu.p; setPhase('change'); bottom();
    cu.variant = level >= 6 && Math.random() < 0.5 ? 'verify' : 'choose'; window.__boul.variant = cu.variant;
    if (cu.variant === 'choose') {
      bubble('<span class="big">↩️ ? kr</span>'); say(t('askChange'));
      choices(p.change, () => { giveBack(M.greedy(p.change, M.DRAWER)); say(t('kr', p.change)); later(finish, 1500); });
    } else {
      cu.ret = M.returned(p.change, Math.random() < 0.5); window.__boul.ret = cu.ret; giveBack(cu.ret.coins); say(t('check'));
      const ok = cu.ret.value === p.change ? 'up' : 'down', b = bottom();
      [['up', '👍'], ['down', '👎']].forEach(([k, e]) => { const c = document.createElement('button'); c.className = 'choice emo'; c.dataset.k = k; c.textContent = e;
        c.onclick = () => { if (k !== ok) { mistake(c); return; } c.classList.add('ok'); S.star(); stepOK(); bottom();
          if (ok === 'up') later(finish, 600); else { say(t('sorry')); giveBack(M.greedy(p.change, M.DRAWER)); later(finish, 2200); } }; b.appendChild(c); });
    }
  }
  function giveBack(coins) {
    const bb = $('#bubble'); bb.innerHTML = '<span class="big">↩️</span>';
    coins.forEach((v, i) => { const el = moneyEl(v); el.style.setProperty('--m', '.7'); el.classList.add('pop'); el.style.animationDelay = i * 0.1 + 's'; el.onclick = () => say(t('kr', v)); bb.appendChild(el); });
  }
  /* ---------- cashier ---------- */
  function ringUp() {
    const p = cu.p, ok = () => { say(t('total', p.total)); bubble('<span class="big">' + p.total + ' kr</span>'); bottom(); later(receive, 1600); };
    if (level <= 3) choices(p.total, ok); else numpad(p.total, ok);
  }
  function receive() {
    const p = cu.p; setPhase('receive'); const coins = p.pay ? [p.pay] : M.greedy(p.total, M.DRAWER);
    const bb = $('#bubble'); bb.innerHTML = '<span class="big">' + p.total + ' kr</span>'; say(t('here'));
    coins.forEach(v => { const el = moneyEl(v); el.style.setProperty('--m', '.75'); el.classList.add('pop', 'take'); el.onclick = () => take(); bb.appendChild(el); });
    const b = bottom('drawer'); M.DRAWER.forEach(v => { const el = moneyEl(v); el.style.opacity = '.5'; b.appendChild(el); });
    function take() { if (cu.phase !== 'receive') return; S.coin(); $$('#bubble .take').forEach(e => e.remove());
      if (!p.pay) { setPhase('wait'); later(finish, 500); return; }
      const pe = moneyEl(p.pay); pe.style.setProperty('--m', '.6'); bb.appendChild(pe); bb.insertAdjacentHTML('beforeend', '<span class="big">↩️ ?</span>'); giveChange(); }
  }
  function giveChange() {
    const p = cu.p; setPhase('give'); cu.mat = []; $('#matitems').innerHTML = ''; say(t('want'));
    const b = bottom('drawer');
    const back = (i) => { if (cu.phase !== 'give') return; cu.mat.splice(i, 1); S.pick(); renderMatMoney(back); };
    M.DRAWER.forEach(v => { const el = moneyEl(v); bindMoney(el, () => {
      if (cu.phase !== 'give') return; cu.mat.push(v); S.coin(); say(t('kr', v)); renderMatMoney(back);
      const s = matSum(); if (s === p.change) { setPhase('wait'); stepOK(); later(finish, 700); } else if (s > p.change) mistake($('#matsum'), t('tooMuch'));
    }); b.appendChild(el); });
  }
  /* ---------- hint ---------- */
  function dots(spec) { return '<div class="dg">' + spec.map(([n, c]) => ('<i class="' + c + '"></i>').repeat(Math.max(0, n))).join('') + '</div>'; }
  function showHint() {
    if (!cu) return; const p = cu.p, h = $('#hint'); let html = '';
    const ph = cu.phase;
    if (ph === 'shop') { $$('.prod').forEach(x => x.classList.toggle('want', p.lines.some(l => l.prod.id === x.dataset.id))); return; }
    if (ph === 'total' || ph === 'ring') {
      const parts = []; const spec = []; let k = 0; p.lines.forEach(l => { for (let i = 0; i < l.q; i++) { parts.push(l.price); spec.push([l.price, ['', 'b', 'c'][k++ % 3]]); } });
      html = '<div class="eq">' + parts.join(' + ') + ' = ?</div>' + dots(spec);
    } else if (ph === 'pay' && !p.pay) {
      const s = matSum(); html = '<div class="eq">' + s + ' / ' + p.total + ' kr</div>' + dots([[Math.min(s, p.total), 'f'], [p.total - s, 'e'], [s - p.total, 'c']]);
    } else if (ph === 'change' || ph === 'give') {
      const s = ph === 'give' ? matSum() : 0;
      html = '<div class="eq">' + p.pay + ' − ' + p.total + ' = ?</div>' + dots([[p.total, 'x'], [Math.min(s, p.change), 'f'], [p.change - s, 'e']]);
    } else if (ph === 'receive') { $$('#bubble .take').forEach(wobble); return; }
    else return;
    h.innerHTML = html; h.classList.remove('hidden'); $('#hintBtn').classList.remove('lit');
  }
  function hideHint() { $('#hint').classList.add('hidden'); $$('.prod.want').forEach(x => x.classList.remove('want')); }
  /* ---------- end of a customer / session ---------- */
  function finish() {
    setPhase('done'); const perfect = cu.miss <= 1; st.done.push({ perfect }); renderDots();
    S.bell(); S.star(); say(t('thanks')); sparks(12, ['⭐', '✨', '🪙', perfect ? '🌟' : '💛']);
    later(() => $('#char').classList.add('out'), 900);
    if (perfect) st.streak++; else st.streak = 0; if (cu.miss >= 4) st.bad++; else st.bad = 0;
    let up = false;
    if (st.streak >= 2 && level < 6) { setLevel(level + 1); st.streak = 0; up = true; }
    if (st.bad >= 2 && level > 1) { setLevel(level - 1); st.bad = 0; }
    if (up) later(() => { const l = $('#lvlup'); l.textContent = '⭐' + level; l.classList.remove('hidden'); setTimeout(() => l.classList.add('hidden'), 1600); }, 1200);
    later(() => { if (st.done.length >= SESSION) endScreen(); else nextCustomer(); }, up ? 3000 : 2200);
  }
  function endScreen() {
    show('end'); cu = null; const jar = $('#jar'); jar.innerHTML = '';
    st.done.forEach((d, i) => { [d.perfect ? 10 : 5, 5, 2, 1].forEach((v, j) => { const el = moneyEl(v); el.style.animationDelay = (i * 0.3 + j * 0.08) + 's'; jar.appendChild(el); }); });
    $('#endStars').innerHTML = st.done.map((d, i) => '<span style="animation-delay:' + (1.8 + i * 0.15) + 's">' + (d.perfect ? '🌟' : '⭐') + '</span>').join('');
    setTimeout(() => { S.fanfare(); say(t('bravo')); }, 1600);
    window.__boul = { end: true, done: st.done.length };
  }
  /* ---------- wiring ---------- */
  $$('.role').forEach(b => b.onclick = () => startSession(b.dataset.role));
  const swap = () => { S.unlock(); V.setLang(V.lang === 'fr' ? 'sv' : 'fr'); paintLang(); if (typeof checkVoice === 'function') checkVoice(); };
  $('#flag').onclick = swap;
  $('#flag2').onclick = () => { swap(); if (cu && cu.p && cu.phase === 'shop') say(t('buy', listText(cu.p.lines))); };
  $('#home').onclick = () => { cu = null; try { speechSynthesis.cancel(); } catch (e) {} show('start'); };
  $('#home2').onclick = () => show('start');
  $('#again').onclick = () => startSession(role);
  $('#hintBtn').onclick = () => { S.unlock(); if ($('#hint').classList.contains('hidden')) showHint(); else hideHint(); };
  $('#hint').onclick = hideHint;
  $('#char').onclick = () => { if (!cu) return; const p = cu.p; if (cu.phase === 'shop') say(t('buy', listText(p.lines))); else if (cu.phase === 'ring') say(t('hello', listText(p.lines))); else if (cu.phase === 'change') say(cu.variant === 'verify' ? t('check') : t('askChange')); else if (cu.phase === 'give') say(t('want')); };
  const muteBtn = $('#mute'), paintMute = () => { muteBtn.textContent = S.muted ? '🔇' : '🎵'; };
  muteBtn.onclick = () => { S.setMuted(!S.muted); paintMute(); }; paintMute();
  paintLang(); renderLevels(); V.warm();
  var checkVoice = () => $('#novoice').classList.toggle('hidden', V.has(V.lang)); setTimeout(checkVoice, 800);
  try { speechSynthesis.addEventListener('voiceschanged', checkVoice); } catch (e) {}
})();
