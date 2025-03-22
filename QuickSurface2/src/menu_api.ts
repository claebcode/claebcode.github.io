type MenuOptions = {
    width?:number;
    height?:number;
};
class Menu{
    constructor(ops:MenuOptions={}){
        this.ops = ops;
    }
    ops:MenuOptions;
    menu:HTMLElement;
    _api:MenuAPI;
    /**
     * @note Don't manually invoke this, use MenuAPI.open instead
     */
    async load(){
        let menu = document.createElement("div");
        menu.classList.add("menu");
        this.menu = menu;
        this._api.menuCont.appendChild(menu);
        if(this.ops.width != null) menu.style.width = (this.ops.width)+"px";
        if(this.ops.height != null) menu.style.height = (this.ops.height)+"px";
    }
    /**
     * @note Don't manually invoke this, use MenuAPI.close instead
     */
    async _close(){
        if(this.menu.parentElement) this.menu.remove();
    }

    async onConfirm(){ return false }
    async onCancel(){ return true }
    async cancel(){
        let res = await this.onCancel();
        if(!res) return;
        await this._api.close(this);
    }
    async confirm(){
        let res = await this.onConfirm();
        if(!res) return;
        await this._api.close(this);
    }
    async close(){
        let res = await this.onCancel();
        if(!res) return;
        await menuAPI.close(this);
    }
}
class StandardMenu extends Menu{
    constructor(title:string,ops:MenuOptions={}){
        super(ops);
        this.title = title;
    }
    title:string;
    header:Element;
    body:Element;
    root:MenuComponent;
    async load(): Promise<void> {
        await super.load();
        this.menu.innerHTML = `
            <div class="menu-header">
                <h3 class="menu-title">${this.title}</h3>
                <div class="ops">
                    <div class="menu-close"><img class="icon" src="assets/icon/close.svg"></div>
                </div>
            </div>
            <div class="menu-body"></div>
        `;
        let header = this.menu.querySelector(".menu-header");
        let body = this.menu.querySelector(".menu-body");
        this.header = header;
        this.body = body;
        this.root = new MenuComponent(body);
        let b_close = this.menu.querySelector(".menu-close") as HTMLButtonElement;
        b_close.addEventListener("click",e=>{
            this.close();
        });
    }
}
class MenuComponent{
    constructor(body:Element){
        this.body = body as HTMLElement;
    }
    body:HTMLElement;
    static blank(){
        return new MenuComponent(document.createElement("div"));
    }
    createHR(){
        let e = document.createElement("hr");
        this.body.appendChild(e);
    }
    createHeading(text:string){
        let e = document.createElement("div");
        e.classList.add("body-heading");
        e.textContent = text;
        this.body.appendChild(e);
    }
    createText(text:string,className?:string){
        let e = document.createElement("div");
        if(className) e.className = className;
        e.innerHTML = text; // allows easy nested elements
        this.body.appendChild(e);
        return new TextComponent(e);
    }
    createInputBox(label:string,type:string,defaultVal:string|number,suffix?:string,ops:{
        contMargin?:string;
        /** @note default 15 (px) */
        gap?:number;
        isLong?:boolean;
    }={}){
        let cont = document.createElement("div");
        cont.classList.add("inputbox-cont","ib-"+label.toLowerCase().replaceAll(" ","_")); // indent could be added here
        if(ops?.isLong) cont.classList.add("long");
        cont.innerHTML = `
            <div class="label">${label}</div>
            ${ops?.isLong?'<div class="inp-subcont">':''}
                <input class="i-${label.toLowerCase().replaceAll(" ","_")}" spellcheck="false" type="${type}" value="${defaultVal}">
                ${suffix?`<div class="suffix">${suffix}</div>`:""}
            ${ops?.isLong?'</div>':''}
        `;
        this.body.appendChild(cont);

        if(ops){
            if(ops.contMargin != null) cont.style.margin = ops.contMargin;
            if(ops.gap) cont.style.gap = ops.gap+"px";
        }
        
        let inp = cont.querySelector("input");
        if(type == "number") inp.style.width = "50px";
        return new InputComponent(inp);
    }
    createCheckbox(label:string,checked:boolean,suffix?:string){
        let cont = document.createElement("div");
        cont.classList.add("checkbox-cont","cb-cont-"+label.toLowerCase().replaceAll(" ","_")); // indent could be added here
        let tmpId = "_tmp-id_"+Math.floor(performance.now()*1000).toString();
        cont.innerHTML = `
            <label class="label" for="${tmpId}">${label}</label>
            <input id="${tmpId}" class="cb-${label.toLowerCase().replaceAll(" ","_").replaceAll("?","")}" spellcheck="false" type="checkbox" ${checked?"checked":""}>
            ${suffix?`<div>${suffix}</div>`:""}
        `;
        this.body.appendChild(cont);
        
        let inp = cont.querySelector("input");
        inp.style.width = "50px";
        return new CheckboxComponent(cont,inp);
    }
    createColumns(amt:number){
        let cont = document.createElement("div");
        cont.classList.add("column-cont");
        let templateStr = "";
        let parts:MenuComponent[] = [];
        for(let i = 0; i < amt; i++){
            templateStr += "1fr ";
            let div = document.createElement("div");
            cont.appendChild(div);
            parts.push(new MenuComponent(div));
        }
        cont.style.gridTemplateColumns = templateStr;
        this.body.appendChild(cont);
        return parts;
    }
    createFixedFlexbox(dir="row",amt:number){
        let cont = document.createElement("div");
        cont.classList.add("flex-cont");
        cont.style.flexDirection = dir;
        let parts:MenuComponent[] = [];
        for(let i = 0; i < amt; i++){
            let div = document.createElement("div");
            cont.appendChild(div);
            parts.push(new MenuComponent(div));
        }
        this.body.appendChild(cont);
        return parts;
    }
    createButtonList(list:ButtonListItem[]){
        let cont = document.createElement("div");
        cont.classList.add("btn-list-cont");
        for(let i = 0; i < list.length; i++){
            let item = list[i];
            let btn = document.createElement("button");
            btn.classList.add("b-"+item.label.toLowerCase().replaceAll(" ","_"));
            if(item.type != null && item.type != ButtonType.none) btn.classList.add(ButtonType[item.type]);
            cont.appendChild(btn);
            if(!item.icon_wip){
                btn.textContent = item.label;
            }
            else{
                btn.classList.add("icon-cont");
                btn.innerHTML = `<img class="icon" src="${item.icon_wip}"><div>${item.label}</div>`;
            }
            if(item.onclick) btn.addEventListener("click",e=>{
                item.onclick(e,btn);
            });

            if(item.width != undefined) btn.style.width = item.width;
        }
        this.body.appendChild(cont);
        return cont;
    }
    createIconBtn(icon:string|HistIcon,onclick:(e:MouseEvent)=>void,name?:string,desc?:string){
        let cont = document.createElement("div");
        cont.classList.add("comp-icon-cont");
        cont.innerHTML = `
            <img class="icon" src="${typeof icon == "number"?allIcons[HistIcon[icon]]:icon}">
        `;
        this.body.appendChild(cont);
        cont.addEventListener("click",e=>{
            if(onclick) onclick(e);
        });
        
        if(name) regBasicTooltip(cont,name,desc,icon);
            
        return cont;
    }
    createSpace(amt:number){
        let cont = document.createElement("div");
        for(let i = 0; i < amt; i++){
            cont.appendChild(document.createElement("br"));
        }
        this.body.appendChild(cont);
        return cont;
    }
    createCombobox<T extends number>(label:string,items:T[],enm:((v:T)=>string) | any,v:T){
        let {inp} = this.createInputBox(label,"number",0,"");

        let l = MenuComponent.blank().createButtonList([
            {
                label:"...",
                onclick:async ()=>{}
            }
        ]);
        inp.replaceWith(l);

        return new ComboboxComponent<T>(l,items,enm,v);
    }

    alignItem(e:HTMLElement,align:string){
        e.style.alignSelf = align;
        return e;
    }
    setPadding(n:string){
        this.body.style.padding = n;
        return this;
    }
    setMargin(n:string){
        this.body.style.margin = n;
        return this;
    }

    // queries

    getInput(q:string){
        let e = this.body.querySelector(q) as HTMLInputElement;
        if(!e) return null;
        
        return e.value;
    }
    getNumberInput(q:string,fallbackValue?:number){
        let e = this.body.querySelector(q) as HTMLInputElement;
        if(!e) return null;
        
        return e.valueAsNumber ?? fallbackValue;
    }
    getCheckbox(q:string,fallbackValue?:boolean){
        let e = this.body.querySelector(q) as HTMLInputElement;
        if(!e) return null;
        
        return e.checked ?? fallbackValue;
    }
}
class AnyComponent{
    constructor(body:HTMLElement){
        this.body = body;
    }
    body:HTMLElement;
    setIndent(v:number){
        this.body.style.marginLeft = v+"rem";
        return this;
    }
    addClass(...names:string[]){
        this.body.classList.add(...names);
        return this;
    }

    // custom data
    data:any;
}
class TextComponent extends AnyComponent{
    constructor(body:HTMLElement){
        super(body);
    }
}
class CheckboxComponent extends AnyComponent{
    constructor(cont:HTMLElement,inp?:HTMLInputElement){
        super(cont);
        if(!inp) inp = cont.querySelector("input");
        this.inp = inp;
    }
    inp:HTMLInputElement;
    setChecked(v:boolean){
        this.inp.checked = v;
    }
    getChecked(){
        return this.inp.checked;
    }
}
enum ButtonType{
    none,
    accent
}
type ButtonListItem = {
    label:string;
    onclick?:(e:Event,b:HTMLButtonElement)=>Promise<void>;
    type?:ButtonType;
    width?:string;
    icon_wip?:string;
};

class InputComponent extends AnyComponent{
    constructor(inp:HTMLInputElement){
        super(inp);
        this.inp = inp;
    }
    inp:HTMLInputElement;
    setVal(v:string|number){
        if(typeof v == "number") this.inp.valueAsNumber = v;
        else this.inp.value = v;
    }
}

class ComboboxComponent<T> extends AnyComponent{
    constructor(cont:HTMLElement,items:T[],enm:((v:T)=>string) | any,v:T){
        super(cont);
        this.dd = cont.children[0] as HTMLElement;
        this.enm = enm;

        // load
        setupDropdown(this.dd,"d",items.map<DDItem>(v=>{
            if(v == -1) return {type:"hr"};
            let label = this.getLabel(v);
            return {
                label,
                case:"capitalize",
                onclick:(d,cont)=>{
                    this.setOption(v);
                },
                onview:(d,cont)=>{
                    if(this.v == v) d.classList.add("accent");

                    if(this._gettooltips){
                        let tooltip = this._gettooltips(v);
                        regBasicTooltip(d,this.getLabel(v),tooltip);
                    }
                }
            };
        }));

        this.v = v;
        this.update();
    }
    dd:HTMLElement;
    v:T;
    enm:((v:T)=>string) | any;

    setOption(v:T){
        this.v = v;
        this.update();
        if(this._onchange) this._onchange(v);
    }

    getLabel(v:T){
        let label = (typeof this.enm == "function" ? this.enm(v) : this.enm[v]) as string;
        if(!label) label = "...";
        label = label.replaceAll("_"," ");
        return label.split(" ").map((w:string)=>w[0].toUpperCase()+w.substring(1)).join(" ");
    }

    update(){
        let label = this.getLabel(this.v);
        this.dd.textContent = label;
    }

    _onchange:(v:T)=>void;
    onchange(f:(v:T)=>void){
        this._onchange = f;
        return this;
    }

    _gettooltips:(v:T)=>string;
    getTooltips(f:(v:T)=>string){
        this._gettooltips = f;
        return this;
    }
}

class MenuAPI{
    constructor(){
        this.openMenus = [];
    }
    openMenus:Menu[];
    menuCont:HTMLElement;
    menuBack:HTMLElement;
    mainSWCont:HTMLElement;
    isMenuOpen(){
        return this.openMenus.length != 0;
    }
    getCurrentMenu(){
        return this.openMenus[this.openMenus.length-1];
    }
    /**
     * Takes a little extra work but should value safety over performance which shouldn't really matter in this case.
     */
    closeAllMenus(){
        let len = this.openMenus.length;
        for(let i = 0; i < len; i++){
            let cur = this.openMenus[this.openMenus.length-1];
            if(!cur) break;
            this.close(cur);
        }
    }
    init(){
        // init menu container
        let menuCont = document.createElement("div");
        menuCont.classList.add("menu-cont");
        this.menuCont = menuCont;
        menuCont.setAttribute("style","position:fixed;top:0px;left:0px;z-index:5");
        document.body.insertBefore(menuCont,document.body.children[0]);

        let tmpDDCont = document.createElement("div");
        tmpDDCont.classList.add("tmp-dd-cont");
        tmpDDCont.setAttribute("style","position:fixed;top:0px;left:0px;z-index:6");
        document.body.insertBefore(tmpDDCont,menuCont.nextElementSibling);

        let menuBack = document.createElement("div");
        menuBack.classList.add("menu-back");
        this.menuBack = menuBack;
        menuBack.style.display = "none";
        menuCont.appendChild(menuBack);

        let mainSWCont = document.createElement("div");
        mainSWCont.className = "main-sub-window-cont";
        this.mainSWCont = mainSWCont;
        document.body.insertBefore(mainSWCont,menuCont);
    }
    async open(menu:Menu){
        menu._api = this;
        this.openMenus.push(menu);
        this.menuBack.style.display = null;
        await menu.load();
        menu.menu.style.zIndex = (menuCont.children.length+1).toString();
        hit.classList.add("higher");

        menu.menu.appendChild(hit);
        hit.classList.add("in-menu");
    }
    async close(menu:Menu){
        this.openMenus.splice(this.openMenus.indexOf(menu),1);
        if(this.openMenus.length == 0){
            this.menuBack.style.display = "none";
            hit.classList.remove("higher");
        }
        await menu._close();

        document.body.insertBefore(hit,document.querySelector(".main"));
        hit.classList.remove("in-menu");
    }
}
let menuAPI = new MenuAPI();
menuAPI.init();