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
let waPerfil = null, waLink = false, waCode = null, waUn = [];
function escuchaWA() {
  if (!db || !user || waUn.length) return;
  waUn.push(db.collection('botperfil').doc(user.uid).onSnapshot(s => { waPerfil = s.exists ? s.data() : null; renderSoon(); }, () => {}));
  waUn.push(db.collection('botlink').doc(user.uid).onSnapshot(s => { waLink = s.exists; renderSoon(); }, () => {}));
  waUn.push(db.collection('bot').doc('codigo').onSnapshot(s => { if (s.exists && s.data().min) codeCfg = { min: Number(s.data().min) || 15 }; renderSoon(); }, () => {}));
  waUn.push(db.collection('perfiles').doc(user.uid).onSnapshot(s => { if (perfil && s.exists && (s.data().codeUsos || 0) !== (perfil.codeUsos || 0)) { perfil.codeUsos = s.data().codeUsos || 0; renderSoon(); } }, () => {}));
}
function soltarWA() { waUn.forEach(f => f()); waUn = []; waPerfil = null; waLink = false; waCode = null; }
function waCard() {
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

// ---------- Misión que desbloquea .code (pedir código de subbot en WhatsApp) ----------
// El bot lee tus minutos en juegos patrocinadores y cuántos códigos ya pediste (perfiles/{uid}.codeUsos).
let codeCfg = { min: 15 };
function codeMin() {
  const s = typeof stats === 'function' ? stats() : { pj: {} }, j = (perfil && perfil.juegos) || {};
  return Object.keys(JG).filter(k => JG[k].ext).reduce((a, k) => a + Math.max((j[k] && j[k].minutos) || 0, s.pj[k] || 0), 0);
}
function codeMisionCard() {
  if (!user || !perfil) return '';
  const meta = codeCfg.min || 15, usos = perfil.codeUsos || 0, prog = Math.max(0, codeMin() - meta * usos), ok = prog >= meta;
  const estado = owner ? `<span class="ok">${ic('crown', 14)} Owner: puedes pedir .code sin misión</span>`
    : !waLink ? `<span class="mu">Vincula tu WhatsApp para que el bot reconozca tu progreso.</span><a class="btn sec sm" href="#perfil">Vincular</a>`
    : ok ? `<span class="ok">${ic('check', 14)} Misión completa</span><span class="mu">Escribe <b>.code tu_número</b> en el bot.</span>`
    : `<a class="btn sm" href="#juegos">Jugar ahora</a>`;
  return `<section class="card ms"><div class="mt"><b>${ic('bot', 18)} Misión · Desbloquea .code</b><span class="mu">${owner ? meta : Math.min(Math.floor(prog), meta)}/${meta} min</span></div><p class="mu">Juega ${meta} minutos a un juego de nuestro patrocinador para poder pedir un código de vinculación (<b>.code</b>) en el bot. Cada código nuevo necesita completar la misión otra vez.</p><div class="jbar"><div style="transform:scaleX(${owner ? 1 : Math.min(1, prog / meta)})"></div></div><div class="mr">${estado}</div></section>`;
}
