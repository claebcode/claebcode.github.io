function initFullscreenImages() {
    let list = document.querySelectorAll("img.click");
    for (const c of list) {
        c.addEventListener("click", e => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            else
                c.requestFullscreen({ navigationUI: "show" });
        });
    }
}
document.addEventListener("DOMContentLoaded", e => {
    initFullscreenImages();
});
//# sourceMappingURL=post.js.map