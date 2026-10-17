// Pases de los gachas: el bot publica el catálogo en Firestore (bot/pases) y aquí se muestra con su código.
// El código se reclama en WhatsApp con  .pase CÓDIGO  (una vez por persona).
let pasesCat = null, pasesT = 0, pasesCargando = false;

async function cargaPases() {
  if (pasesCargando || !db || Date.now() - pasesT < 60000) return;
  pasesCargando = true;
  try { const d = await db.collection('bot').doc('pases').get(); pasesCat = d.exists ? (d.data().lista || []) : []; }
  catch (e) { pasesCat = pasesCat || []; }
  pasesCargando = false; pasesT = Date.now(); renderSoon();
}

function pasesView() {
  if (!user) return gate('Entra con Google para ver los pases y sus códigos de canje.');
  setTimeout(cargaPases, 0);
  const hd = `<div class="ti">${ic('trophy', 24)}<span>Pases</span></div>`;
  if (pasesCat === null) return hd + `<section class="card">${empty('trophy', 'Cargando pases…')}</section>`;
  if (!pasesCat.length) return hd + `<section class="card">${empty('trophy', 'No hay pases disponibles todavía. Espera a las próximas actualizaciones.')}</section>`;
  const hechos = (typeof waPerfil !== 'undefined' && waPerfil && Array.isArray(waPerfil.pases)) ? waPerfil.pases : [];
  const nota = (typeof waLink !== 'undefined' && waLink) ? '' : '<p class="mu">Vincula tu WhatsApp en Mi perfil para ver aquí cuáles pases ya reclamaste.</p>';
  return hd + `<p class="mu">Copia el código y envíaselo al bot por WhatsApp. Cada pase se reclama una sola vez.</p>${nota}` + pasesCat.map(p => {
    const listo = hechos.includes(p.id);
    return `<section class="card"><div class="ti sm"><span style="font-size:1.5rem;line-height:1">${esc(p.e)}</span><span>${esc(p.n)}</span>${listo ? '<span class="bst on"><i></i>Reclamado</span>' : ''}</div>
      <p class="mu">${esc(p.d)}</p>
      <div class="sr"><div>TICKETS<b>${esc(p.t)}</b></div><div>GACHA<b style="font-size:.95rem;line-height:1.9">${esc(p.g)}</b></div></div>
      ${listo ? '' : `<div class="wacode"><b>${esc(p.c)}</b><button class="btn sm sec" data-a="pasecopy" data-c="${esc(p.c)}">Copiar</button></div><p>Envíale al bot por WhatsApp: <b>.pase ${esc(p.c)}</b></p>`}</section>`;
  }).join('');
}

MODS.push(async (a, t) => {
  if (a !== 'pasecopy') return false;
  try { await navigator.clipboard.writeText('.pase ' + t.dataset.c); toast('Copiado'); }
  catch (_) { toast('Copia el código a mano'); }
  return true;
});
