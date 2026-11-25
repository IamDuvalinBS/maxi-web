// Avisos de chats con las notificaciones de Chrome (gratis, sin servidor).
// Funcionan mientras la página esté abierta en Chrome (aunque esté en segundo plano). Cada persona decide si las activa.
const AVS = typeof Notification !== 'undefined' && 'serviceWorker' in navigator;
const avLee = k => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const avGuarda = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
const avOn = () => AVS && Notification.permission === 'granted' && avLee('avisos') === '1';
function avEstado() {
  if (!AVS) return 'nosoporta';
  if (Notification.permission === 'denied') return 'bloqueado';
  return avOn() ? 'on' : 'off';
}
async function avMuestra(titulo, cuerpo, tag, hash) {
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(titulo, { body: cuerpo, icon: 'img/logo.jpg', badge: 'img/logo.jpg', tag, renotify: true, data: { hash } });
  } catch (_) {
    try { const n = new Notification(titulo, { body: cuerpo, icon: 'img/logo.jpg', tag }); n.onclick = () => { window.focus(); location.hash = hash; n.close(); }; } catch (__) {}
  }
}
// Mensajes nuevos de amigos: se detectan en la lista de chats (que ya se escucha en vivo)
let avBase = {}, avListo = false;
const avReset = () => { avBase = {}; avListo = false; avBadge(); };
const avMs = t => t && t.toMillis ? t.toMillis() : (t && t.seconds ? t.seconds * 1000 : 0);
function avChats(l, cache) {
  for (const c of l) {
    if (c.otro === 'bot') continue;
    const u = c.ultimo || {}, ms = avMs(u.t), prev = avBase[c.otro] || 0;
    avBase[c.otro] = Math.max(prev, ms);
    if (!avListo || !ms || ms <= prev || !u.de || u.de === user.uid || !avOn()) continue;
    if (!document.hidden && location.hash === '#chat/' + c.otro) continue;       // ya lo estás leyendo
    const p = perfs[c.otro] || {}, txt = (u.tp === 's' ? 'Sticker' : u.tp === 'i' ? (u.tx || 'Foto') : u.tp === 'd' ? (u.tx || 'Archivo') : (u.tx || 'Mensaje nuevo')).slice(0, 120);
    if (document.hidden) avMuestra(p.nombre || 'Chat', txt, 'chat-' + c.otro, '#chat/' + c.otro);
    else toast((p.nombre || 'Chat') + ': ' + txt);
  }
  if (!avListo && !cache) avListo = true;                // lo que llegó mientras la página estaba cerrada no cuenta como "nuevo"
  avBadge();
}
function avBot(d) {
  if (!avOn() || (!document.hidden && waEnChat())) return;
  const txt = (d.tx ? String(d.tx).replace(/[*_~`]/g, '') : d.tp === 'i' ? 'Foto' : d.tp === 'v' ? 'Video' : d.tp === 'a' ? 'Audio' : d.tp === 'd' ? 'Archivo' : d.tp === 's' ? 'Sticker' : 'Mensaje nuevo').slice(0, 120);
  if (document.hidden) avMuestra('Mambo Bot', txt, 'chat-bot', '#chat/bot'); else toast('Mambo Bot: ' + txt);
}
// Número de chats sin leer en el título de la pestaña (y en el ícono de la app si el navegador lo permite)
function avBadge() {
  let n = 0;
  try { n = (user ? chats.filter(c => c.otro !== 'bot' && chatNuevo(c)).length : 0) + (user && waBotNuevos > 0 ? 1 : 0); } catch (_) {}
  const t = n ? '(' + n + ') Mambo Bot' : 'Mambo Bot';
  if (document.title !== t) document.title = t;
  try { if (navigator.setAppBadge) { if (n) navigator.setAppBadge(n); else navigator.clearAppBadge(); } } catch (_) {}
}
setInterval(avBadge, 4000);
document.addEventListener('visibilitychange', avBadge);
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { const d = e.data; if (d && d.tipo === 'abre' && typeof d.hash === 'string' && d.hash[0] === '#') location.hash = d.hash; });

// Tarjeta de la lista de chats y del perfil
function avisosBanner() {
  if (avEstado() !== 'off' || avLee('avisosNo') === '1') return '';
  return `<section class="card avb"><span class="avi">${ic('bell', 22)}</span><div><b>Avisos de chats</b><p class="mu">Recibe una notificación de Chrome cuando te escriban.</p></div><button class="btn sm" data-a="avon">Activar</button><button class="ib" data-a="avno" aria-label="Ahora no">${ic('close', 18)}</button></section>`;
}
function avisosCard() {
  const e = avEstado();
  const txt = { nosoporta: 'Este navegador no permite notificaciones.', bloqueado: 'Chrome tiene bloqueados los avisos de esta página. Toca el candado de la barra de direcciones, entra a Permisos y activa Notificaciones.', on: 'Activados en este dispositivo. Te avisamos cuando te escriban mientras la página esté abierta.', off: 'Recibe una notificación de Chrome cuando te escriban. Tú decides si las activas.' }[e];
  const btn = e === 'on' ? `<div class="row"><button class="btn sec sm" data-a="avtest">Probar</button><button class="btn sec sm" data-a="avoff">Desactivar</button></div>` : e === 'off' ? `<button class="btn" data-a="avon">Activar avisos</button>` : '';
  return `<section class="card"><div class="ti">${ic('bell', 22)}<span>Avisos de chats</span></div><p class="mu">${txt}</p>${btn}</section>`;
}
MODS.push(async (a, t) => {
  if (a === 'avon') {
    if (!AVS) { toast('Este navegador no permite notificaciones.'); return true; }
    if (Notification.permission === 'denied') { toast('Los avisos están bloqueados: toca el candado de la barra → Notificaciones → Permitir.'); return true; }
    let p = Notification.permission;
    if (p !== 'granted') { try { p = await Notification.requestPermission(); } catch (_) {} }
    if (p === 'granted') { avGuarda('avisos', '1'); avMuestra('Avisos activados', 'Te avisaremos cuando te escriban.', 'avisos', '#chats'); toast('Avisos activados'); }
    else toast('No se activaron los avisos.');
    render(); return true;
  }
  if (a === 'avoff') { avGuarda('avisos', '0'); toast('Avisos desactivados'); render(); return true; }
  if (a === 'avno') { avGuarda('avisosNo', '1'); render(); return true; }
  if (a === 'avtest') { avMuestra('Mambo Bot', 'Así te llegarán los avisos de tus chats.', 'avisos-test', '#chats'); return true; }
  return false;
});
