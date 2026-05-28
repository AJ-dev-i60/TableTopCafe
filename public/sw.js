// Minimal service worker — installs and activates without caching.
// Exists solely to satisfy PWA installability criteria.
// A caching strategy can be added in a later milestone.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
