// Íconos propios (SVG) y utilidades compartidas. Reemplazan a todos los emojis de la interfaz.
// Un ícono que empieza con "!" se dibuja relleno; los demás, solo con línea.
const IC = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  game: '<rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M7 10.2v4.6M4.7 12.5h4.6"/><path d="M15.6 11.2h.01M18.4 13.8h.01" stroke-width="2.6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" stroke-width="3"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/><path d="M12 14v4M9 18h6M8 21h8"/>',
  ticket: '<path d="M4 5h16a1 1 0 0 1 1 1v3a3 3 0 0 0 0 6v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a3 3 0 0 0 0-6V6a1 1 0 0 1 1-1z"/><path d="M14.5 6v2M14.5 11v2M14.5 16v2"/>',
  chat: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8 10h8M8 13h5"/>',
  news: '<path d="M5 4h11a1 1 0 0 1 1 1v15H6a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z"/><path d="M17 9h3v9a2 2 0 0 1-2 2"/><path d="M8 8h5M8 12h5M8 16h5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  theme: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  logout: '<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4"/><path d="M16 8l4 4-4 4M20 12H9"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  star: '!<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/>',
  starline: '<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/>',
  pin: '!<path d="M8.5 3h7l-1.2 6.2L17.5 12v2h-4.8v7h-1.4v-7H6.5v-2l3.2-2.8z"/>',
  edit: '!<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  send: '!<path d="M3.4 20.4l17.5-7.5a1 1 0 0 0 0-1.8L3.4 3.6a.9.9 0 0 0-1.3 1.1L4.5 11l9 1-9 1-2.4 6.3a.9.9 0 0 0 1.3 1.1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sticker: '<path d="M5 3h10l6 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/><path d="M8.6 12.5h.01M14 12.5h.01" stroke-width="2.6"/><path d="M8.5 16c1.8 1.7 4.2 1.7 6 0"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2.1-1.1 1.6-2.3-.6-1.3.2-2.7 1.7-2.7H17a4 4 0 0 0 4-4C21 6.9 17 3 12 3z"/><path d="M7.6 11h.01M10.6 7.2h.01M15.2 7.6h.01" stroke-width="2.6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  comment: '<path d="M5 4h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-9l-4 3.5V17H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>',
  play: '!<path d="M7 4.6v14.8a.6.6 0 0 0 .9.5l12-7.4a.6.6 0 0 0 0-1L7.900 4.100a.6.6 0 0 0-.9.5z"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="3"/><path d="M16 10.5l5-3v9l-5-3z"/>',
  gif: '<rect x="2.5" y="6" width="19" height="12" rx="3.5"/><path d="M10 10.6H8a1.5 1.5 0 0 0-1.500 1.500v-.2a1.500 1.500 0 0 0 1.500 1.500h2v-1.400H8.800M12.500 10v4M15 14v-4h2.600M15 12h2"/>',
  text: '<path d="M5 6.5V5h14v1.500M12 5v14M9 19h6"/>',
  thumb: '<path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z"/><path d="M7 11l4-7c1.700 0 2.500 1.200 2.200 2.800L12.700 9H19a2 2 0 0 1 2 2.400l-1.300 6.500A2.500 2.500 0 0 1 17.300 20H7"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.500 4.500 0 0 1 8-2.800A4.500 4.500 0 0 1 20 9c0 6-8 11-8 11z"/>',
  fire: '<path d="M12 22c4 0 7-2.800 7-6.800 0-3-1.800-5-3.500-7-.3 1.600-1 2.600-2 3 .5-3.300-.8-6.400-3.700-8.200.2 3-1.300 5-3 7-1.200 1.400-1.800 3-1.800 5 0 4 3 6 7 6z"/>',
  laugh: '<circle cx="12" cy="12" r="9"/><path d="M8.500 9.500h.01M15.500 9.500h.01" stroke-width="2.600"/><path d="M7.500 13.500h9a4.500 4.500 0 0 1-9 0z"/>',
  wow: '<circle cx="12" cy="12" r="9"/><path d="M8.500 9.500h.01M15.500 9.500h.01" stroke-width="2.600"/><ellipse cx="12" cy="16" rx="2" ry="2.600"/>',
  sad: '<circle cx="12" cy="12" r="9"/><path d="M8.500 10h.01M15.500 10h.01" stroke-width="2.600"/><path d="M8.500 16.500c1.800-1.800 5.200-1.800 7 0"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2.500"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12"/><path d="M12 9C9 9 7 8 7 6s3-2.500 5 3c2-5.500 5-5 5-3s-2 3-5 3z"/>',
  chart: '<path d="M5 20V11M11 20V4M17 20v-6M3 20h18"/>',
  check2: '<path d="M2 12.500l4 4L15 7M10 14.500l2 2L21 7"/>',
  check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
  crown: '!<path d="M3 7.500l4.600 4 4.400-6.700 4.400 6.700 4.600-4L19 19H5z"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="2.500"/><path d="M8 21h8M12 17v4"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1"/><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M5.300 18.700l2.100-2.100M16.600 7.400l2.100-2.100"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.500 7.500l8.500 6 8.500-6"/>',
  rocket: '<path d="M12 2c3.500 2 5 5.500 5 9l-2 4H9l-2-4c0-3.500 1.500-7 5-9z"/><circle cx="12" cy="9.500" r="1.600"/><path d="M9 15l-3 2 1 3 3-2M15 15l3 2-1 3-3-2"/>',
  volume: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.500 9a4 4 0 0 1 0 6M19 6.500a8 8 0 0 1 0 11"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9.500l4.500 5M21.500 9.500l-4.500 5"/>',
  rotate: '<path d="M20 12a8 8 0 1 1-2.500-5.800M20 4v5h-5"/>',
  flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  bolt: '!<path d="M13.500 2L5 13.500h5.500L9.500 22 19 10h-6z"/>',
  worm: '<circle cx="5.500" cy="17.500" r="2.500"/><circle cx="11" cy="12.500" r="2.500"/><circle cx="16.500" cy="8" r="2.500"/><path d="M19 4.500l1.500-1.500"/>',
  snake: '<path d="M4 19c0-3 3-3 5-5s0-4.500 3-6 6-.5 7 2.500"/><path d="M19 6.500h.01" stroke-width="3"/>',
  paw: '<circle cx="6.500" cy="10" r="1.800"/><circle cx="10.500" cy="6.500" r="1.800"/><circle cx="15.500" cy="6.500" r="1.800"/><circle cx="19" cy="10" r="1.800"/><path d="M12.800 11.500c3 0 5.500 3.200 5.500 5.700 0 2-1.800 2.500-3 2.200-1.200-.3-1.800-.6-2.500-.6s-1.300.3-2.500.6c-1.200.3-3-.2-3-2.200 0-2.500 2.500-5.700 5.500-5.700z"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M12 8l3.500 2.500-1.300 4h-4.400l-1.300-4zM12 3v5M15.500 10.500L20 9M14.200 14.500L17 18.500M9.800 14.500L7 18.500M8.500 10.500L4 9"/>',
  egg: '<path d="M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11z"/>',
  dumbbell: '<path d="M6 7v10M3 9.500v5M18 7v10M21 9.500v5M6 12h12"/>',
  pick: '<path d="M3.500 9c4.500-5 12.500-5 17 0M12 6.200V21"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.500 3.500 3.500 14.500 0 18M12 3c-3.500 3.500-3.500 14.500 0 18"/>',
  flower: '<circle cx="12" cy="12" r="2.200"/><circle cx="12" cy="5.800" r="2.600"/><circle cx="12" cy="18.200" r="2.600"/><circle cx="5.800" cy="12" r="2.600"/><circle cx="18.200" cy="12" r="2.600"/>',
  skull: '<path d="M5 11a7 7 0 0 1 14 0v4l-2 1v4H7v-4l-2-1z"/><path d="M9.500 12.500h.01M14.500 12.500h.01M12 16v2" stroke-width="2.600"/>',
  diamond: '<path d="M12 3l8 9-8 9-8-9z"/><path d="M4 12h16"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  sparkle: '!<path d="M12 2.500l2 6.500 6.500 2-6.500 2-2 6.500-2-6.500-6.500-2 6.500-2z"/>',
  userplus: '<circle cx="10" cy="8" r="4"/><path d="M2.500 21c0-4 3.400-6.500 7.500-6.500M18 14v6M15 17h6"/>',
  more: '<path d="M6 12h.01M12 12h.01M18 12h.01" stroke-width="3"/>',
  wall: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 15l5-4 4 3 4-5 5 5"/>'
};
const ic = (n, s = 20, cl = '') => {
  const p = IC[n] || '', f = p[0] === '!';
  return `<svg class="ic ${cl}" viewBox="0 0 24 24" width="${s}" height="${s}" ${f ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'} aria-hidden="true" focusable="false">${f ? p.slice(1) : p}</svg>`;
};

// ---- Utilidades de archivos e imágenes ----
const leeArchivo = f => new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => mal(new Error('No se pudo leer el archivo.')); r.readAsDataURL(f); });
const cargaImg = src => new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => mal(new Error('No se pudo leer la imagen.')); i.src = src; });
// Reduce una imagen (dataURL u objectURL) a "max" píxeles de lado mayor. Devuelve dataURL.
async function comprime(src, max, q, mime) {
  const i = await cargaImg(src), k = Math.min(1, max / Math.max(i.width, i.height));
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(i.width * k)); c.height = Math.max(1, Math.round(i.height * k));
  const x = c.getContext('2d');
  if ((mime || 'image/jpeg') === 'image/jpeg') { x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height); }
  x.drawImage(i, 0, 0, c.width, c.height);
  return c.toDataURL(mime || 'image/jpeg', q);
}
const fechaDe = t => (t && t.toDate) ? t.toDate().toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const horaDe = t => (t && t.toDate) ? t.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
const urlOk = u => /^https?:\/\/[^\s]+$/i.test(u || '');
const imgOk = s => /^(data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,|https:\/\/|img\/)/i.test(s || '');
const inicial = n => esc((n || '?').trim()[0] || '?').toUpperCase();

const perfLink = (uid, inner) => uid ? `<a class="pl" href="#u/${esc(uid)}">${inner}</a>` : `<span class="pl">${inner}</span>`;
