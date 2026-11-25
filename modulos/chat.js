// Amigos y chats privados (solo los dos miembros pueden leerlos)
let chats = [], unsub = null, msgs = [], curChat = null;
const waBotMsgs = [];                     // mensajes del chat con el bot: solo en memoria, hasta recargar la página
let waBotUn = null, waBotUid = null, waBotNuevos = 0;
const waCopias = new Map(); let waAvisoCopia = false;   // ids de las copias del bot que responden (si hay más de una a la vez, se avisa)
const waLista = () => otro() === 'bot' ? waBotMsgs : msgs;
const perfs = {}, bgImgs = {};
perfs.bot = { nombre: 'Mambo Bot', avatar: 'img/logo.jpg' };   // chat con el bot (comandos)
let botOk = false;
let oc = { open: false, tab: null, who: 'me' };
let waResp = null, waEdit = null;                  // responder a un mensaje / editar un mensaje (barra sobre el campo de texto)

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
const cidOf = o => o === 'bot' ? user.uid + '_bot' : [user.uid, o].sort().join('_');
const perfHref = () => otro() === 'bot' ? '#chat/bot' : '#u/' + esc(otro());
// ── formato de WhatsApp: *negrita* _cursiva_ ~tachado~ `código` ```bloque``` > cita, listas, enlaces y etiquetas ──
// urlOk ya existe en iconos.js
const waReEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function fmtWA(t, mapa, nombres) {
  const hold = [], put = h => { hold.push(h); return '\u0000' + (hold.length - 1) + '\u0000'; };
  const chip = x => put('<span style="color:#8fdcff;font-weight:600;background:#00000026;border-radius:6px;padding:0 4px">@' + esc(x) + '</span>');
  let s = String(t == null ? '' : t);
  const cdi = c => '<code class="cdi" data-a="cpcode" data-c="' + esc(c) + '" title="Toca para copiar">' + esc(c) + '</code>';
  s = s.replace(/```([\s\S]*?)```/g, (_, c) => put(c.includes('\n')
    ? (k => '<span class="cdb"><button type="button" class="cpb" data-a="cpcode" data-c="' + esc(k) + '">' + ic('copy', 13) + 'Copiar</button>' + esc(k) + '</span>')(c.replace(/^\n|\n$/g, ''))
    : cdi(c)));
  s = s.replace(/`([^`\n]+)`/g, (_, c) => put(cdi(c)));
  s = s.replace(/https?:\/\/[^\s<>"']+/g, u => {
    let fin = ''; const m = u.match(/[.,;:!?)\]]+$/);
    if (m) { fin = m[0]; u = u.slice(0, -fin.length); }
    return put('<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer" style="color:#8fdcff;text-decoration:underline;word-break:break-all">' + esc(u) + '</a>') + fin;
  });
  s = esc(s);
  s = s.replace(/@(\d{6,20})/g, (_, n) => chip(mapa && mapa[n] ? mapa[n] : n));
  for (const n of (nombres || []).slice().sort((a, b) => b.length - a.length)) {
    if (n) s = s.replace(new RegExp('@' + waReEsc(esc(n)), 'g'), () => chip(n));
  }
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '*$1*');
  const L = '(^|[\\s(>;\\u0000])', R = '(?=$|[\\s).,:;!?<&\\u0000])';
  s = s.replace(new RegExp(L + '\\*([^\\s*](?:[^*\\n]*?[^\\s*])?)\\*' + R, 'g'), '$1<b>$2</b>');
  s = s.replace(new RegExp(L + '_([^\\s_](?:[^_\\n]*?[^\\s_])?)_' + R, 'g'), '$1<i>$2</i>');
  s = s.replace(new RegExp(L + '~([^\\s~](?:[^~\\n]*?[^\\s~])?)~' + R, 'g'), '$1<s>$2</s>');
  let out = '', q = [];
  const cierra = () => {
    if (!q.length) return;
    out = out.replace(/\n$/, '') + '<span style="display:block;border-left:3px solid #ffffff99;padding:2px 0 2px 8px;margin:3px 0">' + q.join('\n') + '</span>';
    q = [];
  };
  for (const ln of s.split('\n')) {
    const m = ln.match(/^&gt;\s?(.*)$/);
    if (m) { q.push(m[1]); continue; }
    cierra();
    out += ln.replace(/^(\s*)[*-]\s+/, '$1\u2022 ') + '\n';
  }
  cierra();
  out = out.replace(/\n$/, '');
  for (let i = 0; i < 3 && /\u0000\d+\u0000/.test(out); i++) out = out.replace(/\u0000(\d+)\u0000/g, (_, k) => hold[k]);
  return out;
}
// "Ver más" en textos largos (el estado abierto se conserva al refrescar el chat)
const waVmAbiertos = new Set();
const waVmEstilo = ab => ab ? 'max-height:none' : 'max-height:15em;overflow:hidden;-webkit-mask-image:linear-gradient(#000 72%,transparent);mask-image:linear-gradient(#000 72%,transparent)';
// imagen de una tarjeta o mensaje: enlace directo (https) o miniatura incrustada
const waImgSrc = (iu, img) => (typeof img === 'string' && img.startsWith('data:image/')) ? img : (typeof iu === 'string' && /^https:\/\//i.test(iu)) ? iu : '';
const waImg = (src, est) => `<img src="${esc(src)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display='none'" style="${est}">`;
// tarjeta de previa (enlace o "previa" que manda el bot)
function waTarjeta(p) {
  if (!p) return '';
  const src = waImgSrc(p.iu, p.img);
  if (!(p.t || p.b || src)) return '';
  const cuerpo = `${src ? waImg(src, 'display:block;width:100%;max-height:190px;object-fit:cover') : ''}<span style="display:block;padding:8px 10px">${p.t ? `<b style="display:block">${esc(p.t)}</b>` : ''}${p.b ? `<span style="display:block;font-size:.85em;opacity:.8">${esc(p.b)}</span>` : ''}</span>`;
  const est = 'display:block;margin:6px 0;border-radius:12px;overflow:hidden;background:#00000030;white-space:normal;color:inherit;text-decoration:none';
  return urlOk(p.u) ? `<a href="${esc(p.u)}" target="_blank" rel="noopener noreferrer" style="${est}">${cuerpo}</a>` : `<span style="${est}">${cuerpo}</span>`;
}
// botones: al ancho del mensaje, debajo de él y pegados entre sí
const waBtnEst = 'display:block;box-sizing:border-box;width:100%;margin:6px 0 0;text-align:center;white-space:normal;touch-action:manipulation;-webkit-tap-highlight-color:transparent';
// mensaje al que responde (cita), como en WhatsApp
const waAutor = d => (d === 'b' || d === 'bot') ? 'Mambo Bot' : (!d || d === 'u' || d === user.uid) ? 'Tú' : ((perfs[d] || {}).nombre || 'Usuario');
const waCita = m => m.qr ? `<span class="qte" data-a="qgo" data-q="${esc(m.qr)}"><b>${esc(waAutor(m.qd))}</b>${esc((m.qt || (waBusca(m.qr) || {}).tx || '').slice(0, 140))}</span>` : '';
// todo lo que puede traer un mensaje del bot
function waCuerpo(m) {
  let h = waCita(m);
  if (m.ar) h += waTarjeta(m.ar);
  const im = m.tp === 'i' ? waImgSrc(m.iu, m.src) : '';
  if (im) h += waImg(im, `display:block;max-width:100%;border-radius:12px;margin-bottom:${m.tx ? 6 : 0}px`);
  if (m.tp === 'v' && urlOk(m.u)) h += m.gif
    ? `<video src="${esc(m.u)}" autoplay loop muted playsinline style="display:block;max-width:100%;border-radius:12px;margin-bottom:6px"></video>`
    : `<video src="${esc(m.u)}" controls playsinline preload="metadata" style="display:block;max-width:100%;border-radius:12px;margin-bottom:6px"></video>`;
  if (m.tp === 'a' && urlOk(m.u)) h += `<audio src="${esc(m.u)}" controls preload="none" style="display:block;width:100%;max-width:260px;margin-bottom:6px"></audio>`;
  if (m.tp === 'd' && urlOk(m.u)) h += `<a class="btn sec sm" href="${esc(m.u)}" target="_blank" rel="noopener noreferrer" download style="${waBtnEst}">${esc(m.nm || 'Descargar archivo')}</a>`;
  if (m.tx) {
    const cuerpo = fmtWA(m.tx, m.mn);
    if (m.tx.length > 900 || (m.tx.match(/\n/g) || []).length > 16) {      // texto largo: "Ver más"
      const k = (m.t && m.t.seconds != null ? m.t.seconds + '.' + m.t.nanoseconds : 'x') + '|' + m.tx.length, ab = waVmAbiertos.has(k);
      h += `<div data-k="${esc(k)}" style="${waVmEstilo(ab)}">${cuerpo}</div><button class="btn sec sm" data-a="vermas" style="${waBtnEst}">${ab ? 'Ver menos' : 'Ver más'}</button>`;
    } else h += cuerpo;
  }
  if (m.lp) h += waTarjeta(m.lp);
  if (m.ft) h += `<span style="display:block;font-size:.78em;opacity:.7;margin-top:6px;white-space:normal">${esc(m.ft)}</span>`;
  const bt = (Array.isArray(m.bt) ? m.bt : []).map(b => `<button class="btn sec sm" data-a="botbtn" data-id="${esc(b.id)}" data-l="${esc(b.l)}" style="${waBtnEst}">${esc(b.l)}</button>`);
  const bu = (Array.isArray(m.bu) ? m.bu : []).filter(b => urlOk(b.u)).map(b => `<a class="btn sec sm" href="${esc(b.u)}" target="_blank" rel="noopener noreferrer" style="${waBtnEst}">${esc(b.l)}</a>`);
  if (bt.length || bu.length) h += `<span style="display:block;margin-top:8px;white-space:normal">${bt.join('')}${bu.join('')}</span>`;
  return h;
}
// una burbuja: el cuerpo se calcula una sola vez por mensaje (no se vuelve a procesar en cada redibujado)
const waCache = new WeakMap(); let waSeq = 0;
const waSty = b => `background:${b[2]};color:${b[3]};${b[4] || ''}`;
const waIds = new Map(), waIdDe = k => { let v = waIds.get(k); if (!v) { v = ++waSeq; waIds.set(k, v); } return v; };   // id estable por mensaje: así solo se redibuja lo que cambió
const fileOk = u => /^data:[\w.+\-\/]+;base64,/i.test(u || '') || urlOk(u);
const kbTxt = n => n < 1024 ? n + ' B' : n < 1048576 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
// reacciones: texto (las del bot) o { uid: 'icono' } (las de los amigos)
const rxHtml = m => {
  const r = m.rx; if (!r) return '';
  let it;
  if (typeof r === 'string') it = [[r, 1]];
  else { const c = {}; Object.values(r).forEach(k => { if (k) c[k] = (c[k] || 0) + 1; }); it = Object.entries(c); }
  if (!it.length) return '';
  return `<span class="rxs">${it.map(([k, n]) => `<i>${IC[k] ? ic(k, 14) : esc(k)}${n > 1 ? `<em>${n}</em>` : ''}</i>`).join('')}</span>`;
};
const diaKey = t => { const d = t && t.toDate ? t.toDate() : new Date(); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); };
function diaTxt(t) {                                      // separador de día: Hoy, Ayer, el día de la semana o la fecha
  const d = t && t.toDate ? t.toDate() : new Date(), h = new Date(), z = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dif = Math.round((z(h) - z(d)) / 864e5);
  if (dif <= 0) return 'Hoy'; if (dif === 1) return 'Ayer';
  if (dif < 7) return d.toLocaleDateString('es', { weekday: 'long' }).replace(/^./, c => c.toUpperCase());
  return d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: d.getFullYear() === h.getFullYear() ? undefined : 'numeric' });
}
// foto o archivo de un amigo (viaja dentro del mensaje, sin servicios de pago)
function waAdj(m) {
  let h = '';
  if (m.tp === 'i') { const im = waImgSrc(null, m.src); if (im) h += `<img class="mimg" data-a="vimg" src="${esc(im)}" alt="Foto" decoding="async"${+m.w > 0 && +m.h > 0 ? ` width="${+m.w}" height="${+m.h}" style="aspect-ratio:${+m.w}/${+m.h}"` : ''}>`; }
  if (m.tp === 'd' && fileOk(m.u)) h += `<a class="mfile" href="${esc(m.u)}" download="${esc(m.nm || 'archivo')}"><span class="mfi">${ic('file', 24)}</span><span class="mfn"><b>${esc(m.nm || 'Archivo')}</b><small>${+m.sz ? kbTxt(+m.sz) : 'Archivo'} · Toca para descargar</small></span><span class="mfd">${ic('download', 20)}</span></a>`;
  return h;
}
const waCuerpoU = m => waCita(m) + waAdj(m) + (m.tx ? fmtWA(m.tx, null, (Array.isArray(m.mn) ? m.mn : []).map(x => x.n)) : '');
function waCont(m) {                                      // mensajes seguidos de la misma persona se pegan entre sí
  const L = waLista(), i = L.indexOf(m), p = i > 0 ? L[i - 1] : null;
  if (!p || p.de !== m.de || p.tp === 's' || m.tp === 's') return false;
  const a = p.t && p.t.seconds, b = m.t && m.t.seconds;
  return !!(a && b && b - a < 300 && diaKey(p.t) === diaKey(m.t));
}
function waHtmlMsg(m) {
  if (!m._id) m._id = ++waSeq;
  const me = m.de === user.uid ? ' me' : '', key = m.id || m.cl || m.ci || '', h = (m.edit ? 'editado · ' : '') + horaDe(m.t) + palomita(m), rx = rxHtml(m);
  if (m.tp === 's' && m.src) return stkOk(m.src) ? `<div class="stm${me}${rx ? ' hasrx' : ''}" id="mb${m._id}" data-i="${esc(key)}"><img src="${esc(m.src)}" alt="Sticker" width="128" height="128"><small>${h}</small>${rx}</div>` : '';
  let cuerpo = waCache.get(m);
  if (cuerpo === undefined) { cuerpo = m.de === 'bot' ? waCuerpo(m) : waCuerpoU(m); waCache.set(m, cuerpo); }
  const c = getCC(otro()), est = waSty(bubOf(me ? c.bm : c.bt)), pv = m.de === 'bot' ? '' : previaHtml(m);
  return `<div class="bub${me}${waCont(m) ? ' cont' : ''}${rx ? ' hasrx' : ''}" id="mb${m._id}" data-i="${esc(key)}" style="${est}">${cuerpo}${pv}<small>${h}</small><button type="button" class="mxb" data-a="mxopen" aria-label="Opciones del mensaje">${ic('chevd', 16)}</button>${rx}</div>`;
}
// etiquetar con @ (solo en el chat del bot)
let waDirU = null, waDirCarga = false, waMenc = [];
async function waCargaDir() {
  if (waDirU || waDirCarga || !db) return;
  waDirCarga = true;
  try { const d = await db.collection('bot').doc('usuarios').get(); waDirU = d.exists ? (d.data().lista || []) : []; } catch (e) { waDirU = []; }
  waDirCarga = false;
}
function waMpHide() { const b = document.getElementById('mnp'); if (b) { b.style.display = 'none'; b.innerHTML = ''; } }
document.addEventListener('input', async e => {
  if (!e.target || e.target.id !== 'cm' || typeof otro !== 'function' || otro() !== 'bot') return;
  const v = e.target.value, pos = e.target.selectionStart == null ? v.length : e.target.selectionStart;
  const m = v.slice(0, pos).match(/(^|\s)@([^\s@]{0,20})$/);
  if (!m) { waMpHide(); return; }
  await waCargaDir();
  const q = m[2].toLowerCase(), box = document.getElementById('mnp');
  if (!box) return;
  const r = (waDirU || []).filter(x => x.n.toLowerCase().includes(q)).sort((a, b) => (a.n.toLowerCase().startsWith(q) ? 0 : 1) - (b.n.toLowerCase().startsWith(q) ? 0 : 1)).slice(0, 8);
  if (!r.length) { waMpHide(); return; }
  box.innerHTML = r.map(x => `<button class="btn sec sm" data-a="mnpick" data-k="${esc(x.k)}" data-n="${esc(x.n)}">@${esc(x.n)}</button>`).join('');
  box.style.display = 'flex';
});
function waMpElige(k, n) {
  const i = document.getElementById('cm'); if (!i) return;
  const pos = i.selectionStart == null ? i.value.length : i.selectionStart;
  const antes = i.value.slice(0, pos).replace(/@([^\s@]{0,20})$/, '@' + n + ' ');
  i.value = antes + i.value.slice(pos);
  i.focus(); i.setSelectionRange(antes.length, antes.length);
  if (!waMenc.some(x => x.k === k)) waMenc.push({ k, n });
  waMpHide();
}
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
    l.sort((x, y) => sec(y) - sec(x)); chats = l; if (typeof avChats === 'function') avChats(l, s.metadata.fromCache); if (!location.hash.startsWith('#chat/')) renderSoon();
  }, e => toast(errMsg(e)));
}
const chatNuevo = c => {
  if (c.otro === 'bot') return waBotNuevos > 0;
  const u = c.ultimo || {}, vi = (c.vistos || {})[user.uid];
  return !!(u.de && u.de !== user.uid && u.t && u.t.seconds && (!vi || (vi.seconds || 0) < u.t.seconds));
};
const horaLista = t => {                                  // hora, "Ayer", día de la semana o fecha corta
  if (!t || !t.toDate) return '';
  const d = t.toDate(), h = new Date(), z = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(), dif = Math.round((z(h) - z(d)) / 864e5);
  if (dif <= 0) return horaDe(t); if (dif === 1) return 'Ayer';
  if (dif < 7) return d.toLocaleDateString('es', { weekday: 'short' }).replace(/\.$/, '');
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' });
};
function chatsView() {
  const fila = c => {
    const esBot = c.otro === 'bot', p = perfs[c.otro] || {}, u = c.ultimo || {}, nuevo = chatNuevo(c);
    const hp = esBot ? '#chat/bot' : '#u/' + esc(c.otro);
    const ico = u.tp === 's' ? 'sticker' : u.tp === 'i' ? 'image' : u.tp === 'd' ? 'file' : '';
    const mio = !esBot && u.de === user.uid ? `<span class="tk${(c.vistos || {})[c.otro] && u.t && u.t.seconds && ((c.vistos[c.otro].seconds || 0) >= u.t.seconds) ? ' v' : ''}">${ic((c.vistos || {})[c.otro] && u.t && u.t.seconds && ((c.vistos[c.otro].seconds || 0) >= u.t.seconds) ? 'check2' : 'check', 14)}</span>` : '';
    const txt = esBot ? 'Usa los comandos del bot aquí' : u.tp === 's' ? 'Sticker' : u.tp === 'i' ? (u.tx || 'Foto') : u.tp === 'd' ? (u.tx || 'Archivo') : (u.tx || 'Sin mensajes todavía');
    return `<div class="card chr"><a class="avl" href="${hp}" aria-label="Ver perfil de ${esc(p.nombre)}">${avOf(p, 52, 1)}</a><a class="chm" href="#chat/${esc(c.otro)}"><b>${esc(p.nombre)}</b>${esc_o(c.otro)}<small class="${nuevo ? 'new' : 'mu'}">${esBot ? '' : mio}${ico ? ic(ico, 14) : ''}${esc(txt)}</small></a><span class="chd${nuevo ? ' new' : ''}">${esBot ? '' : horaLista(u.t)}${nuevo ? '<span class="dot" aria-label="Mensaje nuevo"></span>' : ''}</span></div>`;
  };
  const botC = chats.find(c => c.otro === 'bot') || { otro: 'bot', miembros: [user.uid, 'bot'] };
  const resto = chats.filter(c => c.otro !== 'bot');
  return `<div class="ti">${ic('chat', 24)}<span>Chats</span></div>` + (typeof avisosBanner === 'function' ? avisosBanner() : '') + fila(botC) +
    `<section class="card"><p class="mu">Para agregar a alguien, pídele su ID (lo ve en su perfil).</p><div class="cmp" style="margin-top:12px"><input id="fid" inputmode="numeric" placeholder="ID de tu amigo" aria-label="ID de tu amigo"><button class="snd" data-a="addfriend" aria-label="Agregar amigo">${ic('userplus', 20)}</button></div></section>` +
    (resto.length ? resto.map(fila).join('') : `<section class="card">${empty('chat', 'No tienes chats con amigos todavía. Agrega a alguien con su ID.')}</section>`);
}
const esc_o = uid => (typeof esOwner === 'function' && esOwner(uid)) ? ' ' + vf() : '';
function chatView() {
  const p = perfs[otro()], esBot = otro() === 'bot';
  setTimeout(startChat, 0);
  return `<section class="chatfull" id="cf"><div class="chh"><a href="#chats" class="ib" aria-label="Volver">${ic('back', 26)}</a><a class="avl" href="${perfHref()}" aria-label="Ver perfil">${avOf(p || {}, 44, 1)}</a><a class="chn" href="${perfHref()}"><b>${esc((p && p.nombre) || 'Chat')}${esc_o(otro())}</b><small class="chs" id="chs"></small></a><button class="ib pal" data-a="tema" aria-label="Personalizar chat" style="margin-left:auto">${ic('palette', 28)}</button></div>
    <div id="tm" class="opts" hidden></div><div class="mw"><div id="msgs" class="msgs"></div><button id="fab" class="fab" data-a="fabdown" aria-label="Ir al último mensaje" hidden>${ic('chevd', 22)}<span id="fabn" hidden></span></button></div><div id="pan" class="pan" hidden></div>
    <div id="mnp" style="display:none;flex-wrap:wrap;gap:6px;padding:6px 4px"></div>
    ${esBot ? '' : `<div id="atp" class="atp" hidden><button data-a="adg"><span class="atc" style="background:linear-gradient(135deg,#8c5bff,#e040fb)">${ic('image', 22)}</span>Galería</button><button data-a="adf"><span class="atc" style="background:linear-gradient(135deg,#17e4ff,#2a7bff)">${ic('file', 22)}</span>Archivo</button></div>`}
    <div id="rpb" class="rpb" hidden></div>
    <div class="cmp wa"><div class="cbox">${esBot ? '' : `<button class="ib stb" data-a="pan" aria-label="Stickers">${ic('sticker', 28)}</button>`}<textarea id="cm" rows="1" maxlength="${esBot ? 500 : 1000}" placeholder="${esBot ? 'Escribe un comando, ej: .menu' : 'Escribe un mensaje'}" aria-label="Mensaje" autocomplete="off"></textarea>${esBot ? '' : `<button class="ib stb" data-a="atach" aria-label="Adjuntar foto o archivo">${ic('clip', 26)}</button><button class="ib stb" data-a="cam" aria-label="Tomar foto">${ic('camera', 26)}</button>`}</div><button class="snd" data-a="send" aria-label="Enviar">${ic('send', 22)}</button>${esBot ? '' : '<input id="adg" type="file" accept="image/*" hidden><input id="adc" type="file" accept="image/*" capture="environment" hidden><input id="adf" type="file" hidden>'}</div></section>`;
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
let chatUn = null, vistoOtro = 0, miVisto = 0;
async function startChat() {
  const o = otro(); if (!db || !user || !o) return;
  if (unsub && curChat === o) { pintaOpts(); aplicarChat(); const e = $('#msgs'); if (!e || e._n !== waLista().length) draw(); return; }
  if (o === 'bot' && curChat === o && !unsub) return;      // ya se está preparando
  if (unsub) unsub(); if (chatUn) chatUn();
  curChat = o; msgs = []; vistoOtro = 0; miVisto = 0; oc = { open: false, tab: null, who: 'me' }; waResp = null; waEdit = null; fabN = 0;
  if (o === 'bot') { waStartBot(); return; }
  const cref = db.collection('chats').doc(cidOf(o));
  let primera = true;
  unsub = cref.collection('msgs').orderBy('t').limitToLast(60).onSnapshot(s => {
    if (!primera) { const el = $('#msgs'); if (el && el._peg === false) for (const ch of s.docChanges()) if (ch.type === 'added' && ch.doc.data().de !== user.uid) fabInc(); }   // mensajes nuevos mientras lees más arriba
    primera = false;
    msgs = s.docs.map(d => ({ ...d.data(), id: d.id, _id: waIdDe(d.id) })); draw(); marcaVisto();
  }, e => toast(errMsg(e)));
  // cuándo vio el otro los mensajes (para las palomitas)
  chatUn = cref.onSnapshot(s => { const v = ((s.data() || {}).vistos || {})[o], n = v && v.seconds ? v.seconds * 1000 : 0; if (n !== vistoOtro) { vistoOtro = n; if (msgs.length) draw(); } }, () => {});
  draw(); loadBg(o);
}
// ───────── chat con el bot ─────────
// Los mensajes viven solo en esta pantalla (memoria de la página): se borran al recargar la página, no al salir del chat.
// Firebase es solo la tubería: el bot borra tu mensaje al recibirlo y esta página borra cada respuesta en cuanto la recibe.
let waBotP = null;
function waBotChat() {
  if (!waBotP) {
    const FV = firebase.firestore.FieldValue;
    waBotP = db.collection('chats').doc(cidOf('bot')).set({ miembros: [user.uid, 'bot'], ultimo: FV.delete(), vistos: FV.delete() }, { merge: true }).catch(e => { waBotP = null; throw e; });
  }
  return waBotP;
}
const waEnChat = () => curChat === 'bot' && !!$('#msgs');
const waBusca = id => waBotMsgs.find(x => x.cl === id || x.ci === id);
function waPinta(m) {
  if (!waEnChat()) return;
  const el = $('#msgs'); waVuelca(el, waBotMsgs); el._n = waBotMsgs.length;
  if (el._peg !== false || m.de === user.uid) { el._peg = true; pega(el); } else fabInc();
}
function waRepinta(m) { const el = waEnChat() ? $('#msgs') : null; if (el) waVuelca(el, waBotMsgs); }
function waReacciona(id, em) { const m = waBusca(id); if (!m) return; m.rx = em || ''; waRepinta(m); }
const WA_CAMPOS = ['tx', 'tp', 'src', 'iu', 'u', 'nm', 'gif', 'ft', 'bt', 'bu', 'lp', 'ar', 'mn', 'qr', 'qt', 'qd'];
function waEdita(d) {                                     // el bot editó un mensaje suyo (como el .ping)
  const m = waBusca(d.ed); if (!m) return;
  for (const k of WA_CAMPOS) { if (k in d) m[k] = d[k]; else if (!['qr', 'qt', 'qd'].includes(k)) delete m[k]; }   // la cita original se conserva
  m.edit = true; waCache.delete(m); waRepinta(m);
}
function waPrevia(id, lp) {                              // la previa de un enlace llegó después del mensaje
  const m = waBusca(id); if (!m || !lp) return;
  m.lp = lp; waCache.delete(m); waRepinta(m);
  const el = waEnChat() ? $('#msgs') : null; if (el && el._peg !== false) pega(el);
}
function waAviso(texto) {                                 // aviso local (no viene de Firebase)
  const m = { de: 'bot', tp: 't', tx: texto, t: firebase.firestore.Timestamp.now(), local: true };
  waBotMsgs.push(m); waPinta(m); if (!waEnChat()) waBotNuevos++;
}
function waBorra(id) {                                    // el bot borró un mensaje
  const i = waBotMsgs.findIndex(x => x.cl === id || x.ci === id); if (i < 0) return;
  waBotMsgs.splice(i, 1);
  const el = waEnChat() ? $('#msgs') : null; if (el) { waVuelca(el, waBotMsgs); el._n = waBotMsgs.length; }
}
function waVisto() {                                      // el bot ya respondió: palomitas de "visto"
  vistoOtro = Date.now();
  if (!waEnChat()) return;
  document.querySelectorAll('#msgs .bub.me .tk:not(.v)').forEach(t => { t.classList.add('v'); t.innerHTML = ic('check2', 15); t.setAttribute('aria-label', 'Visto'); });
}
// Escucha las respuestas del bot mientras la página esté abierta (aunque salgas del chat, no se pierden)
function waEscuchaBot() {
  if (waBotUn && waBotUid === user.uid) return;
  if (waBotUn) { waBotUn(); waBotUn = null; }
  if (waBotUid && waBotUid !== user.uid) waBotMsgs.length = 0;
  waBotUid = user.uid;
  let primera = true;
  let desde = 0; const vistos = new Set();   // ids ya mostrados: Firestore re-entrega mensajes viejos al borrar los nuevos (ventana limitToLast)
  waBotUn = db.collection('chats').doc(cidOf('bot')).collection('msgs').orderBy('t').limitToLast(30).onSnapshot(s => {
    if (primera) { s.docs.forEach(x => { vistos.add(x.id); const t = x.data().t; if (t && t.toMillis) desde = Math.max(desde, t.toMillis()); }); if (!s.metadata.fromCache) primera = false; return; }   // lo que hubiera de antes se ignora
    if (!user || user.uid !== waBotUid) return;
    let nuevo = false;
    for (const ch of s.docChanges()) {
      if (ch.type !== 'added' || vistos.has(ch.doc.id)) continue;
      vistos.add(ch.doc.id);
      const d = ch.doc.data();
      if (d.de !== 'bot') continue;
      const ms = d.t && d.t.toMillis ? d.t.toMillis() : 0;
      if (ms && ms <= desde) { ch.doc.ref.delete().catch(() => {}); continue; }   // mensaje viejo que quedó guardado: no se vuelve a pintar
      ch.doc.ref.delete().catch(() => {});                // ya está en tu pantalla: no se guarda nada en Firebase
      const bi = d.bi || 'vieja', ahora = Date.now();     // ¿responden dos copias del bot a la vez?
      if (!waAvisoCopia) for (const [k, v] of waCopias) if (k !== bi && ahora - v < 90000) {
        waAvisoCopia = true;
        waAviso('*Aviso:* hay más de una copia de tu bot respondiendo este chat (por eso ves respuestas repetidas o que llegan a WhatsApp). Apaga las demás: otras sesiones de Termux, un hosting (Render, Replit…) u otro celular.');
        break;
      }
      waCopias.set(bi, ahora);
      if (d.tp === 'r') waReacciona(d.re, d.em);
      else if (d.tp === 'x') waBorra(d.re);
      else if (d.tp === 'p') waPrevia(d.re, d.lp);
      else if (d.ed) waEdita(d);
      else { waBotMsgs.push(d); waPinta(d); nuevo = true; if (!waEnChat()) waBotNuevos++; if (typeof avBot === 'function') avBot(d); }
    }
    if (nuevo) { waVisto(); if (!waEnChat() && !location.hash.startsWith('#chat/')) renderSoon(); }
  }, e => { waBotUn = null; waBotUid = null; toast(errMsg(e)); });
}
async function waStartBot() {
  msgs = waBotMsgs; waBotNuevos = 0;
  draw();                                                 // la pantalla queda lista al instante, con lo que ya había
  unsub = () => {};                                       // la escucha del bot sigue activa mientras la página esté abierta
  try { await waBotChat(); } catch (e) { unsub = null; curChat = null; toast(errMsg(e)); return; }
  waEscuchaBot();
}
async function waEnviarBot(m) {
  const cl = Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4), q = waResp; waResp = null; barraPinta();
  const loc = { de: user.uid, tp: 't', tx: m.tx || '', cl, t: firebase.firestore.Timestamp.now() };
  if (Array.isArray(m.mn) && m.mn.length) loc.mn = m.mn;
  if (q) { loc.qr = q.id; loc.qt = q.tx; loc.qd = q.de; }
  waBotMsgs.push(loc); waPinta(loc);                      // aparece al instante y se queda en pantalla
  const ref = db.collection('chats').doc(cidOf('bot')), ts = firebase.firestore.FieldValue.serverTimestamp();
  const doc = { de: user.uid, tp: 't', t: ts, tx: loc.tx, cl };
  if (m.bid) doc.bid = m.bid; if (loc.mn) doc.mn = loc.mn;
  if (q && q.id) { doc.qr = q.id; doc.qt = q.tx; doc.qd = q.de; }
  const manda = () => ref.collection('msgs').add(doc);
  try {
    await waBotChat(); waEscuchaBot();
    try { await manda(); }
    catch (e) { if (doc.qr && e.code === 'permission-denied') { delete doc.qr; delete doc.qt; delete doc.qd; await manda(); } else throw e; }   // si las reglas no aceptan la cita, se manda sin ella
    ref.set({ ping: ts }, { merge: true }).catch(() => {});
  } catch (e) { toast(errMsg(e)); }
}
// Avisa que ya viste los mensajes del otro
function marcaVisto() {
  if (document.hidden || !curChat || curChat === 'bot' || !user || !db) return;
  let ult = 0; for (const m of msgs) if (m.de !== user.uid && m.t && m.t.seconds) ult = Math.max(ult, m.t.seconds * 1000);
  if (ult && ult > miVisto) { miVisto = ult; db.collection('chats').doc(cidOf(curChat)).set({ vistos: { [user.uid]: firebase.firestore.FieldValue.serverTimestamp() } }, { merge: true }).catch(() => {}); }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) marcaVisto(); });
const pega = el => { el.scrollTop = el.scrollHeight; requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; }); };
const palomita = m => {
  if (m.de !== user.uid) return '';
  if (!m.t) return `<span class="tk" role="img" aria-label="Enviando">${ic('clock', 14)}</span>`;   // todavía no llega al servidor
  const v = !!(m.t.seconds && m.t.seconds * 1000 <= vistoOtro);
  return `<span class="tk${v ? ' v' : ''}" role="img" aria-label="${v ? 'Visto' : 'Enviado'}">${ic(v ? 'check2' : 'check', 15)}</span>`;
};
const waVacio = () => `<p class="mu vacio">${ic('chat', 30)}<span>${otro() === 'bot' ? 'Escribe un comando, ej: .menu' : 'Escribe el primer mensaje'}</span></p>`;
// Pone la lista de mensajes en pantalla tocando solo lo que cambió (nada de parpadeos con fotos), con separadores de día
function waVuelca(el, L) {
  if (!L.length) { el.innerHTML = waVacio(); el._hs = []; el._vac = 1; return; }
  if (el._vac) { el.innerHTML = ''; el._vac = 0; el._hs = []; }
  const items = []; let dia = '';
  for (const m of L) {
    const k = diaKey(m.t);
    if (k !== dia) { dia = k; items.push(`<div class="dsep"><span>${esc(diaTxt(m.t))}</span></div>`); }
    const h = waHtmlMsg(m); if (h) items.push(h);
  }
  const hs = el._hs || [];
  for (let i = 0; i < items.length; i++) {
    const cur = el.children[i];
    if (cur && hs[i] === items[i]) continue;
    if (cur) { cur.insertAdjacentHTML('beforebegin', items[i]); cur.remove(); } else el.insertAdjacentHTML('beforeend', items[i]);
  }
  while (el.children.length > items.length) el.lastElementChild.remove();
  el._hs = items;
}
// botón flotante "ir al último mensaje" (con contador de nuevos)
let fabN = 0;
function fabAct(el) {
  const b = $('#fab'); if (!b) return;
  const lejos = el.scrollHeight - el.scrollTop - el.clientHeight > 220;
  if (!lejos) fabN = 0;
  b.hidden = !lejos;
  const n = $('#fabn'); if (n) { n.hidden = !fabN; n.textContent = fabN > 99 ? '99+' : fabN; }
}
const fabInc = () => { fabN++; const el = $('#msgs'); if (el) fabAct(el); };
// subtítulo del encabezado (se actualiza aparte para no redibujar el chat entero)
function chsPinta() {
  const el = $('#chs'); if (!el) return;
  let h;
  if (otro() === 'bot') { const t = botEst && botEst.t && botEst.t.seconds ? botEst.t.seconds * 1000 : 0, vivo = !!(botEst && botEst.enLinea) && Date.now() - t < 180000; h = botEst ? (vivo ? '<i class="on"></i>En línea' : 'Desconectado') : 'Bot de WhatsApp'; }
  else h = ic('lock', 12) + 'Chat privado';
  if (el._h !== h) { el._h = h; el.innerHTML = h; }
}
setInterval(chsPinta, 5000);
function draw() {
  const el = $('#msgs'); if (!el) return;
  aplicarChat(); chsPinta(); barraPinta();
  if (!el._ev) { // se prepara una sola vez: seguir abajo mientras cargan imágenes y al cambiar el tamaño
    el._ev = 1;
    el.addEventListener('scroll', () => { el._peg = el.scrollHeight - el.scrollTop - el.clientHeight < 90; fabAct(el); }, { passive: true });
    el.addEventListener('load', () => { if (el._peg !== false) el.scrollTop = el.scrollHeight; }, true);
    if (window.ResizeObserver) new ResizeObserver(() => { if (el._peg !== false) el.scrollTop = el.scrollHeight; }).observe(el);
  }
  const L = waLista(), peg = el._peg !== false, ult = L[L.length - 1];
  waVuelca(el, L);
  el._n = L.length;
  if (peg || !el._pos || (ult && ult.de === user.uid)) { el._pos = 1; el._peg = true; pega(el); }
  fabAct(el);
}
const etiquetaUlt = m => m.tp === 's' ? 'Sticker' : m.tp === 'i' ? (m.tx || 'Foto') : m.tp === 'd' ? (m.nm || 'Archivo') : m.tx;
// m = { tx, tp:'t' } · { src, tp:'s' } · { src, w, h, tx, tp:'i' } (foto) · { u, nm, sz, tx, tp:'d' } (archivo)
async function enviar(m) {
  const o = otro(); if (!m || (!m.tx && !m.src && !m.u)) return;
  if (o === 'bot') return waEnviarBot(m);
  const q = waResp; waResp = null; barraPinta();
  const ref = db.collection('chats').doc(cidOf(o)), ts = firebase.firestore.FieldValue.serverTimestamp();
  const doc = { de: user.uid, tp: m.tp, t: ts };
  for (const k of ['tx', 'src', 'u', 'nm', 'sz', 'w', 'h', 'bid']) if (m[k] != null && m[k] !== '') doc[k] = m[k];
  if (Array.isArray(m.mn) && m.mn.length) doc.mn = m.mn;
  if (q && q.id) { doc.qr = q.id; doc.qt = q.tx; doc.qd = q.de; }
  try {
    await ref.collection('msgs').add(doc);
    await ref.set({ ultimo: { tx: etiquetaUlt(m), tp: m.tp, t: ts, de: user.uid } }, { merge: true });
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
  if (a === 'tema') { oc.open = !oc.open; if (oc.open) { $('#pan').hidden = true; const ap = $('#atp'); if (ap) ap.hidden = true; if (!oc.tab) oc.tab = 'col'; } pintaOpts(); return true; }
  if (a === 'otab') { oc.tab = oc.tab === t.dataset.k ? null : t.dataset.k; pintaOpts(); return true; }
  if (a === 'who') { oc.who = t.dataset.k; pintaOpts(); return true; }
  if (a === 'setcol') { await setCC({ col: t.dataset.k }); return true; }
  if (a === 'setbub') { await setCC(oc.who === 'me' ? { bm: t.dataset.k } : { bt: t.dataset.k }); return true; }
  if (a === 'setfp') { await setCC({ fp: t.dataset.k, fi: false }); return true; }
  if (a === 'bgquita') { await setCC({ fi: false }); try { await db.collection('perfiles').doc(user.uid).collection('fondos').doc(otro()).delete(); } catch (_) {} bgImgs[otro()] = null; return true; }
  if (a === 'pan') {
    const p = $('#pan'); p.hidden = !p.hidden; const ap = $('#atp'); if (ap) ap.hidden = true;
    if (!p.hidden) { oc.open = false; pintaOpts(); p.innerHTML = panHtml(); cargarStickers(); }
    return true;
  }
  if (a === 'botbtn') {                                    // respuesta inmediata: se ve al tocar, sin esperar a la red
    if (t._busy) return true;
    t._busy = 1; t.style.opacity = '.55'; setTimeout(() => { t._busy = 0; t.style.opacity = ''; }, 900);
    enviar({ tx: t.dataset.l, tp: 't', bid: t.dataset.id });
    return true;
  }
  if (a === 'vermas') {
    const box = t.previousElementSibling; if (!box) return true;
    const bub = t.closest('.bub'), mm = bub && waLista().find(x => 'mb' + x._id === bub.id); if (mm) waCache.delete(mm);
    const k = box.dataset.k, ab = !waVmAbiertos.has(k);
    if (ab) waVmAbiertos.add(k); else waVmAbiertos.delete(k);
    box.setAttribute('style', waVmEstilo(ab)); t.textContent = ab ? 'Ver menos' : 'Ver más';
    return true;
  }
  if (a === 'mnpick') { waMpElige(t.dataset.k, t.dataset.n); return true; }
  if (a === 'send') {
    const i = $('#cm'); if (!i) return true; const v = i.value.trim(); if (!v) return true;
    i.value = ''; i.style.height = '';
    if (waEdit) { const ed = waEdit; waEdit = null; barraPinta(); await editaGuarda(ed, v); return true; }
    const mn = otro() === 'bot' ? waMenc.filter(x => v.includes('@' + x.n)).map(x => ({ k: x.k, n: x.n })) : []; waMenc = []; waMpHide(); enviar({ tx: v, tp: 't', mn }); return true;
  }
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
// Enter envía (en el celular, con los amigos, Enter hace salto de línea y se envía con el botón)
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.target.id !== 'cm' || e.shiftKey || e.isComposing) return;
  if (otro() !== 'bot' && window.matchMedia && matchMedia('(pointer:coarse)').matches) return;
  e.preventDefault(); document.querySelector('[data-a=send]').click();
});
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#chat/') && (unsub || curChat)) { if (unsub) unsub(); unsub = null; curChat = null; msgs = []; waMenc = []; waResp = null; waEdit = null; if (typeof mxCierra === 'function') mxCierra(); if (chatUn) { chatUn(); chatUn = null; } } });
