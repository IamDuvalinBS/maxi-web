// Perfil público: se abre al tocar la foto o el nombre de otra persona (#u/ID)
const pubC = {};
const marcoDe = p => (p.eq && p.eq.marco && COS[p.eq.marco]) ? ' mk-' + p.eq.marco : '';
async function cargaPublico(uid) {
  if (!db) return;
  try {
    const d = await db.collection('perfiles').doc(uid).get();
    pubC[uid] = { t: Date.now(), d: d.exists ? d.data() : null };
    if (location.hash === '#u/' + uid) renderSoon();
  } catch (e) { toast(errMsg(e)); }
}
function publicoView() {
  const uid = decodeURIComponent(location.hash.slice(3));
  if (user && uid === user.uid) { setTimeout(() => location.replace('#perfil'), 0); return ''; }
  const c = pubC[uid];
  if (!c || Date.now() - c.t > 60000) setTimeout(() => cargaPublico(uid), 0);
  const back = `<button class="back" data-a="atras">${ic('back', 20)}Volver</button>`;
  if (!c) return back + `<section class="card">${empty('user', 'Cargando perfil…')}</section>`;
  if (!c.d) return back + `<section class="card">${empty('user', 'Este perfil ya no existe.')}</section>`;
  const p = c.d, s = p.stats || {}, min = s.min || 0, eq = p.eq || {};
  const dias = p.creado && p.creado.seconds ? Math.max(1, Math.floor((Date.now() / 1000 - p.creado.seconds) / 86400)) : 1;
  const portada = eq.portada && COS[eq.portada] ? COS[eq.portada].c : 'linear-gradient(135deg,#0e7490,#6d28d9)';
  const pj = s.pj || {}, jug = Object.keys(JG).filter(k => (s.pp || {})[k]).sort((x, y) => (pj[y] || 0) - (pj[x] || 0)).slice(0, 5);
  return back + `<section class="card pr"><div class="pb" style="background:${portada}"></div>
    <div class="pa"><span class="av${marcoDe(p)}" style="width:96px;height:96px;font-size:38px">${p.avatar && imgOk(p.avatar) ? `<img src="${esc(p.avatar)}" alt="" referrerpolicy="no-referrer">` : inicial(p.nombre)}</span></div>
    <div class="in"><div class="pn2">${esc(p.nombre || 'Usuario')}${esOwner(uid) ? ' ' + vf() : ''}</div>${p.bio ? `<p class="mu" style="text-align:center;overflow-wrap:anywhere">${esc(p.bio)}</p>` : ''}
    <div class="sr"><div>NIVEL<b>${1 + Math.floor(min / 5)}</b></div><div>DÍAS AQUÍ<b>${dias}</b></div><div>MINUTOS<b>${Math.floor(min)}</b></div></div>
    <div class="row"><button class="btn" data-a="msgto" data-id="${esc(uid)}">${ic('chat', 18)}Enviar mensaje</button></div></div></section>` +
    (jug.length ? `<section class="card"><div class="ti sm">${ic('game', 22)}<span>Juega mucho</span></div>${jug.map(k => { const g = JG[k], m = Math.floor(pj[k] || 0); return `<div class="er"><span class="gic">${ic(g.ic, 24)}</span><div style="flex:1;min-width:0"><b>${g.n}</b> <span class="mu">Nivel ${1 + Math.floor(m / 5)}</span><small class="mu" style="display:block">${m} min jugados</small></div></div>`; }).join('')}</section>` : '');
}
MODS.push(async (a, t) => {
  if (a === 'atras') { if (history.length > 1) { history.back(); } else location.hash = '#inicio'; return true; }
  if (a === 'msgto') {
    const o = t.dataset.id; if (!o || !user) return true;
    try { await perfOf(o); await db.collection('chats').doc([user.uid, o].sort().join('_')).set({ miembros: [user.uid, o] }, { merge: true }); location.hash = '#chat/' + o; }
    catch (e) { toast(errMsg(e)); }
    return true;
  }
  return false;
});
