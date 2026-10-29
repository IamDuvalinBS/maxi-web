// Anuncios solo cuando el usuario los pide (Monetag, zona 12149415). Cada anuncio completo suma 1 en la cuenta.
const ADS = { src: 'https://nap5k.com/tag.min.js', zone: '12149415', link: '', espera: 8 };
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
let adListo = false;   // el script de Monetag ya se cargó en esta visita
function adCargar() {
  return new Promise((ok, mal) => {
    if (adListo) return ok();
    const sc = document.createElement('script');
    sc.dataset.zone = ADS.zone; sc.src = ADS.src; sc.async = true;
    sc.onload = () => { adListo = true; ok(); };
    sc.onerror = () => { sc.remove(); mal(); };
    (document.body || document.documentElement).appendChild(sc);
  });
}
// Paso 1: toca "Ver anuncio" -> se carga el anuncio. Paso 2: toca "Toca para ver el anuncio" -> sale el anuncio y corre la espera.
MODS.push(async a => {
  if (a !== 'ad') return false;
  if (typeof owner !== 'undefined' && owner) { toast('Eres owner: ya tienes todo desbloqueado.'); return true; }
  const btn = $('#adb'); if (!btn) return true;
  if (adBusy === 'listo') { adBusy = true; btn.disabled = true; adEspera(); return true; }
  if (adBusy) return true;
  adBusy = 'carga'; btn.disabled = true; btn.textContent = 'Cargando anuncio…';
  try { await adCargar(); }
  catch (e) { return adReset('El anuncio no se pudo cargar. Puede estar bloqueado por tu navegador o por un bloqueador de anuncios.'), true; }
  const b2 = $('#adb'); if (!b2) { adBusy = false; return true; }
  adBusy = 'listo'; b2.disabled = false; b2.textContent = 'Toca para ver el anuncio';
  return true;
});
