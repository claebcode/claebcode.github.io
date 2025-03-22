class NewFileMenu extends StandardMenu{
    constructor(){
        super("New File",{
            width:450
        });
    }
    async load(): Promise<void> {
        await super.load();

        this.root.createInputBox("File Name","text","New File.qsp");
        
        let cols = this.root.createColumns(2);
        
        cols[0].createHeading("Dimensions");
        let widthBox = cols[0].createInputBox("Width","number",64,"PX");
        let heightBox = cols[0].createInputBox("Height","number",64,"PX");

        cols[1].createHeading("Animation");
        cols[1].createInputBox("Frames","number",8,"");
        cols[1].createInputBox("Speed","number",8,"FPS");

        let submit = this.root.createButtonList([
            {
                label:"Cancel",
                type:ButtonType.none,
                onclick:async (e,b)=>{
                    await this.close();
                    updateOverCanvas();
                }
            },
            {
                label:"Create",
                type:ButtonType.accent,
                onclick:async (e,b)=>{
                    await this.confirm();
                    updateOverCanvas();
                }
            }
        ]);
        this.root.alignItem(submit,"start");
        // submit.style.justifyContent = "space-between"; // <-- if needed

        widthBox.inp.select();
    }
    async onConfirm(): Promise<boolean> {
        let i_name = this.body.querySelector(".i-file_name") as HTMLInputElement;
        let i_width = this.body.querySelector(".i-width") as HTMLInputElement;
        let i_height = this.body.querySelector(".i-height") as HTMLInputElement;
        let i_frames = this.body.querySelector(".i-frames") as HTMLInputElement;
        let i_speed = this.body.querySelector(".i-speed") as HTMLInputElement;
        
        let p = createNewProject(
            parseInt(i_width.value)||32,
            parseInt(i_height.value)||32,
            i_name.value,
            parseInt(i_frames.value),
            parseInt(i_speed.value)
        );
        
        return true; // returning true will make it auto close afterward
    }
}

class RenameLayerMenu extends StandardMenu{
    constructor(...ids:number[]){
        super("Rename Layer",{
            width:350,
            // height:200
        });
        this.ids = ids;
        this.ls = selProject.gLayers.filter(v=>ids.includes(v._id));
        if(this.ls.length == 0){
            this.close();
            return;
        }
        this.prevNames = this.ls.map(v=>v.name);
    }
    ids:number[];
    ls:LayerRef[];
    prevNames:string[];

    inp:string;
    
    async load(): Promise<void> {
        await super.load();

        this.root.createText("Previous name(s): ","note");
        this.root.createText(this.prevNames.join(", "),"").setIndent(1);

        let inp = this.root.createInputBox("New Name Pattern","text",this.prevNames[0],"",{isLong:true,contMargin:"10px 0px"});
        this.root.createText("Note: Use # to include the number of the layer and & to use existing layer name (order is based on lowest to highest in timeline panel).","sub-note"); // if your name already includes a #, then use /#

        this.root.createSpace(1);

        inp.inp.addEventListener("input",e=>{
            this.inp = inp.inp.value;
        });

        this.root.createButtonList([
            {
                label:"Cancel",
                onclick:async ()=>{
                    this.cancel();
                }
            },
            {
                label:"Rename",
                type:ButtonType.accent,
                onclick:async ()=>{
                    this.confirm();
                }
            }
        ]);

        inp.inp.select();
    }
    async onConfirm(): Promise<boolean> {
        if(!this.inp) return false;
        
        selProject.renameLayers(true,...this.ids.map(v=>{
            return {
                id:v,
                name:this.inp
            };
        }));
        
        return true;
    }
}

class AddLayerMenu extends StandardMenu{
    constructor(type:LayerType,ind?:number){
        super(`Add ${type==LayerType.global?"Global":"Background"} Layer`,{
            width:300,
            height:null
        });
        this.type = type;
        this.ind = ind;
    }
    type:LayerType;
    ind?:number;
    inp_name:InputComponent;
    async load(): Promise<void> {
        await super.load();
        this.inp_name = this.root.createInputBox("Name","text","New Layer"+(selProject?" "+(selProject._lId+1):""),null);
        this.root.createSpace(1);
        
        let confirm = this.root.createButtonList([
            {
                label:"Cancel",
                onclick:async (e, b)=>{
                    await this.cancel();
                }
            },
            {
                label:"Create",
                type:ButtonType.accent,
                onclick:async (a, b)=>{
                    await this.confirm();
                }
            }
        ]);

        this.inp_name.inp.select();
    }
    async onConfirm(): Promise<boolean> {
        let name = this.inp_name.inp.value;
        if(!name || name == "") return true;
        if(!selProject) return true;

        let ind = this.ind;
        let _id:number;
        if(this.type == LayerType.global) _id = selProject.addGlobalLayer(name,ind,undefined,{selectAfter:true});
        else if(this.type == LayerType.background) _id = selProject.addBGLayer(name,ind,undefined,{selectAfter:true});

        // console.log("ID:",_id);
        // if(selProject.curFrame && _id != null){
        //     selProject.deselectLayers();
        //     selProject.curFrame.addRemoveCurLayer(selProject.curFrame.getLayer(_id));
        // }

        return true;
    }
}

class ResizeMenu extends StandardMenu{
    constructor(){
        super("Resize",{
            width:450,
            // height:400
        });
    }
    async load(): Promise<void> {
        await super.load();
        let p = selProject;
        if(!p){
            alert("Cannot resize when no project is open");
            await this.close();
            return;
        }
        
        // previous
        this.root.createHeading("Previous size");
        this.root.createText(p.w+" x "+p.h).setIndent(1).addClass("note");

        // inputs
        let cols = this.root.createColumns(2);

        cols[0].createHeading("New Dimensions");
        cols[0].createInputBox("Width","number",p.w,"PX");
        cols[0].createInputBox("Height","number",p.h,"PX");

        cols[1].createHeading("Anchor");
        cols[1].createInputBox("Horz","number",50,"%");
        cols[1].createInputBox("Vert","number",50,"%");

        this.root.createCheckbox("Resize Canvas Only?",true);
        this.root.createSpace(1);

        // submit buttons
        this.root.createButtonList([
            {
                label:"Cancel",
                onclick:async (e,b)=>{
                    await this.close();
                }
            },
            {
                label:"Resize",
                type:ButtonType.accent,
                onclick:async (e,b)=>{
                    await this.confirm();
                }
            }
        ])
    }
    async onConfirm(): Promise<boolean> {
        if(!selProject) return false;
        let p = selProject;
        
        let w = this.root.getNumberInput(".i-width",p.w);
        let h = this.root.getNumberInput(".i-height",p.h);
        let ha = this.root.getNumberInput(".i-horz",50);
        let va = this.root.getNumberInput(".i-vert",50);
        let canvasOnly = this.root.getCheckbox(".cb-resize_canvas_only",true);

        selProject.image.resize(w,h,ha/100,va/100,canvasOnly);

        return true;
    }
}

class ProjectInfoMenu extends StandardMenu{
    constructor(){
        super("Project Info",{
            width:null
        });
    }
    async load(): Promise<void> {
        await super.load();
        let p = selProject;
        if(!p){
            await this.close();
            return;
        }
        
        function createLine(root:MenuComponent,label:string,val:string){
            root.createText(`<span class="note1" style="white-space:nowrap">${label}</span><span class="note ind1" style="white-space:nowrap">${val}</span>`,"project-info-item");
        }
        function createSubNote(root:MenuComponent,text:string){
            root.createText(text,"sub-note");
        }

        this.root.createText(p.filename);
        this.root.createSpace(1);
        
        createLine(this.root,"Dimensions",`${p.w} x ${p.h}`);
        createLine(this.root,"Frame count",`${p.frames.length}`);
        createLine(this.root,"Layers count",`${p.gLayers.length}`);
        createLine(this.root,"Total filled cells",p.info.getTotalParts().toString());
        createSubNote(this.root,"(in the timeline)");
        this.root.createSpace(1);
        
        let unit = "sec";
        let time = p.time/1000;
        if(time >= 60){
            unit = "min";
            time /= 60;

            if(time >= 60){
                unit = "hrs";
                time /= 60;

                if(time >= 24){
                    unit = "days";
                    time /= 24;
                }
            }
        }
        createLine(this.root,"Time spent",time.toFixed(1)+" "+unit);
        createSubNote(this.root,"(calculated on save)");


    }
}

class ExportAsGIFMenu extends StandardMenu{
    constructor(){
        super("Export As GIF",{
            width:500
        });
    }
    i_scale:HTMLInputElement;
    i_delay:HTMLInputElement;
    can:HTMLCanvasElement;
    ctx:CanvasRenderingContext2D;
    frameI = 0;

    l_rez:TextComponent;
    l_frameCount:TextComponent;
    l_totalTime:TextComponent;

    async load(): Promise<void> {        
        await super.load();
        let p = selProject;
        if(!p){
            await this.close();
            return;
        }

        let dotInd = p.filename.lastIndexOf(".");
        let name = dotInd != -1 ? p.filename.substring(0,dotInd) : p.filename;
        name += ".gif";
        
        let i_filename = this.root.createInputBox("Filename","text",name,"",{isLong:true});
        let cols = this.root.createColumns(2);
        cols[0].createHeading("Settings");
        cols[1].createHeading("Preview");

        let i_scale = cols[0].createInputBox("Scale","number",1,"x");
        i_scale.inp.min = "1";
        i_scale.inp.step = "1";
        i_scale.inp.max = "32";

        let i_delay = cols[0].createInputBox("Delay","number",300,"ms");
        i_delay.inp.min = "1";
        i_delay.inp.step = "1";
        i_delay.inp.max = "5000";

        let canCont = document.createElement("div");
        canCont.className = "gif-can-cont";
        let can = document.createElement("canvas");
        can.width = p.w;
        can.height = p.h;
        let ctx = can.getContext("2d");
        canCont.appendChild(can);
        this.can = can;
        this.ctx = ctx;

        this.i_scale = i_scale.inp;
        this.i_delay = i_delay.inp;
        
        cols[1].body.appendChild(canCont);

        cols[0].createSpace(1);
        cols[0].createHeading("Output");
        this.l_rez = cols[0].createText("Resolution: 0 x 0","note");
        this.l_frameCount = cols[0].createText("Frame Count: 0","note");
        this.l_totalTime = cols[0].createText("Total Time: 0s","note");

        this.root.createButtonList([
            {
                label:"Cancel",
                onclick:async (e,b)=>{
                    await this.close();
                }
            },
            {
                label:"Export",
                type:ButtonType.accent,
                onclick:async (e,b)=>{
                    await this.confirm();
                }
            }
        ]);

        let loop = async ()=>{
            if(!this.isOpen) return;
            let delay = this.i_delay.valueAsNumber ?? 300;

            this.renderPreview();
            this.l_rez.body.textContent = `Resolution: ${this.can.width} x ${this.can.height}`;
            this.l_frameCount.body.textContent = "Frame Count: "+p.frames.length;
            this.l_totalTime.body.textContent = `Length: ${(delay * p.frames.length / 1000).toFixed(1)}s`;

            if(this.i_delay.value != parseInt(this.i_delay.value).toString()) delay = 300;
            await wait(delay);
            this.frameI++;

            loop();
        }
        loop();
    }

    renderPreview(){
        let p = selProject;
        if(!p) return;
        let scale = this.i_scale.valueAsNumber || 1;
        
        this.can.width = p.w * scale; // clear
        this.can.height = p.h * scale;

        let ctx = this.ctx;
        ctx.imageSmoothingEnabled = false;
        if(this.frameI >= p.frames.length) this.frameI = 0; // maybe need to mod instead?

        let f = p.frames[this.frameI];
        let a = f.getAll();
        for(const data of a.arr1){
            if(!data.v.doesShowData()) continue;
            if(scale == 1) ctx.drawImage(data.v.ctx.canvas,0,0);
            else{
                ctx.drawImage(data.v.ctx.canvas,0,0,this.can.width,this.can.height);
            }
        }
    }

    isOpen = true;
    onClose(){
        this.isOpen = false;
    }
    async onCancel(): Promise<boolean> {
        this.onClose();
        return true;
    }
    async onConfirm(): Promise<boolean> {
        this.onClose();
        let name = this.root.getInput(".i-filename");
        if(!name.endsWith(".gif")) name += ".gif";
        console.log("NAME:",name);

        let res = await exportAsGIF({
            scale:this.i_scale.valueAsNumber || 1,
            delay:this.i_delay.valueAsNumber || 300,
            name,
        });
        
        return true;
    }
}

class AddFramesMenu extends StandardMenu{
    constructor(){
        super("Add # Frames",{
            width:300
        });
    }
    inp:InputComponent;
    useStart:CheckboxComponent;
    start:InputComponent;

    async load(): Promise<void> {
        await super.load();
        
        this.inp = this.root.createInputBox("Amount","number",1);
        this.root.createText("Note: use a negative amount to add in reverse.","sub-note");
        this.root.createHR();
        this.root.createSpace(1);
        
        this.useStart = this.root.createCheckbox("Use custom start index",false);
        this.start = this.root.createInputBox("Start Frame Index","number",0);
        this.start.inp.min = "0";
        this.start.inp.step = "1";
        
        this.root.createSpace(1);
        this.root.createButtonList([
            {
                label:"Cancel",
                onclick:async (e,b)=>{
                    await this.close();
                }
            },
            {
                label:"Add",
                type:ButtonType.accent,
                onclick:async (e,b)=>{
                    await this.confirm();
                }
            }
        ]);

        this.inp.inp.select();
    }
    async onConfirm(): Promise<boolean> {
        let amt = this.inp.inp.valueAsNumber;
        if(!amt) return false;

        let start = undefined;
        if(this.useStart.getChecked()){
            start = this.start.inp.valueAsNumber;
            if(Number.isNaN(start) || start < 0) return false;
        }

        selProject?.addFrames(amt,start);

        return true;
    }
}

class ComputeRegionMenu extends StandardMenu{
    constructor(){
        super("Compute Region",{
            width:400
        });
    }
    async load(): Promise<void> {
        await super.load();

        let op = new MenuComponent(document.createElement("div"));
        this.root.body.appendChild(op.body);

        let header = new MenuComponent(document.createElement("div"));
        op.body.appendChild(header.body);
        let c_area = header.createCombobox("Area",[
            0,1
        ],[
            "Current Layer",
            "Current Frame"
        ],0);

        let options = new MenuComponent(document.createElement("div"));
        let keys = [""];
        for(let i = 0; i < keys.length; i++){
            let key = keys[i];
            let d = new MenuComponent(document.createElement("div"));
            options.body.appendChild(d.body);
            // d.createCombobox("Value",["Red","Green","Blue","Alpha"]);
        }

        op.createButtonList([
            {
                label:"Test",
                type:ButtonType.none,
                onclick:async (e,b)=>{
                    
                }
            }
        ]);
    }
}

class PanelMenu extends StandardMenu{
    constructor(panel:Panel,ops?:MenuOptions){
        super(panel.getName(),ops);
        this.panel = panel;
    }
    panel:Panel;

    async load(): Promise<void> {
        await super.load();

        let p = this.panel;
        p.init();
        p.load();
        this.body.appendChild(p.panel);
    }
}

// debug for testing new menus
if(false) setTimeout(()=>{
    menuAPI.open(new AddLayerMenu(LayerType.global));
},100);

// Detatched Panels (Windows) -> Sub Windows

interface SubWindowOps{
    title:string;
    id?:string;
    icon?:string;

    x:number;
    y:number;
    
    genHTML?:(body:HTMLElement,sw:SubWindow)=>HTMLElement|void;
    fromPanel?:Panel;

    onEnter?:()=>void;
    onKey?:(k:string,e:KeyboardEvent)=>void;

    /**
     * Can be used to change properties by dynamically each time before the menu is opened, like the title
     */
    onPreOpen?:()=>void;
    onOpen?:()=>void;
    onClose?:()=>void;
}

class SubWindow{
    constructor(ops:SubWindowOps){
        this.ops = ops;
    }
    ops:SubWindowOps;
    wCont:HTMLElement;
    head:HTMLElement;
    body:HTMLElement;

    getId(){
        if(this.ops.id) return this.ops.id;
        return this.ops.title.toLowerCase().replaceAll(" ","_");
    }

    genHeader(){
        let head = document.createElement("div");
        head.className = "sub-window-header";
        this.wCont.appendChild(head);
        this.head = head;

        head.innerHTML = `
            <img class="sw-icon icon ${this.ops.icon == undefined ? "hide" : ""}" src="${this.ops.icon}">
            <div class="sw-title">${this.ops.title}</div>
            <button class="b-close icon-cont"><img class="icon" src="${allIcons.cancel}"></button>
        `;

        let b_close = head.querySelector(".b-close");
        b_close.addEventListener("click",e=>{
            this.close();
        });

        head.addEventListener("mousedown",e=>{
            runCalcMouseStart(new UniversalMouseEvent(e));
            SWDrag.start(this);
        });
    }
    genBody(){
        let body = document.createElement("div");
        body.className = "sub-window-body";
        this.wCont.appendChild(body);
        this.body = body;
    }

    open(){
        let o = this.ops;
        if(this.ops.onPreOpen) this.ops.onPreOpen();

        let wCont = document.createElement("div");
        wCont.className = "sub-window-cont";
        this.wCont = wCont;

        wCont.addEventListener("keydown",e=>{
            let k = e.key.toLowerCase();
            if(this.ops.onEnter) if(k == "enter") this.ops.onEnter();
            if(this.ops.onKey) this.ops.onKey(k,e);
        });

        let x = o.x;
        let y = o.y;
        wCont.style.left = x+"px";
        wCont.style.top = y+"px";

        wCont.classList.add("sw_"+this.getId());

        this.genHeader();
        this.genBody();

        if(o.fromPanel){
            alert("creating a sub window from a panel is not implemented yet!");
        }
        if(o.genHTML){
            let res = o.genHTML(this.body,this);
            if(res) wCont.appendChild(res);
        }

        menuAPI.mainSWCont.appendChild(wCont);

        wCont.addEventListener("mouseenter",e=>{
            overSW.push(this);
        });
        wCont.addEventListener("mouseleave",e=>{
            // updateOverCanvas();
            overSW.pop(); // <-- can this just be a pop or does it have to be a splice?
        });
    wCont.addEventListener("mousedown",async e=>{
            // let ev = new MouseEvent("mousedown",{button:0});
            // document.dispatchEvent(ev);
        });
        
        if(this.ops.onOpen) this.ops.onOpen();
        return this;
    }
    close(){
        if(this.ops.onClose) this.ops.onClose();

        let ind = allSubWindows.indexOf(this);
        if(ind != -1){
            allSubWindows.splice(ind,1);
        }

        if(this.wCont){
            this.wCont.remove();
            this.wCont = undefined;
        }
    }
}

let allSubWindows:SubWindow[] = [];
let overSW:SubWindow[] = [];
class SWDragHandler{
    constructor(){

    }
    sx = 0;
    sy = 0;
    w:SubWindow;

    start(sw:SubWindow){
        this.w = sw;
        let r = sw.wCont.getBoundingClientRect();
        this.sx = r.x;
        this.sy = r.y;
    }
    end(){
        if(!this.w) return;

        
        
        this.w = undefined;
    }
    move(){
        if(!this.w) return;

        let cont = this.w.wCont;
        cont.style.left = ((cmx-csmx)+this.sx)+"px";
        cont.style.top = ((cmy-csmy)+this.sy)+"px";
    }
}
let SWDrag = new SWDragHandler();

document.addEventListener("mousemove",e=>{
    if(SWDrag.w) SWDrag.move();
});
document.addEventListener("mouseup",e=>{
    if(SWDrag.w) SWDrag.end();
});

function openSubWindow(sw:SubWindow){
    sw.open();
    allSubWindows.push(sw);
}

function areSubWindowsOpen(){
    return allSubWindows.length != 0;
}