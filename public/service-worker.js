importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const routing = workbox.routing;
const strategies = workbox.strategies;

workbox.routing.registerRoute(
  /\.(?:js|css|webp|png|svg)$/,
  new workbox.strategies.StaleWhileRevalidate({
    'cacheName': 'assets',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 1000,
        maxAgeSeconds: 31536000
      })
    ]
  })
);

workbox.routing.registerRoute(
  /\.(?:png|jpg|jpeg|gif|avif|webp)$/,
  new workbox.strategies.CacheFirst({
    'cacheName': 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 1000,
        maxAgeSeconds: 31536000
      })
    ]
  })
);

workbox.routing.registerRoute(
  /(\/)$/,
  new workbox.strategies.NetworkFirst({
    'cacheName': 'html',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 1000,
        maxAgeSeconds: 31536000
      })
    ]
  })
);

