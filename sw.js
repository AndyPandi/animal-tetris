'use strict';
// Bump this version whenever ANY packaged file changes. Upload this file last.
const VERSION = '2026.11.06.1';
const BASE = self.registration.scope;
const PREFIX = 'animal-blocks:' + BASE + ':';
const CACHE = PREFIX + VERSION;
const ASSETS = [
  'index.html', 'setup.html', 'pwa.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png',
  'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'
].map(path => new URL(path, BASE).href);
const ALLOWED = new Set(ASSETS);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // addAll commits only when the complete release downloads successfully.
    await cache.addAll(ASSETS.map(url => new Request(url, {cache: 'reload', redirect: 'error'})));
    // No skipWaiting: a new release must not replace a child's ongoing game.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Normalize optional launch parameters; PAR credentials are in the path.
  url.hash = ''; url.search = '';
  if (url.href === BASE) url.href = new URL('index.html', BASE).href;
  if (!ALLOWED.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const saved = await cache.match(url.href);
    if (saved) return saved;
    // Recover an individually evicted resource when a network is available.
    try {
      const response = await fetch(request);
      if (response.ok && !response.redirected) await cache.put(url.href, response.clone());
      return response;
    } catch {
      return new Response('오프라인 파일을 찾지 못했어요. 인터넷에 연결해 다시 열어 주세요.', {
        status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}
      });
    }
  })());
});
