// Amigos y chats privados (solo los dos miembros pueden leerlos)
let chats = [], unsub = null, msgs = [], curChat = null;
const perfs = {}, bgImgs = {};
let oc = { open: false, tab: null, who: 'me' };

// [clave, nombre, color 1, color 2]  -> "Colores" del chat
const COLS = [
  ['rosa', 'Rosa neón', '#ff2e9a', '#ff7ac6'], ['fuego', 'Fuego', '#ff4d00', '#ffb400'], ['sol', 'Sol', '#ffd21f', '#ff9d00'],
  ['lima', 'Lima', '#b5ff2e', '#2eff9a'], ['menta', 'Menta', '#00f5a0', '#00d9f5'], ['cian', 'Cian', '#17e4ff', '#2a7bff'],
  ['azul', 'Azul eléctrico', '#2f6bff', '#8c5bff'], ['violeta', 'Violeta', '#8c5bff', '#e040fb'], ['magenta', 'Magenta', '#e91e8c', '#ff5252'],
  ['coral', 'Coral', '#ff6b6b', '#ffa36b'], ['hielo', 'Hielo', '#7df9ff', '#c8b6ff'], ['rubi', 'Rubí', '#ff1744', '#ff2e9a'],
  ['toxico', 'Tóxico', '#c6ff00', '#00e676'], ['atardecer', 'Atardecer', '#ff2e9a', '#ffb400']
];
// [clave, nombre, fondo, color de texto, css extra]  -> "Mensajes"
const BUB = [
  ['acento', 'Color del chat', 'var(--g)', '#fff'],
  ['cristal', 'Cristal', '#ffffff24', '#fff'],
  ['blanco', 'Blanco', '#ffffff', '#1b1233'],
  ['noche', 'Noche', '#0d0a1f', '#fff'],
  ['chicle', 'Chicle', 'linear-gradient(135deg,#ff2e9a,#ff7ac6)', '#fff'],
  ['mandarina', 'Mandarina', 'linear-gradient(135deg,#ff6a00,#ffb400)', '#2a1100'],
  ['limon', 'Limón', 'linear-gradient(135deg,#f6ff00,#b5ff2e)', '#1d2500'],
  ['selva', 'Selva', 'linear-gradient(135deg,#00c853,#b5ff2e)', '#03230f'],
  ['turquesa', 'Turquesa', 'linear-gradient(135deg,#00e5ff,#00f5a0)', '#032a2e'],
  ['oceano', 'Océano', 'linear-gradient(135deg,#2f6bff,#17e4ff)', '#fff'],
  ['ultra', 'Ultravioleta', 'linear-gradient(135deg,#6a1bff,#e040fb)', '#fff'],
  ['cereza', 'Cereza', 'linear-gradient(135deg,#d90429,#ff5252)', '#fff'],
  ['puesta', 'Puesta de sol', 'linear-gradient(135deg,#ff2e9a,#ff8a1f,#ffd21f)', '#2a0a14'],
  ['aurora', 'Aurora', 'linear-gradient(135deg,#00f5a0,#17e4ff,#8c5bff)', '#fff'],
  ['neon', 'Neón', '#0a0a14', '#fff', 'border:2px solid #17e4ff;box-shadow:0 0 14px #17e4ff99'],
  ['neonrosa', 'Neón rosa', '#14061f', '#fff', 'border:2px solid #ff2e9a;box-shadow:0 0 14px #ff2e9a99'],
  ['arcoiris', 'Arcoíris', 'linear-gradient(120deg,#ff2e9a,#ff8a1f,#ffd21f,#b5ff2e,#17e4ff,#8c5bff,#ff2e9a)', '#1a0a2e', 'background-size:300% 300%;animation:flujo 6s ease infinite']
];
// [clave, nombre, css]  -> "Fondo"
const FOND = [
  ['defecto', 'Original', 'linear-gradient(170deg,#0f766e,#1e2a5a 50%,#3b0a6b)'],
  ['noche', 'Noche', '#0b0618'], ['ocean', 'Océano', 'linear-gradient(160deg,#0a3d91,#0bd1ff)'],
  ['aurora', 'Aurora', 'linear-gradient(160deg,#00bf8f,#5b2bff)'], ['atardecer', 'Atardecer', 'linear-gradient(160deg,#ff512f,#dd2476)'],
  ['fuego', 'Fuego', 'linear-gradient(160deg,#f12711,#f5af19)'], ['bosque', 'Bosque', 'linear-gradient(160deg,#0f9b0f,#003300)'],
  ['neon', 'Neón', 'linear-gradient(160deg,#1e0b4b,#e040fb)'], ['chicle', 'Chicle', 'linear-gradient(160deg,#ff9ad5,#7a5cff)'],
  ['limon', 'Limón', 'linear-gradient(160deg,#f7ff00,#00c389)'],
  ['galaxia', 'Galaxia', 'radial-gradient(circle at 20% 20%,#7b2ff7aa,transparent 45%),radial-gradient(circle at 80% 80%,#ff2e9aaa,transparent 45%),#0a0620'],
  ['rosa', 'Rosa', '#ff2e9a'], ['azul', 'Azul', '#1e4fff'], ['verde', 'Verde', '#00b36b'], ['morado', 'Morado', '#6a1bff'],
  ['negro', 'Negro', '#000'], ['claro', 'Claro', '#f2eefc']
];
const OPS = [
  ['col', 'palette', 'Colores', 'Te da varios colores vibrantes para decorar tu chat'],
  ['msg', 'chat', 'Mensajes', 'Agrega colores súper variados y llamativos a los mensajes'],
  ['bg', 'image', 'Fondo', 'Pon un fondo desde tu galería o elige colores predeterminados']
];
const otro = () => location.hash.slice(6);
const getCC = o => ({ col: 'rosa', bm: 'acento', bt: 'cristal', fp: 'defecto', fi: false, ...(((perfil && perfil.cc) || {})[o] || {}) });
const bubOf = k => BUB.find(b => b[0] === k) || BUB[0];
const cidOf = o => [user.uid, o].sort().join('_');
const avOf = (p, px, ring) => `<span class="av${ring ? ' ring' : ''}" style="width:${px}px;height:${px}px;font-size:${px / 2.5}px">${p.avatar ? `<img src="${esc(p.avatar)}" alt="">` : inicial(p.nombre)}</span>`;
const perfP = {};
function perfOf(uid) {
  if (perfs[uid]) return Promise.resolve(perfs[uid]);
  if (!perfP[uid]) perfP[uid] = db.collection('perfiles').doc(uid).get().then(d => perfs[uid] = d.exists ? d.data() : { nombre: 'Usuario' }).catch(() => perfs[uid] = { nombre: 'Usuario' });
  return perfP[uid];
}
// Lista de chats en vivo: sale al instante desde la caché y se actualiza sola (sin recargar)
let chatsUnsub = null;
function loadChats() {
  if (!db || !user || chatsUnsub) return;
  chatsUnsub = db.collection('chats').where('miembros', 'array-contains', user.uid).onSnapshot(async s => {
    const l = s.docs.map(d => d.data({ serverTimestamps: 'estimate' }));
    l.forEach(c => { c.otro = c.miembros.find(u => u !== user.uid); });
    await Promise.all(l.map(c => perfOf(c.otro)));          // todos los perfiles a la vez
    const sec = c => (c.ultimo && c.ultimo.t && c.ultimo.t.seconds) || 0;
    l.sort((x, y) => sec(y) - sec(x)); chats = l; renderSoon();
  }, e => toast(errMsg(e)));
}
function chatsView() {
  return `<div class="ti">${ic('chat', 24)}<span>Chats</span></div><section class="card"><p class="mu">Para agregar a alguien, pídele su ID (lo ve en su perfil).</p><div class="cmp" style="margin-top:12px"><input id="fid" inputmode="numeric" placeholder="ID de tu amigo" aria-label="ID de tu amigo"><button class="snd" data-a="addfriend" aria-label="Agregar amigo">${ic('userplus', 20)}</button></div></section>` +
    (chats.length ? chats.map(c => { const p = perfs[c.otro] || {}; const u = c.ultimo || {}; return `<a class="card chr" href="#chat/${esc(c.otro)}">${avOf(p, 52, 1)}<div><b>${esc(p.nombre)}</b>${esc_o(c.otro)}<small class="mu">${u.tp === 's' ? 'Sticker' : esc(u.tx || 'Sin mensajes todavía')}</small></div></a>`; }).join('')
      : `<section class="card">${empty('chat', 'No tienes chats todavía. Agrega a un amigo con su ID.')}</section>`);
}
const esc_o = uid => (typeof esOwner === 'function' && esOwner(uid)) ? ' ' + vf() : '';
function chatView() {
  const p = perfs[otro()];
  setTimeout(startChat, 0);
  return `<section class="chatfull" id="cf"><div class="chh"><a href="#chats" class="ib" aria-label="Volver">${ic('back', 26)}</a>${avOf(p || {}, 44, 1)}<b>${esc((p && p.nombre) || 'Chat')}${esc_o(otro())}</b><button class="ib pal" data-a="tema" aria-label="Personalizar chat" style="margin-left:auto">${ic('palette', 28)}</button></div>
    <div id="tm" class="opts" hidden></div><div id="msgs" class="msgs"></div><div id="pan" class="pan" hidden></div>
    <div class="cmp"><button class="ib stb" data-a="pan" aria-label="Stickers">${ic('sticker', 30)}</button><input id="cm" maxlength="500" placeholder="Escribe un mensaje" aria-label="Mensaje" autocomplete="off"><button class="snd" data-a="send" aria-label="Enviar">${ic('send', 22)}</button></div></section>`;
}
function optsHtml() {
  const c = getCC(otro());
  let h = `<div class="ostrip">${OPS.map(([k, i, t, d]) => `<button class="ot${oc.tab === k ? ' on' : ''}" data-a="otab" data-k="${k}">${ic(i, 22)}<b>${t}</b><small>${d}</small></button>`).join('')}</div>`;
  if (oc.tab === 'col') h += `<div class="opp"><div class="sws">${COLS.map(x => `<button class="swb${c.col === x[0] ? ' on' : ''}" data-a="setcol" data-k="${x[0]}" style="background:linear-gradient(135deg,${x[2]},${x[3]})" aria-label="${x[1]}" title="${x[1]}"></button>`).join('')}</div></div>`;
  if (oc.tab === 'msg') {
    const cur = oc.who === 'me' ? c.bm : c.bt;
    h += `<div class="opp"><div class="seg"><button class="${oc.who === 'me' ? 'on' : ''}" data-a="who" data-k="me">Mis mensajes</button><button class="${oc.who === 'ot' ? 'on' : ''}" data-a="who" data-k="ot">Mensajes del otro</button></div><div class="sws bs">${BUB.map(b => `<button class="swm${cur === b[0] ? ' on' : ''}" data-a="setbub" data-k="${b[0]}" style="background:${b[2]};color:${b[3]};${b[4] || ''}" aria-label="${b[1]}" title="${b[1]}">Aa</button>`).join('')}</div></div>`;
  }
  if (oc.tab === 'bg') h += `<div class="opp"><div class="sws">${FOND.map(f => `<button class="swb${!c.fi && c.fp === f[0] ? ' on' : ''}" data-a="setfp" data-k="${f[0]}" style="background:${f[2]}" aria-label="${f[1]}" title="${f[1]}"></button>`).join('')}</div><div class="row"><label class="btn sm" for="bgf">${ic('image', 16)}Elegir de la galería</label><input id="bgf" type="file" accept="image/*" hidden>${c.fi ? `<button class="btn sec sm" data-a="bgquita">Quitar mi foto</button>` : ''}</div></div>`;
  return h;
}
function pintaOpts() { const t = $('#tm'); if (t) { t.hidden = !oc.open; if (oc.open) t.innerHTML = optsHtml(); } }
function aplicarChat() {
  const cf = $('#cf'), el = $('#msgs'); if (!cf || !el) return;
  const o = otro(), c = getCC(o), col = COLS.find(x => x[0] === c.col) || COLS[0], f = FOND.find(x => x[0] === c.fp) || FOND[0];
  cf.style.setProperty('--c1', col[2]); cf.style.setProperty('--c2', col[3]);
  el.style.background = (c.fi && bgImgs[o]) ? `linear-gradient(#0000004d,#0000004d),url("${bgImgs[o]}") center/cover` : f[2];
}
async function loadBg(o) {
  const c = getCC(o); if (!c.fi || bgImgs[o] !== undefined || !db) return;
  try { const d = await db.collection('perfiles').doc(user.uid).collection('fondos').doc(o).get(); bgImgs[o] = d.exists ? d.data().img : null; } catch (e) { bgImgs[o] = null; }
  aplicarChat();
}
async function setCC(patch) {
  const o = otro(), c = { ...getCC(o), ...patch };
  perfil = { ...perfil, cc: { ...((perfil && perfil.cc) || {}), [o]: c } };
  pintaOpts(); aplicarChat(); draw();
  guardaPerfil({ cc: { [o]: c } });
}
async function startChat() {
  const o = otro(); if (!db || !user || !o) return;
  if (unsub && curChat === o) { pintaOpts(); aplicarChat(); draw(); return; }
  if (unsub) unsub();
  curChat = o; msgs = []; oc = { open: false, tab: null, who: 'me' };
  unsub = db.collection('chats').doc(cidOf(o)).collection('msgs').orderBy('t').limitToLast(100).onSnapshot(s => { msgs = s.docs.map(d => d.data()); draw(); }, e => toast(errMsg(e)));
  draw(); loadBg(o);
}
function draw() {
  const el = $('#msgs'); if (!el) return;
  aplicarChat();
  if (!el._ro && window.ResizeObserver) { el._ro = new ResizeObserver(() => { el.scrollTop = el.scrollHeight; }); el._ro.observe(el); }
  const c = getCC(otro()), sm = bubOf(c.bm), st = bubOf(c.bt);
  const sty = b => `background:${b[2]};color:${b[3]};${b[4] || ''}`;
  el.innerHTML = msgs.length ? msgs.map(m => {
    const h = horaDe(m.t), me = m.de === user.uid ? ' me' : '';
    if (m.tp === 's') {
      if (m.src) return stkOk(m.src) ? `<div class="stm${me}"><img src="${esc(m.src)}" alt="Sticker"><small>${h}</small></div>` : '';
      return `<div class="bub${me}" style="${sty(me ? sm : st)}">${esc(m.tx)}<small>${h}</small></div>`;
    }
    return `<div class="bub${me}" style="${sty(me ? sm : st)}">${esc(m.tx)}<small>${h}</small></div>`;
  }).join('') : `<p class="mu vacio">${ic('chat', 30)}<span>Escribe el primer mensaje</span></p>`;
  el.scrollTop = el.scrollHeight;
}
// m = { tx, tp:'t' } o { src, tp:'s' }
async function enviar(m) {
  const o = otro(); if (!m || (!m.tx && !m.src)) return;
  const ref = db.collection('chats').doc(cidOf(o)), ts = firebase.firestore.FieldValue.serverTimestamp();
  const doc = { de: user.uid, tp: m.tp, t: ts }; if (m.tx) doc.tx = m.tx; if (m.src) doc.src = m.src;
  try {
    await ref.collection('msgs').add(doc);
    await ref.set({ ultimo: { tx: m.tp === 's' ? 'Sticker' : m.tx, tp: m.tp, t: ts } }, { merge: true });
  } catch (e) { toast(errMsg(e)); }
}
document.addEventListener('change', async e => {
  if (e.target.id !== 'bgf' || !e.target.files[0]) return;
  const o = otro();
  try {
    const raw = await leeArchivo(e.target.files[0]); let q = .7, img = await comprime(raw, 900, q);
    while (img.length > 700000 && q > .35) { q -= .1; img = await comprime(raw, 800, q); }
    await db.collection('perfiles').doc(user.uid).collection('fondos').doc(o).set({ img });
    bgImgs[o] = img; await setCC({ fi: true }); toast('Fondo actualizado');
  } catch (er) { toast(er.message && !er.code ? er.message : errMsg(er)); }
});
MODS.push(async (a, t) => {
  if (a === 'tema') { oc.open = !oc.open; if (oc.open) { $('#pan').hidden = true; if (!oc.tab) oc.tab = 'col'; } pintaOpts(); return true; }
  if (a === 'otab') { oc.tab = oc.tab === t.dataset.k ? null : t.dataset.k; pintaOpts(); return true; }
  if (a === 'who') { oc.who = t.dataset.k; pintaOpts(); return true; }
  if (a === 'setcol') { await setCC({ col: t.dataset.k }); return true; }
  if (a === 'setbub') { await setCC(oc.who === 'me' ? { bm: t.dataset.k } : { bt: t.dataset.k }); return true; }
  if (a === 'setfp') { await setCC({ fp: t.dataset.k, fi: false }); return true; }
  if (a === 'bgquita') { await setCC({ fi: false }); try { await db.collection('perfiles').doc(user.uid).collection('fondos').doc(otro()).delete(); } catch (_) {} bgImgs[otro()] = null; return true; }
  if (a === 'pan') {
    const p = $('#pan'); p.hidden = !p.hidden;
    if (!p.hidden) { oc.open = false; pintaOpts(); p.innerHTML = panHtml(); cargarStickers(); }
    return true;
  }
  if (a === 'send') { const i = $('#cm'), v = i.value.trim(); i.value = ''; await enviar({ tx: v, tp: 't' }); return true; }
  if (a === 'addfriend') {
    const id = ($('#fid').value || '').trim();
    if (!id) { toast('Escribe el ID de tu amigo.'); return true; }
    try {
      const q = await db.collection('perfiles').where('idn', '==', id).limit(1).get();
      if (q.empty) { toast('No existe ese ID.'); return true; }
      const o = q.docs[0].id;
      if (o === user.uid) { toast('Ese es tu propio ID.'); return true; }
      perfs[o] = q.docs[0].data();
      await db.collection('chats').doc(cidOf(o)).set({ miembros: [user.uid, o] }, { merge: true });
      toast('Amigo agregado'); await loadChats(); location.hash = '#chat/' + o;
    } catch (e) { toast(errMsg(e)); }
    return true;
  }
  return false;
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'cm') { e.preventDefault(); document.querySelector('[data-a=send]').click(); } });
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#chat/') && unsub) { unsub(); unsub = null; curChat = null; } });
