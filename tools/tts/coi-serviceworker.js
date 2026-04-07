/*! coi-serviceworker v0.1.7 - Guido Zuidhof, licensed under MIT */
let coepCredentialless = false;
if (typeof window === 'undefined') {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
  self.addEventListener("message", (e) => {
    if (e.data && e.data.type === "deregister") {
      self.registration.unregister().then(() => self.clients.matchAll()).then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      });
    }
  });
  self.addEventListener("fetch", function (e) {
    if (e.request.cache === "only-if-cached" && e.request.mode !== "same-origin") return;
    e.respondWith(
      fetch(e.request).then((r) => {
        if (r.status === 0) return r;
        const headers = new Headers(r.headers);
        headers.set("Cross-Origin-Embedder-Policy", coepCredentialless ? "credentialless" : "require-corp");
        headers.set("Cross-Origin-Opener-Policy", "same-origin");
        return new Response(r.body, { status: r.status, statusText: r.statusText, headers });
      }).catch((e) => console.error(e))
    );
  });
} else {
  (() => {
    const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
    window.sessionStorage.removeItem("coiReloadedBySelf");
    const coHeaders = new Headers();
    coHeaders.set("Cross-Origin-Embedder-Policy", "credentialless");
    coHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
    coepCredentialless = true;
    if (window.crossOriginIsolated !== false && reloadedBySelf === "true") {
      return;
    }
    if (window.crossOriginIsolated) return;
    window.sessionStorage.setItem("coiReloadedBySelf", "true");
    const url = window.location.href;
    if (!navigator.serviceWorker) {
      console.error("COOP/COEP Service Worker: Service workers are not supported.");
      return;
    }
    navigator.serviceWorker.register(new URL("coi-serviceworker.js", window.location.href).href).then(
      (registration) => {
        console.log("COOP/COEP Service Worker registered", registration.scope);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker.addEventListener("statechange", () => {
            if (worker.state === "activated") window.location.reload();
          });
        });
        if (registration.active && !navigator.serviceWorker.controller) {
          window.location.reload();
        }
      },
      (err) => console.error("COOP/COEP Service Worker failed to register:", err)
    );
  })();
}