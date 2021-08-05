// These will be replaced at build-time by generate-service-worker-plugin.js
const ASSETS = ["/","checksum.worker.js","downloader.worker.js","assets/default-icon.9d63d3cfa69f175efb0a137a4a1e7c09.png","js/vendors~icns~jszip.6bcaf5b487a02ececbf5.js","js/icns.fb444730dcea336ab7ff.js","js/jszip.adb1f58076fbe3ba2201.js","js/packager.ef766db0d1ed46c8042f.js","js/vendors~icns.8e58e8210ce44b3c2baa.js","js/vendors~jszip.29115363875de0255ae3.js","js/vendors~packager.4a77534abdfbf6666ea0.js"];
const CACHE_NAME = 'p4-b17fbd96aa5057e6646e9e8635040e4f0a9374c1395906583ec40af2bb7e87fa';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(i => i !== CACHE_NAME).map(i => caches.delete(i))))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  event.respondWith(
    fetch(event.request).catch(() => {
      url.search = '';
      return caches.match(new Request(url));
    })
  );
});
