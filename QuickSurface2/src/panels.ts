class ColorPanel extends Panel{
    constructor(loc:PanelLoc){
        super(loc,false,false,true);
    }
    inp:ColorInputComponent;
    alphaInp:HTMLInputElement;
    cpCont:MenuComponent;
    sampleCPCont:MenuComponent;
    getId(): string {
        return "color";
    }
    getName(): string {
        return "Color Panel";
    }
    load(): void {
        super.load();
        this.init();
        this.genHeader("Colors");
        this.genBody();
        this.body.classList.add("color-body");

        let root = new MenuComponent(this.body);
        let {inp} = root.createInputBox("Color","color","#000000","RGB");
        let colInp = new ColorInputComponent("#000000",(v,_inp)=>{
            selProject?.setColStr(v);
            if(b_quickColor) b_quickColor.setColor(col,true);
        });
        inp.replaceWith(colInp.div);
        // inp.addEventListener("input",e=>{
        //     col = inp.value;
        // });
        this.inp = colInp;

        let {inp:alphaInp} = root.createInputBox("Opacity","number",1);
        confirmInput(alphaInp,e=>{
            let v = alphaInp.valueAsNumber;
            v = Math.round(v*10)/10;
            if(v > 1) v = 1;
            else if(v < 0) v = 0;
            alphaInp.valueAsNumber = v;
            selProject.setGAlpha(alphaInp.valueAsNumber);
        },{speed:0.1});
        this.alphaInp = alphaInp;

        // color palette
        root.createButtonList([
            {
                // label:"Compute Color Palette",
                label:"Compute Palette",
                type:ButtonType.accent,
                onclick:async (e,b)=>{
                    // selProject.cp = computeColorPalette(selProject.getFirstCurLayer()?.ctx);
                    // selProject.cp = computeColorPalette(selProject); // <-- this is repeat?
                    selProject.computeCP();
                    this.update();
                }
            },
            {
                label:"Apply",
                onclick:async (e,b)=>{
                    // let tmp = selProject.getDrawMode();
                    // selProject.setDrawMode(DrawMode.replace_all);
                    // this.cp.drawTo2(selProject.main);
                    // selProject.loopSel(l=>{
                    //     this.cp.drawTo2(l.ctx);
                    // });

                    selProject.modifyCP(selProject.cp,true);
                    selProject.applyCPChange();

                    // endDCan();
                    // selProject.hist.add(new HA_Full(selProject));
                    // selProject.setDrawMode(tmp);
                }
            }
        ])
        root.createHeading("Palette");
        this.cpCont = root.createColumns(1)[0];
        this.cpCont.body.classList.add("palette-cont");

        // sample palettes
        root.createHeading("Sample Palettes");
        this.sampleCPCont = root.createColumns(1)[0];
        this.sampleCPCont.body.classList.add("palette-cont","sample-palette-cont");

        this.update();
    }
    colorUpdate(): void {
        let ar = convert(col);
        let r = ar[0].toString(16).padStart(2,"0");
        let g = ar[1].toString(16).padStart(2,"0");
        let b = ar[2].toString(16).padStart(2,"0");
        this.inp.setColor(`#${r}${g}${b}`,true);
        this.alphaInp.valueAsNumber = gAlpha;
    }
    update(): void {
        let ar = convert(col);
        let r = ar[0].toString(16).padStart(2,"0");
        let g = ar[1].toString(16).padStart(2,"0");
        let b = ar[2].toString(16).padStart(2,"0");
        this.inp.setColor(`#${r}${g}${b}`);
        this.alphaInp.valueAsNumber = gAlpha;
        let p = selProject;

        // color palette
        let curL = selProject?.getFirstCurLayer();
        if(curL){
            // p.cp = computeColorPalette(curL.ctx);
            // p.cp = computeColorPalette(p); // <-- this could get expensive
            this.cpCont.body.textContent = "";
            if(p.cp?.cols) for(let i = 0; i < p.cp.cols.length; i++){
                let c = p.cp.cols[i];
                // let inp = document.createElement("input");
                // inp.type = "color";
                // inp.value = RGBToHex(map32To8x4(c));
                let {div} = new ColorInputComponent(RGBToHex(map32To8x4(c)),(v,inp)=>{
                    let ar = [...convert(v)];
                    cp.setRGBA(i,ar);
                });
                this.cpCont.body.appendChild(div);
                let cp = p.cp;
                // inp.oninput = function(){
                //     // let v = parseInt("ff"+inp.value.substring(1).split("").reverse().join(""),16);
                //     // console.log("SET I",i,v,map32To8x4(v),inp.value);
                //     let ar = [...convert(inp.value)];
                //     console.log(ar);
                //     cp.setRGBA(i,ar);
                // };
            }
        }

        // sample palettes
        this.sampleCPCont.body.textContent = "";
        for(const cp of sampleCP.testing){
            let cols = this.sampleCPCont.createColumns(2);
            cols[1].setPadding("0px");
            let cont = cols[0].setPadding("0px");
            for(let i = 0; i < cp.cols.length; i++){
                let c = cp.cols[i];
                let {div} = new ColorInputComponent(RGBToHex(map32To8x4(c)),(v,inp)=>{
                    let ar = [...convert(v)];
                    cp.setRGBA(i,ar);
                });
                cont.body.appendChild(div);
            }
            cols[1].createButtonList([
                {
                    label:"Apply",
                    async onclick(e, b) {
                        // selProject.cp.copyFrom(cp);
                        let p = selProject;
                        p.modifyCP(cp);
                        p.applyCPChange();
                    }
                }
            ]);
        }
    }
}

function RGBToHex(c:number[]){
    let r = c[0].toString(16).padStart(2,"0");
    let g = c[1].toString(16).padStart(2,"0");
    let b = c[2].toString(16).padStart(2,"0");
    return `#${r}${g}${b}`;
}
type ColorDragOps = {
    onchange?:(v:string,last:string)=>void
}

let _dragColor:ColorInputComponent;
let _hoverColor:ColorInputComponent;
let _draggingColor = false;
let _dc_part:HTMLElement;
function startDragColor(v:ColorInputComponent){
    _dragColor = v;
    _draggingColor = true;
    if(!_dc_part) _dc_part = _dragColor.div.cloneNode(true) as HTMLElement;
    let c = _dc_part;
    // c.style.position = "absolute";
    c.classList.add("color-drag");
    document.body.appendChild(c);
    return c;
}
function endDragColor(to?:ColorInputComponent){
    if(!to) to = _hoverColor;
    if(_dc_part){
        _dc_part.remove();
        _dc_part = null;
    }
    if(to) if(to != _dragColor){
        // swap
        let tmp = _dragColor.getColor();
        _dragColor.setColor(to.getColor());
        to.setColor(tmp);
    }
    _draggingColor = false;
    _dragColor = null;
}
function updateDragColor(e:MouseEvent){
    if(!_dragColor) return;
    let c = _dc_part;
    c.style.left = e.clientX+"px";
    c.style.top = e.clientY+"px";
}
let _colHasLeft = 0;

class ColorInputComponent{
    constructor(v:string,oninput:(v:string,inp:HTMLInputElement)=>void,dragOps:ColorDragOps={}){
        this.oninput = oninput;
        let div = document.createElement("div");
        div.classList.add("color-inp");
        this.div = div;

        let inp = document.createElement("input");
        inp.type = "color";
        inp.value = v;
        this.inp = inp;
        div.appendChild(inp);

        inp.addEventListener("mousedown",e=>{
            if(e.button == 0){
                if(e.shiftKey){
                    selProject.setColStr(this.inp.value);
                    // updatePanel("color");
                }
            }
        });
        inp.addEventListener("click",e=>{
            this.open();
            // e.preventDefault();
            // console.log(e.button);
            // if(e.button == 2){
            //     return;
            //     // this.open();
            // }
            // if(e.button == 0){
            //     // console.log(_colHasLeft);
            //     if(_colHasLeft == 1 || _colHasLeft == 0){
            //         col = this.inp.value;
            //         updatePanel("color");
            //         _colHasLeft = 0;
            //     }
            // }
        });
        // inp.addEventListener("contextmenu",e=>{
        //     e.preventDefault();
        //     this.open();
        // });

        inp.addEventListener("input",e=>{
            this.setColor(inp.value);
        });

        this.setColor(v,true);

        setupDropdown(div,"d",[
            {
                label:"Use",
                id:"use",
                onclick:(d, cont)=>{
                    selProject.setColStr(this.inp.value);
                    // updatePanel("color");
                }
            },
            {
                label:"Add to Palette",
                id:"add",
                onclick:(d, cont)=>{
                    selProject.cp.addStr(this.inp.value);
                    updatePanel("color");
                }
            },
            {
                label:"Remove from Palette",
                id:"add",
                onclick:(d, cont)=>{
                    selProject.cp.removeStr(this.inp.value);
                    updatePanel("color");
                }
            }
        ],undefined,undefined,undefined,{
            // ctrlClick:true
            isRightClick:true
        });

        inp.addEventListener("mousedown",e=>{
            _dragColor = this;
        });
        inp.addEventListener("mouseenter",e=>{
            _hoverColor = this;
            if(_colHasLeft == 0) _colHasLeft = 1;
        });
        inp.addEventListener("mouseleave",e=>{
            _hoverColor = null;
            if(_colHasLeft == 1) _colHasLeft = 2;
        });
    }
    div:HTMLElement;
    inp:HTMLInputElement;
    oninput:(v:string,inp:HTMLInputElement)=>void;
    ops:ColorDragOps;
    setColor(v:string,nocall=false){
        let last = this.inp.value;
        this.inp.value = v;
        this.div.style.setProperty("--col",v);
        if(!nocall) this.oninput(v,this.inp);
        if(!nocall) if(this.ops?.onchange) this.ops.onchange(v,last);
    }
    getColor(){
        return this.inp.value;
    }
    open(){
        this.inp.click();
    }
}
document.addEventListener("mouseup",e=>{
    if(_draggingColor){
        endDragColor();
    }
    _dragColor = null;
    _draggingColor = false;
});
document.addEventListener("mousemove",e=>{
    if(!mouseDown[0]) return;
    if(_dragColor && !_draggingColor){
        let dx = mx-smx;
        let dy = my-smy;
        let dist = Math.sqrt(dx**2+dy**2);
        if(dist < 2) return;
        startDragColor(_dragColor);
    }
    updateDragColor(e);
});

// 

class MiniPreviewPanel extends Panel{
    constructor(loc:PanelLoc){
        super(loc,false,false,false);
    }
    can:HTMLCanvasElement;
    playing = false;
    frameI = 0;
    lastHA:HistAction;
    i = 0;
    speed = 1;

    playIcon:HTMLImageElement;

    static updateIfPaused(){
        getPanel<MiniPreviewPanel>("mini_preview",p=>{
            if(p.frameI != p.frameI) return;
            if(!p.playing) p.update();
        });
    }

    togglePlay(){
        this.playing = !this.playing;
        this.updatePlayIcon();
    }
    updatePlayIcon(){
        if(this.playing){
            this.playIcon.src = allIcons[HistIcon[HistIcon.pause]];
        }
        else{
            this.playIcon.src = allIcons[HistIcon[HistIcon.play]];
        }
    }

    getId(): string {
        return "mini_preview";
    }
    getName(): string {
        return "Mini Preview Panel";
    }
    load(): void {
        super.load();
        this.init();
        this.genHeader("Mini Preview");
        this.genBody();

        this.can = document.createElement("canvas");
        
        this.body.appendChild(this.can);

        let i_frame = MenuComponent.blank().createInputBox("","number",selProject?.getCurFrameI()??0,"",{
            contMargin:"0px"
        });
        let bb = this.createHeaderOption(HistIcon.draw,()=>{});
        bb.replaceWith(i_frame.body);
        
        let i_speed = MenuComponent.blank().createInputBox("","number",1,"",{
            contMargin:"0px"
        });
        let aa = this.createHeaderOption(HistIcon.draw,()=>{});
        aa.replaceWith(i_speed.body);

        i_speed.body.style.width = "35px";
        i_frame.body.style.width = "35px";

        let low = 0;
        confirmInput(i_speed.inp,e=>{
            let v = i_speed.inp.valueAsNumber;
            if(v < low) v = low;
            v = Math.round(v*10)/10;
            i_speed.inp.valueAsNumber = v;
            this.speed = i_speed.inp.valueAsNumber;
        },{speed:0.1});

        confirmInput(i_frame.inp,e=>{
            if(!selProject) return;
            this.i = 0;
            if(i_frame.inp.valueAsNumber < 0) i_frame.inp.valueAsNumber += selProject.frames.length;
            i_frame.inp.valueAsNumber %= selProject.frames.length;
            this.frameI = i_frame.inp.valueAsNumber;
            this.playing = false;
            this.updatePlayIcon();
            this.loadFrame();
        },{speed:1});
        
        this.playIcon = this.createHeaderOption(HistIcon.play,e=>{
            this.togglePlay();
        }).children[0] as HTMLImageElement;

        this.update();
    }
    update(): void {
        if(!this.canUpdate()) return;

        let p = selProject;
        if(p){
            this.can.width = p.w;
            this.can.height = p.h;
        }

        this.loadFrame();
        this.updatePlayIcon();
    }
    tick(): void {
        if(!this.playing) return;
        let p = selProject;
        if(!p) return;
        
        let timeNeeded = 60/p.getFPS();
        if(this.i <= 0){
            this.i = timeNeeded;
            this.frameI++;
            if(this.frameI >= p.frames.length) this.frameI = 0;
        }
        else{
            this.i -= deltaScale * this.speed;
        }
        
        this.loadFrame();
    }
    loadFrame(){
        let p = selProject;
        if(!p) return;

        // let curHA = p.hist.curHA();
        // if(curHA == this.lastHA) return;
        // this.lastHA = curHA;

        let can = this.can;
        can.width = p.w;
        can.height = p.h;
        let ctx = can.getContext("2d");

        // TMP
        // this.frameI = 0;
        // 
        
        let frame = p.frames[this.frameI];
        if(!frame){
            this.frameI = 0;
            return;
        }
        let list = [...frame.layers].filter(v=>!v[1].isEmpty()).sort((a,b)=>p.gLayers.indexOf(a[1].lref)-p.gLayers.indexOf(b[1].lref)).map(v=>v[1]);
        for(const l of list){
            ctx.drawImage(l.ctx.canvas,0,0);
        }

        // TEMP
        let cam = p.canObjs.find(v=>v instanceof CameraCObj);
        if(cam){
            let tmp = createCan(Math.floor(cam.w*cam.sw),Math.floor(cam.h*cam.sh));
            let tctx = tmp.getContext("2d");
            tctx.imageSmoothingEnabled = false;

            let tmp2 = createCan(can.width,can.height);
            let tctx2 = tmp2.getContext("2d");
            tctx2.imageSmoothingEnabled = false;

            // console.log(cam.x,cam.w,cam.sw);
            let w = cam.w*cam.sw;
            let h = cam.h*cam.sh;
            // let ax = (cam.x+w/2)/p.w;
            // let ay = (cam.y+h/2)/p.h;
            tctx2.translate(cam.x+w/2,cam.y+h/2);
            tctx2.rotate(-cam.a);
            tctx2.drawImage(can,-(cam.x+w/2),-(cam.y+h/2));
            // tctx2.drawImage(can,-p.w*ax,-p.h*ay);
            
            tctx.drawImage(tmp2,cam.x-cam.w/2,cam.y-cam.h/2);
            
            // finalize
            can.width = tmp.width;
            can.height = tmp.height;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tmp2,-cam.x,-cam.y);

            // ctx.drawImage(tmp,0,0);

            
            // tctx2.translate(cam.x+cam.w/2,cam.y+cam.h/2);
            // tctx2.rotate(cam.a);
            // tctx2.drawImage(can,);
            
            
            ctx.resetTransform();
        }
    }
}

class MixerPanel extends Panel{
    constructor(loc:PanelLoc){
        super(loc,false,false,true);
    }
    getId(): string {
        return "mixer";
    }
    getName(): string {
        return "Mixer Panel";
    }
    load(): void {
        super.load();
        this.init();
        this.genHeader("Mixer");
        this.genBody();
        this.body.classList.add("color-body");
        this.sliders = [];
        // 

        let root = new MenuComponent(this.body);
        this.mainColor = new ColorInputComponent(col,(v,inp)=>{
            selProject?.setColStr(v,this.main[3]/255);
        });
        this.mainColor.inp.addEventListener("blur",e=>{
            updateAllPanels();
        });
        root.body.appendChild(this.mainColor.div);

        let color = root.createInputBox("Main","color",col,"RGB");
        color.inp.replaceWith(this.mainColor.div);

        let c0 = convert(col);
        let hsl = RGBAtoHSLA(c0[0],c0[1],c0[2],255);
        this.main[4] = hsl[0];
        this.main[5] = hsl[1];
        this.main[6] = hsl[2];

        this.createColorSlider(4,root,"H",0,360,hsl[0]);
        this.createColorSlider(5,root,"S",0,100,hsl[1]);
        this.createColorSlider(6,root,"L",0,100,hsl[2]);
        this.createColorSlider(0,root,"R",0,255,c0[0]);
        this.createColorSlider(1,root,"G",0,255,c0[1]);
        this.createColorSlider(2,root,"B",0,255,c0[2]);
        this.createColorSlider(3,root,"A",0,255,c0[3]);

        // 
        let bottomCont = new MenuComponent(document.createElement("div"));
        bottomCont.body.style.display = "grid";
        bottomCont.body.style.gridTemplateColumns = "100px 1fr";
        bottomCont.body.style.gap = "30px";
        bottomCont.body.style.alignItems = "start";

        root.body.appendChild(bottomCont.body);
        let colorWheel = this.createColorWheel();
        bottomCont.body.appendChild(colorWheel);
        
        let i_hex = bottomCont.createInputBox("Hex","string","FFFFFFFF","",{});
        let i_hex_label = i_hex.inp.previousElementSibling as HTMLElement;
        i_hex_label.style.minWidth = "unset";
        i_hex_label.style.marginRight = "auto";
        i_hex.inp.style.width = "66px";
        this.i_hex = i_hex.inp;
        this.i_hex.style.fontFamily = "monospace";
        confirmInput(this.i_hex,e=>{
            let fail = ()=>{
                this.i_hex.value = this.convHex(this.main);
            };
            let v = this.i_hex.value;
            if(v.length < 6 || v.length == 7 || v.length > 8){
                fail();
                return;
            }
            if(v.length == 6) v += "FF";

            let r = parseInt(v.substring(0,2),16);
            let g = parseInt(v.substring(2,4),16);
            let b = parseInt(v.substring(4,6),16);
            let a = parseInt(v.substring(6,8),16);

            this.main[0] = r;
            this.main[1] = g;
            this.main[2] = b;
            this.main[3] = a;
            
            this.updateHSL();
            this.updateSliders();
            this.updateColor();
        });

        // 
        this.update();
    }
    update(): void {
        let conv = convert(col);
        this.main[0] = conv[0];
        this.main[1] = conv[1];
        this.main[2] = conv[2];
        
        this.updateSliders();
        this.updateColor();
    }
    colorUpdate(): void {
        let c0 = convert(col);
        let hsl = RGBAtoHSLA(c0[0],c0[1],c0[2],255);
        this.main[0] = c0[0];
        this.main[1] = c0[1];
        this.main[2] = c0[2];
        this.main[3] = Math.round(gAlpha*255);
        this.main[4] = hsl[0];
        this.main[5] = hsl[1];
        this.main[6] = hsl[2];

        this.updateSliders();
        this.updateColor(true);
    }

    // main = [0,100,50,255,0,0,255];
    main = [255,0,0,255,0,100,50];
    mainColor:ColorInputComponent;
    sliders:InputComponent[] = [];
    i_hex:HTMLInputElement;
    
    updateColor(noMainUpdate=false){
        this.mainColor.setColor(this.convRGB(this.main),noMainUpdate);

        for(let i = 0; i < this.sliders.length; i++){
            let s = this.sliders[i];

            let copy = [...this.main];
            if(i < 4){
                s.inp.style.setProperty("--grad",`linear-gradient(90deg, ${this.conv(this.tweak2(copy,i,0))}, ${this.conv(this.tweak2(copy,i,255))})`);
            }
            else{
                if(i == 4) s.inp.style.setProperty("--grad",`linear-gradient(90deg,hsl(0deg,100%,50%),hsl(45deg,100%,50%),hsl(90deg,100%,50%),hsl(135deg,100%,50%),hsl(180deg,100%,50%),hsl(225deg,100%,50%),hsl(270deg,100%,50%),hsl(270deg,100%,50%),hsl(315deg,100%,50%),hsl(0deg,100%,50%))`);
                else if(i == 5) s.inp.style.setProperty("--grad",`linear-gradient(90deg, gray, rgba(${copy[0]},${copy[1]},${copy[2]},${copy[3]}))`);
                else if(i == 6) s.inp.style.setProperty("--grad",`linear-gradient(90deg, black, hsla(${copy[4]}deg,${copy[5]}%,50%,${copy[3]}), white)`);
            }
        }

        // let hsl = RGBAtoHSLA(this.main[0],this.main[1],this.main[2],this.main[3]);
        let hsl = [this.main[4],this.main[5],this.main[6]];
        let dist = 1-hsl[2]/100;
        if(dist < 0) dist = 0;
        if(dist > 0.5) dist = 0.5;
        // let x = Math.cos(hsl[0])*dist/50 + 0.5;
        // let y = Math.sin(hsl[1])*dist/50 + 0.5;
        let x = Math.cos(hsl[0]/180*Math.PI)*dist + 0.5;
        let y = Math.sin(hsl[0]/180*Math.PI)*dist + 0.5;
        this.setCWPos(x,y);

        this.updateHex();
    }
    conv(c:number[]){
        return `rgba(${c[0]},${c[1]},${c[2]},${c[3]/255})`;
    }
    convRGB(c:number[]){
        let r = c[0].toString(16).padStart(2,"0");
        let g = c[1].toString(16).padStart(2,"0");
        let b = c[2].toString(16).padStart(2,"0");
        return `#${r}${g}${b}`;
        // return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
    convHex(c:number[]){
        let r = c[0].toString(16).padStart(2,"0");
        let g = c[1].toString(16).padStart(2,"0");
        let b = c[2].toString(16).padStart(2,"0");
        let a = c[3].toString(16).padStart(2,"0");
        return `${r}${g}${b}${a}`.toUpperCase();
    }
    tweak(c:number[],v:number[]){
        // c = [...c];
        for(let i = 0; i < v.length; i++){
            if(v[i] != -1) c[i] = v[i];
        }
        return c;
    }
    tweak2(c:number[],i:number,v:number){
        // c = [...c];
        c[i] = v;
        return c;
    }

    createColorSlider(i:number,root:MenuComponent,label:string,min:number,max:number,v:number){
        let c = root.createInputBox(label,"range",v,v.toString(),{});
        c.inp.min = min.toString();
        c.inp.max = max.toString();
        c.inp.step = "1";
        c.inp.classList.add("color-range");
        let old_suffix = c.inp.nextElementSibling;
        let suffix = document.createElement("input");
        suffix.type = "number";
        suffix.style.width = "40px";
        old_suffix.replaceWith(suffix);

        // let copy = [...this.main];
        // c.inp.style.setProperty("--grad",`linear-gradient(90deg, ${this.conv(this.tweak2(copy,i,0))}, ${this.conv(this.tweak2(copy,i,255))})`);

        suffix.valueAsNumber = v;
        c.inp.valueAsNumber = v;

        c.data = {
            suffix
        };

        this.sliders.splice(i,0,c);

        confirmInput(suffix,e=>{
            c.setVal(suffix.valueAsNumber);
            this.main[i] = Math.round(Math.min(Math.max(suffix.valueAsNumber,min),max));
            suffix.valueAsNumber = this.main[i];
            
            if(i < 4){
                let hsl = RGBAtoHSLA(this.main[0],this.main[1],this.main[2],255);
                this.main[4] = hsl[0];
                this.main[5] = hsl[1];
                this.main[6] = hsl[2];
                this.updateHSLSliders();
            }
            else{
                let rgb = HSLAtoRGBA(this.main[4],this.main[5],this.main[6],255);
                this.main[0] = rgb[0];
                this.main[1] = rgb[1];
                this.main[2] = rgb[2];
                this.updateRGBSliders();
            }
            
            this.updateColor();
        },{speed:1});
        
        c.inp.addEventListener("input",e=>{
            suffix.value = c.inp.value;
            this.main[i] = Math.round(Math.min(Math.max(suffix.valueAsNumber,min),max));
            // suffix.valueAsNumber = this.main[i];

            if(i < 4){
                let hsl = RGBAtoHSLA(this.main[0],this.main[1],this.main[2],255);
                this.main[4] = hsl[0];
                this.main[5] = hsl[1];
                this.main[6] = hsl[2];
                this.updateHSLSliders();
            }
            else{
                let rgb = HSLAtoRGBA(this.main[4],this.main[5],this.main[6],255);
                this.main[0] = rgb[0];
                this.main[1] = rgb[1];
                this.main[2] = rgb[2];
                this.updateRGBSliders();
            }
            
            this.updateColor();
        });

        return c;
    }

    cw:HTMLElement;
    cw_thumb:HTMLElement;
    createColorWheel(){
        let cont = document.createElement("div");
        this.cw = cont;
        let wheel = document.createElement("div");
        cont.className = "colorwheel-cont";
        cont.appendChild(wheel);
        wheel.className = "colorwheel";

        let cw_thumb = document.createElement("div");
        cw_thumb.className = "cw-thumb";
        cont.appendChild(cw_thumb);
        this.cw_thumb = cw_thumb;

        cont.addEventListener("mousedown",e=>{
            if(e.button == 0){
                this.setCWPosClient(e.clientX,e.clientY,true);
                cw_drag.ref = this;
            }
        });

        return cont;
    }
    setCWPosClient(clientX:number,clientY:number,set=false){
        let r = this.cw.getBoundingClientRect();
        let x = (clientX-r.left)/r.width;
        let y = (clientY-r.top)/r.height;
        this.setCWPos(x,y,set);
    }

    cw_x = 0;
    cw_y = 0;
    setCWPos(x:number,y:number,set=false){
        let t = this.cw_thumb;
        if(!t) return;
        
        let dx = 0.5-x;
        let dy = 0.5-y;
        let ang = Math.atan2(dy,dx);
        let dist = Math.sqrt(dx**2+dy**2);
        if(dist > 0.5) dist = 0.5;

        if(!set){
            x = -Math.cos(ang)*dist + 0.5;
            y = -Math.sin(ang)*dist + 0.5;

            this.cw_x = x;
            this.cw_y = y;
            
            t.style.left = (x*100)+"%";
            t.style.top = (y*100)+"%";
        }

        if(set){
            if(dist > 0.5) dist = 0.5;
            else if(dist < 0) dist = 0;
            // this.main = HSLAtoRGBA(180+ang/Math.PI*180,100,Math.floor(100-dist*100),255);
            this.main = HSLAtoRGBA(180+ang/Math.PI*180,100,Math.round(100-dist*100),this.main[3]).concat(180+ang/Math.PI*180,100,Math.round(100-dist*100));
            selProject.setColStr(this.convRGB(this.main));

            this.updateSliders();
            this.update();
        }
    }

    updateSliders(){
        for(let i = 0; i < this.sliders.length; i++){
            let v = Math.round(this.main[i]);
            (this.sliders[i].data.suffix as HTMLInputElement).valueAsNumber = v;
            this.sliders[i].inp.valueAsNumber = v;
        }
    }
    updateRGBSliders(){
        for(let i = 0; i < 4; i++){
            let v = Math.round(this.main[i]);
            (this.sliders[i].data.suffix as HTMLInputElement).valueAsNumber = v;
            this.sliders[i].inp.valueAsNumber = v;
        }
    }
    updateHSLSliders(){
        for(let i = 4; i < this.sliders.length; i++){
            let v = Math.round(this.main[i]);
            (this.sliders[i].data.suffix as HTMLInputElement).valueAsNumber = v;
            this.sliders[i].inp.valueAsNumber = v;
        }
    }
    updateHex(){
        this.i_hex.value = this.convHex(this.main);
    }
    updateHSL(){
        let hsl = RGBAtoHSLA(this.main[0],this.main[1],this.main[2],255);
        this.main[4] = hsl[0];
        this.main[5] = hsl[1];
        this.main[6] = hsl[2];
    }
}

class EditPixelsPanel extends Panel{
    constructor(loc:PanelLoc){
        super(loc,false,false,false);
    }

    getId(): string {
        return "edit_pixels";
    }
    getName(): string {
        return "Edit Pixels Panel";
    }
    load(): void {
        super.load();
        this.init();
        this.genHeader("Edit Pixels");
        this.genBody();

        let root = new MenuComponent(this.body);
        root.createInputBox("Test","number",2,"PX");

        this.update();
    }
    update(): void {
        if(!this.canUpdate()) return;

        let p = selProject;
    }
}

class FolderViewPanel extends Panel{
    constructor(loc:PanelLoc){
        super(loc,false,false,true);
    }
    tabMain:HTMLElement;
    cur:FileSystemDirectoryHandle;

    newItems:Set<string> = new Set();
    wereOpen:Set<string> = new Set();
    scrollTop = 0;

    getId(): string {
        return "folder_view";
    }
    getName(): string {
        return "Folder View"; // Explorer?
    }
    load(): void {
        super.load();
        this.init();
        this.genHeader(this.getName());
        this.genBody();

        let cont = document.createElement("div");
        cont.className = "tab-main-cont";
        this.tabMain = cont;
        this.body.appendChild(cont);

        this.panel.addEventListener("contextmenu",e=>{
            e.preventDefault();
        });

        // this.body.addEventListener("scroll",e=>{
        //     this.scrollTop = this.body.scrollTop;
        // });

        let btns = this.opComp.createButtonList([
            {
                label:"Select Folder",
                onclick:async (e,b)=>{

                }
            }
        ]);
        let selectFolder = btns.children[0] as HTMLButtonElement;
        selectFolder.addEventListener("mousedown",async e=>{
            let list = await getRecentFolders();
            let dd = openDropdown("d",list.map(v=>{
                return {
                    label:v.handle.name,
                    data:v.handle,
                    onclick:async (d,cont)=>{
                        let res = await v.handle.requestPermission({
                            mode:"readwrite"
                        });
                        if(res == "denied") return;

                        this.cur = v.handle;
                        // this.update();
                        this.loadTab();
                    }
                };
            }),{
                postParent:selectFolder,
                hasSearch:true,
                onRemove:async (item,i)=>{
                    let h = item.data as FileSystemDirectoryHandle;
                    if(!h) return;
                    removeFromRecentFolders(h);
                }
            });
        });

        this.createHeaderOption(HistIcon.full,e=>{
            this.loadTab();
        },"Reload","Reload the folder view from the harddrive.");

        this.update();

        console.log("INIT FOLDER VIEW PANEL");

        // this.loadTab();

        // 
        this.body.addEventListener("scroll",e=>{
            this.scrollTop = this.body.scrollTop;
        });
    }
    update(): void {
        if(!this.canUpdate()) return;

        // this.scrollTop = this.body.scrollTop;
        this.loadTab(); // temp?

        // this.quickLoad();
    }

    async quickLoad(){
        
    }

    sel:string[] = [];

    sanitizeLoc(loc:string){
        return loc.replaceAll(".","-").replaceAll("/","-").replaceAll(" ","-");
    }
    selectItem(loc:string){
        if(this.sel.includes(loc)) return;
        
        let item = this.body.querySelector(".fItem_"+this.sanitizeLoc(loc));
        if(!item) return;

        item.classList.add("sel");
        this.sel.push(loc);
    }
    deselectItem(loc:string){
        let ind = this.sel.indexOf(loc);
        if(ind != -1) this.sel.splice(ind,1);
        
        let item = this.body.querySelector(".fItem_"+this.sanitizeLoc(loc));
        if(!item) return;

        item.classList.remove("sel");
    }
    deselectAll(){
        for(const s of this.sel){
            this.deselectItem(s);
        }
        this.sel = [];
    }
    toggleSelectItem(loc:string){
        if(this.sel.includes(loc)) this.deselectItem(loc);
        else this.selectItem(loc);
    }
    clickSelect(loc:string){
        if(this.sel.includes(loc)){
            this.deselectAll();
            return;
        }
        
        if(!shiftKey && !ctrlKey) this.deselectAll();
        this.selectItem(loc);
    }

    async loadTab(){
        console.log("loading tab");
        
        let p = selProject;
        // if(!p){
        //     this.tabMain.textContent = "There is no file or folder open.";
        //     return;
        // }
        // if(!p.folderHandle){
        //     this.tabMain.textContent = "This panel can only view folders, not files.";
        //     return;
        // }

        let h = this.cur;
        if(!h){
            this.tabMain.textContent = "No folder loaded.";
            return;
        }
        
        let cont = document.createElement("div");
        cont.className = "tab-cont";
        this.tabMain.textContent = "";
        this.tabMain.appendChild(cont);

        let curOps = new MenuComponent(document.createElement("div"));
        curOps.body.classList.add("d-cur-ops");
        cont.appendChild(curOps.body);
        curOps.createText(h.name,"l-cur-folder");
        curOps.createButtonList([
            {
                label:"New Folder",
                onclick:async (e,b)=>{
                    let newName = prompt("New folder name: ");
                    if(!newName) return;
                    await h.getDirectoryHandle(newName,{create:true});
                    this.update();
                }
            }
        ]);

        // load folder view
        let loadFolder = async (cont:HTMLElement,folder:FileSystemDirectoryHandle,path:string)=>{
            for await(const [name,item] of folder.entries()){
                let d = document.createElement("div");
                d.className = "folder-item";
                cont.appendChild(d);
                let thisPath = path+"/"+name;

                if(item.kind == "directory"){
                    d.innerHTML = `
                        <div class="head">
                            <div class="icon-cont folder-open"><img class="icon" src="${allIcons.right}"></div>
                            <div class="l-file-name">${name}</div>
                        </div>
                        <div class="folder-list"></div>
                    `;
                    let folderList = d.querySelector(".folder-list") as HTMLElement;
                    (d.children[0] as HTMLElement).addEventListener("mousedown",e=>{
                        if(e.button == 2){
                            openDropdown("d",[
                                {
                                    label:"New folder",
                                    onclick:async (d,cont)=>{
                                        let newName = prompt("New folder name: ");
                                        if(!newName) return;
                                        await item.getDirectoryHandle(newName,{create:true});
                                        this.update();
                                    }
                                },
                                {
                                    label:"Delete",
                                    onclick:async (d,cont)=>{
                                        if(!confirm("Are you sure you want to delete \""+name+"\" and everything inside it?")) return;
                                        d.classList.add("deleting");
                                        await folder.removeEntry(name,{recursive:true});
                                        // d.remove();
                                        this.update();
                                    }
                                }
                            ],{useCursorLoc:true});
                            return;
                        }
                        d.classList.toggle("open");
                        if(!d.classList.contains("open")){
                            // clear list
                            this.wereOpen.delete(thisPath);
                            folderList.textContent = "";
                        }
                        else{
                            // get list
                            this.wereOpen.add(thisPath);
                            loadFolder(folderList,item,thisPath);
                        }
                    });
                }
                else{
                    d.innerHTML = `
                        <div class="head">
                            <div class="icon-cont folder-open"></div>
                            <div class="l-file-name">${name}</div>
                            <div class="f-ops">
                                <div class="l-open icon-cont"><img class="icon" src="${allIcons.pixel}"></div>
                            </div>
                        </div>
                        <div></div>
                    `;
                    let elm = d.children[0] as HTMLElement;
                    elm.classList.add("fItem_"+this.sanitizeLoc(thisPath));
                    elm.addEventListener("mousedown",async e=>{
                        if(e.button == 2){
                            if(!this.sel.includes(thisPath)){
                                this.clickSelect(thisPath);
                            }
                            
                            openDropdown("d",[
                                {
                                    label:"Open",
                                    onclick:async (d,cont)=>{
                                        let ff = await item.getFile();
                                        if(!ff) return;
                                        await _openFile(ff,item);
                                    }
                                },
                                {
                                    label:"Delete",
                                    onclick:async (d,cont)=>{
                                        if(!confirm("Are you sure you want to delete \""+name+"\". It will be permanently deleted!")) return;
                                        d.classList.add("deleting");
                                        await folder.removeEntry(name);
                                        // d.remove();
                                        this.update();
                                    }
                                }
                            ],{useCursorLoc:true});
                            
                            return;
                        }

                        this.clickSelect(thisPath);

                        // if(e.button != 0) return;

                        // let ff = await item.getFile();
                        // if(!ff) return;
                        // await _openFile(ff,item);
                    });
                    elm.addEventListener("dblclick",async e=>{
                        let ff = await item.getFile();
                        if(!ff) return;
                        await _openFile(ff,item);
                    });
                }

                // post item
                if(this.newItems.has(thisPath)){
                    d.classList.add("new-item");
                    setTimeout(()=>{
                        d.classList.remove("new-item");
                        this.newItems.delete(thisPath);
                    },500);
                }
                else if(this.wereOpen.has(thisPath)){
                    d.children[0].dispatchEvent(new MouseEvent("mousedown",{button:0}));
                }

                if(selProject.handle) selProject.handle.isSameEntry(item).then(v=>{
                    if(!v) return;
                    d.classList.add("active");
                });

                // 
                this.body.scrollTop = this.scrollTop;
            }
        };
        await loadFolder(cont,h,"");

        this.body.scrollTop = this.scrollTop;
    }
}

// temp for now
let cw_drag = {
    ref:null as MixerPanel,
};
document.addEventListener("mousemove",e=>{
    if(mouseDown[0]){
        if(cw_drag.ref){
            cw_drag.ref.setCWPosClient(e.clientX,e.clientY,true);
        }
    }
});
document.addEventListener("mouseup",e=>{
    cw_drag.ref = null;
});