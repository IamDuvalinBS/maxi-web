const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NAV = [['inicio','🏠','Inicio','Menú'],['juegos','🎮','Juegos','Menú'],['pases','🏆','Pases','Menú'],['canjear','🎟️','Canjear','Menú'],['noticias','📰','Noticias','Social'],['perfil','👤','Mi perfil','Social']];
let fb = null, db = null, user = null, perfil = null;
try { if (window.firebase && C.firebase && C.firebase.apiKey) { firebase.initializeApp(C.firebase); fb = firebase.auth(); db = firebase.firestore(); } } catch (e) { fb = null; db = null; }

const page = () => { const h = location.hash.slice(1); return NAV.some(n => n[0] === h) ? h : 'inicio'; };
const nombre = () => (perfil && perfil.nombre) || (user && (user.displayName || (user.email || '').split('@')[0])) || '';
const foto = () => (user && user.photoURL) || '';
const avatar = px => `<span class="av" style="width:${px}px;height:${px}px;font-size:${px/2.5}px">${foto() ? `<img src="${esc(foto())}" alt="" referrerpolicy="no-referrer">` : esc((nombre() || '?')[0].toUpperCase())}</span>`;
const logo = () => `<span class="lg">${C.logo ? `<img src="${esc(C.logo)}" alt="">` : esc(C.nombre[0])}</span>`;
const loginBtn = () => `<button class="btn" data-a="login"><span class="gg">G</span>Entrar con Google</button>`;
const empty = (icon, t) => `<div class="em"><div style="font-size:2rem">${icon}</div><p>${t}</p></div>`;
const gate = t => `<section class="card"><h2>Inicia sesión</h2><p class="mu">${t}</p>${loginBtn()}</section>`;

function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3500); }

function renderSide() {
  const cur = page();
  let h = `<div class="sh">${logo()}<b>${esc(C.nombre)} <span class="ac">${esc(C.sufijo)}</span></b><button class="ib x" data-a="close" aria-label="Cerrar menú">✕</button></div>`;
  h += user ? `<div class="ub">${avatar(48)}<div><b>${esc(nombre())}</b><small>${esc(user.email)}</small></div></div>` : `<div class="ub">${loginBtn()}</div>`;
  let g = '';
  NAV.forEach(n => { if (n[3] !== g) { g = n[3]; h += `<div class="gl">${g}</div>`; } h += `<a class="nv${n[0] === cur ? ' on' : ''}" href="#${n[0]}"${n[0] === cur ? ' aria-current="page"' : ''}><span>${n[1]}</span>${n[2]}</a>`; });
  h += `<div class="fl"><button class="nv" data-a="theme"><span>🌓</span>Cambiar tema</button>${user ? `<button class="nv" data-a="logout"><span>🚪</span>Cerrar sesión</button>` : ''}</div>`;
  $('#side').innerHTML = h;
}
function renderTop() {
  $('#top').innerHTML = `<button class="ib" id="burger" data-a="open" aria-label="Abrir menú">☰</button>${logo()}<b>${esc(C.nombre)} <span class="ac">${esc(C.sufijo)}</span></b><span class="sp"></span>` +
    (user ? `<a href="#perfil" aria-label="Mi perfil">${avatar(40)}</a>` : `<button class="btn sec" style="margin:0;padding:8px 14px" data-a="login">Entrar</button>`);
}
const PAGES = {
  inicio() {
    let h = '';
    if (!fb) h += `<section class="card note"><h2>Modo demo</h2><p class="mu">Falta conectar Firebase para que funcione el login con Google. Pega tus claves en config.js.</p></section>`;
    h += user ? `<section class="card"><h2>Hola, ${esc(nombre())}</h2><p class="mu">Tu perfil se guarda en tu cuenta de Google.</p></section>` : gate('Entra con Google para guardar tu perfil.');
    h += `<div class="ti"><span class="ac">&lt;/&gt;</span>Creadores</div><div class="g2">` +
      C.creadores.map(c => `<div class="card cr"><div class="pic">${c.foto ? `<img src="${esc(c.foto)}" alt="" referrerpolicy="no-referrer">` : esc((c.nombre || '?')[0])}</div><b>${esc(c.nombre)}</b><br><small>${esc(c.rol)}</small></div>`).join('') + `</div>`;
    h += `<section class="card"><div class="ti">⭐ Destacadas</div>${empty('☆', 'Aún no hay publicaciones destacadas.')}</section>`;
    h += `<section class="card cmp">${user ? avatar(40) : ''}<input id="msg" placeholder="Comparte algo con la comunidad" aria-label="Escribir publicación"><button class="snd" data-a="soon" aria-label="Publicar">➤</button></section>`;
    return h;
  },
  juegos: () => `<section class="card"><div class="ti">🎮 Juegos</div>${empty('🕹️', 'Aún no hay minijuegos. Cuando los agregues, aparecerán aquí.')}</section>`,
  pases: () => `<section class="card"><div class="ti">🏆 Pases</div>${empty('🏆', 'Aún no hay pases disponibles.')}</section>`,
  noticias: () => `<section class="card"><div class="ti">📰 Noticias</div>${empty('📰', 'Aún no hay noticias.')}</section>`,
  canjear: () => user ? `<section class="card"><div class="ti">🎟️ Canjear</div>${empty('🎟️', 'Aún no tienes recompensas. Cuando las desbloquees, aparecerán aquí con su código para copiar.')}</section>` : gate('Entra con Google para ver tus códigos de canje.'),
  perfil: () => user ? `<section class="card pf"><div class="ti">${avatar(64)}Mi perfil</div><p class="mu">${esc(user.email)}</p><label for="nom">Nombre visible</label><input id="nom" maxlength="30" value="${esc(nombre())}"><button class="btn" data-a="save">Guardar cambios</button></section>` : gate('Entra con Google para ver y editar tu perfil.')
};
function render() { renderSide(); renderTop(); $('#view').innerHTML = PAGES[page()](); }

async function loadPerfil() {
  if (!db || !user) return;
  try {
    const ref = db.collection('perfiles').doc(user.uid);
    const d = await ref.get();
    if (d.exists) perfil = { nombre: d.data().nombre };
    else {
      const n = nombre();
      await ref.set({ nombre: n, avatar: foto() || null, creado: firebase.firestore.FieldValue.serverTimestamp() });
      perfil = { nombre: n };
    }
    render();
  } catch (e) { toast('No se pudo cargar tu perfil: ' + (e.message || 'revisa las reglas de Firestore.')); }
}
function setUser(u) { user = u || null; perfil = null; render(); if (user) setTimeout(loadPerfil, 0); }

const setMenu = on => document.body.classList.toggle('menu', on);
document.addEventListener('click', async e => {
  if (e.target.closest('.nv[href]')) setMenu(false);
  const t = e.target.closest('[data-a]'); if (!t) return;
  const a = t.dataset.a;
  if (a === 'open') setMenu(true);
  else if (a === 'close') setMenu(false);
  else if (a === 'soon') toast('Las publicaciones llegarán pronto.');
  else if (a === 'theme') {
    const d = document.documentElement, v = d.dataset.theme === 'light' ? 'dark' : 'light';
    d.dataset.theme = v; try { localStorage.setItem('tema', v); } catch (_) {}
  }
  else if (a === 'login') {
    if (!fb) return toast('Falta configurar Firebase: pega tus claves en config.js.');
    try { await fb.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }
    catch (er) {
      if (er.code === 'auth/popup-blocked' || er.code === 'auth/operation-not-supported-in-this-environment') fb.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
      else if (er.code !== 'auth/popup-closed-by-user' && er.code !== 'auth/cancelled-popup-request') toast('No se pudo iniciar sesión: ' + er.message);
    }
  }
  else if (a === 'logout') {
    try { await fb.signOut(); toast('Sesión cerrada'); } catch (er) { toast('No se pudo cerrar sesión: ' + er.message); }
  }
  else if (a === 'save') {
    const n = ($('#nom').value || '').trim().slice(0, 30);
    if (!n) return toast('Escribe un nombre.');
    try { await db.collection('perfiles').doc(user.uid).set({ nombre: n, avatar: foto() || null }, { merge: true }); }
    catch (er) { return toast('No se pudo guardar: ' + er.message); }
    perfil = { nombre: n }; render(); toast('Cambios guardados');
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

try { const s = localStorage.getItem('tema'); if (s) document.documentElement.dataset.theme = s; } catch (_) {}
render();
if (fb) fb.onAuthStateChanged(u => setUser(u));
  
