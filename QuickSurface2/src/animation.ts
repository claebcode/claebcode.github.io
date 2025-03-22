let dragSel = -1;
let _dragSelDone:number[] = [];
function selectDragSelItem(i:number,j:number){
    if(i != dragSel) return;
    if(_dragSelDone.includes(j)) return;
    _dragSelDone.push(j);
    return true;
}
function startDragSel(i:number,j:number){
    dragSel = i;
    return selectDragSelItem(i,j);
}
function endDragSel(){
    dragSel = -1;
    _dragSelDone = [];
}
document.addEventListener("mouseup",e=>{
    if(dragSel != -1) endDragSel();
});

class TimelinePanel extends Panel{
    constructor(loc:PanelLoc){
        // super(loc,false,true,false);
        super(loc,false,false,false); // no overflow x with new chunk based panel
    }
    getId(): string {
        return "timeline";
    }
    getName(): string {
        return "Timeline Panel";
    }

    i_frame:InputComponent;

    private tab:HTMLElement;
    d_preview:HTMLElement;
    x = 0;
    y = 0;
    w = 40;
    h = 10;
    clampMove(p:Project){
        this.x = Math.max(0,Math.min(this.x,p.frames.length-this.w-1));
        this.y = Math.max(0,Math.min(this.y,p.gLayers.length-this.h-1));
    }
    moveBy(x:number,y:number){
        this.x += x;
        this.y += y;
        this.clampMove(selProject);
        this.update();
    }
    onEndResize(): void {
        if(!settings.useTimelineChunkView) return;
        this.update();

        // readjusting scrolling after move, fixes bug: making the panel larger with a larger preview size meant less space so it was clamped so then you scroll horz forwards, then reducing the panel size and giving it more space would not expand the panel would not auto adjust
        this.moveBy(0,0);
    }

    _timelineHeight = 0;
    toggle(){
        if(!this.panel) return;
        if(this.panel.offsetHeight > 2){ // opened
            this._timelineHeight = this.panel.offsetHeight-2;
            if(this._timelineHeight < 30) this._timelineHeight = 300;
            this.panel.style.height = "0px";
        }
        else this.panel.style.height = this._timelineHeight+"px";
    }

    load(): void {
        // console.warn("LOADED TIMELINE");
        
        let p = this.panel;
        removeAllChildren(p);
        
        // let header = document.createElement("div");
        // header.className = "header2";
        // header.innerHTML = `
        //     <div>Timeline</div>
        // `;
        // p.appendChild(header);
        
        // let body = document.createElement("div");
        // p.appendChild(body);

        // this.header = header;
        // this.body = body;

        this.genHeader("Timeline");
        this.genBody();

        // load header
        this.i_frame = this.opComp.createInputBox("Frame","number",selProject?selProject.getCurFrameI()+1:-1,null,{
            contMargin:"0px",
            gap:5
        });
        confirmInput(this.i_frame.inp,e=>{
            if(!selProject) return;
            let f = selProject.getFirstCurLayer();
            if(!f) return;
            selProject.goto(this.i_frame.inp.valueAsNumber-1,f.lref._id);
        },{speed:-1});
        // let adjustFrames = this.opComp.createButtonList([
        //     {
        //         label:"Configure",
        //         // label:"Frames",
        //         type:ButtonType.accent,
        //         async onclick(e, b) {
                    
        //         }
        //     }
        // ]);
        // let adjustFrames = this.createHeaderOption("/assets/editor/menu.svg",e=>{

        // });
        // adjustFrames.classList.add("force-accent");

        let add_frame = this.createHeaderOption("/assets/animation/add_frame.svg",e=>{
            if(!selProject) return;
            selProject.addFrames(1,selProject.getCurFrameI()+1,{selectAfter:true});
        },"Add Frame","Add frames to the animation, right click for more options.");
        setupDropdown(add_frame,"u",[
            {
                label:"Add # Frames",
                onclick:(d,cont)=>{
                    menuAPI.open(new AddFramesMenu());
                }
            }
        ],undefined,undefined,undefined,{
            isRightClick:true
        });

        this.createHeaderOption("/assets/editor/new_global_layer_2.svg",e=>{
            if(!selProject) return;
            menuAPI.open(new AddLayerMenu(LayerType.global,1+Math.min(...selProject.curFrame.curLayers.map(v=>selProject.gLayers.indexOf(v.lref)))));
        },"New Global Layer","These act like standard layers.");
        this.createHeaderOption("/assets/editor/new_bg_layer_2.svg",e=>{
            if(!selProject) return;
            menuAPI.open(new AddLayerMenu(LayerType.background,1+Math.min(...selProject.curFrame.curLayers.map(v=>selProject.gLayers.indexOf(v.lref)))));
        },"New Background Layer","These layers will be constant for the entire animation.");

        this.createHeaderOption("/assets/editor/up.svg",e=>{
            if(!selProject) return;
            selProject.moveLayersBy(1);
        },"Move Layer Up","Rearranges this layer to be level one higher in the layer ordering.");
        this.createHeaderOption("/assets/editor/down.svg",e=>{
            if(!selProject) return;
            selProject.moveLayersBy(-1);
        },"Move Layer Down","Rearranges this layer to be level one lower in the layer ordering.");

        let menu = this.createHeaderOption("/assets/editor/menu.svg",e=>{
            
        });
        setupDropdown(menu,"u",[
            {
                label:"Delete Layer(s)",
                id:"delete_layers",
                icon:HistIcon.delete_global_layer,
                onclick(d,cont){
                    let p = selProject;
                    if(!p) return;
                    let all = p.getAllSelectedLayerIDs();
                    p.deleteLayers([...all]);
                },
                onview(d, cont) {
                    let p = selProject;
                    if(!p) return;
                    let all = p.getAllSelectedLayerIDs();
                    d.querySelector(".dd-text").textContent = `Delete ${all.size} Layer${all.size == 1 ? "" : "s"}`;
                }
            },
            {
                label:"Delete Frames(s)",
                id:"delete_frames",
                icon:HistIcon.delete_frame,
                onclick(d,cont){
                    let p = selProject;
                    if(!p) return;
                    let all = p.getAllSelectedFramesIs();
                    p.deleteFrames(all);
                },
                onview(d, cont) {
                    let p = selProject;
                    if(!p) return;
                    let all = p.getAllSelectedFrames();
                    d.querySelector(".dd-text").textContent = `Delete ${all.length} Frame${all.length == 1 ? "" : "s"}`;
                }
            },
            {
                label:"Clear Layer(s)",
                id:"clear_layer",
                icon:HistIcon.clear,
                onclick(d,cont){
                    selProject?.clearLayers();
                }
            },
            {
                label:"Clear from Selection",
                id:"clear_from_selection",
                icon:HistIcon.clear,
                onclick(d,cont){
                    selProject?.clearFromSelection();
                }
            }
        ],undefined,undefined,-3,{
            offx:0
        });

        let _lastTime = -9999;
        let lastY = 0;
        let y = 0;
        this.body.onwheel = (e)=>{
            if(!settings.useTimelineChunkView) return;
            e.preventDefault();
            if(performance.now()-_lastTime < 10) return;

            let isHorz = e.shiftKey;
            let isDX = false;
            let dy = e.deltaY;
            if(Math.abs(e.deltaX) != 0){
                isHorz = true;
                dy = e.deltaX;
                isDX = true;
            }

            y -= dy;
            if(Math.abs(y-lastY) < 30) return;
            let dir = (dy > 0 ? -1 : 1);
            lastY = y;
            _lastTime = performance.now();

            let h_speed = 4;
            let v_speed = 2;
            if(isDX) h_speed = Math.ceil(Math.abs(e.deltaX)/30);
            if(Math.abs(e.deltaY) < 20) v_speed = 1;

            if(isHorz) this.moveBy(-dir*Math.ceil(h_speed),0); // horz
            else this.moveBy(0,dir*v_speed); // vertical
        };

        // 
        this.update();
    }

    updateCurFrame(){
        this.i_frame.setVal(selProject?.getCurFrameI()+1);
    }
    update(force=false): void {
        // console.warn("[UPDATED] TIMELINE",selProject?.hist?._isBare);

        if(settings.debug_noTimelineUpdates) if(!force) return;
        if(settings.useTimelineChunkView){
            let contWidth = this.body.offsetWidth - (this.d_preview?.offsetWidth ?? 0);
            let firstCell = this.tab?.children[0]?.children[4] as HTMLElement;
            this.w = Math.floor((contWidth-(firstCell ? firstCell.offsetLeft : 0) - 30)/30-1);
            // this.w = Math.floor((contWidth-30*4-130)/30-1); // old formula
            // this.h = Math.floor((this.body.offsetHeight-30*3)/30-1); // old formula
            this.h = Math.floor((this.body.offsetHeight-30*3)/30+0.5);
            let min = 2;
            if(this.w <= min) this.w = min;
            if(this.h <= min) this.h = min;
        }

        let cellW = 29;

        let body = this.body;
        body.textContent = "";

        let p = selProject;
        if(!p) return;

        let tab = document.createElement("table");
        body.appendChild(tab);
        tab.className = "t-tl";

        // create layer preview
        let d_preview = document.createElement("div");
        d_preview.className = "tl-preview";
        this.body.appendChild(d_preview);
        this.d_preview = d_preview;

        // pre
        let customCols = [
            {
                id:"type",
                className:"",
                gen(d:Element,l:LayerRef){
                    d.innerHTML = `
                        <img class="icon" src="/assets/editor/${l.type == LayerType.global ? "global_layer" : "bg_layer"}.svg">
                    `;
                }
            },
            {
                id:"lock",
                icon:"/assets/editor/locked.svg",
                gen(d:Element,l:LayerRef){
                    if(l.locked) d.innerHTML = `
                        <img class="icon" src="/assets/editor/${l.locked ? "locked" : "unlocked"}.svg">
                    `;
                },
                click(l:LayerRef){
                    l.setLocked(p,!l.locked);
                    updateAllPanels();
                }
            },
            {
                id:"visibility",
                icon:"/assets/editor/visible.svg",
                gen(d:Element,l:LayerRef){
                    if(l.hidden) d.innerHTML = `
                        <img class="icon" src="/assets/editor/${!l.hidden ? "visible" : "hidden"}.svg">
                    `;
                },
                click(l:LayerRef){
                    l.setHidden(p,!l.hidden);
                    updateAllPanels();
                }
            }
        ];
        tab.innerHTML = "<tr><th class='tab-col tab-col-0' style='left:0px'></th></tr>";
        this.tab = tab.children[0] as HTMLElement;
        let firstTr = tab.querySelector("tr");
        for(let i = -customCols.length; i < p.frames.length; i++){
            if(settings.useTimelineChunkView){
                if(i >= 0) if(i < this.x-1 || i > this.x+this.w+1+(this.x > 0 ? -1 : 0)) continue;
            }
            let td = document.createElement("th");
            td.classList.add("cell");
            let ii = customCols.length+i+1;
            if(i < 0){
                td.classList.add("tab-col",`tab-col-${ii}`);
                td.style.left = (ii*cellW)+"px";
            }
            if(i >= 0) td.textContent = (i+1).toString();
            else{
                let custom = customCols[ii];
                if(custom) td.innerHTML = `
                    <div class="layer-icon"><img class="icon" src="${custom.icon}"></div>
                `;
            }
            firstTr.appendChild(td);
        }
        // chunks
        if(false) if(settings.useTimelineChunkView){
            this.body.onscroll = ()=>{
                let x = -this.body.scrollLeft;
                let y = -this.body.scrollTop;
                let tds = this.body.querySelectorAll("td");
                let cutLeft = 150;
                let cutTop = 150;
                let cutRight = this.body.offsetWidth-cutLeft;
                let cutBottom = this.body.offsetHeight-cutTop;
                for(const c of tds){
                    let out = false;
                    let l = x+c.offsetLeft;
                    let r = x+c.offsetLeft+c.offsetWidth;
                    let t = y+c.offsetTop;
                    let b = y+c.offsetTop+c.offsetHeight;
                    if(l < cutLeft && r < cutLeft) out = true;
                    else if(l > cutRight && r > cutRight) out = true;
                    if(t < cutTop && t < cutTop) out = true;
                    else if(b > cutBottom && b > cutBottom) out = true;
                    if(out){
                        c.style.opacity = "0";
                        c.style.borderColor = "red";
                    }
                    else{
                        c.style.display = null;
                        c.style.borderColor = null;
                    }
                }
            };
        }
        if(false) if(settings.useTimelineChunkView){
            for(let y = 0; y <= p.gLayers.length; y++){
                let row2 = tab.children[y] as HTMLElement;
                if(!row2) continue;
                // if(!row2) break;
                let out = false;
                if(y < this.y || y > this.y+this.h) out = true;

                // if(out) row2.style.display = "none";
                // else row2.style.display = null;
                if(out) row2.classList.add("hide");
                else row2.classList.remove("hide");

                // for(let x = this.x; x <= this.x+this.w; x++){

                // }
            }
        }
        
        // post
        let list = p.gLayers;
        let row = 0;
        let hasDoneChunkColStart = null;
        let hasDoneChunkColEnd = null;
        for(const l of list){
            if(settings.useTimelineChunkView) if(row < this.y || row > this.y+this.h){
                if(row < this.y){ // bottom
                    if(!settings.dontShowTLChunkOverflows) if(row == this.y-1){
                        let _tr = document.createElement("tr");
                        _tr.innerHTML = `<td class="cell v-tl-overflow" colspan=${this.w+customCols.length+3}><div>...</div></td>`;
                        // let amt = customCols.length+1+Math.min(this.w,p.frames.length)-1;
                        // for(let j = 0; j < amt; j++){
                        //     let _td = document.createElement("td");
                        //     _td.className = "cell";
                        //     _td.innerHTML = "<div></div>";
                        //     _tr.appendChild(_td);
                        // }
                        tab.children[0].insertBefore(_tr,tab.children[0].children[1]);
                    }
                    row++;
                    continue;
                }
                else if(row > this.y+this.h){ // top
                    if(!settings.dontShowTLChunkOverflows) if(row == this.y+this.h+1){
                        let _tr = document.createElement("tr");
                        _tr.innerHTML = `<td class="cell v-tl-overflow" colspan=${this.w+customCols.length+3}><div>...</div></td>`;
                        // let amt = customCols.length+1+Math.min(this.w,p.frames.length)-1;
                        // for(let j = 0; j < amt; j++){
                        //     let _td = document.createElement("td");
                        //     _td.className = "cell";
                        //     _td.innerHTML = "<div></div>";
                        //     _tr.appendChild(_td);
                        // }
                        tab.children[0].insertBefore(_tr,tab.children[0].children[1]);
                    }
                    row++;
                    continue;
                }
            }

            let tr = document.createElement("tr");
            let th = document.createElement("td");

            let i = 0;
            for(const custom of customCols){
                let cont = document.createElement("td");
                let icon = document.createElement("div");
                cont.className = `tab-col tab-col-${i}`;
                cont.style.left = (i*cellW)+"px";
                icon.className = `cell layer-icon`+(custom.className?" "+custom.className:"");
                if(custom.gen) custom.gen(icon,l);
                if(custom.click){
                    let _i = i;
                    let _row = row;
                    cont.addEventListener("mousedown",e=>{
                        if(e.button != 0) return;
                        if(dragSel == -1){
                            if(!startDragSel(_i,_row)) return;
                            custom.click(l);
                        }
                    });
                    cont.addEventListener("mouseenter",e=>{
                        if(!mouseDown[0]) return;
                        if(dragSel != _i) return;
                        if(!selectDragSelItem(_i,_row)) return;
                        custom.click(l);
                    });
                }
                cont.appendChild(icon);
                tr.appendChild(cont);
                i++;
            }
            
            th.className = `cell-h tab-col tab-col-${customCols.length}`;
            th.style.left = (customCols.length*cellW)+"px";
            let nameSpan = document.createElement("span");
            nameSpan.textContent = l.name;
            th.appendChild(nameSpan);
            // th.addEventListener("click",e=>{
                
            // });
            setupDropdown(th,"u",[
                {
                    label:"Rename",
                    icon:HistIcon.rename,
                    onclick:(d,cont)=>{
                        let l2 = selProject.gLayers.find(v=>v._id == l._id);
                        if(!l2){
                            alert("Error, couldn't find layer to rename");
                            return;
                        }
                        menuAPI.open(new RenameLayerMenu(l2._id));
                    }
                }
            ],undefined,undefined,undefined,{
                inMenuCont:true,
                isRightClick:true
            });
            tr.appendChild(th);

            if(l.type == LayerType.global) for(let i = 0; i < p.frames.length; i++){
                if(settings.useTimelineChunkView){
                    let ii = i;
                    // if(ii < this.x+(this.x > 0 ? -1 : 0)){
                    if(ii < this.x){
                        if(!settings.dontShowTLChunkOverflows) if(!hasDoneChunkColStart) if(ii == this.x-1){
                            let _td = document.createElement("td");
                            _td.className = "cell";
                            _td.rowSpan = Math.min(this.h+1,p.gLayers.length);
                            _td.innerHTML = "<div>...</div>";
                            // tab.children[0].children[1].insertBefore(_td,tab.children[0].children[1].children[0]);
                            tr.appendChild(_td);
                            hasDoneChunkColStart = _td;
                        }
                        continue;
                    }
                    else if(ii > this.x+this.w){
                        if(!settings.dontShowTLChunkOverflows) if(!hasDoneChunkColEnd) if(ii == this.x+this.w+1){
                            let _td = document.createElement("td");
                            _td.className = "cell";
                            _td.rowSpan = Math.min(this.h+1,p.gLayers.length);
                            _td.innerHTML = "<div>...</div>";
                            // tab.children[0].children[1].appendChild(_td);
                            tr.appendChild(_td);
                            hasDoneChunkColEnd = _td;
                        }
                        continue;
                    }
                }
                
                let td = document.createElement("td");
                td.className = "cell";
                td.classList.add(`c_${i}-${l._id}`); //frameI, layerID
                let div = document.createElement("div");
                td.appendChild(div);
                tr.appendChild(td);

                // if(settings.useTimelineChunkView) if(i == this.x-1){
                    
                //     continue;
                // }

                let f = p.frames[i];
                let layer = f.getLayer(l._id,true);
                let _id = l._id;
                // let layer = f.layers.get(l._id);
                if(layer ? layer.doesShowData() : false) div.innerHTML = "<div class='spot'></div>";
                if(layer) layer._td = td;
                td.classList.remove("span-c","span-r","span-l","non-empty");

                td.addEventListener("mousedown",e=>{
                    // let layer = f.layers.get(_id);
                    if(e.ctrlKey){
                        if(selProject.frames[i]){
                            selProject.frames[i].addRemoveCurLayer(layer);
                        }
                        return;
                    }
                    else if(e.altKey){
                        if(p.curFrame?.curLayers.length == 0){
                            console.warn("Err: only one layer needs to be selected in order to span");
                            return;
                        }
                        let first = p.getFirstCurLayer();
                        let needsMoveBack = false;
                        let lastI = 0;
                        if(first.spannedBy){
                            p.deselectLayers();
                            // first.spannedBy.frame.selectLayer(first.spannedBy.frame.layers.get(l._id));
                            let rootI = first.spannedBy.frame.getI();
                            needsMoveBack = true;
                            lastI = first.frame.getI();
                            p.goto(rootI,l._id);
                            let f1 = first;
                            first = p.getFirstCurLayer();

                            if(lastI > rootI && i < lastI){
                                lastI = i;
                                // let root = first;
                                // for(const l2 of root.spans){
                                //     l2.spannedBy = null;
                                // }
                                // let list3 = [...root.spans];
                                // root.spans = [];

                                // list3.splice(list3.indexOf(f1),1);
                                // list3.splice(0,0,root);
                                // f1.spans = list3;
                                // for(const l2 of f1.spans){
                                //     l2.spannedBy = f1;
                                // }

                                // first = f1;
                                // needsMoveBack = false;
                            }
                            else if(lastI < rootI && i > lastI) lastI = i;
                            // if(i > firstI) firstI = first.spannedBy.frame.getI();
                            // else{
                            //     firstI = first.spannedBy.frame.getI()+first.spannedBy.spans.length;
                            //     list2.push(p.frames[firstI].layers.get(l._id)); //
                            // }
                            // first = first.spannedBy;
                        }
                        if(!first){
                            console.warn("Err: only one layer needs to be selected in order to span");
                            return;
                        }
                        if(first.lref._id != layer.lref._id){
                            console.warn("Err: you can only span along the same row/layer");
                            return;
                        }
                        if(first.isEmpty() && (first.spannedBy ? first.spannedBy.isEmpty() : true)){ // idk if this should be like this or not
                            console.warn("Err: you can only span Non-Empty layers");
                            return;
                        }
                        let list2:Layer[] = [];
                        let firstI = first.frame.getI();
                        let dir = (i-firstI);
                        dir /= Math.abs(dir); //normalize to -1..1
                        for(let j = firstI+dir; dir > 0 ? (j <= i) : (j >= i); j += dir){
                            let next = selProject.frames[j];
                            let nLayer = next.layers.get(l._id);
                            if(!nLayer.isEmpty()){
                                console.warn("Err: all layers that will be spanned into must be empty");
                                return;
                            }
                            if(nLayer.spannedBy && nLayer.spannedBy != first){
                                console.warn("Err: all layers that will be spanned into must not be spanned by other layers");
                                return;
                            }
                            list2.push(nLayer);
                        }
                        let _lastLen = first.spans.length;
                        for(const s of first.spans){
                            s.spannedBy = null;
                        }
                        for(const l2 of list2){
                            l2.spannedBy = first;
                        }
                        first.spans = list2;
                        first.spanDir = dir;

                        if(needsMoveBack){
                            p.goto(lastI,l._id);
                        }
                        let _newLen = first.spans.length;

                        p.hist.add(new HA_CreateSpan(_newLen > _lastLen && _lastLen == 0 ? "Create span" : _newLen == 0 ? "Remove span" : "Adjust span",first.h_getLoc()));

                        this.update();
                        return;
                    }
                    else if(e.shiftKey){
                        let first = p.getFirstCurLayer();
                        if(!first){
                            // console.warn("Err: at least one layer needs to be selected in order to span");
                            return;
                        }
                        if(first.lref._id != layer.lref._id){
                            // console.warn("Err: you can only span along the same row/layer");
                            return;
                        }
                        let firstI = first.frame.getI();
                        let dir = (i-firstI);
                        dir /= Math.abs(dir); //normalize to -1..1
                        for(let j = firstI+dir; dir > 0 ? (j <= i) : (j >= i); j += dir){
                            let next = selProject.frames[j];
                            next.addCurLayer(next.layers.get(l._id));
                        }
                        return;
                    }
                    selProject.goto(i,l._id);
                });
            }
            else if(l.type == LayerType.background){
                let ok = true;
                if(settings.useTimelineChunkView){
                    if(this.x > 0 && this.x >= p.frames.length){
                        if(!settings.dontShowTLChunkOverflows) if(p.l_globals.length == 0) 
                        if(0 == this.x-1){
                            let _td = document.createElement("td");
                            _td.className = "cell";
                            _td.rowSpan = Math.min(this.h+1+(this.x>0?-2:0),p.gLayers.length);
                            _td.innerHTML = "<div>...</div>";
                            tr.appendChild(_td);
                        }
                        ok = false;
                    }
                    if(0 > this.x+this.w){
                        if(!settings.dontShowTLChunkOverflows) if(p.l_globals.length == 0)
                        if(0 == this.x+this.w+1){
                            let _td = document.createElement("td");
                            _td.className = "cell";
                            _td.rowSpan = Math.min(this.h+1+(this.x>0?-2:0),p.gLayers.length);
                            _td.innerHTML = "<div>...</div>";
                            tr.appendChild(_td);
                        }
                        ok = false;
                    }
                }
                
                if(ok){
                    let td = document.createElement("td");
                    td.className = "cell";
                    td.classList.add(`c_0-${l._id}`); //frameI, layerID
                    let div = document.createElement("div");
                    td.appendChild(div);
                    tr.appendChild(td);
                    if(settings.useTimelineChunkView){
                        if(this.x <= 0){
                            let max = Math.abs(this.w-Math.abs(this.x));
                            td.colSpan = Math.min(max+1,p.frames.length);
                        }
                        else{
                            td.colSpan = Math.min(this.w+1,p.frames.length);
                        }
                    }
                    else td.colSpan = p.frames.length;

                    let layer = p.getBGLayer(l._id,true);
                    let _id = l._id;
                    // let layer = p.frames[0].layers.get(l._id);
                    if(layer ? layer.doesShowData() : false) div.innerHTML = "<div class='spot'></div>";
                    if(layer) layer._td = td;

                    td.addEventListener("mousedown",e=>{
                        // let layer = p.frames[0].layers.get(_id);
                        if(e.ctrlKey){
                            if(selProject.frames[0]){
                                selProject.frames[0].addRemoveCurLayer(layer);
                            }
                            return;
                        }
                        selProject.goto(0,l._id);
                    });
                }
            }

            // tab.children[0].appendChild(tr);
            tab.children[0].insertBefore(tr,tab.children[0].children[1]);

            row++;
        }
        for(const l of list){
            if(l.type == LayerType.global) for(let i = 0; i < p.frames.length; i++){
                let f = p.frames[i];
                // let layer = f.getLayer(l._id,true);
                let layer = f.layers.get(l._id);
                if(!layer) continue;
                if(layer?.spans.length){
                    let isNonEmpty = !layer.isEmpty();
                    for(let j = 0; j < layer.spans.length; j++){
                        let l2 = layer.spans[j];
                        if(!l2._td) continue;
                        l2._td.classList.add(j == layer.spans.length-1 ? (layer.spanDir > 0 ? "span-r" : "span-l") : "span-c");
                        if(isNonEmpty){
                            l2._td.classList.add("non-empty");
                            l2._td.children[0].innerHTML = "<div class='spot'></div>";
                        }
                    }
                    if(!layer._td) continue;
                    layer._td.classList.add(layer.spanDir > 0 ? "span-l" : "span-r");
                    if(isNonEmpty) layer._td.classList.add("non-empty");
                }
            }
        }

        // move them to be longer cells
        if(!settings.dontShowTLChunkOverflows) if(settings.useTimelineChunkView){
            let i = 1;
            if(this.y+this.h < p.gLayers.length-1) i = 2;
            if(hasDoneChunkColStart){
                tab.children[0].children[i].insertBefore(hasDoneChunkColStart,tab.children[0].children[i].children[customCols.length+1]);
            }
            if(hasDoneChunkColEnd){
                tab.children[0].children[i].appendChild(hasDoneChunkColEnd);
            }
        }

        this.updateSel();
        
        // load the preview just in case
        p.loadTLPreview();
    }
    smallUpdate(){
        return;
        let p = selProject;
        if(!p) return;

        let tab = this.tab;
        let list = p.gLayers;
        let j = 0;
        for(const l of list){
            if(l.type != LayerType.global){
                j++;
                continue;
            }
            for(let i = 0; i < p.frames.length; i++){
                let f = p.frames[i];
                let layer = f.layers.get(l._id);
                if(!layer) continue;
                let tr = tab.children[j+1];
                if(!tr){
                    console.warn("Err: could not find tr at row: "+(j+1));
                    continue;
                }
                let td = tr.children[i+1];
                if(!td){
                    console.warn("Err: could not find td at col: "+(i+1));
                    continue;
                }
                let div = td.children[0];
                if(!div) continue;
                if(layer ? layer.doesShowData() : false) div.innerHTML = "<div class='spot'></div>";
                else div.innerHTML = "";
            }
            j++;
        }

        this.updateSel();
    }

    updateSel(){
        if(!selProject) return;

        let all = this.body.querySelectorAll(".sel");
        for(const c of all){
            c.classList.remove("sel");
        }
        
        selProject.loopSel(layer=>{
            let cell = this.body.querySelector(`.c_${layer.frame.getI()}-${layer.lref._id}`);
            if(!cell) return;
            let div = cell.children[0];
            
            if(layer ? layer.doesShowData() : false){
                div.innerHTML = "<div class='spot'></div>";
                // if(layer.spans.length){
                //     layer._td.classList.add("non-empty");
                //     for(const l of layer.spans){
                //         l._td.classList.add("non-empty");
                //     }
                // }
            }
            else{
                div.innerHTML = "";
                // if(layer.spans.length){
                //     layer._td.classList.remove("non-empty");
                //     for(const l of layer.spans){
                //         l._td.classList.remove("non-empty");
                //     }
                // }
            }
    
            cell.classList.add("sel");
        });
    }
}