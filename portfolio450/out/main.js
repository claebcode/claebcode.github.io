console.log("page loaded");
let sections = [
    // document.querySelector(".hero"),
    document.querySelector(".s-main-projects"),
    document.querySelector(".s-contact")
];
const main = document.querySelector(".main");
function makeGrid() {
    let can = document.createElement("canvas");
    can.width = 100;
    can.height = 100;
    let ctx = can.getContext("2d");
    ctx.fillStyle = "whitesmoke";
    ctx.fillRect(0, 0, can.width, can.height);
    ctx.strokeStyle = "rgba(0,0,0,0.05)";
    let can2 = can.cloneNode();
    let ratio = 0.5;
    let inc = can.width * ratio;
    for (let x = 0; x < can.width; x += inc) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, can.height);
        ctx.stroke();
    }
    for (let y = 0; y < can.height; y += inc) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(can.width, y);
        ctx.stroke();
    }
}
function wait(delay) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, delay);
    });
}
async function fadeInSections() {
    await wait(200);
    let sections = document.querySelector(".sections");
    for (let i = 0; i < sections.children.length; i++) {
        let c = sections.children[i];
        c.classList.add("fadeElement");
        let toId = setTimeout(() => {
            c.classList.add("fadeUp");
        }, i * 200 + 100);
        c.addEventListener("mouseenter", e => {
            c.classList.add("fadeUp");
            clearTimeout(toId);
        });
    }
}
makeGrid();
let section_mainProjects = document.querySelector(".s-main-projects");
function initViewMoreButtons() {
    let len = sections.length - 1;
    len = 1;
    for (let i = 0; i < len; i++) {
        let section = sections[i];
        let div = document.createElement("div");
        div.className = "d-view-more";
        div.innerHTML = `
            <div class="b-view-more"><img src="assets/angles-down-solid.svg" alt=""></div>
        `;
        section.appendChild(div);
        div.addEventListener("click", e => {
            sections[i + 1].scrollIntoView({ behavior: "smooth" });
        });
    }
}
initViewMoreButtons();
function mail() {
    let email = document.querySelector(".i-email");
    let name = document.querySelector(".i-name");
    let msg = document.querySelector(".i-message");
    let s = `mailto:claebcode@gmail.com?subject=${"Contact from: " + name.value} (${email.value})&body=${msg.value}`;
    let a = document.createElement("a");
    a.href = s;
    a.click();
}
//# sourceMappingURL=main.js.map