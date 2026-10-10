// Anuncios solo cuando el usuario los pide (Adsterra). Cada anuncio completo suma 1 en la cuenta.
const ADS = { src: 'https://afders.org/1/b41c3433668ea656bd302ab677eb0a46', link: 'https://asiafilm.org/4/746c263a78c3d8905dbd8eb2d3143b16', espera: 8 };
let adBusy = false;
const anunciosView = () => { adBusy = false; return `<section class="card"><div class="ti">📺 Ver anuncios</div><p class="mu">Cada anuncio completo suma 1 y desbloquea banners. Llevas <b id="adn">${stats().ads}</b>.</p><button class="btn" id="adb" data-a="ad">▶ Ver anuncio</button><div id="adf"></div></section>`; };
function adReset(msg) {
  adBusy = false; const b = $('#adb'), f = $('#adf');
  if (f) f.innerHTML = '';
  if (b) { b.disabled = false; b.textContent = '▶ Ver anuncio'; }
  if (msg) toast(msg);
}
function adEspera() {
  let s = ADS.espera;
  const t = setInterval(() => {
    const b = $('#adb'); if (!b) return clearInterval(t);
    s--; b.textContent = 'Espera ' + s + ' s…';
    if (s <= 0) {
      clearInterval(t); const st = stats(); st.ads++; gStats();
      const n = $('#adn'); if (n) n.textContent = st.ads;
      adReset(); if ([10, 20].includes(st.ads)) { toast('🎁 ¡Misión completada! Reclama tu banner en esta pantalla.'); render(); }
    }
  }, 1000);
}
MODS.push(async a => {
  if (a !== 'ad') return false;
  if (adBusy) return true;
  if (typeof owner !== 'undefined' && owner) { toast('Eres owner: ya tienes todo desbloqueado.'); return true; }
  adBusy = true; const btn = $('#adb'); btn.disabled = true;
  if (ADS.link) { window.open(ADS.link, '_blank', 'noopener'); adEspera(); return true; }
  btn.textContent = 'Toca el botón del recuadro…';
  const f = document.createElement('iframe'); let cargo = false;
  f.className = 'adfr'; f.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
  f.srcdoc = `<body style="margin:0;height:100vh;display:grid;place-items:center;background:#12151c;font-family:sans-serif"><button id="b" style="padding:14px 22px;border:0;border-radius:12px;background:#22d3ee;font-weight:700;font-size:16px">Ver anuncio</button><script>document.getElementById('b').onclick=function(){parent.postMessage({ad:1},'*')}<\/script><script data-cfasync="false" src="${ADS.src}" onload="parent.postMessage({ad:'ok'},'*')" onerror="parent.postMessage({ad:'err'},'*')"><\/script></body>`;
  $('#adf').innerHTML = ''; $('#adf').appendChild(f);
  const on = e => {
    if (e.source !== f.contentWindow || !e.data) return;
    if (e.data.ad === 'ok') { cargo = true; return; }
    window.removeEventListener('message', on);
    if (e.data.ad === 'err' || !cargo) return adReset('El anuncio no se pudo cargar. Puede estar bloqueado por tu navegador o por un bloqueador de anuncios.');
    adEspera();
  };
  window.addEventListener('message', on);
  return true;
});
