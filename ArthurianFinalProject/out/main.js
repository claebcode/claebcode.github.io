let page = 0;
const text = document.querySelector(".text");
const quote = document.querySelector(".quote");
let turning = false;
function navLeft() {
    if (turning)
        return;
    page--;
    if (page < 0) {
        page = 0;
        return;
    }
    l_page.textContent = (page + 1).toString();
    let e = data.evts[page];
    let state = e.state;
    if (state) {
        text.innerHTML = state.text;
        quote.innerHTML = state.quote;
    }
}
function navRight() {
    if (turning)
        return;
    if (page >= data.evts.length - 1)
        return;
    page++;
    l_page.textContent = (page + 1).toString();
    run(data.evts[page]);
}
let l_page = document.querySelector(".l-page");
let b_left = document.querySelector(".nav-left");
let b_right = document.querySelector(".nav-right");
b_left.addEventListener("click", e => {
    navLeft();
});
b_right.addEventListener("click", e => {
    navRight();
});
document.addEventListener("keydown", e => {
    let k = e.key.toLowerCase();
    if (k == "arrowleft")
        navLeft();
    else if (k == "arrowright" || k == "enter" || k == " ")
        navRight();
});
function wait(delay) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, delay);
    });
}
async function run(e) {
    if (turning)
        return;
    turning = true;
    if (!e) {
        alert("Finished");
        return;
    }
    if (e.clearAll) {
        text.textContent = "";
        quote.textContent = "";
    }
    else if (e.clearText)
        text.textContent = "";
    else if (e.clearQuote)
        quote.textContent = "";
    if (e.type == "text") {
        if (e.title) {
            let title = document.createElement("div");
            title.classList.add("title");
            title.textContent = e.title;
            text.appendChild(title);
            await wait(500);
        }
        let parts = (typeof e.text == "string" ? e.text.split("\n") : e.text);
        let i = 0;
        for (let s of parts) {
            s = s.replaceAll("T.H. White", "T.H.\tWhite");
            let delim = [
                ". ",
                "? ",
                ": ",
                "! "
            ];
            for (const d of delim) {
                let has = s.includes(d);
                if (!has)
                    continue;
                s = s.replaceAll(d, d + "\n");
            }
            let extra = s.split("\n");
            parts.splice(i, 1);
            parts.splice(i, 0, ...extra);
            s = extra[0];
            let cpy = [
                "The Historia Regum Britanniae",
                "King Arthur (2004)",
                "Le Morte D’arthur",
                "Sword in the Stone",
                // "Excalibur",
                "The Once and Future King"
            ];
            for (const cp of cpy) {
                s = s.replaceAll(cp, "i[" + cp + "]");
            }
            s = s.replace(/]/g, "</span>");
            s = s.replaceAll("i[", "<span class='italic'>");
            await wait(100);
            let div = document.createElement("div");
            div.innerHTML = s;
            text.appendChild(div);
            i++;
        }
    }
    if (e.type == "quote" || e.quote != null) {
        if (e.type == "quote") {
            let div2 = document.createElement("div");
            div2.classList.add("quote-hint");
            div2.textContent = "(Quote)";
            text.appendChild(div2);
        }
        let div = document.createElement("div");
        div.innerHTML = `
            <div>${e.quote ?? e.text}</div>
            <div class="cit">${e.cit}.</div>
        `;
        quote.appendChild(div);
    }
    e.state = {
        text: text.innerHTML,
        quote: quote.innerHTML
    };
    await wait(100);
    turning = false;
}
page = 0;
run(data.evts[page]);
//# sourceMappingURL=main.js.map