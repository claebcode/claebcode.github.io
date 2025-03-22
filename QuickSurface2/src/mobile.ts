let mobileMediaQuery = window.matchMedia("(max-width: 430px)");

let inMobileMode = false;

class EmptyMenu extends StandardMenu{
    constructor(){
        super("Empty Menu");
    }
    async load(): Promise<void> {
        super.load();

    }
    async onConfirm(): Promise<boolean> {
        return true;
    }
}

async function loadMobileMode(){
    if(inMobileMode) return; // return, it's already loaded
    inMobileMode = true;
    mobileMode = true; // global

    settings.useTimelineChunkView = false; // for now it isn't possible to use the timeline when it's using the chunk view
    loadAllPanels();

    function q(query:string){
        return document.querySelector(query);
    }
    function remove(query:string){
        let e = q(query);
        e?.remove();
    }

    let mList = q(".mobile-list");

    // let header = q("header");
    // let toolSettings = 

    let list = [
        ".header",
        ".tool-settings",
        ".center-area",

        ".tools"
    ];
    let _list:Element[] = [];
    for(const query of list){
        let e = q(query);
        _list.push(e);
        e.remove();
    }

    for(const e of _list){
        mList.appendChild(e);
    }

    function createIconBtn(par:HTMLElement,icon:string,className:string,onclick:(e:UniversalMouseEvent,b:HTMLElement)=>void|Promise<void>){
        let b = document.createElement("div");
        b.className = "icon-cont "+className;
        b.innerHTML = `<img class="icon" src="${icon}">`;
        par.appendChild(b);
        async function click(e:UniversalMouseEvent,b:HTMLElement){
            e.stopPropagation();
            e.stopImmediatePropagation();
            b.classList.add("hov");
            setOverCanvas(false);
            await onclick(e,b);
            await wait(100);
            b.classList.remove("hov");
            b.blur();
        }
        if(!mobileMode) b.addEventListener("click",e=>{
            click(new UniversalMouseEvent(e),b);
        });
        else b.addEventListener("touchstart",e=>{
            click(new UniversalMouseEvent(null,null,e),b);
        });
        return b;
    }

    // tools container
    let tools = q(".tools");
    let toolsWrapper = document.createElement("div");
    toolsWrapper.className = "tools-wrapper";
    toolsWrapper.appendChild(tools);
    mList.appendChild(toolsWrapper);

    // top settings
    let topSettings = document.createElement("div");
    topSettings.className = "top-settings any-settings";
    mList.insertBefore(topSettings,mList.children[2]);

    // left settings
    let leftSettings = document.createElement("div");
    leftSettings.className = "left-settings vertical-settings any-settings";
    mList.insertBefore(leftSettings,topSettings.nextElementSibling);

    createIconBtn(leftSettings,"/assets/editor/left.svg","b-undo",async (e,b)=>{
        selProject?.hist.undo();       
    });
    createIconBtn(leftSettings,"/assets/editor/right.svg","b-redo",async (e,b)=>{
        selProject?.hist.redo();
    });

    // 
    let toolSettings = q(".tool-settings");

    b_quickColor = new ColorInputComponent(col,(v,inp)=>{
        selProject.setColStr(v);
        // updateAllPanels();
    });
    b_quickColor.div.style.marginLeft = "15px";
    toolSettings.appendChild(b_quickColor.div);
    
    let b_drawMode = document.createElement("button");
    b_drawMode.textContent = "Draw Mode";
    b_drawMode.style.marginLeft = "auto";
    b_drawMode.style.marginRight = "2px";
    let drawModes = [
        DrawMode.draw,
        DrawMode.erase,
        DrawMode.select,
        DrawMode.erase_select
    ];
    let drawModeLabels = [
        "Draw",
        "Erase",
        "Select",
        "Erase Select"
    ];
    setupDropdown(b_drawMode,"d",drawModes.map((v,i)=>{
        return {
            label:drawModeLabels[i],
            onclick(d, cont) {
                selProject.setConstantDrawMode(v);
            }
        };
    }));
    toolSettings.appendChild(b_drawMode);

    // tool settings button
    createIconBtn(topSettings,"/assets/editor/settings.svg","b-tool-settings",async (e,b)=>{
        let m = new EmptyMenu();
        m.title = "Tool Settings";
        await menuAPI.open(m);

        m.body.appendChild(d_toolSettings);
    });

    let frameNavCont = document.createElement("div");
    frameNavCont.className = "flx";
    frameNavCont.style.marginLeft = "auto";
    frameNavCont.style.marginRight = "auto";
    topSettings.appendChild(frameNavCont);

    createIconBtn(frameNavCont,"/assets/editor/left.svg","b-last-frame",(e,b)=>{
        let p = selProject;
        if(!p) return;
        let first = p.getFirstCurLayer();
        if(!first) return;
        p.goto(p.getCurFrameI()-1,first.lref._id);
    });
    createIconBtn(frameNavCont,"/assets/editor/right.svg","b-next-frame",(e,b)=>{
        let p = selProject;
        if(!p) return;
        let first = p.getFirstCurLayer();
        if(!first) return;
        p.goto(p.getCurFrameI()+1,first.lref._id);
    });

    // menus button
    createIconBtn(topSettings,"/assets/editor/global_layer.svg","b-open-menus",(e,b)=>{
        let menus = _getPanelList();
        setupDropdown(b,"l",menus.map(v=>{
            return {
                label:v.getName(),
                onclick(d, cont) {
                    openMobilePanel(v);
                }
            };
        }));
    });

    let d_toolSettings = q(".d-tool-settings");
    d_toolSettings.remove(); // this will be moved to it's own popup menu

    // menu bar hamburger
    let header = q(".header");
    let menubarMenu = document.createElement("div");
    menubarMenu.className = "menubar-menu icon-cont";
    menubarMenu.innerHTML = `<img class="icon" src="/assets/editor/menu.svg">`;
    header.appendChild(menubarMenu);

    let menuBarOps = [];
    for(const c of menuBar.children){
        menuBarOps.push({
            label:c.textContent,
            async onclick(d:HTMLElement,cont:HTMLElement){
                await wait(1);
                c.dispatchEvent(new Event("mousedown"));
            }
        });
    }
    setupDropdown(menubarMenu,"l",menuBarOps,undefined,0,0,{
        
    });

    // remove

    remove(".area.pane");
    remove(".status-bar");
}

if(mobileMediaQuery.matches){
    loadMobileMode();
}

async function openMobilePanel(p:Panel){
    let m = new EmptyMenu();
    m.title = p.getName();

    await menuAPI.open(m);

    m.body.appendChild(p.panel);

    let panelBody = m.body.querySelector(".panel-body") as HTMLElement;
    if(panelBody) panelBody.style.maxHeight = `${innerHeight-250}px`;
}