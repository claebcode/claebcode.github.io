let mobileMode = false;
// delete window.showSaveFilePicker; // temp for testing (disable the file system access api)

let swReg:ServiceWorkerRegistration;
if("serviceWorker" in navigator){
    window.addEventListener("load",async e=>{
        navigator.serviceWorker.register("out/service_worker.js").then(reg=>{
            console.log(":: Registered service worker successfully");
            swReg = reg;
        },err=>{
            console.warn("Failed to register service worker");
        }).catch(err=>{
            console.warn("Error while trying to register service worker:",err);
        });

        navigator.serviceWorker.ready.then(reg=>{
            console.log("READY - service worker");
        });
    });
}

let hasFileSystemAccess = ("showSaveFilePicker" in window);

// temp global stuff for mobile mode
let b_quickColor:ColorInputComponent;