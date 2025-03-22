enum HistIcon{
    none,
    full,
    draw,
    erase,
    line,
    select,
    pointer,select_pointer,
    fill,
    shape,
    spline,
    eye_dropper,
    
    hide,show,lock,unlock,
    add_global_layer,add_bg_layer,add_frame,
    delete_global_layer,delete_bg_layer,delete_frame,

    pixel,
    hex,

    clear,
    delete,

    cancel,
    finish,

    play,pause,

    rename,
    up,down,left,right,
}
const allIcons = {
    full:"assets/icon/icon.svg",
    draw:"assets/tools/draw.svg",
    erase:"assets/tools/erase.svg",
    line:"assets/tools/line.svg",
    select:"assets/tools/select.svg",
    pointer:"assets/tools/pointer.svg",
    select_pointer:"assets/tools/select_pointer.svg",
    fill:"assets/tools/fill4.svg",
    shape:"assets/tools/shape.svg",
    spline:"assets/tools/spline2.svg",
    eye_dropper:"assets/tools/eye_dropper.svg",

    hide:"assets/editor/hidden.svg",
    show:"assets/editor/visible.svg",
    lock:"assets/editor/locked.svg",
    unlock:"assets/editor/unlocked.svg",

    add_global_layer:"assets/editor/new_global_layer_2.svg",
    add_bg_layer:"assets/editor/new_bg_layer_2.svg",
    add_frame:"assets/animation/add_frame.svg",
    delete_global_layer:"assets/animation/delete_global_layer.svg",
    delete_bg_layer:"assets/animation/delete_bg_layer.svg",
    delete_frame:"assets/animation/delete_frame.svg",
    
    pixel:"assets/editor/pixel.svg",
    hex:"assets/editor/hex.svg",

    clear:"assets/icon/clear.svg",
    delete:"assets/icon/delete.svg",
    cancel:"assets/icon/delete.svg",
    finish:"assets/editor/finish.svg",

    play:"assets/animation/play.svg",
    pause:"assets/animation/pause.svg",

    rename:"assets/editor/rename.svg",
    up:"assets/editor/up.svg",
    down:"assets/editor/down.svg",
    left:"assets/editor/left.svg",
    right:"assets/editor/right.svg",
};

class BareStackPiece{
    constructor(ctrlKey:boolean,shiftKey:boolean,altKey:boolean){
        this.ctrlKey = ctrlKey;
        this.shiftKey = shiftKey;
        this.altKey = altKey;
    }
    ctrlKey:boolean;
    shiftKey:boolean;
    altKey:boolean;
}

class Hist{
    constructor(p:Project){
        this.list = [];
        this.i = -1;
        this.p = p;
    }
    p:Project;
    list:HistAction[];
    i:number;
    fullFreq = 4;
    n = 0;
    // _freqCnt = 0;

    _isBare = false;
    restoring = false;
    // toggleBare(){
    //     this._isBare = !this._isBare;
    // }

    lastCtrlKey = false;
    lastShiftKey = false;
    lastAltKey = false;

    bareStack:BareStackPiece[] = [];
    startBare(ha?:HistAction){
        if(!ha) ha = this.curHA();
        this._isBare = true;
        this.lastCtrlKey = ctrlKey;
        this.lastShiftKey = shiftKey;
        this.lastAltKey = altKey;
        // if(!ha) ha = this.curHA();
        if(!ha) return;
        ctrlKey = ha.ctrlKey;
        shiftKey = ha.shiftKey;
        altKey = ha.altKey;
        this.bareStack.push(new BareStackPiece(ctrlKey,shiftKey,altKey));
    }
    endBare(){
        if(!this.bareStack.length){
            this._isBare = false;
            return;
        }
        let p = this.bareStack.pop();
        ctrlKey = p.ctrlKey;
        shiftKey = p.shiftKey;
        altKey = p.altKey;
        if(this.bareStack.length == 0) this._isBare = false;
        // this._isBare = false;
        // ctrlKey = this.lastCtrlKey;
        // shiftKey = this.lastShiftKey;
        // altKey = this.lastAltKey;
    }

    curHA(){
        return this.list[this.i];
    }

    add(a:HistAction,p=selProject,isInitial=false){
        if(this._isBare) return;
        if(this.restoring) return; // might only need this one but this is new so I'm not sure
        a.save(p);
        this.list.splice(this.i+1,0,a);
        // historyPanel.add(a);
        if(settings.disableForwardHistory && this.i+1 < this.list.length-1){
            this.list.splice(this.i+2);
            this.i++;
            updatePanel("history");
        }
        else{
            getPanel<HistoryPanel>("history",p=>p.add(a));
            this.i++;
        }

        if(a.canBeFullState()) if(this.list.length % this.fullFreq == 0){
            a.full = new HistFullState(this.p);
            if(p.curFinishableAction) a.setFA(p.curFinishableAction);
            console.log("...saved new full state");
        }

        if(!isInitial) p.setSaved(false); // <-- when something is added to the history the project should be marked as unsaved
        // this._freqCnt++;
        // if(this._freqCnt >= )

        a.hn = this.n;
        this.n++; // Hist state id number

        // update TL preview just in case (hopefully this doesn't hurt performance too bad! but when drawing and stuff it'll get run double because it get's called on loadFrame, postEndDCan, and here, actually probably shouldn't need postEndDCan if I have it here!) - it shouldn't but maybe if you're doing some kind of macro that adds massively to the history, then i'd need to add a flag that you set to make sure GUI updates don't happen when it's in a sort of "headless" state
        p.loadTLPreview();

        // update mini preview if paused
        MiniPreviewPanel.updateIfPaused();
    }

    _goto(i:number){
        if(this.p.lockAllEdits) return;
        
        let lastI = this.i;
        let oldW = this.p.w;
        let oldH = this.p.h;
        
        this.i = i;
        if(this.i < 0){
            // console.warn("Err: can't undo further");
            this.i = 0;
            return;
        }
        if(this.i > this.list.length-1){
            // console.warn("Err: can't redo further");
            this.i = this.list.length-1;
            return;
        }
        
        // 

        // let initial = this.list[0];
        let initial:HistAction = null;
        let initI = 0;
        for(let j = i; j >= 0; j--){
            let ha = this.list[j];
            if(!ha) break;
            if(ha.full){
                initial = ha;
                initI = j;
                // console.log("found initial: ",j);
                break;
            }
        }
        if(!initial){
            console.warn("Err: no initial state was found, bailing...");
            return;
        }
        if(!initial.full){
            console.warn("Err: initial state was not a full state");
            return;
        }
        this.restoring = true;
        initial.full.restore();

        { // these are things that are from HistAction.restore in the super call which doesn't get called for ones with full states on them
            if(initial.fa) restartFinishableAction(initial.fa);
            if(initI+1 > i){
                initial.onGoTo();
            }
        }

        for(let j = initI+1; j <= i; j++){
            let a = this.list[j];
            // this.p._COId = a._COId;
            a.restore(this.p);
        }
        if(false) for(let j = 0; j <= i; j++){
            // await wait(1500);
            // console.log("RESTORE: ",j);
            // updatePanel("timeline"); // <-- update timeline must do something important for undo to work correctly
            this.list[j].restore(this.p);
        }
        // historyPanel.updateI();

        if(this.i < lastI){
            this.list[lastI].onUndoFrom();
        }

        this.restoring = false;

        getPanel<HistoryPanel>("history",p=>p.updateI());
        
        if(this.p.w != oldW || this.p.h != oldH){
            this.p.updateCur(); // update the preview cursor to match the new size // TODO (done) - make this so it only gets called if the size changed
            this.p.updateCurPos(cmx,cmy);
        }

        // vvv -- for this should I make a new method on HistAction for postRestore and put these in there? because sometimes super.restore() is called at the beginning and then it misses because stuff happens after
        let ha = this.curHA();
        if(ha.fa) ha.fa.update();

        // 
        MiniPreviewPanel.updateIfPaused();
    }
    undo(){
        if(this.p.lockAllEdits) return;
        if(false) if(this.list[this.i].hasQuickUndo()){
            this.i--;
            if(this.i < 0){
                this.i = 0;
                return;
            }
            this.list[this.i].restore(this.p);
            // historyPanel.updateI();
            getPanel<HistoryPanel>("history",p=>p.updateI());
            return;
        }
        this._goto(this.i-1);
        updatePanel("timeline");
    }
    redo(){
        if(this.p.lockAllEdits) return;
        // this._goto(this.i+1);
        let oldW = this.p.w;
        let oldH = this.p.h;

        this.i++;
        if(this.i > this.list.length-1){
            this.i = this.list.length-1;
            return;
        }
        this.restoring = true;
        this.list[this.i].restore(this.p);
        for(let i = this.i+1; i < this.list.length; i++){ // <-- need to loop through all forward hist actions and invalidate all the future ones so issues like restoring to old data doesn't happen
            let ha = this.list[i];
            if(ha.full) ha.invalidateFullState();
            // TODO - I need to add when redoing to an HA that in invalid then create a new full state on it? or maybe if it mod the freq is 0
            // would be cool to have a little red flag on the history panel item to show that it's invalid and then redoing past it it flips to green again
            // "this history action is a 'forward future action' and may no longer be valid anymore" - should mark a flag when redoing to ALL HA's after it's point
            // - deleting layers (can be) and frames (are) invalid in forward future actions
            // (actually this code should probably be on the Hist.add not Hist.redo)
        }
        // historyPanel.updateI();
        this.restoring = false;
        getPanel<HistoryPanel>("history",p=>p.updateI());
        updatePanel("timeline");
        
        if(this.p.w != oldW || this.p.h != oldH){
            this.p.updateCur(); // update the preview cursor to match the new size
            this.p.updateCurPos(cmx,cmy);
        }

        if(this.p.curFinishableAction) this.p.curFinishableAction.update(); // <-- added so that if FAs have an update method it should always refresh properly when undo/redo

        // 
        MiniPreviewPanel.updateIfPaused();
    }
}

class HFS_Frame{
    constructor(){
        this.layers = new Map();
    }
    layers:Map<number,HFS_Layer>;
}
class HFS_Layer{
    constructor(ctx:CanvasRenderingContext2D,_empty:boolean,hn:number){
        if(!settings.useCanvasStoring) this.data = ctx ? ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height).data : null;
        else if(ctx){
            let c = ctx.canvas;
            let can = createCan(c.width,c.height);
            let ct = can.getContext("2d");
            ct.drawImage(c,0,0);
            this.ctx = ct;
        }
        this._empty = _empty;
        this.hn = hn;
    }
    data:Uint8ClampedArray;
    ctx:CanvasRenderingContext2D;
    hn:number;

    spannedBy:HFS_Loc;
    spans:HFS_Loc[];
    spanDir:number;

    _empty:boolean;
}
class HFS_Loc{
    constructor(frameI:number,layerID:number){
        this.frameI = frameI;
        this.layerID = layerID;
    }
    frameI:number;
    layerID:number;
}
class HFS_LRef{
    constructor(id:number,name:string,type:LayerType,hidden:boolean,locked:boolean){
        this.id = id;
        this.name = name;
        this.type = type;
        this.hidden = hidden;
        this.locked = locked;
    }
    id:number;
    name:string;
    type:LayerType;
    hidden:boolean;
    locked:boolean;
}
class HistFullState{
    constructor(p:Project){
        this.p = p;
        this.save();
    }
    p:Project; // this is only a reference and not reflective at this point in time

    // 
    w:number;
    h:number;
    cur:HFS_Loc[];
    curFrameI:number;
    frames:HFS_Frame[];
    _saved:boolean;
    // filename:string;
    gLayers:HFS_LRef[];
    l_globals:number[];
    l_bgs:number[];
    cp:ColorPaletteSave;

    // sel:Uint8ClampedArray;
    sel:CanvasRenderingContext2D;
    isSel:boolean;

    // canvas objs
    canObjs:any[];
    selCOs:number[];
    _COId:number;

    save(){
        let p = this.p;
        if(!p){
            console.warn("Err: saving full state of project, project not found");
            return;
        }
        // base attributes
        this.w = p.w;
        this.h = p.h;
        this._saved = p._saved;
        // this.filename = p.filename;
        // this.sel = p.sel.getImageData(0,0,p.w,p.h).data;
        let selCtx = createCan(p.w,p.h).getContext("2d");
        selCtx.drawImage(p.sel.canvas,0,0);
        this.sel = selCtx;
        this.isSel = p.isSel;
        this.l_globals = [...p.l_globals];
        this.l_bgs = [...p.l_bgs];
        this.curFrameI = p.curFrame?.getI();

        // color palette
        if(p.cp) this.cp = p.cp.save();

        // canvas objects
        this.canObjs = p.canObjs.filter(v=>!v.skipSave()).map(v=>v.serialize());
        this.selCOs = [];
        for(const c of p.selCOs){
            this.selCOs.push(c._id);
        }
        this._COId = p._COId;

        // gLayers
        this.gLayers = [];
        for(const l of p.gLayers){
            this.gLayers.push(new HFS_LRef(l._id,l.name,l.type,l.hidden,l.locked));
        }

        // current frames & layers
        this.cur = [];
        for(let i = 0; i < p.frames.length; i++){
            let f = p.frames[i];
            for(const l of f.curLayers){
                this.cur.push(new HFS_Loc(i,l.lref._id));
            }
        }

        // frames & layers
        this.frames = [];
        for(let i = 0; i < p.frames.length; i++){
            let f = p.frames[i];
            let frame = new HFS_Frame();
            for(const [id,l] of f.layers){
                // let layer = new HFS_Layer(l.ctx,l.isEmpty());
                let layer = (!l.isEmpty() ? new HFS_Layer(l.ctx,l.isEmpty(),l.hn) : new HFS_Layer(null,true,l.hn));
                if(l.spannedBy) layer.spannedBy = l.spannedBy.h_getLoc();
                if(l.spans){
                    layer.spanDir = l.spanDir;
                    layer.spans = l.spans.map(v=>v.h_getLoc());
                }
                frame.layers.set(id,layer);
            }
            this.frames.push(frame);
        }
    }
    restore(){
        let p = selProject;
        p.hist.startBare(p.hist.curHA());

        p.clearPrev(); // <-- added to fix FAs not being able to clean up when undoing before the start
        
        // base attributes
        p.w = this.w;
        p.h = this.h;
        p.setSaved(this._saved);
        // p.filename = this.filename;
        // p.sel.putImageData(new ImageData(this.sel,p.w,p.h),0,0);
        p.sel.canvas.width = p.w;
        p.sel.drawImage(this.sel.canvas,0,0);
        updateSelection(true);
        p.isSel = this.isSel;
        p.l_globals = [...this.l_globals];
        p.l_bgs = [...this.l_bgs];

        // color palette
        if(this.cp) p.cp.restore(this.cp);
        else p.cp = null;

        // gLayers
        p.gLayers = [];
        for(const l of this.gLayers){
            p.gLayers.push(new LayerRef(l.id,l.name,l.type,l.hidden,l.locked));
        }

        // canvas objects
        p.canObjArea.textContent = "";
        while(p.canObjs.length != 0){
            p.removeCanObj(p.canObjs[0]);
        }
        p.selCOs = [];
        p.hoverCO = null;
        // p._COId = this._COId; // <-- temp for now
        for(let i = 0; i < this.canObjs.length; i++){
            let c = this.canObjs[i];
            let o = CanvasObj.createFrom(c);
            if(!o){
                console.warn("couldn't restore canvas object: ",c);
                continue;
            }
            o.deserialize(c);
            p.addCanObj(o,o._id);
            if(this.selCOs.includes(o._id)) o.select();
            else o.deselect();
        }

        // frames & layers
        p.frames = [];
        p.curFrame = null;
        let curHA = p.hist.list[p.hist.i];
        for(const f of this.frames){
            let frame = new Frame(p);
            for(const [id,l] of f.layers){
                let layer = new Layer(p.gLayers.find(v=>v._id == id),p,frame);
                layer._setEmpty(l._empty);
                if(!l._empty) layer.initCtxIfNeeded();
                if(layer.ctx){
                    layer.ctx.canvas.width = p.w;
                    layer.ctx.canvas.height = p.h;
                }
                if(!layer.isEmpty()){
                    if(settings.useCanvasStoring){
                        if(l.ctx){
                            if(settings.dontDrawUnchanged ? (l.hn??p.hist.n >= curHA.hn) : true) layer.ctx.drawImage(l.ctx.canvas,0,0);
                            else console.log("SKIPPED");
                        }
                    }
                    else{
                        if(l.data) layer.ctx.putImageData(new ImageData(l.data,p.w,p.h),0,0);
                    }
                }
                frame.layers.set(id,layer);
            }
            p.frames.push(frame);
        }

        // spans
        let i1 = 0;
        for(const f of this.frames){
            let frame = p.frames[i1];
            for(const [id,l] of f.layers){
                let layer = frame.layers.get(id);
                if(l.spannedBy){
                    let loc = l.spannedBy;
                    layer.spannedBy = p.frames[loc.frameI].layers.get(loc.layerID);
                }
                else if(l.spans.length){
                    layer.spanDir = l.spanDir;
                    for(const s of l.spans){
                        layer.spans.push(p.frames[s.frameI].layers.get(s.layerID));
                    }
                }
            }
            i1++;
        }
        
        // current frames & layers
        if(this.curFrameI != null) p.curFrame = p.frames[this.curFrameI];
        for(const loc of this.cur){
            let f = p.frames[loc.frameI];
            f.curLayers.push(f.layers.get(loc.layerID));
        }

        p.hist.endBare();

        // update
        p.loadFrame(p.curFrame);
        // timelinePanel.load();
        // updatePanel("timeline",p=>p.load());
        // loadPanel("timeline");

        updatePanel("color"); // <-- needed for restoring color palette
    }
}
class HistAction{
    constructor(label:string,icon:HistIcon){
        this.label = label;
        this.icon = icon;
    }
    label:string;
    icon:HistIcon;
    cur:HFS_Loc[];
    curFrameI:number;
    hn:number; // Hist state id number
    ctrlKey:boolean;
    shiftKey:boolean;
    altKey:boolean;
    _COId:number;

    full:HistFullState;
    _invalidFullState = false;

    fa?:FinishableAction;
    isStartFA = false;
    setFA(fa:FinishableAction,isStart=false){
        // if(this.fa) this.fa.cancel();
        this.fa = fa;
        this.isStartFA = isStart;
    }
    updateFA(fa:FinishableAction){
        // this.fa = fa;
    }
    // FAs?:FinishableAction[] = [];
    // setFAS(FAs:FinishableAction[]){
    //     // if(this.fa) this.fa.cancel();
    //     for(const fa of this.FAs){
    //         fa.cancel();
    //     }
    //     // this.fa = fa;
    //     this.FAs = [...FAs];
    // }

    hasQuickUndo(){
        return false;
    }
    quickUndo(p:Project):this{return this}

    onGoTo(){}

    canBeFullState(){
        return true;
    }

    onUndoFrom(){
        if(this.isStartFA) if(this.fa != null){
            this.fa.cancel();
        }
        // for(const fa of this.FAs){
        //     fa.cancel();
        // }
    }

    isInvalidInFutureHistory(){
        return false;
    }
    invalidateFullState(){
        return;
        this.full = null;
        this._invalidFullState = true;
    }

    save(p:Project){
        if(this.cur != null) return;
        this.curFrameI = p.curFrame?.getI();
        this.cur = [];
        for(let i = 0; i < p.frames.length; i++){
            let f = p.frames[i];
            for(const l of f.curLayers){
                this.cur.push(new HFS_Loc(i,l.lref._id));
            }
        }
        if(p.curFinishableAction) this.updateFA(p.curFinishableAction);

        this.ctrlKey = ctrlKey;
        this.shiftKey = shiftKey;
        this.altKey = altKey;
        this._COId = p._COId;
        
        return this;
    }
    restore(p:Project){
        p.deselectLayers();

        // let lastCtrlKey = ctrlKey;
        // let lastShiftKey = shiftKey;
        // let lastAltKey = altKey;
        ctrlKey = this.ctrlKey;
        shiftKey = this.shiftKey;
        altKey = this.altKey;
        
        if(this.curFrameI != null) p.curFrame = p.frames[this.curFrameI];
        for(const loc of this.cur){
            let f = p.frames[loc.frameI];
            if(!f) continue;
            // f.curLayers.push(f.layers.get(loc.layerID));
            f.curLayers.push(f.getLayer(loc.layerID,true));
        }
        p.loadFrame();
        if(!this.full) p.setSaved(false);
        if(this.fa) restartFinishableAction(this.fa);
        // for(const fa of this.FAs){
        //     restartFinishableAction(fa);
        // }
        if(p.hist.i == p.hist.list.indexOf(this)){
            this.onGoTo();
        }

        if(this.fa) curTool.loadSettings(); // <-- fix for when undoing finalizing spline and going back into the unfinished FA, it wouldn't readd the buttons for Finish/Cancel

        // ctrlKey = lastCtrlKey;
        // shiftKey = lastShiftKey;
        // altKey = lastAltKey;

        return this;
    }
}

class HistoryPanel extends Panel{
    constructor(loc:PanelLoc,add=false){
        super(loc,add,false,true);
    }
    private list:HTMLElement;
    private dragging = false;
    private autoMoveDown = true;
    getId(): string {
        return "history";
    }
    getName(): string {
        return "History Panel";
    }

    load(): void {
        this.init();
        this.genHeader("History");
        this.genBody();

        let list = document.createElement("div");
        list.className = "d-hist";
        this.body.appendChild(list);
        this.list = list;
        
        this.update();
    }
    _addItem(a:HistAction,i:number){
        let item = document.createElement("div");
        item.className = "hist-item cur";
        item.innerHTML = `
            <div class="h-icon">${a.icon == HistIcon.none ? "" : `<img src="${allIcons[HistIcon[a.icon]]}">`}</div>
            <!--<div class="h-icon">${a.icon == HistIcon.none ? "" : `<img src="${allIcons[HistIcon[a.icon]] ?? "assets/tools/"+a.icon+".svg"}`}"></div>-->
            <div>${a.label}</div>
        `;
        if(!this.list) this.load();
        this.list.insertBefore(item,this.list.children[selProject.hist.i+1]);
        // if(this.body.scrollHeight <= this.body.offsetHeight) this.autoMoveDown = true;
        // else this.autoMoveDown = false;

        // if(this.autoMoveDown) this.panel.scrollTo(0,this.list.children.length*50);
        if(this.autoMoveDown) this.body.scrollTo(0,this.body.scrollHeight);
    }
    update(){
        this.list.textContent = "";
        
        let p = selProject;
        if(!p) return;
        let hist = p.hist;
        
        let i = 0;
        for(const a of hist.list){
            this._addItem(a,i);
            i++;
        }
        this.updateI();
    }
    add(a:HistAction){        
        let p = selProject;
        if(!p) return;
        if(this.list.children.length){
            for(let i = 0; i <= p.hist.i; i++){
                this.list.children[i].classList.remove("cur");
            }
        }
        this._addItem(a,p.hist.list.length);
    }
    updateI(){
        let p = selProject;
        if(!p) return;
        for(let i = 0; i < p.hist.list.length; i++){
            this.list.children[i]?.classList.remove("old","cur");
        }
        for(let i = p.hist.i+1; i < p.hist.list.length; i++){
            this.list.children[i]?.classList.add("old");
        }
        if(p.hist.i != -1) this.list.children[p.hist.i]?.classList.add("cur");
    }
}

// 

class HA_Full extends HistAction{
    constructor(p:Project){
        super("Initial state",HistIcon.full);
        this.full = new HistFullState(p);
    }
    invalidateFullState(): void { // make it so this one isn't invalidatable
        return;
    }
    save(p: Project): this {
        this.full.save();
        if(p.curFinishableAction) this.setFA(p.curFinishableAction);
        return this;
    }
    restore(p: Project): this {
        this.full?.restore();
        // if(this.fa) restartFinishableAction(this.fa);
        return this;
    }
}

/**
 * copies the current "main" canvas and reapplies it
 * 
 * used for anything that gets concretely drawn to and within the canvas borders
 */
class HA_CanCopy extends HistAction{
    constructor(label:string,blendMode:DrawMode,icon:HistIcon=null,forceMode?:DrawMode){
        if(icon == null) icon = HistIcon[curTool.id];
        super(label,icon);
        // this.drawMode = selProject.getActiveDrawModePost();
        // this.drawMode = selProject.lastDrawMode;
        // this.drawMode = selProject.getBlendMode();
        this.drawMode = blendMode;
        this.forceMode = forceMode;
    }
    data:Uint8ClampedArray;
    ctx:CanvasRenderingContext2D;
    // img:ImageData;
    drawMode:DrawMode;
    forceMode?:DrawMode;

    // pre:Uint8ClampedArray;
    // hasQuickUndo(): boolean {
    //     return true;
    // }
    // quickUndo(p: Project): this {
    //     if(!this.pre){
    //         console.warn("no pre data found");
    //         return this;
    //     }
    //     p.main.putImageData(new ImageData(this.pre,p.w,p.h),0,0);
    //     endDCan();
    //     p.applyChangeToAll(true,true);
    //     return this;
    // }

    save(p:Project): this {
        super.save(p);
        if(this.drawMode == DrawMode.select || this.drawMode == DrawMode.erase_select) this.data = p.sel.getImageData(0,0,p.w,p.h).data;
        else{
            if(settings.useCanvasStoring){
                let can = createCan(p.w,p.h);
                let ct = can.getContext("2d");
                ct.drawImage(p.backMain ? p.backMain.canvas : p.main.canvas,0,0);
                this.ctx = ct;
            }
            else this.data = (p.backMain ? p.backMain.getImageData(0,0,p.w,p.h).data : p.main.getImageData(0,0,p.w,p.h).data);
        }
        p.backMain = null;
        // this.img = p.main.getImageData(0,0,p.w,p.h);
        return this;
    }
    restore(p: Project): this {
        // if(!this.pre) this.pre = p.main.getImageData(0,0,p.w,p.h).data;
        super.restore(p);
        if(this.drawMode == DrawMode.select || this.drawMode == DrawMode.erase_select){
            p.sel.putImageData(new ImageData(this.data,p.w,p.h),0,0);
            updateSelection();
        }
        else{
            if(settings.useCanvasStoring){
                p.main.canvas.width = p.w;
                p.main.drawImage(this.ctx.canvas,0,0);
            }
            else p.main.putImageData(new ImageData(this.data,p.w,p.h),0,0);
        }
        // p.setTmpDrawMode(this.drawMode);
        // let bm = p.getBlendMode();
        p.setTmpBlendMode(this.drawMode);
        endDCan(undefined,undefined,this.forceMode);
        postEndDCan();
        p.applyChangeToAll(true,true);
        p.resetTmpBlendMode();
        return this;
    }
}

class HA_ClearLayer extends HistAction{
    constructor(isCut=false,amt:number){
        super(isCut?"Cut Layer":"Clear layer"+(amt>1?"s":""),HistIcon.clear);
    }
    save(p: Project): this {
        super.save(p);
        return this;
    }
    restore(p: Project): this {
        super.restore(p);
        p.loopSel(l=>{
            l.clear();
        });
        return this;
    }
}

class HA_ClearFromSelection extends HistAction{
    constructor(isCut=false){
        super("Clear from Selection",HistIcon.clear);
    }
    restore(p: Project): this {
        super.restore(p);
        p.loopSel(l=>{
            l.clearSelectedArea();
        });
        return this;
    }
}

class HA_MoveLayers extends HistAction{
    constructor(amt:number,selAmt:number){
        let label = "Move Layer"+(selAmt!=1?"s":"");
        if(amt > 0) label += " Up";
        else label += " Down";
        super(label,amt > 0 ? HistIcon.up : HistIcon.down);
        this.amt = amt;
    }
    amt:number;

    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);

        p.moveLayersBy(this.amt);
        
        p.hist.endBare();
        return this;
    }
}

class HA_CreateSpan extends HistAction{
    /**
     * Create span, Adjust span, Remove span
     */
    constructor(label:string,start:HFS_Loc){
        super(label,HistIcon.full);
        this.start = start;
    }
    spans:HFS_Loc[];
    spanDir:number;
    start:HFS_Loc;
    save(p: Project): this {
        super.save(p);
        let f = p.getByLoc(this.start);
        if(!f){
            console.warn("Err: could not find starting span loc");
            return;
        }
        this.spans = f.spans.map(v=>v.h_getLoc());
        this.spanDir = f.spanDir;
        return this;
    }
    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);
        let f = p.getByLoc(this.start);
        if(!f){
            console.warn("Err: could not find starting span loc");
            return;
        }

        // f.clearSpans();
        // f.manualSpanBy(this.spans.length); // <-- this also works but only for creating spans
        
        f.clearSpans();
        f.spanDir = this.spanDir;
        for(const s of this.spans){
            let l = p.frames[s.frameI].getLayer(s.layerID,true);
            f.spans.push(l);
            l.spannedBy = f;
        }

        updatePanel("timeline");
        
        // for(const s of f.spans){
        //     s.spannedBy = null;
        // }
        // f.spanDir = this.spanDir;
        // f.spans = this.spans.map(v=>p.frames[v.frameI]?.layers.get(v.layerID));
        // for(const s of f.spans){
        //     s.spannedBy = f;
        // }
        p.hist.endBare();
        // super.restore(p);
        return this;
    }
}

class HA_Select extends HistAction{
    constructor(isAll=false,isMove=false,isFill=false){
        super(isMove?"Move Selection":isAll?"Select All":`${isFill?"Fill":"Rect"} Selection`,isFill?HistIcon.fill:isMove?HistIcon.select_pointer:HistIcon.select);
    }
    sel:Uint8ClampedArray;
    save(p: Project): this {
        super.save(p);
        this.sel = p.sel.getImageData(0,0,p.w,p.h).data;
        return this;
    }
    restore(p: Project): this {
        super.restore(p);
        p.sel.putImageData(new ImageData(this.sel,p.w,p.h),0,0);
        updateSelection();
        return this;
    }
}
class HA_DeselectAll extends HistAction{
    constructor(){
        super("Deselect All",HistIcon.select);
    }
    restore(p: Project): this {
        super.restore(p);
        p.sel.clearRect(0,0,p.w,p.h);
        updateSelection();
        return this;
    }
}
class HA_AddFrames extends HistAction{
    constructor(amt:number,start:number){
        super(amt == 1 ? "Add Frame" : "Add "+amt+" Frames",HistIcon.add_frame);
        this.amt = amt;
        this.start = start;
    }
    amt:number;
    start:number;
    restore(p: Project): this {
        p.hist.startBare(this);
        p._addFrames(this.amt,this.start);
        p.hist.endBare();
        super.restore(p);
        return this;
    }
}
class HA_AddGlobalLayer extends HistAction{
    constructor(name:string,ind:number,id:number){
        super("Add Global Layer",HistIcon.add_global_layer);
        this.name = name;
        this.ind = ind;
        this.id = id;
    }
    name:string;
    ind:number;
    id:number;
    restore(p: Project): this {
        p.hist.startBare(this);
        p.addGlobalLayer(this.name,this.ind,this.id);
        p.hist.endBare();
        super.restore(p);
        return this;
    }
}
class HA_AddBGLayer extends HistAction{
    constructor(name:string,ind:number,id:number){
        super("Add BG Layer",HistIcon.add_bg_layer);
        this.name = name;
        this.ind = ind;
        this.id = id;
    }
    name:string;
    ind:number;
    id:number;
    restore(p: Project): this {
        p.hist.startBare(this);
        p.addBGLayer(this.name,this.ind,this.id);
        p.hist.endBare();
        super.restore(p);
        return this;
    }
}
class HA_SetLayerVisibility extends HistAction{
    constructor(hidden:boolean,lId:number){
        super(hidden?"Hide Layer":"Show Layer",hidden?HistIcon.hide:HistIcon.show);
        this.hidden = hidden;
        this.lId = lId;
    }
    hidden:boolean;
    lId:number;
    restore(p: Project): this {
        p.hist.startBare(this);

        let l = p.gLayers.find(v=>v._id == this.lId);
        if(l) l.setHidden(p,this.hidden);
        else console.warn("Err: while restoring setLayerVisibility, couldn't find layerRef");
        
        p.hist.endBare();
        super.restore(p);
        return this;
    }
}
class HA_SetLayerLocked extends HistAction{
    constructor(locked:boolean,lId:number){
        super(locked?"Lock Layer":"Unlock Layer",locked?HistIcon.lock:HistIcon.unlock);
        this.locked = locked;
        this.lId = lId;
    }
    locked:boolean;
    lId:number;
    restore(p: Project): this {
        p.hist.startBare(this);
        
        let l = p.gLayers.find(v=>v._id == this.lId);
        if(l) l.setLocked(p,this.locked);
        else console.warn("Err: while restoring setLayerLocked, couldn't find layerRef");
        
        p.hist.endBare();
        super.restore(p);
        return this;
    }
}

class HA_SwapCP extends HistAction{
    constructor(cp:ColorPalette,all=true){
        super("Swap Color Palette",HistIcon.full);
        this.cpSave = cp.save();
        this.all = all;
    }
    cpSave:ColorPaletteSave;
    all:boolean;
    restore(p: Project): this {
        p.hist.startBare(this);

        p.cp.restore(this.cpSave);
        p.applyCPChange();
        
        p.hist.endBare();
        updatePanel("color"); // <-- needed for restoring color palette
        super.restore(p);
        return this;
    }
}
class HA_DeleteLayers extends HistAction{
    constructor(_ids:number[],firstType:LayerType){
        // super(`Delete ${_ids.length} layer${_ids.length==1?"":"s"}`,((selProject && _ids.length == 1) ? selProject.gLayers.find(v=>v._id == _ids[0])?.type == LayerType.background ? HistIcon.delete_bg_layer : HistIcon.delete_global_layer : HistIcon.delete_global_layer));
        super(`Delete ${_ids.length} layer${_ids.length==1?"":"s"}`,firstType == LayerType.background ? HistIcon.delete_bg_layer : HistIcon.delete_global_layer);
        this._ids = _ids;
    }
    _ids:number[];
    restore(p: Project): this {
        p.hist.startBare(this);
        
        p.deleteLayers(this._ids);
        
        p.hist.endBare();
        super.restore(p);
        return this;
    }
}
class HA_DeleteFrames extends HistAction{
    constructor(ar:number[]){
        super(`Delete ${ar.length} frame${ar.length==1?"":"s"}`,HistIcon.delete_frame);
        this.ar = ar;
    }
    ar:number[];
    isInvalidInFutureHistory(): boolean {
        return true;
    }
    restore(p: Project): this {
        p.hist.startBare(this);
        
        p.deleteFrames(this.ar);
        
        p.hist.endBare();
        super.restore(p);
        return this;
    }
}

class HA_DuplicateSelection extends HistAction{
    constructor(coState:any){
        super("Duplicate selection",HistIcon.full);
        this.coState = coState;
    }
    coState:any;
    restore(p: Project): this {
        p.hist.startBare(this);

        // p.edit.duplicateSelection();
        p.edit.deselectAll(true);
        let o = CanvasObj.createFrom(this.coState);
        o.deserialize(this.coState);
        p.addCanObj(o,o._id);
        // selectTool(tools.find(v=>v instanceof PointerTool));

        p.hist.endBare();
        super.restore(p);
        return this;
    }
    onGoTo(): void {
        super.onGoTo();
        selectToolId("pointer");
    }
}
class HA_MoveCanObjs extends HistAction{
    constructor(label:string,list:{_id:number,x:number,y:number,sel:boolean}[]){
        super("Move "+label,HistIcon.pointer);
        this.list = list;
        this.curToolId = curTool.id;
    }
    curToolId:string;
    list:{_id:number,x:number,y:number,sel:boolean}[];
    restore(p: Project): this {
        p.hist.startBare(this);
        p.deselectAllCanObjs();
        
        for(const c of this.list){
            let o = p.getCanObj(c._id);
            if(!o) return;
            if(c.sel) o.select();
            else o.deselect();
            o.moveTo(c.x,c.y);
        }

        p.hist.endBare();
        super.restore(p);
        return this;
    }
    onGoTo(): void {
        super.onGoTo();
        // selectToolId("pointer");
        selectToolId(this.curToolId); // <-- note: not sure if this is a perfect replacement
    }
}
class HA_TransformCanObjs extends HistAction{
    constructor(label:string,list:{_id:number,x:number,y:number,a:number,sw:number,sh:number,anchorX:number,anchorY:number,sel:boolean}[]){
        super(label,HistIcon.pointer);
        this.list = list;
        this.curToolId = curTool.id;
    }
    curToolId:string;
    list:{_id:number,x:number,y:number,a:number,sw:number,sh:number,anchorX:number,anchorY:number,sel:boolean}[];
    restore(p: Project): this {
        p.hist.startBare(this);
        p.deselectAllCanObjs();
        
        for(const c of this.list){
            let o = p.getCanObj(c._id) as SelectableCObj;
            // if(!o) return; // <-- not sure why a return was here but it caused endBare not to get called which wasn't good; this caused _isBare to be stuck on which made certain actions not record into the history
            if(!o) continue;
            if(c.sel) o.select();
            else o.deselect();
            o.moveTo(c.x,c.y);
            o.rotateTo(c.a);
            o.resizeTo(c.sw,c.sh);
        }

        p.hist.endBare();
        super.restore(p);
        return this;
    }
    onGoTo(): void {
        super.onGoTo();
        // selectToolId("pointer");
        selectToolId(this.curToolId);
    }
}
class HA_PasteSelection extends HistAction{
    constructor(obj:CanvasObj){
        super("Paste Selection",HistIcon.draw);
        this.coState = obj.serialize();
    }
    coState:any;
    restore(p: Project): this {
        p.hist.startBare(this);

        p.edit.deselectAll(true);
        let o = CanvasObj.createFrom(this.coState);
        o.deserialize(this.coState);
        p.addCanObj(o);
        o.select();

        p.hist.endBare();
        super.restore(p);
        return this;
    }
    onGoTo(): void {
        super.onGoTo();
        selectToolId("pointer");
    }
}

class HA_CutSelection extends HistAction{
    constructor(bounds:number[]){
        super("Cut Selection",HistIcon.delete);
        this.bounds = bounds;
    }
    bounds:number[];
    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);

        p.loopSel(l=>{
            if(l.isEmpty()) return;
            if(!l.canEdit()) return;
            l.ctx.clearRect(this.bounds[0],this.bounds[1],this.bounds[2]-this.bounds[0]+1,this.bounds[3]-this.bounds[1]+1);
        });

        p.hist.endBare();
        return this;
    }
}

/**
 * @note Requires calling `postSave()` manually
 */
class HA_LoopSelCopy extends HistAction{
    constructor(label:string,icon:HistIcon){
        super(label,icon);
    }
    cans:HTMLCanvasElement[];
    postSave(){
        this.cans = [];
        for(const loc of this.cur){
            let l = selProject.getByLoc(loc);
        // selProject.loopSel(l=>{
            if(!l.canEdit()){
                console.warn("...can't edit",l.lref.name);
                return;
            }
            if(l.isEmpty()){
                console.warn("...is empty",l.lref.name);
                return;
            }
            console.log("...added",l.lref.name);
            this.cans.push(copyCan(l.ctx.canvas));
        }
        // });
    }
    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);

        let i = 0;
        p.loopSel(l=>{
            if(!l.canEdit()) return;
            l.initCtxIfNeeded();
            l.applyChange(true,false);
            l.ctx.canvas.width = p.w;
            l.ctx.drawImage(this.cans[i],0,0);
            i++;
        });
        p.loadFrame();
        
        p.hist.endBare();
        return this;
    }
}

class HA_StartSpline extends HistAction{
    constructor(obj:SplineHandleCObj){
        super("Start Spline",HistIcon.spline);
        this.coState = obj.serialize();
    }
    coState:any;
    restore(p: Project): this {
        p.hist.startBare(this);

        // p.edit.deselectAll(true);
        let o = CanvasObj.createFrom(this.coState);
        o.deserialize(this.coState);
        p.addCanObj(o);
        selProject.deselectAllCanObjs();
        o.select();

        p.hist.endBare();
        super.restore(p);
        return this;
    }
    onGoTo(): void {
        super.onGoTo();
        selectToolId("spline_tool");
    }
}
class HA_AddSplineHandle extends HistAction{
    constructor(obj:SplineHandleCObj){
        super("Add Spline Handle",HistIcon.spline);
        this.coState = obj.serialize();
    }
    coState:any;
    restore(p: Project): this {
        p.hist.startBare(this);

        // p.edit.deselectAll(true);
        let o = CanvasObj.createFrom(this.coState);
        o.deserialize(this.coState);
        p.addCanObj(o);
        selProject.deselectAllCanObjs();
        o.select();

        p.hist.endBare();
        super.restore(p);
        return this;
    }
}

// class HA_FinishSelection extends HistAction{
//     constructor(){
//         super("Finish Selection",HistIcon.full);
//     }
//     restore(p: Project): this {
//         return this;
//     }
// }
class HA_FinishFA extends HistAction{
    constructor(label:string,icon:HistIcon,fa:FinishableAction){
        super(label,icon);
        this.fa1 = fa;
    }
    fa1:FinishableAction;
    // canBeFullState(): boolean {
    //     return false;
    // }
    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);

        this.fa1?.finish();

        p.hist.endBare();
        return this;
    }
}
class HA_CancelFA extends HistAction{
    constructor(label:string,icon:HistIcon,fa:FinishableAction){
        super(label,icon);
        this.fa1 = fa;
    }
    fa1:FinishableAction;
    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);

        this.fa1?.cancel();

        p.hist.endBare();
        return this;
    }
}

// 

class HA_Resize extends HistAction{
    constructor(w:number,h:number,ha:number,va:number,isCanvasOnly:boolean){
        super("Resize",HistIcon.full);
        this.w = w;
        this.h = h;
        this.ha = ha;
        this.va = va;
        this.isCanvasOnly = isCanvasOnly;
    }
    w:number;
    h:number;
    ha:number;
    va:number;
    isCanvasOnly:boolean;
    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);

        p.image.resize(this.w,this.h,this.ha,this.va,this.isCanvasOnly);
        
        p.hist.endBare();
        return this;
    }
}

type RenameLayerData = {
    id:number;
    name:string;
};
class HA_RenameLayer extends HistAction{
    constructor(data:RenameLayerData[]){
        data = JSON.parse(JSON.stringify(data)); // just to make sure
        super(data.length == 1 ? "Rename Layer" : "Rename Layers",HistIcon.rename);
        this.data = data;
    }
    data:RenameLayerData[];
    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);

        p.renameLayers(false,...this.data);
        
        p.hist.endBare();
        return this;
    }
}

// 
class HA_DeleteCanObj extends HistAction{
    constructor(_id:number,label:string,icon?:HistIcon){
        super(label,icon??HistIcon.delete);
        this._id = _id;
    }
    _id:number;

    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);

        let o = p.canObjs.find(v=>v._id == this._id);
        if(o) p.removeCanObj(o);

        if(p.curFinishableAction) p.curFinishableAction.update();

        p.hist.endBare();
        return this;
    }
}
class HA_RemoveSplineSubHandle extends HistAction{
    constructor(_id:number){
        super("Remove sub handle",HistIcon.delete);
        this._id = _id;
    }
    _id:number;

    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);
        
        let o = p.canObjs.find(v=>v._id == this._id) as SplineSubHandleCObj;
        if(o){
            p.removeCanObj(o);
            if(o.isEnd){
                o.parent.handles[1] = null;
                // o.parent.ex = 0;
                // o.parent.ey = 0;
            }
            else{
                o.parent.handles[0] = null;
                // o.parent.sx = 0;
                // o.parent.sy = 0;
            }
            o.parent.update();
            // if(p.curFinishableAction) p.curFinishableAction.update();
        }

        p.hist.endBare();
        return this;
    }
}
class HA_ArrangeCanObj extends HistAction{
    constructor(label:string,fromI:number,toI:number,_id:number){
        super(label,HistIcon.pointer);
        this._id = _id;
        this.fromI = fromI;
        this.toI = toI;
    }
    _id:number; // <-- may not be needed
    fromI:number;
    toI:number;
    
    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);

        let o = p.canObjs[this.fromI];
        p.canObjs.splice(this.fromI,1);
        p.canObjs.splice(this.toI,0,o);
        o.update();

        p.hist.endBare();
        return this;
    }
}
class HA_RestoreSplineHandles extends HistAction{
    constructor(_id:number,ids:number[],i?:number){
        super(i != undefined ? "Restore handle" : "Restore handles",HistIcon.pointer);
        this._id = _id;
        this.i = i;
        this.ids = ids;
    }
    _id:number;
    i?:number|undefined;
    ids:number[];

    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);

        let o = p.canObjs.find(v=>v._id == this._id) as SplineHandleCObj;
        if(o){
            if(this.i == undefined) o._restoreBothHandles(this.ids);
            else o._restoreHandle(this.i,this.ids[this.i]);
            o.update();
        }

        p.hist.endBare();
        return this;
    }
}

// edits
class HA_RotateSel extends HistAction{
    constructor(cw=true,amt=Math.PI/2,anchorX=0.5,anchorY=0.5){
        super("Turn "+(cw?"CW":"CCW")+" by "+Math.floor(amt/Math.PI*180),HistIcon.draw);
        this.cw = cw;
        this.amt = amt;
        this.anchorX = anchorX;
        this.anchorY = anchorY;
    }
    cw:boolean;
    amt:number;
    anchorX:number;
    anchorY:number;

    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);

        p.edit.rotateSelection(this.cw,this.amt);

        p.hist.endBare();
        return this;
    }
}
class HA_FlipSel extends HistAction{
    constructor(x:number,y:number,anchorX=0.5,anchorY=0.5){
        super(
            y == 1 && x == -1 ? "Flip X" : 
            x == 1 && y == -1 ? "Flip Y" : 
            x == -1 && y == -1 ? "Flip X & Y" : 
            "Custom Flip"
        ,HistIcon.draw);
        this.x = x;
        this.y = y;
        this.anchorX = anchorX;
        this.anchorY = anchorY;
    }
    x:number;
    y:number;
    anchorX:number;
    anchorY:number;

    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);

        p.edit.flipSelection(this.x,this.y,this.anchorX,this.anchorY);

        p.hist.endBare();
        return this;
    }
}

// camera
class HA_CreateCamera extends HistAction{
    constructor(x:number,y:number,w:number,h:number,_id:number){
        super("Create Camera",HistIcon.full);
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this._id = _id;
    }
    x:number;
    y:number;
    w:number;
    h:number;
    _id:number;

    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);

        p.addCanObj(new CameraCObj(this.x,this.y,this.w,this.h),this._id);

        p.hist.endBare();
        return this;
    }
}

// adjustments
class HA_AdjustPixels extends HistAction{
    constructor(data:ColorChannelData[]){
        super("Adjust Pixels",HistIcon.pixel);
        this.data = data;
    }
    data:ColorChannelData[];
    
    restore(p: Project): this {
        p.hist.startBare(this);
        super.restore(p);

        p.adjustPixels(this.data);

        p.hist.endBare();
        return this;
    }
}