// Perfil, misiones y cosméticos (todo se guarda en la cuenta)
const COS = {
  neon: { n: 'Marco Neón', t: 'marco', c: 'linear-gradient(135deg,#22d3ee,#4ade80)' },
  aurora: { n: 'Marco Aurora', t: 'marco', c: 'conic-gradient(#22d3ee,#a78bfa,#f472b6,#22d3ee)' },
  dorado: { n: 'Marco Dorado', t: 'marco', c: 'linear-gradient(135deg,#fde047,#f59e0b,#fde047)' },
  sakura: { n: 'Marco Sakura', t: 'marco', c: 'linear-gradient(135deg,#f9a8d4,#fb7185,#f9a8d4)' },
  olas: { n: 'Portada Olas', t: 'portada', c: 'radial-gradient(circle at 50% 130%,#67e8f9,transparent 60%),linear-gradient(#0c4a6e,#0e7490)' },
  galaxia: { n: 'Portada Galaxia', t: 'portada', c: 'radial-gradient(circle at 20% 30%,#a78bfa99,transparent 40%),radial-gradient(circle at 80% 70%,#f472b699,transparent 40%),#0f0a26' },
  atardecer: { n: 'Portada Atardecer', t: 'portada', c: 'linear-gradient(180deg,#fb923c,#db2777 60%,#4c1d95)' },
  bgalaxia: { n: 'Banner Galaxia', t: 'portada', c: 'url(img/banner-galaxia.jpg) center/cover' },
  bcarrera: { n: 'Banner Carrera', t: 'portada', c: 'url(img/banner-carrera.jpg) center/cover' }
};
const MIS = [
  { id: 'm10', t: 'Calentamiento', d: 'Juega 10 minutos en total.', meta: 10, u: 'min', f: s => s.min, rec: 'neon' },
  { id: 'j3', t: 'Explorador', d: 'Prueba 3 juegos distintos.', meta: 3, u: 'juegos', f: s => Object.keys(s.pj).length, rec: 'olas' },
  { id: 'm30', t: 'Maratón', d: 'Juega 30 minutos en total.', meta: 30, u: 'min', f: s => s.min, rec: 'aurora' },
  { id: 'p15', t: 'Constante', d: 'Juega 15 partidas.', meta: 15, u: 'partidas', f: s => s.par, rec: 'galaxia' },
  { id: 'm60', t: 'Leyenda', d: 'Juega 60 minutos en total.', meta: 60, u: 'min', f: s => s.min, rec: 'dorado' },
  { id: 'j7', t: 'Todoterreno', d: 'Prueba 7 juegos distintos.', meta: 7, u: 'juegos', f: s => Object.keys(s.pj).length, rec: 'atardecer' },
  { id: 'm120', t: 'Imparable', d: 'Juega 120 minutos en total.', meta: 120, u: 'min', f: s => s.min, rec: 'sakura' },
  { id: 'a10', t: 'Patrocinado I', d: 'Mira 10 anuncios.', meta: 10, u: 'anuncios', f: s => s.ads, rec: 'bgalaxia' },
  { id: 'a20', t: 'Patrocinado II', d: 'Mira 20 anuncios en total.', meta: 20, u: 'anuncios', f: s => s.ads, rec: 'bcarrera' }
];
(() => { const e = document.createElement('style'); e.textContent = Object.keys(COS).filter(k => COS[k].t === 'marco').map(k => `.mk-${k}{border:3px solid transparent!important;background:linear-gradient(#10141c,#10141c) padding-box,${COS[k].c} border-box!important;box-shadow:0 0 16px -2px #ffffff55}`).join(''); document.head.appendChild(e); })();
const marcoCls = () => (perfil && perfil.eq && perfil.eq.marco) ? ' mk-' + perfil.eq.marco : '';
function stats() { perfil = perfil || {}; const s = perfil.stats = perfil.stats || {}; s.min = s.min || 0; s.par = s.par || 0; s.pj = s.pj || {}; s.pp = s.pp || {}; s.ads = s.ads || 0; return s; }
const guardaPerfil = async d => { try { await db.collection('perfiles').doc(user.uid).set(d, { merge: true }); } catch (e) { toast(errMsg(e)); } };
const gStats = () => guardaPerfil({ stats: { ...stats(), ts: firebase.firestore.FieldValue.serverTimestamp() } });
const cosPrev = id => `<span class="sw2 ${COS[id].t}" style="background:${COS[id].c}"></span>`;

// ---- Seguimiento de tiempo jugado ----
let TJ = null;
function acumula() {
  if (!TJ) return; const n = Date.now();
  if (TJ.vis) { const m = (n - TJ.t0) / 60000, s = stats(); s.min = Math.round((s.min + m) * 100) / 100; s.pj[TJ.id] = Math.round(((s.pj[TJ.id] || 0) + m) * 100) / 100; }
  TJ.t0 = n; TJ.vis = !document.hidden;
}
function hud() {
  if (!TJ) return; const s = stats(), pr = x => Math.floor(x.f(s));
  MIS.forEach(x => { if (pr(x) >= x.meta && !TJ.hechas.has(x.id)) { TJ.hechas.add(x.id); toast('🎯 ¡Misión completada: ' + x.t + '! Reclama tu premio en Misiones.'); } });
  const m = MIS.find(x => x.u !== 'anuncios' && pr(x) < x.meta); let h = $('#mhud');
  if (!m) { if (h) h.remove(); return; }
  if (!h) { h = document.createElement('div'); h.id = 'mhud'; document.body.appendChild(h); }
  h.textContent = '🎯 ' + pr(m) + '/' + m.meta + ' ' + m.u;
}
function tickJ() { acumula(); if (Date.now() - TJ.ult > 60000) { TJ.ult = Date.now(); gStats(); } hud(); }
function jugadaIniciar(id) {
  jugadaFin(); if (!db || !user) return;
  const s = stats(), hechas = new Set(MIS.filter(m => Math.floor(m.f(s)) >= m.meta).map(m => m.id));
  s.par++; s.pp[id] = (s.pp[id] || 0) + 1;
  TJ = { id, t0: Date.now(), vis: !document.hidden, ult: Date.now(), hechas, iv: setInterval(tickJ, 10000) };
  document.addEventListener('visibilitychange', acumula); hud();
}
function jugadaFin() {
  if (!TJ) return; acumula(); clearInterval(TJ.iv); document.removeEventListener('visibilitychange', acumula); TJ = null;
  gStats(); const h = $('#mhud'); if (h) h.remove();
}
window.addEventListener('pagehide', () => { if (TJ) { acumula(); gStats(); } });

// ---- Pantallas ----
function misionesView() {
  const s = stats(), rc = perfil.rec || {};
  return `<section class="card"><div class="ti">🎯 Misiones</div><p class="mu">Juega y gana cosméticos para tu perfil. Se guardan para siempre en tu cuenta.</p></section>` + MIS.map(m => {
    const p = owner ? m.meta : Math.floor(m.f(s)), ok = p >= m.meta;
    return `<section class="card ms"><div class="mt"><b>${m.t}</b><span class="mu">${Math.min(p, m.meta)}/${m.meta} ${m.u}</span></div><p class="mu">${m.d}</p><div class="jbar"><div style="transform:scaleX(${Math.min(1, p / m.meta)})"></div></div><div class="mr">🎁 ${cosPrev(m.rec)}<span>${esc(COS[m.rec].n)}</span>${owner ? '<span class="ok">👑 Desbloqueada (owner)</span>' : rc[m.id] ? '<span class="ok">✔ Reclamada</span>' : ok ? `<button class="btn" data-a="reclamar" data-id="${m.id}">Reclamar</button>` : ''}</div></section>`;
  }).join('') + (typeof anunciosView === 'function' ? anunciosView() : '');
}
function perfilView() {
  const s = stats(), p = perfil, cos = owner ? Object.fromEntries(Object.keys(COS).map(k => [k, 1])) : (p.cos || {}), eq = p.eq || {}, ks = Object.keys(COS), tengo = ks.filter(k => cos[k]).length;
  const dias = p.creado && p.creado.seconds ? Math.max(1, Math.floor((Date.now() / 1000 - p.creado.seconds) / 86400)) : 1;
  const portada = eq.portada && COS[eq.portada] ? COS[eq.portada].c : 'linear-gradient(135deg,#0e7490,#6d28d9)';
  const jug = Object.keys(JG).filter(k => s.pp[k]);
  return `<section class="card pr"><div class="pb" style="background:${portada}"></div><div class="pa">${avatar(96)}<label class="pen" for="fi" aria-label="Cambiar foto"><svg viewBox="0 0 24 24" width="16" height="16" fill="#04262b" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></label><input id="fi" type="file" accept="image/*" hidden></div><div class="in"><div class="pn2"><b>${esc(nombre())}</b> ${owner ? vf() : ''}</div><div class="mu" style="text-align:center;margin-bottom:8px">ID: <b>${esc(p.idn || '…')}</b></div>
    <input id="bio" maxlength="80" value="${esc(p.bio || '')}" placeholder="Escribe algo aquí…" aria-label="Biografía"><button class="btn sec" data-a="bio" style="margin-top:8px">Guardar frase</button>
    <div class="sr"><div>NIVEL<b>${1 + Math.floor(s.min / 5)}</b></div><div>DÍAS AQUÍ<b>${dias}</b></div><div>MINUTOS<b>${Math.floor(s.min)}</b></div></div></div></section>
  <section class="card"><div class="ti">🎁 Colección <span class="mu" style="font-size:.9rem">(${tengo}/${ks.length})</span></div><div class="cg">${ks.map(k => { const c = COS[k], t = cos[k]; return `<div class="ct${t ? '' : ' lock'}">${cosPrev(k)}${esc(c.n)}${t ? `<button class="btn sec" style="margin:6px 0 0;padding:6px 8px;font-size:.75rem" data-a="equipar" data-id="${k}">${eq[c.t] === k ? 'Quitar' : 'Usar'}</button>` : '<div class="mu">🔒 Bloqueado</div>'}</div>`; }).join('')}</div></section>
  <section class="card"><div class="ti">📊 Mis estadísticas</div>${jug.length ? jug.map(k => { const g = JG[k], m = s.pj[k] || 0; return `<div class="er"><span style="font-size:1.6rem">${g.ic}</span><div style="flex:1;min-width:0"><b>${g.n}</b> <span class="mu">Nivel ${1 + Math.floor(m / 5)}</span><div class="jbar"><div style="transform:scaleX(${(m % 5) / 5})"></div></div><small class="mu">Partidas: ${s.pp[k]} · ${Math.floor(m)} min</small></div></div>`; }).join('') : empty('🎮', 'Aún no has jugado. Tus estadísticas aparecerán aquí.')}</section>`;
}
MODS.push(async (a, t) => {
  if (a === 'reclamar') {
    const m = MIS.find(x => x.id === t.dataset.id); if (!m || Math.floor(m.f(stats())) < m.meta || (perfil.rec || {})[m.id]) return true;
    perfil = { ...perfil, rec: { ...perfil.rec, [m.id]: true }, cos: { ...perfil.cos, [m.rec]: true } };
    await guardaPerfil({ rec: { [m.id]: true }, cos: { [m.rec]: true } }); toast('🎁 ¡Ganaste ' + COS[m.rec].n + '!'); render(); return true;
  }
  if (a === 'equipar') {
    const id = t.dataset.id, c = COS[id]; if (!c || !(owner || (perfil.cos || {})[id])) return true;
    const eq = { ...perfil.eq }; eq[c.t] = eq[c.t] === id ? null : id; perfil = { ...perfil, eq };
    await guardaPerfil({ eq }); render(); return true;
  }
  if (a === 'bio') { const v = ($('#bio').value || '').trim().slice(0, 80); perfil = { ...perfil, bio: v }; await guardaPerfil({ bio: v }); toast('Guardado'); return true; }
  return false;
});
