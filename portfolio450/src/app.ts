// Create Header
let header = document.querySelector("header");
function createHeader(pageI:number,type?:string){
    header.innerHTML = `
    <div class="title nav-item" onclick="location.pathname='portfolio/index.html'">
        <div>Caleb Early :: FILA-450 Portfolio</div>
    </div>
    <nav>
        <a href="index.html" class="nav-item ${pageI==0?"sel":""}">Home</a>
        <a href="reflective_essay.html" class="nav-item ${pageI==1?"sel":""}">Reflective Essay</a>
        <div class="nav-item nav-projects nav-dd ${pageI==2?"sel":""}" style="--h:250px">
            <div>${(pageI == 2 && type != undefined) ? type : "Artifacts"}</div>
            <div class="nav-cover"></div>
            <div class="nav-list">
                <a href="large_projects.html">Integration & Experiential Learning</a>
                <a href="experiments.html">Diverse Perspectives</a>
                <a href="libraries.html">Public Discourse</a>
                <a href="libraries.html">Global Citizenship</a>
                <a href="libraries.html">Ethical Reasoning</a>
            </div>
        </div>
        <div class="nav-item nav-projects nav-dd ${pageI==3?"sel":""}" style="--h:135px">
            <div>${(pageI == 3 && type != undefined) ? type : "Stand-Alone Artifacts"}</div>
            <div class="nav-cover"></div>
            <div class="nav-list">
                <a href="oral_communication.html">Oral Communication</a>
                <a href="data_analysis.html">Data Analysis</a>
                <a href="it_artifact.html">IT Artifact</a>
            </div>
        </div>
        <a href="about.html" class="nav-item ${pageI==4?"sel":""}">About</a>
    </nav>
    `;

    let aList = header.querySelectorAll("a");
    let nav = header.querySelector("nav");
    for(let i = 0; i < aList.length; i++){
        let a = aList[i];
        a.addEventListener("click",e=>{
            for(let j = 0; j < nav.children.length; j++){
                (nav.children[j] as HTMLElement).style.transition = "0.05s";
                nav.children[j].classList.remove("sel");
            }
            if(a.classList.contains("nav-item")) a.classList.add("sel");
            else nav.children[1].classList.add("sel");
        });
    }

    let navDropdowns = document.querySelectorAll<HTMLElement>(".nav-dd");
    for(const c of navDropdowns){
        c.addEventListener("mouseenter",e=>{
            c.classList.add("open");
        });
        c.addEventListener("mouseleave",e=>{
            c.classList.remove("open");
        });
    }
}

let ending = false;
let scrollDir = 0;
let headerScrollThresh = innerHeight*0.8;
header.addEventListener("animationend",e=>{
    if(e.animationName == "HeaderEndSticky"){
        ending = false;
    }
});
document.addEventListener("wheel",e=>{
    scrollDir = e.deltaY > 0 ? 1 : -1;
});
document.addEventListener("scroll",e=>{
    if(scrollY > headerScrollThresh){
        ending = true;
        header.classList.add("onstart");
        header.classList.remove("onend");
    }
    else{
        ending = true;
        header.classList.add("onend");
        header.classList.remove("onstart");
    }
});
document.addEventListener("DOMContentLoaded",e=>{
    if(scrollY > headerScrollThresh) header.classList.add("onstart");
});