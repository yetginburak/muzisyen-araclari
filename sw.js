// Repertuar Defteri offline support. Pages come from the network first so a new upload
// shows up; without a connection the last copy is used. Fonts are kept once fetched.
var CACHE = "repertuar-v33";
var CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

function keep(req, res){
  if (res && (res.ok || res.type === "opaque")){
    var copy = res.clone();
    caches.open(CACHE).then(function(c){ c.put(req, copy); });
  }
  return res;
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin === self.location.origin){
    e.respondWith(fetch(req).then(function(res){ return keep(req, res); }).catch(function(){
      return caches.match(req, {ignoreSearch: true}).then(function(hit){ return hit || caches.match("index.html"); });
    }));
    return;
  }
  if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname) || url.hostname === "cdnjs.cloudflare.com"){
    e.respondWith(caches.match(req).then(function(hit){
      return hit || fetch(req).then(function(res){ return keep(req, res); });
    }));
  }
});
