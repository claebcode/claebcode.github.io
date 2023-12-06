// Create Header
let header = document.querySelector("header");
function createHeader(pageI, type) {
    header.innerHTML = `
    <div class="title nav-item" onclick="location.pathname='portfolio/index.html'">
        <div>Caleb Early :: Portfolio</div>
    </div>
    <nav>
        <a href="index.html" class="nav-item ${pageI == 0 ? "sel" : ""}">Home</a>
        <div class="nav-item nav-projects ${pageI == 1 ? "sel" : ""}">
            <div>${type == 0 ? "Large Projects" : type == 1 ? "Experiments" : type == 2 ? "Libraries" : "Projects"}</div>
            <div class="nav-cover"></div>
            <div class="nav-list">
                <a href="large_projects.html">Large Projects</a>
                <a href="experiments.html">Experiments</a>
                <a href="libraries.html">Libraries</a>
            </div>
        </div>
        <a href="about.html" class="nav-item ${pageI == 2 ? "sel" : ""}">About</a>
    </nav>
    <div>
        <div class=""></div>
    </div>
    `;
    let aList = header.querySelectorAll("a");
    let nav = header.querySelector("nav");
    for (let i = 0; i < aList.length; i++) {
        let a = aList[i];
        a.addEventListener("click", e => {
            for (let j = 0; j < nav.children.length; j++) {
                // if(nav.children[j] == a) continue;
                nav.children[j].style.transition = "0.05s";
                nav.children[j].classList.remove("sel");
            }
            if (a.classList.contains("nav-item"))
                a.classList.add("sel");
            else
                nav.children[1].classList.add("sel");
        });
    }
    let navProjects = document.querySelector(".nav-projects");
    navProjects.addEventListener("mouseenter", e => {
        navProjects.classList.add("open");
    });
    navProjects.addEventListener("mouseleave", e => {
        navProjects.classList.remove("open");
    });
}
let ending = false;
let scrollDir = 0;
let headerScrollThresh = innerHeight * 0.8;
header.addEventListener("animationend", e => {
    // header.classList.remove("onstart","onend");
    if (e.animationName == "HeaderEndSticky") {
        ending = false;
    }
});
document.addEventListener("wheel", e => {
    scrollDir = e.deltaY > 0 ? 1 : -1;
});
document.addEventListener("scroll", e => {
    // if(scrollY > 200) document.body.classList.add("scrolledDown");
    // else document.body.classList.remove("scrolledDown");
    if (scrollY > headerScrollThresh) {
        ending = true;
        header.classList.add("onstart");
        header.classList.remove("onend");
    }
    // else if(scrollY < 200 && ending && scrollDir == -1){
    //     header.classList.remove("onend");
    //     header.classList.remove("onstart");
    // }
    else {
        ending = true;
        header.classList.add("onend");
        header.classList.remove("onstart");
    }
});
document.addEventListener("DOMContentLoaded", e => {
    if (scrollY > headerScrollThresh)
        header.classList.add("onstart");
});
//# sourceMappingURL=app.js.map