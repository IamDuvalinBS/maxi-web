// Amigos y chats privados (solo los dos miembros pueden leerlos)
let chats = [], unsub = null, msgs = [];
const perfs = {};
const EMO = '😀 😂 🥹 😍 😎 🤔 😭 😡 👍 👏 🙏 🔥 ❤️ 💀 🎉 🎮 ✨ 😴 🤝 😅'.split(' ');
const STK = '🐱 🐶 🦊 🐼 🐸 🦄 🐙 🦖 🍕 🎂 🚀 💎'.split(' ');
const TEMAS = {
  oscuro: ['#0f131c', '#22d3ee'], oceano: ['linear-gradient(160deg,#0c4a6e,#082f49)', '#38bdf8'],
  aurora: ['linear-gradient(160deg,#134e4a,#3b0764)', '#2dd4bf'], atardecer: ['linear-gradient(160deg,#7c2d12,#831843)', '#fb923c'],
  bosque: ['linear-gradient(160deg,#14532d,#052e16)', '#4ade80'], neon: ['linear-gradient(160deg,#1e1b4b,#4a044e)', '#e879f9'],
  sakura: ['linear-gradient(160deg,#831843,#4c0519)', '#f9a8d4']
};
function aplicarFondo() {
  const el = $('#msgs'); if (!el) return;
  const t = TEMAS[perfil && perfil.fondo] || TEMAS.oscuro;
  el.style.background = t[0]; el.style.setProperty('--mine', t[1]);
}
const cidOf = o => [user.uid, o].sort().join('_');
const avOf = (p, px) => `<span class="av" style="width:${px}px;height:${px}px;font-size:${px / 2.5}px">${p.avatar ? `<img src="${esc(p.avatar)}" alt="">` : esc((p.nombre || '?')[0].toUpperCase())}</span>`;
async function perfOf(uid) {
  if (!perfs[uid]) { try { const d = await db.collection('perfiles').doc(uid).get(); perfs[uid] = d.exists ? d.data() : { nombre: 'Usuario' }; } catch (e) { perfs[uid] = { nombre: 'Usuario' }; } }
  return perfs[uid];
}
async function loadChats() {
  if (!db || !user) return;
  try {
    const s = await db.collection('chats').where('miembros', 'array-contains', user.uid).get();
    chats = s.docs.map(d => d.data());
    for (const c of chats) { c.otro = c.miembros.find(u => u !== user.uid); await perfOf(c.otro); }
    const sec = c => (c.ultimo && c.ultimo.t && c.ultimo.t.seconds) || 0;
    chats.sort((x, y) => sec(y) - sec(x));
    render();
  } catch (e) { toast(errMsg(e)); }
}
function chatsView() {
  return `<section class="card"><div class="ti">💬 Chats</div><p class="mu">Para agregar a alguien, pídele su ID (lo ve en su perfil).</p><div class="cmp" style="margin-top:12px"><input id="fid" inputmode="numeric" placeholder="ID de tu amigo" aria-label="ID de tu amigo"><button class="snd" data-a="addfriend" aria-label="Agregar amigo">＋</button></div></section>` +
    (chats.length ? chats.map(c => { const p = perfs[c.otro] || {}; return `<a class="card chr" href="#chat/${esc(c.otro)}">${avOf(p, 48)}<div><b>${esc(p.nombre)}</b><small class="mu">${esc((c.ultimo && c.ultimo.tx) || 'Sin mensajes todavía')}</small></div></a>`; }).join('')
      : `<section class="card">${empty('💬', 'No tienes chats todavía. Agrega a un amigo con su ID.')}</section>`);
}
function chatView() {
  const p = perfs[location.hash.slice(6)];
  setTimeout(startChat, 0);
  return `<section class="card"><div class="chh"><a href="#chats" class="ib" aria-label="Volver">←</a>${avOf(p || {}, 40)}<b>${esc((p && p.nombre) || 'Chat')}</b><button class="ib" data-a="tema" aria-label="Cambiar fondo del chat" style="margin-left:auto">🎨</button></div><div id="tm" class="tm" hidden>${Object.keys(TEMAS).map(k => `<button class="tmb" data-a="fondo" data-k="${k}" aria-label="Fondo ${k}" style="background:${TEMAS[k][0]};border-color:${TEMAS[k][1]}"></button>`).join('')}</div><div id="msgs" class="msgs"></div><div id="pan" class="pan" hidden>${EMO.map(e => `<button data-a="emo" data-e="${e}">${e}</button>`).join('')}<hr>${STK.map(e => `<button class="stk" data-a="stk" data-e="${e}">${e}</button>`).join('')}</div><div class="cmp"><button class="ib" data-a="pan" aria-label="Emojis y stickers">😊</button><input id="cm" maxlength="500" placeholder="Escribe un mensaje" aria-label="Mensaje"><button class="snd" data-a="send" aria-label="Enviar">➤</button></div></section>`;
}
async function startChat() {
  const o = location.hash.slice(6); if (!db || !user || !o) return;
  if (unsub) unsub();
  unsub = db.collection('chats').doc(cidOf(o)).collection('msgs').orderBy('t').limitToLast(200).onSnapshot(s => { msgs = s.docs.map(d => d.data()); draw(); }, e => toast(errMsg(e)));
  draw();
}
function draw() {
  const el = $('#msgs'); if (!el) return;
  aplicarFondo();
  el.innerHTML = msgs.length ? msgs.map(m => {
    const h = m.t && m.t.toDate ? m.t.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '', me = m.de === user.uid ? ' me' : '';
    return `<div class="${m.tp === 's' ? 'stm' : 'bub'}${me}">${esc(m.tx)}<small>${h}</small></div>`;
  }).join('') : '<p class="mu" style="margin:auto">Di hola 👋</p>';
  el.scrollTop = el.scrollHeight;
}
async function enviar(tx, tp) {
  const o = location.hash.slice(6); if (!tx) return;
  const ref = db.collection('chats').doc(cidOf(o)), ts = firebase.firestore.FieldValue.serverTimestamp();
  try {
    await ref.collection('msgs').add({ de: user.uid, tx, tp, t: ts });
    await ref.set({ ultimo: { tx: tp === 's' ? 'Sticker ' + tx : tx, t: ts } }, { merge: true });
  } catch (e) { toast(errMsg(e)); }
}
MODS.push(async (a, t) => {
  if (a === 'tema') { $('#tm').hidden = !$('#tm').hidden; return true; }
  if (a === 'fondo') {
    const k = t.dataset.k; perfil = { ...perfil, fondo: k }; aplicarFondo();
    try { await db.collection('perfiles').doc(user.uid).set({ fondo: k }, { merge: true }); } catch (e) { toast(errMsg(e)); }
    return true;
  }
  if (a === 'pan') { $('#pan').hidden = !$('#pan').hidden; return true; }
  if (a === 'emo') { const i = $('#cm'); i.value += t.dataset.e; i.focus(); return true; }
  if (a === 'stk') { $('#pan').hidden = true; await enviar(t.dataset.e, 's'); return true; }
  if (a === 'send') { const i = $('#cm'), v = i.value.trim(); i.value = ''; await enviar(v, 't'); return true; }
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
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'cm') { e.preventDefault(); document.querySelector('[data-a=send]').click(); } });
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#chat/') && unsub) { unsub(); unsub = null; } });
