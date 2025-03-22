const d_toolSettings = document.querySelector(".tool-settings");
const l_curTool = d_toolSettings.querySelector(".l-cur-tool");

interface BlendModeInfo{
    id:GlobalCompositeOperation; // canvas globalCompositeOperation
    mix:string; // CSS mixBlendMode
}
const blendModeInfo:Record<DrawMode,BlendModeInfo> = {
    [DrawMode.draw]: {
        id:"source-over",
        mix:"normal"
    },
    [DrawMode.none]: {
        id:"source-over",
        mix:"normal"
    },
    [DrawMode.erase]: {
        id:"source-over",
        mix:"normal"
    },
    [DrawMode.select]: {
        id:"source-over",
        mix:"normal"
    },
    [DrawMode.erase_select]: {
        id:"source-over",
        mix:"normal"
    },
    [DrawMode.replace_all]: {
        id:"copy",
        mix:"normal"
    },
    [DrawMode.replace]: {
        id:"source-over",
        mix:"normal"
    },
    [DrawMode.add]: {
        id:"lighter",
        mix:"plus-lighter"
    },
    [DrawMode.multiply]: {
        id:"multiply",
        mix:"multiply"
    },
    [DrawMode.xor]: {
        id:"xor",
        mix:"normal" // xor doesn't exist for mixBlendMode
    },
    [DrawMode.screen]: {
        id:"screen",
        mix:"screen"
    },
    [DrawMode.overlay]: {
        id:"overlay",
        mix:"overlay"
    },
    [DrawMode.darken]: {
        id:"darken",
        mix:"darken"
    },
    [DrawMode.lighten]: {
        id:"lighten",
        mix:"lighten"
    },
    [DrawMode.color_dodge]: {
        id:"color-dodge",
        mix:"color-dodge"
    },
    [DrawMode.color_burn]: {
        id:"color-burn",
        mix:"color-burn"
    },
    [DrawMode.hard_light]: {
        id:"hard-light",
        mix:"hard-light"
    },
    [DrawMode.soft_light]: {
        id:"soft-light",
        mix:"soft-light"
    },
    [DrawMode.difference]: {
        id:"difference",
        mix:"difference"
    },
    [DrawMode.exclusion]: {
        id:"exclusion",
        mix:"exclusion"
    },

    // backend
    [DrawMode.sourceIn]:{
        id:"source-in",
        mix:"normal"
    }
};

class ToolSetting{
    constructor(name:string,desc:string){
        this.name = name;
        this.desc = desc;
    }
    name:string;
    desc:string;
    tool:Tool;
    load(root:MenuComponent){}
    update(){ // <-- when overriding, you should probably use super so this code gets ran
        let p = selProject;
        if(!p) return;
        if(p.curFinishableAction) p.curFinishableAction.updateSettings();
    }
}
class TS_NumberValue extends ToolSetting{
    constructor(name:string,desc:string,initial:number,min:number,max:number,suffix:string){
        super(name,desc);
        this.initial = initial;
        this.min = min;
        this.max = max;
        this.suffix = suffix;
        this._val = initial;
    }
    private _val = 0;
    initial:number;
    min:number;
    max:number;
    suffix:string;
    inp:HTMLInputElement;
    load(root: MenuComponent): void {
        let {inp} = root.createInputBox(this.name,"number",this._val,this.suffix);
        this.inp = inp; 
        // inp.addEventListener("keydown",e=>{
        //     if(e.key == "Enter"){
        //         this._val = parseInt(this.inp.value) ?? this.initial;
        //         this.update();
        //     }
        // });
        // inp.addEventListener("blur",e=>{
        //     this._val = parseInt(this.inp.value) ?? this.initial;
        //     this.update();
        // });
        confirmInput(inp,e=>{
            this._val = parseInt(this.inp.value) ?? this.initial;
            this.update();
        });
    }
    update(){
        super.update();
        if(this._val < this.min) this._val = this.min;
        else if(this._val > this.max) this._val = this.max;
        if(this.inp) this.inp.value = this._val.toString();
        if(this.tool == curTool) selProject?.updateCur();
    }
    get val(){
        return this._val;
    }
    set val(v:number){
        this._val = v;
        this.update();
    }
    inc(amt:number){
        this._val += amt;
        this.update();
    }
}
class TS_BrushSize extends TS_NumberValue{
    constructor(){
        super(
            "Brush Size",
            "Controls how large the brush draws.",
            1,1,999,
            "PX"
        );
    }
}
class TS_Finish extends ToolSetting{
    constructor(){
        super("Finish","Apply and finish what the tool has done.");
    }
    load(root: MenuComponent): void {
        root.createButtonList([
            {
                label:"Cancel",
                type:ButtonType.none,
                async onclick(e, b) {
                    selProject?.curFinishableAction?.cancel();
                }
            },
            {
                label:"Finish",
                type:ButtonType.none,
                async onclick(e, b) {
                    selProject?.curFinishableAction?.finish();
                }
            }
        ]);
    }
}
class TS_BlendMode extends ToolSetting{
    constructor(){
        super("Blend Mode","Adjusts how colors mix together on the canvas.");
    }
    dd:HTMLElement;

    load(root: MenuComponent): void {
        let {inp} = root.createInputBox(this.name,"number",0,"");

        // let d = root.createFixedFlexbox("row",2);
        // d[0].createText(this.name);
        let l = MenuComponent.blank().createButtonList([
            {
                label:"Normal",
                onclick:async ()=>{

                }
            }
        ]);
        inp.replaceWith(l);

        let blends = [
            DrawMode.draw,
            DrawMode.erase,
            DrawMode.select,
            DrawMode.erase_select,
            -1,

            DrawMode.replace,
            DrawMode.add,
            DrawMode.multiply,
            DrawMode.xor,
            DrawMode.screen,
            DrawMode.overlay,
            DrawMode.darken,
            DrawMode.lighten,
            DrawMode.color_dodge,
            DrawMode.color_burn,
            DrawMode.hard_light,
            DrawMode.soft_light,
            DrawMode.difference,
            DrawMode.exclusion,
            -1,

            DrawMode.replace_all,
        ];
        let dd = l.children[0] as HTMLElement;
        this.dd = dd;
        setupDropdown(dd,"d",blends.map<DDItem>(v=>{
            if(v == -1) return {type:"hr"};
            let label = this.getLabel(v);
            return {
                label,
                case:"capitalize",
                onclick(d,cont){
                    // selProject.setDrawMode(v);
                    // selProject.setConstantDrawMode(v);
                    // selProject._forceDrawMode = v; // setActiveDrawMode which is a prop on Project which is what get's used when you draw with no keybind now, default is "Draw"
                    // selProject.setActiveDrawMode(v);
                    selProject.setBlendMode(v);
                },
                onview(d,cont){
                    if(!selProject) return;
                    // if(selProject.getActiveDrawMode() == v) d.classList.add("accent");
                    if(selProject.getBlendMode() == v) d.classList.add("accent");
                }
            };
        }));
    }
    getLabel(v:DrawMode){
        let label = DrawMode[v];
        if(v == 1) label = "Normal";
        label = label.replaceAll("_"," ");
        return label;
    }
    update(){
        super.update();
        let label = this.getLabel(selProject.getBlendMode());
        this.dd.textContent = label.split(" ").map(w=>w[0].toUpperCase()+w.substring(1)).join(" ");
    }
}

class TS_Region extends ToolSetting{
    constructor(){
        super("Region","Affects which regions the tool affects. For example: current frame, current layer, all frames.");
    }
    v = RegionType.cur_layer;
    ref:ComboboxComponent<RegionType>;

    load(root: MenuComponent): void {
        this.ref = root.createCombobox(this.name,[
            RegionType.cur_layer,
            RegionType.cur_frame
        ],[
            "Current Layer",
            "Current Frame"
        ],this.v).onchange(v=>this.v = v);
    }
    update(): void {
        super.update();
        this.ref?.update();
    }
}

enum RegionType{
    none = -1,
    cur_layer,
    cur_frame
}
enum FillToolMode{
    none = -1,
    flood,
    global
}
class TS_FillMode extends ToolSetting{
    constructor(){
        super("Fill Mode","Adjusts how the fill tool will be used, flood fill or globally.");
    }
    dd:HTMLElement;
    declare tool:FillTool;
    v = FillToolMode.flood;
    ref:ComboboxComponent<FillToolMode>;
        
    load(root: MenuComponent): void {
        let modes = [
            FillToolMode.flood,
            FillToolMode.global
        ];

        this.ref = root.createCombobox(this.name,modes,FillToolMode,this.v).onchange(v=>{
            this.v = v;
        }).getTooltips(v=>[
            "Fill only within a confined area.",
            "Fill everywhere that matches the color you click."
        ][v]);


        // let {inp} = root.createInputBox(this.name,"number",0,"");

        // let l = MenuComponent.blank().createButtonList([
        //     {
        //         label:"Flood",
        //         onclick:async ()=>{}
        //     }
        // ]);
        // inp.replaceWith(l);


        // let dd = l.children[0] as HTMLElement;
        // this.dd = dd;
        // setupDropdown(dd,"d",modes.map<DDItem>(v=>{
        //     if(v == -1) return {type:"hr"};
        //     let label = this.getLabel(v);
        //     return {
        //         label,
        //         case:"capitalize",
        //         onclick:(d,cont)=>{
        //             this.v = v;
        //             this.update();
        //         },
        //         onview:(d,cont)=>{
        //             if(this.v == v) d.classList.add("accent");
        //         }
        //     };
        // }))
    }
    // getLabel(v:FillToolMode){
    //     let label = FillToolMode[v];
    //     // if(v == 1) label = "Flood";
    //     label = label.replaceAll("_"," ");
    //     return label;
    // }
    update(){
        super.update();
        // let label = this.getLabel(this.v);
        // this.dd.textContent = label.split(" ").map(w=>w[0].toUpperCase()+w.substring(1)).join(" ");

        this.ref?.update();
    }
}

const tsRoot = new MenuComponent(d_toolSettings.children[1]);
abstract class Tool{
    constructor(name:string,icon:string){
        this.name = name;
        this.id = name.toLowerCase().replaceAll(" ","_");
        this.icon = icon;
        // this.icon = (typeof icon == "string" ? icon : allIcons[HistIcon[icon]]);
    }
    id:string;
    name:string;
    icon:string;
    _start = false;

    whenStarted = -1;
    canceled = false;

    bmode:DrawMode;

    allowedMouseButtons(){
        return [0]; // only left click
    }

    private _ttInfo = "";
    setTooltipInfo(info:string){ // could be something like for shape tool the dimensions
        this._ttInfo = info;
        // update info element in status bar...
    }

    // getDesc(){
    //     return "No description.";
    // }
    abstract getDesc():string;

    getSettings():ToolSetting[]{
        return [];
    }
    loadSettings(){
        // let cont = d_toolSettings.children[1];
        tsRoot.body.textContent = "";
        // let root = new MenuComponent(cont);
        let root = tsRoot;
        let settings = this.getSettings();
        for(const s of settings){
            s.tool = this;
            s.load(root);
        }

        if(selProject?.curFinishableAction) if(selProject.curFinishableAction.tool == this){
            let ts = new TS_Finish();
            ts.load(tsRoot);
        }

        this.updateSettings();
    }
    onSelect(){
        let p = selProject;
        if(!p) return;
        if(this.doesUseCursor()) p.useCursor();
        else p.endCursor();
        this.loadSettings();
    }
    onDeselect(){
        
    }
    canUse(){
        if(selProject.lockAllEdits) return false; // can't start a new tool use while locked
        return true;
    }
    start(){
        if(!this.canUse()) return;
        if(!selProject) return;
        let l = selProject.curFrame.curLayers[0];
        if(l) if(l.lref.hidden || l.lref.locked){
            console.log("Canceled, layer is hidden or locked");
            return;
        }
        this.inUse = true;
        this.whenStarted = performance.now();
    };
    move(e:UniversalMouseEvent):Promise<void>|void{}
    async draw(e:UniversalMouseEvent):Promise<void>{
        if(!this._start) await this.startUse();
        this._start = true;
    }
    end(){
        this.inUse = false;
        this._start = false;
        this.whenStarted = -1;
        this.canceled = false;
        selProject?.resetTmpBlendMode();
    }
    beforeEnd():Promise<void>|void{}
    afterEnd(){}
    inUse = false;

    startUse():Promise<void>|void{}

    _ref:HTMLElement;

    updateSettings(){
        for(const s of this.getSettings()){
            s.update();
        }
    }

    doesUseCursor(){
        return false;
    }
    renderCursor(ctx:CanvasRenderingContext2D,color?:string){}
    updateCursor(){}

    onDown(){
        let p = selProject;
        if(!p) return;
        let _generic = false;
        let alpha = 1;
        let ctx = p.main;
        let w = 1;
        let c = col;
        
        // let drawMode:number = DrawMode.draw;
        let drawMode:number = p.getBlendMode();
        let aph = 1; // 0.39;
        if(!_generic){
            if(ctrlKey){
                if(altKey){
                    drawMode = DrawMode.erase_select;
                }
                else{
                    drawMode = DrawMode.select;
                }
                // p.setDrawMode(DrawMode.select);
                // p.setTmpDrawMode(DrawMode.select);
            }
            else if(altKey){
                drawMode = DrawMode.erase;
            }
        }

        if(drawMode == DrawMode.erase_select){
            c = eraseColStr;
            alpha = aph;
            startTransLayer();
            p.setTmpBlendMode(drawMode);
        }
        else if(drawMode == DrawMode.select){
            c = selColStr;
            alpha = aph;
            startTransLayer();
            p.setTmpBlendMode(drawMode);
        }
        else if(drawMode == DrawMode.erase){
            c = eraseColStr;
            alpha = aph;
            startTransLayer();
            p.setTmpBlendMode(drawMode);
            // p.setDrawMode(DrawMode.erase);
            // p.setTmpDrawMode(DrawMode.erase);
        }

        // p.setBlendMode(drawMode);
        // p.setDrawMode(drawMode);
        // p.updateDrawMode();

        ctx.fillStyle = c;
        ctx.strokeStyle = c;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = w;

        this.bmode = p.getBlendMode();
    }
    async onUp(){
        endTransLayer();
    }

    /**
     * This is a moderate performance cost for it not to add to hist when no change was actually made.
     */
    checkForChange(){
        if(!selProject) return false;
        let _data = selProject.main.getImageData(0,0,selProject.w,selProject.h).data;
        return _data.includes(255);
    }

    allowTouch(){
        return false;
    }
    onTouchMove(e:UniversalMouseEvent){}

    cancel(){
        if(this.canceled) return false;
        
        let thres = 300; // 300 ms
        if(performance.now()-thres > this.whenStarted){
            console.warn("Canceled current tool...");
            this.canceled = true;
            return true;
        }

        return false;
    }
}
// let col = "red";
let col = "rebeccapurple";
let gAlpha = 1;
// let brushSize = 1;

let _useNE1 = false;

function drawPixel(data:Uint8ClampedArray,ctx:CanvasRenderingContext2D,x:number,y:number,col:number[]|Uint8ClampedArray,w=1,mode:DrawMode){
    x = Math.floor(x);
    y = Math.floor(y);
    let sw = ctx.canvas.width;
    
    if(_useNE1){
        let i = (x+y*sw)*4;
        data[i] = col[0];
        data[i+1] = col[1];
        data[i+2] = col[2];
        data[i+3] = col[3];
    }
    else{
        let hw = 0;
        if(w > 1) hw = Math.round(w/2);
        if(mode == DrawMode.draw) ctx.fillRect(x-hw,y-hw,w,w);
        // else if(mode == DrawMode.erase) ctx.clearRect(x-hw,y-hw,w,w);
        else if(mode == DrawMode.erase){
            ctx.fillStyle = eraseColStr;
            ctx.globalAlpha = eraseCol[3];
            ctx.fillRect(x-hw,y-hw,w,w);
        }
        else if(mode == DrawMode.select){
            ctx.fillStyle = selColStr;
            ctx.globalAlpha = selCol[3];
            ctx.fillRect(x-hw,y-hw,w,w);
            selProject.sel.fillRect(x-hw,y-hw,w,w);
        }
        else if(mode == DrawMode.erase_select){
            ctx.fillStyle = eraseColStr;
            ctx.globalAlpha = eraseCol[3];
            ctx.fillRect(x-hw,y-hw,w,w);
            selProject.sel.fillRect(x-hw,y-hw,w,w);
        }
    }
}

const util = {
    line(x0:number,y0:number,x1:number,y1:number,ar:number[],_w:number){
        let ly = y1-y0;
        let lx = x1-x0;
        let m = ly/lx;
        let am = Math.abs(m);

        x0 = Math.floor(x0);
        x1 = Math.floor(x1);
        y0 = Math.floor(y0);
        y1 = Math.floor(y1);
  
        let dx = Math.abs(x1-x0);
        let sx = x0<x1 ? 1 : -1;
        let dy = -Math.abs(y1-y0);
        let sy = y0<y1 ? 1 : -1;
        let err = dx+dy;
  
        while(true){
            if(am >= 1){ //vertical slope
                ar.push((Math.floor(x0)+Math.floor(y0)*_w)*4);
            }
            else{ //horz slope
                ar.push((Math.floor(x0)*4+Math.floor(y0)*_w)*4);
            }
          
            if(x0 == x1 && y0 == y1) break;
            let e2 = 2*err;
            if(e2 >= dy){
                err += dy;
                x0 += sx;
            }
            if(e2 <= dx){
                err += dx;
                y0 += sy;
            }
        }
    },
    circle(x1:number,y1:number,r:number,ar:number[],_w:number){
        if(Math.floor(r) <= 1){
            ar.push((Math.floor(x1)+Math.floor(y1)*_w)*4);
            return;
        }
        r = Math.floor(r);
        x1 = Math.floor(x1);
        y1 = Math.floor(y1);
        let x = x1-r;
        let y = y1-r;
        let ind = (x+y*_w)*4;
        ind = 0;
        let d = r+r;
        let last = 0;
        for(let j = 0; j < d; j++){
            let j2 = j-r;
            let l:number;
            if(r < 6) l = Math.floor(Math.abs(Math.sqrt(r*r-j2*j2)));
            else l = Math.round(Math.abs(Math.sqrt(r*r-j2*j2)));
            let ll = l*4;
            if(l >= last) for(let k = last; k < l; k++){
                let i = ind+ll+k*4;
                let pass = true;
                if(x < 0) pass = false;
                else if(x >= _w) pass = false;
                if(pass){
                    // ar.push(i - x1*4 - y1*_w*4);
                    ar.push(i);
                }
            }
            last = ll;
            y++;
            ind += (_w*4);
        }
    },
    circle2(x1:number,y1:number,r:number,ar:number[],_w:number){
        x1 = Math.floor(x1);
        y1 = Math.floor(y1);
        r = Math.floor(r);
        // let inc = Math.PI/r/2;
        // let a = 0;
        let lastX = 0;
        for(let j = -r; j <= r; j++){
            // a += inc;
            let ll = Math.floor(Math.abs(Math.sqrt(r*r-j*j)));
            let l = ll/2;
            if(l >= lastX) for(let i = lastX; i <= l; i++){
                // this.setPixel(x1+l+i,y1+j,col);
                // ar.push((Math.floor(x1+l+i)+Math.floor(y1+j)*_w)*4);
                ar.push(Math.floor(x1+l+i+(y1+j)*_w)*4);
            }
            else for(let i = lastX; i >= l; i--){
                // this.setPixel(x1+l+i,y1+j,col);
                // ar.push((Math.floor(x1+l+i)+Math.floor(y1+j)*_w)*4);
                ar.push(Math.floor(x1+l+i+(y1+j)*_w)*4);
            }
            lastX = l;
        }
    },
    pixel(x:number,y:number,ar:number[],_w:number,tolx:number,toly:number){
        if(tolx != null) for(let i = -tolx; i < tolx; i++) ar.push((x+i+y*_w)*4);
        if(toly != null) for(let i = -toly; i < toly; i++) ar.push((x+(y+i)*_w)*4);
    },
    circle3(xc:number,yc:number,r:number,ar:number[],_w:number,tolx:number,toly:number){
        xc = Math.floor(xc);
        yc = Math.floor(yc);
        r = Math.floor(r);
        if(r == 1){
            util.pixel(xc,yc,ar,_w,tolx,toly);
            return;
        }
        r--;
        if(r < 1) r = 1;
        function drawCircle(xc:number, yc:number, x:number, y:number){
            util.pixel(xc-x,yc+y,ar,_w,tolx,toly);
            util.pixel(xc+x,yc+y,ar,_w,tolx,toly);
            util.pixel(xc-x,yc-y,ar,_w,tolx,toly);
            util.pixel(xc+x,yc-y,ar,_w,tolx,toly);
            util.pixel(xc-y,yc+x,ar,_w,tolx,toly);
            util.pixel(xc+y,yc+x,ar,_w,tolx,toly);
            util.pixel(xc-y,yc-x,ar,_w,tolx,toly);
            util.pixel(xc+y,yc-x,ar,_w,tolx,toly);
        }
        
        let x = 0, y = r;
        let d = 3 - 2 * r;
        drawCircle(xc, yc, x, y);
        while (y >= x){
            x++;
            if(d > 0){
                y--;
                d = d + 4 * (x - y) + 10;
            }
            else d = d + 4 * x + 6;
            drawCircle(xc, yc, x, y);
        }
    }
};

function flipToBackBuffer(canvas:HTMLCanvasElement){
    let p = selProject;
    if(!p) return;
    if(!p.backMain){
        let can = document.createElement("canvas");
        can.width = p.w;
        can.height = p.h;
        p.backMain = can.getContext("2d");
    }
    p.backMain.drawImage(canvas,0,0);
}
function flipToSelBuffer(canvas:HTMLCanvasElement){
    let p = selProject;
    if(!p) return;
    if(!p.sel){
        let can = document.createElement("canvas");
        can.width = p.w;
        can.height = p.h;
        p.sel = can.getContext("2d");
    }
    p.sel.drawImage(canvas,0,0);
}
function startTransLayer(){
    let p = selProject;
    if(!p) return;
    p.cont.classList.add("trans");
}
function endTransLayer(){
    let p = selProject;
    if(!p) return;
    p.cont.classList.remove("trans");
}
async function drawLine(ctx:CanvasRenderingContext2D,x0:number,y0:number,x1:number,y1:number,col:string,alpha:number,w:number,_generic=false,noRTErase=false,usesErasePreview=true){
    let p = selProject;

    if(mobileMode) if(x0 == x1 && y0 == y1) return; // ENABLE this if you want it to not draw on click and only on mouse move
    // if(isNaN(x0)) return;

    let isDrawType = undefined;

    if(keys.pagedown){
        p.setBlendMode(DrawMode.multiply);
        // p.setDrawMode(DrawMode.multiply);
    }
    else if(keys["2"]){
        p.setBlendMode(DrawMode.replace);
        // p.setDrawMode(DrawMode.replace);
        // isDrawType = true;
    }

    // let drawMode = p.getDrawMode();
    let drawMode = p.getBlendMode();
    if(isDrawType == undefined) isDrawType = (drawMode == DrawMode.draw);
    if(isDrawType){
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.globalAlpha = alpha;
    }
    ctx.lineWidth = w;

    function end(){
        if(drawMode >= DrawMode.multiply){
            // console.log("DRAW:",ctx.globalCompositeOperation,col);
            // let data = ctx.getImageData(0,0,p.w,p.h).data;
            // endDCan();
            // postEndDCan();
            // ctx.putImageData(new ImageData(data,p.w,p.h),0,0);
        }
    }

    if(w >= 1 || true){
        let main = ctx;
        if(false && drawMode == DrawMode.select){
            let sel = p.sel;
            let erase = altKey;
            let res = false;
            if(erase){
                let tmpCan = document.createElement("canvas");
                tmpCan.width = p.w;
                tmpCan.height = p.h;
                let ct = tmpCan.getContext("2d");
                ct.lineWidth = w;
                ct.lineCap = "round";
                ct.beginPath();
                ct.moveTo(Math.round(x0),Math.round(y0));
                ct.lineTo(Math.round(x1),Math.round(y1));
                ct.stroke();
                ct.fillRect(Math.floor(x1),Math.floor(y1),1,1);

                await selProject.applyEffected(Math.min(x0,x1)-w,Math.max(x0,x1)+w+1,Math.min(y0,y1)-w,Math.max(y0,y1)+w+1);
                res = correctCtx(ct);

                sel.globalCompositeOperation = "destination-out";
                sel.drawImage(tmpCan,0,0);
                sel.globalCompositeOperation = "source-over";

                updateSelection();
                return res;
            }
            else{
                sel.lineWidth = w;
                sel.beginPath();
    
                sel.lineCap = "round";
    
                sel.moveTo(Math.round(x0),Math.round(y0));
                sel.lineTo(Math.round(x1),Math.round(y1));
                // 

                sel.stroke();
                sel.fillRect(Math.floor(x1),Math.floor(y1),1,1);

                await selProject.applyEffected(Math.min(x0,x1)-w,Math.max(x0,x1)+w+1,Math.min(y0,y1)-w,Math.max(y0,y1)+w+1);
                res = correctCtx(p.sel);
                updateSelection();
                return res;
            }
        }
        else if(false && drawMode == DrawMode.erase){
            main.beginPath();

            main.lineCap = "round";

            main.moveTo(Math.round(x0),Math.round(y0));
            main.lineTo(Math.round(x1),Math.round(y1));
            main.stroke();

            main.fillRect(Math.floor(x1),Math.floor(y1),1,1);
        }
        else{
            if(w > 1){
                main.beginPath();

                main.lineCap = "round";

                main.moveTo(Math.round(x0),Math.round(y0));
                main.lineTo(Math.round(x1),Math.round(y1));
                main.stroke();
            }
            else{
                let hw = Math.floor(w/2); //half width
                if(w < 1 && w > 0.1) w = 1;
                let ly = y1-y0;
                let lx = x1-x0;
                let m = ly/lx;
                let am = Math.abs(m);

                let maxTimes = p.w+p.h; // over-estimate but it works
                let times = 0;
                
                {
                    x0 = Math.floor(x0);
                    x1 = Math.floor(x1);
                    y0 = Math.floor(y0);
                    y1 = Math.floor(y1);

                    let dx = Math.abs(x1-x0);
                    let sx = x0<x1 ? 1 : -1;
                    let dy = -Math.abs(y1-y0);
                    let sy = y0<y1 ? 1 : -1;
                    let err = dx+dy;

                    while(true){
                        times++;
                        if(times > maxTimes) break;
                        if(am >= 1){ //vertical slope
                            main.fillRect(Math.floor(x0-hw),Math.floor(y0-hw),1,1);
                        }
                        else{ //horz slope
                            main.fillRect(Math.floor(x0-hw),Math.floor(y0-hw),1,1);
                        }
                        
                        if(x0 == x1 && y0 == y1) break;
                        let e2 = 2*err;
                        if(e2 >= dy){ /* e_xy+e_x > 0 */
                            err += dy;
                            x0 += sx;
                        }
                        if(e2 <= dx){ /* e_xy+e_y < 0 */
                            err += dx;
                            y0 += sy;
                        }
                    }
                }
            }
            main.fillRect(Math.floor(x1),Math.floor(y1),1,1);
        }
        
        {
            // let ar = [];
            // let ww = Math.ceil(brushSize/2);
            // let x = Math.floor(Math.min(x0,x1)-w/2)-ww;
            // let y = Math.floor(Math.min(y0,y1)-w/2)-ww;
            // let tw = Math.floor(Math.abs(x1-x0)+w)+ww+ww;
            // let th = Math.floor(Math.abs(y1-y0)+w)+ww+ww;
            
            // let ind = 0;
            // let ii = ind;
            // if(false) for(let yy = 0; yy < th; yy++){
            //     for(let xx = 0; xx < tw; xx++){
            //         ar.push(ii);
            //         ii += 4;
            //     }
            // }

            // let dx = x1-x0;
            // let dy = y1-y0;
            // let ang = Math.atan2(dy,dx);
            // let per = ang+Math.PI/2;
            // let tx = Math.cos(per)*ww+x0;
            // let ty = Math.sin(per)*ww+y0;
            // let tx1 = Math.cos(per)*ww+x1;
            // let ty1 = Math.sin(per)*ww+y1;
            // util.line(x0,y0,x1,y1,ar,tw);
            // util.line(tx,ty,tx1,ty1,ar,tw);
            // util.circle3(tw/2,th/2,w-3,ar,Math.floor(tw),4,4);
            // util.circle(tw/2,th/2,w,ar,tw);
        }

        if(drawMode != DrawMode.select && drawMode != DrawMode.erase_select) applySelectionPost();

        // selProject.correctCustomEffected(x,y,tw,th,ar,main);

        if(w > 1) await selProject.applyEffected(Math.min(x0,x1)-w,Math.max(x0,x1)+w+1,Math.min(y0,y1)-w,Math.max(y0,y1)+w+1);
        else await selProject.applyEffected(Math.min(x0,x1)-5,Math.max(x0,x1)+5,Math.min(y0,y1)-5,Math.max(y0,y1)+5);
        let res = correctCtx(main);

        // let mode = p.getFinalDrawMode();
        if(false) if(drawMode == DrawMode.erase){
            // let c = col;
            // col = "rgba(0,0,0,0.1)";
            if(!p.backMain){
                let can = document.createElement("canvas");
                can.width = p.w;
                can.height = p.h;
                p.backMain = can.getContext("2d");
            }
            p.backMain.drawImage(main.canvas,0,0);
            endDCan();

            // col = c;
        }

        if(!noRTErase) if(drawMode == DrawMode.erase){
            flipToBackBuffer(main.canvas);
            endDCan();

            postEndDCan();

        }

        end();

        return res;
        
        // let start = performance.now();
        // console.log("TIME: ",performance.now()-start);
        // await startWorkers_correct(main);
    }
    else{
        let cola = [...convert(col)];
        let data = (_useNE1 ? ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height).data : null);
        let tmpDrawMode = drawMode;
        // if(usesErasePreview) tmpDrawMode = DrawMode.draw;
        
        let hw = Math.floor(w/2); //half width
        if(w < 1 && w > 0.1) w = 1;
        let ly = y1-y0;
        let lx = x1-x0;
        let m = ly/lx;
        let am = Math.abs(m);

        let maxTimes = p.w+p.h; // over-estimate but it works
        let times = 0;
        
        {
            x0 = Math.floor(x0);
            x1 = Math.floor(x1);
            y0 = Math.floor(y0);
            y1 = Math.floor(y1);

            let dx = Math.abs(x1-x0);
            let sx = x0<x1 ? 1 : -1;
            let dy = -Math.abs(y1-y0);
            let sy = y0<y1 ? 1 : -1;
            let err = dx+dy;

            while(true){
                times++;
                if(times > maxTimes) break;
                if(am >= 1){ //vertical slope
                    drawPixel(data,ctx,x0-hw,y0-hw,cola,w,tmpDrawMode);
                    // this.drawRect(x0-hw,y0-hw,w,w,c);
                    /*for(let i = -hw; i <= hw; i++){
                        this.setPixel(x0+i,y0,c);
                        //if(this.useRecord){
                            //this.recMap[Math.floor(x0+i+y0*nob.width)] = 1;
                            //if(!this.pMap.has(c)) this.pMap.set(c,[]); 
                            //this.pMap.get(c).push((x0+i+y0*this.width)*4);
                        //}
                    }*/
                }
                else{ //horz slope
                    drawPixel(data,ctx,x0-hw,y0-hw,cola,w,tmpDrawMode);
                    // this.drawRect(x0-hw,y0-hw,w,w,c);
                    /*for(let i = -hw; i <= hw; i++){
                        this.setPixel(x0,y0+i,c);
                        //if(this.useRecord) this.recMap[Math.floor(x0+(y0+i)*nob.width)] = 1;
                        //if(!this.pMap.has(c)) this.pMap.set(c,[]); 
                        //this.pMap.get(c).push((x0+(y0+i)*this.width)*4);
                    }*/
                }
                //if(!res) break;
                
                if(x0 == x1 && y0 == y1) break;
                let e2 = 2*err;
                if(e2 >= dy){ /* e_xy+e_x > 0 */
                    err += dy;
                    x0 += sx;
                }
                if(e2 <= dx){ /* e_xy+e_y < 0 */
                    err += dx;
                    y0 += sy;
                }
            }
        }

        if(drawMode != DrawMode.select && drawMode != DrawMode.erase_select) applySelectionPost();
        if(tmpDrawMode == DrawMode.erase){
            flipToBackBuffer(p.main.canvas);
            endDCan();

            postEndDCan();

        }

        if(_useNE1) ctx.putImageData(new ImageData(data,ctx.canvas.width,ctx.canvas.height),0,0);
        
        end();

        return true;
    }
}

const _noDesc = "No description.";

abstract class DrawingTool extends Tool{
    brushSize = new TS_BrushSize();
    getSettings(): ToolSetting[] {
        return [
            this.brushSize,
            selProject.blendComp
        ];
    }
    doesUseCursor(): boolean {
        return true;
    }
    renderCursor(ctx: CanvasRenderingContext2D, color?:string): void {
        let p = selProject;
        if(!p) return;
        
        // let w = Math.ceil(brushSize/p.w*p.main.canvas.offsetWidth);
        // let h = Math.ceil(brushSize/p.h*p.main.canvas.offsetHeight);
        // console.log(w,h);
        // ctx.canvas.width = w;
        // ctx.canvas.height = h;

        if(this.brushSize.val != 1){            
            let newW = this.brushSize.val+4
            let newH = this.brushSize.val+4;
            let tmp = ctx.fillStyle;
            
            let newColor = "#000";
            if(color) newColor = color;

            ctx.fillStyle = newColor;
            newColor = ctx.fillStyle; // <-- I'm not crazy, I'm trying to convert them all to a standard format
            ctx.fillStyle = tmp;
            
            if(ctx.canvas.width == newW && ctx.canvas.height == newH){ // && newColor == ctx.fillStyle
                return; // don't need to do any new rendering! <-- fixes major bug that's been driving me insane for so long and hopefully drastically improves performance! not compatible with colors at the moment TT
            }
            
            // console.warn("something was different:");
            // console.log(ctx.canvas.width,newW);
            // console.log(ctx.canvas.height,newH);
            // console.log(newColor,ctx.fillStyle);
            
            ctx.canvas.width = newW;
            ctx.canvas.height = newH;
            ctx.imageSmoothingEnabled = false;

            let cx = ctx.canvas.width/2;
            let cy = ctx.canvas.height/2;
            // ctx.beginPath();
            // // ctx.arc(ctx.canvas.width/2,ctx.canvas.height/2,ctx.canvas.width/2-0.5,0,Math.PI*2);
            // ctx.lineCap = "round";
            // ctx.lineWidth = brushSize;
            // ctx.moveTo(cx,cy);
            // ctx.lineTo(cx,cy);
            // ctx.strokeStyle = "black";
            // ctx.stroke();
            
            // drawLine(ctx,cx,cy,cx,cy,"black",1,this.brushSize.val,true);

            ctx.fillStyle = newColor;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.globalAlpha = 1;
            
            // ctx.beginPath();
            // ctx.arc(Math.ceil(cx),Math.ceil(cy),this.brushSize.val/2,0,Math.PI*2);
            // ctx.fill();
            let w = this.brushSize.val;

            ctx.beginPath();

            ctx.lineCap = "round";
            ctx.lineWidth = w;

            let rcx = Math.round(cx);
            let rcy = Math.round(cy);
            ctx.moveTo(rcx,rcy);
            ctx.lineTo(rcx,rcy);
            ctx.stroke();

            // drawLine(ctx,cx,cy,cx,cy,color??"black",1,w);
            let tol = 5;
            p.applyEffectedInstant(rcx-w-tol,rcx+w+tol,rcy-w-tol,rcy+w+tol);

            // console.log(selProject._mL,
            //     selProject._mR,
            //     selProject._mT,
            //     selProject._mB);

            // correctCtx_general(ctx,color?[...convert(color)]:undefined,-20);
            // correctCtx_general(ctx,color?[...convert(color)]:undefined);
            correctCtx(ctx);

            p.updateCurPos(cmx,cmy); // when some have odd sizes they get shifted off the grid so this fixes that pop-in ish kind of effect

            console.log("---RENDER");
        }
        else{
            ctx.canvas.width = 1;
            ctx.canvas.height = 1;
            ctx.imageSmoothingEnabled = false;

            if(color) ctx.fillStyle = color;
            else ctx.fillStyle = "#000";
            
            ctx.fillRect(0,0,1,1);

            p.updateCurPos(cmx,cmy);
        }
    }
    afterEnd(): void {
        super.afterEnd();
        selProject.backMain = null;
    }
    wasChange = false;
}
class PencilTool extends DrawingTool{
    constructor(){
        super("Draw","draw.svg");
    }
    getDesc(): string {
        return "A tool to draw pixels onto the canvas.";
    }
    onSelect(): void {
        super.onSelect();
    }

    start(): void {
        super.start();
        startTool();
        this.wasChange = false;
        // if(!altKey && !ctrlKey && !shiftKey) selProject?.setTmpDrawMode(selProject.getActiveDrawMode());
    }
    async draw(e:UniversalMouseEvent) {
        await super.draw(e);
        if(mouseDown[0]){
            let change = await drawLine(selProject.main,lx,ly,mx,my,col,gAlpha,this.brushSize.val);
            if(change) this.wasChange = true;
        }
    }
    // async onUp(): Promise<void> {
    //     if(mobileMode) if(Math.floor(smx) == Math.floor(mx) && Math.floor(smy) == Math.floor(my)){
    //         let change = await drawLine(selProject.main,lx,ly,mx,my,col,gAlpha,this.brushSize.val);
    //         if(change) this.wasChange = true;
    //     }
    // }
    beforeEnd(): void {
        
    }
    end(): void {
        super.end();
        let p = selProject;
        if(!p) return;
        // let mode = p.getFinalDrawMode();
        // let mode = p.getBlendMode();
        // if(mode == DrawMode.draw) mode = p.getActiveDrawModePost();
        if(this.wasChange) if(p.applyChangeToAll()){
            // let name = (["None","Draw","Erase","Select","Erase Select",""][mode]);
            let name = DrawMode[this.bmode].replaceAll("_"," ").split(" ").map(w=>w[0].toUpperCase()+w.substring(1)).join(" ");
            selProject.hist.add(new HA_CanCopy(name,this.bmode));
        }
        endTool();
    }
}

class EraserTool extends PencilTool{
    constructor(){
        super();
        this.name = "Erase";
        this.icon = "erase.svg";
        this.id = this.name.toLowerCase().replaceAll(" ","_");
    }
    getSettings(): ToolSetting[] {
        return [
            this.brushSize
        ];
    }
    start(): void {
        selProject?.setTmpBlendMode(DrawMode.erase);
        super.start();
    }
    getDesc(): string {
        return "A tool to erase pixels from the canvas.";
    }
}

class LineTool extends DrawingTool{
    constructor(){
        super("Line","line.svg");
        for(const a of this._snapAngles){
            let inc = 360/a/2;
            for(let i = 0; i < 360; i += inc){
                if(!this.snapAngles.includes(i)) this.snapAngles.push(i);
            }
        }
    }
    getDesc(): string {
        return "A tool to draw straight lines from point to point.";
    }
    wasChange = false;
    _snapAngles = [4,6]; // 4,3 means all 4ths: 45deg, 90deg..., and all 3rds: 30deg, 60deg, 90deg (dup)
    snapAngles = [];
    start(): void {
        super.start();
        startTool();
    }
    end(): void {
        super.end();
        let p = selProject;
        if(!p) return;
        if(this.wasChange) if(p.applyChangeToAll()) selProject.hist.add(new HA_CanCopy(this.name,this.bmode));
        endTool();
    }
    async draw(e:UniversalMouseEvent) {
        await super.draw(e);
        let p = selProject;
        if(lMouseDown[0]){
            let tx = mx;
            let ty = my;
            let dx = mx-smx;
            let dy = my-smy;
            let dist = Math.sqrt(dx**2+dy**2);
            let ang = Math.atan2(dy,dx);
            let deg = ang/Math.PI*180;
            let _dist = 9999;
            let _ang = ang;
            let isSnapping = false;
            if(shiftKey) isSnapping = true;
            for(let a of this.snapAngles){
                let d = Math.abs(a-deg);
                d %= 360;
                if(d > 180) d = 360-d;
                if(d < _dist){
                    _dist = d;
                    _ang = a;
                }
            }
            if(isSnapping){
                _ang *= Math.PI/180;
                tx = Math.cos(_ang)*dist+smx;
                ty = Math.sin(_ang)*dist+smy;
            }
            
            p.main.clearRect(0,0,p.w,p.h);
            let change = await drawLine(p.main,smx,smy,tx,ty,col,gAlpha,this.brushSize.val,false,true,true);
            if(change) this.wasChange = true;
        }
    }
}
class SelectTool extends Tool{
    constructor(){
        super("Select","select.svg");
    }
    getDesc(): string {
        return "A tool to create rectanglar selections.";
    }
    doesUseCursor(): boolean {
        return true;
    }
    wasDeselect = false;
    start(): void {
        super.start();
        startTool();
        let p = selProject;
        if(!p) return;
        this.wasDeselect = false;
    }
    end(): void {
        super.end();
        endTool();
        let p = selProject;
        if(!p) return;
        p.endSelMode();
    }
    async draw(e:UniversalMouseEvent){
        await super.draw(e);
        
        let p = selProject;
        if(!p) return;

        if(altKey) p.main.fillStyle = eraseColStr;

        if(lMouseDown[0]){
            let sx = Math.floor(smx);
            let sy = Math.floor(smy);
            let fx = Math.floor(mx);
            let fy = Math.floor(my);
            if(fx >= sx) fx++;
            else sx++;
            if(fy >= sy) fy++;
            else sy++;

            p.main.clearRect(0,0,p.w,p.h);
            // if(keys["alt"]) p.main.clearRect(sx,sy,fx-sx,fy-sy);
            // else p.main.fillRect(sx,sy,fx-sx,fy-sy);
            p.main.fillRect(sx,sy,fx-sx,fy-sy);
            // updateSelection();
        }
    }
    async beforeEnd(){
        let p = selProject;
        if(!p) return;

        let sx = Math.floor(smx);
        let sy = Math.floor(smy);
        let fx = Math.floor(mx);
        let fy = Math.floor(my);
        if(fx >= sx) fx++;
        else sx++;
        if(fy >= sy) fy++;
        else sy++;

        if(altKey){
            p.sel.clearRect(sx,sy,fx-sx,fy-sy);
        }
        else p.sel.drawImage(p.main.canvas,0,0);
        p.main.clearRect(0,0,p.w,p.h);

        updateSelection(); // <- this is to calc whether or not there is a selection to use for applySelPost, could also probably calculate this by using sx,sy,fx,fy instead
        if(this.wasDeselect && !p.isSel && _overCanvas){
            selProject.hist.add(new HA_DeselectAll());
            return;
        }
        if(Math.abs(fx-sx) < 1 && Math.abs(fy-sy) < 1) return;

        p.main.fillStyle = col;

        // if(!this.wasDeselect) return;
        // if(!this.wasDeselect && (p.isSel ? (Math.abs(fx-sx) < 1 && Math.abs(fy-sy) < 1) : false)) return;
        applySelectionPost();
        selProject.hist.add(new HA_Select());
    }
    async startUse():Promise<void>{
        let p = selProject;
        if(!p) return;
        p.startSelMode();
        if(!ctrlKey && !altKey){
            this.wasDeselect = true;
            p.sel.clearRect(0,0,p.w,p.h);
            updateSelection();
        }
    }
}
enum PointerToolMode{
    normal,
    add,
    remove
};
abstract class PointerToolBase extends Tool{
    sel:HTMLElement;
    hovers:CanvasObj[] = [];
    mode = PointerToolMode.normal;
    // getSettings(): ToolSetting[] {
    //     return [new TS_Finish()];
    // }
    doesUseCursor(): boolean {
        return false;
    }
    canUse(): boolean {
        if(!selProject) return false;
        let p = selProject;
        if(p.hoverCO) return false;
        return true;
    }
    beforeEnd(): void | Promise<void> {
        let all = document.querySelectorAll(".pointer-selection");
        for(const c of all){
            c.remove();
        }
        for(const o of this.hovers){
            if(this.mode == PointerToolMode.remove) o.deselect();
            else o.select();
            o.unhover();
        }
        if(selProject.hoverCO) selProject.hoverCO.hover();
    }
    onDeselect(): void {
        selProject?.deselectAllCanObjs();
    }
}
class PointerTool extends PointerToolBase{
    constructor(){
        super("Pointer","pointer.svg");
    }
    getDesc(): string {
        return "A tool for moving, rotating, and scaling objects in the scene.";
    }
    onDown(): void {
        let p = selProject;
        if(!p) return;

        let sel = document.createElement("div");
        sel.className = "pointer-selection";
        this.sel = sel;

        p.canObjArea.appendChild(sel);

        if(ctrlKey || shiftKey) this.mode = PointerToolMode.add;
        else if(altKey) this.mode = PointerToolMode.remove;
        else this.mode = PointerToolMode.normal;
    }
    async draw(): Promise<void> {
        let sel = this.sel;
        if(!sel) return;
        let p = selProject;
        if(!p) return;
        let x = Math.min(smx,mx);
        let y = Math.min(smy,my);
        let w = Math.max(smx,mx)-x;
        let h = Math.max(smy,my)-y;
        sel.style.left = (x/p.w*100)+"%";
        sel.style.top = (y/p.h*100)+"%";
        sel.style.width = (w/p.w*100)+"%";
        sel.style.height = (h/p.h*100)+"%";

        let l = Math.min(csmx,cmx);
        let t = Math.min(csmy,cmy);
        let r = Math.max(csmx,cmx);
        let b = Math.max(csmy,cmy);

        // find
        this.hovers = [];
        p.unhoverAllCanObjs();
        for(const o of p.canObjs){
            let c = o.cont;
            if(!c) continue;
            let rect = c.getBoundingClientRect();
            if(rect.left > r) continue;
            if(rect.right < l) continue;
            if(rect.top > b) continue;
            if(rect.bottom < t) continue;
            o.hover();
            this.hovers.push(o);
        }
    }
}
class SelectPointerTool extends PointerToolBase{
    constructor(){
        super("Select Pointer","select_pointer.svg");
    }
    getDesc(): string {
        return "A tool to select objects in a scene.";
    }
    copy:HTMLCanvasElement;
    onSelect(): void {
        console.log("selected");
    }
    onDeselect(): void {
        console.warn("deselected");
    }
    onDown(): void {
        if(!selProject) return;
        if(selProject.curFinishableAction) return;
        if(!selProject.isSel) return;
        // startFinishableAction(new FA_EditSelection(copyCan(selProject.sel.canvas),0,0));

        this.copy = copyCan(selProject.sel.canvas);
        selProject.edit.deselectAll(true);

        console.log("down");
    }
    async draw(): Promise<void> {
        if(!selProject) return;
        if(!this.copy) return;
        console.log("draw");
        selProject.clearPrev();
        selProject.prev.globalAlpha = 0.35;
        selProject.prev.drawImage(this.copy,Math.floor(mx-smx),Math.floor(my-smy));
    }
    async onUp() {
        super.onUp();
        console.log("on up");
        if(!this.copy) return;
        selProject.sel.drawImage(this.copy,Math.floor(mx-smx),Math.floor(my-smy));
        updateSelection();
        selProject.hist.add(new HA_Select(false,true));
        this.copy = null;
        selProject.clearPrev();
    }
}

class FillTool extends DrawingTool{
    constructor(){
        super("Fill Tool","fill4.svg");
    }
    getDesc(): string {
        return "A tool to fill an area, whether it's contiguous or not.";
    }
    
    fillMode = new TS_FillMode();
    regionType = new TS_Region();
    getSettings(): ToolSetting[] {
        return [
            this.fillMode,
            this.regionType
        ];
    }
    
    doesUseCursor(): boolean {
        return true;
    }
    downRes:()=>void;
    downProm:Promise<void>;
    async onDown() {
        let p = selProject;
        if(!p) return;
        let drawMode = getDrawMode();

        p.startLockEdits();

        this.downProm = new Promise<void>(resolve=>{
            this.downRes = resolve;
        });

        let isSelectMode = (drawMode == DrawMode.select || drawMode == DrawMode.erase_select);
        if(isSelectMode){
            if(!altKey && !shiftKey){
                p.sel.clearRect(0,0,p.w,p.h);
                updateSelection();
            }
        }
        
        let run = async (layer:Layer,ctx:CanvasRenderingContext2D)=>{
            if(!layer) return;
            if(!ctx) return;

            layer.applyChange(true,true);
            let startI = Math.floor(mx)+Math.floor(my)*p.w;
            
            let map = new Uint8Array(p.w*p.h);
            let buf:Uint32Array;
            if(this.regionType.v == RegionType.cur_frame){ // right now this could possibly be VERY performance intensive (but only when starting the fill), but in my testing it seems it only would for many layers of all high resolution
                buf = new Uint32Array(p.w*p.h);
                for(let i = p.gLayers.length-1; i >= 0; i--){
                    let lref = p.gLayers[i];
                    if(lref.hidden) continue;
                    let l = layer.frame.layers.get(lref._id);
                    if(!l) continue;
                    if(!l.ctx) continue;
                    let sub_buf = new Uint32Array(l.ctx.getImageData(0,0,p.w,p.h).data.buffer);
                    for(let j = 0; j < sub_buf.length; j++){
                        let c = sub_buf[j];
                        if(c != 0) buf[j] = c;
                    }
                }
            }
            else buf = new Uint32Array(layer.ctx.getImageData(0,0,p.w,p.h).data.buffer);

            let cArr = convert(col);
            // let c = map8x4To32(cArr);
            let tar = buf[startI];
            let sel = (p.isSel ? new Uint32Array(p.sel.getImageData(0,0,p.w,p.h).data.buffer) : null);

            let stack = [];
            stack.push({
                i:startI,
                x:Math.floor(mx),
                y:Math.floor(my)
            });

            let times = 0;
            // let max = Math.max(p.w,p.h)*16;
            let max = 2048;

            // let start = performance.now();
            if(drawMode == DrawMode.draw){
                ctx.fillStyle = `rgb(${cArr[0]},${cArr[1]},${cArr[2]})`;
                ctx.globalAlpha = gAlpha;
            }
            else if(drawMode == DrawMode.select) ctx.fillStyle = selColStr;

            while(stack.length){
                if(this.canceled) break;
                
                let {i,x,y} = stack.pop();
                if(x < 0) continue;
                if(y < 0) continue;
                if(x >= p.w) continue;
                if(y >= p.h) continue;
                if(map[i] == 1) continue;
                if(buf[i] != tar) continue;
                if(!isSelectMode) if(p.isSel) if(sel[i] == 0) continue;

                map[i] = 1;
                drawData(ctx,x,y,drawMode);
                
                if(true){
                    times++;
                    if(times > max){
                        await wait(1);
                        if(isSelectMode) updateSelection(); // should we have this here?
                        times = 0;
                    }
                }

                stack.push({x:x-1,y:y,i:i-1});
                stack.push({x:x+1,y:y,i:i+1});
                stack.push({x:x,y:y-1,i:i-p.w});
                stack.push({x:x,y:y+1,i:i+p.w});
            }

            if(drawMode == DrawMode.draw) ctx.globalAlpha = 1;

            // console.log("TIME: ",performance.now()-start);
        };
        let run_global = async (layer:Layer,ctx:CanvasRenderingContext2D)=>{
            if(!layer) return;
            if(!ctx) return;
            
            layer.applyChange(true,true);
            let startI = (Math.floor(mx)+Math.floor(my)*p.w) * 4;

            let buf = layer.ctx.getImageData(0,0,p.w,p.h).data; // <-- this one is a UInt8 array instead so in the future I can add tolerance detection
            let cArr = convert(col);
            let tarR = buf[startI];
            let tarG = buf[startI+1];
            let tarB = buf[startI+2];
            let tarA = buf[startI+3];
            let sel = (p.isSel ? new Uint32Array(p.sel.getImageData(0,0,p.w,p.h).data.buffer) : null);
            
            let times = 0;
            let max = 2048;

            if(drawMode == DrawMode.draw){
                ctx.fillStyle = `rgb(${cArr[0]},${cArr[1]},${cArr[2]})`;
                ctx.globalAlpha = gAlpha;
            }
            else if(drawMode == DrawMode.select) ctx.fillStyle = selColStr;
            
            // 
            let i2 = 0;
            let x = 0;
            let y = 0;
            for(let i = 0; i < buf.length; i += 4, i2++, x++){
                if(this.canceled) break;

                if(x >= p.w){
                    x -= p.w;
                    y++;
                }

                if(buf[i] != tarR) continue;
                if(buf[i+1] != tarG) continue;
                if(buf[i+2] != tarB) continue;
                if(buf[i+3] != tarA) continue; // <-- should this be here or tweaked?

                if(!isSelectMode) if(p.isSel) if(sel[i2] == 0) continue;

                drawData(ctx,x,y,drawMode);

                times++;
                if(times > max){
                    await wait(1);
                    if(isSelectMode) updateSelection();
                    times = 0;
                }

                if(drawMode == DrawMode.draw) ctx.globalAlpha = 1;
            }
        };
        // 
        if(this.fillMode.v == FillToolMode.global){
            run = run_global;
            console.warn(">> using global fill mode");
        }

        let ha = new HA_LoopSelCopy(drawMode==DrawMode.erase?"Erase Fill":"Fill",HistIcon.fill);
        ha.save(selProject);

        if(!isSelectMode) await p.loopSelAsync(async l=>{
            if(!l.canEdit()){
                console.log("can't edit",l.lref.name);
                return;
            }
            if(l.isEmpty()) l.initCtxIfNeeded();

            await run(l,l.ctx);
        });
        else await run(p.getFirstCurLayer(),p.sel);

        p.endLockEdits(); // THIS IS USED FOR PREVENTING EDITS WHILE FILL IS STILL HAPPENING

        p.loadFrame();
        if(drawMode == DrawMode.select || drawMode == DrawMode.erase_select){
            updateSelection();
            p.hist.add(new HA_Select(false,false,true));
        }
        else{
            ha.postSave();
            p.hist.add(ha);
        }

        this.downRes();
    }
    async onUp() {
        super.onUp();
        await this.downProm;
    }
}

class PanTool extends Tool{
    constructor(){
        // super("Pan Tool","../icon/icon.svg");
        super("Pan Tool","../tools/pan.svg");
    }
    getDesc(): string {
        return "A tool to pan and zoom in the editor.";
    }
    startPanX = 0;
    startPanY = 0;
    allowTouch(): boolean {
        return true;
    }
    onDown(): void {
        let p = selProject;
        if(!p) return;
        this.startPanX = p.panX;
        this.startPanY = p.panY;
    }
    drawAny(e:UniversalMouseEvent){
        let p = selProject;
        if(!p) return;

        let dx = cmx-csmx;
        let dy = cmy-csmy;
        
        p.panX = this.startPanX+dx;
        p.panY = this.startPanY+dy;

        p.updateZoom();
    }
    async draw(e:UniversalMouseEvent): Promise<void> {
        super.draw(e);
        this.drawAny(e);
    }
    onTouchMove(e: UniversalMouseEvent): void {
        let p = selProject;
        if(!p) return;

        if(e.touches?.length != 2) return;
        
        if(true) if(e.touches?.length == 2){
            let t1 = e.touches[0];
            let t2 = e.touches[1];
            
            let dx = t2.clientX-t1.clientX;
            let dy = t2.clientY-t1.clientY;
            let dist = Math.sqrt(dx**2+dy**2);
    
            if(_lastTouchZoomDist != -1){
                let amt = (dist-_lastTouchZoomDist)/150;
                p.zoom *= 1+amt;
                
                p.updateZoom();
            }
            
            _lastTouchZoomDist = dist;
        }
    }
}

abstract class TSUtil_Combobox<T extends number> extends ToolSetting{
    v:T;
    ref:ComboboxComponent<T>;

    abstract getOptions():T[];
    abstract getList():string[];

    load(root: MenuComponent): void {
        this.ref = root.createCombobox(this.name,this.getOptions(),this.getList(),this.v).onchange(v=>{
            this.v = v;
            this.update();
        });
    }
    update(): void {
        super.update();
        this.ref?.update();
    }
}
abstract class TSUtil_Checkbox extends ToolSetting{
    constructor(name:string,desc:string,suffix?:string){
        super(name,desc);
        this.suffix = suffix;
    }
    
    v:boolean;
    ref:CheckboxComponent;
    suffix:string;

    load(root: MenuComponent): void {
        this.ref = root.createCheckbox(this.name,this.v,this.suffix);
        this.ref.inp.addEventListener("input",e=>{
            this.v = this.ref.inp.checked;
            this.update();
        });
        this.ref.inp.style.width = "20px";
    }
}
enum ShapeType{
    none = -1,
    rect,
    circle,
    ellipse
}
enum ShapeFill{
    none = -1,
    fill,
    outline
}
class TS_ShapeType extends TSUtil_Combobox<ShapeType>{
    constructor(){
        super("Shape","Affects which shape primitive will be used.");
    }
    v = ShapeType.rect;

    getOptions(): ShapeType[] {
        return [
            ShapeType.rect,
            ShapeType.circle,
            ShapeType.ellipse
        ];
    }
    getList(): string[] {
        return [
            "Rect",
            "Circle",
            "Ellipse"
        ];
    }
}
class TS_ShapeFillType extends TSUtil_Combobox<ShapeFill>{
    constructor(){
        super("Fill","Affects how shapes are draw, whether they are filled in or draw as an outline.");
    }
    v = ShapeFill.fill;

    getOptions(): ShapeFill[] {
        return [
            ShapeFill.fill,
            ShapeFill.outline
        ];
    }
    getList(): string[] {
        return [
            "Fill",
            "Outline"
        ];
    }
}
class TS_UseTransform extends TSUtil_Checkbox{
    constructor(){
        super("Use Transform","Whether to allow the use of transform before pasting (transform doesn't work with blend mode at the moment)");
    }
}
class ShapeTool extends DrawingTool{
    constructor(){
        super("Shape Tool","../tools/shape.svg");
    }

    shapeType = new TS_ShapeType();
    fillType = new TS_ShapeFillType();
    useTransform = new TS_UseTransform();

    sx = 0;
    sy = 0;
    x = 0;
    y = 0;
    w = 0;
    h = 0;

    getDesc(): string {
        return "A tool to create shapes like circles and rectangles.";
    }
    getSettings(): ToolSetting[] {
        let s = super.getSettings();
        return [
            this.shapeType,
            this.fillType,
            this.useTransform,
            ...s,
        ];
    }

    start(): void {
        super.start();
        startTool();
    }
    end(): void {
        super.end();
        let p = selProject;
        if(!p) return;
        // if(this.wasChange) if(p.applyChangeToAll()) selProject.hist.add(new HA_CanCopy(this.name,this.bmode)); // <-- only needed if it should apply instantly instead of going to a finishable action
        endTool();

        let can = createCan(this.w,this.h);
        let ctx = can.getContext("2d");
        ctx.drawImage(p.prev.canvas,this.sx,this.sy,this.w,this.h,0,0,this.w,this.h);

        if(this.useTransform.v){
            // METHOD 1 (has undo into movable)
            startFinishableAction(new FA_PasteData(can,this.sx,this.sy));
            // selProject.curFinishableAction.finish(); // <-- not as intuitive but feels more power user-y
        }
        else{
            // METHOD 2 (supports blend mode)
            p.main.drawImage(selProject.prev.canvas,0,0);
            if(this.bmode != DrawMode.select && this.bmode != DrawMode.erase_select) applySelectionPost();
            endDCan(undefined,false);
            selProject.applyChangeToAll(true,true);
            endAllCursors();
            p.clearPrev();
            p.hist.add(new HA_CanCopy("Draw shape",p.getBlendMode(),HistIcon.shape));
            postEndDCan();
        }
    }
    async draw(e: UniversalMouseEvent): Promise<void> {
        let p = selProject;
        if(!p) return;
        p.clearPrev();

        let prev = p.prev;
        prev.fillStyle = col;
        prev.strokeStyle = col;
        if(this.shapeType.v == ShapeType.rect){
            await this.drawRect(prev,smx,smy,mx,my);
        }
        else if(this.shapeType.v == ShapeType.circle){
            await this.drawCircle(prev,smx,smy,mx,my);
        }
        else if(this.shapeType.v == ShapeType.ellipse){
            await this.drawCircle3(prev,smx,smy,mx,my);
        }
    }

    // 
    async drawRect(c:CanvasRenderingContext2D,sx:number,sy:number,x:number,y:number){
        if(!selProject) return;

        if(shiftKey){
            let dx = x-sx;
            let dy = y-sy;
            let w = Math.abs(dx);
            let h = Math.abs(dy);
            if(w > h){
                h = w * (sy > y ? -1 : 1);
                y = sy+h;
                w = h;
            }
            else{
                w = h * (sx > x ? -1 : 1);
                x = sx+w;
                h = w;
            }
        }

        // let tarX = sx;
        // let tarY = sy;
        let center = false;
        if(altKey){
            // let w2 = Math.abs(x-sx)/2;
            // let h2 = Math.abs(y-sy)/2;
            // sx -= w2;
            // sy -= h2;
            // center = true;
            // tarX = (sx+x)/2;
            // tarY = (sy+y)/2;
            center = true;
        }
        
        let x1 = Math.floor(Math.min(sx,x));
        let y1 = Math.floor(Math.min(sy,y));
        let x2 = Math.floor(Math.max(sx,x));
        let y2 = Math.floor(Math.max(sy,y));
        // let x1 = Math.floor(sx);
        // let y1 = Math.floor(sy);
        // let x2 = Math.floor(x);
        // let y2 = Math.floor(y);
        let w = Math.floor(x2-x1+1);
        let h = Math.floor(y2-y1+1);
        if(center){
            // if(x2 < x1)
            w = Math.round((x2-x1+(x<sx?0:1))*2);
            h = Math.round((y2-y1+(y<sy?0:1))*2);
            if(shiftKey){
                if(w > h) h = w;
                else w = h;
            }
        }

        // if(shiftKey){
        //     if(w > h){
        //         h = w;
        //     }
        //     else{
        //         w = h;
        //     }
        // }

        if(w == 1 && h == 1){
            let tx = Math.floor(x1);
            let ty = Math.floor(y1);
            c.fillRect(tx,ty,1,1);
            this.sx = x1-1;
            this.sy = y1-1;
            this.w = w+2;
            this.h = h+2;
            return;
        }

        let size = this.brushSize.val;
        if(this.fillType.v == ShapeFill.fill){
            size = 1;
            // c.rect(x1,y1,w,h);
            if(center) c.translate(Math.floor(sx),Math.floor(sy));
            else c.translate(Math.floor(x1),Math.floor(y1));
            if(center) c.rect(-Math.floor(w/2),-Math.floor(h/2),w,h);
            else c.rect(0,0,w,h);
            c.resetTransform();
        }
        else{
            c.lineWidth = Math.ceil(size);
            // c.rect(x1+0.5,y1+0.5,w-1,h-1);
            if(center) c.translate(Math.floor(sx)+0.5,Math.floor(sy)+0.5);
            else c.translate(Math.floor(x1)+0.5,Math.floor(y1)+0.5);
            if(center) c.rect(-Math.floor(w/2),-Math.floor(h/2),w-1,h-1);
            else c.rect(0,0,w-1,h-1);
            c.resetTransform();
        }
        let hw = Math.ceil(size/2);
        if(size > 1) hw++;
        this.completeShape(c);

        // this.sx = x1;
        // this.sy = y1;
        this.sx = x1-hw;
        this.sy = y1-hw;
        this.x = x2+hw;
        this.y = y2+hw;
        // this.w = w;
        // this.h = h;
        this.w = w+1+hw;
        this.h = h+1+hw;

        if(size > 1){
            this.w += 2;
            this.h += 2;
        }

        let l = this.sx;
        let r = this.sx+this.w+1;
        let t = this.sy;
        let b = this.sy+this.h+1;

        await selProject.applyEffected(l,r,t,b);
        correctCtx(c,0.5);
    }
    async drawCircle(c:CanvasRenderingContext2D,sx:number,sy:number,x:number,y:number){
        if(!selProject) return;
        
        let x1 = sx;
        let y1 = sy;
        let dx = x-x1;
        let dy = y-y1;
        let rad = Math.sqrt(dx**2+dy**2);

        if(rad <= 1){
            c.fillRect(Math.floor(x1),Math.floor(y1),1,1);
            this.sx = x1-1;
            this.sy = y1-1;
            this.w = 3;
            this.h = 3;
            return;
        }

        let size = this.brushSize.val;
        if(this.fillType.v == ShapeFill.fill) size = 0;
        let hw = Math.ceil(size/2);

        if(size == 1){
            let r2 = Math.ceil(rad);
            let rS = r2**2;
            let t2 = 0.75;
            x1 = Math.floor(x1);
            y1 = Math.floor(y1);
            for(let i = -r2*t2; i <= r2*t2; i++){
                let x = Math.sqrt(rS-i**2);
                c.fillRect(Math.round(x1+x),Math.round(y1+i),1,1);
                c.fillRect(Math.round(x1-x),Math.round(y1+i),1,1);
            }
            for(let i = -r2*t2; i <= r2*t2; i++){
                let x = Math.sqrt(rS-i**2);
                c.fillRect(Math.round(x1+i),Math.round(y1+x),1,1);
                c.fillRect(Math.round(x1+i),Math.round(y1-x),1,1);
            }
        }
        else{
            c.lineWidth = size;
            c.beginPath();
            c.arc(Math.floor(x1)+0.5,Math.floor(y1)+0.5,rad,0,Math.PI*2);
            // c.arc(Math.floor(x1),Math.floor(y1),rad,0,Math.PI*2);
            this.completeShape(c);
        }

        // let cir = Math.ceil(Math.PI*2*rad);
        // for(let i = 0; i < cir; i++){
        //     let ang = i/cir*Math.PI*2;
        //     let tx = Math.cos(ang)*rad + Math.round(x1);
        //     let ty = Math.sin(ang)*rad + Math.round(y1);
        //     c.fillRect(Math.round(tx),Math.round(ty),1,1);
        // }
        
        // let r2 = Math.ceil(rad);
        // let rS = r2**2;
        // let t2 = 0.75;
        // x1 = Math.floor(x1);
        // y1 = Math.floor(y1);
        // for(let i = -r2*t2; i <= r2*t2; i++){
        //     let x = Math.sqrt(rS-i**2);
        //     c.fillRect(Math.round(x1+x)-hw2,Math.round(y1+i),w,1);
        //     c.fillRect(Math.round(x1-x)-hw2,Math.round(y1+i),w,1);
        //     // c.fillRect(Math.round(x1+x),Math.round(y1+i),1,1);
        //     // c.fillRect(Math.round(x1-x),Math.round(y1+i),1,1);
        // }
        // for(let i = -r2*t2; i <= r2*t2; i++){
        //     let x = Math.sqrt(rS-i**2);
        //     c.fillRect(Math.round(x1+i),Math.round(y1+x)-hw2,1,w);
        //     c.fillRect(Math.round(x1+i),Math.round(y1-x)-hw2,1,w);
        //     // c.fillRect(Math.round(x1+i),Math.round(y1+x),1,1);
        //     // c.fillRect(Math.round(x1+i),Math.round(y1-x),1,1);
        // }

        // 
        let l = Math.floor(x1-rad)-hw-1;
        let r = Math.ceil(x1+rad)+hw+1;
        let t = Math.floor(y1-rad)-hw-1;
        let b = Math.ceil(y1+rad)+hw+1;

        this.sx = l;
        this.sy = t;
        this.x = r;
        this.y = b;
        this.w = r-l;
        this.h = b-t;

        await selProject.applyEffected(l,r,t,b);
        // correctCtx(c);
        correctCtx(c,0.5);
        // correctCtx(c,0.8);
    }
    async drawCircle2(c:CanvasRenderingContext2D,sx:number,sy:number,x:number,y:number){
        if(!selProject) return;
        
        let x1 = sx;
        let y1 = sy;
        let dx = x-x1;
        let dy = y-y1;
        let rad = Math.sqrt(dx**2+dy**2);

        if(rad <= 1){
            c.fillRect(Math.floor(x1),Math.floor(y1),1,1);
            return;
        }

        c.beginPath();
        // c.arc(Math.floor(x1)+0.5,Math.floor(y1)+0.5,rad,0,Math.PI*2);
        c.arc(Math.floor(x1),Math.floor(y1),rad,0,Math.PI*2);
        this.completeShape(c);

        let l = Math.floor(x1-rad)-1;
        let r = Math.ceil(x1+rad)+1;
        let t = Math.floor(y1-rad)-1;
        let b = Math.ceil(y1+rad)+1;

        this.sx = l;
        this.sy = t;
        this.x = r;
        this.y = b;
        this.w = r-l;
        this.h = b-t;

        await selProject.applyEffected(l,r,t,b);
        // correctCtx(c,0.5);
        correctCtx(c,0.8);
    }
    async drawCircle3(c:CanvasRenderingContext2D,sx:number,sy:number,x:number,y:number,center:boolean=undefined){
        if(!selProject) return;

        if(center == undefined){
            if(altKey) center = false;
            else center = true;
        }
        else center = true;

        let w = Math.abs(x-sx);
        let h = Math.abs(y-sy);
        if(shiftKey){
            if(w > h){
                h = w * (sy > y ? -1 : 1);
                y = sy+h;
            }
            else{
                w = h * (sx > x ? -1 : 1);
                x = sx+w;
            }
        }

        if(Math.abs(w) < 1){
            w = 1;
            x = sx+1;
        }
        if(Math.abs(h) < 1){
            h = 1;
            y = sy+1;
        }
        
        if(Math.floor(h) == 1){
            this.drawRect(c,sx,sy,x,sy);
        }
        else if(Math.floor(w) == 1){
            this.drawRect(c,sx,sy,sx,y);
        }

        let cx = (sx+x)/2;
        let cy = (sy+y)/2;

        let tarX = Math.round(cx);
        let tarY = Math.round(cy);
        if(!center){
            tarX = Math.floor(sx);
            tarY = Math.floor(sy);
        }
        
        // let dx = x-tarX;
        // let dy = y-tarY;
        let rad = 1;
        if(center){
            rad = Math.ceil(w > h ? w/2 : h/2);
        }
        else{
            // rad = Math.sqrt(w**2+h**2);
            rad = Math.ceil(w > h ? w : h);
        }
        // let rad = Math.ceil(Math.sqrt(w**2+h**2) * (center ? 0.5 : 1));
        // let rad = Math.ceil(Math.sqrt(dx**2+dy**2));
        // let rad = Math.floor(Math.min(Math.abs(w),Math.abs(h)));

        let sw = 1;
        let sh = 1;
        if(h > w){
            sw = w/h;
        }
        else{
            sh = h/w;
        }
        
        c.translate(tarX,tarY);
        c.scale(sw,sh);
        c.beginPath();
        c.arc(0,0,rad,0,Math.PI*2);

        c.resetTransform();

        this.completeShape(c);
        // 

        // let x1 = (sx < x ? sx : x);
        // let y1 = (sy < y ? sy : y);
        let l = Math.floor(tarX-rad)-1;
        let r = Math.ceil(tarX+rad)+1;
        let t = Math.floor(tarY-rad)-1;
        let b = Math.ceil(tarY+rad)+1;

        this.sx = l;
        this.sy = t;
        this.x = r;
        this.y = b;
        this.w = r-l;
        this.h = b-t;

        await selProject.applyEffected(l,r,t,b);
        correctCtx(c,0.8);

        // DEBUG
        // c.beginPath();
        // let oldStyle = c.strokeStyle;
        // let oldW = c.lineWidth;
        // c.strokeStyle = "gray";
        // c.lineWidth = 1;
        // c.strokeRect(Math.floor(Math.min(sx,x))+0.5,Math.floor(Math.min(sy,y))+0.5,Math.round(w),Math.round(h));
        // c.lineWidth = oldW;
        // c.strokeStyle = oldStyle;
    }
    completeShape(c:CanvasRenderingContext2D){
        let mode = this.fillType.v;
        if(mode == ShapeFill.fill) c.fill();
        else if(mode == ShapeFill.outline) c.stroke();
    }
}

// class SplinePoint{
//     constructor(x:number,y:number){
//         this.x = x;
//         this.y = y;
//     }
//     x:number;
//     y:number;
//     hobj:SplineHandleCObj;
// }

enum LineCap{
    none,
    round,
    square
}
class TS_LineCap extends TSUtil_Combobox<LineCap>{
    constructor(){
        super("Line Cap","Adjusts how the ends of lines and curves are drawn.");
    }
    v = LineCap.none;

    getOptions(): LineCap[] {
        return [
            LineCap.none,
            LineCap.round,
            LineCap.square
        ];
    }
    getList(): string[] {
        return [
            "None",
            "Round",
            "Square"
        ];
    }
}

enum SplineInsertMode{
    bezier,
    bezier_manual,
    polyline
}
class TS_SplineInsertMode extends TSUtil_Combobox<SplineInsertMode>{
    constructor(){
        super("Insert Mode","Affects how points are inserted into the curve.");
    }
    v = SplineInsertMode.bezier;

    getOptions(): SplineInsertMode[] {
        return [
            SplineInsertMode.bezier,
            SplineInsertMode.bezier_manual,
            SplineInsertMode.polyline
        ];
    }
    getList(): string[] {
        return [
            "Bezier",
            "Manual Bezier",
            "Polyline"
        ];
    }
}

class SplineTool extends DrawingTool{
    constructor(){
        super("Spline Tool","../tools/spline2.svg");
    }
    getDesc(): string {
        return "Used to draw polylines and bezier curves.";
    }
    fa:FA_Spline;
    x:number;
    y:number;
    isAdding = false;
    justAdded:SplineHandleCObj;

    lineCap = new TS_LineCap();
    insertMode = new TS_SplineInsertMode();

    getSettings(): ToolSetting[] {
        // return super.getSettings().concat(
        //     this.lineCap,
        //     this.insertMode
        // );
        return [
            this.brushSize,
            this.lineCap,
            this.insertMode
        ];
    }

    // doesUseCursor(): boolean {
    //     return false;
    // }

    start(): void {
        super.start();
        startTool();

        this.x = mx;
        this.y = my;

        if(!selProject?.hoverCO) this.isAdding = true;

        if(!this.isAdding) return;
        if(!mouseDown[0]) return;
        
        if(!this.x) this.x = 0;
        if(!this.y) this.y = 0;

        // let pos = 0;
        // if(!this.fa) pos = 1;
        let hobj:SplineHandleCObj;
        if(this.insertMode.v == SplineInsertMode.bezier){
            let last = selProject.canObjs.filter(v=>v instanceof SplineHandleCObj).pop();
            if(!last) hobj = new SplineHandleCObj(this.x,this.y,-10,-10,10,10);
            else{
                // let dx = 
                hobj = new SplineHandleCObj(this.x,this.y,-10,-10,10,10);
            }
        }
        else if(this.insertMode.v == SplineInsertMode.bezier_manual) hobj = new SplineHandleCObj(this.x,this.y,-10,-10,10,10);
        else hobj = SplineHandleCObj.makeCorner(this.x,this.y);
        selProject.addCanObj(hobj);
        selProject.deselectAllCanObjs();
        hobj.select();

        if(this.insertMode.v == SplineInsertMode.polyline){
            selProject.removeCanObj(hobj.handles[0]);
            selProject.removeCanObj(hobj.handles[1]);
            hobj.handles = [null,null];
            hobj.update();
        }

        this.fa?.update();
        this.isAdding = false;
        this.justAdded = hobj;

        // console.log("XY:",hobj.x,hobj.y);
        // hobj.handles[0].moveTo(hobj.x-10,hobj.y-10);
        // hobj.handles[1].moveTo(hobj.x+10,hobj.y+10);
    }
    end(): void {
        super.end();
        endTool();
        if(!this.justAdded) return;

        let j = this.justAdded;
        if(j.sx == 0 && j.sy == 0 && j.ex == 0 && j.ey == 0){
            j.sx = -3;
            j.sy = -3;
            j.ex = 3;
            j.ey = 3;
            j.removeHandles();
        }

        if(!selProject.curFinishableAction){
            let fa = new FA_Spline(this.justAdded);
            this.fa = fa;
            startFinishableAction(fa);
        }
        else if(this.fa){
            this.fa.add(this.justAdded);
        }
        this.fa?.update();

        this.x = undefined;
        this.y = undefined;
        this.isAdding = false;
        this.justAdded = undefined;
    }
    async draw(e: UniversalMouseEvent): Promise<void> {
        this.x = mx;
        this.y = my;

        if(this.justAdded){ // is new
            let j = this.justAdded;

            let points = selProject.canObjs.filter(v=>v instanceof SplineHandleCObj);
            let ind = points.indexOf(j);
            if(ind != -1 && ind > 0){
                let prev = points[ind-1];
                let dx = j.x-(prev.x+prev.ex);
                let dy = j.y-(prev.y+prev.ey);
                let dist = Math.sqrt(dx**2+dy**2);
                let max = Math.min(10,dist);
                
                if(this.insertMode.v == SplineInsertMode.bezier){
                    j.handles[0]?.quickMove(j.x-mx,j.y-my);
                    j.handles[1]?.quickMove(mx-j.x,my-j.y);
                }
                else{
                    j.handles[0]?.quickMove(-dx/dist*max,-dy/dist*max);
                    j.handles[1]?.quickMove(dx/dist*max,dy/dist*max);
                }
            }

            if(this.insertMode.v != SplineInsertMode.bezier) j.moveTo(mx,my);
            else j.update();
        }
    }
}

class EyeDropperTool extends Tool{
    constructor(){
        super("Eye Dropper","../tools/eye_dropper.svg");
    }
    getDesc(): string {
        return "A tool to pull and identify colors from the canvas.";
    }
    doesUseCursor(): boolean {
        return true;
    }

    start(): void {
        let p = selProject;
        if(!p) return;
        super.start();
        startTool();

        let x = mx;
        let y = my;

        // pick color
        if(mouseDown[0]){
            p.pickColor(x,y);
        }
        else if(mouseDown[2]){
            openDropdown("d",[
                {
                    label:"Pick Color",
                    onclick:(d,cont)=>{
                        p.pickColor(x,y);
                    }
                },
                {
                    label:"Add to Palette",
                    onclick:(d,cont)=>{
                        let c = p.pickColor(x,y,true);
                        if(!c) return;
                        p.cp.add(map8x4To32(c));
                        updatePanel("color");
                    }
                },
                {
                    label:"Copy HEX",
                    icon:allIcons.hex,
                    onclick:(d,cont)=>{
                        let c = p.pickColor(x,y,true);
                        if(!c) return;
                        let hex = RGBToHex(c);
                        navigator.clipboard.writeText(hex);
                    }
                }
            ],{
                postX:cmx,
                postY:cmy
            });
        }
    }
    end(): void {
        super.end();
        endTool();
    }
}

function drawData(ctx:CanvasRenderingContext2D,x:number,y:number,mode:DrawMode){
    switch(mode){
        case DrawMode.draw:
        case DrawMode.select:
            ctx.fillRect(x,y,1,1);
            break;
        case DrawMode.erase:
        case DrawMode.erase_select:
            ctx.clearRect(x,y,1,1);
            break;
    }
}
function getDrawMode(){
    if(altKey && ctrlKey) return DrawMode.erase_select;
    else if(altKey) return DrawMode.erase;
    else if(ctrlKey) return DrawMode.select;
    // return DrawMode.draw;
    return selProject?.getBlendMode();
}

let tools:Tool[] = [
    new PencilTool(),
    new EraserTool(),
    new LineTool(),
    new SelectTool(),
    new PointerTool(),
    new SelectPointerTool(),
    new FillTool(),
    new PanTool(),
    new ShapeTool(),
    new SplineTool(),
    new EyeDropperTool(),
];

let curTool:Tool = null;
let _toolLock = false;

function startTool(){
    _toolLock = true;
}
function endTool(){
    _toolLock = false;
}

function selectToolId(id:string){
    selectTool(tools.find(v=>v.id == id));
}
function selectTool(tool:Tool,duringFA=false){
    if(_toolLock){
        console.log("tool lock is true");
        return;
    }
    // if(curFinishableActions.length){
    if(tool.id != "pointer") if(!duringFA) if(selProject?.curFinishableAction && tool != selProject?.curFinishableAction.tool && !selProject?.hist.restoring){
        console.warn("can't switch tool, there is currently a finishable action in progress");
        if(selProject?.curFinishableAction.tool) tool = selProject.curFinishableAction.tool;
        else return;
    }

    tsRoot.body.textContent = ""; // <-- added to fix glitch where selecting fill tool and then pointer select would have the same tool settings
    
    if(curTool){
        curTool._ref.classList.remove("sel");
        if(curTool != tool) curTool.onDeselect();
    }
    curTool = tool;
    curTool._ref.classList.add("sel");

    if(curTool){
        l_curTool.textContent = curTool.name;
        curTool.onSelect();
    }
}

const d_tools = document.querySelector(".tools.pane");
function initTools(){
    d_tools.textContent = "";
    for(const t of tools){
        let d = document.createElement("div");
        d.innerHTML = `<img draggable="false" src="assets/tools/${t.icon}">`;
        d_tools.appendChild(d);
        t._ref = d;
        onDown(e=>{
            selectTool(t);
        },d);

        regBasicTooltip(d,t.name,t.getDesc(),"assets/tools/"+t.icon);
    }
}
initTools();

function calcOverCanvas(e:UniversalMouseEvent){
    let p = selProject;
    if(!p) return;

    let clientX = e.clientX;
    let clientY = e.clientY;

    if(menuAPI.isMenuOpen()){
        setOverCanvas(false);
        return;
    }
    
    // manual scrollbars
    let r2 = p.overlay.getBoundingClientRect();
    if(clientX > r2.right-20 && clientX > r2.left) setOverCanvas(false);
    else if(clientX < r2.left+20 && clientX < r2.right) setOverCanvas(false);
    else if(clientY > r2.bottom-20 && clientY > r2.top) setOverCanvas(false);
    else if(clientY < r2.top+20 && clientY < r2.bottom) setOverCanvas(false);
    else setOverCanvas(true);
}

let debugDrawEveryFrame = false;
let _e:UniversalMouseEvent;

let _lastTouchZoomDist = -1;
let lastTouch = -99999;
function onMouseMove(e:UniversalMouseEvent){
    if(hit.classList.contains("show")) return;
    
    let p = selProject;
    if(!p) return;

    // let time = performance.now();
    // if(time-lastTouch < 10){
    //     return;
    // }
    // lastTouch = time;

    // if(e.touches?.length != 1) return;
    // console.log("TOUCHES:",e.touches?.length,e.eventType);
    // if(e.touches?.length == 0) return;
    
    if(dragging) return;
    if(curTool?.inUse) e.preventDefault();
    _e = e;
    runKeyModifiers(e);
    
    llx = lx;
    lly = ly;
    lx = mx;
    ly = my;
    clx = cmx;
    cly = cmy;
    let m = calcMouse(e);
    mx = m.x;
    my = m.y;
    cmx = m.cx;
    cmy = m.cy;
    let _flmx = Math.floor(mx);
    let _flmy = Math.floor(my);
    isNewPixelLoc = (_flmx != flmx || _flmy != flmy);
    flmx = _flmx;
    flmy = _flmy;

    if(selProject){
        let r = selProject.overlay.getBoundingClientRect();
        let tol = 20;
        if((cmx > r.right-tol && cmx < r.right && cmy >= r.top && cmy <= r.bottom) || (cmy > r.bottom-tol && cmy < r.bottom && cmx >= r.left && cmx <= r.right)){
            selProject.overlay.style.pointerEvents = null;
        }
        else selProject.overlay.style.pointerEvents = "none";
    }

    if(areSubWindowsOpen()){
        if(overSW.length) return;
    }
    
    p.runCOMouseMove(e);

    // let cur = p.cursor.canvas;
    // let curOv = p.cursorOv.canvas;
    // let main = p.main.canvas;
    // curOv.style.left = (!p.snapCursor ? e.clientX : (Math.floor(e.clientX/main.offsetWidth*p.w)/p.w))+"px";
    p.updateCurPos(e.clientX,e.clientY);

    // let r = p.cont.getBoundingClientRect();
    // let ratX = (r.right-e.clientX)/p.cont.clientWidth;
    // let ratY = (r.bottom-e.clientY)/p.cont.clientHeight;
    // ratX = Math.min(Math.max(0,ratX),1);
    // ratY = Math.min(Math.max(0,ratY),1);
    // ratX = 1-ratX;
    // ratY = 1-ratY;

    calcOverCanvas(e);

    if(selProject) if(curTool) if(curTool.allowTouch()){
        curTool.onTouchMove(e);
    }
    if(e.eventType == 2){
        e.preventDefault();
        if(e.touches?.length != 1) return;
    }

    if(areSubWindowsOpen()) return;

    // let isTouch = (e.eventType == 2);
    // if(isTouch) return;

    // tools
    if(!debugDrawEveryFrame) if(selProject) if(curTool) if(curTool.inUse) if(selProject.curFrame?.curLayers.length){
        let allowed = curTool.allowedMouseButtons();
        if(allowed.includes(e.button)){
                // return;
            // if(isTouch ? !curTool.allowTouch() : false) return;
            // console.log("DRAW src");
            curTool.move(e);
            // if(_overCanvas){
                if(curTool.inUse) curTool.draw(e);
            // }
        }
    }

    // if(isNewPixelLoc){
        selProject?.updateCur();
    // }
}
function onMouseDown(e:UniversalMouseEvent){  
    if(hit.classList.contains("show")) return;

    if(_overCanvas){
        if(e.button == 2) closeDropdowns(); // <-- hopefully this doesn't break things
    }

    if(areSubWindowsOpen()) return;

    runKeyModifiers(e);

    // if(e.button != 0) return; //possibly temp
    if(dragging) return;

    // if(e.touches?.length != 1) return;

    let p = selProject;
    if(!p) return;

    calcOverCanvas(e);
    let m = calcMouse(e);
    mx = m.x;
    my = m.y;
    cmx = m.cx;
    cmy = m.cy;
    llx = mx;
    lly = my;
    lx = mx;
    ly = my;
    clx = cmx;
    cly = cmy;
    let _flmx = Math.floor(mx);
    let _flmy = Math.floor(my);
    isNewPixelLoc = (_flmx != flmx || _flmy != flmy);
    flmx = _flmx;
    flmy = _flmy;

    p.runCOMouseDown(e);
    p.updateCurPos(e.clientX,e.clientY);

    if(selProject) if(curTool) if(_overCanvas) if(selProject.curFrame?.curLayers.length){
        let allowed = curTool.allowedMouseButtons();
        if(allowed.includes(e.button)){
            if(curTool.inUse) return; // <-- newly added
            curTool.start();
            if(curTool.inUse){
                curTool.onDown();
                if(_overCanvas){
                    if(curTool.inUse) curTool.draw(e);
                }
            }
        }
    }

    // 
    setTimeout(()=>{
        selProject?.updateCur(); // needed to make the cursor update to the right color after placing a pixel
    },0);
}

onMove(e=>{
    onMouseMove(e);
});
onDown(e=>{
    onMouseDown(e);
});

// document.addEventListener("mousemove",onMouseMove);
// document.addEventListener("mousedown",onMouseDown);

// document.addEventListener("pointermove",onMouseMove);
// document.addEventListener("pointerdown",onMouseDown);
// document.addEventListener("touchmove",onMouseMove);
// document.addEventListener("touchstart",onMouseDown);

enum ActionOp{
    set,
    add,
    sub,
    mult,
    div,
    inv
}
interface ActionOperatorInfo{
    label:string;
    symbol:string;
    // low:number;
    // high:number; // don't need these because everything will just be clamped
}
const actionOperatorInfo:Record<number,ActionOperatorInfo> = {
    [ActionOp.set]:{
        label:"Set",
        symbol:"="
    },
    [ActionOp.add]:{
        label:"Add",
        symbol:"+"
    },
    [ActionOp.sub]:{
        label:"Subtract",
        symbol:"-"
    },
    [ActionOp.mult]:{
        label:"Multiply",
        symbol:"*"
    },
    [ActionOp.div]:{
        label:"Divide",
        symbol:"/"
    },
    [ActionOp.inv]:{
        label:"Invert", // could also be called the complement? This will be like if it's 250 then the result will set 5. =(255-v)
        symbol:"!"
    }
};

interface ColorChannelData{
    id:string;
    use:boolean;
    op:ActionOp;

    /**
     * value to do the operation by
     */
    v:number;
}

document.addEventListener("contextmenu",e=>{
    if(_overCanvas && !_overDropdown && openDropdowns.length == 0){
        e.preventDefault();

        if(areSubWindowsOpen()) return;

        let m = calcMouse(new UniversalMouseEvent(e));
        mx = m.x;
        my = m.y;
        cmx = m.cx;
        cmy = m.cy;
        selProject.updateCurPos(cmx,cmy);

        let tmp = {
            hex:"#000000"
        };

        let cur = selProject.cursorOv.canvas;
        let r = cur.getBoundingClientRect();
        let runBtn:HTMLElement;

        // let tarX = r.right;
        // let tarY = r.top+r.height/2;
        let tarX = cmx+20;
        let tarY = cmy-15;

        openDropdown("d",[
            {
                label:"Pick Color",
                icon:allIcons.eye_dropper,
                onclick:(d,cont)=>{
                    selProject.pickColor(mx,my);
                }
            },
            {
                label:"Copy HEX",
                icon:allIcons.hex,
                onclick:(d,cont)=>{
                    navigator.clipboard.writeText(tmp.hex);
                }
            },
            {
                label:"Adjust Pixels",
                icon:allIcons.pixel,
                onclick:(d,cont)=>{
                    // let d_main = document.createElement("div");
                    // cont.appendChild(cont);
                    // d_main.className = "adjust-pixels-menu";
                    // let main = new MenuComponent(d_main);

                    // menuAPI.open(new PanelMenu(new EditPixelsPanel(null)));

                    openSubWindow(new SubWindow({
                        title:"Adjust Pixels",
                        id:"adjust_pixels",
                        icon:allIcons.draw,
                        x:tarX,
                        y:tarY,
                        genHTML:(body,sw)=>{
                            let d_channels = document.createElement("div");
                            d_channels.className = "d-channels";
                            body.appendChild(d_channels);

                            let d_config = document.createElement("div");
                            d_config.className = "d-config";
                            body.appendChild(d_config);

                            let channels:ColorChannelData[] = [
                                {
                                    id:"R",
                                    use:false,
                                    op:ActionOp.set,
                                    v:0,
                                },
                                {
                                    id:"G",
                                    use:false,
                                    op:ActionOp.set,
                                    v:0,
                                },
                                {
                                    id:"B",
                                    use:false,
                                    op:ActionOp.set,
                                    v:0,
                                },
                                {
                                    id:"A",
                                    use:false,
                                    op:ActionOp.set,
                                    v:0,
                                }
                            ];

                            let bodyMP = new MenuComponent(d_config);

                            let createItem = (c:ColorChannelData)=>{
                                let cont = document.createElement("div");
                                cont.className = "d-config-item";
                                d_config.appendChild(cont);

                                let mp = new MenuComponent(cont);
                                mp.createText(c.id,"l-channel");

                                let cb = mp.createCombobox<ActionOp>("",[
                                    ActionOp.set,
                                    ActionOp.add,
                                    ActionOp.sub,
                                    ActionOp.mult,
                                    ActionOp.div,
                                    ActionOp.inv
                                ],(v:ActionOp)=>{
                                    let info = actionOperatorInfo[v];
                                    if(!info) return "(invalid)";
                                    return info.symbol;
                                },c.op);

                                cb.onchange(v=>{
                                    c.op = v;
                                });

                                let input = mp.createInputBox("","number",c.v,"",{});
                                confirmInput(input.inp,e=>{
                                    c.v = input.inp.valueAsNumber;
                                });

                                updateItem(c);
                            };
                            let updateItem = (c:ColorChannelData)=>{
                                let ind = channels.indexOf(c);
                                d_config.children[ind].classList.toggle("hide",!c.use);
                            };

                            for(const c of channels){
                                let item = document.createElement("div");
                                item.innerHTML = `
                                    <label for="_channel-${c.id}">${c.id}</label>
                                    <input id="_channel-${c.id}" type="checkbox" ${c.use?"checked":""}>
                                `;
                                d_channels.appendChild(item);

                                let inp = item.querySelector("input");
                                createItem(c);
                                inp.addEventListener("input",e=>{
                                    c.use = inp.checked;
                                    updateItem(c);
                                });
                            }

                            let bottomBtns = bodyMP.createButtonList([
                                {
                                    label:"Run",
                                    type:ButtonType.accent,
                                    width:"100%",
                                    onclick:async (e,b)=>{
                                        selProject?.adjustPixels(channels);
                                        sw.close();
                                    }
                                }
                            ]);
                            bottomBtns.classList.add("d-end-buttons");
                            runBtn = bottomBtns.children[0] as HTMLElement;
                        },
                        onEnter:()=>{
                            runBtn?.click();
                        }
                    }));
                }
            },
            {
                label:"Turn 90 (CW)",
                onclick:async (d,cont)=>{
                    selProject.edit.rotateSelection(true,Math.PI/2);
                }
            },
            {
                label:"Turn -90 (CCW)",
                onclick:async (d,cont)=>{
                    selProject.edit.rotateSelection(true,-Math.PI/2);
                }
            },
            {
                label:"Turn 30 (CW)",
                onclick:async (d,cont)=>{
                    selProject.edit.rotateSelection(true,Math.PI/6);
                }
            },
            {
                label:"Turn -30 (CCW)",
                onclick:async (d,cont)=>{
                    selProject.edit.rotateSelection(true,-Math.PI/6);
                }
            },
            // {
            //     label:"Turn...",
            //     onview:async (d, cont)=>{
            //         await wait(50);
            //         let div:HTMLElement;
            //         let r = d.getBoundingClientRect();

            //         for(const dd of [...openDropdowns]){
            //             if(dd == cont) continue;
            //             closeSingleDropdown(dd);
            //         }

            //         d.addEventListener("mouseenter",e=>{
            //             e.stopImmediatePropagation();
            //             e.stopPropagation();
            //             div = openDropdown("r",[
            //                 {
            //                     label:"Test1"
            //                 }
            //             ],{
            //                 onOpen(cont) {
            //                     // div.addEventListener("mouseleave",e=>{
            //                     //     closeSingleDropdown(div);
            //                     // });
            //                     // console.log(div);
            //                 },
            //                 postX:r.right,
            //                 postY:r.top,
            //             },false,2);
            //         });
            //     },
            // },
            {
                label:"Turn 180",
                onclick:async (d,cont)=>{
                    selProject.edit.flipSelection(-1,-1);
                }
            },
            {
                label:"Flip X",
                onclick:async (d,cont)=>{
                    selProject.edit.flipSelection(-1,1);
                }
            },
            {
                label:"Flip Y",
                onclick:async (d,cont)=>{
                    selProject.edit.flipSelection(1,-1);
                }
            },
        ],{
            // postX:cur.offsetLeft+cur.offsetWidth,
            // postY:cur.offsetTop+cur.offsetHeight/2,
            postX:tarX,
            postY:tarY,
            onOpen:(cont)=>{
                cont.classList.add("quick-settings");
                let d_ops = document.createElement("div");
                cont.appendChild(d_ops);
                d_ops.className = "quick-settings-ops";
                let ops = new MenuComponent(d_ops);
                
                let xylabel = document.createElement("div");
                xylabel.textContent = `(${Math.floor(mx)},${Math.floor(my)})`;
                xylabel.style.marginLeft = "10px";
                d_ops.appendChild(xylabel);
                
                let c = selProject.getVisiblePixel(mx,my);
                if(!c) c = [0,0,0,0];
                let hex = RGBToHex(c);
                let tarCol = new ColorInputComponent(hex,(v,inp)=>{

                });
                tmp.hex = hex;
                tarCol.div.style.marginLeft = "auto";
                d_ops.appendChild(tarCol.div);

                // 
                if(false) for(const c of cont.children){
                    let cc = c as HTMLElement;
                    cc.addEventListener("mouseenter",e=>{
                        console.log(e.clientX,r.right);
                        let rr = c.getBoundingClientRect();
                        if(e.clientX >= rr.right) return;
                        for(const dd of [...openDropdowns]){
                            if(dd == cont) continue;
                            closeSingleDropdown(dd);
                        }
                    });
                }
            },
        });
    }
});

onUp(async (e)=>{
    if(areSubWindowsOpen()) return;
    
    _lastTouchZoomDist = -1; // reset
    if(e.eventType == 2) setOverCanvas(false); // not sure if this is doing anything
    
    // if(e.button != 0) return;
    if(dragging) return;

    let toolWasInUse = (curTool?curTool.inUse:false);
    if(selProject) if(toolWasInUse){
        // if(toolWasInUse){
            await curTool.onUp();
            curTool.beforeEnd();
        // }
        endDCan();
    
        if(curTool) curTool.end();
        postEndDCan();
        if(curTool) curTool.afterEnd();
    }
    if(selProject) selProject.runCOMouseUp(e);
    endTool(); // this just turns off tool lock

    wasOverCanvas = false;
});
document.addEventListener("dragstart",e=>{
    if(_toolLock) e.preventDefault();
});
document.addEventListener("drag",e=>{
    if(_toolLock) e.preventDefault();
});

// 

class FinishableAction{
    constructor(title:string,tool:Tool){
        this.title = title;
        this.tool = tool;
    }
    title:string;
    tool:Tool;
    lastTool:Tool;
    start(){
        this.onStart();
    }
    cancel(){
        this._end();
        this.onCancel();
        if(this.lastTool) selectTool(this.lastTool);
    }
    finish(){
        this._end();
        this.onFinish();
        if(this.lastTool) selectTool(this.lastTool);
    }
    _end(){
        selProject.curFinishableAction = null;
        // curFinishableActions.splice(curFinishableActions.indexOf(this),1);
        selectTool(curTool); // clear the TS_Finished
    }
    onFinish(){}
    onStart(){}
    onCancel(){}

    selectTool(){}

    update(){}
    updateSettings(){} // function to call when color, alpha, tool settings are changed
}
class FA_Spline extends FinishableAction{
    constructor(hobj:SplineHandleCObj){
        super("Finish Spline",tools.find(v=>v.id == "spline_tool"));
        this.startObj = hobj;
    }
    startObj:SplineHandleCObj;
    declare tool:SplineTool;

    isBezier = true;

    updateSettings(): void {
        this.update();
    }

    onFinish(): void {
        let p = selProject;
        if(!p) return;

        this.draw(p.main);
        
        endDCan(undefined,false,DrawMode.draw);
        selProject.applyChangeToAll(true,true);

        this.reset();
        endAllCursors();
        selProject.hist.add(new HA_FinishFA("Finish Spline",HistIcon.finish,this));

        postEndDCan();
    }
    onStart(): void {
        // this.points.push(this.startObj);
        selProject.hist.add(new HA_StartSpline(this.startObj));
    }
    onCancel(): void {
        this.reset();
        selProject.hist.add(new HA_CancelFA("Cancel Spline",HistIcon.cancel,this));
    }
    selectTool(): void {
        selectTool(tools.find(v=>v instanceof SplineTool));
    }

    reset(){
        selProject.clearPrev();
        let list = selProject.canObjs.filter(v=>v instanceof SplineHandleCObj);
        for(const c of list){
            selProject.removeCanObj(c);
        }
    }

    add(hobj:SplineHandleCObj){
        // this.points.push(hobj);
        let ha = new HA_AddSplineHandle(hobj);
        ha.setFA(this);
        selProject.hist.add(ha);
    }

    // 
    update(){
        if(!selProject) return;
        let prev = selProject.prev;
        selProject.clearPrev();

        this.draw(prev);
    }

    // drawTO:number;
    // lastDraw = -999;
    draw(c:CanvasRenderingContext2D){
        c.imageSmoothingEnabled = false;
        let proj = selProject;
        if(!proj) return;
        
        let points = selProject.canObjs.filter(v=>v instanceof SplineHandleCObj) as SplineHandleCObj[];
        if(points.length){
            c.lineWidth = this.tool.brushSize.val;
            c.strokeStyle = col;
            c.fillStyle = col;
            c.globalAlpha = gAlpha;
            c.lineCap = ["butt","round","square"][this.tool.lineCap.v] as CanvasLineCap;
            c.beginPath();

            let minL = proj.w;
            let maxR = 0;
            let minT = proj.h;
            let maxB = 0;

            let tol = this.tool.brushSize.val + 5;
            
            if(!this.isBezier){
                let lx:number|undefined = undefined;
                let ly:number|undefined = undefined;
                for(let i = 0; i < points.length; i++){
                    let p = points[i];
                    
                    drawLine(c,lx,ly,p.x,p.y,col,gAlpha,this.tool.brushSize.val);
                    lx = p.x;
                    ly = p.y;
                    // if(i == 0) prev.moveTo(p.x,p.y);
                    // else prev.lineTo(p.x,p.y);
                    // else prev.bezierCurveTo();
                }
            }
            else{
                let first = points[0];
                c.moveTo(first.x,first.y);

                if(first.x-tol < minL) minL = first.x-tol;
                if(first.x+tol > maxR) maxR = first.x+tol;
                if(first.y-tol < minT) minT = first.y-tol;
                if(first.y+tol > maxB) maxB = first.y+tol;

                for(let i = 1; i < points.length; i++){
                    let p = points[i];
                    let l = points[i-1]; // last

                    let ex = l.handles[1] ? l.ex : 0;
                    let ey = l.handles[1] ? l.ey : 0;
                    let sx = p.handles[0] ? p.sx : 0;
                    let sy = p.handles[0] ? p.sy : 0;
                    
                    if(!l.handles[1] && !p.handles[0]) c.lineTo(p.x,p.y);
                    else c.bezierCurveTo(l.x+ex,l.y+ey,p.x+sx,p.y+sy,p.x,p.y);

                    let left = Math.min(l.x+ex,p.x+sx,p.x)-tol;
                    let right = Math.max(l.x+ex,p.x+sx,p.x)+tol;
                    let top = Math.min(l.y+ey,p.y+sy,p.y)-tol;
                    let bottom = Math.max(l.y+ey,p.y+sy,p.y)+tol;

                    if(left < minL) minL = left;
                    if(right > maxR) maxR = right;
                    if(top < minT) minT = top;
                    if(bottom > maxB) maxB = bottom;
                }
            }

            c.stroke();
            
            proj.applyEffectedInstant(minL,maxR,minT,maxB);
            correctCtx(c,0.5);
            c.globalAlpha = 1;
            c.lineCap = "butt";
            // if(instant){
            //     proj.applyEffectedInstant(minL,maxR,minT,maxB);
            //     correctCtx(c,0.5);
            //     c.globalAlpha = 1;
            //     this.lastDraw = performance.now();
            // }
            // else{
            //     if(this.drawTO) clearTimeout(this.drawTO);
            //     this.drawTO = setTimeout(()=>{
            //         proj.applyEffectedInstant(minL,maxR,minT,maxB);
            //         correctCtx(c,0.5);
            //         c.globalAlpha = 1;
            //         this.drawTO = undefined;
            //         this.lastDraw = performance.now();
            //     },0);
            // }
        }
    }
}
class FA_PasteData extends FinishableAction{
    constructor(can:HTMLCanvasElement,x:number,y:number){
        super("Finish Paste Data",tools.find(v=>v.id == "pointer"));
        this.can = can;
        this.x = x;
        this.y = y;
    }
    can:HTMLCanvasElement;
    x:number;
    y:number;
    // obj:ImgCObj;
    _id:number;
    onFinish(): void {
        // console.log("finished");
        if(!selProject) return;
        if(this._id == null){
            console.warn("could not finish, no _id");
            return;
        }
        let main = selProject.main;
        let obj = selProject.getCanObj(this._id) as ImgCObj;
        if(!obj){
            console.warn("Err: couldn't find can obj");
            return;
        }
        obj.render();
        main.drawImage(selProject.prev.canvas,0,0);
        // main.drawImage(obj.prev.canvas,obj.getX(),obj.getY());
        endDCan(undefined,false,DrawMode.draw);
        selProject.applyChangeToAll(true,true);
        // selProject.hist.add(new HA_CanCopy("Finish Paste",HistIcon.draw));
        selProject.removeCanObj(obj);
        endAllCursors();
        // obj needs to be keep around in case, even if it takes more memory

        selProject.clearPrev();
        selProject.hist.add(new HA_FinishFA("Finish Paste",HistIcon.draw,this));
        postEndDCan();
    }
    onStart(): void {
        // console.log("started");
        selProject.edit.deselectAll(true);
        let obj = (this._id != null ? selProject.getCanObj(this._id) : null) as ImgCObj;
        let isNew = false;
        if(!obj){
            obj = new ImgCObj(this.x,this.y,this.can);
            isNew = true;
        }
        else{
            obj.x = this.x;
            obj.y = this.y;
            obj.can = this.can;
            obj.update();
        }
        if(isNew){
            selProject.addCanObj(obj);
            this._id = obj._id;
        }
        obj.select();
        selProject.clearPrev();
        selProject.hist.add(new HA_PasteSelection(obj));
        obj.update();
    }
    onCancel(): void {
        console.warn("canceled");
        if(this._id == null) return;
        let obj = selProject.getCanObj(this._id);
        if(obj){
            selProject.removeCanObj(obj);
            // this.obj = null;
        }
        endAllCursors();
        selProject.clearPrev();
        selProject.hist.add(new HA_CancelFA("Cancel Paste",HistIcon.cancel,this));
    }
    selectTool(): void {
        selectTool(tools.find(v=>v instanceof PointerTool));
    }
}
class FA_EditSelection extends FinishableAction{
    constructor(can:HTMLCanvasElement,x:number,y:number){
        super("Finish Edit Selection",tools.find(v=>v.id == "pointer"));
        this.can = can;
        this.x = x;
        this.y = y;
    }
    can:HTMLCanvasElement;
    x:number;
    y:number;
    _id:number;
    onFinish(): void {
        if(!selProject) return;
        if(this._id == null){
            console.warn("could not finish, no _id");
            return;
        }
        let obj = selProject.getCanObj(this._id) as ImgCObj;
        if(!obj){
            console.warn("Err: couldn't find can obj");
            return;
        }
        obj.render();
        selProject.sel.canvas.width = selProject.w;
        selProject.sel.drawImage(selProject.prev.canvas,0,0); //

        selProject.removeCanObj(obj);
        endAllCursors();
        // obj needs to be keep around in case, even if it takes more memory

        selProject.hist.add(new HA_FinishFA("Finish Edit Selection",HistIcon.draw,this));
        postEndDCan();
    }
    onStart(): void {
        selProject.edit.deselectAll(true);
        let obj = (this._id != null ? selProject.getCanObj(this._id) : null) as ImgCObj;
        let isNew = false;
        if(!obj){
            obj = new ImgCObj(this.x,this.y,this.can);
            isNew = true;
        }
        else{
            obj.x = this.x;
            obj.y = this.y;
            obj.can = this.can;
            obj.update();
        }
        if(isNew){
            selProject.addCanObj(obj);
            this._id = obj._id;
        }
        obj.select();
        selProject.clearPrev();
        selProject.hist.add(new HA_PasteSelection(obj));
    }
    onCancel(): void {
        console.warn("canceled");
        if(this._id == null) return;

        selProject.sel.canvas.width = selProject.w;
        selProject.sel.drawImage(this.can,this.x,this.y); //
        updateSelection();

        let obj = selProject.getCanObj(this._id);
        if(obj){
            selProject.removeCanObj(obj);
            // this.obj = null;
        }
        endAllCursors();
        selProject.clearPrev();
        selProject.hist.add(new HA_CancelFA("Cancel Edit Selection",HistIcon.cancel,this));
    }
    selectTool(): void {
        selectTool(tools.find(v=>v instanceof PointerTool));
    }
}
// let curFinishableAction:FinishableAction;
// let curFinishableActions:FinishableAction[] = [];
function _runFinishableAction(fa:FinishableAction){
    selProject.curFinishableAction = fa;
    // console.log("RUN FINISH:",fa.tool);
    // curFinishableActions.push(fa);
}
function startFinishableAction(fa:FinishableAction){
    if(selProject.curFinishableAction) return; // makes it so you can only have one at a time
    
    // fa.selectTool();
    if(!curTool) return;
    if(!selProject) return;
    _runFinishableAction(fa);
    
    fa.start(); // this should add something to the history
    fa.lastTool = curTool;
    selectTool(fa.tool);
    selProject.hist.curHA().setFA(fa,true);
    // selProject.hist.curHA().setFAS(curFinishableActions);
}
function restartFinishableAction(fa:FinishableAction){
    
    // if(curFinishableActions.length) return;
    // if(curFinishableAction) return;
    // console.log("RESTART");
    if(!curTool) return;
    if(!selProject) return;
    _runFinishableAction(selProject.curFinishableAction??fa);
    // if(fa.tool){
    //     console.log("CUR:",curFinishableAction);
    //     selectTool(fa.tool);
    // }
    // _runFinishableAction(fa);
}