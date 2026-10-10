const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NAV = [['inicio','🏠','Inicio','Menú'],['juegos','🎮','Juegos','Menú'],['misiones','🎯','Misiones','Menú'],['pases','🏆','Pases','Menú'],['canjear','🎟️','Canjear','Menú'],['chats','💬','Chats','Social'],['noticias','📰','Noticias','Social'],['perfil','👤','Mi perfil','Social']];
let fb = null, db = null, user = null, perfil = null, ready = false, pendingName = '', authMode = 'in';
try { if (window.firebase && C.firebase && C.firebase.apiKey) { firebase.initializeApp(C.firebase); fb = firebase.auth(); db = firebase.firestore(); } } catch (e) { fb = null; db = null; }

const page = () => { const h = location.hash.slice(1); return h.startsWith('chat/') ? 'chat' : h.startsWith('juego/') ? 'juego' : NAV.some(n => n[0] === h) ? h : 'inicio'; };
const nombre = () => (perfil && perfil.nombre) || (user && (user.displayName || (user.email || '').split('@')[0])) || '';
const foto = () => (perfil && perfil.avatar) || (user && user.photoURL) || '';
const avatar = px => `<span class="av${marcoCls()}" style="width:${px}px;height:${px}px;font-size:${px/2.5}px">${foto() ? `<img src="${esc(foto())}" alt="" referrerpolicy="no-referrer">` : esc((nombre() || '?')[0].toUpperCase())}</span>`;
const logo = px => `<span class="lg"${px ? ` style="width:${px}px;height:${px}px"` : ''}>${C.logo ? `<img src="${esc(C.logo)}" alt="">` : esc(C.nombre[0])}</span>`;
const loginBtn = () => `<button class="btn" data-a="login"><img class="gimg" src="img/google.png" alt="" width="20" height="20">Entrar con Google</button>`;
const empty = (icon, t) => `<div class="em"><div style="font-size:2rem">${icon}</div><p>${t}</p></div>`;
const gate = t => `<section class="card"><h2>Inicia sesión</h2><p class="mu">${t}</p>${loginBtn()}</section>`;

const brand = () => `<span class="nm">${esc(C.nombre)}</span> <span class="sf">${esc(C.sufijo)}</span>`;
const ERR = { 'auth/invalid-credential': 'Correo o contraseña incorrectos.', 'auth/wrong-password': 'Correo o contraseña incorrectos.', 'auth/user-not-found': 'Correo o contraseña incorrectos.', 'auth/email-already-in-use': 'Ese correo ya tiene cuenta. Toca Entrar.', 'auth/weak-password': 'La contraseña debe tener 6 caracteres o más.', 'auth/invalid-email': 'Correo no válido.', 'auth/operation-not-allowed': 'Este método no está activado en Firebase.', 'permission-denied': 'No tienes permiso para hacer esto.' };
const errMsg = e => ERR[e.code] || ('Error: ' + (e.message || e));
const field = (ic, lb, id, ty, ph) => `<label class="fl2" for="${id}"><span>${ic}</span> ${lb}</label><input id="${id}" type="${ty}" placeholder="${ph}">`;
const authView = () => { const up = authMode === 'up'; return `<section class="auth-card"><div class="alogo">${logo(84)}</div>
  <h1>${up ? 'Crear cuenta' : 'Iniciar sesión'}</h1><p class="mu" style="text-align:center">${up ? 'Regístrate para entrar a ' + brand() : 'Accede a tu cuenta de ' + brand()}</p>
  ${up ? field('👤', 'Nombre de usuario', 'us', 'text', 'tu_usuario') : ''}${field('✉️', 'Correo', 'em', 'email', 'tu@correo.com')}${field('🔒', 'Contraseña', 'pw', 'password', 'Mínimo 6 caracteres')}${up ? field('✅', 'Confirmar contraseña', 'pw2', 'password', 'Repite la contraseña') : ''}
  <p id="am" class="am" role="alert"></p>
  <button class="btn big" data-a="${up ? 'mail-up' : 'mail-in'}">${up ? '🚀 Crear cuenta' : 'Iniciar sesión'}</button>
  ${up ? '' : '<p style="text-align:center"><button class="lnk" data-a="reset">¿Olvidaste tu contraseña?</button></p>'}
  <div class="or"><span>${up ? 'O regístrate con' : 'O continúa con'}</span></div>
  <button class="btn sec big" data-a="login"><img class="gimg" src="img/google.png" alt="" width="20" height="20">Google</button>
  <p class="mu sw">${up ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'} <button class="lnk" data-a="mode">${up ? 'Iniciar sesión' : 'Crear cuenta'}</button></p></section>`; };
async function mailAuth(nuevo) {
  const g = id => ($(id) ? $(id).value : ''), em = g('#em').trim(), pw = g('#pw'), us = g('#us').trim().slice(0, 20), am = $('#am');
  const fail = m => { if (am) am.textContent = m; toast(m); };
  if (am) am.textContent = '';
  if (!em || !pw) return fail('Escribe tu correo y contraseña.');
  if (nuevo) {
    if (!us) return fail('Escribe un nombre de usuario.');
    if (pw.length < 6) return fail('La contraseña debe tener 6 caracteres o más.');
    if (pw !== g('#pw2')) return fail('Las contraseñas no coinciden.');
  }
  try {
    if (nuevo) {
      pendingName = us; const r = await fb.createUserWithEmailAndPassword(em, pw);
      try { await r.user.sendEmailVerification(); toast('Cuenta creada. Te enviamos un correo de verificación (revisa también spam).'); } catch (_) {}
    } else await fb.signInWithEmailAndPassword(em, pw);
  }
  catch (er) { fail(errMsg(er)); }
}
async function resetPw() {
  const em = ($('#em').value || '').trim();
  if (!em) return toast('Escribe tu correo arriba y vuelve a tocar.');
  try { await fb.sendPasswordResetEmail(em); toast('Si ese correo tiene una cuenta con contraseña, te llegará un mensaje. Revisa también spam.'); } catch (er) { toast(errMsg(er)); }
}
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3500); }

function renderSide() {
  const cur = page();
  let h = `<div class="sh">${logo()}<b>${brand()}</b><button class="ib x" data-a="close" aria-label="Cerrar menú">✕</button></div>`;
  h += user ? `<div class="ub">${avatar(48)}<div><b>${esc(nombre())}${owner ? ' ' + vf() : ''}</b><small>${esc(user.email)}</small></div></div>` : `<div class="ub">${loginBtn()}</div>`;
  let g = '';
  NAV.forEach(n => { if (n[3] !== g) { g = n[3]; h += `<div class="gl">${g}</div>`; } h += `<a class="nv${n[0] === cur ? ' on' : ''}" href="#${n[0]}"${n[0] === cur ? ' aria-current="page"' : ''}><span>${n[1]}</span>${n[2]}</a>`; });
  h += `<div class="fl"><button class="nv" data-a="theme"><span>🌓</span>Cambiar tema</button>${user ? `<button class="nv" data-a="logout"><span>🚪</span>Cerrar sesión</button>` : ''}</div>`;
  $('#side').innerHTML = h;
}
function renderTop() {
  $('#top').innerHTML = `<button class="ib" id="burger" data-a="open" aria-label="Abrir menú">☰</button>${logo()}<b>${brand()}</b><span class="sp"></span>` +
    (user ? `<a href="#perfil" aria-label="Mi perfil">${avatar(40)}</a>` : `<button class="btn sec" style="margin:0;padding:8px 14px" data-a="login">Entrar</button>`);
}
const PAGES = {
  inicio() {
    let h = '';
    if (!fb) h += `<section class="card note"><h2>Modo demo</h2><p class="mu">Falta conectar Firebase para que funcione el login con Google. Pega tus claves en config.js.</p></section>`;
    h += user ? `<section class="card"><h2>Hola, ${esc(nombre())}</h2><p class="mu">Qué bueno verte de nuevo.</p></section>` : gate('Entra con Google para guardar tu perfil.');
    h += `<div class="ti"><span class="ac">&lt;/&gt;</span>Creadores</div><div class="g2">` +
      C.creadores.map(c => `<div class="card cr"><div class="pic">${c.foto ? `<img src="${esc(c.foto)}" alt="" referrerpolicy="no-referrer">` : esc((c.nombre || '?')[0])}</div><b>${esc(c.nombre)}</b><br><small>${esc(c.rol)}</small></div>`).join('') + `</div>`;
    h += postsView();
    return h;
  },
  misiones: () => misionesView(),
  chats: () => chatsView(),
  chat: () => chatView(),
  juegos: () => juegosView(),
  juego: () => juegoView(),
  pases: () => `<section class="card"><div class="ti">🏆 Pases</div>${empty('🏆', 'No hay pases disponibles todavía. Espera a las próximas actualizaciones.')}</section>`,
  noticias: () => `<section class="card"><div class="ti">📰 Noticias</div>${empty('📰', 'No hay noticias por ahora. Vuelve pronto.')}</section>`,
  canjear: () => user ? `<section class="card"><div class="ti">🎟️ Canjear</div>${empty('🎟️', 'No tienes recompensas por canjear todavía.')}</section>${anunciosView()}` : gate('Entra con Google para ver tus códigos de canje.'),
  perfil: () => perfilView() + `<section class="card pf"><div class="ti">${avatar(64)}<span>${esc(nombre())} ${owner ? vf() : ''}</span></div>
    <p class="mu">${esc(user.email || '')}</p>
    <p>ID: <b>${esc((perfil && perfil.idn) || '…')}</b></p>
    <label class="btn sec" for="fi">Cambiar foto</label><input id="fi" type="file" accept="image/*" hidden>
    <label for="nom">Nombre de usuario</label><input id="nom" maxlength="20" value="${esc(nombre())}">
    <button class="btn" data-a="save">Guardar cambios</button>
    ${owner ? `<label for="oid">Agregar owner por ID</label><input id="oid" inputmode="numeric" placeholder="ID del usuario"><button class="btn sec" data-a="addowner">Agregar owner</button>` : ''}</section>`
};
function render() {
  document.body.classList.toggle('auth', !!fb && !user);
  document.body.classList.toggle('inchat', ['chat', 'juego'].includes(page()));
  if (page() === 'juego' && window.JUEGO_ACTIVO === location.hash && $('#jg')) return;
  if (fb && !user) { $('#view').innerHTML = ready ? authView() : ''; return; }
  renderSide(); renderTop(); $('#view').innerHTML = PAGES[page()]();
}

const newId = () => String(Math.floor(1e9 + Math.random() * 9e9));
async function loadPerfil() {
  if (!db || !user) return;
  try {
    const ref = db.collection('perfiles').doc(user.uid), d = await ref.get();
    if (d.exists) { perfil = d.data(); if (!perfil.idn) { perfil.idn = newId(); await ref.set({ idn: perfil.idn }, { merge: true }); } }
    else { perfil = { nombre: (pendingName || nombre()).slice(0, 20), idn: newId() }; await ref.set({ ...perfil, creado: firebase.firestore.FieldValue.serverTimestamp() }); }
    await checkOwner(); render(); loadPosts(); loadChats();
  } catch (e) { toast(errMsg(e)); }
}
function setUser(u) { user = u || null; perfil = null; render(); if (user) setTimeout(loadPerfil, 0); }

const setMenu = on => document.body.classList.toggle('menu', on);
document.addEventListener('click', async e => {
  if (e.target.closest('.nv[href]')) setMenu(false);
  const t = e.target.closest('[data-a]'); if (!t) return;
  const a = t.dataset.a;
  for (const m of MODS) if (await m(a, t)) return;
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
  else if (a === 'mode') { authMode = authMode === 'in' ? 'up' : 'in'; render(); }
  else if (a === 'reset') await resetPw();
  else if (a === 'mail-in' || a === 'mail-up') await mailAuth(a === 'mail-up');
  else if (a === 'logout') {
    try { await fb.signOut(); toast('Sesión cerrada'); } catch (er) { toast('No se pudo cerrar sesión: ' + er.message); }
  }
  else if (a === 'save') {
    const n = ($('#nom').value || '').trim().slice(0, 30);
    if (!n) return toast('Escribe un nombre.');
    try { await db.collection('perfiles').doc(user.uid).set({ nombre: n, avatar: foto() || null }, { merge: true }); }
    catch (er) { return toast('No se pudo guardar: ' + er.message); }
    perfil = { ...perfil, nombre: n }; render(); toast('Cambios guardados');
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

try { const s = localStorage.getItem('tema'); if (s) document.documentElement.dataset.theme = s; } catch (_) {}
render();
if (fb) fb.onAuthStateChanged(u => { ready = true; setUser(u); });
document.addEventListener('change', e => {
  if (e.target.id !== 'fi' || !e.target.files[0]) return;
  const im = new Image();
  im.onload = async () => {
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const s = Math.min(im.width, im.height);
    c.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 160, 160);
    const url = c.toDataURL('image/jpeg', 0.8);
    try { await db.collection('perfiles').doc(user.uid).set({ avatar: url }, { merge: true }); perfil = { ...perfil, avatar: url }; render(); toast('Foto actualizada'); }
    catch (er) { toast(errMsg(er)); }
  };
  im.onerror = () => toast('No se pudo leer la imagen.');
  im.src = URL.createObjectURL(e.target.files[0]);
});
 
