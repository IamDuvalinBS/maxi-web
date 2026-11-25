// Extras del chat al estilo WhatsApp (con el look de Mambo): menú del mensaje, responder, reaccionar, editar, borrar,
// info (fecha de envío / visto), fotos y archivos, visor de fotos, previas de enlaces y botones de copiar.
Object.assign(IC, {
  clip: '<path d="M20.5 11.5l-8.2 8.2a5 5 0 0 1-7-7l8.8-8.8a3.300 3.300 0 0 1 4.700 4.700l-8.800 8.800a1.700 1.700 0 0 1-2.400-2.400l8-8"/>',
  camera: '<path d="M4 8h3l1.500-2.500h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.600"/>',
  reply: '<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 6 6v1"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.500"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.500M12 7.800h.01" stroke-width="2.600"/>',
  file: '<path d="M6 3h8l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v5h5M8 13h8M8 17h5"/>',
  chevd: '<path d="M6 9l6 6 6-6"/>',
  bell: '<path d="M6 17v-6a6 6 0 0 1 12 0v6l1.500 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
});

// ───────── utilidades ─────────
const copia = async t => {
  try { await navigator.clipboard.writeText(t); }
  catch (_) { const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (__) {} a.remove(); }
  toast('Copiado');
};
const urlDe = t => { const m = String(t || '').match(/https?:\/\/[^\s<>"']+/); return m ? m[0].replace(/[.,;:!?)\]]+$/, '') : ''; };
const resumenMsg = m => m.tp === 's' ? 'Sticker' : m.tp === 'i' ? (m.tx || 'Foto') : m.tp === 'd' ? (m.nm || 'Archivo') : (m.tx || '');
const mxDe = el => { const b = el && el.closest && el.closest('.bub,.stm'); return b ? (waLista().find(x => 'mb' + x._id === b.id) || null) : null; };
const autoH = i => { i.style.height = 'auto'; i.style.height = Math.min(i.scrollHeight, 120) + 'px'; };
document.addEventListener('input', e => { if (e.target && e.target.id === 'cm') autoH(e.target); });
const limpiaNombre = n => String(n || 'archivo').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 80);

// ───────── barra de "responder" / "editar" sobre el campo de texto ─────────
function barraPinta() {
  const b = $('#rpb'); if (!b) return;
  const x = `<button class="ib" data-a="rpx" aria-label="Cancelar">${ic('close', 20)}</button>`;
  if (waEdit) { b.hidden = false; b.innerHTML = `<span class="rpi">${ic('edit', 18)}</span><span class="rpt"><b>Editando mensaje</b><small>${esc((waEdit.tx || '').slice(0, 100))}</small></span>${x}`; return; }
  if (!waResp) { b.hidden = true; b.innerHTML = ''; return; }
  b.hidden = false; b.innerHTML = `<span class="rpt"><b>${esc(waAutor(waResp.de))}</b><small>${esc(waResp.tx)}</small></span>${x}`;
}
function respPon(m) {
  waEdit = null;
  waResp = { id: m.id || m.cl || m.ci || '', de: m.de === 'bot' ? 'b' : m.de, tx: resumenMsg(m).slice(0, 140) };
  barraPinta(); const i = $('#cm'); if (i) i.focus();
}
async function editaGuarda(ed, v) {
  if (!ed || !ed.id || v === ed.tx) return;
  try { await db.collection('chats').doc(cidOf(otro())).collection('msgs').doc(ed.id).update({ tx: v, edit: true }); } catch (e) { toast(errMsg(e)); }
}
function waQuita(m) {                                       // quitar un mensaje del chat con el bot (solo de tu pantalla)
  const i = waBotMsgs.indexOf(m); if (i < 0) return;
  waBotMsgs.splice(i, 1);
  const el = $('#msgs'); if (el) { waVuelca(el, waBotMsgs); el._n = waBotMsgs.length; }
}

// ───────── menú del mensaje (mantén pulsado, clic derecho o la flechita) ─────────
const RX = ['thumb', 'heart', 'laugh', 'wow', 'sad', 'fire'];
let mxSel = null;
function mxCierra() {
  const o = $('#mxo'); if (o) o.remove();
  document.querySelectorAll('.bub.sel,.stm.sel').forEach(x => x.classList.remove('sel'));
  mxSel = null;
}
function mxAbre(m) {
  mxCierra(); if (!m) return;
  mxSel = m; const n = document.getElementById('mb' + m._id); if (n) n.classList.add('sel');
  const esBot = otro() === 'bot', mio = m.de === user.uid;
  const puedeEd = mio && !esBot && m.tp === 't' && !!m.id && !!(m.t && m.t.seconds) && Date.now() - m.t.seconds * 1000 < 15 * 60000;
  const mi = m.rx && typeof m.rx === 'object' ? m.rx[user.uid] : '';
  const acc = [['rep', 'reply', 'Responder']];
  if (m.tx) acc.push(['cp', 'copy', 'Copiar texto']);
  if (urlDe(m.tx)) acc.push(['cl', 'link', 'Copiar enlace']);
  acc.push(['info', 'info', 'Info. del mensaje']);
  if (puedeEd) acc.push(['ed', 'edit', 'Editar']);
  if (esBot || (mio && m.id)) acc.push(['del', 'trash', esBot ? 'Quitar de mi pantalla' : 'Eliminar para los dos', 1]);
  const rx = (!esBot && m.id) ? `<div class="mxr">${RX.map(k => `<button class="${mi === k ? 'on' : ''}" data-a="mxrx" data-k="${k}" aria-label="Reaccionar">${ic(k, 24)}</button>`).join('')}</div>` : '';
  const o = document.createElement('div'); o.id = 'mxo'; o.className = 'mxo'; o.dataset.a = 'mxclose';
  o.innerHTML = `<div class="mxs" data-a="mxkeep" role="dialog" aria-label="Opciones del mensaje">${rx}<div class="mxl">${acc.map(x => `<button class="${x[3] ? 'dg' : ''}" data-a="mxact" data-k="${x[0]}">${ic(x[1], 22)}<span>${x[2]}</span></button>`).join('')}</div></div>`;
  document.body.appendChild(o);
}
function mxInfo(m) {                                        // fecha y hora de envío, y si ya lo vieron
  const s = document.querySelector('#mxo .mxs'); if (!s) return;
  const f = d => d.toLocaleString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const t = m.t && m.t.toDate ? m.t.toDate() : null, mio = m.de === user.uid, fila = (k, v) => `<div><b>${k}</b><span>${esc(v)}</span></div>`;
  let r = fila(mio ? 'Enviado' : 'Recibido', t ? f(t) : 'Enviando…');
  if (mio && t && otro() !== 'bot') r += fila('Visto', vistoOtro && vistoOtro >= t.getTime() ? 'Sí · ' + f(new Date(vistoOtro)) : 'Todavía no');
  if (m.edit) r += fila('Editado', 'Sí');
  s.innerHTML = `<div class="mxi">${r}</div><div class="mxl"><button data-a="mxclose">${ic('close', 22)}<span>Cerrar</span></button></div>`;
}
async function reacciona(m, k) {
  if (!m.id) return;
  const cur = m.rx && typeof m.rx === 'object' ? m.rx[user.uid] : '';
  try { await db.collection('chats').doc(cidOf(otro())).collection('msgs').doc(m.id).update({ ['rx.' + user.uid]: cur === k ? firebase.firestore.FieldValue.delete() : k }); } catch (e) { toast(errMsg(e)); }
}
async function mxHaz(k, m) {
  const esBot = otro() === 'bot';
  if (k === 'rep') return respPon(m);
  if (k === 'cp') return copia(m.tx || '');
  if (k === 'cl') return copia(urlDe(m.tx));
  if (k === 'ed') { waResp = null; waEdit = { id: m.id, tx: m.tx }; const i = $('#cm'); if (i) { i.value = m.tx; autoH(i); i.focus(); } barraPinta(); return; }
  if (k === 'del') {
    if (esBot) return waQuita(m);
    if (!confirm('¿Eliminar este mensaje para los dos?')) return;
    try { await db.collection('chats').doc(cidOf(otro())).collection('msgs').doc(m.id).delete(); } catch (e) { toast(errMsg(e)); }
  }
}

// ───────── gestos: deslizar a la derecha = responder · mantener pulsado = menú ─────────
const G = { b: null, supr: false };
document.addEventListener('pointerdown', e => {
  G.supr = false;
  const b = e.target.closest && e.target.closest('#msgs .bub, #msgs .stm');
  if (!b || e.pointerType === 'mouse' || e.target.closest('a,button,video,audio,.cdb')) { G.b = null; return; }
  G.b = b; G.x = e.clientX; G.y = e.clientY; G.sw = false; G.dx = 0;
  clearTimeout(G.tm);
  G.tm = setTimeout(() => {
    if (!G.b || G.sw) return;
    G.supr = true; try { navigator.vibrate && navigator.vibrate(12); } catch (_) {}
    const m = mxDe(G.b); G.b = null; mxAbre(m);
  }, 430);
}, { passive: true });
document.addEventListener('pointermove', e => {
  const b = G.b; if (!b) return;
  const dx = e.clientX - G.x, dy = e.clientY - G.y;
  if (!G.sw) {
    if (Math.abs(dy) > 10 || dx < -10) { clearTimeout(G.tm); G.b = null; return; }
    if (dx > 14 && dx > Math.abs(dy) * 1.5) { G.sw = true; clearTimeout(G.tm); b.style.transition = 'none'; b.classList.add('swp'); } else return;
  }
  G.dx = dx; const p = Math.min(dx, 100) * .62;
  b.style.transform = `translateX(${p}px)`; b.style.setProperty('--p', Math.min(1, p / 40));
}, { passive: true });
const gFin = () => {
  clearTimeout(G.tm); const b = G.b; if (!b) return; G.b = null;
  if (!G.sw) return;
  G.supr = true; const ok = G.dx * .62 >= 38, m = mxDe(b);
  b.style.transition = ''; b.style.transform = ''; b.style.removeProperty('--p'); b.classList.remove('swp');
  if (ok && m) { try { navigator.vibrate && navigator.vibrate(10); } catch (_) {} respPon(m); }
};
document.addEventListener('pointerup', gFin); document.addEventListener('pointercancel', gFin);
document.addEventListener('click', e => { if (G.supr) { G.supr = false; e.stopPropagation(); e.preventDefault(); } }, true);
document.addEventListener('contextmenu', e => {             // clic derecho (compu) o pulsación larga que el navegador reporta
  const b = e.target.closest && e.target.closest('#msgs .bub, #msgs .stm'); if (!b) return;
  e.preventDefault(); if (!$('#mxo')) mxAbre(mxDe(b));
});

// ───────── visor de fotos ─────────
function lbCierra() { const o = $('#lbx'); if (o) o.remove(); }
function lbAbre(src) {
  if (!src) return; lbCierra();
  const ext = ((src.match(/^data:image\/(\w+)/) || [])[1] || 'jpg').replace('jpeg', 'jpg');
  const o = document.createElement('div'); o.id = 'lbx'; o.className = 'lbx';
  o.innerHTML = `<div class="lbb"><button class="ib" data-a="lbclose" aria-label="Cerrar">${ic('close', 26)}</button><a class="ib" href="${esc(src)}" download="foto-mambo.${ext}" aria-label="Descargar foto">${ic('download', 24)}</a></div><img src="${esc(src)}" alt="Foto" data-a="lbclose">`;
  document.body.appendChild(o);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') { lbCierra(); mxCierra(); adjCierra(); } });

// ───────── fotos y archivos ─────────
// No hay servicio de archivos gratis: la foto se reduce (≈ 300 KB) y viaja dentro del mensaje; los archivos, hasta 600 KB.
async function fotoLista(file) {
  const raw = await leeArchivo(file);
  let max = 1280, q = .72, img = await comprime(raw, max, q);
  while (img.length > 280000 && (q > .42 || max > 720)) { if (q > .42) q -= .08; else max = Math.round(max * .8); img = await comprime(raw, max, q); }
  if (img.length > 380000) throw new Error('La foto es demasiado pesada.');
  const i = await cargaImg(img); return { src: img, w: i.width, h: i.height };
}
async function archivoLista(file) {
  if (file.size > 600 * 1024) throw new Error('El archivo pesa ' + kbTxt(file.size) + '. El máximo es 600 KB (las fotos sí se reducen solas desde Galería).');
  return { u: await leeArchivo(file), nm: limpiaNombre(file.name), sz: file.size };
}
let adj = null;
function adjCierra() { const o = $('#adj'); if (o) o.remove(); adj = null; }
function adjAbre(d) {                                       // vista previa antes de enviar (con pie de foto)
  adjCierra(); adj = d;
  const pv = d.tp === 'i' ? `<img src="${esc(d.src)}" alt="Vista previa">` : `<span class="mfile"><span class="mfi">${ic('file', 24)}</span><span class="mfn"><b>${esc(d.nm)}</b><small>${kbTxt(d.sz)}</small></span></span>`;
  const o = document.createElement('div'); o.id = 'adj'; o.className = 'adj';
  o.innerHTML = `<div class="adb"><button class="ib" data-a="adclose" aria-label="Cancelar">${ic('close', 26)}</button><b>${d.tp === 'i' ? 'Enviar foto' : 'Enviar archivo'}</b></div><div class="adp">${pv}</div><div class="cmp wa"><div class="cbox"><textarea id="adt" rows="1" maxlength="300" placeholder="${d.tp === 'i' ? 'Añade un pie de foto…' : 'Añade un mensaje…'}" aria-label="Pie de foto"></textarea></div><button class="snd" data-a="adsend" aria-label="Enviar">${ic('send', 22)}</button></div>`;
  document.body.appendChild(o);
}
async function adjEnvia(btn) {
  if (!adj) return;
  const d = adj, t = $('#adt'), tx = (t ? t.value : '').trim(); btn.disabled = true; adjCierra();
  await enviar({ tp: d.tp, tx, src: d.src, w: d.w, h: d.h, u: d.u, nm: d.nm, sz: d.sz });
}
document.addEventListener('change', async e => {
  const id = e.target.id; if (id !== 'adg' && id !== 'adc' && id !== 'adf') return;
  const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    if (id === 'adf') adjAbre({ tp: 'd', ...await archivoLista(f) });
    else { if (!/^image\//.test(f.type)) throw new Error('Elige una imagen.'); adjAbre({ tp: 'i', ...await fotoLista(f) }); }
  } catch (er) { toast(er.message || 'No se pudo preparar el archivo.'); }
});

// ───────── previa de enlaces (la arma el worker de Cloudflare: /api/previa) ─────────
const PV = new Map(), pvCola = new Set();
function previaPide(u) {
  if (PV.has(u) || pvCola.has(u)) return;
  if (!/^https?:$/.test(location.protocol)) { PV.set(u, {}); return; }
  try { const c = sessionStorage.getItem('pv:' + u); if (c) { PV.set(u, JSON.parse(c)); return; } } catch (_) {}
  pvCola.add(u);
  const ac = new AbortController(), to = setTimeout(() => ac.abort(), 7000);
  fetch('/api/previa?u=' + encodeURIComponent(u), { signal: ac.signal }).then(r => r.ok ? r.json() : {}).catch(() => ({})).then(d => {
    clearTimeout(to); d = d && d.ok ? d : {}; PV.set(u, d); pvCola.delete(u);
    try { sessionStorage.setItem('pv:' + u, JSON.stringify(d)); } catch (_) {}
    const el = $('#msgs'); if (el) { waVuelca(el, waLista()); if (el._peg !== false) pega(el); }
  });
}
function previaHtml(m) {
  if (m.tp !== 't' || !m.tx || otro() === 'bot') return '';
  const u = urlDe(m.tx); if (!u || !urlOk(u)) return '';
  let host; try { host = new URL(u).hostname.replace(/^www\./, ''); } catch (_) { return ''; }
  if (PV.get(u) === undefined) previaPide(u);
  const p = PV.get(u) || {}, src = p.i && /^https:\/\//i.test(p.i) ? p.i : '';
  return `<span class="lkc"><a class="lka" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${src ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<span class="lkt"><b>${esc(p.t || host)}</b>${p.d ? `<small>${esc(p.d)}</small>` : ''}<em>${ic('link', 12)}${esc(host)}</em></span></a><button type="button" class="lkb" data-a="cplink" data-u="${esc(u)}">${ic('copy', 14)}Copiar enlace</button></span>`;
}

// ───────── acciones ─────────
MODS.push(async (a, t) => {
  switch (a) {
    case 'cpcode': copia(t.dataset.c || ''); return true;
    case 'cplink': copia(t.dataset.u || ''); return true;
    case 'vimg': lbAbre(t.getAttribute('src')); return true;
    case 'lbclose': lbCierra(); return true;
    case 'rpx': { if (waEdit) { const i = $('#cm'); if (i) { i.value = ''; i.style.height = ''; } } waEdit = null; waResp = null; barraPinta(); return true; }
    case 'qgo': {                                           // tocar la cita lleva al mensaje original
      const id = t.dataset.q, m = waLista().find(x => x.id === id || x.cl === id || x.ci === id), n = m && document.getElementById('mb' + m._id);
      if (!n) { toast('Ese mensaje es más antiguo.'); return true; }
      n.scrollIntoView({ block: 'center', behavior: 'smooth' }); n.classList.remove('flash'); void n.offsetWidth; n.classList.add('flash'); return true;
    }
    case 'mxopen': mxAbre(mxDe(t)); return true;
    case 'mxclose': mxCierra(); return true;
    case 'mxkeep': return true;
    case 'mxrx': { const m = mxSel; mxCierra(); if (m) await reacciona(m, t.dataset.k); return true; }
    case 'mxact': { const m = mxSel, k = t.dataset.k; if (!m) { mxCierra(); return true; } if (k === 'info') { mxInfo(m); return true; } mxCierra(); await mxHaz(k, m); return true; }
    case 'atach': { const p = $('#atp'); if (!p) return true; p.hidden = !p.hidden; if (!p.hidden) { const pn = $('#pan'); if (pn) pn.hidden = true; oc.open = false; pintaOpts(); } return true; }
    case 'adg': case 'adf': { const i = $('#' + a), p = $('#atp'); if (p) p.hidden = true; if (i) i.click(); return true; }
    case 'cam': { const i = $('#adc'); if (i) i.click(); return true; }
    case 'adsend': await adjEnvia(t); return true;
    case 'adclose': adjCierra(); return true;
    case 'fabdown': { const el = $('#msgs'); if (el) { el._peg = true; fabN = 0; pega(el); fabAct(el); } return true; }
  }
  return false;
});
