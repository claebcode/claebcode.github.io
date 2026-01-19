function setupClickImage(c) {
    c.addEventListener("click", e => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        else
            c.requestFullscreen({ navigationUI: "show" });
    });
}
// document.onfullscreenchange = e=>{
//     console.log("change",document.fullscreenElement);
// };
function initFullscreenImages() {
    let list = document.querySelectorAll(".click");
    for (const c of list) {
        setupClickImage(c);
    }
}
function initImageCarousels() {
    let list = document.querySelectorAll(".image-carousel");
    for (const c of list) {
        let imgs = [...c.children];
        for (const c2 of imgs) {
            setupClickImage(c2);
            c2.classList.add("click");
            c2.remove();
        }
        let index = 0;
        function updateImg() {
            if (index >= imgs.length)
                index = 0;
            else if (index < 0)
                index = imgs.length - 1;
            imgCont.innerHTML = "";
            let elm = imgs[index];
            imgCont.appendChild(elm);
            if (elm.tagName == "VIDEO") {
                elm.play();
            }
            l_index.textContent = (index + 1).toString();
        }
        c.innerHTML = `
            <div class="images"></div>
            <div class="controls">
                <div>
                    <button>Last</button>
                    <button>Next</button>
                </div>
                <div>
                    <span class="index" style="min-width:18px;display:inline-block">${index}</span><span> / ${imgs.length}</span>
                </div>
            </div>
        `;
        let l_index = c.querySelector(".index");
        let imgCont = c.children[0];
        let bLast = c.children[1].children[0].children[0];
        let bNext = c.children[1].children[0].children[1];
        bLast?.addEventListener("click", e => {
            index--;
            updateImg();
        });
        bNext?.addEventListener("click", e => {
            index++;
            updateImg();
        });
        updateImg();
        // for(const c2 of imgs){
        //     c.children[0].appendChild(c2);
        // }
    }
}
document.addEventListener("DOMContentLoaded", e => {
    initFullscreenImages();
    initImageCarousels();
});
//# sourceMappingURL=post.js.map