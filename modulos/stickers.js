// Stickers: oficiales (carpeta img/stickers/) y de la comunidad (se guardan en la base de datos del bot)
const STK = { of: [], com: [], tab: 'of', cargado: false, cargando: false, crear: null };
const STK_DIR = 'img/stickers/';
const stkOk = s => /^(data:image\/(png|webp|jpeg|gif|svg\+xml);base64,|img\/stickers\/)/i.test(s || '');

// Lee la carpeta img/stickers/. Un sitio estático no puede "listar" carpetas por sí solo,
// así que primero se lee lista.json (hecho con tools/stickers.js) y, si no existe, se intenta el índice de la carpeta.
async function cargaOficiales() {
  let lista = [];
  try {
    const r = await fetch(STK_DIR + 'lista.json?t=' + Date.now(), { cache: 'no-store' });
    if (r.ok) { const j = await r.json(); lista = (Array.isArray(j) ? j : []).map(x => typeof x === 'string' ? x : x && x.f).filter(Boolean); }
  } catch (_) {}
  if (!lista.length) {
    try {
      const r = await fetch(STK_DIR, { cache: 'no-store' });
      if (r.ok) { const h = await r.text(); lista = [...h.matchAll(/href="([^"?#]+\.(?:png|webp|gif|jpe?g|svg))"/gi)].map(m => decodeURIComponent(m[1].split('/').pop())); }
    } catch (_) {}
  }
  STK.of = [...new Set(lista)].filter(f => /^[\w\-. ()ñÑáéíóúÁÉÍÓÚ]+\.(png|webp|gif|jpe?g|svg)$/i.test(f)).map(f => STK_DIR + encodeURIComponent(f).replace(/%2F/g, '/'));
}
async function cargaComunidad() {
  if (!db) return;
  try { const s = await db.collection('stickers').orderBy('t', 'desc').limit(80).get(); STK.com = s.docs.map(d => ({ id: d.id, ...d.data() })); }
  catch (e) { toast(errMsg(e)); }
}
async function cargarStickers(forzar) {
  if (STK.cargando || (STK.cargado && !forzar)) return;
  STK.cargando = true; pintaPan();
  await Promise.all([cargaOficiales(), cargaComunidad()]);
  STK.cargando = false; STK.cargado = true; pintaPan();
}
function panHtml() {
  if (STK.crear) {
    const c = STK.crear;
    return `<div class="stk-new"><div class="stk-pv">${c.img ? `<img src="${esc(c.img)}" alt="Vista previa del sticker">` : `<span class="mu">Elige una imagen</span>`}</div>
      <input class="fi" id="stn" maxlength="24" placeholder="Nombre (opcional)" value="${esc(c.n || '')}">
      <div class="row"><label class="btn sec sm" for="stf">${ic('image', 16)}${c.img ? 'Cambiar imagen' : 'Elegir de la galería'}</label><input id="stf" type="file" accept="image/*" hidden>
      <button class="btn sm" data-a="stksave"${c.img ? '' : ' disabled'}>${ic('check', 16)}Crear sticker</button><button class="btn sec sm" data-a="stkcancel">Cancelar</button></div>
      <p class="mu stk-hint">Tu sticker quedará en la sección De la comunidad para que todos lo puedan usar.</p></div>`;
  }
  const lista = STK.tab === 'of' ? STK.of.map(s => ({ src: s })) : STK.com.map(s => ({ src: s.img, id: s.id, uid: s.uid, n: s.n }));
  const grid = lista.filter(s => stkOk(s.src)).map(s => `<button class="stp" data-a="stksend" data-s="${esc(s.src)}" aria-label="${esc(s.n || 'Sticker')}"><img src="${esc(s.src)}" alt="" loading="lazy">${s.id && user && (s.uid === user.uid || owner) ? `<span class="stx" data-a="stkdel" data-id="${esc(s.id)}" role="button" aria-label="Eliminar sticker">${ic('close', 12)}</span>` : ''}</button>`).join('');
  return `<div class="stk-tabs"><button class="${STK.tab === 'of' ? 'on' : ''}" data-a="stktab" data-k="of">Stickers oficiales</button><button class="${STK.tab === 'com' ? 'on' : ''}" data-a="stktab" data-k="com">De la comunidad</button><button class="snd sm" data-a="stkplus" aria-label="Crear sticker" title="Crear sticker">${ic('plus', 20)}</button></div>
    <div class="stk-grid">${grid || `<p class="mu stk-vacio">${STK.cargando ? 'Cargando stickers…' : STK.tab === 'of' ? 'Aún no hay stickers oficiales. Agrega imágenes en la carpeta img/stickers/.' : 'Todavía nadie creó stickers. Toca + para hacer el primero.'}</p>`}</div>`;
}
function pintaPan() { const p = $('#pan'); if (p && !p.hidden) p.innerHTML = panHtml(); }

// Convierte la imagen en un sticker cuadrado de 256 px con fondo transparente
async function haceSticker(file) {
  const raw = await leeArchivo(file);
  let img = await comprime(raw, 256, .85, 'image/webp');
  if (!img.startsWith('data:image/webp')) img = await comprime(raw, 220, 1, 'image/png');
  if (img.length > 380000) img = await comprime(raw, 160, 1, 'image/png');
  return img;
}
document.addEventListener('change', async e => {
  if (e.target.id !== 'stf' || !e.target.files[0]) return;
  try { const n = $('#stn'); if (STK.crear && n) STK.crear.n = n.value; STK.crear.img = await haceSticker(e.target.files[0]); pintaPan(); }
  catch (er) { toast(er.message); }
});
MODS.push(async (a, t) => {
  if (!a.startsWith('stk')) return false;
  if (a === 'stktab') { STK.tab = t.dataset.k; STK.crear = null; pintaPan(); }
  else if (a === 'stkplus') { STK.crear = { img: null, n: '' }; pintaPan(); }
  else if (a === 'stkcancel') { STK.crear = null; pintaPan(); }
  else if (a === 'stksend') { const s = t.dataset.s; if (stkOk(s)) { $('#pan').hidden = true; await enviar({ tp: 's', src: s }); } }
  else if (a === 'stksave') {
    const c = STK.crear; if (!c || !c.img) return true;
    const n = ($('#stn') ? $('#stn').value : '').trim().slice(0, 24); t.disabled = true;
    try {
      await db.collection('stickers').add({ img: c.img, n, uid: user.uid, autor: nombre(), t: firebase.firestore.FieldValue.serverTimestamp() });
      STK.crear = null; STK.tab = 'com'; toast('Sticker creado'); await cargaComunidad(); pintaPan();
    } catch (er) { toast(errMsg(er)); t.disabled = false; }
  }
  else if (a === 'stkdel') {
    if (!confirm('¿Eliminar este sticker?')) return true;
    try { await db.collection('stickers').doc(t.dataset.id).delete(); await cargaComunidad(); pintaPan(); toast('Sticker eliminado'); } catch (er) { toast(errMsg(er)); }
  }
  return true;
});
