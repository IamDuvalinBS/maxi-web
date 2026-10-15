// Destacadas (solo owners publican) y lista de owners (verificados)
let posts = [], owner = false, ownersL = [], ownerUids = new Set(), pf = null;
const vf = () => '<img class="vf" src="img/verificado.png" alt="Verificado" title="Verificado">';
async function checkOwner() { try { owner = (await db.collection('owners').doc(user.uid).get()).exists; } catch (e) { owner = false; } }

// Todos los owners con su foto de perfil (se muestran en Inicio)
async function loadOwners() {
  try {
    const s = await db.collection('owners').get();
    ownerUids = new Set(s.docs.map(d => d.id));
    ownersL = await Promise.all([...ownerUids].map(async id => {
      if (user && id === user.uid) return { uid: id, nombre: nombre(), avatar: foto() };
      const p = await perfOf(id); return { uid: id, ...p };
    }));
    renderSoon();
  } catch (e) {
    if (owner && user) { ownerUids = new Set([user.uid]); ownersL = [{ uid: user.uid, nombre: nombre(), avatar: foto() }]; }
  }
}
const esOwner = uid => ownerUids.has(uid);

async function loadPosts() {
  if (!db) return;
  try { await leeRapido(db.collection('posts').orderBy('t', 'desc').limit(15), s => { posts = s.docs.map(d => ({ id: d.id, ...d.data() })); renderSoon(); }); }
  catch (e) { toast(errMsg(e)); }
}

const toolBtn = (a, i, tx, id) => `<button class="tb2" data-a="${a}" data-id="${esc(id)}" aria-label="${tx}" title="${tx}">${ic(i, 18)}</button>`;
function postHtml(p) {
  const larga = (p.texto || '').length > 140 || (p.texto || '').split('\n').length > 3;
  const b = p.btn && urlOk(p.btn.u) ? `<a class="btn dl" href="${esc(p.btn.u)}" target="_blank" rel="noopener noreferrer">${ic('download', 18)}${esc(p.btn.t || 'Abrir enlace')}</a>` : '';
  return `<article class="dest${p.pin ? ' fix' : ''}">${p.pin ? `<div class="fijado">${ic('pin', 15)}Fijado</div>` : ''}
    ${p.img && imgOk(p.img) ? `<img class="dimg" src="${esc(p.img)}" alt="" loading="lazy" decoding="async">` : ''}
    <div class="dbody">${p.titulo ? `<h3>${esc(p.titulo)}</h3>` : ''}
      <div class="dmeta">${perfLink(p.uid, `<span class="dav">${inicial(p.autor)}</span><span>${esc(p.autor)}</span>`)}${vf()}<time>${fechaDe(p.t)}</time></div>
      ${p.texto ? `<p class="dtx${larga ? ' clamp' : ''}">${esc(p.texto)}</p>` : ''}
      <div class="row">${larga ? `<button class="btn sec sm" data-a="dmas">Ver más</button>` : ''}${b}</div>
      ${owner ? `<div class="dtools">${toolBtn('pin', 'pin', p.pin ? 'Quitar de arriba' : 'Fijar arriba', p.id)}${toolBtn('edit', 'edit', 'Editar', p.id)}${toolBtn('del', 'trash', 'Eliminar', p.id)}</div>` : ''}
    </div></article>`;
}
const formPost = () => `<section class="card pform"><div class="ti sm">${ic(pf.id ? 'edit' : 'plus', 20)}<span>${pf.id ? 'Editar publicación' : 'Nueva publicación'}</span></div>
  <label class="fl2" for="pt">Título</label><input class="fi" id="pt" maxlength="90" value="${esc(pf.titulo)}" placeholder="Título de la publicación">
  <label class="fl2" for="px">Texto</label><textarea class="fi" id="px" maxlength="2000" rows="5" placeholder="Escribe aquí…">${esc(pf.texto)}</textarea>
  <div id="pimg" class="pimg">${pf.img ? `<img src="${esc(pf.img)}" alt="Vista previa">` : ''}</div>
  <div class="row"><label class="btn sec sm" for="pfi">${ic('image', 16)}${pf.img ? 'Cambiar imagen' : 'Agregar imagen'}</label><input id="pfi" type="file" accept="image/*" hidden>${pf.img ? `<button class="btn sec sm" data-a="pquitaimg">Quitar imagen</button>` : ''}</div>
  <label class="fl2" for="pbl">Botón con enlace (opcional)</label>
  <div class="g2s"><input class="fi" id="pbl" maxlength="30" value="${esc(pf.bt)}" placeholder="Texto, ej. Descargar APK"><input class="fi" id="pbu" maxlength="500" inputmode="url" value="${esc(pf.bu)}" placeholder="https://…"></div>
  <label class="chk"><input type="checkbox" id="ppin" ${pf.pin ? 'checked' : ''}><span>Fijar arriba</span></label>
  <div class="row"><button class="btn" data-a="psave">${pf.id ? 'Guardar cambios' : 'Publicar'}</button><button class="btn sec" data-a="pcancel">Cancelar</button></div></section>`;
function postsView() {
  const ord = [...posts.filter(p => p.pin), ...posts.filter(p => !p.pin)];
  return `<div class="ti">${ic('star', 24, 'yl')}<span>Destacadas</span>${owner && !pf ? `<button class="btn sm" data-a="pnew">${ic('plus', 16)}Publicar</button>` : ''}</div>` +
    (owner && pf ? formPost() : '') +
    (ord.length ? ord.map(postHtml).join('') : `<section class="card">${empty('starline', 'No hay publicaciones destacadas todavía.')}</section>`);
}
function syncPf() {
  if (!pf || !$('#pt')) return;
  pf.titulo = $('#pt').value; pf.texto = $('#px').value; pf.bt = $('#pbl').value; pf.bu = $('#pbu').value; pf.pin = $('#ppin').checked;
}
document.addEventListener('change', async e => {
  if (e.target.id !== 'pfi' || !e.target.files[0]) return;
  try {
    const raw = await leeArchivo(e.target.files[0]); let q = .72, img = await comprime(raw, 900, q);
    while (img.length > 450000 && q > .4) { q -= .08; img = await comprime(raw, 800, q); }
    syncPf(); pf.img = img; render(); const f = $('.pform'); if (f) f.scrollIntoView({ block: 'center' });
  } catch (er) { toast(er.message); }
});
MODS.push(async (a, t) => {
  const p = posts.find(x => x.id === t.dataset.id), P = db && db.collection('posts');
  try {
    if (a === 'pnew') { pf = { titulo: '', texto: '', img: null, bt: '', bu: '', pin: false }; render(); const f = $('.pform'); if (f) f.scrollIntoView({ block: 'center' }); }
    else if (a === 'pcancel') { pf = null; render(); }
    else if (a === 'pquitaimg') { syncPf(); pf.img = null; render(); }
    else if (a === 'psave') {
      syncPf(); const titulo = pf.titulo.trim(), texto = pf.texto.trim(), bt = pf.bt.trim(), bu = pf.bu.trim();
      if (!titulo) { toast('Escribe un título.'); return true; }
      if (!texto && !pf.img) { toast('Agrega un texto o una imagen.'); return true; }
      if (bu && !urlOk(bu)) { toast('El enlace debe empezar con http:// o https://'); return true; }
      const data = { titulo, texto, img: pf.img || null, btn: bu ? { t: bt || 'Abrir enlace', u: bu } : null, pin: pf.pin };
      if (pf.id) await P.doc(pf.id).update(data);
      else await P.add({ ...data, autor: nombre(), uid: user.uid, t: firebase.firestore.FieldValue.serverTimestamp() });
      toast(pf.id ? 'Cambios guardados' : 'Publicado'); pf = null; await loadPosts();
    }
    else if (a === 'dmas') { const c = t.closest('.dest'); c.classList.toggle('open'); t.textContent = c.classList.contains('open') ? 'Ver menos' : 'Ver más'; }
    else if (a === 'pin' && p) { await P.doc(p.id).update({ pin: !p.pin }); await loadPosts(); }
    else if (a === 'edit' && p) { pf = { id: p.id, titulo: p.titulo || '', texto: p.texto || '', img: p.img || null, bt: (p.btn && p.btn.t) || '', bu: (p.btn && p.btn.u) || '', pin: !!p.pin }; render(); const f = $('.pform'); if (f) f.scrollIntoView({ block: 'center' }); }
    else if (a === 'del' && p) { if (confirm('¿Eliminar esta publicación?')) { await P.doc(p.id).delete(); toast('Eliminado'); await loadPosts(); } }
    else if (a === 'addowner') {
      const q = await db.collection('perfiles').where('idn', '==', ($('#oid').value || '').trim()).limit(1).get();
      if (q.empty) { toast('No existe ese ID.'); return true; }
      await db.collection('owners').doc(q.docs[0].id).set({ por: user.uid }); toast('Owner agregado'); await loadOwners(); render();
    } else return false;
  } catch (e) { toast(errMsg(e)); }
  return true;
});
