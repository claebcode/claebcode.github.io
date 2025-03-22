// global refs
const centerArea = document.querySelector(".center-area") as HTMLElement;
const fileList = document.querySelector(".file-list");
const legacyBanner = document.querySelector(".legacy-banner");
function openLegacyBanner(){
    legacyBanner.innerHTML = `
        <button onclick="closeLegacyBanner()">Close</button>
    `;
}
function closeLegacyBanner(){
    legacyBanner.innerHTML = "";
}

let settings = {
    maxFileNameLength:42,
    WRF:false,

    maxZoom:1,

    useCanvasStoring:true, // use canvas instead of data buffer for hist full states
    useSaveCaching:false,
    useTimelineChunkView:true,
    dontShowTLChunkOverflows:false,
    dontDrawUnchanged:false, // doesn't do anything, not sure how to implement this
    disableForwardHistory:true, // setting this to true means when you add something new to the history it'll delete all following resumable history actions

    // be careful with these settings, they can and probably will cause data loss or a broken file / editor state
    debug_skipSaveLayerImageData:false,
    debug_dontSaveToDisk:false,
    debug_noTimelineUpdates:false,

    // view
    scaleMatchGrid:true,
    solidCursor:false, // false
    enableCursor:true
};

// File List
let files:Project[] = [];
let selProject:Project;
function selectProject(p:Project){
    if(!p){
        selProject = null;
        return;
    }
    
    if(selProject){
        selProject.ovSL = selProject.overlay.scrollLeft;
        selProject.ovST = selProject.overlay.scrollTop;
    }
    
    centerArea.textContent = "";
    for(const c of fileList.children){
        c.classList.remove("sel");
    }
    p.fileItem.classList.add("sel");
    centerArea.appendChild(p.cont.parentElement);
    selProject = p;
    setOverCanvas(false);
    p.overlay.scrollLeft = p.ovSL;
    p.overlay.scrollTop = p.ovST;

    p.loadFrame();

    // timelinePanel.load();
    // updatePanel("timeline",p=>p.load());
    // historyPanel.load();
    loadAllPanels();
    if(curTool) selectTool(curTool); // update it
}
function closeProject(p:Project){
    let i = files.indexOf(p);
    if(i == -1){
        console.warn("Err: couldn't find project");
        return;
    }
    if(!p.canClose()){
        if(!confirm("This project isn't saved, do you want to close without saving?")) return;
        // if(!confirm("can't close this project, try saving")) return;
    }
    files.splice(i,1);
    i--;
    centerArea.textContent = "";
    fileList.removeChild(p.fileItem);
    if(i < 0) i = 0;
    selectProject(files[i]);

    // timelinePanel.load();
    // updatePanel("timeline",p=>p.load());
    loadAllPanels();
}

// keyboard input
let smx = 0;
let smy = 0;
let emx = 0;
let emy = 0;
let mx = 0;
let my = 0;
let lx = 0;
let ly = 0;
let llx = 0;
let lly = 0;
let csmx = 0; // client smx
let csmy = 0;
let cmx = 0;
let cmy = 0;
let clx = 0;
let cly = 0;
let flmx = 0; // floored mx
let flmy = 0; // floored my
let isNewPixelLoc = false;

let keys = {} as Record<string,boolean>;
let altKey = false;
let shiftKey = false;
let ctrlKey = false;
let metaKey = false;
let mouseDown = [false,false,false];
let lMouseDown = [false,false,false];
document.addEventListener("keydown",e=>{
    keys[e.key.toLowerCase()] = true;
    runKeyModifiers(e);
});
document.addEventListener("keyup",e=>{
    keys[e.key.toLowerCase()] = false;
    runKeyModifiers(e);
});
function runKeyModifiers(e:KeyboardEvent|UniversalMouseEvent){
    altKey = e.altKey;
    shiftKey = e.shiftKey;
    ctrlKey = e.ctrlKey;
    metaKey = e.metaKey;
}
// mouse input
function calcMouse(e:UniversalMouseEvent){
    let clientX = e.clientX;
    let clientY = e.clientY;

    if(e.touches?.length == 2){
        let t1 = e.touches[0];
        let t2 = e.touches[1];

        let cx = (t1.clientX+t2.clientX)/2;
        let cy = (t1.clientY+t2.clientY)/2;

        clientX = cx;
        clientY = cy;
    }

    // if(!e) return {x:0,y:0,cx:0,cy:0};
    if(!selProject) return {x:0,y:0,cx:clientX,cy:clientY};
    // let r = selProject.cont.getBoundingClientRect();
    let r = getRect(selProject.cont);
    let ar = [(clientX-r.x)/r.width*selProject.w,(clientY-r.y)/r.height*selProject.h];
    let a = selProject.rot;
    let out = rot2D(ar[0],ar[1],selProject.w/2,selProject.h/2,-a);
    if(out[0] >= 0 && out[0] < selProject.w && out[1] >= 0 && out[1] < selProject.h){
        if(curTool) if(curTool.inUse) wasOverCanvas = true;
    }
    return {
        x:out[0],
        y:out[1],
        cx:clientX,
        cy:clientY
    };
    // return ar;
}

function runCalcMouseStart(e:UniversalMouseEvent){
    let m = calcMouse(e);
    smx = m.x;
    smy = m.y;
    csmx = m.cx;
    csmy = m.cy;
}

onDown(e=>{
    let b = e.button;
    mouseDown[b] = true;
    lMouseDown[b] = true;

    // startTCan(curColor);

    let m = calcMouse(e);
    smx = m.x;
    smy = m.y;
    csmx = m.cx;
    csmy = m.cy;

    if(b == 1){
        e.preventDefault();
    }   
});
onUp(e=>{
    let b = e.button;
    mouseDown[b] = false;
    isDrawing = false;
    requestAnimationFrame(()=>{
        lMouseDown[b] = false;
    });
    
    let m = calcMouse(e);
    emx = m.x;
    emy = m.y;

    // resetEffected();
    // endTCan();
    // endDCan();
});

function endDCan(softMode=false,replace=false,forceMode?:DrawMode){
    let p = selProject;
    if(!p) return false;
    // let mode = p.getFinalDrawMode();
    let mode = p.getBlendMode();
    // if(mode == DrawMode.draw) return p.getActiveDrawModePost(); // ???
    if(forceMode != null) mode = forceMode; // replace still takes priority over this
    if(replace) mode = DrawMode.replace_all;
    if(false){ // <-- this is extremely expensive for high resolutions, probably need to add a way to just cleanup empty layers whenever
        console.warn("END DCAN, checking for empty layers...");
        let mainBuf = p.main.getImageData(0,0,p.w,p.h).data;
        let cnt = 0;
        for(let i = 0; i < mainBuf.length; i += 4){
            if(mainBuf[i+3] == 0) cnt++;
            else break;
        }
        if(cnt == Math.floor(mainBuf.length/4)){
            console.warn("CANCELED endDCan");
            return false;
        }
    }
    selProject.loopSel(l=>{
        if(l.initCtxIfNeeded()) if(p.curFrame == l.frame) p.loadFrame();
        // if(p.curFrame == l.frame) p.loadFrame(); // <-- is this needed?
        let ctx = l.ctx;
        ctx.imageSmoothingEnabled = false; // <-- added in just to make sure
        if(l.spannedBy) ctx = l.spannedBy.ctx;
        if(!ctx) return;
        // console.log("DRAW: ",p.drawMode,p.tmpDrawMode);
        let runGeneral = (op:GlobalCompositeOperation)=>{
            ctx.globalCompositeOperation = op;
            ctx.drawImage(l.project.main.canvas,0,0);
            ctx.globalCompositeOperation = "source-over";
        };
        switch(mode){
            case DrawMode.draw:
                ctx.drawImage(l.project.main.canvas,0,0);
                break;
            case DrawMode.erase:
                // full erase
                ctx.globalCompositeOperation = "destination-out";
                ctx.drawImage(l.project.main.canvas,0,0);
                ctx.globalCompositeOperation = "source-over";

                // NEW method that works for regular full erase but is really buggy with partial erase
                // let tmp = copyCan(ctx.canvas);
                // let tmpc = tmp.getContext("2d");
                // tmpc.globalCompositeOperation = "destination-in";
                // tmpc.drawImage(l.project.main.canvas,0,0);
                
                // ctx.globalCompositeOperation = "xor";
                // ctx.drawImage(tmp,0,0);
                // ctx.globalCompositeOperation = "source-over";
                
                break;
            case DrawMode.select:
                l.project.sel.drawImage(l.project.main.canvas,0,0);
                break;
            case DrawMode.erase_select:
                l.project.sel.globalCompositeOperation = "destination-out";
                l.project.sel.drawImage(l.project.main.canvas,0,0);
                l.project.sel.globalCompositeOperation = "source-over";
                break;
            case DrawMode.replace_all:
                ctx.clearRect(0,0,p.w,p.h);
                ctx.drawImage(l.project.main.canvas,0,0);
                break;
            case DrawMode.multiply:
                ctx.globalCompositeOperation = "multiply";
                ctx.drawImage(l.project.main.canvas,0,0);
                ctx.globalCompositeOperation = "source-over";
                break;
            case DrawMode.replace:
                let ga = ctx.globalAlpha;
                ctx.globalAlpha = 1;
                let fs = ctx.fillStyle;
                ctx.fillStyle = "black";
                
                let tcan = copyCan(l.project.main.canvas);
                let tctx = tcan.getContext("2d");
                tctx.globalCompositeOperation = "source-in";
                tctx.fillRect(0,0,tcan.width,tcan.height);

                ctx.globalCompositeOperation = "destination-out";
                ctx.drawImage(tcan,0,0);
                ctx.globalCompositeOperation = "source-over";

                ctx.globalAlpha = gAlpha;
                ctx.fillStyle = fs;
                ctx.drawImage(l.project.main.canvas,0,0);
                ctx.globalAlpha = ga;
                break;
            case DrawMode.add: // lighter
                runGeneral("lighter");
                break;
            case DrawMode.xor:
                runGeneral("xor");
                break;
            case DrawMode.screen:
                runGeneral("screen");
                break;
            case DrawMode.overlay:
                runGeneral("overlay");
                break;
            case DrawMode.darken:
                runGeneral("darken");
                break;
            case DrawMode.lighten:
                runGeneral("lighten");
                break;
            case DrawMode.color_dodge:
                runGeneral("color-dodge");
                break;
            case DrawMode.color_burn:
                runGeneral("color-burn");
                break;
            case DrawMode.hard_light:
                runGeneral("hard-light");
                break;
            case DrawMode.soft_light:
                runGeneral("soft-light");
                break;
            case DrawMode.difference:
                runGeneral("difference");
                break;
            case DrawMode.exclusion:
                runGeneral("exclusion");
                break;

            // backend
            case DrawMode.sourceIn:
                runGeneral("source-in");
                break;
        }
    });
    // if(!softMode){
    //     if(p._tmpDrawMode != DrawMode.none) p._tmpDrawMode = DrawMode.none;
    //     selProject.main.clearRect(0,0,selProject.main.canvas.width,selProject.main.canvas.height);
    // }
    if(mode == DrawMode.select || mode == DrawMode.erase_select){
        updateSelection();
    }
    return true;
}
function postEndDCan(){
    let p = selProject;
    if(!p) return;
    // if(p._tmpDrawMode != DrawMode.none) p._tmpDrawMode = DrawMode.none;
    p.main.canvas.width = p.w;
    p.main.imageSmoothingEnabled = false;
    // p.main.clearRect(0,0,p.main.canvas.width,p.main.canvas.height);

    // vvv - not sure if this should go here or at the end of endDCan
    // setTimeout(()=>{
    //     p.resetTmpBlendMode();
    // },10);

    if(p.isUsingEnabledChannels()){
        p.loadFrame();
    }

    // update TL preview
    // p.loadTLPreview(); // <-- shouldn't need it here because I have it in Hist.add which should cover the majority of cases, if not, it would only be a visual glitch that's easily fixable
}
function endSelCan(){ // not sure if this is needed?
    if(!selProject) return;
    
    selProject.applyEffected(0,selProject.sel.canvas.width,0,selProject.sel.canvas.height);
    correctCtx(selProject.sel);

    // update ovSel
    // ovSelX.drawImage(selCan,0,0);
    // ovSelX.globalCompositeOperation = "source-out";
    // ovSelX.fillStyle = "rgba(0,0,0,0.5)";
    // ovSelX.fillRect(0,0,canMain.width,canMain.height);
    // ovSelX.globalCompositeOperation = "source-over";
}

const selCol = [100,100,255,1];
const selColStr = "rgba(100,100,255,1)";
const eraseCol = [255,100,150,1];
const eraseColStr = "rgba(255,100,150,1)";
function updateSelection(noIsSelCalc=false){
    let p = selProject;
    if(!p) return;
    p.selOv.canvas.width = p.w;
    p.selOv.canvas.height = p.h;
    p.selOv.drawImage(p.sel.canvas,0,0);
    // p.selOv.fillStyle = selColStr; // <-- not sure if these are needed
    // p.selOv.globalCompositeOperation = "destination-in";
    // p.selOv.fill();
    // p.selOv.globalCompositeOperation = "source-over";
    if(!noIsSelCalc){
        let data1 = p.sel.getImageData(0,0,p.w,p.h).data;
        p.isSel = data1.includes(255);
    }

    // vvv - this is the fancy slow to compute selection graphics
    return;
    
    let data = p.sel.getImageData(0,0,p.w,p.h).data;
    let cnt = 0;
    for(let i = 0; i < data.length; i += 4){
        if(data[i+3] == 0) cnt++;
        if(i%2 == 1){
            data[i+3] = 1;
            continue;
        }
        
        if(data[i+3] == 0) continue;

        // if(data[i+3-4] != 0 && data[i+3-p.w*4] != 0 && data[i+3+p.w*4] != 0 && data[i+3+4] != 0){
        if(data[i+3-4] != 0 && data[i+3-p.w*4] != 0 && data[i+3+p.w*4] != 0 && data[i+3+4] != 0
            // && data[i+3-8] != 0 && data[i+3-p.w*8] != 0 && data[i+3+p.w*8] != 0 && data[i+3+8] != 0
            // && data[i+3-4 - p.w*4] != 0 && data[i+3-p.w*4+4] != 0 && data[i+3+p.w*4-4] != 0 && data[i+3+4+p.w*4] != 0
        ){
            data[i+3] = 100;
            // continue;
        }
        
        
        data[i] = selCol[0];
        data[i+1] = selCol[1];
        data[i+2] = selCol[2];
    }
    p.selOv.putImageData(new ImageData(data,p.w,p.h),0,0);

    p.isSel = (cnt != Math.floor(data.length/4));
    // p.selOv.clearRect(0,0,p.w,p.h);
    // p.selOv.drawImage(p.sel.canvas,0,0);
}
function updateSelection_good1(){
    let p = selProject;
    if(!p) return;
    let data = p.sel.getImageData(0,0,p.w,p.h).data;
    let selCol = [100,100,255];
    for(let i = 0; i < data.length; i += 4){
        if(data[i+3] == 0) continue;

        if(data[i+3-4] != 0 && data[i+3-p.w*4] != 0 && data[i+3+p.w*4] != 0 && data[i+3+4] != 0){
            data[i+3] = 1;
            continue;
        }
        
        data[i] = selCol[0];
        data[i+1] = selCol[1];
        data[i+2] = selCol[2];
    }
    p.selOv.putImageData(new ImageData(data,p.w,p.h),0,0);
    // p.selOv.clearRect(0,0,p.w,p.h);
    // p.selOv.drawImage(p.sel.canvas,0,0);
}
function applySelectionPost(){ // selection masking
    if(selProject){
        if(!selProject.isSel) return;
        let main = selProject.main;
        let curColor = main.fillStyle;
        let curAlpha = main.globalAlpha;
        
        // apply
        main.globalAlpha = 1;
        main.globalCompositeOperation = "destination-in";
        main.fillStyle = "black";
        main.drawImage(selProject.sel.canvas,0,0);
        main.globalCompositeOperation = "source-over";

        // revert
        main.fillStyle = curColor;
        main.strokeStyle = curColor;
        main.globalAlpha = curAlpha;

        // updateSelection();
    }
}

let workers:Worker[] = [];
let workersHasDone = 0;
let workerAmt = navigator.hardwareConcurrency;
let _wStartTime = 0;
let _workerTmpData:Uint8ClampedArray;
let _workerTmpCtx:CanvasRenderingContext2D;
let _workerTmp = {} as any;

let workerProm:Promise<void>;
let workerRes:()=>void;

function initWorkers(){
    for(let i = 0; i < workerAmt; i++){
        let w = new Worker("out/worker.js");
        workers.push(w);
        w.addEventListener("message",e=>{
            let d = e.data;
            // console.log("i: ",d.i);
            workersHasDone++;

            // if(d.t == 0){
            //     if(_workerTmpData) _workerTmpData.set(d.data,d.start);
            //     // console.log("PUT DATA ACK: ",d.start,d.data);
            // }
            if(d.t == 0){
                // console.log("OUT: ",d.start);
                for(const j of d.none){
                    // _workerTmpData[j] = 0;
                    // _workerTmpData[j+1] = 255;
                    // _workerTmpData[j+2] = 0;
                    _workerTmpData[j+3] = 0;
                }
                for(const j of d.full){
                    _workerTmpData[j+3] = 255;
                    // _workerTmpData[j] = 255;
                    // _workerTmpData[j+1] = 0;
                    // _workerTmpData[j+2] = 0;
                    // _workerTmpData[j+3] = 255;
                }
            }

            if(workersHasDone >= workerAmt){
                if(d.t == 0){
                    if(_workerTmpCtx){
                        // console.log("FIN put data back",_workerTmp,_workerTmpData.length);
                        _workerTmpCtx.putImageData(new ImageData(_workerTmpData,_workerTmp.w,_workerTmp.h),_workerTmp.x,_workerTmp.y);
                        selProject.resetEffected();
                    }
                    else console.warn("warn: maybe ended too soon?");
                }
                endWorkers();
            }
        });
    }
}
async function startWorkers_correct(ctx:CanvasRenderingContext2D){
    if(!selProject) return;
    if(workerProm) await workerProm;

    let _mL = selProject._mL;
    let _mR = selProject._mR;
    let _mT = selProject._mT;
    let _mB = selProject._mB;
    
    if(_mL > _mR) return;
    if(_mT > _mB) return;

    let x = _mL;
    let y = _mT;
    let w = _mR-_mL;
    let h = _mB-_mT;
    if(w == 0) return;
    if(h == 0) return;
    let data = ctx.getImageData(x,y,w,h).data;
    let a2 = ctx.globalAlpha;
    a2 = Math.round(a2*255);
    let ha = Math.floor(a2*0.5);

    // let data = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height).data;
    _workerTmpData = data;
    _workerTmpCtx = ctx;
    _workerTmp = {x,y,w,h};
    
    workersHasDone = 0;

    let ind = 0;
    let size = Math.ceil(data.length/workerAmt);
    size += (4-size%4)-4;
    for(let i = 0; i < workers.length; i++){
        let w = workers[i];
        let end = Math.min(ind+size,data.length);
        w.postMessage({
            i,
            t:0, // type: aliasing correction
            start:ind,
            end:end,
            data:data.slice(ind,end),
            ha,a2,
            off:0//(4 - ind%4)
        });
        ind += size;
    }

    workerProm = new Promise<void>(resolve=>{
        workerRes = resolve;
    });
    
    _wStartTime = performance.now();
}
function endWorkers(){
    if(workerRes) workerRes();

    console.log("DONE",performance.now()-_wStartTime);
    workersHasDone = 0;
    _workerTmp = {};
    _workerTmpCtx = null;
    _workerTmpData = null;
    workerProm = null;
    workerRes = null;
}
initWorkers();

/**
 * 
 * @param ctx 
 * @param color 
 * @param tol 0-255
 * @returns 
 */
function correctCtx_general(ctx:CanvasRenderingContext2D,color?:number[],tol?:number){
    if(!selProject) return;
    let hasChanged = false;

    let x = 0;
    let y = 0;
    let w = ctx.canvas.width;
    let h = ctx.canvas.height;
    if(w == 0) return;
    if(h == 0) return;
    let data = ctx.getImageData(x,y,w,h).data;
    let a2 = ctx.globalAlpha;
    a2 = Math.round(a2*255);

    let r = color ? color[0] : 0;
    let g = color ? color[1] : 0;
    let b = color ? color[2] : 0;
    
    // let ha = Math.floor(a2*0.25); //0.5
    // let ha = Math.floor(a2*1); //0.5
    for(let i = 0; i < data.length; i += 4){
        let a = data[i+3];
        if(a == 0) continue;
        hasChanged = true;
        data[i] = r;
        data[i+1] = g;
        data[i+2] = b;

        if(tol != undefined){
            if(a >= tol) data[i+3] = a2;
            else data[i+3] = 0;
        }
        else{
            data[i+3] = a2;
        }
        // if(a < ha){
        //     data[i+3] = 0;
        //     wasOverCanvas = true;
        // }
        // else data[i+3] = a2;
    }
    ctx.putImageData(new ImageData(data,w,h),x,y);
    return hasChanged;
}
function correctCtx(ctx:CanvasRenderingContext2D,tol?:number){
    if(!selProject) return;
    let hasChanged = false;
    
    let _mL = selProject._mL;
    let _mR = selProject._mR;
    let _mT = selProject._mT;
    let _mB = selProject._mB;
    
    if(_mL > _mR) return;
    if(_mT > _mB) return;

    let x = _mL;
    let y = _mT;
    let w = _mR-_mL;
    let h = _mB-_mT;
    if(w == 0) return;
    if(h == 0) return;
    let data = ctx.getImageData(x,y,w,h).data;
    let a2 = ctx.globalAlpha;//(c.fillStyle.includes("(") ? parseFloat(c.fillStyle.replace("rgba(","").replace(")","").replaceAll(" ","").split(",")[3]) || 255 : parseFloat(c.fillStyle.replace("#","").substring(6,8),16) || 255);
    a2 = Math.round(a2*255);
    // let a2 = parseInt(col.substring(6,8),16) || 255;
    // let ha = Math.floor(a2*0.25); //0.5
    let ha = tol != undefined ? Math.floor(a2*tol) : 0; //0.5
    let cc = convert(ctx.fillStyle as string);
    for(let i = 0; i < data.length; i += 4){
        let a = data[i+3];
        if(a == 0) continue;
        hasChanged = true;
        data[i] = cc[0];
        data[i+1] = cc[1];
        data[i+2] = cc[2];
        data[i+3] = a2;
        if(tol != undefined){
            if(a < ha){
                data[i+3] = 0;
                wasOverCanvas = true;
            }
            else data[i+3] = a2;
        }

        //
        if(false){
            function change(){
                data[i+3] = 0;
                wasOverCanvas = true;
            }
            let left = false;
            let right = false;
            let up = false;
            let down = false;
            if(data[i-4+3]) left = true;
            if(data[i+4+3]) right = true;
            if(data[i-w*4+3] > 0) up = true;
            if(data[i+w*4+3] > 0) down = true;

            // if(up && right && down) change();
            // else if(up && left && down) change();
            // else if(down && right && up) change();
            // else if(down && left && up) change();
        }
    }
    ctx.putImageData(new ImageData(data,w,h),x,y);

    selProject.resetEffected();
    return hasChanged;
}
function correctCtx_singleThread(ctx:CanvasRenderingContext2D){
    if(!selProject) return;
    
    let _mL = selProject._mL;
    let _mR = selProject._mR;
    let _mT = selProject._mT;
    let _mB = selProject._mB;
    
    if(_mL > _mR) return;
    if(_mT > _mB) return;

    let x = _mL;
    let y = _mT;
    let w = _mR-_mL;
    let h = _mB-_mT;
    if(w == 0) return;
    if(h == 0) return;
    let data = ctx.getImageData(x,y,w,h).data;
    let a2 = ctx.globalAlpha;//(c.fillStyle.includes("(") ? parseFloat(c.fillStyle.replace("rgba(","").replace(")","").replaceAll(" ","").split(",")[3]) || 255 : parseFloat(c.fillStyle.replace("#","").substring(6,8),16) || 255);
    a2 = Math.round(a2*255);
    // let a2 = parseInt(col.substring(6,8),16) || 255;
    let ha = Math.floor(a2*0.5); //0.5
    for(let i = 0; i < data.length; i += 4){
        let a = data[i+3];
        if(a == 0) continue;
        if(a < ha){
            data[i+3] = 0;
            wasOverCanvas = true;
        }
        else data[i+3] = a2;

        //
        if(false){
            function change(){
                data[i+3] = 0;
                wasOverCanvas = true;
            }
            let left = false;
            let right = false;
            let up = false;
            let down = false;
            if(data[i-4+3]) left = true;
            if(data[i+4+3]) right = true;
            if(data[i-w*4+3] > 0) up = true;
            if(data[i+w*4+3] > 0) down = true;

            // if(up && right && down) change();
            // else if(up && left && down) change();
            // else if(down && right && up) change();
            // else if(down && left && up) change();
        }
    }
    ctx.putImageData(new ImageData(data,w,h),x,y);

    selProject.resetEffected();
}
function applyNECorrectionPost(){ // no anti-aliasing

}

let _overCanvas = false;
let _overDropdown:HTMLElement;
function setOverCanvas(v:boolean){
    let wasChange = (_overCanvas != v);
    _overCanvas = v;
    if(wasChange){
        updateOverCanvas();
    }
}
function updateOverCanvas(){
    if(!_overCanvas){
        ov_cont.classList.add("hide");
        for(const c of ov_cont.children){
            c.classList.add("hide");
        }
    }
    else{
        ov_cont.classList.remove("hide");
        if(selProject){
            if(curTool?.doesUseCursor()) selProject.cursorOv.canvas.classList.remove("hide");
            else selProject.cursorOv.canvas.classList.add("hide");
        }
    }
}
let isDrawing = false;
let wasOverCanvas = false;

type AddLayerOptions = {
    selectAfter?:boolean
};
type AddFrameOptions = {
    selectAfter?:boolean
};
class Layer{
    constructor(lref:LayerRef,p:Project,f:Frame){
        this.lref = lref;
        this.project = p;
        this.frame = f;
        
        // this.ctx = document.createElement("canvas").getContext("2d",{willReadFrequently:settings.WRF});
        // this.ctx.canvas.width = p.w;
        // this.ctx.canvas.height = p.h;

        this.spans = [];
    }
    ctx:CanvasRenderingContext2D;

    // ref
    lref:LayerRef;
    project:Project;
    frame:Frame;

    spannedBy:Layer;
    spans:Layer[];
    spanDir:number;
    _td:HTMLElement;

    hn:number; // Hist state id number

    canEdit(){
        // if(this.project.lockAllEdits) return false; // lock all edits if the project is locked
        
        if(this.project.hist._isBare) return true; // allow anything when restoring states
        if(this.project.curFinishableAction) return false;
        if(this.lref.locked || this.lref.hidden) return false;
        return true;
    }

    initCtxIfNeeded(){
        // if(this.isEmpty()) return;
        if(this.ctx) return false;
        // console.log("INITED CTX");
        this.ctx = document.createElement("canvas").getContext("2d",{willReadFrequently:settings.WRF});
        this.ctx.canvas.width = this.project.w;
        this.ctx.canvas.height = this.project.h;
        return true;
    }

    private _empty = true;
    _setEmpty(v:boolean){
        this._empty = v;
        // if(v) this.ctx = null;
        // else{
        //     this.ctx = document.createElement("canvas").getContext("2d",{willReadFrequently:settings.WRF});
        //     this.ctx.canvas.width = selProject.w;
        //     this.ctx.canvas.height = selProject.h;
        // }
    }
    
    doesShowData(){ //does it show data for the timeline table? like being spanned into
        return (!this.isEmpty() || (this.spannedBy ? !this.spannedBy.isEmpty() : false));
        // return (!this.isEmpty() || this.spannedBy != null || this.spans.length != 0);
    }
    isEmpty(){
        // if(this.spannedBy) return false;
        return this._empty;
    }
    applyChange(force=false,newChange=true){
        if(!force) if(!wasOverCanvas) return;
        // if(!this.project.hist._isBare){
        //     // this.hn = this.project.hist.n;
        //     this.hn = this.project.hist.curHA().hn+1;
        //     console.warn("NEW CHANGE:",this.frame.getI(),this.lref.name);
        // }
        this._empty = false;
        if(newChange) if(this.project._saved) this.project.setSaved(false);
        // timelinePanel.updateSel();
        getPanel<TimelinePanel>("timeline",p=>p.updateSel());
        return true;
    }
    /**
     * This does not clear the box around the selection, but only the selection itself
     */
    clearSelectedArea(){
        if(!this.canEdit()) return;
        let t = this as Layer;
        if(t.spannedBy){
            t = t.spannedBy;
            // t.spannedBy.clearSpans(); //<-- use these two lines to delete the span itself minus the original layer
            // return;
        }

        // probably too expensive to test for empty here

        // if(t.ctx) t.ctx.clearRect(0,0,t.ctx.canvas.width,t.ctx.canvas.height);
        t.ctx.globalCompositeOperation = "destination-out";
        t.ctx.drawImage(t.project.sel.canvas,0,0);
        t.ctx.globalCompositeOperation = "source-over";
        
        return true;
    }
    clear(){
        if(!this.canEdit()) return;
        let t = this as Layer;
        if(t.spannedBy){
            t = t.spannedBy;
            // t.spannedBy.clearSpans(); //<-- use these two lines to delete the span itself minus the original layer
            // return;
        }

        t._empty = true;
        if(t.ctx) t.ctx.clearRect(0,0,t.ctx.canvas.width,t.ctx.canvas.height);
        if(t.spans.length) t.clearSpans();
        else{
            // timelinePanel.update();
            updatePanel("timeline");
        }
        return true;
    }
    clearPixels(){
        if(!this.canEdit()) return;
        let t = this as Layer;

        if(t.ctx) t.ctx.clearRect(0,0,t.ctx.canvas.width,t.ctx.canvas.height);
        return true;
    }
    clearSpans(){
        if(!this.canEdit()) return;
        if(!this.spans.length) return;
        for(const s of this.spans){
            s.spannedBy = null;
            s.clear();
        }
        this.spans = [];

        // timelinePanel.update();
        updatePanel("timeline");
        return true;
    }
    manualSpanBy(len:number){
        let dir = (len < 0 ? -1 : 1);
        let layerID = this.lref._id;
        let i = this.frame.getI();
        let end = Math.max(Math.min(this.project.frames.length-1,i+len),0);
        let loop = (j:number)=>{
            let f = this.project.frames[j];
            let ref = f.layers.get(layerID);
            if(!ref){
                ref = new Layer(this.lref,this.project,f);
                f.layers.set(ref.lref._id,ref);
            }
            ref.spannedBy = this;
            this.spans.push(ref);
        }
        if(dir >= 0) for(let j = i+1; j <= end; j++) loop(j);
        else for(let j = i-1; j >= end; j--) loop(j);
        this.spanDir = dir;
    }

    // history helpers
    h_getLoc(){
        return new HFS_Loc(this.frame.getI(),this.lref._id);
    }
}
class Frame{
    constructor(p:Project){
        this.project = p;

        // this.layers = [];
        this.layers = new Map();
        this.curLayers = [];
    }
    // layers:Layer[];
    layers:Map<number,Layer>;
    // curLayer:Layer;
    curLayers:Layer[];

    // visual cans
    // base:CanvasRenderingContext2D;
    // main:CanvasRenderingContext2D;
    // selOv:CanvasRenderingContext2D;

    // ref
    project:Project;

    addLayer(lref:LayerRef){
        let l = new Layer(lref,this.project,this);
        this.layers.set(lref._id,l);
        return l;
    }

    getAll(){
        let arr1:{
            v:Layer,
            z:number,
            og:Layer
        }[] = [];
        for(const [k,v] of this.layers.entries()){
            let v1 = v;
            if(v1.spannedBy) v1 = v1.spannedBy;
            arr1.push({
                v:v1,z:this.project.gLayers.indexOf(v.lref),og:v
            });
        }
        if(this.getI() != 0){
            let f = this.project.frames[0];
            for(let [k,v] of f.layers.entries()){
                let v1 = v;
                if(v1.spannedBy) v1 = v1.spannedBy;
                if(v.lref.type != LayerType.background) continue;
                arr1.push({
                    v:v1,z:this.project.gLayers.indexOf(v.lref),og:v
                });
            }
        }
        // let arr = arr1.sort((a,b)=>b.z-a.z).filter(v=>v.v.ctx != null).map(v=>v.v.ctx.canvas);
        // let arr = arr1.sort((a,b)=>b.z-a.z).map(v=>v.v.ctx?.canvas);
        let arr = arr1.sort((a,b)=>a.z-b.z).map(v=>v.v.ctx?.canvas);
        if(true){
            for(let i = arr1.length-1; i >= 0; i--){
                let d = arr1[i];
                if(this.curLayers.includes(d.og)){
                    arr.splice(i+1,0,this.project.main.canvas);
                    break;
                }
            }
        }
        if(false){
            // let cur = this.curLayers.reduce((prev,l,i,ar)=>{
            //     let v = 
            // });
            let first = this.curLayers[0];
            if(!first) return {arr:[],arr1:[]};
            if(first.spannedBy) first = first.spannedBy;
            if(first){
                let ind = arr.findIndex(v=>v == first.ctx?.canvas);
                if(ind != -1){
                    // arr.splice(ind+1,0,this.project.main.canvas); // do we need +1?
                    arr.splice(ind,0,this.project.main.canvas); // do we need +1?
                }
                else console.warn("Err: found first curLayer but didn't find it in the final layer stack");
            }
        }
        // arr.reverse();
        arr.push(this.project.selOv.canvas); // switched the order here so selOv would be on the top instead of bottom
        arr.push(this.project.prev.canvas); // add the preview canvas on top
        return {arr,arr1};
    }

    getLayer(id:number,noUpdate=false){
        let l = this.layers.get(id);
        if(true) if(!l){ // <-- todo - if I can figure out how to make everything still work without creating Layer objects for empty layers, that is the goal
            let lref = this.project.getLRef(id);
            if(!lref){
                console.warn("Err: could not find lref from id: "+id);
                return;
            }
            l = new Layer(lref,this.project,this);
            this.layers.set(id,l);
            if(!noUpdate){
                // timelinePanel.smallUpdate();
                getPanel<TimelinePanel>("timeline",p=>p.smallUpdate());
            }
        }
        return l;
    }

    addRemoveCurLayer(l:Layer){
        if(!l){
            console.warn("Err: trying to select null layer");
            return;
        }
        
        let list = [...this.layers];
        if(!list.find(v=>v[1] == l)){
            console.warn("Err: This frame does not own this layer to be selected");
            return;
        }
        if(this.curLayers.includes(l)){
            // console.warn("Note: This frame already includes this cur layer");
            this.curLayers.splice(this.curLayers.indexOf(l),1);
            // timelinePanel.updateSel();
            getPanel<TimelinePanel>("timeline",p=>p.updateSel());
            return;
        }
        this.curLayers.push(l);
        // timelinePanel.updateSel();
        getPanel<TimelinePanel>("timeline",p=>p.updateSel());
    }
    addCurLayer(l:Layer){
        if(!l){
            console.warn("Err: trying to select null layer");
            return;
        }
        
        let list = [...this.layers];
        if(!list.find(v=>v[1] == l)){
            console.warn("Err: This frame does not own this layer to be selected");
            return;
        }
        if(this.curLayers.includes(l)){
            return;
        }
        this.curLayers.push(l);
        // timelinePanel.updateSel();
        getPanel<TimelinePanel>("timeline",p=>p.updateSel());
    }
    removeCurLayer(l:Layer){
        if(!l){
            console.warn("Err: trying to select null layer");
            return;
        }
        
        let list = [...this.layers];
        if(!list.find(v=>v[1] == l)){
            console.warn("Err: This frame does not own this layer to be selected");
            return;
        }
        if(this.curLayers.includes(l)){
            this.curLayers.splice(this.curLayers.indexOf(l),1);
            // timelinePanel.updateSel();
            getPanel<TimelinePanel>("timeline",p=>p.updateSel());
        }
    }
    selectLayer(l:Layer){
        this.project.deselectLayers();
        this.addRemoveCurLayer(l);
    }

    getI(){
        return this.project.frames.indexOf(this);
    }
}
enum LayerType{
    global,
    background
}
class LayerRef{
    constructor(_id:number,name:string,type:LayerType,hidden=false,locked=false){
        this._id = _id;
        this.name = name;
        this.type = type;
        this._hidden = hidden;
        this._locked = locked;
    }
    _id:number;
    name:string;
    type:LayerType;
    private _hidden:boolean;
    private _locked:boolean;
    serialize(){
        return `${this._id}^${this.name}^${this.type}^${+this.hidden}^${+this.locked}`;
    }
    addTo(p:Project){
        if(this.type == LayerType.global) p.addExistingGlobalLayer(this);
        else if(this.type == LayerType.background) p.addExistingBGLayer(this);
    }
    static deserialize(s:string){
        let d = s.split("^");
        return new LayerRef(parseInt(d[0]),d[1],parseInt(d[2]),parseInt(d[3])!=0,parseInt(d[4])!=0);
    }
    get hidden(){
        return this._hidden;
    }
    get locked(){
        return this._locked;
    }
    setHidden(p:Project,v:boolean){
        this._hidden = v;
        p.hist.add(new HA_SetLayerVisibility(this._hidden,this._id));
        p.loadFrame();
    }
    setLocked(p:Project,v:boolean){
        this._locked = v;
        p.hist.add(new HA_SetLayerLocked(this._locked,this._id));
        p.loadFrame();
    }
    getLoc(frameI:number){
        return new HFS_Loc(frameI,this._id);
    }
}
enum DrawMode{
    none,
    draw,
    erase,
    select,
    erase_select,
    replace_all,

    replace,
    add, // lighter
    multiply,
    xor,
    screen,
    overlay,
    darken,
    lighten,
    color_dodge,
    color_burn,
    hard_light,
    soft_light,
    difference,
    exclusion,

    // backend
    sourceIn,
}
const ov_cont = document.querySelector(".ov");
class Project{
    constructor(w:number,h:number,filename="New File.qs"){
        this.w = w;
        this.h = h;
        this.filename = filename;
        this.frames = [];
        this.gLayers = [];
        this.l_globals = [];
        this.l_bgs = [];
        this.hist = new Hist(this);

        let list = [
            "main","selOv","prev"
        ];
        for(const k of list){
            let ctx = document.createElement("canvas").getContext("2d",{willReadFrequently:settings.WRF});
            ctx.imageSmoothingEnabled = false;
            ctx.canvas.width = this.w;
            ctx.canvas.height = this.h;
            this[k] = ctx;
        }
        this.main.canvas.className = "can-main";
        this.selOv.canvas.className = "can-sel";

        this.cursor = document.createElement("canvas").getContext("2d");
        this.cursorOv = document.createElement("canvas").getContext("2d");
        this.cursorOv.canvas.classList.add("cur-ov");
        this.cursorOv.imageSmoothingEnabled = false;
        ov_cont.appendChild(this.cursorOv.canvas);

        this.cp = new ColorPalette(new Map());

        this.canObjArea = document.createElement("div");
        this.canObjArea.classList.add("canvas-obj-area");
    }
    filename:string;
    
    handle:FileSystemFileHandle;
    folderHandle:FileSystemDirectoryHandle;
    w:number;
    h:number;
    rot = 0;

    legacyFile:File;

    blendComp = new TS_BlendMode();

    private useEnabledChannels = false;
    private enabledChannels:number[] = [255,0,0,255];

    setColStr(s:string,a?:number){
        col = s;
        if(a != undefined) gAlpha = a;
        let list = _getPanelList();
        for(const p of list){
            if(p == curPanel) continue;
            if(!(p instanceof MixerPanel || p instanceof ColorPanel)) continue;
            p.colorUpdate();
        }
        if(this.curFinishableAction) this.curFinishableAction.updateSettings();
    }
    setCol(c:number[],a?:number){
        col = `rgb(${c[0]},${c[1]},${c[2]})`;
        if(a != undefined) gAlpha = a;
        let list = _getPanelList();
        for(const p of list){
            if(p == curPanel) continue;
            if(!(p instanceof MixerPanel || p instanceof ColorPanel)) continue;
            p.colorUpdate();
        }
        if(this.curFinishableAction) this.curFinishableAction.updateSettings();
    }
    setGAlpha(v:number){
        gAlpha = v;
        let list = _getPanelList();
        for(const p of list){
            if(p == curPanel) continue;
            if(!(p instanceof MixerPanel || p instanceof ColorPanel)) continue;
            p.colorUpdate();
        }
        if(this.curFinishableAction) this.curFinishableAction.updateSettings();
    }

    // private enabledChannels:number[] = [0,0,0,255];
    setUseEnabledChannels(v:boolean){
        this.useEnabledChannels = v;
        this.loadFrame();
    }
    isUsingEnabledChannels(){
        return this.useEnabledChannels;
    }
    getEnabledChannel(i:number){
        return this.enabledChannels[i];
    }
    setEnabledChannel(i:number,v:number){
        this.enabledChannels[i] = v;
        this.loadFrame();
    }

    private blendMode = DrawMode.draw;
    getBlendMode(){
        if(this.tmpBlendMode != DrawMode.none) return this.tmpBlendMode;
        return this.blendMode;
    }
    setBlendMode(v:DrawMode){
        this.blendMode = v;
        if(curTool){
            curTool.updateSettings();
        }

        let info = blendModeInfo[this.blendMode];
        if(info) this.main.canvas.style.mixBlendMode = info.mix;
        else this.main.canvas.style.mixBlendMode = "unset";

        if(this.blendMode == DrawMode.replace){
            this.main.canvas.style.opacity = gAlpha.toString(); // <-- this is buggy bc it only gets updated when setting the blend mode, need to also update this when changing gAlpha
        }
        else{
            this.main.canvas.style.opacity = null;
        }
    }
    resetBlendMode(){
        this.setBlendMode(DrawMode.draw);
    }

    private tmpBlendMode = DrawMode.none;
    setTmpBlendMode(v:DrawMode){
        this.tmpBlendMode = v;

        curTool.updateSettings();
    }
    getTmpBlendMode(){
        return this.tmpBlendMode;
    }
    resetTmpBlendMode(){
        this.setTmpBlendMode(DrawMode.none);
    }

    // private activeDrawMode = -1;
    // setActiveDrawMode(v:DrawMode){
    //     if(v == DrawMode.draw) this.activeDrawMode = -1;
    //     else this.activeDrawMode = v;
    // }
    // getActiveDrawMode(){
    //     return this.activeDrawMode;
    // }
    // getActiveDrawModePost(){
    //     if(this.activeDrawMode == DrawMode.draw) return this.lastDrawMode;
    //     return this.activeDrawMode;
    // }

    canEdit(){
        if(this.lockAllEdits) return false; // don't allow any edits when fully locked

        if(curTool?.inUse) return;
        let times = 0;
        this.loopSel(l=>{
            if(!l.canEdit()) times++;
        });
        if(times != 0) return false;
        return true;
    }

    curFinishableAction:FinishableAction;
    
    canObjArea:HTMLElement;
    canObjs:CanvasObj[] = [];
    hoverCO:CanvasObj;
    selCOs:CanvasObj[] = [];
    _COId = 0;
    deselectAllCanObjs(){
        let list = [...this.selCOs];
        for(const o of list){
            o.deselect();
        }
    }
    unhoverAllCanObjs(){
        for(const o of this.canObjs){
            o.unhover();
        }
    }

    addCanObj<T extends CanvasObj>(o:T,forceId?:number){
        o.p = this;
        if(forceId != null) o._id = forceId;
        else if(o._id == null) o._id = this._COId++;
        // let existing = this.canObjs.find(v=>v._id == o._id);
        // if(existing){
        //     this.removeCanObj(existing);
        // }
        this.canObjs.push(o);
        this.canObjArea.appendChild(o.cont);
        o.onAdd();
        o.update();
        return o;
    }
    getCanObj(_id:number){
        return this.canObjs.find(v=>v._id == _id); // TODO - might need to optimize this later by storing them in a map instead of array
    }
    removeCanObj(o:CanvasObj){
        let i = this.canObjs.indexOf(o);
        if(i == -1) return;
        this.canObjs.splice(i,1);
        if(o.cont) if(o.cont.parentElement) this.canObjArea.removeChild(o.cont);
        let i2 = this.selCOs.indexOf(o);
        if(i2 != -1) this.selCOs.splice(i2,1);
        if(this.hoverCO == o) this.hoverCO = null;
        o.onRemove();
    }
    runCOMouseDown(e:UniversalMouseEvent){
        if(!isPointerTool()) return;
        for(const o of this.canObjs){
            o.mouseDown(e);
        }
    }
    runCOMouseMove(e:UniversalMouseEvent){
        if(!isPointerTool()) return;
        for(const o of this.canObjs){
            o.mouseMove(e);
        }
    }
    runCOMouseUp(e:UniversalMouseEvent){
        if(!isPointerTool()) return;
        for(const o of this.canObjs){
            o.mouseUp(e);
        }
    }

    private fps = 8;
    setFPS(v:number){
        this.fps = v;
    }
    getFPS(){
        return this.fps;
    }

    mainCont:HTMLElement;
    cont:HTMLElement;
    overlay:HTMLElement;
    fake:HTMLElement;

    fileItem:HTMLElement;

    // system cans
    tmp:CanvasRenderingContext2D;
    sel:CanvasRenderingContext2D;
    isSel = false;

    // visual cans
    backMain:CanvasRenderingContext2D;
    main:CanvasRenderingContext2D;
    selOv:CanvasRenderingContext2D;
    prev:CanvasRenderingContext2D;

    clearPrev(){
        this.prev.canvas.width = this.w;
        this.prev.canvas.height = this.h;
        this.prev.imageSmoothingEnabled = false;
        this.prev.resetTransform();
        this.prev.globalAlpha = 1;
    }

    // tmp
    ovSL:number;
    ovST:number;

    // history
    hist:Hist;
    canClose(){
        return this._saved;
    }
    _saved = false;
    saving = false;
    setSaved(v:boolean){
        this._saved = v;
        if(v) this.fileItem.children[0].classList.remove("unsaved");
        else this.fileItem.children[0].classList.add("unsaved");
        for(const ha of this.hist.list){
            if(ha.full) ha.full._saved = false;
        }
        // console.log(this.hist.list[this.hist.i]); // <-- may not be worth it, I'd have to turn the current state into a full state right now in order to save the fact that you saved here
    }
    updateFilename(s:string|null){
        if(s == null) this.filename = (this.handle ? this.handle.name : "New File");
        this.filename = s;
        this.fileItem.children[1].textContent = this.filename;
    }

    getByLoc(loc:HFS_Loc){
        return this.frames[loc.frameI]?.layers.get(loc.layerID);
    }

    // private _drawMode = DrawMode.draw; // 0: none, 1: draw, 2: erase, 3: select
    // _tmpDrawMode = DrawMode.none;
    _forceDrawMode:DrawMode;
    constantDrawMode:DrawMode;
    // updateDrawMode(){
    //     this.setDrawMode(this._drawMode);
    // }
    private setForceDrawMode(v:DrawMode){
        this._forceDrawMode = v; // this is broken, it severely breaks undo/redo, don't use this xD
    }
    setConstantDrawMode(v:DrawMode){
        this.constantDrawMode = v;
    }
    // setDrawMode(v:DrawMode){
    //     this._drawMode = v;
    //     this.lastDrawMode = v;
    // }
    // getDrawMode(){
    //     if(this._forceDrawMode){
    //         this.setDrawMode(this._forceDrawMode);
    //         this.setTmpDrawMode(this._forceDrawMode);
    //         return this._forceDrawMode;
    //     }
    //     if(this.useActiveCheck()) if(this.activeDrawMode != -1) return this.activeDrawMode;
    //     return this._drawMode;
    // }
    // setTmpDrawMode(v:DrawMode){
    //     if(this._tmpDrawMode != DrawMode.none) return;
    //     this._tmpDrawMode = v;
    //     this.lastDrawMode = v;
    // }
    // getTmpDrawMode(){
    //     if(this._forceDrawMode){
    //         this.setDrawMode(this._forceDrawMode);
    //         this.setTmpDrawMode(this._forceDrawMode);
    //         return this._forceDrawMode;
    //     }
    //     if(this.useActiveCheck()) if(this.activeDrawMode != -1) return this.activeDrawMode;
    //     return this._tmpDrawMode;
    // }
    // lastDrawMode = DrawMode.draw;
    // getFinalDrawMode(){
    //     if(this._forceDrawMode){
    //         this.setDrawMode(this._forceDrawMode);
    //         this.setTmpDrawMode(this._forceDrawMode);
    //         return this._forceDrawMode;
    //     }
    //     if(this.useActiveCheck()) if(this.activeDrawMode != -1) return this.activeDrawMode;
    //     return (this._tmpDrawMode != DrawMode.none ? this._tmpDrawMode : this._drawMode);
    // }
    useActiveCheck(){
        // if(!curTool?.inUse) return false;
        // if(this.hist._isBare) return false;
        return false;
        // return true;
    }

    // preview cursor
    cursor:CanvasRenderingContext2D;
    cursorOv:CanvasRenderingContext2D;
    useCursor(){
        if(!this.useCur) return;
        let ctx = this.cursor;
        let ov = this.cursorOv;
        // if(curTool) curTool.renderCursor(ctx);
        // ov.canvas.width = ctx.canvas.width;
        // ov.canvas.height = ctx.canvas.height;
        // ov.drawImage(ctx.canvas,0,0);

        ov.canvas.classList.remove("hide");
        this.updateCur();
    }
    endCursor(){
        if(!this.useCur) return;
        let ov = this.cursorOv;
        ov.canvas.classList.add("hide");
    }

    isQuickSettingsOpen(){
        return document.querySelector(".quick-settings") != undefined;
    }

    snapCursor = true;
    useCur = true;
    updateCurPos(clientX:number,clientY:number){
        if(this.isQuickSettingsOpen()){
            this.updateCurPosMXMY();
            return;
        }
        
        let p = this;
        let main = this.main.canvas;
        let cur = this.cursor.canvas;
        let curOv = this.cursorOv.canvas;
        let amt = main.offsetWidth/p.w;
        let r = main.getBoundingClientRect();
        let offX = r.left;
        let offY = r.top;
        let xx = clientX-offX;
        let yy = clientY-offY;
        let off2 = (cur.width%2 == 1 ? amt/2 : 0);
        // let off2 = 0;
        if(cur.width == 1){
            xx += off2;
            yy += off2;
        }
        curOv.style.left = Math.round(!p.snapCursor ? clientX : (Math.round(xx/amt)*amt)+offX-off2)+"px";
        curOv.style.top = Math.round(!p.snapCursor ? clientY : (Math.round(yy/amt)*amt)+offY-off2)+"px";
    }
    updateCurPosMXMY(){
        let cur = this.cursor.canvas;
        let curOv = this.cursorOv.canvas;
        let main = this.main.canvas;
        let p = this;

        let amt = main.offsetWidth/p.w;
        let r = main.getBoundingClientRect();
        let offX = r.left;
        let offY = r.top;
        let off2 = (cur.width%2 == 1 ? amt/2 : 0);

        curOv.style.left = Math.round((Math.ceil(mx)*amt)+offX-off2)+"px";
        curOv.style.top = Math.round((Math.ceil(my)*amt)+offY-off2)+"px";
    }
    getVisiblePixel(x:number,y:number):number[]|undefined{
        x = Math.floor(x);
        y = Math.floor(y);

        if(x < 0) return;
        if(y < 0) return;
        if(x >= this.w) return;
        if(y >= this.h) return;
        
        let layers = this.curFrame?.layers;
        if(!layers) return;
        let list = [...layers.values()].sort((a,b)=>this.gLayers.indexOf(b.lref)-this.gLayers.indexOf(a.lref)).filter(v=>!v.lref.hidden && (v.spannedBy ? v.spannedBy.ctx != null : v.ctx != null)).map(v=>v.spannedBy ? v.spannedBy.ctx : v.ctx); // should hopefully loop backwards through the layers
        list.splice(0,0,this.prev);
        list.splice(0,0,this.main);
        for(const ctx of list){
            let data = ctx.getImageData(x,y,1,1).data;
            if(data[3] == 0) continue;
            return [...data];
        }
    }
    _isUpdatingCursor = -9999;
    updateCur(){
        if(!this.useCur) return;
        let p = this;

        if(performance.now()-this._isUpdatingCursor < 5) return; // millisecond delay
        this._isUpdatingCursor = performance.now();

        let curOv = this.cursorOv.canvas;

        if(curTool && settings.enableCursor){
            // check for color underneath to compute opposite for good contrast in all cases
            let cc = "#000";
            let light = 1;
            // if(isNewPixelLoc){
                let c = this.getVisiblePixel(mx,my);
                if(c){
                    let hsl = RGBAtoHSLA(c[0],c[1],c[2],255);
                    // cc = `hsl(${hsl[0]},${100-hsl[1]}%,${100-hsl[2]}%)`;
                    // let l = (hsl[2]+50)%100;
                    let l = hsl[2];
                    // if(l > 50) l -= 90;
                    // else l += 90;
                    if(l > 40) l -= 90; // probably should be >= 30
                    else l += 90;
                    cc = `hsl(${hsl[0]}deg,${hsl[1]}%,${l}%)`;
                    light = l;
                }
                else{
                    if(curTheme == "dark"){
                        cc = "hsl(0deg,0%,90%)";
                        light = 90;
                    }
                    else{
                        cc = "hsl(0deg,0%,10%)";
                        light = 10;
                    }
                }
                
            // }

            // update cursor color (new method)
            curOv.style.setProperty("--light",(light/100+0.5).toString());

            // 

            // curTool.renderCursor(this.cursor,cc);
            curTool.renderCursor(this.cursor);
        }

        let w = this.main.canvas.offsetWidth;
        let cellW = w/this.w;
        let cur = this.cursor.canvas;
        curOv.style.width = Math.floor(cellW*cur.width)+"px";
        curOv.style.height = Math.floor(cellW*cur.width)+"px";
        
        let w2 = Math.ceil(cur.width/p.w*p.main.canvas.offsetWidth*2);

        w2 = Math.min(w2,Math.ceil(centerArea.offsetWidth/2),Math.ceil(centerArea.offsetHeight/2));

        // let h2 = Math.ceil(cur.height/p.h*p.main.canvas.offsetHeight);
        curOv.width = w2;
        curOv.height = w2;

        let ratX = curOv.width/cur.width;
        // let ratY = curOv.height/cur.height;
        this.cursorOv.imageSmoothingEnabled = false;
        
        this.cursorOv.drawImage(cur,0,0,curOv.width,curOv.height);

        // curOv.width = cur.width;
        // curOv.height = cur.height;
        // this.cursorOv.drawImage(cur,0,0); // <-- TMP

        if(!settings.solidCursor){
            this.cursorOv.globalCompositeOperation = "destination-out";
            // let off = 5;
            let off = 10;
            this.cursorOv.drawImage(cur,off,off,curOv.width-off*2,curOv.height-off*2);
            this.cursorOv.globalCompositeOperation = "source-over"; // <-- disable this line and the line above to make it so it draws a filled cursor instead of outline
        }

        this._isUpdatingCursor = performance.now(); // do we need this?

        // /////

        // let off = Math.max(2*ratX/10,5);
        // this.cursorOv.drawImage(cur,-off,-off,curOv.width+off*2,curOv.height+off*2);
        // this.cursorOv.globalCompositeOperation = "destination-out";
        // this.cursorOv.drawImage(cur,0,0,curOv.width,curOv.height);
        // this.cursorOv.globalCompositeOperation = "source-over";


        // let data = this.cursor.getImageData(0,0,cur.width,cur.height).data;
        // let i = 0;
        // for(let y = 0; y < cur.height; y++){
        //     for(let x = 0; x < cur.width; x++){
        //         let l = (data[i-4+3] == 0);
        //         let r = (data[i+4+3] == 0);
        //         let u = (data[i-4*cur.width+3] == 0);
        //         let d = (data[i+4*cur.width+3] == 0);
        //         if(l || r || u || d){
                    
        //         }
                
        //         i += 4;
        //     }
        // }
    }

    // color palette
    cp:ColorPalette;
    computeCP(){
        let order = this.cp?.order;
        this.cp = computeColorPalette(this);
        this.cp.order = order;
    }
    limitCP(keep:number,update=true){
        let cols = [...this.cp.cols];
        for(let i = keep; i < cols.length; i++){
            this.cp.cols.splice(this.cp.cols.indexOf(cols[i]),1);
            this.cp.map.delete(cols[i]);
        }
        if(update) updatePanel("color");
    }
    modifyCP(cp:ColorPalette,replace=false,ignoreOrder=false){ // these two options are a little buggy
        let p = this;
        let curC = map8x4To32(convert(col));
        let curI = p.cp?.map2.get(curC);
        
        p.computeCP();
        if(!p.cp) return;

        // if(true){ // ENABLE to make it so CP don't merge when applied
        //     this.cp.cols = [];
        //     this.cp.map2.clear();
        // }
        
        // replace means it ignores order and simply replaces the current palette with the new one
        if(replace) for(let i = 0; i < cp.cols.length; i++){
            // if(p.cp.cols[i] == null) continue; // ENABLE this so that ONLY colors in the current project are used, no consideration for unused in incoming color palette
            p.cp.set(i,cp.cols[i]);
        }
        else if(p.cp.order && !ignoreOrder){
            for(let i = 0; i < cp.cols.length; i++){
                // if(p.cp.cols[i] == null) continue; // ENABLE this so that ONLY colors in the current project are used, no consideration for unused in incoming color palette
                p.cp.set(p.cp.order.get(i)??i,cp.cols[i]);
            }
        }
        else{
            let cols = [...p.cp.cols];
            console.log(cols,cp.cols);
            // p.cp.clear();
            let j = 0;
            let order = new Map<number,number>();
            for(let i = 0; i < cols.length; i++){
                let c = cols[i] & 0xffffffff;
                if(cp.cols.includes(c)){
                    // p.cp.add(c);
                    let last = cp.map2.get(c);
                    p.cp.set(j,c);
                    if(last == null) last = j;
                    order.set(last,j);
                    j++;
                }
            }
            for(let i = 0; i < cp.cols.length; i++){
                let c = cp.cols[i] & 0xffffffff;
                if(!p.cp.cols.includes(c)){
                    // p.cp.add(c);
                    let last = cp.map2.get(c);
                    p.cp.set(j,c);
                    if(last == null) last = j;
                    order.set(last,j);
                    j++;
                }
            }
            console.log("ORDER:",order);
            p.cp.order = order;
        }

        // this.limitCP(4); // ^^^ ENABLE for limiting

        if(curI != null){
            selProject.setColStr(RGBToHex(map32To8x4(p.cp.cols[curI])));
            // updatePanel("color");
        }
    }
    /**
     * Reduces project's colors to fit into the current Color Palette
     */
    reduceToCP(){
        let start = performance.now();
        if(this.cpChangesAll){
            for(const f of this.frames){
                for(const [id,l] of f.layers){
                    if(l.isEmpty()) continue;
                    this._reduceToCP(l.ctx,this.cp);
                }
            }
        }
        else this._reduceToCP(this.getFirstCurLayer().ctx,this.cp);
        console.log("REDUCE TIME: ",performance.now()-start);
    }
    _reduceToCP(ctx:CanvasRenderingContext2D,cp:ColorPalette){
        let buf = ctx.getImageData(0,0,this.w,this.h).data;
        for(let i = 0; i < buf.length; i += 4){
            if(buf[i+3] == 0) continue;
            let maxDif = 99999999999;
            let tar:number[] = null;
            for(const c of cp.cols){
                let rgb = map32To8x4(c);
                let dif = compareColors(rgb,[buf[i],buf[i+1],buf[i+2],255]);
                if(dif < maxDif){
                    maxDif = dif;
                    tar = rgb;
                }
            }
            if(tar){
                buf[i] = tar[0];
                buf[i+1] = tar[1];
                buf[i+2] = tar[2];
                buf[i+3] = tar[3];
            }
        }
        ctx.putImageData(new ImageData(buf,this.w,this.h),0,0);
    }
    cpChangesAll = true;
    applyCPChange(){
        let p = this;
        if(!p.cp) return;
        if(this.cpChangesAll){
            for(const f of p.frames){
                for(const [id,l] of f.layers){
                    if(!l.isEmpty()) this.cp.drawTo2(l.ctx,true);
                }
            }
        }
        else{
            let first = this.getFirstCurLayer();
            if(!first) return;
            if(first.isEmpty()) return;
            this.cp.drawTo2(first.ctx,true);
        }

        // vvv - commented this out bc it seed like it never ran
        // let wasChange = false;
        // for(let i = 0; i < this.cp.lastCols.length; i++){
        //     if(this.cp.cols[i] == null) continue;
        //     let ar = map32To8x4(this.cp.lastCols[i]);
        //     if(convert(col).toString() == ar.toString()){
        //         col = RGBToHex(map32To8x4(this.cp.cols[i]));
        //         wasChange = true;
        //     }
        // }
        this.hist.add(new HA_SwapCP(this.cp));
        // if(wasChange){
            // updatePanel("color");
        // }
        
        this.cp.reassign();

        updatePanel("color");
    }

    // frames - image data
    frames:Frame[];
    _curFrame:Frame;
    get curFrame(){
        return this._curFrame;
    }
    set curFrame(v:Frame){
        if(curTool?.inUse) return;
        this._curFrame = v;
    }
    gLayers:LayerRef[];
    l_globals:number[];
    l_bgs:number[];
    _lId = 0;
    removeAllLayers(){
        this.gLayers = [];
        this.l_globals = [];
        this.l_bgs = [];
    }

    // selections
    startSelMode(){
        this.main.canvas.classList.add("sel-mode");
        this.main.fillStyle = "rgba(100,100,255,100)";
    }
    endSelMode(){
        this.main.canvas.classList.remove("sel-mode");
    }

    setRot(v:number){
        this.rot = v;
        this.cont.style.setProperty("--rot",`rotate(${this.rot}rad)`);
    }

    // runs through all layers and if some are labled as non empty but actually are empty, they will be reset back to empty
    cleanupEmpty(){
        for(let i = 0; i < this.frames.length; i++){
            let frame = this.frames[i];
            let layers = [...frame.layers];
            for(let j = 0; j < layers.length; j++){
                let [_id,layer] = layers[j];
                if(!layer.ctx){
                    layer._setEmpty(true);
                    continue;
                }
                let data = layer.ctx.getImageData(0,0,this.w,this.h).data;
                let isEmpty = true;
                for(let k = 0; k < data.length; k++){
                    if(data[k] != 0){
                        isEmpty = false;
                        break;
                    }
                }
                if(isEmpty){
                    layer._setEmpty(true);
                }
            }
        }
        // timelinePanel.update();
        updatePanel("timeline");
    }

    // selection - correction
    _mL = 0;
    _mR = 0;
    _mT = 0;
    _mB = 0;
    resetEffected(){
        this._mL = this.w-1;
        this._mR = 0;
        this._mT = this.h-1;
        this._mB = 0;
    }
    async applyEffected(l:number,r:number,t:number,b:number){
        if(workerProm) await workerProm;
        if(l < this._mL){
            this._mL = l;
            if(this._mL < 0) this._mL = 0;
            this._mL = Math.floor(this._mL);
        }
        if(t < this._mT){
            this._mT = t;
            if(this._mT < 0) this._mT = 0;
            this._mT = Math.floor(this._mT);
        }
        if(r > this._mR){
            this._mR = r;
            if(this._mR >= this.w) this._mR = this.w;
            this._mR = Math.floor(this._mR);
        }
        if(b > this._mB){
            this._mB = b;
            if(this._mB >= this.h) this._mB = this.h;
            this._mB = Math.floor(this._mB);
        }
    }
    applyEffectedInstant(l:number,r:number,t:number,b:number){
        if(l < this._mL){
            this._mL = l;
            if(this._mL < 0) this._mL = 0;
            this._mL = Math.floor(this._mL);
        }
        if(t < this._mT){
            this._mT = t;
            if(this._mT < 0) this._mT = 0;
            this._mT = Math.floor(this._mT);
        }
        if(r > this._mR){
            this._mR = r;
            if(this._mR >= this.w) this._mR = this.w;
            this._mR = Math.floor(this._mR);
        }
        if(b > this._mB){
            this._mB = b;
            if(this._mB >= this.h) this._mB = this.h;
            this._mB = Math.floor(this._mB);
        }
    }
    correctCustomEffected(x:number,y:number,w:number,h:number,ar:number[],ctx:CanvasRenderingContext2D){
        x = Math.floor(x);
        y = Math.floor(y);
        w = Math.floor(w);
        h = Math.floor(h);
        console.log(x,y,w,h,ar);
        let data = ctx.getImageData(x,y,w,h).data;
        let a2 = ctx.globalAlpha;//(c.fillStyle.includes("(") ? parseFloat(c.fillStyle.replace("rgba(","").replace(")","").replaceAll(" ","").split(",")[3]) || 255 : parseFloat(c.fillStyle.replace("#","").substring(6,8),16) || 255);
        a2 = Math.round(a2*255);
        // let a2 = parseInt(col.substring(6,8),16) || 255;
        // let ha = Math.floor(a2*0.5); //0.5
        let ha = Math.floor(a2*1); //0.5
        for(const i of ar){
            data[i] = 255;
            data[i+1] = 0;
            data[i+2] = 0;
            data[i+3] = 255;
            wasOverCanvas = true;

            // let a = data[i+3];
            // if(a == 0) continue;
            // if(a < ha){
            //     data[i+3] = 0;
            //     wasOverCanvas = true;
            // }
            // else data[i+3] = a2;
        }
        // if(false) for(let i = 0; i < data.length; i += 4){
        //     if(ar.includes(i)){
        //         data[i] = 255;
        //         data[i+1] = 0;
        //         data[i+2] = 0;
        //         data[i+3] = 255;
        //         wasOverCanvas = true;
        //     }
            
        //     continue;
        //     let a = data[i+3];
        //     if(a == 0) continue;
        //     if(a < ha){
        //         data[i+3] = 0;
        //         wasOverCanvas = true;
        //     }
        //     else data[i+3] = a2;
        // }
        ctx.putImageData(new ImageData(data,w,h),x,y);
    }

    // layers - frames
    _addLayer(_id:number,ops:AddLayerOptions){
        if(ops.selectAfter){
            this.selectLayer(this.curFrame,_id,true);
        }
    }
    addGlobalLayer(name:string,ind=null,forceId?:number,ops:AddLayerOptions={}){
        if(!this.canEdit()) return;
        
        ind = (ind == null ? this.gLayers.length : ind);
        let _id = (forceId != null ? forceId : this._lId);
        // this.gLayers.push(new LayerRef(this._lId,name,LayerType.global));
        this.gLayers.splice(ind,0,new LayerRef(_id,name,LayerType.global));
        this.l_globals.push(_id);
        if(forceId == null) this._lId++;
        // timelinePanel.update();
        this._addLayer(_id,ops);
        updatePanel("timeline");
        this.hist.add(new HA_AddGlobalLayer(name,ind,_id),this);
        return _id;
    }
    addBGLayer(name:string,ind=null,forceId?:number,ops:AddLayerOptions={}){
        if(!this.canEdit()) return;
        
        ind = (ind == null ? this.gLayers.length : ind);
        let _id = (forceId != null ? forceId : this._lId);
        // this.gLayers.push(new LayerRef(this._lId,name,LayerType.background));
        this.gLayers.splice(ind,0,new LayerRef(_id,name,LayerType.background));
        this.l_bgs.push(_id);
        if(forceId == null) this._lId++;
        // timelinePanel.update();
        this._addLayer(_id,ops);
        updatePanel("timeline");
        this.hist.add(new HA_AddBGLayer(name,ind,_id),this);
        return _id;
    }
    addExistingGlobalLayer(lr:LayerRef){
        this.gLayers.push(lr);
        this.l_globals.push(lr._id);
    }
    addExistingBGLayer(lr:LayerRef){
        this.gLayers.push(lr);
        this.l_bgs.push(lr._id);
    }
    getBGLayer(id:number,noUpdate=false){
        if(!this.frames[0]) return;
        let l = this.frames[0].layers.get(id);
        if(!l){
            let lref = this.getLRef(id);
            if(!lref){
                console.warn("Err: could not find lref from id: "+id);
                return;
            }
            l = new Layer(lref,this,this.frames[0]);
            this.frames[0].layers.set(id,l);
            if(!noUpdate){
                // timelinePanel.smallUpdate();
                getPanel<TimelinePanel>("timeline",p=>p.smallUpdate());
            }
        }
        return l;
    }

    _addFrames(amt=1,start=null,ops:AddFrameOptions={}){        
        let list:Frame[] = [];
        for(let i = 0; i < amt; i++){
            let f = new Frame(this);
            list.push(f);
            if(start != null) this.frames.splice(start,0,f);
            else this.frames.push(f);
            if(!this.curFrame) this.curFrame = f;
        }
        if(ops.selectAfter){
            let first = this.getFirstCurLayer();
            if(first) this.goto(start!=null?start:this.frames.length-1,first.lref._id);
        }
        updatePanel("timeline");
        return list;
    }
    addFrames(amt=1,start=null,ops:AddFrameOptions={}){
        if(!this.canEdit()) return;

        let frameI = this.getCurFrameI();
        if(start == null) start = frameI+1;
        if(amt < 0){
            start--;
            // start += amt;
            amt = -amt;
        }
        
        this._addFrames(amt,start,ops);
        this.hist.add(new HA_AddFrames(amt,start),this);
    }
    getFirstCurLayer(){
        return this.curFrame?.curLayers[0];
    }
    getCurLayers(){
        return this.curFrame?.curLayers;
    }
    getAllSelectedFrames(){
        let ar:Frame[] = [];
        for(const f of this.frames){
            if(f.curLayers.length) ar.push(f);
        }
        return ar;
    }
    getAllSelectedFramesIs(){
        let ar:number[] = [];
        for(let i = 0; i < this.frames.length; i++){
            let f = this.frames[i];
            if(f.curLayers.length) ar.push(i);
        }
        return ar;
    }
    getAllSelectedLayers(){
        let ar:Layer[] = [];
        for(const f of this.frames){
            if(f.curLayers.length) for(const l of f.curLayers){
                ar.push(l);
            }
        }
        return ar;
    }
    getAllSelectedLayerIDs(){
        let set = new Set<number>();
        for(const f of this.frames){
            if(f.curLayers.length) for(const l of f.curLayers){
                set.add(l.lref._id);
            }
        }
        return set;
    }

    _deleteLayer(_id:number){
        if(_id == null) return;
        let ind = this.gLayers.findIndex(v=>v._id == _id);
        if(ind == -1) return;
        let lref = this.gLayers[ind];
        this.gLayers.splice(ind,1);

        if(lref.type == LayerType.global) this.l_globals.splice(this.l_globals.indexOf(_id),1);
        else if(lref.type == LayerType.background) this.l_bgs.splice(this.l_bgs.indexOf(_id),1);
        
        for(const f of this.frames){
            f.layers.delete(_id);
            let ind = f.curLayers.findIndex(v=>v.lref._id == _id);
            if(ind != -1){
                let l = f.curLayers[ind];
                f.curLayers.splice(ind,1);
                if(l.spans?.length) l.clearSpans();
            }
        }
    }
    deleteLayers(_ids:number[]){
        if(!this.canEdit()) return;
        let frameI = this.getCurFrameI();
        let firstI = this.gLayers.findIndex(v=>v._id == _ids[0]);
        let first = this.gLayers[firstI];
        firstI = this.gLayers.length-1-firstI;
        let isLast = _ids.includes(this.gLayers[this.gLayers.length-1]._id);
        start_noUpdatePanel();
        for(const _id of _ids){
            this._deleteLayer(_id);
        }
        end_noUpdatePanel();
        if(frameI != null) if(this.gLayers.length) this.goto(frameI,isLast ? this.gLayers[this.gLayers.length-1]._id : this.gLayers[this.gLayers.length-1-firstI]?._id);
        updatePanel("timeline");
        this.hist.add(new HA_DeleteLayers(_ids,first?.type));
    }
    _deleteFrame(f:Frame){
        if(!f) return;
        if(this.curFrame == f) this.curFrame = null;

        for(const [id,l] of f.layers){
            if(l.spannedBy){
                if(l.spannedBy.spans.length == 1){
                    l.spannedBy.clearSpans();
                }
                else l.spannedBy.spans.splice(l.spannedBy.spans.indexOf(l),1);
            }
            else if(l.spans?.length){
                let next = l.spans[0];
                l.spans.splice(0,1);
                for(let j = 0; j < l.spans.length; j++){
                    l.spans[j].spannedBy = next;
                }
                next.spannedBy = null;
                next.spanDir = l.spanDir;
                next.spans = l.spans;
                next.initCtxIfNeeded();
                next.ctx.canvas.width = this.w;
                next.ctx.drawImage(l.ctx.canvas,0,0);
                next._setEmpty(l.isEmpty());
            }
        }
        
        this.frames.splice(this.frames.indexOf(f),1);
    }
    deleteFrames(ar:number[]){
        if(!this.canEdit()) return;
        let firstI = ar[0];
        let isLast = ar.includes(this.frames.length-1);
        let first = this.frames[firstI]?.curLayers?.at(0);
        start_noUpdatePanel();
        let frames = ar.map(v=>this.frames[v]);
        for(const f of frames){
            this._deleteFrame(f);
        }
        end_noUpdatePanel();
        if(first) this.goto(isLast ? this.frames.length-1 : ar[0],first.lref._id);
        updatePanel("timeline");
        this.hist.add(new HA_DeleteFrames(ar));
    }

    initBaseFrame(){
        this.addGlobalLayer("Layer 1");
        let [f] = this._addFrames();
        f.addLayer(this.gLayers[0]);
        f.selectLayer(f.layers.get(this.gLayers[0]._id));
    }

    getCurFrameI(){
        return this.frames.indexOf(this.curFrame);
    }
    // getCurLayerID(){
    //     return this.getCurLayer().lref._id;
    // }
    getCurLayerIDs(){
        return this.getCurLayers().map(v=>v.lref._id);
    }

    getMain(){
        return this.main;
    }
    getLRef(id:number){
        return this.gLayers.find(v=>v._id == id);
    }

    // _tmpLastFrameI = 0;
    // _lastWasBG = false;
    // _lastLayerID = 0; // not fully sure how to make it go back to the right spot when going down to background layer and then back up
    goto(frameI:number,layerID:number){        
        if(frameI == null) return;
        if(layerID == null) return;
        if(frameI < 0) frameI = this.frames.length+(frameI % this.frames.length); // loop from left
        else if(frameI >= this.frames.length) frameI %= this.frames.length; // loop from right;

        // if(this.gLayers.find(v=>v._id == layerID && v.type == LayerType.background)){
        if(this.l_bgs.includes(layerID)){
            // this._tmpLastFrameI = frameI;
            // this._lastWasBG = true;
            frameI = 0;
        }
        // else{
        //     if(this._lastWasBG)
        //     this._lastWasBG = false;
        // }
        
        if(!this.frames[frameI]){
            console.warn("Err: that frame does not exist");
            return;
        }
        let l = this.frames[frameI].getLayer(layerID);
        if(!l){
            console.warn("Err: that layer does not exist on that frame");
            return;
        }
        
        this.curFrame = this.frames[frameI];
        this.deselectLayers();
        this.curFrame.addRemoveCurLayer(l);
        // this.curFrame.curLayer = l;

        this.loadFrame();
        // timelinePanel.updateSel();
    }

    deselectLayers(){
        for(const f of this.frames){
            f.curLayers = [];
        }
        // timelinePanel.updateSel();
        getPanel<TimelinePanel>("timeline",p=>p.updateSel());
    }
    selectLayer(frame:number|Frame,_id:number,deselect=true,noUpdate=false){
        if(typeof frame == "number") frame = this.frames[frame];
        if(frame != this.curFrame){
            this.selectFrame(frame);
        }
        if(deselect) this.deselectLayers();
        frame.addCurLayer(frame.getLayer(_id,noUpdate));
    }
    getLayer(frame:number|Frame,_id:number,noUpdate=false){
        if(typeof frame == "number") frame = this.frames[frame];
        return frame.getLayer(_id,noUpdate);
    }
    selectFrame(frame:number|Frame,noUpdate=false){
        if(typeof frame == "number") frame = this.frames[frame];
        this.curFrame = frame;
        this.loadFrame(frame);
        if(!noUpdate) updatePanel("timeline");
    }
    

    applyChangeToAll(force=false,newChange=true){
        let wasChange = false;
        this.loopSel(l=>{
            let res = l.applyChange(force,newChange);
            if(res) wasChange = true;
        });
        return wasChange;
    }
    loopSel(call:(l:Layer)=>void){
        // if(!this.curFrame) return;
        for(const f of this.frames){
            for(const layer of f.curLayers){
                if(layer){
                    // layer.initCtxIfNeeded();
                    call(layer);
                }
            }
            f.curLayers = f.curLayers.filter(v=>v != null); // fix for weird glitch that may happen if layers get corrupted
        }
    }
    async loopSelAsync(call:(l:Layer)=>Promise<void>){
        // if(!this.curFrame) return;
        for(const f of this.frames){
            for(const layer of f.curLayers){
                if(layer){
                    // layer.initCtxIfNeeded();
                    await call(layer);
                }
            }
            f.curLayers = f.curLayers.filter(v=>v != null); // fix for weird glitch that may happen if layers get corrupted
        }
    }

    // nav
    // zoom = 1;
    // panX = 0;
    // panY = 0;
    // scrX = 0;
    // scrY = 0;

    loadFrame(f?:Frame){
        if(!f) f = this.curFrame;
        if(!f){
            console.warn("Err: no frame to load");
            return;
        }

        let list = [...this.cont.children];
        for(const c of list){
            this.cont.removeChild(c);
        }
        let {arr:all,arr1} = f.getAll();
        for(let i = 0; i < all.length; i++){
            let c = all[i];
            // let ref = this.gLayers[this.gLayers.length-i-1];
            // let ref = this.gLayers[i];
            // if(ref){
            //     console.log(ref.name+": "+ref._id,ref.hidden);
            //     if(ref.hidden) c.style.display = "none";
            //     else c.style.display = null;
            // }
            if(c) this.cont.appendChild(c);
        }
        for(const c of arr1){
            if(!c.v.ctx) continue;
            let can = c.v.ctx.canvas;
            let ref = c.v.lref;
            if(c.v.isEmpty()) if(can) can.style.display = "none";
            if(ref){
                if(ref.hidden) can.style.display = "none";
                else can.style.display = null;
            }
            // this.cont.appendChild(can);
        }
        // timelinePanel.update();
        // updatePanel("timeline");

        this.cont.appendChild(this.canObjArea);

        if(this.useEnabledChannels) this.postLoadFrame(arr1.map(v=>v.og?.ctx?.canvas).filter(v=>v != null));

        if(!this.hist._isBare && !_noUpdatePanel) getPanel<TimelinePanel>("timeline",p=>p.updateCurFrame());

        // fix aspect ratio for non-square canvas
        this.cont.style.aspectRatio = (this.w/this.h).toString();
        // update scaled grid if that's turned on
        if(settings.scaleMatchGrid) document.body.style.setProperty("--grid-size",`calc(100% / ${this.w} * 2)`);

        // update grid aspect css var
        document.body.style.setProperty("--grid-aspect",`${this.w} / ${this.h}`);

        // load preview in timeline panel
        this.loadTLPreview();
    }
    loadTLPreview(){
        let frame = this.curFrame;
        let l = frame?.curLayers[0];
        if(frame && l){
            getPanel<TimelinePanel>("timeline",p=>{
                let dp = p.d_preview;
                if(!dp) return;
                dp.textContent = "";

                if(!l.ctx) return;

                let c = document.createElement("canvas");
                c.width = this.w;
                c.height = this.h;
                let ctx = c.getContext("2d");
                ctx.drawImage(l.ctx.canvas,0,0);
                c.className = "can-w-bg"; // going to be used so it adds grid bg to it and is scaled based on setting automatically
                
                dp.appendChild(c);
            });
        }
    }

    postLoadFrame(arr:HTMLCanvasElement[]){
        let e = this.enabledChannels;
        let remapColor = 0;
        // if(e[0] == 0 && e[1] == 0 && e[2] == 0 && e[3] == 255) remapColor = 1;
        let ind = e.indexOf(255);
        remapColor = 2;
        
        for(const c of arr){
            let can = copyCan(c);
            let ctx = can.getContext("2d");
            // ctx.globalCompositeOperation = "multiply";
            // ctx.fillStyle = `rgba(${this.enabledChannels[0]},${this.enabledChannels[1]},${this.enabledChannels[2]},${this.enabledChannels[3]})`;
            // ctx.fillRect(0,0,can.width,can.height);
            // ctx.globalCompositeOperation = "source-over";

            let data = ctx.getImageData(0,0,can.width,can.height).data;
            for(let i = 0; i < data.length; i += 4){
                // data[i] = 255;
                // data[i+1] = 0;
                // data[i+2] = 0;

                if(remapColor == 2){
                    
                }
                if(remapColor == 1){
                    let amt = data[i+3];
                    data[i] = amt;
                    data[i+1] = amt;
                    data[i+2] = amt;
                    data[i+3] = 255;
                }
                else{
                    if(e[0] != 255) data[i] = e[0];
                    if(e[1] != 255) data[i+1] = e[1];
                    if(e[2] != 255) data[i+2] = e[2];
                    if(e[3] != 255) data[i+3] = e[3];
                }
            }
            ctx.putImageData(new ImageData(data,can.width,can.height),0,0);

            c.replaceWith(can);
        }
    }

    initialize(){
        this.hist.add(new HA_Full(this),this,true);
        this.onOpen();
    }

    panX = 0;
    panY = 0;
    zoom = 1;
    _lastScrollLeft = 0;
    _lastScrollTop = 0;
    updatePan(updateCur=true){
        this.cont.style.marginLeft = this.panX+"px";
        this.cont.style.marginTop = this.panY+"px";

        if(updateCur) this.updateCur(); // <-- if using fancy contrast cursor // may need to find a way to limit how many times this gets called
    }
    updateScroll(){
        let difX = this.overlay.scrollLeft-this._lastScrollLeft;
        let difY = this.overlay.scrollTop-this._lastScrollTop;
        if(difX){
            this.panX -= difX;
            this.updatePan();
        }
        if(difY){
            this.panY -= difY;
            this.updatePan();
        }
        
        this._lastScrollLeft = this.overlay.scrollLeft;
        this._lastScrollTop = this.overlay.scrollTop;
    }
    _updatedZoomThisFrame = false;
    updateZoom(){
        if(this._updatedZoomThisFrame) return;
        this._updatedZoomThisFrame = true;
        let farthest = 0.25; //0.1
        let closest = settings.maxZoom*this.w/3;
        if(this.zoom < farthest) this.zoom = farthest;
        else if(this.zoom > closest) this.zoom = closest;

        let box = this.mainCont;
        let can = this.cont;
        let overlay = this.overlay;

        // let r = can.getBoundingClientRect();
        let r = getRect(this.cont);
        // let ratX = (r.right-e.clientX)/can.clientWidth;
        // let ratY = (r.bottom-e.clientY)/can.clientHeight;
        let ratX = (r.right-cmx)/can.clientWidth;
        let ratY = (r.bottom-cmy)/can.clientHeight;
        ratX = Math.min(Math.max(0,ratX),1);
        ratY = Math.min(Math.max(0,ratY),1);
        ratX = 1-ratX;
        ratY = 1-ratY;
        ratX -= 0.5;
        ratY -= 0.5;

        let w1 = can.offsetWidth;
        let h1 = can.offsetHeight;

        can.style.width = (50*this.zoom)+"%";

        let w2 = can.offsetWidth;
        let h2 = can.offsetHeight;

        let amt = (w2-w1);
        let amtH = (h2-h1);

        this.panX -= ratX*amt;
        this.panY -= ratY*amtH;
        
        this.updatePan();

        let canRect = getRect(can);
        let boxRect = getRect(box);
        let edgeX2 = Math.abs(canRect.left-boxRect.left)*2;
        let edgeX3 = Math.abs(boxRect.right-canRect.right)*2;
        let nwX = can.offsetWidth+Math.max(edgeX2,edgeX3);
        let edgeY2 = Math.abs(canRect.top-boxRect.top)*2;
        let edgeY3 = Math.abs(boxRect.bottom-canRect.bottom)*2;
        let nwY = can.offsetHeight+Math.max(edgeY2,edgeY3);
        
        this.fake.style.width = (nwX)+"px";
        this.fake.style.height = (nwY)+"px";

        // let centerX = can.offsetLeft+can.offsetWidth/2;
        // let dif = centerX-(box.offsetLeft+box.offsetWidth/2);

        let oRatX = -this.panX/can.offsetWidth+0.5;
        let oRatY = -this.panY/can.offsetHeight+0.5;
        overlay.scrollLeft = (overlay.scrollWidth-overlay.clientWidth)*oRatX;
        overlay.scrollTop = (overlay.scrollHeight-overlay.clientHeight)*oRatY;
        this._lastScrollLeft = overlay.scrollLeft;
        this._lastScrollTop = overlay.scrollTop;

        this.updateCur();
        this.updateCurPos(cmx,cmy);
        // this.updateCurPos(e.clientX,e.clientY);
        
        // update size of canvas objs when zooming
        // for(const o of this.canObjs){
        //     o.update();
        // }

        // update onZoom for canObjs
        for(const o of this.canObjs){
            o.onZoom();
        }
    }
    resetView(){
        this.zoom = (this.h > this.w ? (this.w/this.h) : 1);
        this.updateZoom();
        this.panX = 0;
        this.panY = 0;
        this.updatePan();
        setTimeout(()=>this.updateZoom(),60);
    }
    add(useInit=true){
        let t = this;
        
        let pCont = document.createElement("div");
        this.mainCont = pCont;
        pCont.className = "project-cont";
        pCont.innerHTML = `
            <div class="can-cont">
                <!--<canvas class="can-base"></canvas>
                <canvas class="can-main"></canvas>
                <canvas class="can-sel"></canvas>-->
            </div>
            <div class="project-overlay">
            <div class="overlay-dummy"></div>
            </div>
        `;
        centerArea.appendChild(pCont);

        // document.body.insertBefore(pCont,document.body.children[0]);
        // this.base = pCont.querySelector<HTMLCanvasElement>(".can-base").getContext("2d");
        // this.main = pCont.querySelector<HTMLCanvasElement>(".can-main").getContext("2d");
        // this.selOv = pCont.querySelector<HTMLCanvasElement>(".can-sel").getContext("2d");

        // init cans
        this.tmp = document.createElement("canvas").getContext("2d",{willReadFrequently:settings.WRF});
        this.sel = document.createElement("canvas").getContext("2d",{willReadFrequently:settings.WRF});
        
        let list = [
            this.tmp,this.sel
        ];
        for(const c of list){
            c.canvas.width = this.w;
            c.canvas.height = this.h;
        }

        // init tmp can
        let tmp = this.tmp;

        tmp.fillStyle = "green";
        tmp.fillRect(0,0,this.w,this.h);

        tmp.globalCompositeOperation = "destination-atop";
        tmp.fillStyle = "red";
        tmp.beginPath();
        tmp.arc(80,60,30,0,Math.PI*2);
        tmp.arc(100,80,30,0,Math.PI*2);
        tmp.fill();

        // VISUAL / NAV
        let fake = pCont.querySelector(".overlay-dummy") as HTMLElement;
        let can = pCont.querySelector(".can-cont") as HTMLElement;
        let overlay = pCont.querySelector(".project-overlay") as HTMLElement;
        overlay.addEventListener("scroll",e=>{
            if(mouseDown[0]) this.updateScroll(); // only when mouse down so there isn't running twice
        });
        // let box = pCont;
        t.cont = can;
        t.overlay = overlay;
        t.fake = fake;

        // let panX = t.panX;
        // let panY = t.panY;
        // let zoom = t.zoom;
        // let panX = 0;
        // let panY = 0;
        // let zoom = 1;
        // let gWidth = this.w;
        // let gHeight = this.h;
        
        can.style.width = "50%";
        can.style.aspectRatio = (this.w/this.h).toString();

        // let hovElm = overlay;
        let hovElm = this.mainCont;

        document.body.addEventListener("wheel",e=>{
            if(!_overCanvas) return;
            
            if(!e.ctrlKey) return;
            e.preventDefault();

            this.updateCurPos(e.clientX,e.clientY);
    
            let v = -e.deltaY/1000*2;
            if(e.deltaY != Math.trunc(e.deltaY)){
                // pinch zooming
                v *= 8;
            }
            this.zoom *= (1+v);
        
            this.updateZoom();
        },{
            passive:false
        });
    
        this._lastScrollLeft = overlay.scrollLeft;
        this._lastScrollTop = overlay.scrollTop;
    
        document.body.addEventListener("wheel",e=>{
            if(!_overCanvas) return;
            
            if(e.ctrlKey) return;
            let scale = 0.35; //0.5
            let difX = (e.shiftKey ? e.deltaY || e.deltaX : e.deltaX)*scale;
            let difY = (e.shiftKey ? e.deltaX : e.deltaY)*scale;
            overlay.scrollBy({
                top:difY,left:difX,
                behavior:"instant"
            });
    
            
            let isQuickSettingsOpen = this.isQuickSettingsOpen();
            this.updateScroll();

            if(!isQuickSettingsOpen){
                this.updateCurPos(e.clientX,e.clientY);
                
                let m = calcMouse(new UniversalMouseEvent(e));
                mx = m.x;
                my = m.y;
                cmx = m.cx;
                cmy = m.cy;

                // fix cursor position not being alighed correctly sometimes when panning/scrolling
                this.updateCurPos(e.clientX,e.clientY);

                // be able to draw straight lines while just holding down left click and then scrolling
                if(mouseDown[0]) if(curTool){
                    onMouseMove(new UniversalMouseEvent(e));
                }
            }
            else{
                this.updateCurPosMXMY();
            }
        });
        hovElm.addEventListener("scroll",e=>{
            if(!_overCanvas){
                this.updateScroll();
                return;
            }
            overlay.scrollLeft = this._lastScrollLeft;
            overlay.scrollTop = this._lastScrollTop;
        });

        // add FileItem
        let fileItem = document.createElement("div");
        fileItem.className = "file-item";
        fileItem.innerHTML = `
            <div class="save-dot unsaved"></div>
            <div class="fileItem-name">${this.filename || "New File.qs"}</div>
            <div class="b-close"><img draggable="false" src="assets/icon/close.svg" alt=""></div>
        `;
        fileList.appendChild(fileItem);
        this.fileItem = fileItem;
        let overClose = false;
        fileItem.addEventListener("mousedown",e=>{
            if(overClose) return;
            if(e.button != 0) return;
            selectProject(t);
        });
        let b_close = fileItem.querySelector(".b-close") as HTMLElement;
        b_close.addEventListener("click",e=>{
            if(e.button != 0) return;
            closeProject(t);
        });
        b_close.addEventListener("mouseenter",e=>{
            overClose = true;
        });
        b_close.addEventListener("mouseleave",e=>{
            overClose = false;
        });

        files.push(this);

        if(useInit) this.initBaseFrame();
        
        selectProject(this);

        hovElm.addEventListener("mousemove",e=>{
            if(mouseDown[0]){
                // let r = t.cont.getBoundingClientRect();
                let r = getRect(t.cont);
                if(e.clientX < r.left) return;
                if(e.clientY < r.top) return;
                if(e.clientX > r.right) return;
                if(e.clientY > r.bottom) return;
                wasOverCanvas = true;
            }
        });

        this.resetView();
    }

    // 

    simpleDrawImage(img:HTMLImageElement,applyHist?:(p:Project)=>void){
        this.main.drawImage(img,0,0);
        endDCan();
        this.applyChangeToAll(true,true);
        if(applyHist) applyHist(this);
        else this.hist.add(new HA_CanCopy("Paste to layer",DrawMode.draw,HistIcon.draw));
        postEndDCan();
    }

    // 

    async addToRecents(){
        if(!recentsStore) return;
        if(!this.handle){
            console.warn("Couldn't added to recents, no file handle");
            return false;
        }
        let res = await addToRecentFiles(this.handle);
        return res;
    }

    _resize(w:number,h:number,ha:number,va:number,isCanvasOnly:boolean){
        let oldW = this.w;
        let oldH = this.h;
        this.w = w;
        this.h = h;
        let list = [
            "main","selOv","prev","sel","tmp"
        ];
        for(const name of list){
            let c = this[name] as CanvasRenderingContext2D;
            if(!c){
                console.warn("Err: couldn't find canvas while trying to resize project: ",name);
                continue;
            }
            let copy = copyCan(c.canvas);

            c.canvas.width = w;
            c.canvas.height = h;
            c.imageSmoothingEnabled = false;
            
            let spanW = w-oldW;
            let spanH = h-oldH;
            if(isCanvasOnly) c.drawImage(copy,spanW*ha,spanH*va);
            else c.drawImage(copy,0,0,w,h);
        }

        this.updateCur();
        this.updateCurPos(cmx,cmy);
        this.loadFrame(); // needed to update aspect ratio if it was changed
    }

    // edit actions
    edit = {
        selectAll:()=>{
            // probably is a little too expensive here to check if it's a full selection
            this.sel.fillStyle = selColStr;
            this.sel.fillRect(0,0,this.w,this.h);
            updateSelection();
            this.hist.add(new HA_Select(true));
        },
        deselectAll:(bare=false)=>{
            // same for this
            this.sel.clearRect(0,0,this.w,this.h);
            updateSelection();
            if(!bare) this.hist.add(new HA_DeselectAll());
        },
        duplicateSelection:()=>{
            let first = this.getFirstCurLayer();
            if(!first) return;
            if(first.isEmpty()) return;
            let bounds = this.edit.calcSelBounds();
            if(!bounds) return;

            this.edit.deselectAll(true);

            let ctx = createCan(bounds[2]-bounds[0]+1,bounds[3]-bounds[1]+1).getContext("2d");
            ctx.drawImage(first.ctx.canvas,-bounds[0],-bounds[1]);
            let o = new ImgCObj(bounds[0],bounds[1],ctx.canvas,false);
            selProject.addCanObj(o);
            selectTool(tools.find(v=>v instanceof PointerTool));

            this.hist.add(new HA_DuplicateSelection(o.serialize()));
        },
        calcSelBounds:()=>{
            if(!this.isSel) return null;
            let data8 = this.sel.getImageData(0,0,this.w,this.h).data;
            let data32 = new Uint32Array(data8.buffer);
            let i = 0;
            let l = this.w+1;
            let r = -1;
            let u = this.h+1;
            let b = -1;
            for(let y = 0; y < this.h; y++){
                for(let x = 0; x < this.w; x++){
                    if(data32[i]){
                        if(x < l) l = x;
                        else if(x > r) r = x;
                        if(y < u) u = y;
                        else if(y > b) b = y;
                    }
                    i++;
                }
            }
            return [l,u,r,b];
        },
        calcSelBoundsOrWhole:()=>{
            let bounds = this.edit.calcSelBounds();
            if(bounds) return bounds;
            return [0,0,this.w,this.h];
        },
        copySelection:async ()=>{
            let first = this.getFirstCurLayer();
            if(!first) return;
            if(first.isEmpty()) return;
            let bounds = this.edit.calcSelBounds();
            if(!bounds) return;
            
            let ctx = createCan(bounds[2]-bounds[0]+1,bounds[3]-bounds[1]+1).getContext("2d");
            ctx.drawImage(first.ctx.canvas,-bounds[0],-bounds[1]);
            
            let items:ClipboardItem[] = [];
            items.push(new ClipboardItem({
                "image/png":await getCanBlob(ctx),
                "text/plain":new Blob([saveClipboardData({x:bounds[0],y:bounds[1]})],{type:"text/plain"})
            }));

            navigator.clipboard.write(items);

            return bounds;
        },
        cutSelection:async ()=>{
            if(!this.canEdit()) return;
            let bounds = await this.edit.copySelection();
            if(!bounds) return;

            this.loopSel(l=>{
                if(l.isEmpty()) return;
                if(!l.canEdit()) return;
                l.ctx.clearRect(bounds[0],bounds[1],bounds[2]-bounds[0]+1,bounds[3]-bounds[1]+1);
            });

            this.hist.add(new HA_CutSelection(bounds));
            
            return true;
        },
        pasteSelection:async ()=>{
            if(!this.canEdit()) return;
            let items = await navigator.clipboard.read();
            for(const item of items){
                if(!item.types.length) return;
                console.log("ITEM",item);
                if(item.types.includes("image/png")){
                    let imgBlob = await item.getType("image/png");
                    let img = await loadImg(imgBlob);
                    if(!img){
                        alert("Failed to paste image from clipboard");
                        return;
                    }
                    let meta = (item.types.includes("text/plain") ? parseClipboardData(await (await item.getType("text/plain")).text()) : null);
                    if(meta == null) meta = {x:0,y:0};
                    startFinishableAction(new FA_PasteData(imgToCan(img),meta.x??0,meta.y??0));
                }
            }
        },
        rotateSelection:(cw=true,amt=Math.PI/2,anchorX=0.5,anchorY=0.5)=>{
            let bounds = this.edit.calcSelBoundsOrWhole();
            if(!bounds) return;

            let cx = Math.round((bounds[0]+bounds[2])*anchorX);
            let cy = Math.round((bounds[1]+bounds[3])*anchorY);

            let ctx2 = createCan(bounds[2]-bounds[0]+1,bounds[3]-bounds[1]+1).getContext("2d");
            ctx2.imageSmoothingEnabled = false;
            ctx2.drawImage(this.sel.canvas,-bounds[0],-bounds[1]);
            
            this.loopSel(l=>{
                if(!l.ctx) return;
                if(l.isEmpty()) return;
                
                let ctx = createCan(bounds[2]-bounds[0]+1,bounds[3]-bounds[1]+1).getContext("2d");
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(l.ctx.canvas,-bounds[0],-bounds[1]);

                this.hist.startBare();
                this.clearFromSelectionOrWhole();
                this.hist.endBare();

                this.main.translate(cx,cy);
                this.main.rotate(amt);

                this.main.drawImage(ctx.canvas,-Math.round(ctx.canvas.width/2),-Math.round(ctx.canvas.height/2));
                this.main.resetTransform();

                endDCan();
                postEndDCan();
            });

            // finish rotating selection
            this.hist.startBare(); // <-- since bare is true i'm not sure if these are needed
            this.edit.deselectAll(true);
            this.hist.endBare();
            
            this.sel.translate(cx,cy);
            this.sel.rotate(amt);

            this.sel.drawImage(ctx2.canvas,-Math.round(ctx2.canvas.width/2),-Math.round(ctx2.canvas.height/2));
            this.sel.resetTransform();

            updateSelection();
            
            bounds = this.edit.calcSelBoundsOrWhole();
            let tol = 5;
            this.applyEffectedInstant(bounds[0]-tol,bounds[2]+tol,bounds[1]-tol,bounds[3]+tol);
            correctCtx_general(this.sel,selCol);

            updateSelection();
            
            // 
            this.hist.add(new HA_RotateSel(cw,amt,anchorX,anchorY));
        },
        flipSelection:(x=1,y=1,anchorX=0.5,anchorY=0.5)=>{
            let bounds = this.edit.calcSelBoundsOrWhole();
            if(!bounds) return;

            let w = bounds[0]+bounds[2];
            let h = bounds[1]+bounds[3];
            let cx = Math.round(w*anchorX);
            let cy = Math.round(h*anchorY);

            let oddX = Math.floor(bounds[2]-bounds[0]+1) % 2 == 1;
            let oddY = Math.floor(bounds[3]-bounds[1]+1) % 2 == 1;
            
            let offX = 0;
            let offY = 0;

            if(oddX && y < 0 && x > 0){
                offX++;
            }
            if(oddY && x < 0 && y > 0){
                offY++;
            }
            
            this.loopSel(l=>{
                if(!l.ctx) return;
                if(l.isEmpty()) return;
                
                let ctx = createCan(bounds[2]-bounds[0]+1,bounds[3]-bounds[1]+1).getContext("2d");
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(l.ctx.canvas,-bounds[0],-bounds[1]);

                this.hist.startBare();
                this.clearFromSelectionOrWhole();
                this.hist.endBare();

                this.main.translate(cx+offX,cy+offY);
                this.main.scale(x,y);
                this.main.imageSmoothingEnabled = false;

                this.main.drawImage(ctx.canvas,-Math.ceil(ctx.canvas.width/2),-Math.ceil(ctx.canvas.height/2));
                this.main.resetTransform();

                endDCan();
                postEndDCan();
            });
            
            // 
            this.hist.add(new HA_FlipSel(x,y,anchorX,anchorY));
        },
    };
    // image / all frames in animation actions
    image = {
        resize:(w:number,h:number,ha:number,va:number,isCanvasOnly:boolean)=>{
            if(!this.canEdit()) return;
            
            if(w == this.w && h == this.h) return false;
            let oldW = this.w;
            let oldH = this.h;
            
            for(let i = 0; i < this.frames.length; i++){
                let f = this.frames[i];
                for(const [id,l] of f.layers){
                    if(!l.ctx) continue;
                    let copy = copyCan(l.ctx.canvas);

                    l.ctx.canvas.width = w;
                    l.ctx.canvas.height = h;
                    l.ctx.imageSmoothingEnabled = false;
                    
                    let spanW = w-oldW;
                    let spanH = h-oldH;
                    if(isCanvasOnly) l.ctx.drawImage(copy,spanW*ha,spanH*va);
                    else l.ctx.drawImage(copy,0,0,w,h);
                }
            }

            this._resize(w,h,ha,va,isCanvasOnly);

            this.hist.add(new HA_Resize(w,h,ha,va,isCanvasOnly));

            return true;
        }
    };

    // info actions
    info = {
        /**
         * Total Parts refers to the total number of non-empty cells in the entire project.
         */
        getTotalParts:()=>{
            let amt = 0;
            for(const f of this.frames){
                for(const [id,l] of f.layers){
                    if(l.isEmpty()) continue;
                    amt++;
                }
            }
            return amt;
        }
    };
    
    // project info meta/stats
    time = 0; // time spent on project in ms
    dateLastSaved:string; // not serialized

    parseProjectInfo(data:any){
        if(!data) return;

        this.time = data.time;
    }

    onSave(){
        console.log(".....saved");

        let last = (this.dateLastSaved ? new Date(this.dateLastSaved).getTime() : null);
        let date = new Date();
        this.dateLastSaved = date.toISOString();
        let dif = (last ? date.getTime()-last : 0);
        dif = Math.min(dif,900000); // 15 min

        console.log(this.dateLastSaved,date,dif,this.time);

        this.time += dif;
    }
    onOpen(){
        console.log("...opened");

        this.dateLastSaved = new Date().toISOString();
    }

    // 
    showRenameLayers(){
        let ids:number[] = [];
        this.loopSel(l=>{
            ids.push(l.lref._id);
        });
        if(ids.length == 0) return;
        menuAPI.open(new RenameLayerMenu(...ids));
    }
    renameLayers(usePattern:boolean,...data:RenameLayerData[]){
        if(usePattern && !data[0]){
            alert("Error, can't rename layers with an empty name");
            return;
        }
        
        for(let i = 0; i < data.length; i++){
            let dat = data[i];
            // let l = this.gLayers[dat.id];
            let l = this.gLayers.find(v=>v._id == dat.id); // not sure if this is necessary or not
            if(usePattern){
                let pat = dat.name.includes("/#") ? "/#" : "#";
                let pat2 = dat.name.includes("/&") ? "/&" : "&";
                l.name = dat.name.replaceAll(pat,(data.length-i).toString()).replaceAll(pat2,l.name);
                dat.name = l.name; // for the hist
            }
            else l.name = dat.name;
        }

        selProject.hist.add(new HA_RenameLayer(data));

        updatePanel("timeline");
    }
    moveLayersBy(amt=1){
        let layers = this.getCurLayers();

        let dir = (amt > 0 ? 1 : -1);
        for(let k = 0; k < Math.abs(amt); k++){
            for(const l of layers){
                // sort gLayers
                let i = this.gLayers.indexOf(l.lref);
                this.gLayers.splice(i,1);
                i += dir;
                if(i < 0) i = 0;
                if(i >= this.gLayers.length+1) i = this.gLayers.length;
                this.gLayers.splice(i,0,l.lref);

                // sort curLayers
                i = l.frame.curLayers.indexOf(l);
                l.frame.curLayers.splice(i,1);
                i += dir;
                if(i < 0) i = 0;
                if(i >= l.frame.curLayers.length+1) i = l.frame.curLayers.length;
                l.frame.curLayers.splice(i,0,l);

                // sort layers (FOR NOW EVEN THOUGH IT'S REALLY SLOW, NEED TO FIX ALL INSTANCES OF LOOPING THROUGH FRAME.LAYERS)
                let a = [...l.frame.layers];
                l.frame.layers.clear();
                let tmp:{i:number,v:Layer}[] = [];
                for(const [_id,l2] of a){
                    tmp.push({
                        i:this.gLayers.indexOf(l2.lref),
                        v:l2
                    });
                }
                tmp.sort((a,b)=>a.i-b.i);
                let ar2 = tmp.map(v=>v.v);
                for(const l2 of ar2){
                    l.frame.layers.set(l2.lref._id,l2);
                }
            }
        }
        
        // OLD METHOD
        // let move_amt = amt * 2;
        
        // let layers = this.getCurLayers();
        // let order = this.gLayers.map((v,i)=>{
        //     return {
        //         v,i
        //     };
        // });
        // for(const l of layers){
        //     let o = order.find(v=>v.v == l.lref);
        //     if(!o){
        //         console.warn("Warn: skipped layer in reordering, this could cause unexpected results");
        //         continue;
        //     }
        //     o.i += move_amt;
        // }
        // console.log("ORDER:",order.map(v=>v.v.name));
        // order = order.sort((a,b)=>a.i-b.i);
        // console.log("ORDER 2:",order.map(v=>v.v.name));
        // this.gLayers = order.map(v=>v.v);

        this.hist.add(new HA_MoveLayers(amt,layers.length));
        this.loadFrame();

        updatePanel("timeline");
    }
    clearLayers(){
        let times = 0;
        selProject.loopSel(l=>{
            if(l.clear()) times++;
        });
        if(times != 0) selProject.hist.add(new HA_ClearLayer(false,times));
    }
    clearLayersPixels(){
        let times = 0;
        selProject.loopSel(l=>{
            if(l.clearPixels()) times++;
        });
    }
    clearFromSelection(){
        let times = 0;
        this.loopSel(l=>{
            if(l.clearSelectedArea()) times++;
        });
        if(times != 0) this.hist.add(new HA_ClearFromSelection());
    }
    clearFromSelectionOrWhole(){
        if(this.isSel) this.clearFromSelection();
        else this.clearLayersPixels(); // <-- not sure if this is great to have here all the time or should be based on a flag
    }

    // 
    lockAllEdits = false;
    startLockEdits(){
        this.lockAllEdits = true;
        console.log(" --- STARTED LOCKING");
    }
    endLockEdits(){
        this.lockAllEdits = false;
        console.log(" --- ENDED... LOCKING");
    }

    // 
    pickColor(x:number,y:number,noUpdate=false):number[]|undefined{
        x = Math.floor(x);
        y = Math.floor(y);
        
        let p = this;
        if(x < 0) return;
        if(y < 0) return;
        if(x >= p.w) return;
        if(y >= p.h) return;
        let l = p.getFirstCurLayer();
        if(!l) return;
        if(!l.ctx) return;
        let data = l.ctx.getImageData(x,y,1,1).data;
        if(!noUpdate){
            if(data[3] == 0) return;
            selProject.setColStr(`rgb(${data[0]},${data[1]},${data[2]},255)`,data[3]/255)
            updatePanel("color");
        }

        return [...data];
    }

    // adjustments
    adjustPixels(data:ColorChannelData[]){
        // let ctx = copyCan(this.sel.canvas).getContext("2d");
        // ctx.globalCompositeOperation = "source-in";
        // ctx.fillStyle = "rgba(20,0,0,255)";
        // ctx.fillRect(0,0,this.w,this.h);
        
        // this.main.drawImage(ctx.canvas,0,0);

        // endDCan(undefined,undefined,DrawMode.add);
        // postEndDCan();

        console.log("ADJUST PIXELS:",data.filter(v=>v.use));

        let selBuf = this.isSel ? this.sel.getImageData(0,0,this.w,this.h).data : null;
        
        this.loopSel(l=>{
            l.initCtxIfNeeded();
            
            // let tctx = copyCan(l.ctx.canvas).getContext("2d");
            // tctx.globalCompositeOperation = "source-in";
            // tctx.drawImage(ctx.canvas,0,0);

            // // l.ctx.globalCompositeOperation = "source-atop";
            // // l.ctx.drawImage(ctx.canvas,0,0);
            // l.ctx.globalCompositeOperation = "lighten";
            // l.ctx.drawImage(tctx.canvas,0,0);
            // l.ctx.globalCompositeOperation = "source-over";

            // let tctx = copyCan(this.sel.canvas).getContext("2d");
            // tctx.globalCompositeOperation = "source-in";
            // tctx.drawImage(l.ctx.canvas,0,0);

            let buf = l.ctx.getImageData(0,0,this.w,this.h).data;
            for(let i = 0; i < buf.length; i += 4){
                if(this.isSel) if(selBuf[i+3] == 0) continue;
                for(let j = 0; j < data.length; j++){
                    let c = data[j];
                    if(!c.use) continue;
                    let ind = i+j;

                    let v = c.v;
                    switch(c.op){
                        case ActionOp.set:
                            buf[ind] = v;
                            break;
                        case ActionOp.add:
                            buf[ind] += v;
                            break;
                        case ActionOp.sub:
                            buf[ind] -= v;
                            break;
                        case ActionOp.mult:
                            buf[ind] *= v;
                            break;
                        case ActionOp.div:
                            buf[ind] /= v;
                            break;
                        case ActionOp.inv:
                            buf[ind] = 255-buf[ind];
                            break;
                    }
                }
            }

            l.ctx.putImageData(new ImageData(buf,this.w,this.h),0,0);

            l.applyChange(true,true);
        });
        this.loadFrame();

        this.hist.add(new HA_AdjustPixels(data));
    }
}

// VERSIONING
let l_ver = document.querySelector(".l-ver");
async function loadVersion(){
    let text = await (await fetch("changelog.md")).text();
    let ar = text.split("\n###");
    let last = ar.pop();

    let lines = last.split("\n").map(v=>v.trim()).filter(v=>v != null && v != "");
    l_ver.textContent = "v"+lines[0];
}
loadVersion();

// Main Tick
let deltaScale = 1;
let _lastTickTime = 0;
let _mainFPS = 0;
// let slowTickCnt = 30;
function mainTick(){
    requestAnimationFrame(mainTick);
    
    let time = performance.now();
    let dt = time-_lastTickTime;
    _mainFPS = (16.667/dt*60);
    _lastTickTime = time;
    deltaScale = dt/16.667;

    let panels = _getPanelList();
    for(const panel of panels){
        panel.tick();
    }

    // slowTickCnt--;
    // if(slowTickCnt < 0){
    //     slowTickCnt = 30;
    //     selProject?.updateCur(); // to cover most cases if it gets glitched or isn't correct, for fancy contrast cursor
    // }

    if(selProject){
        let p = selProject;
        p._updatedZoomThisFrame = false;

        if(false) if(p.constantDrawMode){ // temporarily disabled
            let mode = p.constantDrawMode;
            if(mode == DrawMode.draw){
                altKey = false;
                ctrlKey = false;
                shiftKey = false;
            }
            else if(mode == DrawMode.erase){
                altKey = true;
                ctrlKey = false;
                shiftKey = false;
            }
            else if(mode == DrawMode.select){
                altKey = false;
                ctrlKey = true;
                shiftKey = false;
            }
            else if(mode == DrawMode.erase_select){
                altKey = true;
                ctrlKey = true;
                shiftKey = false;
            }
        }
    }
}
setTimeout(()=>{
    mainTick();
},500);

window.addEventListener("beforeunload",e=>{
    if(!files.some(v=>v._saved)){
        e.preventDefault();
        alert("prevent");
    }
});