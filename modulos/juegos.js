// Juegos con progreso guardado en la cuenta (usa modulos/juegos-bot.js)
let J = { id: null, stop: null, frame: null }, SND = true, AC = null;
try { SND = localStorage.getItem('mp_snd') !== '0'; } catch (_) {}
function tono(f, d, tipo, v) {
  if (!SND) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = tipo || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(v || .08, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
    o.connect(g); g.connect(AC.destination); o.start(); o.stop(t + d);
  } catch (e) {}
}
function cargaBot(id) {
  return new Promise((ok, mal) => {
    if (window.BOT && window.BOT[id]) return ok();
    const s = document.createElement('script'); s.src = `modulos/juegos/${id}.js?v=15`;
    s.onload = () => (window.BOT && window.BOT[id]) ? ok() : mal(new Error(`El archivo modulos/juegos/${id}.js cargó pero está vacío o dañado. Vuelve a subirlo.`));
    s.onerror = () => mal(new Error(`No se encontró modulos/juegos/${id}.js. Súbelo dentro de la carpeta modulos/juegos.`));
    document.head.appendChild(s);
  });
}
function botGame(id) {
  return a => {
    let vivo = true, f = null, on = null;
    a.innerHTML = '<p class="msg" style="margin-top:30vh">Cargando juego…</p>';
    cargaBot(id).then(() => {
      if (!vivo) return;
      f = document.createElement('iframe');
      f.className = 'gf'; f.title = JG[id].n; f.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      f.srcdoc = window.BOT[id].replace('<head>', `<head><script>window.__BEST=${miJuego(id).mejor || 0};<\/script>`);
      a.innerHTML = ''; a.appendChild(f); J.frame = f;
      on = e => { if (e.source === f.contentWindow && e.data && e.data.mp) guardar(id, +e.data.best || 0, false); };
      window.addEventListener('message', on);
    }).catch(e => { if (vivo) a.innerHTML = `<div class="card" style="margin:16px"><h2>No se pudo abrir el juego</h2><p class="mu">${esc(e.message)}</p></div>`; });
    return () => { vivo = false; if (on) window.removeEventListener('message', on); if (f) f.remove(); J.frame = null; };
  };
}
function simon(a, fin) {
  const C = ['#ff3355', '#3388ff', '#28d17c', '#ffd633'], F = [392, 523, 330, 262]; let seq = [], i = 0, ok = false, dead = false; const tms = [];
  a.innerHTML = `<div class="pn" style="--gc:#a66cff"><div class="br">Mambo Bot · Memory Lab</div><div class="tt">🧠 SIMÓN</div><div class="hud"><div>Ronda<b id="s">0</b></div><div>Mejor<b>${miJuego('simon').mejor || 0}</b></div></div><p id="jm" class="msg">Mira la secuencia…</p><div class="gr">${C.map((c, k) => `<button class="cb pd" data-k="${k}" style="--c:${c}" aria-label="Color ${k + 1}"></button>`).join('')}</div></div>`;
  const pads = a.querySelectorAll('.pd'), W = (f, ms) => tms.push(setTimeout(f, ms));
  const lit = k => { pads[k].classList.add('on'); tono(F[k], .28, 'triangle'); W(() => pads[k].classList.remove('on'), 300); };
  const play = () => {
    ok = false; i = 0; $('#jm').textContent = 'Mira la secuencia…'; seq.push(Math.floor(Math.random() * 4));
    seq.forEach((k, n) => W(() => lit(k), 600 + n * 600));
    W(() => { ok = true; $('#jm').textContent = 'Tu turno'; }, 600 + seq.length * 600);
  };
  a.addEventListener('pointerdown', e => {
    const b = e.target.closest('[data-k]'); if (!b || !ok || dead) return; e.preventDefault();
    const k = +b.dataset.k; lit(k);
    if (k !== seq[i]) { dead = true; tono(110, .6, 'sawtooth', .1); return fin(seq.length - 1, 'Secuencia más larga: ' + (seq.length - 1)); }
    if (++i === seq.length) { $('#s').textContent = seq.length; ok = false; W(() => tono(660, .15), 250); W(play, 800); }
  });
  play();
  return () => { dead = true; tms.forEach(clearTimeout); };
}
function tapVeloz(a, fin) {
  let n = 0, started = false, end0 = 0, tm = null, raf = 0;
  a.innerHTML = `<div class="pn" style="--gc:#ff9f43"><div class="br">Mambo Bot · Speed Lab</div><div class="tt">⚡ TAP VELOZ</div><div class="hud"><div>Toques<b id="s">0</b></div><div>Tiempo<b id="t">10.0</b></div><div>Mejor<b>${miJuego('tap').mejor || 0}</b></div></div><div class="jbar"><div id="bar"></div></div><div id="tb" class="tbc"><span>TOCA</span></div><p class="msg">El tiempo empieza con tu primer toque.</p></div>`;
  const paint = () => { raf = 0; $('#s').textContent = n; };
  const tick = () => {
    const t = Math.max(0, (end0 - Date.now()) / 1000); $('#t').textContent = t.toFixed(1); $('#bar').style.transform = `scaleX(${t / 10})`;
    if (t <= 0) { paint(); tono(880, .3, 'triangle'); return fin(n, (n / 10).toFixed(1) + ' toques por segundo'); }
    tm = setTimeout(tick, 50);
  };
  $('#tb').addEventListener('pointerdown', e => {
    e.preventDefault();
    if (!started) { started = true; end0 = Date.now() + 10000; tick(); }
    if (Date.now() < end0) { n++; tono(300 + Math.min(n, 60) * 12, .05, 'square', .04); if (!raf) raf = requestAnimationFrame(paint); }
  });
  return () => { clearTimeout(tm); cancelAnimationFrame(raf); };
}
const JG = {
  colorrush: { n: 'Color Rush', ic: '🎨', d: 'Toca el color correcto antes de que se acabe el tiempo.', f: botGame('colorrush'), bot: 1 },
  dino: { n: 'Dino', ic: '🦖', d: 'Salta los cactus y esquiva los pájaros.', f: botGame('dino'), bot: 1 },
  snake: { n: 'Snake Fruits', ic: '🐍', d: 'Come frutas y crece sin chocar. Varios modos.', f: botGame('snake'), bot: 1 },
  gusanos: { n: 'Gusanos Neón', ic: '🐛', d: 'Come puntos, crece y haz que los demás choquen contigo.', f: botGame('gusanos'), bot: 1 },
  minigolf: { n: 'Mini Golf', ic: '⛳', d: '18 hoyos: mete la bola con los menos golpes posibles (el récord es el menor).', f: botGame('minigolf'), bot: 1, menor: 1 },
  pou: { n: 'Pou Penales', ic: '⚽', d: 'Patea penales, suma puntos y cuida tus vidas.', f: botGame('pou'), bot: 1 },
  dodge: { n: 'Neon Dodge', ic: '🚀', d: 'Esquiva meteoros de neón y junta orbes.', f: botGame('dodge'), bot: 1 },
  simon: { n: 'Simón', ic: '🧠', d: 'Memoriza y repite la secuencia de colores.', f: simon },
  tap: { n: 'Tap Veloz', ic: '⚡', d: 'Toca lo más rápido que puedas en 10 segundos.', f: tapVeloz }
};
const miJuego = k => ((perfil && perfil.juegos) || {})[k] || {};
function juegosView() {
  return `<section class="card"><div class="ti">🎮 Juegos</div><p class="mu">Tu mejor puntaje se guarda en tu cuenta.</p></section>` +
    Object.keys(JG).map(k => { const g = JG[k], s = miJuego(k); return `<a class="card chr" href="#juego/${k}"><span style="font-size:2rem">${g.ic}</span><div><b>${g.n}</b><small class="mu">${g.d}</small><small>Mejor: <b>${s.mejor || 0}</b>${s.partidas ? ' · Partidas: ' + s.partidas : ''}</small></div></a>`; }).join('');
}
function juegoView() {
  const k = location.hash.slice(7), g = JG[k];
  if (!g) return `<section class="card">${empty('🎮', 'Ese juego no existe.')}</section>`;
  setTimeout(startJuego, 0);
  return `<section class="card gamefull" id="jg"><div class="chh"><a href="#juegos" class="ib" aria-label="Volver">←</a><b>${g.ic} ${g.n}</b><span class="mu" style="margin-left:auto">Mejor: <b id="jb">${miJuego(k).mejor || 0}</b></span>${g.bot ? '' : `<button class="ib" data-a="snd" id="sb" aria-label="Sonido">${SND ? '🔊' : '🔇'}</button>`}</div><div id="ja" class="ja${g.bot ? ' gfw' : ''}"></div><div id="jo" class="jo" hidden><div class="card"><h2 id="jt"></h2><p id="jx"></p><button class="btn" data-a="jrep">▶ Jugar de nuevo</button> <a class="btn sec" href="#juegos">Salir</a></div></div></section>`;
}
function stopJuego() { if (J.stop) J.stop(); J.stop = null; window.JUEGO_ACTIVO = null; }
function startJuego() {
  const id = location.hash.slice(7), g = JG[id], a = $('#ja'); if (!g || !a) return;
  stopJuego(); J.id = id; window.JUEGO_ACTIVO = location.hash; $('#jo').hidden = true;
  try {
    J.stop = g.f(a, terminar);
  } catch (e) { a.innerHTML = `<div class="card" style="margin:16px"><h2>No se pudo abrir el juego</h2><p class="mu">${esc(e.message)}</p></div>`; }
}
async function guardar(id, score, sumar) {
  const j = { ...(perfil && perfil.juegos) }, p = j[id] || {};
  const menor = JG[id] && JG[id].menor, ant = p.mejor || 0;
  if (!sumar && ant && (menor ? score >= ant : score <= ant)) return;
  j[id] = { mejor: menor ? (ant ? Math.min(ant, score) : score) : Math.max(ant, score), partidas: (p.partidas || 0) + (sumar ? 1 : 0) };
  perfil = { ...perfil, juegos: j };
  const jb = $('#jb'); if (jb) jb.textContent = j[id].mejor;
  try { await db.collection('perfiles').doc(user.uid).set({ juegos: { [id]: j[id] } }, { merge: true }); } catch (e) { toast(errMsg(e)); }
}
function terminar(score, extra) {
  const prev = miJuego(J.id).mejor || 0;
  $('#jt').textContent = score > prev ? '🏆 ¡Nuevo récord!' : '🏁 Fin';
  $('#jx').innerHTML = `Puntos: <b>${score}</b><br>${extra}<br>Mejor: <b>${Math.max(prev, score)}</b>`;
  $('#jo').hidden = false; guardar(J.id, score, true);
}
MODS.push(async a => {
  if (a === 'jrep') { startJuego(); return true; }
  if (a === 'snd') {
    SND = !SND; try { localStorage.setItem('mp_snd', SND ? '1' : '0'); } catch (_) {}
    const sb = $('#sb'); if (sb) sb.textContent = SND ? '🔊' : '🔇';
    return true;
  }
  return false;
});
window.addEventListener('hashchange', stopJuego);
                       
