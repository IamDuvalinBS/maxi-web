// Noticias: todos pueden publicar (texto, foto, GIF o video), comentar y reaccionar.
// Estructura en Firestore:
//   noticias/{id}            -> datos + miniatura (thumb) + contadores (vistas, ncom, reacN)
//   noticias/{id}/partes/{n} -> el archivo completo (foto/GIF/video) partido en trozos de ~700 KB
//   noticias/{id}/com/{id}   -> comentarios
//   noticias/{id}/reac/{uid} -> la reacción de cada persona
let news = [], nLoaded = false, nf = null, nd = null, nBusy = false;
const NMAX = { gif: 5e6, video: 5e6 };
const TAGS = [['noticia', 'Noticia', '#ff2e9a'], ['encuesta', 'Encuesta', '#e11d48'], ['meme', 'Meme', '#ff8a1f'], ['pregunta', 'Pregunta', '#8c5bff'], ['aviso', 'Aviso', '#0ea5e9']];
const REAC = [['like', 'thumb', 'Me gusta', '#17e4ff'], ['heart', 'heart', 'Me encanta', '#ff2e9a'], ['fire', 'fire', 'Genial', '#ff8a1f'], ['laugh', 'laugh', 'Divertido', '#ffd21f'], ['wow', 'wow', 'Asombroso', '#b5ff2e'], ['sad', 'sad', 'Triste', '#8c5bff']];
const tagOf = k => TAGS.find(t => t[0] === k);
const gradDe = s => { let h = 0; for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) % 360; return `linear-gradient(135deg,hsl(${h} 90% 58%),hsl(${(h + 70) % 360} 85% 45%))`; };
const trozos = (s, n = 700000) => { const r = []; for (let i = 0; i < s.length; i += n) r.push(s.slice(i, i + n)); return r; };

function embedUrl(u) {
  u = (u || '').trim(); let m;
  if ((m = u.match(/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^\s#]*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/i))) return { yt: m[1], thumb: `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` };
  if (/^https:\/\/[^\s]+\.(mp4|webm|ogg)(\?[^\s]*)?$/i.test(u)) return { dir: u };
  return null;
}
function videoThumb(file) {
  return new Promise(ok => {
    const u = URL.createObjectURL(file), v = document.createElement('video'); let hecho = false;
    const fin = r => { if (hecho) return; hecho = true; URL.revokeObjectURL(u); ok(r); };
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.onloadeddata = () => { v.currentTime = Math.min(.5, (v.duration || 1) / 2); };
    v.onseeked = () => {
      try {
        const k = Math.min(1, 480 / Math.max(v.videoWidth, v.videoHeight, 1)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(v.videoWidth * k)); c.height = Math.max(1, Math.round(v.videoHeight * k));
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); fin(c.toDataURL('image/jpeg', .7));
      } catch (e) { fin(null); }
    };
    v.onerror = () => fin(null); setTimeout(() => fin(null), 8000); v.src = u;
  });
}

// ---------- Lista ----------
async function loadNews() {
  if (!db) return;
  try { const s = await db.collection('noticias').orderBy('t', 'desc').limit(40).get(); news = s.docs.map(d => ({ id: d.id, ...d.data() })); nLoaded = true; render(); }
  catch (e) { nLoaded = true; toast(errMsg(e)); }
}
function ncard(n) {
  const tg = tagOf(n.tag), th = n.thumb && imgOk(n.thumb);
  const chip = n.tp === 'video' ? `<span class="nchip">${ic('play', 13)}vídeo</span>` : n.tp === 'gif' ? `<span class="nchip">GIF</span>` : '';
  return `<a class="nc" href="#noticia/${esc(n.id)}"><div class="nt${th ? '' : ' tx'}"${th ? '' : ` style="background:${gradDe(n.titulo)}"`}>${th ? `<img src="${esc(n.thumb)}" alt="" loading="lazy">` : (n.tp === 'video' ? ic('play', 40) : ic('text', 38))}${chip}</div>
    <div class="nb">${tg ? `<span class="ntag" style="background:${tg[2]}">${tg[1]}</span>` : ''}<h3>${esc(n.titulo)}</h3><div class="ns"><span>${ic('eye', 16)}${n.vistas || 0}</span><span>${ic('comment', 16)}${n.ncom || 0}</span></div></div></a>`;
}
function noticiasView() {
  return `<div class="ti">${ic('news', 24)}<span>Noticias</span>${nf ? '' : `<button class="btn sm" data-a="nnew">${ic('plus', 16)}Publicar</button>`}</div>` + (nf ? formNews() : '') +
    (news.length ? `<div class="ng">${news.map(ncard).join('')}</div>` : `<section class="card">${empty('news', nLoaded ? 'Aún no hay noticias. Sé la primera persona en publicar.' : 'Cargando noticias…')}</section>`);
}

// ---------- Publicar ----------
function formNews() {
  return `<section class="card pform"><div class="ti sm">${ic('plus', 20)}<span>Nueva publicación</span></div>
  <label class="fl2" for="nti">Título</label><input class="fi" id="nti" maxlength="100" value="${esc(nf.titulo)}" placeholder="¿De qué trata?">
  <div class="tags">${TAGS.map(t => `<button class="tg${nf.tag === t[0] ? ' on' : ''}" data-a="ntag" data-k="${t[0]}" style="--tc:${t[2]}">${t[1]}</button>`).join('')}</div>
  <label class="fl2" for="ntx">Texto (opcional si subes foto o video)</label><textarea class="fi" id="ntx" maxlength="3000" rows="5" placeholder="Cuéntanos más…">${esc(nf.texto)}</textarea>
  <div id="nprev" class="nprev">${nprevHtml()}</div>
  <div class="row"><label class="btn sec sm" for="nfi">${ic('image', 16)}Foto</label><label class="btn sec sm" for="nfg">${ic('gif', 16)}GIF</label><label class="btn sec sm" for="nfv">${ic('video', 16)}Video</label>
    <input id="nfi" type="file" accept="image/*" hidden><input id="nfg" type="file" accept="image/gif" hidden><input id="nfv" type="file" accept="video/*" hidden>
    ${nf.file || nf.enlace ? `<button class="btn sec sm" data-a="nquita">Quitar</button>` : ''}</div>
  <label class="fl2" for="nen">o pega un enlace de video (YouTube o .mp4)</label><input class="fi" id="nen" inputmode="url" value="${esc(nf.enlace)}" placeholder="https://youtube.com/…">
  <p class="mu stk-hint">Fotos se optimizan solas. GIF y video: hasta 5 MB. Para videos largos usa un enlace.</p>
  <div class="row"><button class="btn" data-a="npub" id="npub">Publicar</button><button class="btn sec" data-a="ncancel">Cancelar</button></div></section>`;
}
function nprevHtml() {
  if (!nf.file) return '';
  return nf.tp === 'video' ? `<video src="${nf.prev}" controls playsinline muted></video>` : `<img src="${nf.prev}" alt="Vista previa">`;
}
function syncNf() { if (!nf || !$('#nti')) return; nf.titulo = $('#nti').value; nf.texto = $('#ntx').value; nf.enlace = $('#nen').value; }
function nSoltar() { if (nf && nf.prev) URL.revokeObjectURL(nf.prev); nf = null; }
document.addEventListener('change', e => {
  const id = e.target.id; if (!['nfi', 'nfg', 'nfv'].includes(id) || !e.target.files[0] || !nf) return;
  const f = e.target.files[0], tp = id === 'nfv' ? 'video' : (f.type === 'image/gif' ? 'gif' : 'foto');
  if (tp !== 'foto' && f.size > NMAX[tp]) { e.target.value = ''; return toast('Ese archivo pesa más de 5 MB. Prueba con uno más corto o pega un enlace.'); }
  if (nf.prev) URL.revokeObjectURL(nf.prev);
  syncNf(); nf.file = f; nf.tp = tp; nf.prev = URL.createObjectURL(f); nf.enlace = ''; render();
  const fm = $('.pform'); if (fm) fm.scrollIntoView({ block: 'center' });
});
async function nPublicar() {
  if (nBusy) return; syncNf();
  const titulo = nf.titulo.trim(), texto = nf.texto.trim(), enlace = nf.enlace.trim();
  if (!titulo) return toast('Escribe un título.');
  if (!texto && !nf.file && !enlace) return toast('Agrega un texto, una foto, un GIF o un video.');
  let emb = null; if (enlace && !nf.file) { emb = embedUrl(enlace); if (!emb) return toast('Enlace no válido. Usa un enlace de YouTube o un archivo .mp4 con https.'); }
  nBusy = true; const b = $('#npub'); if (b) { b.disabled = true; b.textContent = 'Publicando…'; }
  let ref = null;
  try {
    let tp = 'texto', thumb = null, mime = null, partes = [], url = null;
    if (nf.file) {
      const raw = await leeArchivo(nf.file); tp = nf.tp;
      if (tp === 'foto') { let q = .78, img = await comprime(raw, 1280, q); while (img.length > 2.4e6 && q > .4) { q -= .1; img = await comprime(raw, 1000, q); } partes = trozos(img); mime = 'image/jpeg'; thumb = await comprime(raw, 480, .7); }
      else if (tp === 'gif') { partes = trozos(raw); mime = 'image/gif'; thumb = await comprime(raw, 480, .7); }
      else { partes = trozos(raw); mime = nf.file.type || 'video/mp4'; thumb = await videoThumb(nf.file); }
    } else if (emb) { tp = 'video'; url = enlace; thumb = emb.thumb || null; }
    ref = db.collection('noticias').doc();
    await ref.set({ titulo, texto, tag: nf.tag, tp, thumb, mime, np: partes.length, url, uid: user.uid, autor: nombre(), vistas: 0, ncom: 0, reacN: {}, t: firebase.firestore.FieldValue.serverTimestamp() });
    for (let i = 0; i < partes.length; i++) await ref.collection('partes').doc(String(i).padStart(3, '0')).set({ d: partes[i] });
    nSoltar(); toast('Publicado'); await loadNews();
  } catch (e) {
    if (ref) { try { await ref.delete(); } catch (_) {} }
    toast(errMsg(e)); const b2 = $('#npub'); if (b2) { b2.disabled = false; b2.textContent = 'Publicar'; }
  }
  nBusy = false;
}

// ---------- Detalle ----------
function noticiaView() {
  const id = location.hash.slice(9);
  setTimeout(() => abreNoticia(id), 0);
  return `<div id="nd"><a href="#noticias" class="back">${ic('back', 20)}Noticias</a><div id="nart"></div><div id="nreac" class="reacs"></div>
    <section class="card"><div class="ti sm">${ic('comment', 20)}<span>Comentarios</span><span class="mu" id="ncnt"></span></div><div id="nlist" class="clist"></div>
    <div class="cmp" style="margin-top:12px"><input id="ncin" maxlength="500" placeholder="Escribe un comentario" aria-label="Comentario" autocomplete="off"><button class="snd" data-a="ncom" aria-label="Comentar">${ic('send', 20)}</button></div></section></div>`;
}
function pintaArt() {
  const el = $('#nart'); if (!el) return;
  if (!nd) { el.innerHTML = ''; return; }
  if (nd.err) { el.innerHTML = `<section class="card">${empty('news', esc(nd.err))}</section>`; return; }
  const d = nd.d; if (!d) { el.innerHTML = `<section class="card">${empty('news', 'Cargando…')}</section>`; return; }
  const th = d.thumb && imgOk(d.thumb) ? d.thumb : '';
  let media = '';
  if (d.url) {
    const e = embedUrl(d.url);
    if (e && e.yt) media = `<div class="yt"><iframe src="https://www.youtube-nocookie.com/embed/${e.yt}" title="Video" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
    else if (e && e.dir) media = `<video class="nmedia" src="${esc(e.dir)}" controls playsinline preload="metadata"${th ? ` poster="${esc(th)}"` : ''}></video>`;
  } else if (d.np) {
    if (d.tp === 'video') media = nd.media ? `<video class="nmedia" src="${nd.media}" controls playsinline${th ? ` poster="${esc(th)}"` : ''}></video>` : `<div class="nload">${th ? `<img src="${esc(th)}" alt="">` : ''}<span>Cargando video…</span></div>`;
    else media = `<img class="nmedia" src="${nd.media || th}" alt="${esc(d.titulo)}"${nd.media ? '' : ' style="filter:blur(2px)"'}>`;
  }
  const tg = tagOf(d.tag), mio = user && (d.uid === user.uid || owner);
  el.innerHTML = `<article class="card ndet">${media}<div class="nbody">${tg ? `<span class="ntag" style="background:${tg[2]}">${tg[1]}</span>` : ''}<h1>${esc(d.titulo)}</h1>
    <div class="dmeta"><span class="dav">${inicial(d.autor)}</span><span>${esc(d.autor)}</span>${esOwner(d.uid) ? vf() : ''}<time>${fechaDe(d.t)}</time>
    <span class="nsm"><span>${ic('eye', 16)}${d.vistas || 0}</span></span></div>
    ${d.texto ? `<p class="dtx full">${esc(d.texto)}</p>` : ''}${mio ? `<div class="row"><button class="btn sec sm" data-a="ndel">${ic('trash', 16)}Eliminar</button></div>` : ''}</div></article>`;
}
function pintaReac() {
  const el = $('#nreac'); if (!el || !nd || !nd.d) { if (el) el.innerHTML = ''; return; }
  const r = nd.d.reacN || {};
  el.innerHTML = REAC.map(([k, i, t, c]) => `<button class="rc${nd.mia === k ? ' on' : ''}" data-a="nreac" data-k="${k}" style="--rc:${c}" aria-label="${t}" aria-pressed="${nd.mia === k}" title="${t}">${ic(i, 22)}<span>${Math.max(0, r[k] || 0)}</span></button>`).join('');
}
function pintaCom() {
  const el = $('#nlist'); if (!el || !nd) return;
  const c = $('#ncnt'); if (c) c.textContent = nd.com.length ? '(' + nd.com.length + ')' : '';
  el.innerHTML = nd.com.length ? nd.com.map(x => { const p = perfs[x.uid] || {}; return `<div class="cm">${avOf(p, 38)}<div class="cb2"><div class="cn"><b>${esc(x.autor || p.nombre)}</b>${esOwner(x.uid) ? vf() : ''}<small>${fechaDe(x.t)} ${horaDe(x.t)}</small>${user && (x.uid === user.uid || owner) ? `<button class="tb2 sm" data-a="ncdel" data-id="${esc(x.id)}" aria-label="Eliminar comentario">${ic('trash', 14)}</button>` : ''}</div><p>${esc(x.tx)}</p></div></div>`; }).join('')
    : `<p class="mu vacio">${ic('comment', 26)}<span>Aún no hay comentarios. Escribe el primero.</span></p>`;
}
async function abreNoticia(id) {
  if (!db || !id) return;
  if (nd && nd.id === id) { pintaArt(); pintaReac(); pintaCom(); return; }
  nSoltarDetalle(); nd = { id, d: null, media: null, mia: null, com: [], err: null }; pintaArt(); pintaReac(); pintaCom();
  const vivo = () => nd && nd.id === id, ref = db.collection('noticias').doc(id);
  try {
    const s = await ref.get(); if (!vivo()) return;
    if (!s.exists) { nd.err = 'Esa publicación ya no existe.'; return pintaArt(); }
    nd.d = { id, ...s.data() }; pintaArt(); pintaReac();
    // contar la vista una sola vez por dispositivo
    let vistos = []; try { vistos = JSON.parse(localStorage.getItem('nvis') || '[]'); } catch (_) {}
    if (!vistos.includes(id)) { vistos.push(id); try { localStorage.setItem('nvis', JSON.stringify(vistos.slice(-300))); } catch (_) {} nd.d.vistas = (nd.d.vistas || 0) + 1; ref.update({ vistas: firebase.firestore.FieldValue.increment(1) }).catch(() => {}); pintaArt(); }
    const tareas = [
      ref.collection('reac').doc(user.uid).get().then(r => { if (vivo()) { nd.mia = r.exists ? r.data().k : null; pintaReac(); } }).catch(() => {}),
      ref.collection('com').orderBy('t').limit(150).get().then(async q => { const l = q.docs.map(d => ({ id: d.id, ...d.data() })); await Promise.all([...new Set(l.map(x => x.uid))].map(perfOf)); if (vivo()) { nd.com = l; pintaCom(); } }).catch(e => toast(errMsg(e)))
    ];
    if (nd.d.np && !nd.d.url) tareas.push(ref.collection('partes').orderBy(firebase.firestore.FieldPath.documentId()).get().then(async q => {
      const dataUrl = q.docs.map(d => d.data().d).join(''); if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob(); if (!vivo()) return;
      nd.media = URL.createObjectURL(blob); pintaArt();
    }).catch(e => toast(errMsg(e))));
    await Promise.all(tareas);
  } catch (e) { if (vivo()) { nd.err = errMsg(e); pintaArt(); } }
}
function nSoltarDetalle() { if (nd && nd.media) URL.revokeObjectURL(nd.media); nd = null; }

async function reaccionar(k) {
  if (!nd || !nd.d) return;
  const ref = db.collection('noticias').doc(nd.id), mi = ref.collection('reac').doc(user.uid), inc = n => firebase.firestore.FieldValue.increment(n), b = db.batch();
  const r = { ...(nd.d.reacN || {}) }, ant = nd.mia;
  if (ant === k) { b.delete(mi); b.update(ref, { ['reacN.' + k]: inc(-1) }); r[k] = (r[k] || 1) - 1; nd.mia = null; }
  else {
    b.set(mi, { k, t: firebase.firestore.FieldValue.serverTimestamp() });
    const u = { ['reacN.' + k]: inc(1) }; if (ant) { u['reacN.' + ant] = inc(-1); r[ant] = (r[ant] || 1) - 1; } b.update(ref, u);
    r[k] = (r[k] || 0) + 1; nd.mia = k;
  }
  nd.d.reacN = r; pintaReac();
  try { await b.commit(); } catch (e) { toast(errMsg(e)); }
}
async function comentar() {
  const i = $('#ncin'), tx = (i.value || '').trim(); if (!tx || !nd || !nd.d) return;
  i.value = '';
  const ref = db.collection('noticias').doc(nd.id), c = ref.collection('com').doc(), b = db.batch(), t = firebase.firestore.Timestamp.now();
  b.set(c, { uid: user.uid, autor: nombre(), tx, t: firebase.firestore.FieldValue.serverTimestamp() }); b.update(ref, { ncom: firebase.firestore.FieldValue.increment(1) });
  try { await b.commit(); nd.com.push({ id: c.id, uid: user.uid, autor: nombre(), tx, t }); nd.d.ncom = (nd.d.ncom || 0) + 1; perfs[user.uid] = perfs[user.uid] || { nombre: nombre(), avatar: foto() }; pintaCom(); const l = $('#nlist'); if (l) l.lastElementChild && l.lastElementChild.scrollIntoView({ block: 'nearest' }); }
  catch (e) { i.value = tx; toast(errMsg(e)); }
}
async function borraNoticia() {
  if (!nd || !nd.d || !confirm('¿Eliminar esta publicación? No se puede deshacer.')) return;
  const ref = db.collection('noticias').doc(nd.id);
  try {
    for (const sub of ['partes', 'com', 'reac']) { const q = await ref.collection(sub).get(); for (let i = 0; i < q.docs.length; i += 400) { const b = db.batch(); q.docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); } }
    await ref.delete(); news = news.filter(n => n.id !== nd.id); nSoltarDetalle(); toast('Publicación eliminada'); location.hash = '#noticias';
  } catch (e) { toast(errMsg(e)); }
}
MODS.push(async (a, t) => {
  if (a === 'nnew') { nf = { titulo: '', texto: '', enlace: '', tag: 'noticia', file: null, tp: null, prev: null }; render(); const f = $('.pform'); if (f) f.scrollIntoView({ block: 'center' }); return true; }
  if (a === 'ncancel') { nSoltar(); render(); return true; }
  if (a === 'ntag') { syncNf(); nf.tag = t.dataset.k; document.querySelectorAll('.tg').forEach(x => x.classList.toggle('on', x.dataset.k === nf.tag)); return true; }
  if (a === 'nquita') { syncNf(); if (nf.prev) URL.revokeObjectURL(nf.prev); nf.file = null; nf.prev = null; nf.tp = null; nf.enlace = ''; render(); return true; }
  if (a === 'npub') { await nPublicar(); return true; }
  if (a === 'nreac') { await reaccionar(t.dataset.k); return true; }
  if (a === 'ncom') { await comentar(); return true; }
  if (a === 'ndel') { await borraNoticia(); return true; }
  if (a === 'ncdel') {
    if (!nd || !confirm('¿Eliminar este comentario?')) return true;
    const ref = db.collection('noticias').doc(nd.id), b = db.batch();
    b.delete(ref.collection('com').doc(t.dataset.id)); b.update(ref, { ncom: firebase.firestore.FieldValue.increment(-1) });
    try { await b.commit(); nd.com = nd.com.filter(x => x.id !== t.dataset.id); nd.d.ncom = Math.max(0, (nd.d.ncom || 1) - 1); pintaCom(); } catch (e) { toast(errMsg(e)); }
    return true;
  }
  return false;
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'ncin') { e.preventDefault(); comentar(); } });
window.addEventListener('hashchange', () => {
  if (!location.hash.startsWith('#noticia/')) nSoltarDetalle();
  if (location.hash === '#noticias') loadNews();
});
