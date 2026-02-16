// let serverURL = "http://localhost:3001";
// let serverURL = "https://claeb-rog.tail60cfd4.ts.net/";
// let serverURL = "https://next-overly-urchin.ngrok-free.app";
// let serverURL = "https://claebcode.top:3001";
// let serverURL = localStorage.getItem("customURL") ?? "https://1adb-185-73-8-100.ngrok-free.app";
let serverURL = localStorage.getItem("customURL") ?? "https://8d45-185-73-8-100.ngrok-free.app";
const AID = "__SE-"; // app id
let page = 0;
let isOffline = true;
try {
    // @ts-ignore
    let _ = __storyData;
}
catch (e) {
    isOffline = false;
}
//# sourceMappingURL=pre.js.map