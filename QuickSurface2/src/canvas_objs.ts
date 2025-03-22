function getCellW(){
    if(!selProject) return 0;
    return selProject.cont.offsetWidth/selProject.w;
}
// function getXRat(x:number){
//     if(!selProject) return 0;
//     return x/selProject.w;
// }
// function getYRat(y:number){
//     if(!selProject) return 0;
//     return x/selProject.w;
// }

function isPointerTool(){
    if(selProject){
        if(selProject.curFinishableAction instanceof FA_Spline){
            return (curTool instanceof SplineTool) || (curTool instanceof PointerTool);
        }
    }
    return (curTool instanceof PointerTool);
}

let _canvasObjRegistry = new Map<string,CanvasObj>();
function registerCanvasObj(o:CanvasObj){
    _canvasObjRegistry.set(o.getID(),o);
}

enum CODragType{
    move,
    rotate,
    scale
}
enum Corner{    
    none,
    tl,
    tr,
    bl,
    br
}
enum Side{    
    none,
    left,
    top,
    right,
    bottom
}
class CanvasObj{
    constructor(x:number,y:number){
        this.x = x;
        this.y = y;
        let subCont = document.createElement("div");
        this.subCont = subCont;
        this.subCont.classList.add("canvas-obj-sub-cont");
        this.cont = document.createElement("div");
        this.cont.classList.add("canvas-obj-cont");
        this.cont.addEventListener("mouseenter",e=>{
            if(!isPointerTool()) return;
            this.mouseEnter();
        });
        this.cont.addEventListener("mouseleave",e=>{
            if(!isPointerTool()) return;
            this.mouseLeave();
        });
        this.cont.appendChild(this.subCont);
    }
    _id:number;
    p:Project;
    x:number;
    y:number;
    subCont:HTMLElement;
    cont:HTMLElement;
    isOver = false;
    selected = false;
    getID(){
        return "__no_id";
    }
    static createFrom(data:any):CanvasObj{
        return _canvasObjRegistry.get(data.id).createNew();
    }
    createNew(){
        return null;
    }

    skipSave(){
        return false;
    }
    onZoom(){}

    getX(){
        return Math.floor(this.x);
    }
    getY(){
        return Math.floor(this.y);
    }
    update(){
        let p = selProject;
        if(!p) return;
        this.cont.style.left = (this.getX()/p.w*100)+"%";
        this.cont.style.top = (this.getY()/p.h*100)+"%";
    }
    serialize():any{
        return {
            id:this.getID(),
            _id:this._id,
            x:this.x,y:this.y
        };
    }
    deserialize(data:any){
        this._id = data._id;
        this.x = data.x;
        this.y = data.y;
    }
    canMove(){
        return false;
    }

    mouseEnter(){
        this.isOver = true;
        this.p.hoverCO = this;
        if(curTool?.inUse) return;
        this.hover();
    }
    mouseLeave(){
        this.isOver = false;
        this.p.hoverCO = null;
        if(curTool?.inUse) return;
        if(this._dragging) this._hasLeft = true;
        this.unhover();
    }

    moveTo(x:number,y:number){
        this.x = x;
        this.y = y;
        this.update();
        // this.p.hist.add(new HA_MoveCanObj(this._id,this.x,this.y));
    }
    moveBy(x:number,y:number){
        this.moveTo(this.x+x,this.y+y);
    }

    _dragging = false;
    _hasLeft = false;
    _hasMoved = false;
    _wasSelected = false;
    _dragType = CODragType.move;
    _overRotate = Corner.none;
    _overScale:Set<Side> = new Set();
    _startDrag(type:CODragType){
        this._dragging = true;
        this._hasLeft = false;
        this._hasMoved = false;
        this._dragType = type;
        lockDrag();
    }
    _endDrag(){
        this._dragging = false;
        this._hasLeft = false;
        this._hasMoved = false;
        this._wasSelected = false;
        this._overScale.clear();
        unlockDrag();
    }

    mouseDown(e:UniversalMouseEvent){
        if(!isPointerTool()) return;
        if(!this.isOver && !this.p.hoverCO && !ctrlKey && !shiftKey && !altKey){
            this.p.deselectAllCanObjs();
            return;
        }
        // if(this instanceof SelectableCObj){
        //     let rect = this.cont.getBoundingClientRect();
        //     let pad = innerWidth*0.03;
        //     let amtX = Math.cos(-this.a)*e.clientX - Math.sin(-this.a)*e.clientY; // rotation matrix :D
        //     let amtY = Math.cos(-this.a)*e.clientY + Math.sin(-this.a)*e.clientX;
        //     if(amtY > rect.y-pad && amtY < rect.bottom+pad){
        //         if(amtX > rect.x-pad && amtX < rect.x+pad){
        //             this._overScale = Side.left;
        //         }
        //         else if(amtX > rect.right-pad && amtX < rect.right+pad){
        //             this._overScale = Side.right;
        //         }
        //         if(amtY < rect.y+pad){
        //             this._overScale = Side.top;
        //         }
        //         else if(amtY > rect.bottom-pad){
        //             this._overScale = Side.bottom;
        //         }
        //     }
        // }
        if(this._overRotate){
            console.log("OVER ROTATE: ",Corner[this._overRotate]);
            if(this.selected){
                this._startDrag(CODragType.rotate);
            }
        }
        else if(this._overScale.size){
            console.log("OVER scale:",this._overScale);
            this._startDrag(CODragType.scale);
        }
        else if(this.isOver){
            let wasSelected = this.selected;
            if(!this.selected){
                if(!(e.shiftKey)) this.p.deselectAllCanObjs();
                this.select();
            }
            if(this.selected && !this._dragging){
                // start
                this._wasSelected = wasSelected;
                this._startDrag(CODragType.move);
            }
        }
    }
    mouseMove(e:UniversalMouseEvent){
        if(this._dragging){
            if(this._dragType == CODragType.move) for(const o of this.p.selCOs){
                this._hasMoved = true;
                o.moveBy(mx-lx,my-ly);
            }
        }
    }
    mouseUp(e:UniversalMouseEvent){
        if(this._dragging){
            if(this._hasMoved){
                this.p.hist.add(new HA_TransformCanObjs((["Move","Rotate","Scale"][this._dragType])+" data",this.p.selCOs.map((v:SelectableCObj)=>{
                    return {
                        _id:v._id,
                        x:v.x,
                        y:v.y,
                        a:v.a,
                        sw:v.sw,
                        sh:v.sh,
                        anchorX:0.5,
                        anchorY:0.5,
                        sel:true
                    };
                })));
            }
            
            if(e.ctrlKey && this._wasSelected && !this._hasMoved){
                this.deselect();
            }

            // end
            this._endDrag();
        }
    }
    select(){
        if(!this.p.selCOs.includes(this)) this.p.selCOs.push(this);
        this.cont.classList.add("active");
        this.selected = true;
    }
    deselect(){
        let ind = this.p.selCOs.indexOf(this);
        if(ind != -1) this.p.selCOs.splice(ind,1);
        this.cont.classList.remove("active");
        this.selected = false;
    }
    toggleSelect(){
        if(this.selected) this.deselect();
        else this.select();
    }
    hover(){
        this.cont.classList.add("hover");
        if(curTool?.inUse ? this.selected : true) setCursor("move"); // the if check makes it so when you drag with the pointer tool over it it won't set the move icon
    }
    unhover(){
        this.cont.classList.remove("hover");
        endCursor("move");
    }

    onAdd(){}
    onRemove(){}
}
class SelectableCObj extends CanvasObj{
    constructor(x:number,y:number,w:number,h:number){
        super(x,y);
        this.w = w;
        this.h = h;
        this.a = 0;
        let r_tl = document.createElement("div");
        let r_tr = document.createElement("div");
        let r_bl = document.createElement("div");
        let r_br = document.createElement("div");
        let s_l = document.createElement("div");
        let s_t = document.createElement("div");
        let s_r = document.createElement("div");
        let s_b = document.createElement("div");
        let s_tl = document.createElement("div");
        let s_tr = document.createElement("div");
        let s_bl = document.createElement("div");
        let s_br = document.createElement("div");
        r_tl.className = "co-r co-r_tl";
        r_tr.className = "co-r co-r_tr";
        r_bl.className = "co-r co-r_bl";
        r_br.className = "co-r co-r_br";
        s_l.className = "co-s co-s_l";
        s_t.className = "co-s co-s_t";
        s_r.className = "co-s co-s_r";
        s_b.className = "co-s co-s_b";
        s_tl.className = "co-s co-s_tl";
        s_tr.className = "co-s co-s_tr";
        s_bl.className = "co-s co-s_bl";
        s_br.className = "co-s co-s_br";
        this.cont.appendChild(r_tl);
        this.cont.appendChild(r_tr);
        this.cont.appendChild(r_bl);
        this.cont.appendChild(r_br);
        this.cont.appendChild(s_l);
        this.cont.appendChild(s_t);
        this.cont.appendChild(s_r);
        this.cont.appendChild(s_b);
        this.cont.appendChild(s_tl);
        this.cont.appendChild(s_tr);
        this.cont.appendChild(s_bl);
        this.cont.appendChild(s_br);
        let setupRot = (e:HTMLElement,corner:Corner)=>{
            e.addEventListener("mouseenter",e=>{
                this._overRotate = corner;
            });
            e.addEventListener("mouseleave",e=>{
                this._overRotate = Corner.none;
            });
        }
        let setupScale = (e:HTMLElement,...side:Side[])=>{
            e.addEventListener("mouseenter",e=>{
                if(this._dragging) return;
                // this._overScale = side;
                for(const s of side) this._overScale.add(s);
            });
            e.addEventListener("mouseleave",e=>{
                if(this._dragging) return;
                // this._overScale = Side.none;
                for(const s of side) this._overScale.delete(s);
            });
        };
        setupRot(r_tl,Corner.tl);
        setupRot(r_tr,Corner.tr);
        setupRot(r_bl,Corner.bl);
        setupRot(r_br,Corner.br);
        setupScale(s_l,Side.left);
        setupScale(s_t,Side.top);
        setupScale(s_r,Side.right);
        setupScale(s_b,Side.bottom);
        setupScale(s_tl,Side.left,Side.top);
        setupScale(s_tr,Side.top,Side.right);
        setupScale(s_bl,Side.left,Side.bottom);
        setupScale(s_br,Side.right,Side.bottom);
    }
    w:number;
    h:number;
    sw = 1;
    sh = 1;
    a:number;

    cx = 0; // center positions
    cy = 0;
    ax = 0; // anchors
    ay = 0;
    _lastAng = 0;

    anchorX = 0.5;
    anchorY = 0.5;
    // anchorX = 0;
    // anchorY = 0;
    // anchorX = 1;
    // anchorY = 1;

    _startDrag(type: CODragType): void {
        super._startDrag(type);
        this.cx = this.w/2;
        this.cy = this.h/2;
        let r = this.cont.getBoundingClientRect();
        this.ax = r.x+r.width*this.anchorX;
        this.ay = r.y+r.height*this.anchorY;
        this._calcRotate();
    }
    _calcRotate(){
        let dx1 = cmx-this.ax;
        let dy1 = cmy-this.ay;
        let ang = Math.atan2(dy1,dx1);
        let angDist = ang-this._lastAng;
        this._lastAng = ang;
        return angDist;
    }

    canRotate(){
        return false;
    }
    canResize(){
        return false;
    }
    serialize() {
        let d = super.serialize();
        d.w = this.w;
        d.h = this.h;
        d.a = this.a;
        d.sw = this.sw;
        d.sh = this.sh;
        return d;
    }
    deserialize(data: any): void {
        super.deserialize(data);
        this.w = data.w;
        this.h = data.h;
        this.a = data.a;
        this.sw = data.sw;
        this.sh = data.sh;
    }
    rotateTo(a:number){
        this.a = a;
        this.update();
        // this.p.hist.add(new HA_RotateCanObj(this._id,this.a));
        this.cont.style.rotate = a+"rad";
        this.cont.style.transformOrigin = `${this.anchorX*100}% ${this.anchorY*100}%`;
    }
    rotateBy(a:number){
        this.rotateTo(this.a+a);
    }
    resizeTo(sw:number,sh:number){
        this.sw = sw;
        this.sh = sh;
        this.update();
        // this.p.hist.add(new HA_ResizeCanObj(this._id,this.sw,this.sh));
    }
    resizeBy(sw:number,sh:number){
        this.resizeTo(this.sw+sw,this.sh+sh);
    }
    update(): void {
        let p = this.p;
        let cell = getCellW();
        // this.cont.style.left = (this.getX()/p.w*100-Math.cos(this.a)*this.sw*this.anchorX*100)+"%";
        // this.cont.style.top = (this.getY()/p.h*100-Math.sin(this.a)*this.sh*this.anchorY*100)+"%";
        // this.cont.style.width = (this.w/p.w*this.sw*100)+"%";
        // this.cont.style.height = (this.h/p.h*this.sh*100)+"%";
        // this.cont.style.left = (this.getX()/p.w*100)+"%";
        // this.cont.style.top = (this.getY()/p.h*100)+"%";
        // this.cont.style.left = (this.x*cell+this.anchorX*this.w*cell)+"px";
        // this.cont.style.top = (this.y*cell+this.anchorY*this.h*cell)+"px";
        this.cont.style.left = (this.x/p.w*100+(this.anchorX*this.w)/p.w*100)+"%";
        this.cont.style.top = (this.y/p.h*100+(this.anchorY*this.h)/p.h*100)+"%";
        this.cont.style.width = (this.w/p.w*this.sw*100)+"%";
        this.cont.style.height = (this.h/p.h*this.sh*100)+"%";
        this.cont.style.translate = `${-this.anchorX*100}% ${-this.anchorY*100}%`;
        // this.subCont.style.width = (this.w*this.sw*cell)+"px";
        // this.subCont.style.height = (this.h*this.sh*cell)+"px";
    }
}
class PreviewCObj extends SelectableCObj{
    constructor(x:number,y:number,w:number,h:number){
        super(x,y,w,h);
        this.w = w;
        this.h = h;
        this.a = 0;
        // let w2 = this._getPrevSize();
        // this.prev = createCan(w2,w2).getContext("2d");
        // this.subCont.appendChild(this.prev.canvas);
        // this.prev.canvas.classList.add("prev-obj-can");

        // this.prev.fillStyle = "rgb(0,90,0)";
        // this.prev.fillRect(0,0,this.w,this.h);
    }
    // prev:CanvasRenderingContext2D;
    _getPrevSize(){
        // + padding for rotating with pixels close to edges
        return Math.max(this.w+this.h);
        // return Math.max(this.w+this.h)+4;
    }
    render(){
        
    }
    rotateTo(a: number): void {
        super.rotateTo(a);
        this.subCont.style.rotate = (-a)+"rad";
    }
}
abstract class HandleCObj extends SelectableCObj{
    constructor(x:number,y:number,w:number){
        super(x,y,w,w);
        this.cont.classList.add("spline-handle");
        this.anchorX = 0;
        this.anchorY = 0;
    }
    update(): void {
        let p = this.p;
        if(!p) return;
        this.cont.style.left = (this.x/p.w*100+(this.anchorX*this.w)/p.w*100)+"%";
        this.cont.style.top = (this.y/p.h*100+(this.anchorY*this.h)/p.h*100)+"%";
        this.cont.style.width = (this.w/p.w*this.sw*100)+"%";
        this.cont.style.height = (this.h/p.h*this.sh*100)+"%";
        this.cont.style.translate = `${-this.anchorX*100}% ${-this.anchorY*100}%`;
        this.render();
    }
    render(){}
    
    moveBy(x: number, y: number): void {
        super.moveBy(x,y);
        this.update();
    }
}
class SplineHandleCObj extends HandleCObj{
    constructor(x:number,y:number,sx:number,sy:number,ex:number,ey:number,pos=0){ // sx/sy is handle1 and ex/ey is handle2; pos=middle,first,last
        super(x,y,4);
        this.sx = sx;
        this.sy = sy;
        this.ex = ex;
        this.ey = ey;
    }
    sx:number;
    sy:number;
    ex:number;
    ey:number;
    handles:SplineSubHandleCObj[] = [];
    existingHandleIds:number[] = [];
    pos:number;

    static makeCorner(x:number,y:number){
        let o = new SplineHandleCObj(x,y,x-10,y-10,x+10,y+10);
        o.handles
        return o;
    }

    // set sx(v:number){
    //     this._sx = v;
    // }
    // set sy(v:number){
    //     this._sy = v;
    // }
    // get sx(){
    //     if(!this.handles[0]) return 0;
    //     return this._sx;
    // }
    // get sy(){
    //     if(!this.handles[0]) return 0;
    //     return this._sy;
    // }

    // set ex(v:number){
    //     this._ex = v;
    // }
    // set ey(v:number){
    //     this._ey = v;
    // }
    // get ex(){
    //     if(!this.handles[1]) return 0;
    //     return this._ex;
    // }
    // get ey(){
    //     if(!this.handles[1]) return 0;
    //     return this._ey;
    // }

    removeHandles(){
        if(this.handles[0]){
            this.p.removeCanObj(this.handles[0]);
            this.handles[0] = null;
        }
        if(this.handles[1]){
            this.p.removeCanObj(this.handles[1]);
            this.handles[1] = null;
        }
    }
    removeHandle(i:number){
        if(this.handles[i]){
            this.p.removeCanObj(this.handles[i]);
            this.handles[i] = null;
        }
    }
    _restoreBothHandles(ids?:number[]){
        console.log("...restore handles:",ids);
        ids ??= this.existingHandleIds;
        if(!this.handles[0]) this.handles[0] = this.p.addCanObj(new SplineSubHandleCObj(this.sx,this.sy,this,false),ids[0] ?? undefined);
        if(!this.handles[1]) this.handles[1] = this.p.addCanObj(new SplineSubHandleCObj(this.ex,this.ey,this,true),ids[1] ?? undefined);
        if(this.handles[0]){
            this.sx = this.handles[0].x;
            this.sy = this.handles[0].y;
            // if(!this.p.hist._isBare) this.existingHandleIds[0] = this.handles[0]._id;
            if(this.existingHandleIds[0] == null) this.existingHandleIds[0] = this.handles[0]._id;
            // this.existingHandleIds[0] = this.handles[0]._id;
        }
        if(this.handles[1]){
            this.ex = this.handles[1].x;
            this.ey = this.handles[1].y;
            // if(!this.p.hist._isBare) this.existingHandleIds[1] = this.handles[1]._id;
            if(this.existingHandleIds[1] == null) this.existingHandleIds[1] = this.handles[1]._id;
            // this.existingHandleIds[1] = this.handles[1]._id;
        }
    }
    _restoreHandle(i:number,id?:number){
        console.log("...restore handle:",i,id);
        id ??= this.existingHandleIds[i];
        if(!this.handles[i]) this.handles[i] = this.p.addCanObj(new SplineSubHandleCObj(i == 0 ? this.sx : this.ex,i == 0 ? this.sy : this.ey,this,i == 0 ? false : true),id ?? undefined);
        if(this.handles[i]){
            if(i == 0){
                this.sx = this.handles[i].x;
                this.sy = this.handles[i].y;
            }
            else{
                this.ex = this.handles[i].x;
                this.ey = this.handles[i].y;
            }
            // if(!this.p.hist._isBare) this.existingHandleIds[i] = this.handles[i]._id;
            if(this.existingHandleIds[i] == null) this.existingHandleIds[i] = this.handles[i]._id;
            // this.existingHandleIds[i] = this.handles[i]._id;
        }
    }
    onAdd(): void {
        // this.handles.push(this.p.addCanObj(new SplineSubHandleCObj(this.x-this.sx,this.y-this.sy,this,false),this.existingHandleIds[0] ?? undefined));
        // this.handles.push(this.p.addCanObj(new SplineSubHandleCObj(this.x-this.ex,this.y-this.ey,this,true),this.existingHandleIds[1] ?? undefined));

        this.handles[0] = (this.existingHandleIds.length && this.existingHandleIds[0] == undefined) ? undefined : (this.pos != 1 ? (this.p.addCanObj(new SplineSubHandleCObj(this.sx,this.sy,this,false),this.existingHandleIds[0] ?? undefined)) : null);
        this.handles[1] = (this.existingHandleIds.length && this.existingHandleIds[1] == undefined) ? undefined : (this.pos != 2 ? (this.p.addCanObj(new SplineSubHandleCObj(this.ex,this.ey,this,true),this.existingHandleIds[1] ?? undefined)) : null);
        if(this.handles[0]){
            this.sx = this.handles[0].x;
            this.sy = this.handles[0].y;
        }
        if(this.handles[1]){
            this.ex = this.handles[1].x;
            this.ey = this.handles[1].y;
        }

        // 
        // let cont = this.cont;
        // setupDropdown(cont,"d",[
        //     {
        //         label:"Option 1"
        //     },
        //     {
        //         label:"Option 2"
        //     }
        // ],undefined,undefined,undefined,{
        //     // inMenuCont:true,
        //     isRightClick:true,
        //     noHit:true,
        //     onClick:e=>{
        //         // e.stopImmediatePropagation();
        //         // e.stopPropagation();
        //     },
        //     onMainClick:e=>{
        //         e.stopImmediatePropagation();
        //         e.stopPropagation();
        //     },
        //     noClassAdd:true,
        // });
    }
    onRemove(): void {
        for(const h of this.handles){
            if(h) this.p.removeCanObj(h);
        }
        this.handles = [];
    }
    mouseDown(e: UniversalMouseEvent): void {
        if(e.button == 2 && this.isOver){
            this.p.deselectAllCanObjs();
            this.p.unhoverAllCanObjs();
            this.select();
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();

            let div = document.createElement("div");
            setupDropdown(div,"d",[
                {
                    label:"Remove",
                    onclick:(d,cont)=>{
                        this.p.removeCanObj(this);
                        let fa = this.p.curFinishableAction as FA_Spline;
                        if(fa.startObj == this){
                            let list = this.p.canObjs.filter(v=>v instanceof SplineHandleCObj);
                            fa.startObj = list[1];
                        }
                        this.p.hist.add(new HA_DeleteCanObj(this._id,"Remove handle"));
                        this.update();
                    }
                },
                {
                    label:"Shift Back",
                    onclick:(d,cont)=>{
                        let list = this.p.canObjs;
                        let i = list.indexOf(this);
                        let og_i = i;
                        list.splice(i,1);
                        i--;
                        while(i >= 0){
                            if(list[i] instanceof SplineHandleCObj) break;
                            i--;
                        }
                        if(i < 0) i = 0;
                        // if(i < 0) return;
                        list.splice(i,0,this);
                        this.p.hist.add(new HA_ArrangeCanObj("Shift handle back",og_i,i,this._id));
                        this.update();
                    }
                },
                {
                    label:"Shift Forward",
                    onclick:(d,cont)=>{
                        let list = this.p.canObjs;
                        let i = list.indexOf(this);
                        let og_i = i;
                        list.splice(i,1);
                        i++;
                        while(i < list.length){
                            if(list[i] instanceof SplineHandleCObj) break;
                            i++;
                        }
                        i++;
                        if(i >= list.length) i = list.length;
                        // if(i >= list.length) return;
                        list.splice(i,0,this);
                        this.p.hist.add(new HA_ArrangeCanObj("Shift handle forward",og_i,i,this._id));
                        this.update();
                    }
                },
                {
                    label:"Restore Handles",
                    onclick:(d,cont)=>{
                        if(!this.handles[0] && !this.handles[1]){
                            this._restoreBothHandles();
                            this.p.hist.add(new HA_RestoreSplineHandles(this._id,this.handles.map(v=>v._id)));
                            this.update();
                            return;
                        }
                        else if(!this.handles[0] || !this.handles[1]){
                            let i = !this.handles[0] ? 0 : 1;
                            this._restoreHandle(i);
                            this.p.hist.add(new HA_RestoreSplineHandles(this._id,this.handles.map(v=>v._id),i));
                            this.update();
                            return;
                        }
                        // do nothing bc there are both already
                    }
                }
            ],undefined,undefined,undefined,{
                // inMenuCont:true,
                // isRightClick:true,
                // noHit:true,
                openAfter:true,
                onClick:e=>{
                    // e.stopImmediatePropagation();
                    // e.stopPropagation();
                },
                onMainClick:e=>{
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                },
                // noClassAdd:true,
            });
            tmpDDCont.appendChild(div);

            // let r = this.cont.getBoundingClientRect();
            div.style.left = e.clientX+"px";
            div.style.top = e.clientY+"px";
            // div.style.left = r.left+"px";
            // div.style.top = (r.top+r.height+3)+"px";
            return;
        }

        if(e.button != 0) return;
        
        super.mouseDown(e);
        if(!this.isOver) return;

        if(altKey){
            setTimeout(()=>{
                this.p.removeCanObj(this);
                this.p.hist.add(new HA_DeleteCanObj(this._id,"Remove handle"));
            },0);
        }
    }
    getID(): string {
        return "spline_handle";
    }
    createNew() {
        return new SplineHandleCObj(0,0,0,0,0,0);
    }
    render(){
        if(selProject?.curFinishableAction instanceof FA_Spline){
            let fa = selProject.curFinishableAction as FA_Spline;
            fa.update();
        }
        for(const h of this.handles){
            h?.update();
        }
    }
    serialize() {
        let d = super.serialize();
        d.sx = this.sx;
        d.sy = this.sy;
        d.ex = this.ex;
        d.ey = this.ey;
        d.hs = this.handles.map(v=>v?._id);
        return d;
    }
    deserialize(data: any): void {
        super.deserialize(data);
        this.sx = data.sx;
        this.sy = data.sy;
        this.ex = data.ex;
        this.ey = data.ey;
        this.existingHandleIds = [...data.hs];
    }
}
class SplineSubHandleCObj extends HandleCObj{
    constructor(x:number,y:number,parent:SplineHandleCObj,isEnd:boolean){
        super(x,y,2);
        this.parent = parent;
        this.pid = parent?._id ?? -1;
        this.cont.classList.add("sub-handle");
        let beam = document.createElement("div");
        beam.className = "handle-beam";
        this.beam = beam;
        this.cont.appendChild(beam);
        this.isEnd = isEnd;
    }
    parent:SplineHandleCObj;
    pid:number;
    isEnd = false;
    beam:HTMLElement;
    skipSave(): boolean {
        return true;
    }
    getID(): string {
        return "spline_sub_handle";
    }
    createNew() {
        return new SplineSubHandleCObj(0,0,undefined,false);
    }
    moveTo(x: number, y: number): void {
        super.moveTo(x,y);
        if(!this.parent) return;
        if(!this.isEnd){
            this.parent.sx = this.x;
            this.parent.sy = this.y;
        }
        else{
            this.parent.ex = this.x;
            this.parent.ey = this.y;
        }

        if(ctrlKey || shiftKey){
            let t = this;
            let o = (this.parent.handles[0] == t ? this.parent.handles[1] : this.parent.handles[0]);
            if(o){
                o.quickMove(-t.x,-t.y);
            }
        }
        
        this.parent.render();
    }
    quickMove(x:number,y:number){ // without render call
        super.moveTo(x,y);
        if(!this.parent) return;
        if(!this.isEnd){
            this.parent.sx = this.x;
            this.parent.sy = this.y;
        }
        else{
            this.parent.ex = this.x;
            this.parent.ey = this.y;
        }
    }
    mouseDown(e: UniversalMouseEvent): void {
        if(e.button == 2 && this.isOver){
            this.p.deselectAllCanObjs();
            this.p.unhoverAllCanObjs();
            this.select();
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();

            let div = document.createElement("div");
            setupDropdown(div,"d",[
                {
                    label:"Remove",
                    onclick:(d,cont)=>{
                        if(!this.isEnd) this.parent.handles[0] = null;
                        else this.parent.handles[1] = null;
                        this.p.removeCanObj(this);
                        this.parent.update();
                        this.p.hist.add(new HA_RemoveSplineSubHandle(this._id));
                    }
                }
            ],undefined,undefined,undefined,{
                openAfter:true,
                onMainClick:e=>{
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                }
            });
            tmpDDCont.appendChild(div);

            div.style.left = e.clientX+"px";
            div.style.top = e.clientY+"px";
            return;
        }
        if(e.button != 0) return;
        
        super.mouseDown(e);
        if(!this.isOver) return;
        if(ctrlKey && altKey){
            // delete both
        }
        else if(altKey){
            // delete this handle
            if(!this.isEnd){
                this.parent.handles[0] = null;
                // this.parent.sx = 0;
                // this.parent.sy = 0;
            }
            else{
                this.parent.handles[1] = null;
                // this.parent.ex = 0;
                // this.parent.ey = 0;
            }
            e.stopImmediatePropagation();
            e.stopPropagation();
            setTimeout(()=>{
                this.p.removeCanObj(this);
                this.parent.update();
                this.p.hist.add(new HA_RemoveSplineSubHandle(this._id));
                // this.p.hist.add(new HA_DeleteCanObj(this._id,"Remove sub handle"));
            },0);
        }
    }
    serialize() {
        let d = super.serialize();
        d.pid = this.pid;
        return d;
    }
    deserialize(data: any): void {
        super.deserialize(data);
        if(!this.p){
            this.pid = -1;
            this.parent = undefined;
            return;
        }
        this.pid = data.pid;
        // this.parent = this.p.canObjs.find(v=>v._id == this.pid && v instanceof SplineHandleCObj) as SplineHandleCObj;
        this.parent = this.p.getCanObj(this.pid) as SplineHandleCObj;
    }
    render(): void {
        let p = this.p;
        if(!this.parent){
            console.warn("Sub handle didn't have a parent:",this);
            return;
        }
        let x = this.parent.x+this.x;
        let y = this.parent.y+this.y;

        if(!this.isEnd){
            x = this.parent.x+this.parent.sx;
            y = this.parent.y+this.parent.sy;
        }
        else{
            x = this.parent.x+this.parent.ex;
            y = this.parent.y+this.parent.ey;
        }

        // if(!this.isEnd){
        //     this.parent.sx = this.x;
        //     this.parent.sy = this.y;
        // }
        // else{
        //     this.parent.ex = this.x;
        //     this.parent.ey = this.y;
        // }

        this.anchorX = 0;
        this.anchorY = 0;

        this.cont.style.left = (x/p.w*100+(this.anchorX*this.w)/p.w*100)+"%";
        this.cont.style.top = (y/p.h*100+(this.anchorY*this.h)/p.h*100)+"%";
        this.cont.style.width = (this.w/p.w*this.sw*100)+"%";
        this.cont.style.height = (this.h/p.h*this.sh*100)+"%";
        this.cont.style.translate = `${-this.anchorX*100}% ${-this.anchorY*100}%`;

        // 
        this.renderHandleBeams(x,y);
    }
    renderHandleBeams(x:number,y:number){
        let b = this.beam;
        let r1 = this.parent.cont.getBoundingClientRect();
        let r2 = this.cont.getBoundingClientRect();
        let x1 = r1.x+r1.width/2;
        let y1 = r1.y+r1.height/2;
        let x2 = r2.x+r2.width/2;
        let y2 = r2.y+r2.height/2;
        let dx = x2-x1;
        let dy = y2-y1;
        let ang = Math.atan2(dy,dx)+Math.PI;
        let dist = Math.sqrt(dx**2+dy**2);
        // dist -= r1.width/2 + r2.width/2; // extra
        dist -= r1.width/2;
        if(dist < 0) dist = 0;
        b.style.rotate = `${ang}rad`;
        b.style.width = `${dist}px`;
        b.style.translate = "0px 0px";
        // b.style.translate = `${-dx/dist*0.9*r2.width/2}px ${-dy/dist*0.9*r2.height/2}px`;
    }
    onZoom(){
        if(!this.parent) return;
        // this.renderHandleBeams(this.parent.x+this.x,this.parent.y+this.y);
        this.render();
    }
}

class ChangableCObj extends PreviewCObj{
    getW(){
        return this.w;
    }
    getH(){
        return this.h;
    }
    
    resizeTo(sw: number, sh: number): void {
        super.resizeTo(sw,sh);
        // this.w = this.can.width*this.sw;
        // this.h = this.can.height*this.sh;
        this.update();
    }
    mouseMove(e: UniversalMouseEvent): void {
        super.mouseMove(e);
        if(this._dragging){
            if(this._dragType == CODragType.rotate) for(const o of this.p.selCOs){
                if(!(o instanceof SelectableCObj)) continue;
                this._hasMoved = true;
                let angDist = this._calcRotate();

                o.rotateBy(angDist);
            }
            else if(this._dragType == CODragType.scale) for(const o of this.p.selCOs){
                if(!(o instanceof SelectableCObj)) continue;
                this._hasMoved = true;

                let dx = mx-lx;
                let dy = my-ly;
                let isShift = e.shiftKey;
                if(e.shiftKey){ // failed attempt to make rotation snapping at the moment
                    // let lar = Math.max(Math.abs(amtX),Math.abs(amtY));
                    // amtX = lar*(amtX/Math.abs(amtX));
                    // amtY = lar*(amtY/Math.abs(amtY));
                    // this.sw = this.sh;
                    // amtX = amtY;
                    // dx = dy;
                }
                let amtX = Math.cos(-this.a)*dx - Math.sin(-this.a)*dy; // rotation matrix :D
                let amtY = Math.cos(-this.a)*dy + Math.sin(-this.a)*dx;
                if(this._overScale.has(Side.right)){                    
                    if(isShift){
                        this.sh = this.sw;
                        amtY = amtX;
                    }
                    
                    let amt = amtX;
                    o.resizeBy(amt/this.getW(),0);
                    o.moveBy(Math.cos(this.a)*amt*this.anchorX,Math.sin(this.a)*amt*this.anchorY);
                }
                else if(this._overScale.has(Side.left)){
                    if(isShift){
                        this.sh = this.sw;
                        amtY = amtX;
                    }
                    
                    let amt = amtX;
                    o.resizeBy(-amt/this.getW(),0);
                    o.moveBy(Math.cos(this.a)*amt*(1-this.anchorX),Math.sin(this.a)*amt*(1-this.anchorY));
                }
                if(this._overScale.has(Side.bottom)){
                    if(isShift){
                        this.sw = this.sh;
                        amtX = amtY;
                    }
                    
                    let amt = amtY;
                    o.resizeBy(0,amt/this.getH());
                    o.moveBy(-Math.sin(this.a)*amt*this.anchorY,Math.cos(this.a)*amt*this.anchorX);
                }
                else if(this._overScale.has(Side.top)){
                    if(isShift){
                        this.sw = this.sh;
                        amtX = amtY;
                    }
                    
                    let amt = amtY;
                    o.resizeBy(0,-amt/this.getH());
                    o.moveBy(-Math.sin(this.a)*amt*(1-this.anchorY),Math.cos(this.a)*amt*(1-this.anchorX));
                }
            }
        }
    }
}
class ImgCObj extends ChangableCObj{
    constructor(x:number,y:number,_can:HTMLCanvasElement,clone=true){
        let can = _can;
        if(_can && clone){
            // let pad = 4;
            // let max = Math.max(_can.width,_can.height);
            // can = createCan(max+pad,max+pad);
            // can.getContext("2d").drawImage(_can,pad/2,pad/2);
            // can = createCan(max+pad,max+pad);
            can = createCan(_can.width,_can.height);
            can.getContext("2d").drawImage(_can,0,0);
        }
        super(x,y,can?.width??0,can?.height??0);
        this.can = can;
        // if(can){
        //     this.w = can.width;
        //     this.h = can.height;
        // }
    }
    getID(): string {
        return "img";
    }
    createNew() {
        return new ImgCObj(0,0,null);
    }
    static fromImg(x:number,y:number,img:HTMLImageElement){
        let can = createCan(img.width,img.height);
        return new ImgCObj(x,y,can);
    }
    can:HTMLCanvasElement;

    getW(): number {
        return this.can.width;
    }
    getH(): number {
        return this.can.height;
    }

    update(){
        super.update();
        // let w = this.prev.canvas.width;
        // let h = this.prev.canvas.height;
        // let offx = 0;
        // let offy = 0;
        // if(this.can.width % 2 == 1) offx += 0.5;
        // if(this.can.height % 2 == 1) offy += 0.5;
        // let w2 = getCellW();
        // this.subCont.style.width = (w*w2)+"px";
        // this.subCont.style.height = (h*w2)+"px";
        // this.subCont.style.marginLeft = (-2*w2)+"px";
        // this.subCont.style.marginTop = (-2*w2)+"px";
        // this.subCont.style.marginLeft = (Math.cos(-this.a)*offx*w2+Math.sin(this.a)*offx*w2 -2*w2)+"px";
        // this.subCont.style.marginTop = (Math.sin(-this.a)*offy*w2+Math.cos(this.a)*offy*w2 -2*w2)+"px";
        // this.subCont.style.marginLeft = (Math.cos(-this.a)*offy*w2+Math.sin(this.a)*offx*w2)+"px";
        // this.subCont.style.marginTop = (Math.sin(-this.a)*offx*w2+Math.cos(this.a)*offy*w2)+"px";
        // this.subCont.style.width = (this.prev.canvas.width/selProject.w*100)+"%";
        // this.subCont.style.height = (this.prev.canvas.height/selProject.h*100)+"%";

        this.render();
    }
    render(): void {
        let prev = this.p.prev;
        this.p.clearPrev();
        prev.imageSmoothingEnabled = false;
        
        prev.translate(Math.round(this.x+this.w*this.anchorX),Math.round(this.y+this.h*this.anchorY)); // <-- NOTE: these all used to be rounds but I thought it lined up better this way, the newer way is rounds on the x's and then ceils on the y's
        prev.rotate(this.a);
        // prev.scale(this.w/this.can.width,this.h/this.can.height);
        prev.scale(this.sw,this.sh);
        prev.drawImage(this.can,-Math.round(this.can.width*this.anchorX),-Math.round(this.can.height*this.anchorY));

        prev.resetTransform();

        // let w2 = this._getPrevSize();
        // this.prev.canvas.width = w2;
        // this.prev.canvas.height = w2;
        // this.prev.imageSmoothingEnabled = false;
        // this.can.getContext("2d").imageSmoothingEnabled = false;
        // this.prev.resetTransform();
        // let dx = this.can.width/2;
        // let dy = this.can.height/2;
        // this.prev.translate(Math.floor(this.prev.canvas.width/2),Math.floor(this.prev.canvas.height/2));
        // this.prev.rotate(this.a);
        // this.prev.drawImage(this.can,-Math.floor(dx),-Math.floor(dy));
    }
    serialize() {
        let d = super.serialize();
        d.can = copyCan(this.can);
        return d;
    }
    deserialize(data: any): void {
        super.deserialize(data);
        this.can = copyCan(data.can);
    }
}

class CameraCObj extends ChangableCObj{
    constructor(x:number,y:number,w:number,h:number){
        super(x,y,w,h);
    }
    getID(): string {
        return "camera";
    }
    createNew() {
        return new CameraCObj(0,0,32,32);
    }
    static fromImg(x:number,y:number,img:HTMLImageElement){
        let can = createCan(img.width,img.height);
        return new ImgCObj(x,y,can);
    }
    update(){
        super.update();

        this.render();
    }
    render(): void {
        let p = this.p;
        let prev = p.prev;
        this.p.clearPrev();
        prev.imageSmoothingEnabled = false;

        prev.fillStyle = "rgba(0,0,0,0.8)";
        prev.fillRect(0,0,p.w,p.h);

        let w = this.w*this.sw;
        let h = this.h*this.sh;

        prev.translate(this.x+this.w/2,this.y+this.h/2);
        prev.rotate(this.a);

        prev.clearRect(-w/2,-h/2,Math.floor(w),Math.floor(h));

        // vvv - to fix antialiasing but i can't get it to work with opacity/alpha yet, it's just a solid black background
        // p.applyEffectedInstant(0,0,p.w,p.h);
        // correctCtx_general(prev,[0,0,0,200],0);

        prev.resetTransform();
    }
    serialize() {
        let d = super.serialize();
        return d;
    }
    deserialize(data: any): void {
        super.deserialize(data);
    }

    onAdd(): void {
        super.onAdd();
        selectToolId("pointer");
    }
}

// 

registerCanvasObj(new ImgCObj(0,0,null));
registerCanvasObj(new SplineHandleCObj(0,0,0,0,0,0));
registerCanvasObj(new SplineSubHandleCObj(0,0,undefined,false));
registerCanvasObj(new CameraCObj(0,0,32,32));

// 

if(false) kbAPI.registerEvent("copy_test","e",{ctrl:true},e=>{
    let first = selProject.getFirstCurLayer();
    if(!first) return;
    if(!first.ctx) return;

    let o = new ImgCObj(5,5,first.ctx.canvas);
    selProject.addCanObj(o);

    selectTool(tools.find(v=>v instanceof PointerTool));
});