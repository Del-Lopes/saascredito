/* Service Worker — PWA "Gestão de Crédito"
 *
 * Estratégia conservadora (app financeiro): NÃO cacheamos páginas nem chamadas
 * de dados — dinheiro precisa estar sempre fresco. Cacheamos apenas os assets
 * estáticos versionados do Next (/_next/static) e os ícones, para instalar e
 * abrir rápido. Tudo o mais é sempre rede.
 */

const CACHE = "gc-static-v1"
const PRECACHE = ["/icons/icon-192.png", "/icons/icon-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Assets estáticos versionados do Next: cache-first (são imutáveis).
  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/")

  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
            return res
          })
      )
    )
    return
  }

  // Todo o resto (páginas, dados): rede sempre. Sem cache de dados financeiros.
})
