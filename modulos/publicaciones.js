// Publicaciones y owners (verificados)
let posts = [], owner = false;
const vf = () => '<img class="vf" src="img/verificado.png" alt="Verificado" title="Verificado">';
async function checkOwner() { try { owner = (await db.collection('owners').doc(user.uid).get()).exists; } catch (e) { owner = false; } }
async function loadPosts() {
  if (!db) return;
  try { const s = await db.collection('posts').orderBy('t', 'desc').limit(40).get(); posts = s.docs.map(d => ({ id: d.id, ...d.data() })); render(); }
  catch (e) { toast(errMsg(e)); }
}
const postHtml = p => `<article class="card"><b>${esc(p.autor)}</b> ${vf()}${p.pin ? ' 📌' : ''}<p style="white-space:pre-wrap;margin-top:6px">${esc(p.texto)}</p>${owner ? `<div class="row"><button class="btn sec" data-a="pin" data-id="${esc(p.id)}">${p.pin ? 'Quitar de arriba' : 'Fijar arriba'}</button><button class="btn sec" data-a="edit" data-id="${esc(p.id)}">Editar</button><button class="btn sec" data-a="del" data-id="${esc(p.id)}">Eliminar</button></div>` : ''}</article>`;
function postsView() {
  const pins = posts.filter(p => p.pin), rest = posts.filter(p => !p.pin);
  return `<section class="card"><div class="ti">⭐ Destacadas</div>${pins.length ? '' : empty('☆', 'No hay publicaciones destacadas todavía.')}</section>` + pins.map(postHtml).join('') +
    (owner ? `<section class="card cmp"><input id="msg" maxlength="500" placeholder="Escribe una publicación" aria-label="Nueva publicación"><button class="snd" data-a="post" aria-label="Publicar">➤</button></section>` : '') +
    rest.map(postHtml).join('');
}
MODS.push(async (a, t) => {
  const p = posts.find(x => x.id === t.dataset.id), P = db && db.collection('posts');
  try {
    if (a === 'post') {
      const v = ($('#msg').value || '').trim(); if (!v) { toast('Escribe algo para publicar.'); return true; }
      await P.add({ texto: v, autor: nombre(), uid: user.uid, pin: false, t: firebase.firestore.FieldValue.serverTimestamp() }); toast('Publicado'); await loadPosts();
    } else if (a === 'pin' && p) { await P.doc(p.id).update({ pin: !p.pin }); await loadPosts(); }
    else if (a === 'edit' && p) { const v = prompt('Editar publicación', p.texto); if (v && v.trim()) { await P.doc(p.id).update({ texto: v.trim() }); toast('Cambios guardados'); await loadPosts(); } }
    else if (a === 'del' && p) { if (confirm('¿Eliminar esta publicación?')) { await P.doc(p.id).delete(); toast('Eliminado'); await loadPosts(); } }
    else if (a === 'addowner') {
      const q = await db.collection('perfiles').where('idn', '==', ($('#oid').value || '').trim()).limit(1).get();
      if (q.empty) { toast('No existe ese ID.'); return true; }
      await db.collection('owners').doc(q.docs[0].id).set({ por: user.uid }); toast('Owner agregado');
    } else return false;
  } catch (e) { toast(errMsg(e)); }
  return true;
});
        
