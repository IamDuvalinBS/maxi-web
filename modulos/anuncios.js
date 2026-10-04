// Anuncios solo cuando el usuario los pide (Adsterra, ventana emergente dentro de un recuadro aislado)
const ADS = { src: 'https://afders.org/1/b41c3433668ea656bd302ab677eb0a46', total: 3, espera: 8 };
let adN = 0, adBusy = false;
const anunciosView = () => { adBusy = false; return `<section class="card"><div class="ti">📺 Prueba de anuncios</div><p class="mu">Para reclamar recompensas verás ${ADS.total} anuncios. Esta es una prueba de que funcionan.</p><p class="mu">Vistos: <b id="adn">${adN}</b>/${ADS.total}</p><button class="btn" id="adb" data-a="ad">${adN >= ADS.total ? '✅ ¡Listo!' : '▶ Ver anuncio'}</button><div id="adf"></div></section>`; };
MODS.push(async a => {
  if (a !== 'ad') return false;
  if (adBusy) return true;
  if (adN >= ADS.total) { toast('¡Listo! Ya viste los ' + ADS.total + ' anuncios.'); return true; }
  adBusy = true;
  const box = $('#adf'), btn = $('#adb'), f = document.createElement('iframe');
  btn.disabled = true; btn.textContent = 'Toca el botón del recuadro…';
  f.className = 'adfr'; f.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
  f.srcdoc = `<body style="margin:0;height:100vh;display:grid;place-items:center;background:#12151c;font-family:sans-serif"><button id="b" style="padding:14px 22px;border:0;border-radius:12px;background:#22d3ee;font-weight:700;font-size:16px">Ver anuncio</button><script>document.getElementById('b').onclick=function(){parent.postMessage({ad:1},'*')}<\/script><script data-cfasync="false" src="${ADS.src}"><\/script></body>`;
  box.innerHTML = ''; box.appendChild(f);
  const on = e => {
    if (e.source !== f.contentWindow || !e.data || !e.data.ad) return;
    window.removeEventListener('message', on);
    let s = ADS.espera;
    const t = setInterval(() => {
      if (!f.isConnected) return clearInterval(t);
      const b = $('#adb'); s--; b.textContent = 'Espera ' + s + ' s…';
      if (s <= 0) { clearInterval(t); adN++; adBusy = false; f.remove(); $('#adn').textContent = adN; b.disabled = false; b.textContent = adN >= ADS.total ? '✅ ¡Listo!' : '▶ Ver anuncio'; }
    }, 1000);
  };
  window.addEventListener('message', on);
  return true;
});
