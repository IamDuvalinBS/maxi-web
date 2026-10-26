// Estado de tu bot de WhatsApp: el bot lo sube a Firestore (colección "bot") y la página lo muestra en vivo.
// Si el bot todavía no está conectado, esta tarjeta simplemente no aparece.
let botEst = null, botUn = null;
const miles = x => String(Math.max(0, Math.floor(Number(x) || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function escuchaBot() {
  if (!db || !user || botUn) return;
  botUn = db.collection('bot').doc('estado').onSnapshot(s => { botEst = s.exists ? s.data() : null; renderSoon(); }, () => {});
}
const haceTxt = ms => { const m = Math.floor(ms / 60000); if (m < 1) return 'hace un momento'; if (m < 60) return 'hace ' + m + ' min'; const h = Math.floor(m / 60); return h < 24 ? 'hace ' + h + ' h' : 'hace ' + Math.floor(h / 24) + ' d'; };
function botCard() {
  if (!botEst) return '';
  const t = botEst.t && botEst.t.seconds ? botEst.t.seconds * 1000 : 0, vivo = !!botEst.enLinea && Date.now() - t < 180000;
  const n = miles;
  return `<section class="card botc"><div class="ti sm">${ic('bot', 22)}<span>${esc(botEst.nombre || 'Bot de WhatsApp')}</span><span class="bst ${vivo ? 'on' : 'off'}"><i></i>${vivo ? 'En línea' : 'Desconectado'}</span></div>
    <div class="sr"><div>GRUPOS<b>${n(botEst.grupos)}</b></div><div>MENSAJES HOY<b>${n(botEst.mensajesHoy)}</b></div><div>${vivo ? 'ACTIVO' : 'VISTO'}<b style="font-size:.95rem;line-height:1.9">${vivo && botEst.inicio ? haceTxt(Date.now() - botEst.inicio).replace('hace ', '') : (t ? haceTxt(Date.now() - t).replace('hace ', '') : '—')}</b></div></div></section>`;
}
setInterval(() => { if (botEst && document.body.dataset.p === 'inicio') renderSoon(); }, 60000);

// ---------- Lista de comandos del bot (la sube el bot a bot/comandos) ----------
let botCmds = null, botCmdsCargando = false;
async function cargaComandos() {
  if (botCmds || botCmdsCargando || !db) return;
  botCmdsCargando = true;
  try { const d = await db.collection('bot').doc('comandos').get(); botCmds = d.exists ? (d.data().lista || []) : []; } catch (e) { botCmds = []; }
  botCmdsCargando = false; renderSoon();
}
function botView() {
  setTimeout(cargaComandos, 0);
  const hd = `<div class="ti">${ic('bot', 24)}<span>Comandos del bot</span></div>`;
  if (botCmds === null) return hd + `<section class="card">${empty('bot', 'Cargando comandos…')}</section>`;
  if (!botCmds.length) return hd + `<section class="card">${empty('bot', 'Todavía no hay comandos publicados. Aparecerán cuando el bot se conecte a la página.')}</section>`;
  const cats = {}; botCmds.forEach(c => { (cats[c.c || 'General'] = cats[c.c || 'General'] || []).push(c); });
  return hd + `<input class="fi" id="bq" type="search" placeholder="Buscar comando…" aria-label="Buscar comando" autocomplete="off">` +
    Object.keys(cats).sort().map(k => `<details class="card bcat" open><summary><b>${esc(k)}</b><span class="mu">${cats[k].length}</span></summary>${cats[k].map(c => `<div class="bcmd" data-q="${esc((c.n + ' ' + (c.a || []).join(' ') + ' ' + (c.d || '') + ' ' + (c.c || '')).toLowerCase())}"><code>${esc(c.u || '.' + c.n)}</code><p>${esc(c.d || '')}</p></div>`).join('')}</details>`).join('');
}
document.addEventListener('input', e => {
  if (e.target.id !== 'bq') return;
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll('.bcmd').forEach(x => { x.hidden = !!q && !x.dataset.q.includes(q); });
  document.querySelectorAll('.bcat').forEach(c => { c.hidden = !c.querySelector('.bcmd:not([hidden])'); });
});

// ---------- Vincular WhatsApp con la cuenta de la página ----------
let waPerfil = null, waLink = null, waCode = null, waUn = [];
function escuchaWA() {
  if (!db || !user || waUn.length) return;
  waUn.push(db.collection('botperfil').doc(user.uid).onSnapshot(s => { if (!s.exists && s.metadata.fromCache) return; waPerfil = s.exists ? s.data() : null; renderSoon(); }, () => {}));
  waUn.push(db.collection('botlink').doc(user.uid).onSnapshot(s => { if (!s.exists && s.metadata.fromCache) return; waLink = s.exists; renderSoon(); }, () => {}));
  waUn.push(db.collection('perfiles').doc(user.uid).onSnapshot(s => { const d = s.exists ? s.data() : null; if (!perfil || !d) return; const m = d.codeMision || null, ch = (d.codeUlt || 0) !== (perfil.codeUlt || 0) || (m && m.id) !== (perfil.codeMision && perfil.codeMision.id); perfil.codeUsos = d.codeUsos || 0; perfil.codeUlt = d.codeUlt || 0; perfil.codeUltId = d.codeUltId || null; perfil.codeMision = m; if (ch) renderSoon(); }, () => {}));
}
function soltarWA() { waUn.forEach(f => f()); waUn = []; waPerfil = null; waLink = null; waCode = null; }
function waCard() {
  if (waLink === null) return '';             // aún no sabemos si está vinculado (evita parpadeos al recargar)
  if (!botEst && !waLink) return '';          // el bot aún no está conectado a la página
  const hd = `<div class="ti sm">${ic('chat', 22)}<span>Mi WhatsApp</span></div>`;
  if (waLink) {
    const p = waPerfil, n = miles, mon = esc((p && p.moneda) || '¥enes');
    return `<section class="card wa">${hd}${p ? `<div class="sr"><div>${mon.toUpperCase()}<b>${n(p.wallet)}</b></div><div>BANCO<b>${n(p.bank)}</b></div><div>NIVEL<b>${n(p.nivel)}</b></div></div>${p.nombre ? `<p class="mu" style="margin-top:10px">Nombre en el bot: ${esc(p.nombre)}</p>` : ''}` : `<p class="mu">Vinculado. Cargando tus datos del bot…</p>`}<button class="btn sec sm" style="margin-top:12px" data-a="wades">Desvincular</button></section>`;
  }
  const vivo = waCode && waCode.exp > Date.now();
  return `<section class="card wa">${hd}<p class="mu">Vincula tu WhatsApp para ver aquí tus ${'¥enes'}, banco y nivel del bot.</p>${vivo ? `<div class="wacode"><b>${esc(waCode.code)}</b><button class="btn sm sec" data-a="wacopy">Copiar</button></div><p>Envíale al bot por WhatsApp: <b>.vincular ${esc(waCode.code)}</b></p><p class="mu">El código vence en 10 minutos.</p>` : ''}<button class="btn" data-a="wagen">${vivo ? 'Generar otro código' : 'Generar código'}</button></section>`;
}
MODS.push(async (a, t) => {
  if (a === 'wagen') {
    const al = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint8Array(8)), code = [...r].map(x => al[x % al.length]).join('');
    try {
      if (waCode) db.collection('vinculos').doc(waCode.code).delete().catch(() => {});
      const exp = Date.now() + 10 * 60000;
      await db.collection('vinculos').doc(code).set({ uid: user.uid, nombre: nombre(), exp });
      waCode = { code, exp }; render();
    } catch (e) { toast(errMsg(e)); }
    return true;
  }
  if (a === 'wacopy') { try { await navigator.clipboard.writeText('.vincular ' + waCode.code); toast('Copiado'); } catch (_) { toast('Copia el código a mano'); } return true; }
  if (a === 'wades') {
    if (!confirm('¿Desvincular tu WhatsApp de esta cuenta?')) return true;
    try { await db.collection('botlink').doc(user.uid).delete(); await db.collection('botperfil').doc(user.uid).delete(); toast('WhatsApp desvinculado'); } catch (e) { toast(errMsg(e)); }
    return true;
  }
  return false;
});

// ---------- Misiones que desbloquean .code (pedir código de subbot en WhatsApp) ----------
// Cada misión sale al azar, todas son de juegos/anuncios de nuestro patrocinador. Al pedir un código se gasta la misión y hay
// 1 día de espera; luego toca otra distinta. El bot revisa el progreso (misma lista en src/subbots/gestor.js → MISIONES).
const CODE_CD = 24 * 3600000;
const CODE_MIS = {
  f1: { n: 'fácil', tipo: 'par', meta: 3, t: 'Completa 3 partidas en juegos del patrocinador', u: 'partidas' },
  f2: { n: 'fácil', tipo: 'min', meta: 5, t: 'Juega 5 minutos a juegos del patrocinador', u: 'min' },
  f3: { n: 'fácil', tipo: 'ads', meta: 3, t: 'Mira 3 anuncios del patrocinador', u: 'anuncios' },
  m1: { n: 'media', tipo: 'min', meta: 15, t: 'Juega 15 minutos a juegos del patrocinador', u: 'min' },
  m2: { n: 'media', tipo: 'dist', meta: 2, t: 'Prueba 2 juegos distintos del patrocinador (3 min en cada uno)', u: 'juegos' },
  m3: { n: 'media', tipo: 'ads', meta: 8, t: 'Mira 8 anuncios del patrocinador', u: 'anuncios' },
  m4: { n: 'media', tipo: 'uno', meta: 10, t: 'Juega 10 minutos en un mismo juego del patrocinador', u: 'min' },
  d1: { n: 'difícil', tipo: 'min', meta: 30, t: 'Juega 30 minutos a juegos del patrocinador', u: 'min' },
  d2: { n: 'difícil', tipo: 'dist', meta: 4, t: 'Prueba 4 juegos distintos del patrocinador (3 min en cada uno)', u: 'juegos' },
  d3: { n: 'difícil', tipo: 'ads', meta: 15, t: 'Mira 15 anuncios del patrocinador', u: 'anuncios' },
  d4: { n: 'difícil', tipo: 'uno', meta: 20, t: 'Juega 20 minutos en un mismo juego del patrocinador', u: 'min' }
};
const codeSp = () => Object.keys(JG).filter(k => JG[k].ext);
function codeBase() {
  const s = typeof stats === 'function' ? stats() : { pj: {}, pp: {}, ads: 0 }, pj = {}, pp = {};
  for (const k of codeSp()) { pj[k] = s.pj[k] || 0; pp[k] = s.pp[k] || 0; }
  return { pj, pp, ads: s.ads || 0 };
}
function codeProg(m) {
  const s = typeof stats === 'function' ? stats() : { pj: {}, pp: {}, ads: 0 }, b = (perfil.codeMision && perfil.codeMision.base) || {}, bj = b.pj || {}, bp = b.pp || {};
  const d = k => Math.max(0, (s.pj[k] || 0) - (bj[k] || 0)), ks = codeSp();
  if (m.tipo === 'min') return ks.reduce((a, k) => a + d(k), 0);
  if (m.tipo === 'uno') return ks.reduce((a, k) => Math.max(a, d(k)), 0);
  if (m.tipo === 'dist') return ks.filter(k => d(k) >= 3).length;
  if (m.tipo === 'par') return ks.reduce((a, k) => a + Math.max(0, (s.pp[k] || 0) - (bp[k] || 0)), 0);
  return Math.max(0, (s.ads || 0) - (b.ads || 0));
}
let codeAsignando = false;
function codeAsigna() {          // elige una misión al azar distinta a la última que se hizo
  if (codeAsignando) return; codeAsignando = true;
  const ids = Object.keys(CODE_MIS).filter(k => k !== perfil.codeUltId), id = ids[Math.floor(Math.random() * ids.length)];
  const m = { id, base: codeBase(), t: Date.now() };
  perfil.codeMision = m;
  db.collection('perfiles').doc(user.uid).set({ codeMision: m }, { merge: true }).catch(() => { perfil.codeMision = null; }).finally(() => { codeAsignando = false; renderSoon(); });
}
function codeMisionCard() {
  if (!user || !perfil) return '';
  const hd = `<b>${ic('bot', 18)} Misión · Desbloquea .code</b>`, intro = `<p class="mu">Completa la misión del patrocinador para pedir un código de vinculación (<b>.code</b>) en el bot. Cada código gasta la misión y hay 1 día de espera antes de la siguiente (siempre distinta).</p>`;
  if (owner) return `<section class="card ms"><div class="mt">${hd}</div>${intro}<div class="mr"><span class="ok">${ic('crown', 14)} Owner: puedes pedir .code sin misión</span></div></section>`;
  if (!waLink) return `<section class="card ms"><div class="mt">${hd}</div>${intro}<div class="mr"><span class="mu">${waLink === null ? 'Cargando…' : 'Vincula tu WhatsApp para que el bot reconozca tu progreso.'}</span>${waLink === null ? '' : '<a class="btn sec sm" href="#perfil">Vincular</a>'}</div></section>`;
  const resta = (perfil.codeUlt || 0) + CODE_CD - Date.now();
  if (resta > 0) {
    const h = Math.floor(resta / 3600000), mi = Math.ceil((resta % 3600000) / 60000);
    return `<section class="card ms"><div class="mt">${hd}<span class="mu">Cooldown</span></div>${intro}<div class="mr"><span class="mu">Tu próxima misión estará lista en <b>${h > 0 ? h + ' h ' : ''}${mi} min</b>.</span></div></section>`;
  }
  const cm = perfil.codeMision, m = cm && CODE_MIS[cm.id];
  if (!m) { codeAsigna(); return `<section class="card ms"><div class="mt">${hd}</div>${intro}<div class="mr"><span class="mu">Preparando tu misión…</span></div></section>`; }
  const prog = Math.min(m.meta, codeProg(m)), ok = prog >= m.meta;
  const ir = m.tipo === 'ads' ? '<a class="btn sm" href="#misiones">Ver anuncios (abajo)</a>' : '<a class="btn sm" href="#juegos">Jugar ahora</a>';
  return `<section class="card ms"><div class="mt">${hd}<span class="mu">${m.n}</span></div>${intro}<p><b>${m.t}</b></p><div class="mt"><span class="mu">${Math.floor(prog)}/${m.meta} ${m.u}</span></div><div class="jbar"><div style="transform:scaleX(${prog / m.meta})"></div></div><div class="mr">${ok ? `<span class="ok">${ic('check', 14)} Misión completa</span><span class="mu">Escribe <b>.code tu_número</b> en el bot.</span>` : ir}</div></section>`;
}
