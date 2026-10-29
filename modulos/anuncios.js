// Anuncios solo cuando el usuario los pide (Monetag, Direct Link). Cada anuncio completo suma 1 en la cuenta.
const ADS = { link: 'https://uplcm.com/4/12149568', espera: 8 };
let adBusy = false;
const anunciosView = () => { adBusy = false; return `<section class="card"><div class="ti">${ic('tv', 22)}<span>Ver anuncios</span></div><p class="mu">Cada anuncio completo suma 1 y desbloquea banners. Llevas <b id="adn">${stats().ads}</b>.</p><button class="btn" id="adb" data-a="ad">${ic('play', 16)}Ver anuncio</button><div id="adf"></div></section>`; };
function adReset(msg) {
  adBusy = false; const b = $('#adb'), f = $('#adf');
  if (f) f.innerHTML = '';
  if (b) { b.disabled = false; b.innerHTML = ic('play', 16) + 'Ver anuncio'; }
  if (msg) toast(msg);
}
function adEspera() {
  let s = ADS.espera;
  const t = setInterval(() => {
    const b = $('#adb'); if (!b) return clearInterval(t);
    s--; b.textContent = 'Espera ' + s + ' s…';
    if (s <= 0) {
      clearInterval(t); const st = stats(); st.ads++; gStats(); if (typeof paseAnuncio === 'function') paseAnuncio();
      const n = $('#adn'); if (n) n.textContent = st.ads;
      adReset(); if ([10, 20].includes(st.ads)) { toast('¡Misión completada! Reclama tu banner en esta pantalla.'); render(); }
    }
  }, 1000);
}
// Al tocar "Ver anuncio" se abre el anuncio en otra pestaña y empieza la espera; al terminar suma 1.
MODS.push(async a => {
  if (a !== 'ad') return false;
  if (adBusy) return true;
  if (typeof owner !== 'undefined' && owner) { toast('Eres owner: ya tienes todo desbloqueado.'); return true; }
  const btn = $('#adb'); if (!btn) return true;
  adBusy = true; btn.disabled = true;
  const w = window.open(ADS.link, '_blank');
  if (w) { try { w.opener = null; } catch (e) {} }
  if (!w) return adReset('No se pudo abrir el anuncio. Permite las ventanas emergentes de esta página e inténtalo otra vez.'), true;
  adEspera(); return true;
});
