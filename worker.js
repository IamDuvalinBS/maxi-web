// Reenvía las rutas de login de Firebase (/__/auth y /__/firebase) a firebaseapp.com
// para que el login con Google funcione en este dominio. El resto lo sirve la página normal.
const FIREBASE = "https://maxi-bot-b7dfc.firebaseapp.com";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/__/auth/") || url.pathname.startsWith("/__/firebase/")) {
      const destino = new URL(url.pathname + url.search, FIREBASE);
      return fetch(new Request(destino, request), { redirect: "manual" });
    }
    return env.ASSETS.fetch(request);
  }
};
