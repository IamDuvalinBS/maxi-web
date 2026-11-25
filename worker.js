// 1) Reenvía las rutas de login de Firebase (/__/auth y /__/firebase) a firebaseapp.com
//    para que el login con Google funcione en este dominio.
// 2) /api/previa?u=<enlace>: arma la previa de un enlace (título, descripción, imagen) para los chats.
//    El resto lo sirve la página normal.
const FIREBASE = "https://maxi-bot-b7dfc.firebaseapp.com";

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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/__/auth/") || url.pathname.startsWith("/__/firebase/")) {
      const destino = new URL(url.pathname + url.search, FIREBASE);
      return fetch(new Request(destino, request), { redirect: "manual" });
    }
    if (url.pathname === "/api/previa" && request.method === "GET") return previa(request, ctx);
    return env.ASSETS.fetch(request);
  }
};
