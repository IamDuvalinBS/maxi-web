// Pase de temporada (estilo Brawl Pass): niveles, XP, misiones de temporada y anuncios (2 anuncios = 1 nivel).
// El catálogo de niveles lo publica el bot en bot/temporada. Los premios de WhatsApp (¥enes y tickets) los entrega
// el bot solo; los cosméticos e insignias se desbloquean aquí. Abajo también están los pases de gacha con código.
let ptCat = null, ptGp = null, ptT = 0, ptCargando = false, ptTab = 'rec', ptX = null; const gpEnv = {};

// ---- Insignias y cosméticos del pase (los ids salen en el catálogo del bot) ----
const INS = {
  novato: { n: 'Novato', c: '#7dd3fc', c2: '#0369a1', s: 'star' }, estrella: { n: 'Estrella', c: '#fde047', c2: '#a16207', s: 'star' },
  rayo: { n: 'Rayo', c: '#c4b5fd', c2: '#5b21b6', s: 'bolt' }, corona: { n: 'Corona', c: '#fdba74', c2: '#9a3412', s: 'crown' },
  leyenda: { n: 'Leyenda T1', c: '#f9a8d4', c2: '#9d174d', s: 'crown' }
};
const INS_S = { star: 'M24 13l3.4 7 7.6 1.1-5.5 5.4 1.3 7.6L24 30.4 17.2 34l1.3-7.6L13 21.1l7.6-1.1z', bolt: 'M26 12L16 26h7l-2 10 11-15h-7z', crown: 'M14 32l-2-14 8 6 4-9 4 9 8-6-2 14z' };
Object.assign(COS, {
  pmarco1: { n: 'Marco Pase Neón', t: 'marco', c: 'conic-gradient(#ff2e9a,#8c5bff,#17e4ff,#ff2e9a)' },
  pmarco2: { n: 'Marco Pase Oro', t: 'marco', c: 'conic-gradient(#fde047,#ff8a1f,#ff2e9a,#fde047)' },
  pportada1: { n: 'Portada Nova', t: 'portada', c: 'radial-gradient(circle at 30% 30%,#ff2e9a99,transparent 45%),radial-gradient(circle at 75% 70%,#17e4ff99,transparent 45%),#140a33' },
  pportada2: { n: 'Portada Estelar', t: 'portada', c: 'linear-gradient(135deg,#ffd21f,#ff2e9a 55%,#8c5bff)' }
});
const TK = { waifu: ['🌸', '#ff4fa3', 'Waifu'], pokemon: ['🌱', '#3ddc84', 'Pokémon'], brawler: ['⭐', '#ffb400', 'Brawl'], snake: ['🐍', '#22c55e', 'Snake'], cod: ['🔫', '#94a3b8', 'COD'], dragon: ['🐉', '#ef4444', 'Dragón'], clash: ['👑', '#3b82f6', 'Clash'] };
const PMIS = [
  { id: 'p1', t: 'Calentamiento', d: 'Juega 5 partidas.', meta: 5, u: 'partidas', k: 'par', xp: 50 },
  { id: 'p2', t: 'En racha', d: 'Juega 15 minutos.', meta: 15, u: 'min', k: 'min', xp: 100 },
  { id: 'p3', t: 'Constante', d: 'Juega 20 partidas.', meta: 20, u: 'partidas', k: 'par', xp: 150 },
  { id: 'p4', t: 'Maratón', d: 'Juega 45 minutos.', meta: 45, u: 'min', k: 'min', xp: 200 },
  { id: 'p5', t: 'Imparable', d: 'Juega 50 partidas.', meta: 50, u: 'partidas', k: 'par', xp: 250 },
  { id: 'p6', t: 'Leyenda', d: 'Juega 120 minutos.', meta: 120, u: 'min', k: 'min', xp: 300 }
];
(() => {
  const e = document.createElement('style');
  e.textContent = ['pmarco1', 'pmarco2'].map(k => `.mk-${k}{border:3px solid transparent!important;background:linear-gradient(#10141c,#10141c) padding-box,${COS[k].c} border-box!important;box-shadow:0 0 16px -2px #ffffff55}`).join('') + `
.pt-hd{border-radius:22px;padding:16px;color:#fff;background:linear-gradient(135deg,#3b1d8f,#7a2cff 55%,#c026d3);border:2px solid #ffffff2e;box-shadow:var(--sh)}
.pt-top{display:flex;align-items:center;gap:12px}.pt-top h2{font-size:1.1rem;text-transform:uppercase;text-shadow:0 3px 0 #0006;line-height:1.1}
.pt-fin{font-size:.78rem;font-weight:800;opacity:.9;margin-top:4px}
.pt-lv{flex:0 0 auto;width:56px;height:56px;border-radius:16px;display:grid;place-items:center;font-family:var(--fd);font-size:1.5rem;background:linear-gradient(#ffe45c,#ff9d00);color:#3a1d00;box-shadow:0 4px 0 #8a4b00,0 8px 16px #0006;transform:rotate(-4deg)}
.pt-xp{display:flex;align-items:center;gap:8px;margin-top:14px;font-weight:900;font-size:.82rem}
.pt-xp .tg{background:#ffd21f;color:#3a1d00;border-radius:8px;padding:2px 8px;transform:skewX(-8deg)}
.pt-bar{flex:1;height:16px;border-radius:9px;background:#0008;border:2px solid #000a;overflow:hidden}.pt-bar>div{height:100%;background:linear-gradient(#ffe45c,#ffb400);transform-origin:left}
.pt-tabs{display:flex;margin:14px 0 10px;border-radius:12px;overflow:hidden;border:2px solid #0006}
.pt-tabs button{flex:1;padding:11px 6px;font-weight:900;text-transform:uppercase;font-size:.82rem;background:#2a1a5e;color:#c9b8ff}.pt-tabs button.on{background:#ff8a1f;color:#fff}
.pt-row{position:relative;display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x proximity;padding:12px 2px 14px;-webkit-overflow-scrolling:touch}
.pt-c{position:relative;flex:0 0 116px;scroll-snap-align:center;border-radius:16px;padding:10px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;color:#fff;background:linear-gradient(#3a1f86,#25125a);border:2px solid #6a45d0}
.pt-n{font-family:var(--fd);font-size:.8rem;font-weight:900;background:#ffd21f;color:#3a1d00;border-radius:999px;padding:2px 12px}
.pt-ic{height:62px;display:grid;place-items:center}.pt-lb{font-weight:800;font-size:.82rem;line-height:1.15;min-height:2.3em;display:flex;align-items:center;justify-content:center}
.pt-s{font-size:.72rem;font-weight:800;opacity:.8;display:inline-flex;gap:4px;align-items:center}
.pt-b{background:linear-gradient(#7CFF5B,#22c55e);color:#053b12;font-weight:900;border-radius:10px;padding:7px 10px;font-size:.8rem;box-shadow:0 3px 0 #0d6b2a}
.pt-c.lock{opacity:.6;filter:saturate(.6)}.pt-c.ready{border-color:#ffd21f;animation:ptp 1.4s ease-in-out infinite}.pt-c.done{border-color:#4ade80}
.pt-ok{position:absolute;top:-9px;right:-7px;width:28px;height:28px;border-radius:50%;background:#22c55e;border:2px solid #fff;display:grid;place-items:center}
@keyframes ptp{0%,100%{box-shadow:0 0 10px #ffd21f66}50%{box-shadow:0 0 24px #ffd21fcc}}
.pt-chip{background:linear-gradient(#ffe45c,#ffb400);color:#3a1d00;font-weight:900;border-radius:8px;padding:3px 10px;font-size:.8rem}
.pt-ins{display:flex;gap:10px;align-items:center;margin-top:10px}.pt-ins .btn{margin:0 0 0 auto;padding:6px 12px;font-size:.8rem}`;
  document.head.appendChild(e);
})();
document.addEventListener('scroll', e => { if (e.target && e.target.classList && e.target.classList.contains('pt-row')) ptX = e.target.scrollLeft; }, true);

// ---- Iconos con color ----
const ptSvg = (px, b) => `<svg viewBox="0 0 48 48" width="${px}" height="${px}" aria-hidden="true">${b}</svg>`;
const icoMoneda = px => ptSvg(px, '<defs><linearGradient id="gcn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a0"/><stop offset=".55" stop-color="#ffc400"/><stop offset="1" stop-color="#e08a00"/></linearGradient></defs><circle cx="24" cy="24" r="20" fill="url(#gcn)" stroke="#b86b00" stroke-width="3"/><circle cx="24" cy="24" r="14" fill="none" stroke="#fff8" stroke-width="2"/><text x="24" y="31" text-anchor="middle" font-size="20" font-weight="900" fill="#8a4b00" font-family="Arial,sans-serif">¥</text>');
const icoTicket = (px, c, em) => ptSvg(px, `<path d="M6 12h36a2 2 0 0 1 2 2v6a4 4 0 0 0 0 8v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a4 4 0 0 0 0-8v-6a2 2 0 0 1 2-2z" fill="${c}" stroke="#0005" stroke-width="2"/><path d="M15 14v20" stroke="#fff9" stroke-dasharray="3 3" stroke-width="2"/><text x="30" y="30" text-anchor="middle" font-size="16">${em}</text>`);
function insSvg(id, px) {
  const i = INS[id]; if (!i) return '';
  return `<svg viewBox="0 0 48 48" width="${px}" height="${px}" role="img" aria-label="${esc(i.n)}" style="vertical-align:middle"><path d="M24 4l16 6v12c0 11-7 18-16 22C15 40 8 33 8 22V10z" fill="${i.c}" stroke="${i.c2}" stroke-width="3" stroke-linejoin="round"/><path d="${INS_S[i.s]}" fill="#fff" stroke="${i.c2}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
}
const insHtml = (id, px) => (id && INS[id]) ? ` <span title="${esc(INS[id].n)}">${insSvg(id, px || 22)}</span>` : '';
function ptIcono(r) {
  if (r.t === 'yenes') return icoMoneda(56);
  if (r.t === 'ticket') { const k = TK[r.cat] || ['🎟️', '#8c5bff', r.cat]; return icoTicket(60, k[1], k[0]); }
  if (r.t === 'ins') return insSvg(r.id, 56);
  const c = COS[r.id]; if (!c) return ic('gift', 40);
  return c.t === 'marco' ? `<span style="display:block;width:54px;height:54px;border-radius:50%;border:4px solid transparent;background:linear-gradient(#10141c,#10141c) padding-box,${c.c} border-box"></span>`
    : `<span style="display:block;width:80px;height:50px;border-radius:10px;border:2px solid #fff5;background:${c.c}"></span>`;
}
function ptEtiqueta(r) {
  if (r.t === 'yenes') return '¥ ' + miles(r.v);
  if (r.t === 'ticket') return '×' + r.v + ' ticket ' + esc((TK[r.cat] || [0, 0, r.cat])[2]);
  if (r.t === 'ins') return 'Insignia ' + esc((INS[r.id] || {}).n || '');
  return esc((COS[r.id] || {}).n || 'Cosmético');
}

// ---- Datos y progreso ----
async function cargaPases(force) {
  if (!db || ptCargando || (!force && ptT && Date.now() - ptT < 60000)) return;
  ptCargando = true;
  try {
    const [t, g] = await Promise.all([db.collection('bot').doc('temporada').get(), db.collection('bot').doc('pases').get()]);
    ptCat = t.exists ? t.data() : null; ptGp = g.exists ? (g.data().lista || []) : [];
  } catch (e) { ptGp = ptGp || []; }
  ptCargando = false; ptT = Date.now(); renderSoon();
}
const ptFin = () => !ptCat || Date.now() > ptCat.fin;
const ptUpd = async d => { try { await db.collection('perfiles').doc(user.uid).update(d); return true; } catch (e) { toast(errMsg(e)); return false; } };
function ptPase() {
  if (!ptCat || !user || !perfil) return null;
  if (!perfil.pase || perfil.pase.t !== ptCat.id) {
    const s = stats();
    perfil.pase = { t: ptCat.id, xp: 0, rec: {}, mis: {}, base: { min: s.min, par: s.par } };
    ptUpd({ pase: perfil.pase });
  }
  const p = perfil.pase; p.rec = p.rec || {}; p.mis = p.mis || {}; p.base = p.base || { min: 0, par: 0 }; p.xp = p.xp || 0; return p;
}
const ptMax = () => ptCat.niv.length * ptCat.xn;
const ptXp = () => owner ? ptMax() : Math.min(ptMax(), ptPase().xp);
const ptListo = n => owner || ptPase().xp >= n * ptCat.xn;
function ptResta() {
  const d = ptCat.fin - Date.now(); if (d <= 0) return 'Temporada terminada';
  const dd = Math.floor(d / 86400000), hh = Math.floor(d % 86400000 / 3600000);
  return 'Termina en ' + (dd > 0 ? dd + ' d ' + hh + ' h' : hh + ' h ' + Math.floor(d % 3600000 / 60000) + ' min');
}
async function paseAnuncio() {       // lo llama anuncios.js al terminar cada anuncio
  if (owner || !user) return;
  for (let i = 0; i < 20 && !ptCat; i++) { await cargaPases(true); if (!ptCat) await new Promise(r => setTimeout(r, 500)); }
  const p = ptPase(); if (!p || ptFin()) return;
  const g = Math.round(ptCat.xn / 2); p.xp += g;
  if (await ptUpd({ 'pase.xp': p.xp })) toast('+' + g + ' XP de temporada');
  if (page() === 'pases') renderSoon();
}

// ---- Pantalla ----
function ptPos() {
  const row = document.querySelector('.pt-row'); if (!row) return;
  if (ptX === null) { const c = document.getElementById('pt-cur'); if (c) row.scrollLeft = c.offsetLeft - (row.clientWidth - c.clientWidth) / 2; ptX = row.scrollLeft; } else row.scrollLeft = ptX;
}
function ptCard(lv, p, cur) {
  const n = lv.n, hecho = !!p.rec[n], listo = !hecho && !ptFin() && ptListo(n), est = hecho ? 'done' : listo ? 'ready' : 'lock';
  return `<div class="pt-c ${est}"${n === cur ? ' id="pt-cur"' : ''}><span class="pt-n">${n}</span>${hecho ? `<span class="pt-ok">${ptSvg(16, '<path d="M10 25l9 9 19-20" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>')}</span>` : ''}
    <div class="pt-ic">${ptIcono(lv.r)}</div><div class="pt-lb">${ptEtiqueta(lv.r)}</div>
    ${listo ? `<button class="pt-b" data-a="ptrec" data-n="${n}">Reclamar</button>` : hecho ? '<span class="pt-s">Reclamado</span>' : `<span class="pt-s">${ic('lock', 12)} Nivel ${n}</span>`}</div>`;
}
function ptInsView() {
  const tengo = Object.keys(INS).filter(k => owner || (perfil.ins || {})[k]); if (!tengo.length) return '';
  const eq = (perfil.eq || {}).ins;
  return `<section class="card"><div class="ti sm">${ic('gift', 22)}<span>Mis insignias</span></div>${tengo.map(k => `<div class="pt-ins">${insSvg(k, 34)}<b>${esc(INS[k].n)}</b><button class="btn sec" data-a="insusar" data-id="${k}">${eq === k ? 'Quitar' : 'Usar'}</button></div>`).join('')}</section>`;
}
function ptMisView(p) {
  const s = stats(), g = Math.round(ptCat.xn / 2);
  adBusy = false;
  return PMIS.map(m => {
    const v = Math.max(0, Math.floor(s[m.k] - (p.base[m.k] || 0))), ok = v >= m.meta, hecha = !!p.mis[m.id];
    return `<section class="card ms"><div class="mt"><b>${m.t}</b><span class="mu">${Math.min(v, m.meta)}/${m.meta} ${m.u}</span></div><p class="mu">${m.d}</p><div class="jbar"><div style="transform:scaleX(${Math.min(1, v / m.meta)})"></div></div>
      <div class="mr"><span class="pt-chip">+${m.xp} XP</span>${hecha ? '<span class="bst on"><i></i>Hecha</span>' : ok ? `<button class="btn sm" data-a="ptmis" data-id="${m.id}">Reclamar</button>` : ''}</div></section>`;
  }).join('') + `<section class="card"><div class="ti">${ic('tv', 22)}<span>Ver anuncios</span></div><p class="mu">2 anuncios completos = 1 nivel (+${g} XP cada uno). Llevas <b id="adn">${s.ads}</b> en total.</p><button class="btn" id="adb" data-a="ad">${ic('play', 16)}Ver anuncio</button><div id="adf"></div></section>`;
}
function gpView() {
  if (!ptGp || !ptGp.length) return '';
  const hechos = (typeof waPerfil !== 'undefined' && waPerfil && Array.isArray(waPerfil.pases)) ? waPerfil.pases : [], vinc = typeof waLink !== 'undefined' && waLink;
  return `<div class="ti" style="margin-top:22px">${ic('ticket', 22)}<span>Pases de gacha</span></div><p class="mu">${vinc ? 'Toca Reclamar y el bot te los entrega solo.' : 'Vincula tu WhatsApp en Mi perfil para que el bot los entregue solo, o envía el código al bot.'}</p>` + ptGp.map(g => {
    const listo = hechos.includes(g.id), env = gpEnv[g.id];
    return `<section class="card"><div class="ti sm"><span style="font-size:1.5rem;line-height:1">${esc(g.e)}</span><span>${esc(g.n)}</span>${listo ? '<span class="bst on"><i></i>Reclamado</span>' : ''}</div><p class="mu">${esc(g.d)}</p>
      ${listo ? '' : `${vinc ? `<button class="btn" data-a="gpreclamar" data-id="${esc(g.id)}"${env ? ' disabled' : ''}>${env ? 'Enviando a tu WhatsApp…' : 'Reclamar en mi WhatsApp'}</button>` : ''}<div class="wacode"><b>${esc(g.c)}</b><button class="btn sm sec" data-a="pasecopy" data-c="${esc(g.c)}">Copiar</button></div><p class="mu">Código para el bot: .pase ${esc(g.c)}</p>`}</section>`;
  }).join('');
}
function pasesView() {
  if (!user) return gate('Entra con Google para ver el pase de temporada.');
  setTimeout(cargaPases, 0);
  if (!ptT) return `<div class="ti">${ic('trophy', 24)}<span>Pases</span></div><section class="card">${empty('trophy', 'Cargando pases…')}</section>`;
  const p = ptCat && ptPase();
  if (!p) return `<div class="ti">${ic('trophy', 24)}<span>Pases</span></div>` + (ptGp && ptGp.length ? '' : `<section class="card">${empty('trophy', 'No hay pases disponibles todavía. Espera a las próximas actualizaciones.')}</section>`) + gpView();
  const xn = ptCat.xn, N = ptCat.niv.length, xp = ptXp(), niv = Math.min(N, Math.floor(xp / xn)), dentro = niv >= N ? xn : xp - niv * xn;
  const cur = (ptCat.niv.find(l => !p.rec[l.n]) || { n: -1 }).n;
  setTimeout(ptPos, 30);
  return `<section class="pt-hd"><div class="pt-top"><div class="pt-lv">${niv}</div><div><h2>${esc(ptCat.nombre)}</h2><div class="pt-fin">⏳ ${ptResta()}</div></div></div>
    <div class="pt-xp"><span class="tg">XP</span><div class="pt-bar"><div style="transform:scaleX(${Math.min(1, dentro / xn)})"></div></div><span>${dentro}/${xn}</span><span class="tg">${Math.min(N, niv + 1)}</span></div></section>
    <div class="pt-tabs"><button class="${ptTab === 'rec' ? 'on' : ''}" data-a="pttab" data-t="rec">Recompensas</button><button class="${ptTab === 'mis' ? 'on' : ''}" data-a="pttab" data-t="mis">Misiones</button></div>`
    + (ptTab === 'rec' ? `<div class="pt-row">${ptCat.niv.map(l => ptCard(l, p, cur)).join('')}</div>${ptInsView()}` : ptMisView(p)) + gpView();
}

MODS.push(async (a, t) => {
  if (a === 'pttab') { ptTab = t.dataset.t === 'mis' ? 'mis' : 'rec'; ptX = null; render(); return true; }
  if (a === 'pasecopy') { try { await navigator.clipboard.writeText('.pase ' + t.dataset.c); toast('Copiado'); } catch (_) { toast('Copia el código a mano'); } return true; }
  if (a === 'insusar') {
    const id = t.dataset.id; if (!INS[id] || !(owner || (perfil.ins || {})[id])) return true;
    const eq = { ...perfil.eq }; eq.ins = eq.ins === id ? null : id; perfil = { ...perfil, eq };
    await guardaPerfil({ eq }); render(); return true;
  }
  if (a === 'ptmis') {
    const m = PMIS.find(x => x.id === t.dataset.id), p = ptPase(); if (!m || !p || p.mis[m.id] || ptFin()) return true;
    if (Math.floor(stats()[m.k] - (p.base[m.k] || 0)) < m.meta) return true;
    p.mis[m.id] = true; p.xp += m.xp;
    if (await ptUpd({ ['pase.mis.' + m.id]: true, 'pase.xp': p.xp })) toast('+' + m.xp + ' XP'); render(); return true;
  }
  if (a === 'ptrec') {
    const n = +t.dataset.n, lv = ptCat && ptCat.niv.find(x => x.n === n), p = ptPase();
    if (!lv || !p || p.rec[n] || ptFin() || !ptListo(n)) return true;
    const r = lv.r, bot = r.t === 'yenes' || r.t === 'ticket';
    if (bot && !(typeof waLink !== 'undefined' && waLink)) { toast('Vincula tu WhatsApp en Mi perfil para recibir este premio.'); return true; }
    const d = { ['pase.rec.' + n]: true };
    if (r.t === 'cos') d['cos.' + r.id] = true;
    if (r.t === 'ins') d['ins.' + r.id] = true;
    t.disabled = true;
    try {
      const b = db.batch(); b.update(db.collection('perfiles').doc(user.uid), d);
      if (bot) b.set(db.collection('pasereclamos').doc(user.uid + '_pt_' + ptCat.id + '-' + n), { uid: user.uid, k: 'pt', i: ptCat.id + '-' + n, t: firebase.firestore.FieldValue.serverTimestamp() });
      await b.commit();
    } catch (e) { toast(errMsg(e)); t.disabled = false; return true; }
    p.rec[n] = true;
    if (r.t === 'cos') perfil.cos = { ...perfil.cos, [r.id]: true };
    if (r.t === 'ins') perfil.ins = { ...perfil.ins, [r.id]: true };
    toast(bot ? '¡Premio enviado a tu WhatsApp!' : '¡Premio desbloqueado!'); render(); return true;
  }
  if (a === 'gpreclamar') {
    const id = t.dataset.id; if (gpEnv[id]) return true;
    try {
      await db.collection('pasereclamos').doc(user.uid + '_gp_' + id).set({ uid: user.uid, k: 'gp', i: id, t: firebase.firestore.FieldValue.serverTimestamp() });
      gpEnv[id] = true; toast('Enviado: llegará a tu WhatsApp en unos segundos'); render();
    } catch (e) { toast(errMsg(e)); }
    return true;
  }
  return false;
});
