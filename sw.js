/* Offline cache for the capsule wardrobe page.
   Bump VERSION when you publish a new index.html so phones pick it up. */
const VERSION='capsule-v3';
const ASSETS=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
const FONT_HOSTS=['fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    /* page + icons: show the saved copy straight away, refresh it in the background */
    e.respondWith(caches.open(VERSION).then(async c=>{
      const hit=await c.match(req,{ignoreSearch:true});
      const net=fetch(req).then(r=>{if(r&&r.ok)c.put(req,r.clone());return r;}).catch(()=>null);
      return hit||(await net)||(req.mode==='navigate'?c.match('index.html'):Response.error());
    }));
  }else if(FONT_HOSTS.includes(url.hostname)){
    /* fonts: keep the first copy for offline use */
    e.respondWith(caches.open(VERSION).then(async c=>{
      const hit=await c.match(req);if(hit)return hit;
      try{const r=await fetch(req);c.put(req,r.clone());return r;}catch(err){return Response.error();}
    }));
  }
});
