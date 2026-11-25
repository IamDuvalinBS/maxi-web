// Chats con pestañas (Chats · Estados · Canales), Mambo IA, estados de 24 h y mensajes temporales.
Object.assign(IC, { search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.500-3.500"/>' });

const efiTxt = s => s >= 604800 ? '7 días' : s >= 86400 ? '24 h' : s >= 3600 ? '1 h' : '';
const EFI = [[0, 'Desactivados'], [3600, '1 hora'], [86400, '24 horas'], [604800, '7 días']];
const hace = t => {
  const ms = t && t.toMillis ? t.toMillis() : Date.now(), m = Math.max(0, Math.round((Date.now() - ms) / 60000));
  return m < 1 ? 'ahora' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.floor(m / 60) + ' h' : 'ayer';
};
let chTab = 'chats';
try { chTab = sessionStorage.getItem('chTab') || 'chats'; } catch (_) {}

// ───────── pantalla principal: pestañas ─────────
function chatsView() {
  const nN = chats.filter(c => c.otro !== 'bot' && chatNuevo(c)).length;
  const T = [['chats', 'Chats'], ['estados', 'Estados'], ['canales', 'Canales']];
  const tabs = `<nav class="wtabs" role="tablist" aria-label="Secciones">${T.map(([k, n]) => `<button role="tab" aria-selected="${chTab === k}" class="${chTab === k ? 'on' : ''}" data-a="ctab" data-k="${k}">${n}${k === 'chats' && nN ? `<i>${nN}</i>` : ''}</button>`).join('')}</nav>`;
  let body, fabs = '';
  if (chTab === 'estados') {
    body = estBody();
    fabs = `<button class="fabs2" data-a="estnuevo" data-k="t" aria-label="Estado de texto">${ic('edit', 22)}</button><button class="fabm" data-a="estnuevo" data-k="i" aria-label="Estado con foto">${ic('camera', 26)}</button>`;
  } else if (chTab === 'canales') body = canBody();
  else {
    body = (typeof avisosBanner === 'function' ? avisosBanner() : '') + `<label class="csb">${ic('search', 18)}<input id="csb" placeholder="Buscar un chat" aria-label="Buscar un chat" autocomplete="off"></label>` + chatsLista();
    fabs = `<button class="fabs2 ia" data-a="goia" aria-label="Mambo IA">${ic('sparkle', 24)}</button><button class="fabm" data-a="afopen" aria-label="Agregar amigo">${ic('userplus', 26)}</button>`;
  }
  return `<div class="ti">${ic('chat', 24)}<span>Chats</span></div>${tabs}${body}<div class="fabpad"></div>${fabs ? `<div class="fabs">${fabs}</div>` : ''}`;
}
document.addEventListener('input', e => {                   // búsqueda de chats sin redibujar
  if (!e.target || e.target.id !== 'csb') return;
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll('.chr[data-n]').forEach(r => { r.style.display = !q || r.dataset.n.includes(q) ? '' : 'none'; });
});

// ───────── agregar amigo (hoja con el ID) ─────────
function afCierra() { const o = $('#afo'); if (o) o.remove(); }
function afAbre() {
  afCierra();
  const o = document.createElement('div'); o.id = 'afo'; o.className = 'mxo'; o.dataset.a = 'afx';
  o.innerHTML = `<div class="mxs" data-a="mxkeep"><div class="ti sm">${ic('userplus', 22)}<span>Agregar amigo</span></div><p class="mu" style="margin:4px 0 12px">Escribe el ID de su perfil.</p><div class="cmp"><input id="fid" inputmode="numeric" maxlength="12" placeholder="ID de tu amigo" aria-label="ID de tu amigo" autocomplete="off"><button class="snd" data-a="addfriend" aria-label="Agregar amigo">${ic('userplus', 20)}</button></div></div>`;
  document.body.appendChild(o); setTimeout(() => { const f = $('#fid'); if (f) f.focus(); }, 60);
}

// ───────── mensajes temporales ─────────
function efiAbre() {
  mxCierra();
  const o = document.createElement('div'); o.id = 'mxo'; o.className = 'mxo'; o.dataset.a = 'mxclose';
  o.innerHTML = `<div class="mxs" data-a="mxkeep"><div class="ti sm">${ic('clock', 22)}<span>Mensajes temporales</span></div><p class="mu" style="margin:4px 4px 10px">Los mensajes nuevos desaparecen solos después del tiempo que elijas. Cualquiera de los dos puede cambiarlo.</p><div class="mxl">${EFI.map(([s, n]) => `<button data-a="efiset" data-k="${s}">${ic(s === efiSeg ? 'check2' : 'clock', 22)}<span>${n}</span></button>`).join('')}</div></div>`;
  document.body.appendChild(o);
}
async function efiPon(n) {
  mxCierra();
  try { await db.collection('chats').doc(cidOf(otro())).set({ efi: n }, { merge: true }); toast(n ? 'Mensajes temporales: ' + efiTxt(n) : 'Mensajes temporales desactivados'); }
  catch (e) { toast(errMsg(e) + ' [mensajes temporales]'); }
}

// ───────── estados (24 h) ─────────
const EBG = ['linear-gradient(135deg,#7c3aed,#ec4899)', 'linear-gradient(135deg,#0ea5e9,#22d3ee)', 'linear-gradient(135deg,#f59e0b,#ef4444)', 'linear-gradient(135deg,#10b981,#3b82f6)', 'linear-gradient(135deg,#1f2937,#6d28d9)', 'linear-gradient(135deg,#f43f5e,#f97316)'];
let EST = null, estCarg = false, sv = null, sc = null;
const eVis = () => { try { return new Set(JSON.parse(localStorage.getItem('estVistos') || '[]')); } catch (_) { return new Set(); } };
const eMarca = id => { const v = eVis(); v.add(id); try { localStorage.setItem('estVistos', JSON.stringify([...v].slice(-300))); } catch (_) {} };
async function estLoad() {
  if (!db || !user) return;
  const uids = [user.uid, ...chats.filter(c => c.otro !== 'bot').map(c => c.otro)].slice(0, 30);
  try {
    const s = await db.collection('estados').where('uid', 'in', uids).get(), ya = Date.now(), by = {};
    for (const d of s.docs) {
      const x = { id: d.id, ...d.data() };
      if (x.exp > ya) (by[x.uid] = by[x.uid] || []).push(x); else if (x.uid === user.uid) d.ref.delete().catch(() => {});
    }
    for (const k in by) by[k].sort((a, b) => (a.t ? a.t.seconds : 1e12) - (b.t ? b.t.seconds : 1e12));
    EST = by;
  } catch (e) { toast(errMsg(e) + ' [estados]'); EST = EST || {}; }
  if (page() === 'chats') render();
}
function estBody() {
  if (EST === null) { if (!estCarg) { estCarg = true; estLoad(); } return `<section class="card">${empty('chat', 'Cargando estados…')}</section>`; }
  const mine = EST[user.uid] || [], vis = eVis(), me = { nombre: nombre(), avatar: foto() };
  const mio = `<div class="card chr" data-a="${mine.length ? 'estver' : 'estnuevo'}" data-u="${esc(user.uid)}" data-k="i" role="button" tabindex="0"><span class="sring ${mine.length ? 'on' : ''}">${avOf(me, 52)}${mine.length ? '' : '<i class="sadd">+</i>'}</span><div class="chm"><b>Mi estado</b><small class="mu">${mine.length ? 'Toca para ver · ' + hace(mine[mine.length - 1].t) : 'Toca para agregar'}</small></div>${mine.length ? `<button class="ib" data-a="estnuevo" data-k="t" aria-label="Agregar otro estado">${ic('plus', 22)}</button>` : ''}</div>`;
  const otros = Object.keys(EST).filter(u => u !== user.uid).map(u => ({ u, l: EST[u], nuevo: EST[u].some(x => !vis.has(x.id)) }))
    .sort((a, b) => (b.nuevo - a.nuevo) || ((b.l[b.l.length - 1].t ? b.l[b.l.length - 1].t.seconds : 0) - (a.l[a.l.length - 1].t ? a.l[a.l.length - 1].t.seconds : 0)));
  const fila = o => { const p = perfs[o.u] || {}; return `<div class="card chr" data-a="estver" data-u="${esc(o.u)}" role="button" tabindex="0"><span class="sring ${o.nuevo ? 'on' : 'seen'}">${avOf(p, 52)}</span><div class="chm"><b>${esc(p.nombre)}</b><small class="mu">${hace(o.l[o.l.length - 1].t)}</small></div></div>`; };
  return mio + `<p class="mu sh">Recientes</p>` + (otros.length ? otros.map(fila).join('') : `<section class="card">${empty('eye', 'Cuando tus amigos publiquen estados, los verás aquí. Duran 24 horas.')}</section>`);
}
function scCierra() { const o = $('#sc'); if (o) o.remove(); sc = null; }
function scAbre(k) {
  scCierra();
  if (k === 'i') {
    const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*';
    f.onchange = async () => { const a = f.files && f.files[0]; if (!a) return; try { const d = await fotoLista(a); sc = { tp: 'i', ...d }; scPinta(); } catch (e) { toast(e.message || 'No se pudo preparar la foto.'); } };
    f.click(); return;
  }
  sc = { tp: 't', bg: 0 }; scPinta();
}
function scPinta() {
  const o = document.createElement('div'); o.id = 'sc'; o.className = 'sc';
  o.style.background = sc.tp === 't' ? EBG[sc.bg] : '#07040f';
  const top = `<div class="adb"><button class="ib" data-a="scx" aria-label="Cancelar">${ic('close', 26)}</button><span class="sp"></span>${sc.tp === 't' ? `<button class="ib" data-a="scbg" aria-label="Cambiar color">${ic('palette', 26)}</button>` : ''}</div>`;
  o.innerHTML = sc.tp === 't'
    ? `${top}<div class="scm"><textarea id="sct" maxlength="200" rows="5" placeholder="Escribe tu estado" aria-label="Texto del estado"></textarea></div><button class="snd scs" data-a="scsend" aria-label="Publicar">${ic('send', 22)}</button>`
    : `${top}<div class="scm"><img src="${esc(sc.src)}" alt="Vista previa"></div><div class="scc"><textarea id="sct" maxlength="120" rows="1" placeholder="Añade un texto…" aria-label="Texto de la foto"></textarea></div><button class="snd scs" data-a="scsend" aria-label="Publicar">${ic('send', 22)}</button>`;
  document.body.appendChild(o);
}
async function scEnvia() {
  if (!sc) return;
  const t = $('#sct'), tx = (t ? t.value : '').trim();
  if (sc.tp === 't' && !tx) { toast('Escribe algo para tu estado.'); return; }
  const doc = { uid: user.uid, tp: sc.tp, t: firebase.firestore.FieldValue.serverTimestamp(), exp: Date.now() + 864e5 };
  if (tx) doc.tx = tx;
  if (sc.tp === 't') doc.bg = sc.bg; else { doc.src = sc.src; doc.w = sc.w; doc.h = sc.h; }
  scCierra();
  try { await db.collection('estados').add(doc); toast('Estado publicado'); } catch (e) { toast(errMsg(e) + ' [estados]'); }
  estLoad();
}
function svCierra(rend) { clearTimeout(sv && sv.tm); const o = $('#sv'); if (o) o.remove(); sv = null; if (rend && page() === 'chats') render(); }
function svAbre(uid) {
  const l = (EST && EST[uid]) || []; if (!l.length) return;
  const vis = eVis(); let i = l.findIndex(x => !vis.has(x.id)); if (i < 0 || uid === user.uid) i = 0;
  svVer(uid, l, i);
}
function svVer(uid, l, i) {
  clearTimeout(sv && sv.tm); const old = $('#sv'); if (old) old.remove();
  const x = l[i], mio = uid === user.uid, p = mio ? { nombre: 'Mi estado', avatar: foto() } : (perfs[uid] || {});
  eMarca(x.id);
  const dur = x.tp === 'i' ? 6 : 5 + Math.min(5, Math.floor((x.tx || '').length / 60));
  const img = x.tp === 'i' ? waImgSrc(null, x.src) : '';
  const o = document.createElement('div'); o.id = 'sv'; o.className = 'sv';
  o.innerHTML = `<div class="svp" style="--d:${dur}s">${l.map((_, k) => `<i class="${k < i ? 'f' : k === i ? 'a' : ''}"><b></b></i>`).join('')}</div><div class="svh">${avOf(p, 38)}<div><b>${esc(p.nombre)}</b><small>${hace(x.t)}</small></div><span class="sp"></span>${mio ? `<button class="ib" data-a="svdel" aria-label="Eliminar estado">${ic('trash', 22)}</button>` : ''}<button class="ib" data-a="svx" aria-label="Cerrar">${ic('close', 24)}</button></div><div class="svb"${x.tp === 't' ? ` style="background:${EBG[+x.bg] || EBG[0]}"` : ''}>${img ? `<img src="${esc(img)}" alt="Estado">` : ''}${x.tx ? `<p class="${x.tp === 't' ? 'svt' : 'svc'}">${esc(x.tx)}</p>` : ''}</div><button class="svn l" data-a="svprev" aria-label="Anterior"></button><button class="svn r" data-a="svnext" aria-label="Siguiente"></button>`;
  document.body.appendChild(o);
  sv = { uid, l, i, tm: setTimeout(svSig, dur * 1000) };
}
function svSig() { if (!sv) return; if (sv.i + 1 < sv.l.length) svVer(sv.uid, sv.l, sv.i + 1); else svCierra(true); }
function svAnt() { if (!sv) return; svVer(sv.uid, sv.l, Math.max(0, sv.i - 1)); }

// ───────── canales (las publicaciones oficiales de los owners) ─────────
const postsOrd = () => [...posts.filter(p => p.pin), ...posts.filter(p => !p.pin)];
function canBody() {
  const u = [...posts].sort((a, b) => (b.t ? b.t.seconds : 0) - (a.t ? a.t.seconds : 0))[0];
  const pv = u ? (u.titulo || u.texto || 'Publicación') : 'Aún no hay publicaciones';
  return `<a class="card chr" href="#canal">${logo(52)}<span class="chm"><b>${esc(C.nombre + ' ' + C.sufijo)}</b>${vf()}<small class="mu">${esc(pv).slice(0, 70)}</small></span><span class="chd">${u ? horaLista(u.t) : ''}</span></a><p class="mu sh">Los canales son anuncios oficiales: solo los owners publican.</p>`;
}
function canalView() {
  const ps = postsOrd();
  return `<div class="ti"><a href="#chats" class="ib" aria-label="Volver">${ic('back', 24)}</a>${logo(34)}<span>${esc(C.nombre + ' ' + C.sufijo)}</span>${vf()}</div><p class="mu sh">Canal oficial · ${posts.length} ${posts.length === 1 ? 'publicación' : 'publicaciones'}</p>` + (ps.length ? ps.map(postHtml).join('') : `<section class="card">${empty('news', 'Todavía no hay publicaciones.')}</section>`);
}

// ───────── Mambo IA ─────────
const IAK = () => 'mamboIA_' + (user ? user.uid : '');
let iaMsgs = null, iaBusy = false;
const iaLoad = () => { if (!iaMsgs) { try { iaMsgs = JSON.parse(localStorage.getItem(IAK()) || '[]'); } catch (_) { iaMsgs = []; } } return iaMsgs; };
const iaSave = () => { try { localStorage.setItem(IAK(), JSON.stringify(iaLoad().slice(-40))); } catch (_) {} };
const iaNorm = t => String(t || '').replace(/```[a-zA-Z0-9+#-]*\n/g, '```\n').replace(/\*\*(.+?)\*\*/g, '*$1*').replace(/^#{1,6}\s+(.+)$/gm, '*$1*').replace(/^\s*[-*]\s+/gm, '• ').replace(/__(.+?)__/g, '_$1_');
const IACH = ['Cuéntame un chiste', 'Ayúdame a escribir un mensaje', 'Dame ideas para jugar', '¿Cómo funciona un bot de WhatsApp?'];
function iaView() {
  setTimeout(iaPinta, 0);
  return `<section class="chatfull iaf" id="iaf" style="--c1:#8c5bff;--c2:#17e4ff"><div class="chh"><a href="#chats" class="ib" aria-label="Volver">${ic('back', 26)}</a><span class="iav">${ic('sparkle', 26)}</span><div class="chn"><b>Mambo IA</b><small class="chs">Asistente de la web · puede equivocarse</small></div><span class="chx"><button class="ib" data-a="ianew" aria-label="Nueva conversación">${ic('rotate', 24)}</button></span></div>
    <div class="mw"><div id="iamsgs" class="msgs iabg"></div></div>
    <div class="cmp wa"><div class="cbox"><textarea id="iam" rows="1" maxlength="1000" placeholder="Pregúntale a Mambo IA" aria-label="Mensaje para Mambo IA"></textarea></div><button class="snd" data-a="iasend" aria-label="Enviar">${ic('send', 22)}</button></div></section>`;
}
function iaMsgHtml(m, i) {
  const h = horaDe({ toDate: () => new Date(m.t) }), f = fmtWA(iaNorm(m.tx), null, []);
  return m.r === 'u'
    ? `<div class="bub me" style="background:var(--g);color:#fff">${f}<small>${h}</small></div>`
    : `<div class="bub iaa${m.e ? ' err' : ''}">${f}<small>${h}</small>${m.e ? '' : `<button class="iacp" data-a="iacp" data-i="${i}">${ic('copy', 14)}Copiar</button>`}</div>`;
}
function iaPinta() {
  const el = $('#iamsgs'); if (!el) return;
  const L = iaLoad();
  const vacio = `<div class="iavac"><span class="iav big">${ic('sparkle', 38)}</span><b>Hola, soy Mambo IA</b><p class="mu">Pregúntame lo que quieras.</p><div class="iach">${IACH.map(t => `<button data-a="iachip" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>`;
  const h = (L.length ? L.map(iaMsgHtml).join('') : vacio) + (iaBusy ? '<div class="bub iaa typing"><i></i><i></i><i></i></div>' : '');
  if (el._h === h) return; el._h = h; el.innerHTML = h; el.scrollTop = el.scrollHeight;
}
async function iaEnvia(texto) {
  const v = (texto || '').trim(); if (iaBusy || !v) return;
  const L = iaLoad(); L.push({ r: 'u', tx: v, t: Date.now() }); iaBusy = true; iaSave(); iaPinta();
  try {
    const tk = await fb.currentUser.getIdToken(), ac = new AbortController(), to = setTimeout(() => ac.abort(), 45000);
    const hist = L.filter(m => !m.e).slice(-12).map(m => ({ role: m.r === 'u' ? 'user' : 'assistant', content: m.tx }));
    const r = await fetch('/api/ia', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tk }, body: JSON.stringify({ messages: hist }), signal: ac.signal });
    clearTimeout(to);
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.ok && d.texto) L.push({ r: 'a', tx: d.texto, t: Date.now() });
    else L.push({ r: 'a', e: 1, t: Date.now(), tx: r.status === 429 ? 'Vas muy rápido. Espera unos segundos y vuelve a intentar.' : r.status === 401 ? 'Tu sesión venció. Sal y vuelve a entrar.' : r.status === 404 ? 'La IA solo funciona en la página de Cloudflare (mamboweb), no en esta dirección.' : 'Ahora mismo no puedo responder. Intenta de nuevo en un momento.' });
  } catch (_) { L.push({ r: 'a', e: 1, t: Date.now(), tx: 'No pude conectarme. Revisa tu internet e intenta otra vez.' }); }
  iaBusy = false; iaSave(); iaPinta();
}
document.addEventListener('input', e => { if (e.target && e.target.id === 'iam') autoH(e.target); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target || e.target.id !== 'iam' || e.shiftKey || e.isComposing) return;
  if (window.matchMedia && matchMedia('(pointer:coarse)').matches) return;
  e.preventDefault(); const b = document.querySelector('[data-a=iasend]'); if (b) b.click();
});

// ───────── acciones ─────────
window.addEventListener('hashchange', () => { afCierra(); svCierra(false); scCierra(); });
MODS.push(async (a, t) => {
  switch (a) {
    case 'ctab': chTab = t.dataset.k; try { sessionStorage.setItem('chTab', chTab); } catch (_) {} if (chTab === 'estados') { estCarg = true; estLoad(); } render(); return true;
    case 'goia': location.hash = '#ia'; return true;
    case 'afopen': afAbre(); return true;
    case 'afx': afCierra(); return true;
    case 'efim': efiAbre(); return true;
    case 'efiset': await efiPon(+t.dataset.k || 0); return true;
    case 'estver': svAbre(t.dataset.u); return true;
    case 'estnuevo': scAbre(t.dataset.k || 't'); return true;
    case 'scx': scCierra(); return true;
    case 'scbg': if (sc && sc.tp === 't') { sc.bg = (sc.bg + 1) % EBG.length; const o = $('#sc'); if (o) o.style.background = EBG[sc.bg]; } return true;
    case 'scsend': await scEnvia(); return true;
    case 'svx': svCierra(true); return true;
    case 'svnext': svSig(); return true;
    case 'svprev': svAnt(); return true;
    case 'svdel': {
      if (!sv || !confirm('¿Eliminar este estado?')) return true;
      const x = sv.l[sv.i]; svCierra(false);
      try { await db.collection('estados').doc(x.id).delete(); } catch (e) { toast(errMsg(e) + ' [estados]'); }
      estLoad(); return true;
    }
    case 'iasend': { const i = $('#iam'); if (!i) return true; const v = i.value; i.value = ''; i.style.height = ''; await iaEnvia(v); return true; }
    case 'iachip': await iaEnvia(t.dataset.t); return true;
    case 'iacp': { const m = iaLoad()[+t.dataset.i]; if (m) copia(m.tx); return true; }
    case 'ianew': if (confirm('¿Empezar una conversación nueva?')) { iaMsgs = []; iaSave(); const el = $('#iamsgs'); if (el) el._h = null; iaPinta(); } return true;
  }
  return false;
});
