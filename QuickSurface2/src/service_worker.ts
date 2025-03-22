console.log("$ started service worker");

self.addEventListener("install",e=>{
    // alert("install");
    console.log("-- install");
});

self.addEventListener("activate",e=>{
    // alert("activate");
    console.log("-- activate");
});

self.addEventListener("fetch",(e:any)=>{
    let event = e;
    // alert("fetch");
    // console.log("-- fetch",e.request);
    // … either respond with the cached object or go ahead and fetch the actual URL
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                // retrieve from cache
                return response;
            }

            // if not found in cache, return default offline content (only if this is a navigation request)
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }

            // fetch as normal
            return fetch(event.request);
        })
    );
});