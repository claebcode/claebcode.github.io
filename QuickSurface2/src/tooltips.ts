interface TooltipOps{
    name?:string;
    desc?:string;
}

class Tooltip{
    d:HTMLElement;
    load(){
        openedTooltips.add(this);
    }
    close(){
        openedTooltips.delete(this);
        if(this.d?.parentElement) this.d.remove();
        this.d = null;
        whenLastClosedTooltip = performance.now();
    }
}
class BasicTooltip extends Tooltip{
    constructor(name:string,desc:string,icon?:string){
        super();
        this.name = name;
        this.desc = desc;
        this.icon = icon;
    }
    name:string;
    desc:string;
    icon?:string;
    load(): void {
        super.load();
        this.d.innerHTML = `
            <h4><img draggable="false" class="icon ${!this.icon?"hidden":""}" src="${this.icon??""}"><span>${this.name}</span></h4>
            <p>${this.desc}</p>
        `;
        // console.log("LOADED");
    }
}

function registerTooltip_basic(elm:Element,ops:TooltipOps){
    
}

let openedTooltips = new Set<Tooltip>();
let whenLastClosedTooltip = -1;

function closeAllTooltips(){
    for(const t of [...openedTooltips]){
        t.close();
    }
    openedTooltips.clear();
}

function registerTooltip(e:Element,tt:Tooltip){
    let elm = e as HTMLElement;

    elm.addEventListener("mouseenter",async e=>{
        if(mobileMode) return;

        // if(performance.now()-whenLastClosedTooltip > 300) await wait(500);
        // console.log(e.bubbles);
        // let ee = document.elementFromPoint(e.clientX,e.clientY);
        // if(ee.tagName == "IMG") ee = ee.parentElement;
        // console.log(ee,elm);
        // if(ee != elm) return;
        // if(ee) if(ee.classList.contains("dropdown-cont") && !ee.classList.contains("tooltip-cont")) return;
        // if(document.querySelector(".dropdown-cont")) return; // <-- tmp for now, breaks some things but fixes others

        let r = elm.getBoundingClientRect();
        
        closeAllTooltips();

        let dirs = new Set("r");
        let margin = 7.5;
        let x = r.left;
        let y = r.top;

        // auto correction
        if(r.left > innerWidth*0.5){
            dirs.delete("r");
            dirs.add("l");
        }
        if(r.top > innerHeight*0.8){
            dirs.add("u");
            x += r.width + margin;
            // y -= r.height + margin;
        }

        // 

        tt.d = document.createElement("div");
        tt.d.classList.add("dropdown-cont","tooltip-cont",...[...dirs].map(v=>"dir-"+v));

        if(dirs.has("r")){
            x += r.width + margin;
        }
        if(dirs.has("l")){
            x -= margin;
        }
        if(dirs.has("u")){
            y -= margin;
        }
        if(dirs.has("b")){
            y += r.height + margin;
        }
        
        tt.d.style.left = `${x}px`;
        tt.d.style.top = `${y}px`;

        tt.load();
        
        menuCont.appendChild(tt.d);

        // tt.d.addEventListener("mouseleave",e=>{
        //     tt.close();
        // });
    });
    elm.addEventListener("mouseleave",e=>{
        tt.close();
    });
}
function regBasicTooltip(elm:Element,name:string,desc:string,icon?:HistIcon|string){
    registerTooltip(elm,new BasicTooltip(name,desc,typeof icon == "string" ? icon : icon ? allIcons[icon] : undefined));
}