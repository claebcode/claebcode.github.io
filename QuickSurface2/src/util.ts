class UniversalMouseEvent{
    constructor(e1?:MouseEvent,e2?:PointerEvent,e3?:TouchEvent){
        // if(curUEv){
        //     this._invalid = true;
        //     return;
        // }
        // curUEv = this;

        this.e1 = e1;
        this.e2 = e2;
        this.e3 = e3;
        
        if(e1){
            let e = e1;
            this.eventType = 0;
            this.clientX = e.clientX;
            this.clientY = e.clientY;
            this.button = e.button;
        }
        // else if(e2){
        //     let e = e2;
        //     this.eventType = 1;
        //     this.clientX = e.clientX;
        //     this.clientY = e.clientY;
        //     this.button = e.button;
        // }
        else if(e3){
            let e = e3;
            this.eventType = 2;
            this.touches = e.touches;

            let t1 = e.touches[0];
            let t2 = e.touches[1];
            if(e.touches.length == 0){
                this.clientX = cmx;
                this.clientY = cmy;
            }
            else if(e.touches.length == 1){
                this.clientX = t1.clientX;
                this.clientY = t1.clientY;
            }
            else{
                this.clientX = (t1.clientX+t2.clientX)/2;
                this.clientY = (t1.clientY+t2.clientY)/2;
            }
            this.button = 0;

            if(this.touches.length == 2) e.preventDefault(); // prevents super laggy zooming
        }

        let e = this.getE();
        if(e){
            this.shiftKey = e.shiftKey;
            this.ctrlKey = e.ctrlKey;
            this.altKey = e.altKey;
            this.metaKey = e.metaKey;
        }
    }
    clientX:number;
    clientY:number;
    button:number;
    
    shiftKey:boolean;
    ctrlKey:boolean;
    altKey:boolean;
    metaKey:boolean;

    touches:TouchList;

    eventType:number;
    e1?:MouseEvent;
    e2?:PointerEvent;
    e3?:TouchEvent;
    _invalid = false;
    getE(){
        // return (this.e1 ? this.e1 : this.e2 ? this.e2 : this.e3);
        return this.e1 ?? this.e2 ?? this.e3;
    }
    preventDefault(){
        let e = this.getE();
        e?.preventDefault();
    }
    stopPropagation(){
        let e = this.getE();
        e?.stopPropagation();
    }
    stopImmediatePropagation(){
        let e = this.getE();
        e?.stopImmediatePropagation();
    }
    isValid(){
        if(this._invalid) return false;
        if(this.eventType == null) return false;
        return true;
    }
}
let curUEv:UniversalMouseEvent;
function endCurUEv(){
    curUEv = null;
}
function onDown(f:(e:UniversalMouseEvent)=>void,e?:HTMLElement){    
    if(e == null) e = document.body;
    e.addEventListener("mousedown",e=>{        
        let ev = new UniversalMouseEvent(e);
        if(ev.isValid()) f(ev);
        endCurUEv();
    });
    e.addEventListener("pointerdown",e=>{
        let ev = new UniversalMouseEvent(null,e);
        if(ev.isValid()) f(ev);
        endCurUEv();
    });
    e.addEventListener("touchstart",e=>{
        let ev = new UniversalMouseEvent(null,null,e);
        if(ev.isValid()) f(ev);
        endCurUEv();
    },{
        passive:false
    });
}
function onUp(f:(e:UniversalMouseEvent)=>void,e?:HTMLElement){
    if(e == null) e = document.body;
    e.addEventListener("mouseup",e=>{
        let ev = new UniversalMouseEvent(e);
        if(ev.isValid()) f(ev);
        endCurUEv();
    });
    e.addEventListener("pointerup",e=>{
        let ev = new UniversalMouseEvent(null,e);
        if(ev.isValid()) f(ev);
        endCurUEv();
    });
    e.addEventListener("touchend",e=>{
        let ev = new UniversalMouseEvent(null,null,e);
        if(ev.isValid()) f(ev);
        endCurUEv();
    },{
        passive:false
    });
}
function onMove(f:(e:UniversalMouseEvent)=>void,e?:HTMLElement){
    if(e == null) e = document.body;
    e.addEventListener("mousemove",e=>{
        let ev = new UniversalMouseEvent(e);
        if(ev.isValid()) f(ev);
        endCurUEv();
    });
    e.addEventListener("pointermove",e=>{
        let ev = new UniversalMouseEvent(null,e);
        if(ev.isValid()) f(ev);
        endCurUEv();
    });
    e.addEventListener("touchmove",e=>{
        let ev = new UniversalMouseEvent(null,null,e);
        if(ev.isValid()) f(ev);
        endCurUEv();
    },{
        passive:false
    });
}

// 

function _getPanelList(){
    let list:Panel[] = [];
    // if(inst.bottomPanel) list.push(inst.bottomPanel);
    list.push(...inst.bottomPanel);
    list.push(...inst.leftPanel);
    list.push(...inst.rightPanel);
    return list;
}
function updateAllPanels(){
    if(_noUpdatePanel) return;
    let list = _getPanelList();
    for(const p of list){
        if(p.canUpdate()) p.update();
    }
}
function loadAllPanels(){
    let list = _getPanelList();
    for(const p of list){
        p.load();
    }
}
function updatePanel(id:string){
    if(_noUpdatePanel) return;
    let list = _getPanelList();
    for(const p of list){
        if(p.getId() == id){
            if(p.canUpdate()) p.update();
        }
    }
}
function loadPanel(id:string){
    let list = _getPanelList();
    for(const p of list){
        if(p.getId() == id){
            p.load();
        }
    }
}
function getPanel<T extends Panel>(id:string,call?:(p:T)=>void){
    let list = _getPanelList();
    for(const p of list){
        if(p.getId() == id){
            // @ts-ignore
            if(call) call(p);
        }
    }
}
function getPanelById<T extends Panel>(id:string){
    let list = _getPanelList();
    for(const p of list){
        if(p.getId() == id){
            return p;
        }
    }
}
let _noUpdatePanel = false;
function start_noUpdatePanel(){
    _noUpdatePanel = true;
}
function end_noUpdatePanel(){
    _noUpdatePanel = false;
}
enum PanelLoc{
    bottom,
    right,
    left
}
let curPanel:Panel;
function setCurPanel(p:Panel){
    curPanel = p;
}
abstract class Panel{
    constructor(loc:PanelLoc,add=false,overflowX:boolean,overflowY:boolean){
        let panel = document.createElement("div");
        panel.classList.add("panel-cont");
        let panelElm:HTMLElement;
        // if(loc == PanelLoc.bottom) panelElm = document.querySelector(".bottom-pane");
        // else if(loc == PanelLoc.right) panelElm = document.querySelector(".right-pane");
        // else if(loc == PanelLoc.left) panelElm = document.querySelector(".left-pane");
        this.panel = panel;
        this.overflowX = overflowX;
        this.overflowY = overflowY;
        this.loc = loc;
        this.panelElm = panelElm;
        // if(panelElm) panelElm.appendChild(panel);

        if(loc == PanelLoc.left || loc == PanelLoc.right){
            panel.setAttribute("resize","d");
            setupResize(panel);
            // this.panel.style.height = "100%";
        }
        else if(loc == PanelLoc.bottom){
            panel.setAttribute("resize","r");
            setupResize(panel);
            // this.panel.style.width = "100%";
            // this.panel.style.width = "";
        }

        // this.panel.style.overflowX = (this.overflowX ? "scroll" : "hidden");
        // this.panel.style.overflowY = (this.overflowY ? "scroll" : "hidden");

        panel.addEventListener("mouseenter",e=>{
            setCurPanel(this);
        });
        panel.addEventListener("mouseleave",e=>{
            setCurPanel(null);
        });
    }
    overflowX:boolean;
    overflowY:boolean;
    panelElm:HTMLElement;
    panel:HTMLElement;
    loc:PanelLoc;
    getId(){
        return "";
    }
    abstract getName():string;
    load(){}
    toggle(){}
    update(){}
    tick(){}
    canUpdate(){
        if(_noUpdatePanel) return;
        // return false;
        if(selProject){
            if(selProject.hist._isBare) return false;
        }
        else if(__tmpProject) if(__tmpProject.hist._isBare) return false;
        return true;
    }
    onEndResize(){}

    addToLoc(_loc?:PanelLoc,ind?:number){
        let loc = _loc ?? this.loc;

        if(loc == PanelLoc.bottom) this.panelElm = document.querySelector(".bottom-pane");
        else if(loc == PanelLoc.right) this.panelElm = document.querySelector(".right-pane");
        else if(loc == PanelLoc.left) this.panelElm = document.querySelector(".left-pane");

        if(ind == undefined) this.panelElm.appendChild(this.panel);
        else this.panelElm.insertBefore(this.panel,this.panelElm.children[ind+1]);

        let list = [...this.panelElm.children].filter(v=>v.classList.contains("panel-cont")) as HTMLElement[];
        let r = this.panelElm.getBoundingClientRect();
        let prop = "height";
        let propOffset = "offsetHeight";
        if(this.panelElm.classList.contains("horz-pane")){
            prop = "width";
            propOffset = "offsetWidth";
        }
        for(const e of list){
            // e.style.height = `${100/list.length}%`; // <-- old method that isn't great
            e.style[prop] = `${this.panelElm[propOffset]/list.length}px`; // <-- old method that isn't great
            
            // new method
            // e.style.height = (r.height-(e.getBoundingClientRect().top-r.top))+"px";
        }

        setTimeout(()=>postDragPanelCont(this.panel),0);
    }

    colorUpdate(){}

    // 

    header:HTMLElement;
    body:HTMLElement;
    opComp:MenuComponent;

    // you should call these after load()
    init(){
        let p = this.panel;
        removeAllChildren(p);
    }
    genHeader(title:string){
        let header = document.createElement("div");
        header.className = "header2";
        header.innerHTML = `
            <div class="header-title">${title}</div>
            <div class="ops"></div>
        `;
        this.header = header;
        this.panel.appendChild(header);
        this.opComp = new MenuComponent(header.querySelector(".ops"));
        if(!mobileMode) setupDropdown(header.children[0] as HTMLElement,"d",[
            {
                label:"",
                onview:(d, cont)=>{
                    if(mobileMode) return;
                    cont.textContent = "";
                    let list = [
                        new TimelinePanel(this.loc),
                        new HistoryPanel(this.loc,false),
                        new ColorPanel(this.loc),
                        new MiniPreviewPanel(this.loc),
                        new MixerPanel(this.loc),
                        new EditPixelsPanel(this.loc),
                        new FolderViewPanel(this.loc),
                    ];
                    for(const t of list){
                        let div = document.createElement("div");
                        div.className = "dropdown-item";
                        // div.innerHTML = `<div class="dd-icon"></div><div class="dd-text">${t.constructor.name}</div>`;
                        div.innerHTML = `<div class="dd-icon"></div><div class="dd-text">${t.getName()}</div>`;
                        cont.appendChild(div);
                        div.addEventListener("click",e=>{
                            let o = Object.create(t);
                            // inst.removePanel(this);
                            // this.panelElm.replaceChild(o.panel,this.panel);
                            // inst.addPanel(o);
                            inst.replacePanel(this,o);
                            o.load();
                        });
                    }
                },
            }
        ]);
    }
    genBody(){
        let body = document.createElement("div");
        body.className = "panel-body";
        body.classList.add("panel-"+this.getId());
        this.body = body;
        this.panel.appendChild(body);
        body.style.overflowX = (this.overflowX?"scroll":"hidden");
        body.style.overflowY = (this.overflowY?"scroll":"hidden");
        // if(this.loc == PanelLoc.right || this.loc == PanelLoc.left) body.style.overflowY = "scroll";
        // else if(this.loc == PanelLoc.bottom) body.style.overflowX = "scroll";
        // this.body.style.overflowX = (this.overflowX ? "scroll" : "hidden");
        // this.body.style.overflowY = (this.overflowY ? "scroll" : "hidden");
        // this.body.style.height = "100%";
    }
    createHeaderOption(icon:string|HistIcon,onclick:(e:MouseEvent)=>void,name?:string,desc?:string){
        return this.opComp.createIconBtn(icon,onclick,name,desc);
    }
}


class Instance{
    constructor(){
        this.bottomPanel = [];
        this.rightPanel = [];
        this.leftPanel = [];
    }
    
    bottomPanel:Panel[];
    rightPanel:Panel[];
    leftPanel:Panel[];

    addPanel(panel:Panel,noAdd=false){
        let ref = ["bottomPanel","rightPanel","leftPanel"][panel.loc];
        // panel.load();
        if(!ref){
            console.warn("Err: not a valid PanelLoc");
            return;
        }
        // if(ref == "bottomPanel") this[ref] = panel;
        this[ref].push(panel);
        // if(panel instanceof HistoryPanel) historyPanel = panel;
        panel.load();
        if(noAdd) panel.panel.remove();
        
        panel.addToLoc();
        
        return panel;
    }
    removePanel(panel:Panel){
        if(panel.panel.parentElement) panel.panel.remove();
        if(panel.loc == PanelLoc.bottom){
            this.bottomPanel = null;
        }
        else{
            let ref = ["bottomPanel","rightPanel","leftPanel"][panel.loc];
            let list = this[ref];
            let ind = list.indexOf(panel);
            if(ind != -1) list.splice(ind,1);
        }
    }
    replacePanel(from:Panel,to:Panel){
        let fromRef = ["bottomPanel","rightPanel","leftPanel"][from.loc];
        let fromList = this[fromRef] as Panel[];

        let ind = fromList.indexOf(from);
        if(ind != -1) fromList.splice(ind,1);
        from.panel.remove();
        fromList.splice(ind,0,to);

        to.load();
        to.addToLoc(undefined,ind);
        return to;
    }
}

// 

const hit = document.querySelector(".hit") as HTMLElement;
hit.addEventListener("contextmenu",e=>{
    e.preventDefault();
});
onDown(async e=>{
    e.stopPropagation();
    e.stopImmediatePropagation();
    // await wait(100);
    closeDropdowns();
    hit.classList.remove("show");
},hit);

function wait(delay:number){
    return new Promise<void>(resolve=>{
        setTimeout(()=>{
            resolve();
        },delay);
    });
}

let openDropdowns:HTMLElement[] = [];

interface DDItem{
    label?:string,
    type?:string,
    id?:string,
    icon?:string|HistIcon,
    onclick?:(d:HTMLElement,cont:HTMLElement)=>void
    onview?:(d:HTMLElement,cont:HTMLElement)=>void,
    dontCloseAfter?:boolean;
    case?:"normal"|"capitalize"|"lowercase"|"uppercase",

    data?:any;
}
interface DDOps{
    isRightClick?:boolean,
    ctrlClick?:boolean,
    offx?:number,
    openAfter?:boolean,
    noAdjust?:boolean,
    inMenuCont?:boolean,
    menuBar?:Element,
    noHit?:boolean,
    onClick?:(e:UniversalMouseEvent)=>void,
    onMainClick?:(e:UniversalMouseEvent)=>void,
    onOpen?:(cont:HTMLElement)=>void,
    noClassAdd?:boolean,

    // open dropdown ops
    postX?:number,
    postY?:number,

    /**
     * Only available for openDropdown(). Auto opens at the location of the element as if it was called with setupDropdown(). Has auto correction for if it opens off the right edge of the screen.
     */
    postParent?:HTMLElement;

    /**
     * Only available for openDropdown(). Uses the current cursor location for postX and postY, making the dropdown open at the mouse location.
     */
    useCursorLoc?:boolean;

    hasSearch?:boolean;
    // removableItems?:boolean; // implied by having onRemove set
    onRemove?:(item:DDItem,i:number)=>void;
}
function setupDropdown(e:HTMLElement,dir:string,data:DDItem[],replace=true,lvl=0,offy=0,ops?:DDOps){
    // e should be in format: <div><div>Label</div></div>
    // if(replace) closeDropdowns(); // <-- why was this here?
    
    let overCont = false;

    let ref:HTMLElement;

    function close(){
        if(ref){
            ref.remove();
            ref = null;
            e.classList.remove("hold");
            e.blur();
            _overDropdown = undefined;

            let ind = openDropdowns.indexOf(ref);
            if(ind != -1) openDropdowns.splice(ind,1);

            return true;
        }
        return false;
    }

    function open(){
        closeAllTooltips();
        if(!ops) ops = {};
        
        if(!ops?.noClassAdd) e.classList.add("dropdown-btn");
        // if(!ops?.noAdjust) if(close()) return;
        if(!ops?.noAdjust) close();
        let cont = document.createElement("div");
        cont.addEventListener("mouseenter",e=>{
            closeAllTooltips(); // <-- maybe temporary fix for using dropdowns and tooltips together would cause massive spamming
            _overDropdown = cont;
        });
        cont.addEventListener("contextmenu",e=>{
            e.preventDefault();
        });
        if(ops?.inMenuCont) menuCont.appendChild(cont);
        else e.appendChild(cont);
        ref = cont;
        cont.className = "dropdown-cont";

        openDropdowns.push(cont);

        // cont.innerHTML = `
        //     <div><div>Label 1</div></div>
        //     <div><div>Label 2</div></div>
        //     <div><div>Label 3</div></div>
        // `;

        if(ops.hasSearch){
            let search = document.createElement("div");
            search.className = "dd-search";
            search.innerHTML = `
                <input type="text" placeholder="Filter...">
            `;
            cont.appendChild(search);

            let inp = search.querySelector("input");
            inp.addEventListener("input",e=>{
                let q = inp.value || undefined;
                loadList(q);
            });
            inp.focus();
        }
        
        function loadList(query?:string){
            while(cont.children.length > 1){
                cont.removeChild(cont.children[1]);
            }

            let q = query != undefined ? query.toLowerCase().replaceAll(" ","") : undefined;
            
            let i = -1;
            for(const a of data){
                i++;
                if(query != undefined){
                    let t = a.label.toLowerCase().replaceAll(" ","");
                    if(!t.includes(q) && !q.includes(t)) continue; // didn't match
                }
                
                let d = document.createElement("div");
                if(a.type == "hr"){
                    d.innerHTML = "<hr>";
                    cont.appendChild(d);
                    continue;
                }
                if(a.case) d.style.textTransform = a.case;
                d.classList.add("dropdown-item");
                let icon = null;
                if(a.icon != null){
                    if(typeof a.icon == "string") icon = a.icon;
                    else icon = allIcons[HistIcon[a.icon]];
                }
                d.innerHTML = `
                    <div class="dd-icon">${icon?`<img src="${icon}">`:""}</div>
                    <div class="dd-text">${a.label||"[ No Label ]"}</div>
                `;
                cont.appendChild(d);
                if(ops.onRemove){
                    let b_remove = document.createElement("div");
                    b_remove.className = "dd-icon dd-remove";
                    b_remove.innerHTML = `<img src="${allIcons.clear}">`;
                    b_remove.style.marginLeft = "auto";
                    d.appendChild(b_remove);

                    b_remove.addEventListener("click",e=>{
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        ops.onRemove(a,i);
                    });
                }
                if(a.onview) a.onview(d,cont);
                d.onclick = function(e){
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    if(a.onclick) a.onclick(d,cont);
                    overCont = false; //to reset
                    if(!a.dontCloseAfter) closeDropdowns();
                    if(ops?.onClick) ops.onClick(new UniversalMouseEvent(e));
                };
            }
        }
        loadList();

        if(!ops?.noHit) hit.classList.add("show");
        e.classList.add("hold","dd-hold");

        cont.style.zIndex = (3+lvl).toString();

        cont.addEventListener("mousemove",e=>{
            overCont = true;
        });
        cont.addEventListener("mouseleave",e=>{
            overCont = false;
            _overDropdown = undefined;
        });

        let r = cont.getBoundingClientRect();
        // if(dir == "r" && r.left+Math.max(200,r.width) >= innerWidth-20) dir = "l";
        // if(dir == "b" && r.bottom+Math.max(200,r.height) >= innerHeight-20) dir = "u";
        cont.classList.add("dir-"+dir);
        let _offx = 0;
        let _offy = 0;
        if(dir == "l" || dir == "r"){
            if(r.top > innerHeight/2) _offy -= r.height-e.offsetHeight-1;
        }
        else if(dir == "u" || dir == "b"){
            if(r.left > innerWidth/2) _offx -= r.width-e.offsetWidth-1;
        }
        if(ops?.offx) _offx += ops.offx;
        if(offy) _offy += offy;
        cont.style.marginLeft = _offx+"px";
        cont.style.marginTop = _offy+"px";

        if(mobileMode){
            cont.classList.add("mobile-dd");
            menuCont.appendChild(cont);
            cont.style.zIndex = (menuCont.children.length+1).toString();
        }

        if(ops?.inMenuCont){
            let eR = e.getBoundingClientRect();
            console.log("R:",eR.height,r.height,dir);
            
            _offx = eR.x;
            _offy = eR.y;
            let margin = 5;
            if(dir == "u"){
                // _offy -= eR.height-margin + r.height;
                // _offy -= -margin + r.height;
            }
            cont.style.left = _offx+"px";
            cont.style.top = _offy+"px";
            cont.style.marginLeft = "0px";
            cont.style.marginTop = "0px";
            cont.style.position = "absolute";
        }

        if(ops?.onOpen) ops.onOpen(cont);

        // console.log("HEIGHT: ",r.height,innerHeight*0.3);
        // if(r.height > innerHeight*0.3){
        //     cont.classList.add("overflow");
        // }

        setTimeout(()=>{
            let r2 = e.children[0].getBoundingClientRect();
            if(r2.right >= innerWidth){
                let x = innerWidth-r2.width-5;
                e.style.left = x+"px";
            }
        },20);
    }

    
    if(!replace){ //this mode is bugged if it is the start of the chain
        e.addEventListener("mouseenter",ev=>{
            if(!e.children[1]) open();
        });
        e.addEventListener("mouseleave",ev=>{
            if(e.children[1] && !overCont){
                // hit.classList.remove("show");
                e.removeChild(e.children[1]);
            }
        });
    }
    else{
        e.addEventListener("mousedown",e=>{
            if(ops){
                if(e.button != (ops.isRightClick ? 2 : 0)) return;
                if(ops.ctrlClick && !e.ctrlKey) return;
            }
            e.preventDefault();
            // e.stopImmediatePropagation();
            // e.stopPropagation();
            if(!overCont){
                if(ops?.onMainClick) ops.onMainClick(new UniversalMouseEvent(e));
                open();
            }
        });
        e.addEventListener("contextmenu",e=>{
            e.preventDefault();
        });

        if(ops?.menuBar) e.addEventListener("mouseenter",e=>{
            // console.log("MOUSE ENTER");
            if(ref?.parentElement) return;
            if(ops.menuBar.querySelector(".hold")){
                closeDropdowns();
                if(ops?.onMainClick) ops.onMainClick(new UniversalMouseEvent(e));
                open();
            }
        });
    }

    if(ops?.openAfter){
        setTimeout(()=>{
            open();
        },1);
    }
}

function openDropdown(dir:string,data:DDItem[],ops?:DDOps,replace=true,lvl=0,offy=0){
    if(!ops) ops = {};
    if(!ops?.onMainClick){
        ops.onMainClick = e=>{
            e.stopImmediatePropagation();
            e.stopPropagation();
        };
    }
    if(ops?.openAfter == undefined) ops.openAfter = true;
    
    let div = document.createElement("div");
    setupDropdown(div,dir,data,replace,lvl,offy,ops);
    tmpDDCont.appendChild(div);

    if(ops?.postParent){
        let r = ops.postParent.getBoundingClientRect();
        ops.postX = r.left;
        ops.postY = r.bottom;
    }
    if(ops?.useCursorLoc){
        ops.postX = cmx;
        ops.postY = cmy;
    }

    if(ops?.postX != undefined) div.style.left = ops?.postX+"px";
    if(ops?.postY != undefined) div.style.top = ops.postY+"px";

    return div;
}

const menuCont = document.querySelector(".menu-cont");
const tmpDDCont = document.querySelector(".tmp-dd-cont");
function closeDropdowns(){
    let arr = document.querySelectorAll(".dropdown-cont");
    for(const a of arr){
        a.parentElement.classList.remove("hold");
        a.parentElement.removeChild(a);
    }
    hit.classList.remove("show");

    // the rest
    let hold = document.querySelectorAll(".dd-hold");
    for(const a of hold){
        a.classList.remove("dd-hold","hold");
    }

    _overDropdown = undefined;
    openDropdowns = [];
}
function closeSingleDropdown(div:HTMLElement){
    if(!div.parentElement) return;

    div.remove();
    _overDropdown = undefined;
    let ind = openDropdowns.indexOf(div);
    if(ind != -1) openDropdowns.splice(ind,1);
}

// Menubar Actions

let menuBar = document.querySelector(".menu-bar");
setupDropdown(menuBar.children[0] as HTMLElement,"d",[ // FILE
    {
        label:"New",
        icon:"assets/editor/add.svg",
        onclick(){
            menuAPI.open(new NewFileMenu());
            // let s = prompt("Width, height of new project","16,16");
            // if(!s) return;
            // let split = s.trim().replaceAll(" ","").split(",");
            // let w = parseInt(split[0]);
            // let h = parseInt(split[1]);
            // createNewProject(w,h,"New File");
        }
    },
    {
        label:"Open",
        onclick(d, cont) {
            openFile();
        },
    },
    {
        label:"Open Folder",
        onclick:(d,cont)=>{
            openFolder();
        }
    },
    {
        label:"Open Recent...",
        dontCloseAfter:true,
        onclick(d, cont) {},
        onview(d, cont) {
            d.style.position = "relative";
            let div = document.createElement("div");
            div.classList.add("dropdown-cont","overflow");
            div.classList.add("recent-files");
            let list:FileStoreItem[] = [];
            let load = ()=>{
                div.textContent = "";
                for(const data of list){
                    let item = document.createElement("div");
                    item.className = "dropdown-item recent-file-dd-item";
                    div.appendChild(item);
                    let date = new Date(data.date);
                    let handle = data.handle as FileSystemFileHandle;
                    item.innerHTML = `
                        <div style="display:flex;justify-content:space-between;width:100%">
                            <div class="l-name">${handle.name}</div>
                            <button class="icon-cont b-remove"><img class="icon" src="${allIcons.clear}"></button>
                        </div>
                        <div>${date.toLocaleDateString()+" - "+date.toLocaleTimeString("en-US",{timeStyle:"short"})}</div>
                    `;
                    item.onclick = async function(){
                        let res = await handle.requestPermission({
                            mode:"readwrite"
                        });
                        if(res == "denied") return;

                        let p:Project;
                        for(const pp of files){
                            if(await pp.handle?.isSameEntry(handle)){
                                p = pp;
                                break;
                            }
                        }
                        if(p) selectProject(p);
                        else{
                            try{
                                await _openFile(await handle.getFile(),data.handle);
                            }
                            catch(e){
                                alert("There was an error opening the file");
                                console.error(e);
                            }
                        }
                        closeDropdowns();
                    };

                    let b_remove = item.querySelector(".b-remove") as HTMLButtonElement;
                    b_remove.addEventListener("click",async e=>{
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        let res = await removeFromRecentFiles(data.handle,data.date);
                        if(!res){
                            alert("Failed to remove from recent files");
                        }
                        else{
                            item.remove();
                        }
                    });
                }
                if(list.length == 0){
                    div.innerHTML = "<div class='dropdown-item l-none'>None.</div>";
                }
                else{
                    let end = document.createElement("div");
                    end.className = "dropdown-item recent-file-dd-item b-clear";
                    end.innerHTML = "<img src='../assets/icon/delete.svg'><div>Clear Recent Files List</div>";
                    div.insertBefore(end,div.children[0]);
                    end.addEventListener("click",e=>{
                        clearRecentFiles();
                        closeDropdowns();
                    });
                }

                let r = div.getBoundingClientRect();
                div.style.maxHeight = `${innerHeight-50-r.top}px`;
                div.scrollTop = -div.scrollHeight; // large number just to make sure it's enough, not sure why it needs to be negative <-- fixed, it was as easy as changing it to scrollheight :)
            };
            d.addEventListener("mouseleave",e=>{
                if(div.parentElement) div.remove();
                d.classList.remove("hold");
            });
            d.addEventListener("mouseenter",async e=>{
                list = await getRecentFiles();
                d.appendChild(div);
                d.classList.add("hold");

                load();
            });
        },
    },
    {
        label:"Save",
        onclick(d, cont) {
            saveFile(selProject);
        },
    },
    {
        label:"Save As",
        onclick(d, cont) {
            saveFileAs(selProject);
        },
    },
    {
        label:"Export as GIF",
        onclick(d,cont){
            menuAPI.open(new ExportAsGIFMenu());
        },
    },
    {
        type:"hr"
    },
    {
        label:"Refresh App",
        onclick(d, cont) {
            location.href = location.href;
        }
    },
    {
        label:"Update App",
        icon:"/assets/editor/loading.svg",
        async onclick(d, cont) {
            if(!swReg) return;
            if(!navigator.onLine){
                alert("You are offline, can't update.");
                return;
            }
            await swReg.update();
            location.reload();
        }
    },
    {
        label:"Check Version",
        onclick(d, cont) {
            if(!navigator.onLine){
                alert("You are offline, can't get version.");
                return;
            }
            alert(l_ver.textContent);
        }
    },
    {
        type:"hr"
    },
    {
        label:"Project Info",
        onclick(d, cont) {
            menuAPI.open(new ProjectInfoMenu());
        }
    }
],undefined,undefined,3,{
    menuBar
});
setupDropdown(menuBar.children[1] as HTMLElement,"d",[ // EDIT
    {
        label:"Undo",
        dontCloseAfter:true,
        onclick(d, cont) {
            if(selProject) selProject.hist.undo();
        }
    },
    {
        label:"Redo",
        dontCloseAfter:true,
        onclick(d, cont) {
            if(selProject) selProject.hist.redo();
        }
    },
    {
        type:"hr"
    },
    {
        label:"Copy Selection",
        onclick(d, cont) {
            if(selProject) selProject.edit.copySelection();
        }
    },
    {
        label:"Cut Selection",
        onclick(d, cont) {
            if(selProject) selProject.edit.cutSelection();
        }
    },
    {
        label:"Paste Selection",
        onclick(d, cont) {
            if(selProject) selProject.edit.pasteSelection();
        }
    },
    {
        label:"Paste Into New Project",
        onclick(d, cont) {
            if(selProject) pasteToLayer(undefined,true);
        }
    },
    {
        type:"hr"
    },
    {
        label:"Deselect All",
        onclick(d, cont) {
            if(selProject) selProject.edit.deselectAll();
        }
    }
],undefined,undefined,3,{
    menuBar
});
function createQuickToggle(name:string,key:string,onclick?:(v:boolean)=>void){
    let item:DDItem = {
        label:"...",
        onclick(d, cont) {
            settings[key] = !settings[key];
            document.body.classList.toggle("s_"+key,settings[key]);
            if(onclick) onclick(settings[key]);
        },
        onview(d, cont) {
            let text = d.querySelector(".dd-text") as HTMLElement;
            text.innerHTML = `<span style='margin-right:0px'>${name}</span>`;
            let tog = document.createElement("span");
            tog.className = "l-toggle";
            if(settings[key]) tog.classList.add("enabled");
            else tog.classList.add("disabled");
            tog.style.marginLeft = "auto";
            tog.textContent = settings[key]?"ENABLED":"DISABLED";
            d.appendChild(tog);
            text.style.whiteSpace = "nowrap";
        },
    };
    return item;
}
setupDropdown(menuBar.children[2] as HTMLElement,"d",[ // VIEW
    createQuickToggle("Scaled Grid:","scaleMatchGrid",v=>{
        if(v){
            let p = selProject;
            if(!p) return;
            p.loadFrame();
        }
        else document.body.style.setProperty("--grid-size",null);
    }),
    createQuickToggle("Solid Cursor:","solidCursor"),
    {
        type:"hr"
    },
    {
        label:"Reset View",
        onclick(d, cont) {
            selProject?.resetView();
        },
    }
],undefined,undefined,3,{
    menuBar
});
setupDropdown(menuBar.children[3] as HTMLElement,"d",[ // IMAGE
    {
        label:"Resize All Frames",
        onclick(d, cont) {
            menuAPI.open(new ResizeMenu());
        }
    }
],undefined,undefined,3,{
    menuBar
});
setupDropdown(menuBar.children[4] as HTMLElement,"d",[ // LAYER
    {
        label:"Copy Layer",
        onclick(d, cont) {
            if(selProject) copyFromLayer();
        }
    },
    {
        label:"Cut Layer",
        onclick(d, cont) {
            if(selProject) cutFromLayer();
        }
    },
    {
        label:"Paste Layer",
        onclick(d, cont) {
            if(selProject) pasteToLayer();
        }
    },
    {
        label:"Rename Layer(s)",
        icon:"assets/editor/rename.svg",
        onclick:(d,cont)=>{
            if(selProject) selProject.showRenameLayers();
        }
    }
],undefined,undefined,3,{
    menuBar
});
setupDropdown(menuBar.children[5] as HTMLElement,"d",[ // OBJECT
    {
        label:"TEST: Create Camera",
        onclick:(d,cont)=>{
            let o = new CameraCObj(20,20,16,16);
            selProject.deselectAllCanObjs();
            selProject.addCanObj(o);
            o.select();
            selProject.hist.add(new HA_CreateCamera(o.x,o.y,o.w,o.h,o._id));
        }
    }
],undefined,undefined,3,{
    menuBar
});
setupDropdown(menuBar.children[6] as HTMLElement,"d",[ // LOGIC
    {
        label:"Compute Region", // Adjust Region
        icon:"assets/editor/settings.svg",
        onclick:(d,cont)=>{
            menuAPI.open(new ComputeRegionMenu());
        }
    }
],undefined,undefined,3,{
    menuBar
});

// 

function setCursor(cur:string){
    document.body.style.cursor = cur;
}
function endCursor(...curs:string[]){
    if(curs.includes(document.body.style.cursor)) document.body.style.cursor = "default";
}
function endAllCursors(){
    document.body.style.cursor = "default";
}

// init panes
let resizes = document.querySelectorAll(".pane") as NodeListOf<HTMLElement>;
let dragging:{elm:HTMLElement,call:(v:number,amt:number)=>void,dragend:()=>void};
let dragDir = "";
let dragSx = 0;
let dragSy = 0;
let dragSw = 0;
let dragSh = 0;

let resizeListeners = {
    "bottom-pane":(v:number,amt:number)=>{
        bottomPanelHeight = v;
        applyNewSizing();
    }
};
let endResizeListeners = {
    "bottom-pane":()=>{
        let list = _getPanelList();
        for(const p of list){
            p.onEndResize();
        }
    }
};

for(const a of resizes){
    setupResize(a);
}
function setupResize(a:HTMLElement){
    if(!a.hasAttribute("resize")) return;
    let list = a.getAttribute("resize").split(" ");
    for(const dir of list){
        a.style.position = "relative";
        let d = document.createElement("div");
        d.className = "resize "+dir;
        a.appendChild(d);
        
        d.onmousedown = function(e){
            dragging = {elm:a,call:resizeListeners[a.id],dragend:endResizeListeners[a.id]};
            dragDir = dir;
            dragSx = e.clientX;
            dragSy = e.clientY;
            dragSw = a.offsetWidth;
            dragSh = a.offsetHeight;
        };
    }
}

let bottomPanelHeight = 160;
let lastBottomPanelHeight = bottomPanelHeight;
const areaPane = document.querySelector(".area.pane") as HTMLElement;
function applyNewSizing(){
    areaPane.style.height = (innerHeight - 38 - 32 - 26 - bottomPanelHeight - 6)+"px";
}
applyNewSizing();

document.addEventListener("mousemove",e=>{
    if(dragging){
        let dx = e.clientX-dragSx;
        let dy = e.clientY-dragSy;
        if(dragDir == "r"){
            setCursor("ew-resize");
            dragging.elm.style.width = (dragSw+dx)+"px";
            if(dragging.call) dragging.call(dragging.elm.offsetWidth,dragSw+dx);
        }
        else if(dragDir == "l"){
            setCursor("ew-resize");
            dragging.elm.style.width = (dragSw-dx)+"px";
            if(dragging.call) dragging.call(dragging.elm.offsetWidth,dragSw-dx);
        }
        if(dragDir == "d"){
            setCursor("ns-resize");
            dragging.elm.style.height = (dragSh+dy)+"px";
            if(dragging.call) dragging.call(dragging.elm.offsetHeight,dragSh+dy);
        }
        else if(dragDir == "u"){
            setCursor("ns-resize");
            dragging.elm.style.height = (dragSh-dy)+"px";
            if(dragging.call) dragging.call(dragging.elm.offsetHeight,dragSh-dy);
        }

        // 
        let elm = dragging.elm;
        if(elm.classList.contains("panel-cont")) postDragPanelCont(elm);
        else if(elm.classList.contains("pane")){
            let allPanels = [...document.querySelectorAll(".pane")];
            for(const p of allPanels){
                let list = [...p.children].filter(v=>v.classList.contains("panel-cont"));
                let first = list[0] as HTMLElement;
                if(!first) continue;

                postDragPanelCont(first);
            }
        }
    }
});

function postDragPanelCont(elm:HTMLElement){
    let parCont = elm.parentElement;
    let list = [...parCont.children].filter(v=>v.classList.contains("panel-cont")) as HTMLElement[];
    let ind = list.indexOf(elm);

    let isHorz = parCont.classList.contains("horz-pane");
    
    // new method 1
    // let next = dragging.elm.nextElementSibling as HTMLElement;
    // if(next) if(next.classList.contains("panel-cont")){
    //     let r = parCont.getBoundingClientRect();
    //     let h = 0;
    //     for(let i = 0; i < list.length; i++){
    //         let a = list[i];
    //         if(a == next) continue;
    //         h += a.getBoundingClientRect().height;
    //     }
    //     next.style.height = (r.height-h)+"px";
    // }

    let prop = (isHorz ? "width" : "height");
    let propTop = (isHorz ? "left" : "top");
    let propBottom = (isHorz ? "right" : "bottom");

    // new method 2
    let r = parCont.getBoundingClientRect();
    let cr = elm.getBoundingClientRect(); // current r
    let heightLeft = 0;
    for(let i = ind+1; i < list.length; i++){
        heightLeft += list[i].getBoundingClientRect()[prop];
    }
    let percents = list.map(v=>(v.getBoundingClientRect()[prop]/heightLeft));
    heightLeft = r[prop]-(cr[propBottom]-r[propTop]); // clamped/full height that we want to resize to
    let hasDoneReduce = false;
    for(let i = ind+1; i < list.length; i++){ // just update the panels lower
        let a = list[i];
        let newHeight = percents[i]*heightLeft;
        if(newHeight < 32 && !hasDoneReduce){
            let prev = a.previousElementSibling as HTMLElement;
            if(prev){
                let h = prev.getBoundingClientRect()[prop] + (r[propBottom]-a.getBoundingClientRect()[propBottom]) - (list.length-i-1)*32;
                prev.style[prop] = h+"px";
                hasDoneReduce = true;
            }
        }
        a.style[prop] = (newHeight)+"px";
    }
}

document.addEventListener("mouseup",e=>{
    if(dragging){
        if(dragging.dragend) dragging.dragend();
        dragging = null;
        endCursor("ew-resize","ns-resize");
    }
});
document.addEventListener("dragstart",e=>{
    if(dragging || dragLocked){
        e.preventDefault();
    }
});

// 

function removeAllChildren(e:HTMLElement){
    if(!e) return;
    let list = [...e.children];
    for(let i = 0; i < list.length; i++){
        let c = list[i];
        if(!c.classList.contains("resize")){
            e.removeChild(c);
        }
    }
}

async function getCanBlob(ctx:CanvasRenderingContext2D){
    if(!ctx) return null;
    return new Promise<Blob>(resolve=>{
        ctx.canvas.toBlob(blob=>{
            resolve(blob);
        });
    });
}

function getRect(e:HTMLElement){
    return e.getBoundingClientRect();
    let x = e.offsetLeft;
    let y = e.offsetTop;
    let w = e.offsetWidth;
    let h = e.offsetHeight;
    return {
        left:x,top:y,x,y,
        width:w,height:h,
        right:x+w,bottom:y+h
    };
}

function rot2D(x:number,y:number,ox:number,oy:number,a:number){
    return [
        Math.cos(a)*(x-ox)-Math.sin(a)*(y-oy)+ox,
        Math.sin(a)*(x-ox)+Math.cos(a)*(y-oy)+oy
    ];
}

function confirmInput(inp:HTMLInputElement,f:(e:Event)=>void,ops:{
    speed?:number
}={}){
    inp.addEventListener("blur",e=>{
        f(e);
    });
    inp.addEventListener("keydown",e=>{
        if(e.key == "Enter") f(e);
        if(inp.type == "number"){
            if(e.key == "ArrowUp" || e.key == "ArrowDown") requestAnimationFrame(()=>{f(e);});
        }
    });
    if(inp.type == "number"){
        inp.addEventListener("mousedown",e=>{
            requestAnimationFrame(()=>{
                f(e);
            });
        });
        let _lastTime = -9999;
        let lastY = 0;
        let y = 0;
        inp.addEventListener("wheel",e=>{
            e.stopImmediatePropagation();
            e.stopPropagation();
            
            // if(document.activeElement != inp) return;
            e.preventDefault();
            if(performance.now()-_lastTime < 10) return;
            // y += (-e.deltaY * (ops.speed??1));
            y -= e.deltaY;
            if(Math.abs(y-lastY) < 30) return;
            let amt = (e.deltaY > 0 ? -1 : 1) * (ops.speed??1) * (e.altKey || e.ctrlKey ? 10 : 1);
            lastY = y;
            inp.valueAsNumber += amt;
            _lastTime = performance.now();
            f(e);
        });
    }
}

function createCan(w:number,h:number){
    let can = document.createElement("canvas");
    can.width = w;
    can.height = h;
    return can;
}
function copyCan(can:HTMLCanvasElement){
    let _can = createCan(can.width,can.height);
    _can.getContext("2d").drawImage(can,0,0);
    return _can;
}
function imgToCan(img:HTMLImageElement){
    let ctx = createCan(img.width,img.height).getContext("2d");
    ctx.drawImage(img,0,0);
    return ctx.canvas;
}

// clipboard
function saveClipboardData(data:any){
    return "__qs"+JSON.stringify(data);
}
function parseClipboardData(s:string){
    if(!s.startsWith("__qs")) return null;
    return JSON.parse(s.substring(4));
}

// lock drag
let dragLocked = false;
function lockDrag(){
    dragLocked = true;
}
function unlockDrag(){
    dragLocked = false;
}