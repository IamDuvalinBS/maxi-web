// 1) Reenvía las rutas de login de Firebase (/__/auth y /__/firebase) a firebaseapp.com
//    para que el login con Google funcione en este dominio.
// 2) /api/previa?u=<enlace>: arma la previa de un enlace (título, descripción, imagen) para los chats.
//    El resto lo sirve la página normal.
const FIREBASE = "https://maxi-bot-b7dfc.firebaseapp.com";
const PROYECTO = "maxi-bot-b7dfc";
// Modelos de IA de Cloudflare Workers AI, en orden de preferencia: si uno falla o lo retiran, se prueba el siguiente.
// (llama-3.1-8b-instruct ya fue retirado el 30/05/2026.) El catálogo cambia: revisa https://developers.cloudflare.com/workers-ai/models/
const MODELOS = ["@cf/meta/llama-3.1-8b-instruct-fp8", "@cf/meta/llama-3.1-8b-instruct-fast", "@cf/meta/llama-3.2-3b-instruct", "@cf/google/gemma-4-26b-a4b-it"];
const SISTEMA = "Eres Mambo IA, la asistente de la página Mambo Bot (juegos, misiones, pases, canjes y chats de un bot de WhatsApp). Respondes siempre en español, con un tono amable y cercano, claro y breve (máximo unos 6 párrafos cortos). Si no sabes algo, lo dices. No inventes datos de la cuenta del usuario ni prometas premios. Puedes usar *negrita* y listas con guiones.";

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


// ── IA: solo para personas con sesión iniciada en la página ──
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
  if (!env.AI) return json({ ok: false, e: "sin-ia" }, 503);
  let body; try { body = await request.json(); } catch (_) { return json({ ok: false }, 400); }
  const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-12)
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ ok: false }, 400);
  let ultimo = "";
  for (const modelo of MODELOS) {
    try {
      const r = await env.AI.run(modelo, { messages: [{ role: "system", content: SISTEMA }, ...msgs], max_tokens: 700, temperature: 0.7 });
      const texto = String((r && (r.response || r.result || (r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content))) || "").trim();
      if (texto) return json({ ok: true, texto: texto.slice(0, 4000) });
      ultimo = modelo + ": respuesta vacía";
    } catch (err) { ultimo = modelo + ": " + String((err && err.message) || err); }
  }
  return json({ ok: false, e: "ia", d: ultimo.slice(0, 200) }, 503);
}

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
