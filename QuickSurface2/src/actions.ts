// drag and drop file to import/open
document.addEventListener('dragover', function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
});
document.addEventListener("drop",async e=>{
    e.stopPropagation();
    e.preventDefault();
    if(!e.dataTransfer.effectAllowed){
        console.log("Err: data transfer wasn't allowed");
        return;
    }
    
    let allowedTypes = ["png","jpg","jpeg","bmp","gif"];
    for(const f of e.dataTransfer.files){
        let typeList = (f.type.includes("/") ? f.type.split("/") : ["any",f.type]);
        let superType = typeList[0];
        let type = typeList[1];

        if(superType != "image"){
            alert(f.name+": "+"this file is not an image");
            continue;
        }
        if(!allowedTypes.includes(type.toLowerCase())){
            alert(f.name+": "+"Unsupported file type: "+type+" ! Supported types are: "+allowedTypes.join(", "));
            continue;
        }
        let img = document.createElement("img");
        let url = URL.createObjectURL(f);
        let xml = new XMLHttpRequest();
        xml.open("GET",url,true);
        xml.responseType = "arraybuffer";
        xml.onload = function(e){
            let blob = new Blob([this.response]);
            img.src = URL.createObjectURL(blob);
        };
        xml.onprogress = function(e){
            if(e.total == 0) return;
            console.log((e.loaded/e.total*100).toFixed(1));
        };
        img.onload = function(){
            console.log("finished",img.width,img.height);
            let newProject = new Project(img.width,img.height,f.name);
            newProject.hist.startBare(newProject.hist.curHA());
            newProject.add();
            let l = newProject.getFirstCurLayer();
            l.initCtxIfNeeded();
            l.ctx.drawImage(img,0,0);
            l.applyChange(true);
            newProject.hist.endBare();
            newProject.initialize();
            newProject.loadFrame();
                
            URL.revokeObjectURL(url);
        };
        xml.send();
    }
});

async function copyFromLayer(l?:Layer){
    if(!selProject) return;
    l = selProject.getFirstCurLayer();
    if(!l) return;
    if(l.isEmpty()) return;
    
    let items:ClipboardItem[] = [];

    items.push(new ClipboardItem({
        "image/png":await getCanBlob(l.ctx)
    }));

    await navigator.clipboard.write(items);
}
async function cutFromLayer(l?:Layer){
    if(!selProject) return;
    if(!selProject.canEdit()) return;
    l = selProject.getFirstCurLayer();
    if(!l) return;
    if(l.isEmpty()) return;
    
    let items:ClipboardItem[] = [];

    items.push(new ClipboardItem({
        "image/png":await getCanBlob(l.ctx)
    }));

    await navigator.clipboard.write(items);

    let amt = 0;
    selProject.loopSel(l=>{
        if(!l.canEdit()) return;
        if(l.isEmpty()) return;
        if(l.clear()) amt++;
    });
    selProject.hist.add(new HA_ClearLayer(true,amt));
}
/**
 * heavily WIP and not finished
 */
async function cutFromLayer2(){    
    if(!selProject) return;
    if(!selProject.canEdit()) return;
    let p = selProject;
    
    let layers = p.getCurLayers();
    
    let items:ClipboardItem[] = [];

    // items.push(new ClipboardItem({
    //     "image/png":await getCanBlob(l.ctx)
    // }));

    await navigator.clipboard.write(items);

    let amt = 0;
    selProject.loopSel(l=>{
        if(!l.canEdit()) return;
        if(l.isEmpty()) return;
        if(l.clear()) amt++;
    });
    selProject.hist.add(new HA_ClearLayer(true,amt));
}
async function pasteToLayer(l?:Layer,intoNewProject=false){
    if(!selProject) return;
    if(!selProject.canEdit()) return;
    if(!l) l = selProject.getFirstCurLayer();
    if(!l) return;

    let items = await navigator.clipboard.read();
    let i = 0;
    function commit(img:HTMLImageElement){
        if(intoNewProject){
            let p = createNewProject(img.width,img.height,"Pasted image",1);
            p.simpleDrawImage(img);
            return;
        }
        selProject.simpleDrawImage(img);
    }
    for(const item of items){
        // let type = item.types[i];
        if(!item.types.length) return;
        let imgType = item.types.find(v=>v.startsWith("image/"));
        if(imgType){
            let blob = await item.getType(imgType);
            let url = URL.createObjectURL(blob);
            let img = document.createElement("img");
            img.src = url;
            await new Promise<void>(resolve=>{
                img.onload = function(){
                    resolve();
                };
            });
            commit(img);
        }
        else if(item.types.includes("text/plain")){
            let text = await (await item.getType("text/plain")).text();
            console.log("PASTE TEXT: ",text);
            if(text.startsWith("<img")){
                console.log("HAS \\n",text.includes("\n"));
                let last = text.lastIndexOf('"');
                let url = text.substring(text.indexOf('"')+1,last).replaceAll("amp;","");
                let img = await loadImgFromUrl(url);
                // if(img) selProject.simpleDrawImage(img);
                if(!img) return;
                commit(img);
            }
            else if(text.startsWith("http")){
                if(text.includes(".png")){
                    let img = await loadImgFromUrl(text);
                    if(!img) return;
                    commit(img);
                }
            }
        }
        i++;
    }
}

// Projects

let __tmpProject:Project;
function createNewProject(w:number,h:number,filename:string,frames=1,fps=8){
    let p = new Project(w,h,filename);
    __tmpProject = p;
    p.hist.startBare(p.hist.curHA());
    p._addFrames(frames-1);
    p.setFPS(fps);

    p.add(true);
    p.setSaved(true);
    p.goto(0,0);
    p.hist.endBare();

    p.initialize();
    p.loadFrame();
    // p.updateCur();
    __tmpProject = null;
    selectProject(p);
    return p;
}

// Color Palette
class ColorPaletteSave{
    constructor(lastCols:number[],cols:number[],order:number[]){
        this.lastCols = lastCols;
        this.cols = cols;
        this.order = order;
    }
    lastCols:number[];
    cols:number[];
    order:number[];
}
class ColorPalette{
    constructor(map:Map<number,number>){
        this.map = map;
        this.cols = [...map.keys()];
        for(let i = 0; i < this.cols.length; i++){
            this.cols[i] &= 0xffffffff;
        }
        this.lastCols = [...this.cols];
        this.map2 = new Map();
        for(let i = 0; i < this.cols.length; i++){
            this.map2.set(this.cols[i],i);
        }
    }
    order:Map<number,number>; // order to consider

    static from(list:any[]){
        let m = new Map<number,number>();
        for(let i = 0; i < list.length; i++){
            let c = list[i];
            let v = 0;
            if(typeof c == "string") v = map8x4To32([...convert(c)]);
            else if(typeof c == "object") v = map8x4To32(c);
            else v = c;
            m.set(v,i);
        }
        let cp = new ColorPalette(m);
        return cp;
    }
    clear(){
        this.cols = [];
        this.map2 = new Map();
    }
    copyFrom(cp:ColorPalette){
        this.map2 = new Map(cp.map2);
        this.lastCols = [...cp.lastCols];
        this.cols = [...cp.cols];
    }
    save(){
        let order = [];
        if(this.order){
            for(const [k,v] of this.order){
                order[k] = v;
            }
        }
        return new ColorPaletteSave(this.lastCols,this.cols,order);
    }
    restore(s:ColorPaletteSave){
        this.lastCols = [...s.lastCols];
        this.cols = [...s.cols];
        this.map2 = new Map();
        for(let i = 0; i < this.lastCols.length; i++){
            let c = this.lastCols[i];
            this.map2.set(c,i);
        }
        if(s.order){
            this.order = new Map();
            for(let i = 0; i < s.order.length; i++){
                this.order.set(i,s.order[i]);
            }
        }
        else this.order = null;
    }
    serialize(){
        let save = this.save();
        let s = `l:${save.lastCols.toString()}^c:${save.cols.toString()}^o:${save.order.toString()}`;
        return s;
    }
    deserialize(s:string){
        if(!s) return;
        if(s.length == 0) return;
        let vals = s.split("^");
        let data = {} as any;
        for(const d of vals){
            let [k,v] = d.split(":");
            data[k] = v;
        }
        let save = new ColorPaletteSave(
            data.l?data.l.split(",").map((v:string)=>parseInt(v)):[],
            data.c?data.c.split(",").map((v:string)=>parseInt(v)):[],
            data.o?data.o.split(",").map((v:string)=>parseInt(v)):null
        );
        this.restore(save);
    }

    map:Map<number,number>;
    // order:number[];
    cols:number[];
    lastCols:number[];
    map2:Map<number,number>;
    invert(){
        for(const [k,v] of this.map){
            let inv = 0xffffffff - v;
            this.map.set(k,inv);
            // let fix = (inv | (inv << 8));
            // this.map.set(k,fix);
        }
    }
    half(){
        for(const [k,v] of this.map){
            this.map.set(k,Math.ceil(v/2));
        }
    }
    set(i:number,v:number){
        this.cols[i] = v & 0xffffffff; // <-- this will convert the very large numbers to the negative variants for comparing
    }
    setRGBA(i:number,col:number[]){
        let v = 0;
        if(col[3] == 0) v = 0;
        else v = new Uint32Array(new Uint8Array(col).buffer)[0];
        this.set(i,v);
    }
    drawTo(ctx:CanvasRenderingContext2D){
        let w = ctx.canvas.width;
        let h = ctx.canvas.height;
        let data = ctx.getImageData(0,0,w,h).data;
        let data32 = new Uint32Array(data.buffer);
        for(let i = 0; i < data32.length; i++){
            let v = this.map.get(data32[i]);
            if(v != null) data32[i] = v;
        }
        data = new Uint8ClampedArray(data32.buffer);
        ctx.putImageData(new ImageData(data,w,h),0,0);
    }
    drawTo2(ctx:CanvasRenderingContext2D,noReassign=false){
        // let start = performance.now();
        let w = ctx.canvas.width;
        let h = ctx.canvas.height;
        let data = ctx.getImageData(0,0,w,h).data;
        let data32 = new Uint32Array(data.buffer);
        for(let i = 0; i < data32.length; i++){
            let cI = this.map2.get(data32[i] & 0xffffffff); // color pal ind
            let v = this.cols[cI];
            if(v != null){
                data32[i] = v;
            }
        }
        data = new Uint8ClampedArray(data32.buffer);
        ctx.putImageData(new ImageData(data,w,h),0,0);
        
        if(!noReassign) this.reassign();
        // console.log("TIME: ",performance.now()-start);
    }
    reassign(){
        this.lastCols = [...this.cols];
        let m = new Map();
        for(let i = 0; i < this.cols.length; i++){
            m.set(this.cols[i],i);
        }
        this.map2 = m;
    }
    add(col:number){
        col &= 0xffffffff;
        if(this.cols.includes(col)) return;
        let i = this.cols.length;
        this.set(i,col);
        // this.map2.set(col,i);
    }
    addStr(col:string){
        let c = map8x4To32(convert(col));
        this.add(c);
    }
    has(col:number){
        return this.map2.has(col);
    }
    remove(col:number){
        let ind = this.cols.indexOf(col);
        if(ind == -1) return;
        this.cols.splice(ind,1);
    }
    removeStr(col:string){
        let c = map8x4To32(convert(col));
        this.remove(c);
    }
}
function computeColorPalette_ctx(ctx:CanvasRenderingContext2D){
    if(!ctx) return;
    let data8 = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height).data;

    let data = new Uint32Array(data8.buffer);
    let found = new Map<number,number>();
    let amt = 0;
    let maxPaletteLen = 32;
    for(let i = 0; i < data.length; i++){
        let c = data[i];
        if(((c >> 24) & 0xff) != 255) continue; // <-- could be performance loss but shouldn't be too bad with bitwise ~ but this is to look for only solid colors
        if(!found.has(c)){
            found.set(c,c);
            amt++;
            if(amt >= maxPaletteLen) break;
        }
    }

    // return [...found].map(v=>map32To8x4(v[0])); // Map versus Array for found was 200ms versus 15s
    return new ColorPalette(found);
}
function computeColorPalette_addTo(ctx:CanvasRenderingContext2D,cp:ColorPalette){
    if(!ctx) return;
    let data8 = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height).data;

    let data = new Uint32Array(data8.buffer);
    let found = cp.map2;
    let amt = 0;
    let maxPaletteLen = 32;
    for(let i = 0; i < data.length; i++){
        let c = data[i];
        if(((c >> 24) & 0xff) != 255) continue;
        if(!found.has(c)){
            // found.set(c,c);
            found.set(c,0); // <-- this is ok being 0 here bc it'll get cleaned up in the ColorPalette constructor later
            amt++;
            if(amt >= maxPaletteLen) break;
        }
    }
}
function computeColorPalette(p:Project){
    let cp = new ColorPalette(new Map());
    if(p.cpChangesAll) for(const f of p.frames){
        for(const [k,l] of f.layers){
            // if(l.isEmpty()) continue;
            if(l.isEmpty()) continue;
            computeColorPalette_addTo(l.ctx,cp);
        }
    }
    else{
        let first = p.getFirstCurLayer();
        if(!first.isEmpty()) computeColorPalette_addTo(first.ctx,cp);
    }
    // cp.cols = [...cp.map2.keys()];
    // cp.lastCols = [...cp.cols];
    // return cp;
    return new ColorPalette(cp.map2);
}
function map32To8x4(n:number){
    let a = (n >> 24) & 0xff;
    let b = (n >> 16) & 0xff;
    let g = (n >> 8) & 0xff;
    let r = n & 0xff;
    return [r,g,b,a];
}
function map8x4To32(c:number[]|Uint8ClampedArray){
    let n = 0;
    n = n << 8;
    n = n | c[3];
    n = n << 8;
    n = n | c[2];
    n = n << 8;
    n = n | c[1];
    n = n << 8;
    n = n | c[0];
    return n;
}

let sampleCP = {
    testing:[
        // https://colorkit.co/palette/f1ddbf-525e75-78938a-92ba92/
        ColorPalette.from([
            "#f1ddbf","#525e75","#78938a","#92ba92"
        ]),
        // https://colorkit.co/palette/d9d0b4-7d6b57-879e82-666b5e/
        ColorPalette.from([
            "#d9d0b4","#7d6b57","#879e82","#666b5e"
        ]),
        // https://colorkit.co/palette/e8eef1-43b0f1-057dcd-1e3d58/
        ColorPalette.from([
            "#e8eef1","#43b0f1","#057dcd","#1e3d58"
        ]),
        // https://colorkit.co/palette/251d3a-2a2550-e04d01-ff7700/
        ColorPalette.from([
            "#251d3a","#2a2550","#e04d01","#ff7700"
        ]),
        // https://colorkit.co/palette/ef7c8e-fae8e0-b6e2d3-d8a7b1/
        ColorPalette.from([
            "#ef7c8e","#fae8e0","#b6e2d3","#d8a7b1"
        ]),
        // https://colorkit.co/palette/809bce-95b8d1-b8e0d4-d6eadf/
        ColorPalette.from([
            "#809bce","#95b8d1","#b8e0d4","#d6eadf"
        ]),
    ] as ColorPalette[]
};