// Juegos con progreso guardado en la cuenta
let J = { id: null, stop: null };
function colorRush(a, fin) {
  const N = [['ROJO', '#ff3355'], ['AZUL', '#3388ff'], ['VERDE', '#28d17c'], ['AMARILLO', '#ffd633'], ['MORADO', '#a66cff'], ['CIAN', '#20e0d0']];
  let score = 0, streak = 0, correct = 0, level = 1, time = 6, ans = '', run = true, tm = null, last = Date.now();
  const mx = () => Math.max(3.5, 6.5 - (level - 1) * .35), bo = () => Math.max(.3, .9 - (level - 1) * .08),
    pe = () => Math.min(3.5, 2 + (level - 1) * .25), dr = () => Math.min(2, 1 + (level - 1) * .1);
  a.innerHTML = `<div class="hud"><div>Puntos<b id="s">0</b></div><div>Racha<b id="r">0</b></div><div>Nivel<b id="l">1</b></div><div>Tiempo<b id="t">6.0</b></div></div><div class="jbar"><div id="bar"></div></div><div class="tg">Toca el color:<div id="tg" class="bgt">ROJO</div></div><div id="gr" class="gr"></div><p id="jm" class="mu" style="text-align:center;margin-top:12px">Cada 5 aciertos subes de nivel y el tiempo corre más rápido.</p>`;
  const msg = t => { $('#jm').textContent = t; };
  const draw = () => { const t = Math.max(0, time); $('#t').textContent = t.toFixed(1); $('#t').style.color = t < 2 ? '#ff3355' : ''; $('#bar').style.transform = `scaleX(${Math.min(1, t / mx())})`; };
  const hud = () => { $('#s').textContent = score; $('#r').textContent = streak; $('#l').textContent = level; };
  const rnd = () => {
    const arr = N.slice().sort(() => Math.random() - .5).slice(0, 4), p = arr[Math.floor(Math.random() * 4)];
    ans = p[0]; $('#tg').textContent = ans; $('#tg').style.color = p[1];
    $('#gr').innerHTML = arr.map(c => `<button class="cb" data-n="${c[0]}" style="background:${c[1]}">${c[0]}</button>`).join('');
  };
  const end = () => { run = false; clearTimeout(tm); draw(); fin(score, `Nivel alcanzado: ${level}<br>Aciertos: ${correct}`); };
  const tick = () => {
    if (!run) return;
    const n = Date.now(), dt = Math.min(.5, (n - last) / 1000); last = n; time -= dt * dr(); draw();
    if (time <= 0) return end(); tm = setTimeout(tick, 100);
  };
  $('#gr').addEventListener('pointerdown', e => {
    const b = e.target.closest('[data-n]'); if (!b || !run) return; e.preventDefault();
    if (b.dataset.n === ans) {
      score += 10 + streak * 2 + (level - 1) * 2; streak++; correct++;
      const nl = 1 + Math.floor(correct / 5);
      if (nl > level) { level = nl; msg('🔥 ¡Nivel ' + level + '! El tiempo corre más rápido'); } else msg('⚡ ¡Correcto!');
      time = Math.min(mx(), time + bo());
    } else { streak = 0; time = Math.max(0, time - pe()); msg('❌ Fallaste (-' + pe().toFixed(1) + 's)'); }
    hud(); draw(); if (time <= 0) return end(); rnd();
  });
  rnd(); draw(); tick();
  return () => { run = false; clearTimeout(tm); };
}
function simon(a, fin) {
  const C = ['#ff3355', '#3388ff', '#28d17c', '#ffd633']; let seq = [], i = 0, ok = false, dead = false; const tms = [];
  a.innerHTML = `<div class="hud"><div>Ronda<b id="s">0</b></div></div><p id="jm" class="mu" style="text-align:center;margin-bottom:12px">Mira la secuencia…</p><div class="gr">${C.map((c, k) => `<button class="cb pd" data-k="${k}" style="background:${c};color:${c}"></button>`).join('')}</div>`;
  const pads = a.querySelectorAll('.pd'), W = (f, ms) => tms.push(setTimeout(f, ms));
  const lit = k => { pads[k].classList.add('on'); W(() => pads[k].classList.remove('on'), 300); };
  const play = () => {
    ok = false; i = 0; $('#jm').textContent = 'Mira la secuencia…'; seq.push(Math.floor(Math.random() * 4));
    seq.forEach((k, n) => W(() => lit(k), 600 + n * 600));
    W(() => { ok = true; $('#jm').textContent = 'Tu turno'; }, 600 + seq.length * 600);
  };
  a.addEventListener('pointerdown', e => {
    const b = e.target.closest('[data-k]'); if (!b || !ok || dead) return; e.preventDefault();
    const k = +b.dataset.k; lit(k);
    if (k !== seq[i]) { dead = true; return fin(seq.length - 1, 'Secuencia más larga: ' + (seq.length - 1)); }
    if (++i === seq.length) { $('#s').textContent = seq.length; ok = false; W(play, 700); }
  });
  play();
  return () => { dead = true; tms.forEach(clearTimeout); };
}
function tapVeloz(a, fin) {
  let n = 0, started = false, end0 = 0, tm = null;
  a.innerHTML = `<div class="hud"><div>Toques<b id="s">0</b></div><div>Tiempo<b id="t">10.0</b></div></div><button id="tb" class="tb">¡TOCA!</button><p class="mu" style="text-align:center;margin-top:12px">El tiempo empieza con tu primer toque.</p>`;
  const tick = () => {
    const t = Math.max(0, (end0 - Date.now()) / 1000); $('#t').textContent = t.toFixed(1);
    if (t <= 0) return fin(n, (n / 10).toFixed(1) + ' toques por segundo'); tm = setTimeout(tick, 50);
  };
  $('#tb').addEventListener('pointerdown', e => {
    e.preventDefault();
    if (!started) { started = true; end0 = Date.now() + 10000; tick(); }
    if (Date.now() < end0) { n++; $('#s').textContent = n; }
  });
  return () => clearTimeout(tm);
}
const JG = {
  colorrush: { n: 'Color Rush', ic: '🎨', d: 'Toca el color correcto antes de que se acabe el tiempo.', f: colorRush },
  simon: { n: 'Simón', ic: '🧠', d: 'Memoriza y repite la secuencia de colores.', f: simon },
  tap: { n: 'Tap Veloz', ic: '⚡', d: 'Toca lo más rápido que puedas en 10 segundos.', f: tapVeloz }
};
const miJuego = k => ((perfil && perfil.juegos) || {})[k] || {};
function juegosView() {
  return `<section class="card"><div class="ti">🎮 Juegos</div><p class="mu">Tu mejor puntaje se guarda en tu cuenta.</p></section>` +
    Object.keys(JG).map(k => { const g = JG[k], s = miJuego(k); return `<a class="card chr" href="#juego/${k}"><span style="font-size:2rem">${g.ic}</span><div><b>${g.n}</b><small class="mu">${g.d}</small><small>Mejor: <b>${s.mejor || 0}</b> · Partidas: ${s.partidas || 0}</small></div></a>`; }).join('');
}
function juegoView() {
  const k = location.hash.slice(7), g = JG[k];
  if (!g) return `<section class="card">${empty('🎮', 'Ese juego no existe.')}</section>`;
  setTimeout(startJuego, 0);
  return `<section class="card gamefull" id="jg"><div class="chh"><a href="#juegos" class="ib" aria-label="Volver">←</a><b>${g.ic} ${g.n}</b><span class="mu" style="margin-left:auto">Mejor: <b id="jb">${miJuego(k).mejor || 0}</b></span></div><div id="ja" class="ja"></div><div id="jo" class="jo" hidden><div class="card"><h2 id="jt"></h2><p id="jx"></p><button class="btn" data-a="jrep">▶ Jugar de nuevo</button> <a class="btn sec" href="#juegos">Salir</a></div></div></section>`;
}
function stopJuego() { if (J.stop) J.stop(); J.stop = null; window.JUEGO_ACTIVO = null; }
function startJuego() {
  const id = location.hash.slice(7), g = JG[id], a = $('#ja'); if (!g || !a) return;
  stopJuego(); J.id = id; window.JUEGO_ACTIVO = location.hash; $('#jo').hidden = true;
  J.stop = g.f(a, terminar);
}
async function terminar(score, extra) {
  const id = J.id, prev = miJuego(id).mejor || 0, rec = score > prev;
  $('#jt').textContent = rec ? '🏆 ¡Nuevo récord!' : '🏁 Fin';
  $('#jx').innerHTML = `Puntos: <b>${score}</b><br>${extra}<br>Mejor: <b>${Math.max(prev, score)}</b>`;
  $('#jo').hidden = false;
  const j = { ...(perfil && perfil.juegos) }, p = j[id] || {};
  j[id] = { mejor: Math.max(p.mejor || 0, score), partidas: (p.partidas || 0) + 1 };
  perfil = { ...perfil, juegos: j };
  const jb = $('#jb'); if (jb) jb.textContent = j[id].mejor;
  try { await db.collection('perfiles').doc(user.uid).set({ juegos: { [id]: j[id] } }, { merge: true }); } catch (e) { toast(errMsg(e)); }
}
MODS.push(async a => { if (a === 'jrep') { startJuego(); return true; } return false; });
window.addEventListener('hashchange', stopJuego);
