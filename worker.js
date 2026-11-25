   // 1) Reenvía las rutas de login de Firebase (/__/auth y /__/firebase) a firebaseapp.com
//    para que el login con Google funcione en este dominio.
// 2) /api/previa?u=<enlace>: arma la previa de un enlace (título, descripción, imagen) para los chats.
//    El resto lo sirve la página normal.
const FIREBASE = "https://maxi-bot-b7dfc.firebaseapp.com";
const PROYECTO = "maxi-bot-b7dfc";

const json = (o, s = 200, cache = false) => new Response(JSON.stringify(o), {
  status: s,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache ? "public, max-age=86400" : "no-store" }
});
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = s => String(s || "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === "#") { const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); try { return String.fromCodePoint(n); } catch (_) { return ""; } }
  return ENT[e.toLowerCase()] ?? m;
});
const limpia = (s, n) => decode(s).replace(/\s+/g, " ").trim().slice(0, n);

// Lee las etiquetas <meta> y <title> de un HTML
export function leeMeta(html, base) {
  const metas = {};
  for (const m of html.matchAll(/<meta\s+([^>]*?)\/?>/gi)) {
    const a = {};
    for (const x of m[1].matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) a[x[1].toLowerCase()] = x[3] ?? x[4] ?? x[5] ?? "";
    const k = (a.property || a.name || "").toLowerCase();
    if (k && a.content != null && !(k in metas)) metas[k] = a.content;
  }
  const titulo = metas["og:title"] || metas["twitter:title"] || ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
  const desc = metas["og:description"] || metas["twitter:description"] || metas["description"] || "";
  let img = metas["og:image"] || metas["og:image:url"] || metas["twitter:image"] || "";
  try { img = new URL(decode(img), base).href; } catch (_) { img = ""; }
  if (!/^https:\/\//i.test(img)) img = "";
  return { t: limpia(titulo, 110), d: limpia(desc, 180), i: img, s: limpia(metas["og:site_name"] || "", 40) };
}

async function previa(request, ctx) {
  const url = new URL(request.url);
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return json({ ok: false }, 403);         // solo la propia página puede pedirlo
  let u;
  try { u = new URL(url.searchParams.get("u") || ""); } catch (_) { return json({ ok: false }, 400); }
  const h = u.hostname.toLowerCase();
  if (!/^https?:$/.test(u.protocol) || u.username || u.password || !h.includes(".") || h === "localhost" || /^[\d.]+$/.test(h) || h.includes(":") || h.endsWith(".local") || h.endsWith(".internal"))
    return json({ ok: false }, 400);

  const cache = caches.default, key = new Request(url.origin + "/api/previa?u=" + encodeURIComponent(u.href));
  const hit = await cache.match(key);
  if (hit) return hit;

  const out = { ok: true, h: h.replace(/^www\./, "") };
  const ac = new AbortController(), to = setTimeout(() => ac.abort(), 4500);
  try {
    const r = await fetch(u.href, {
      signal: ac.signal, redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; MamboBotPreview/1.0)", accept: "text/html,application/xhtml+xml", "accept-language": "es,en;q=0.8" }
    });
    if (r.ok && /html/i.test(r.headers.get("content-type") || "") && r.body) {
      const rd = r.body.getReader(), td = new TextDecoder("utf-8", { fatal: false });
      let html = "", n = 0;
      while (n < 160000) {                                                      // solo se lee el principio de la página
        const { done, value } = await rd.read();
        if (done) break;
        n += value.length; html += td.decode(value, { stream: true });
        if (/<\/head>/i.test(html)) break;
      }
      try { rd.cancel(); } catch (_) {}
      Object.assign(out, leeMeta(html, r.url || u.href));
    }
  } catch (_) { /* si falla, la página muestra una tarjeta simple con el dominio */ }
  clearTimeout(to);
  const res = json(out, 200, true);
  ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}


// ══════════════════════════════════════════════════════════════════════════════
// IA
// ══════════════════════════════════════════════════════════════════════════════
// Cadena de proveedores GRATIS y SIN llaves. Se prueban en orden y gana el
// primero que conteste bien. Si un modelo desaparece del catálogo, se cae solo
// y sigue el siguiente: no hay que tocar nada más.
//
// Para cambiar de IA: edita esta lista y ya. Nada del resto del archivo está
// atado a un proveedor concreto, así que el bloque entero se puede copiar tal
// cual a otro Worker.
//
//   tipo "cf"  -> Cloudflare Workers AI (binding env.AI, sin key)
//   tipo "ddg" -> DuckDuckGo AI Chat (sin cuenta ni key, token temporal al vuelo)
//   tipo "oa"  -> cualquier endpoint compatible con OpenAI (POST, sin key)
//
// Con llaves opcionales (wrangler secret put ...) se sube la calidad sin tocar código:
//   OPENAI_KEY / POLLEN_KEY / OPENROUTER_KEY -> gpt-5-nano y similares, van primeros.
const PROVEEDORES = [
  // 1) Calidad primero: los mejores modelos del catálogo de Workers AI.
  { id: "cf-llama4-scout", tipo: "cf", modelo: "@cf/meta/llama-4-scout-17b-16e-instruct" },
  { id: "cf-gpt-oss-120b", tipo: "cf", modelo: "@cf/openai/gpt-oss-120b" },
  { id: "cf-llama33-70b", tipo: "cf", modelo: "@cf/meta/llama-3.3-70b-instruct-fp8-fast" },
  { id: "cf-qwen3-30b", tipo: "cf", modelo: "@cf/qwen/qwen3-30b-a3b-fp8" },
  { id: "cf-mistral-small", tipo: "cf", modelo: "@cf/mistralai/mistral-small-3.1-24b-instruct" },
  // 2) GPT de verdad, sin cuenta ni key.
  { id: "ddg-gpt4o-mini", tipo: "ddg", modelo: "gpt-4o-mini" },
  { id: "ddg-claude-haiku", tipo: "ddg", modelo: "claude-3-haiku-20240307" },
  { id: "ddg-llama33", tipo: "ddg", modelo: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  // 3) Pollinations: sin cuenta y sin key. El parámetro "referrer" sube el límite.
  { id: "pollinations-gpt", tipo: "oa", url: "https://text.pollinations.ai/openai", modelo: "openai", referrer: true },
  { id: "pollinations-gpt-large", tipo: "oa", url: "https://text.pollinations.ai/openai", modelo: "openai-large", referrer: true },
  // 4) Último recurso: endpoint abierto compatible con OpenAI.
  { id: "hackclub", tipo: "oa", url: "https://ai.hackclub.com/chat/completions" }
];

// Catálogo de Workers AI: https://developers.cloudflare.com/workers-ai/models/
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const sistema = (extra = "") =>
  "Eres Mambo IA, un asistente de inteligencia artificial de uso general, como Meta IA o ChatGPT, dentro de la página Mambo Bot. " +
  "Respondes preguntas de cualquier tema (cultura general, música, juegos, escuela, tecnología, consejos, chistes, redacción, etc.) " +
  "siempre en español, con un tono amable y cercano, claro y breve (máximo unos 6 párrafos cortos). " +
  "Hoy es " + new Date().toISOString().slice(0, 10) + "; úsalo solo si viene al caso. " +
  "Solo mencionas la página (juegos, misiones, pases, canjes, chats y el bot de WhatsApp) cuando te pregunten por ella; " +
  "no la menciones por tu cuenta ni preguntes si quieres jugar. " +
  "Si no estás seguro de un dato, dilo con honestidad y da lo que sí sepas, sin inventar. " +
  "Normalmente no tienes internet; cuando te llegue contexto web, ese contexto manda sobre tu memoria y lo citas con [n]. " +
  "Si te dan una RESPUESTA ENCONTRADA, cópiala literal y en una o dos frases: no la sustituyas por lo que recuerdes. " +
  "Puedes usar *negrita* y listas con guiones." + (extra ? "\n\n" + extra : "");

const sacaTexto = r => String(
  (r && (r.response || r.result ||
    (r.choices && r.choices[0] && r.choices[0].message &&
      (r.choices[0].message.content || r.choices[0].message.reasoning_content)))) || ""
).trim();

// ── DuckDuckGo AI Chat: token temporal (x-vqd) y lectura del stream SSE ──
let VQD = null, VQD_T = 0;
async function vqd(signal, forzar) {
  if (!forzar && VQD && Date.now() - VQD_T < 4 * 60e3) return VQD;
  const r = await fetch("https://duckduckgo.com/duckchat/v1/status", {
    signal,
    headers: { "x-vqd-accept": "1", "user-agent": UA, accept: "*/*", "accept-language": "es-ES,es;q=0.9,en;q=0.8" }
  });
  if (!r.ok) throw new Error("vqd " + r.status);
  const v = { t: r.headers.get("x-vqd-4"), h: r.headers.get("x-vqd-hash-1") };
  if (!v.t) throw new Error("sin vqd");
  VQD = v; VQD_T = Date.now();
  return v;
}

async function ddg(p, msgs, signal, intento = 0) {
  const v = await vqd(signal, intento > 0);
  // DDG no traga bien el rol "system": se pliega en el primer mensaje de usuario.
  const limpios = msgs.map(m => ({ ...m }));
  limpios[0] = { role: "user", content: sistema() + "\n\n" + limpios[0].content };

  const r = await fetch("https://duckduckgo.com/duckchat/v1/chat", {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      "x-vqd-4": v.t,
      ...(v.h ? { "x-vqd-hash-1": v.h } : {}),
      "x-fe-version": "serp_20250325_110000_ET",
      "user-agent": UA,
      origin: "https://duckduckgo.com",
      referer: "https://duckduckgo.com/",
      accept: "text/event-stream",
      "accept-language": "es-ES,es;q=0.9,en;q=0.8"
    },
    body: JSON.stringify({ model: p.modelo, messages: limpios })
  });

  if ((r.status === 403 || r.status === 418) && intento === 0) return ddg(p, msgs, signal, 1);  // token caducado: uno nuevo
  if (!r.ok || !r.body) throw new Error("HTTP " + r.status);

  const rd = r.body.getReader(), td = new TextDecoder("utf-8", { fatal: false });
  let buf = "", out = "";
  while (true) {
    const { done, value } = await rd.read();
    if (done) break;
    buf += td.decode(value, { stream: true });
    const lineas = buf.split("\n"); buf = lineas.pop() || "";
    for (const ln of lineas) {
      const l = ln.trim();
      if (!l.startsWith("data:")) continue;
      const d = l.slice(5).trim();
      if (!d || d === "[DONE]") continue;
      try { const j = JSON.parse(d); if (j.message) out += j.message; } catch (_) {}
    }
  }
  try { rd.cancel(); } catch (_) {}
  return out.trim();
}


// ── Caché de respuestas, respuestas directas e investigaciones ───────────────
const memo = new Map(), TTL = 10 * 60e3;
const clave = msgs => msgs.slice(-4).map(m => m.role[0] + ":" + m.content).join("|").slice(0, 4000);
function delMemo(k) {
  const v = memo.get(k);
  if (v && Date.now() - v.t < TTL) return v.x;
  if (v) memo.delete(k);
  return null;
}
function alMemo(k, x) {
  memo.set(k, { x, t: Date.now() });
  if (memo.size > 200) memo.delete(memo.keys().next().value);
}


// ── Investigación web sin llaves ─────────────────────────────────────────────
const soloTexto = h => decode(String(h || "")
  .replace(/<(script|style|noscript|svg|iframe|form|nav|header|footer|aside|template)[\s\S]*?<\/\1>/gi, " ")
  .replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

async function baja(url, signal, max = 200000) {
  const r = await fetch(url, {
    signal, redirect: "follow",
    headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml", "accept-language": "es-ES,es;q=0.9,en;q=0.8" }
  });
  if (!r.ok || !r.body) throw new Error("HTTP " + r.status);
  if (!/html|text/i.test(r.headers.get("content-type") || "")) throw new Error("no-html");
  const rd = r.body.getReader(), td = new TextDecoder("utf-8", { fatal: false });
  let s = "", n = 0;
  while (n < max) { const { done, value } = await rd.read(); if (done) break; n += value.length; s += td.decode(value, { stream: true }); }
  try { rd.cancel(); } catch (_) {}
  return s;
}

async function mapa(items, limite, fn) {
  const cola = [...items];
  await Promise.all(Array.from({ length: Math.min(limite, cola.length) }, async () => {
    while (cola.length) await fn(cola.shift());
  }));
}

const STOP = new Set("de la el los las un una unos unas que con por para en del al y o es son fue como qué quien quién cual cuál cuando cuándo donde dónde cuanto cuánto más muy sin sobre entre hasta desde este esta esto ese esa eso su sus mis tus".split(" "));
const palabras = q => [...new Set(String(q).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]{3,}/g) || [])].filter(w => !STOP.has(w)).slice(0, 8);
const normal = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// ── Motores ──
const anclas = (html, patron) => {
  const out = [];
  for (const m of html.matchAll(/<a\s+([^>]+)>([\s\S]*?)<\/a>/gi)) {
    if (!new RegExp(patron, "i").test(m[1])) continue;
    const u = (m[1].match(/href\s*=\s*["']([^"']+)["']/i) || [])[1] || "";
    const t = soloTexto(m[2]);
    if (/^https?:/i.test(u) && t.length > 12) out.push({ u, t: t.slice(0, 110) });
  }
  return out;
};

async function enWikipedia(q, signal) {
  const r = await fetch("https://es.wikipedia.org/w/api.php?action=query&format=json&origin=*&srlimit=3&list=search&srsearch=" + encodeURIComponent(q),
    { signal, headers: { "user-agent": UA, accept: "application/json" } });
  if (!r.ok) return [];
  const j = await r.json();
  return (j?.query?.search || []).map(x => ({
    t: x.title,
    u: "https://es.wikipedia.org/wiki/" + encodeURIComponent(x.title.replace(/ /g, "_")),
    x: soloTexto(x.snippet).slice(0, 320)
  }));
}

async function enDuckDuckGo(q, signal) {
  const h = await baja("https://lite.duckduckgo.com/lite/?q=" + encodeURIComponent(q), signal, 150000);
  const snips = [...h.matchAll(/<td[^>]*class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/gi)].map(m => soloTexto(m[1]));
  return anclas(h, "result-link").map((l, i) => ({ ...l, x: (snips[i] || "").slice(0, 320) }));
}

async function enMojeek(q, signal) {
  const h = await baja("https://www.mojeek.com/search?q=" + encodeURIComponent(q), signal, 180000);
  const snips = [...h.matchAll(/<p[^>]*class=['"]s['"][^>]*>([\s\S]*?)<\/p>/gi)].map(m => soloTexto(m[1]));
  return anclas(h, "class=['\"]ob").map((l, i) => ({ ...l, x: (snips[i] || "").slice(0, 320) }));
}

async function enBing(q, signal) {
  const h = await baja("https://www.bing.com/search?setlang=es&q=" + encodeURIComponent(q), signal, 200000);
  const out = [];
  for (const m of h.matchAll(/<h2[^>]*>\s*<a\s+([^>]+)>([\s\S]*?)<\/a>/gi)) {
    const u = (m[1].match(/href\s*=\s*["']([^"']+)["']/i) || [])[1] || "";
    const t = soloTexto(m[2]);
    if (/^https?:/i.test(u) && t) out.push({ u, t: t.slice(0, 110) });
  }
  return out.slice(0, 6);
}

async function enGoogle(q, signal) {
  const h = await baja("https://www.google.com/search?hl=es&num=10&q=" + encodeURIComponent(q), signal, 200000);
  const out = [];
  for (const m of h.matchAll(/<a\s+([^>]+)>\s*<h3[^>]*>([\s\S]*?)<\/h3>/gi)) {
    let u = (m[1].match(/href\s*=\s*["']([^"']+)["']/i) || [])[1] || "";
    if (u.startsWith("/url?q=")) { try { u = new URL("https://www.google.com" + u).searchParams.get("q") || ""; } catch (_) { u = ""; } }
    const t = soloTexto(m[2]);
    if (/^https?:/i.test(u) && t) out.push({ u, t: t.slice(0, 110) });
  }
  return out.slice(0, 6);
}

// ── Respuesta literal de Google ──────────────────────────────────────────────
// Bloques donde Google pone la respuesta destacada o la ficha de conocimiento.
const CAJAS = [
  /data-attrid="wa:\/description"[^>]*>([\s\S]*?)<\/(?:div|span)>/i,
  /<div[^>]*class="[^"]*\b(?:IZ6rdc|hgKElc|kno-rdesc|zCubwf)\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  /<span[^>]*data-attrid="wa:\/description"[^>]*>([\s\S]*?)<\/span>/i,
  /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i
];

async function googleRespuesta(q, signal) {
  const h = await baja("https://www.google.com/search?hl=es&num=10&q=" + encodeURIComponent(q), signal, 220000);
  const trozos = [];
  for (const pat of CAJAS) {
    const m = h.match(pat);
    if (!m) continue;
    const t = soloTexto(m[1]);
    if (t.length > 40 && !trozos.includes(t)) trozos.push(t);
  }
  return trozos.join(" ").slice(0, 900);
}

async function ddgRespuesta(q, signal) {
  const r = await fetch("https://api.duckduckgo.com/?format=json&no_html=1&skip_disambig=1&q=" + encodeURIComponent(q),
    { signal, headers: { "user-agent": UA, accept: "application/json" } });
  if (!r.ok) return "";
  const j = await r.json();
  return String(j?.AbstractText || j?.Answer || j?.Definition || "").slice(0, 900);
}

async function wikiRespuesta(q, signal) {
  const r = await fetch("https://es.wikipedia.org/w/api.php?action=query&format=json&origin=*&srlimit=1&list=search&srsearch=" + encodeURIComponent(q),
    { signal, headers: { "user-agent": UA, accept: "application/json" } });
  if (!r.ok) return "";
  const j = await r.json();
  const titulo = j?.query?.search?.[0]?.title;
  if (!titulo) return "";
  const s = await fetch("https://es.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(titulo.replace(/ /g, "_")),
    { signal, headers: { "user-agent": UA, accept: "application/json" } });
  if (!s.ok) return "";
  const sj = await s.json();
  return String(sj?.extract || "").slice(0, 900);
}

// Devuelve la primera respuesta literal que aparezca, con su procedencia.
async function respuestaDirecta(q, signal) {
  const k = "d:" + normal(q).slice(0, 140);
  const guardada = delMemo(k);
  if (guardada !== null) return guardada;

  const intentos = [
    ["Google", googleRespuesta],
    ["DuckDuckGo", ddgRespuesta],
    ["Wikipedia", wikiRespuesta]
  ];
  let out = null;
  for (const [de, fn] of intentos) {
    try {
      const t = await fn(q, signal);
      if (t && t.length > 40) { out = { texto: t, de }; break; }
    } catch (_) {}
  }
  alMemo(k, out);
  return out;
}

// ── Extracción del cuerpo real ──
const RUIDO = /^(aceptar|usamos cookies|este sitio|suscr[ií]bete|newsletter|comparte|publicidad|leer m[aá]s|ver m[aá]s|pol[ií]tica de|todos los derechos|©)/i;

function extrae(html) {
  const h = String(html || "");
  const titulo = limpia((h.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] ||
    (h.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)/i) || [])[1] || "", 120);

  const limpio = h.replace(/<(script|style|noscript|svg|iframe|form|nav|header|footer|aside|template)[\s\S]*?<\/\1>/gi, " ")
                   .replace(/<!--[\s\S]*?-->/g, " ");

  let zona = (limpio.match(/<(article|main)\b[^>]*>([\s\S]*?)<\/\1>/i) || [])[2] || "";
  if (soloTexto(zona).length < 500) zona = limpio;

  const vistos = new Set(), lineas = [];
  for (const m of zona.matchAll(/<(h2|h3|p|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const t = soloTexto(m[2]);
    if (t.length < 40) continue;
    if (t.length < 140 && RUIDO.test(t)) continue;
    const kk = t.slice(0, 70).toLowerCase();
    if (vistos.has(kk)) continue;
    vistos.add(kk);
    lineas.push(m[1].toLowerCase()[0] === "h" ? "## " + t : m[1].toLowerCase() === "li" ? "- " + t : t);
  }
  return { titulo, texto: lineas.join("\n").slice(0, 5000) };
}

function enlacesInternos(html, base, ts) {
  let host; try { host = new URL(base).hostname; } catch (_) { return []; }
  const out = [];
  for (const m of String(html).matchAll(/<a\s+([^>]+)>([\s\S]*?)<\/a>/gi)) {
    const href = (m[1].match(/href\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (!href) continue;
    let u; try { u = new URL(decode(href), base); } catch (_) { continue; }
    if (u.hostname !== host || /\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mp3)$/i.test(u.pathname)) continue;
    const t = soloTexto(m[2]);
    if (t.length < 14) continue;
    const bajo = normal(t + " " + u.pathname);
    if (!ts.some(w => bajo.includes(w))) continue;
    out.push({ u: u.href, t: t.slice(0, 90) });
    if (out.length >= 3) break;
  }
  return out;
}

const puntua = (r, ts) => {
  const t = normal(r.t + " " + (r.x || ""));
  let s = 0;
  for (const w of ts) if (t.includes(w)) s += 3;
  if (/\.(edu|gov|gob)(\.|$)/.test(r.d)) s += 2;
  if (/wikipedia\.org$/.test(r.d)) s += 1;
  if (/(^|\.)(medium|quora|reddit|tiktok|pinterest|facebook)\./.test(r.d)) s -= 1;
  s -= Math.max(0, r.t.length - 90) / 40;
  return s;
};

// nivel: 1 = 2 páginas, 2 = 4 páginas, 3 = 6 páginas + un salto a enlaces internos
async function investigar(q, nivel = 2) {
  const k = "i" + nivel + ":" + normal(q).slice(0, 140);
  const guardado = delMemo(k);
  if (guardado !== null) return guardado;

  const ts = palabras(q);
  if (!ts.length) return [];
  const ac = new AbortController(), to = setTimeout(() => ac.abort(), 16000);

  const crudos = [];
  const lanzar = async fn => { try { crudos.push(...await fn(q, ac.signal)); } catch (_) {} };
  await Promise.all([lanzar(enWikipedia), lanzar(enDuckDuckGo), lanzar(enMojeek), lanzar(enBing), lanzar(enGoogle)]);

  const vistos = new Set(), porDominio = new Map(), orden = [];
  for (const r of crudos) {
    let d; try { d = new URL(r.u).hostname.replace(/^www\./, ""); } catch (_) { continue; }
    if (vistos.has(r.u) || /(^|\.)(google|bing|duckduckgo|mojeek|startpage)\.[a-z]+$/.test(d)) continue;
    if ((porDominio.get(d) || 0) >= 2) continue;
    porDominio.set(d, (porDominio.get(d) || 0) + 1);
    vistos.add(r.u);
    orden.push({ t: r.t, u: r.u, x: r.x || "", d, p: puntua({ t: r.t, u: r.u, x: r.x, d }, ts) });
  }
  orden.sort((a, b) => b.p - a.p);

  const cuantas = nivel >= 3 ? 6 : nivel === 2 ? 4 : 2;
  const elegidas = orden.slice(0, cuantas);
  if (!elegidas.length) { clearTimeout(to); return []; }

  await mapa(elegidas, 3, async f => {
    try {
      const h = await baja(f.u, ac.signal, 240000);
      const e = extrae(h);
      if (e.titulo) f.t = e.titulo;
      if (e.texto.length > 200) f.x = e.texto;
      if (nivel >= 2) f.links = enlacesInternos(h, f.u, ts);
    } catch (_) {}
  });

  if (nivel >= 3) {
    const mejor = elegidas.find(f => (f.x || "").length > 900 && f.links?.length);
    if (mejor) {
      await mapa(mejor.links.slice(0, 2), 2, async l => {
        try {
          const e = extrae(await baja(l.u, ac.signal, 180000));
          if (e.texto.length > 400) elegidas.push({ t: e.titulo || l.t, u: l.u, x: e.texto, d: new URL(l.u).hostname });
        } catch (_) {}
      });
    }
  }
  clearTimeout(to);

  const out = elegidas.filter(f => (f.x || "").length > 120);
  alMemo(k, out);
  return out;
}

const contexto = f => f.map((x, i) => `[${i + 1}] ${x.t} (${x.d})\n${x.u}\n${x.x.slice(0, 1800)}`).join("\n\n").slice(0, 9000);


// Un intento contra un proveedor. Devuelve texto o lanza.
async function pedir(p, msgs, env, signal, request, extra) {
  if (p.tipo === "ddg") return ddg(p, msgs, signal);

  // Los modelos de OpenAI (gpt-5-*) piden max_completion_tokens y no aceptan temperature.
  const cuerpo = p.oai
    ? { messages: [{ role: "system", content: sistema(extra) }, ...msgs], max_completion_tokens: 900 }
    : { messages: [{ role: "system", content: sistema(extra) }, ...msgs], max_tokens: 900, temperature: 0.7, stream: false };

  if (p.tipo === "cf") {
    if (!env.AI) throw new Error("sin binding AI");
    return sacaTexto(await env.AI.run(p.modelo, cuerpo, { signal }));
  }

  const url = new URL(p.url);
  if (p.referrer) url.searchParams.set("referrer", new URL(request.url).origin);

  const cabeceras = { "content-type": "application/json", accept: "application/json", "user-agent": UA };
  if (p.keyEnv && env[p.keyEnv]) cabeceras.authorization = "Bearer " + env[p.keyEnv];

  const r = await fetch(url, {
    method: "POST",
    signal,
    headers: cabeceras,
    body: JSON.stringify(p.modelo ? { ...cuerpo, model: p.modelo } : cuerpo)
  });
  if (!r.ok) throw new Error("HTTP " + r.status);

  const ct = r.headers.get("content-type") || "";
  if (/json/i.test(ct)) return sacaTexto(await r.json());
  return String(await r.text()).trim();                                        // algunos devuelven texto plano
}

// Envuelve un intento con su propio reloj y su AbortController.
function conLimite(ms, fn) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return fn(ac.signal).finally(() => clearTimeout(t));
}


// ── Sesión de Firebase (JWT) y límite por persona ────────────────────────────
let JWKS = null, JWKS_T = 0;
const jwks = async () => {
  if (JWKS && Date.now() - JWKS_T < 3600e3) return JWKS;
  const r = await fetch("https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com");
  JWKS = (await r.json()).keys; JWKS_T = Date.now(); return JWKS;
};
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), c => c.charCodeAt(0));
export async function uidDe(request, jw = jwks) {
  const tk = (request.headers.get("authorization") || "").replace(/^Bearer /, ""), p = tk.split(".");
  if (p.length !== 3) return null;
  try {
    const h = JSON.parse(new TextDecoder().decode(b64u(p[0]))), d = JSON.parse(new TextDecoder().decode(b64u(p[1])));
    if (h.alg !== "RS256" || d.aud !== PROYECTO || d.iss !== "https://securetoken.google.com/" + PROYECTO || !d.sub || !(d.exp * 1000 > Date.now())) return null;
    const k = (await jw()).find(x => x.kid === h.kid); if (!k) return null;
    const key = await crypto.subtle.importKey("jwk", k, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return (await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u(p[2]), new TextEncoder().encode(p[0] + "." + p[1]))) ? d.sub : null;
  } catch (_) { return null; }
}
const uso = new Map();                                                          // límite por persona: 12 mensajes por minuto
const limite = uid => { const n = Date.now(), l = (uso.get(uid) || []).filter(t => n - t < 60000); l.push(n); uso.set(uid, l); if (uso.size > 5000) uso.clear(); return l.length <= 12; };

async function ia(request, env) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return json({ ok: false }, 403);
  const uid = await uidDe(request);
  if (!uid) return json({ ok: false, e: "sesion" }, 401);
  if (!limite(uid)) return json({ ok: false, e: "rapido" }, 429);

  let body; try { body = await request.json(); } catch (_) { return json({ ok: false }, 400); }
  const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-12)
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ ok: false }, 400);

  const pregunta = msgs[msgs.length - 1].content;
  const quiere = body.buscar === true || (body.buscar !== false && !CHARLA.test(pregunta.trim()));
  const nivel = Math.min(3, Math.max(1, Number(body.profundidad) || (FRESCO.test(pregunta) ? 2 : 1)));

  let fuentes = [], extra = "", directa = null;
  if (quiere) {
    const q = consulta(pregunta);
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), 12000);
    [directa, fuentes] = await Promise.all([
      respuestaDirecta(q, ac.signal).catch(() => null),
      investigar(q, nivel).catch(() => [])
    ]);
    clearTimeout(to);

    if (directa) {
      extra = "RESPUESTA ENCONTRADA en " + directa.de + " (cópiala literal, en una o dos frases):\n\n" + directa.texto +
        (fuentes.length ? "\n\nFuentes de apoyo para citar con [n]:\n\n" + contexto(fuentes) : "");
    } else if (fuentes.length) {
      extra = "Contexto web recuperado ahora mismo. Para datos actuales usa SOLO esto y cita con [n]; si no alcanza, dilo y no inventes:\n\n" + contexto(fuentes);
    }
  }

  const k = clave(msgs) + (quiere ? "#w" + nivel : "");
  const guardada = delMemo(k);
  if (guardada) return json({ ok: true, texto: guardada, cache: true });

  // Llaves opcionales: si existen, van primero; si no, la red gratis de siempre.
  const cadena = [
    ...(env.OPENAI_KEY ? [{ id: "gpt5-nano", tipo: "oa", oai: true, url: "https://api.openai.com/v1/chat/completions", modelo: "gpt-5-nano", keyEnv: "OPENAI_KEY" }] : []),
    ...(env.OPENAI_KEY ? [{ id: "gpt5", tipo: "oa", oai: true, url: "https://api.openai.com/v1/chat/completions", modelo: "gpt-5", keyEnv: "OPENAI_KEY" }] : []),
    ...(env.POLLEN_KEY ? [{ id: "pollen-gpt54", tipo: "oa", oai: true, url: "https://gen.pollinations.ai/v1/chat/completions", modelo: "openai/gpt-5.4-nano", keyEnv: "POLLEN_KEY" }] : []),
    ...(env.OPENROUTER_KEY ? [{ id: "openrouter", tipo: "oa", url: "https://openrouter.ai/api/v1/chat/completions", modelo: "openai/gpt-5-nano", keyEnv: "OPENROUTER_KEY" }] : []),
    ...PROVEEDORES
  ];

  const deadline = Date.now() + 45000;                                          // presupuesto total de la respuesta
  let ultimo = "";
  for (const p of cadena) {
    if (p.tipo === "cf" && !env.AI) continue;
    const resto = deadline - Date.now();
    if (resto < 3000) break;
    try {
      const texto = await conLimite(Math.min(20000, resto), signal => pedir(p, msgs, env, signal, request, extra));
      if (texto) {
        const recorte = texto.slice(0, 4000);
        alMemo(k, recorte);
        return json({ ok: true, texto: recorte, fuentes: fuentes.map(f => ({ t: f.t, u: f.u })) });
      }
      ultimo = p.id + ": respuesta vacía";
    } catch (err) {
      ultimo = p.id + ": " + String((err && err.message) || err);
    }
  }

  // Si ningún modelo contesta pero hay respuesta literal, se sirve tal cual.
  if (directa) return json({ ok: true, texto: directa.texto, fuentes: fuentes.map(f => ({ t: f.t, u: f.u })), directo: true });
  return json({ ok: false, e: "ia", d: ultimo.slice(0, 200) }, 503);
}

// Chit-chat que no merece búsqueda
const CHARLA = /^(hola|buenas|buenos d[ií]as|buenas (tardes|noches)|hey|ey|qu[eé] tal|c[oó]mo est[aá]s|gracias|ok|vale|dale|s[ií]|no|jaja+|xd|qui[eé]n eres|qu[eé] eres|qu[eé] puedes hacer|ayuda|c[oó]mo funciona)[\s!?.]*$/i;

// Preguntas que piden dato fresco: suben la profundidad
const FRESCO = /\b(hoy|ayer|ahora|actual|actualmente|últim[oa]s?|noticias?|precio|cu[aá]nto (cuesta|sale|vale)|qu[eé] (es|son|significa|significan|era)|qui[eé]n (es|fue|gan[oó])|qu[ií]enes|d[oó]nde (est[aá]|queda)|c[oó]mo (se|hago|funciona)|cu[aá]l (es|fue)|clima|resultado|cotizaci[oó]n|estreno|sali[oó]|meme|jerga|slang|tendencia|viral|moda|se dice|202\d)\b/i;

// Deja la consulta limpia para el buscador: sin "oye bro" ni "qué es".
const consulta = q => String(q)
  .replace(/^(oye|ey|bro|hermano|pues|bueno|a ver)[\s,]+/gi, "")
  .replace(/^(y\s+)?qu[eé]\s+(es|son|significa)\s+/i, "")
  .replace(/\s+/g, " ").trim().slice(0, 200) || String(q).slice(0, 200);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/__/auth/") || url.pathname.startsWith("/__/firebase/")) {
      const destino = new URL(url.pathname + url.search, FIREBASE);
      return fetch(new Request(destino, request), { redirect: "manual" });
    }
    if (url.pathname === "/api/previa" && request.method === "GET") return previa(request, ctx);
    if (url.pathname === "/api/ia" && request.method === "POST") return ia(request, env);
    return env.ASSETS.fetch(request);
  }
};
