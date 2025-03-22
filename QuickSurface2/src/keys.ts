document.addEventListener("keydown",async e=>{
    let k = e.key.toLowerCase();
    if(k == "alt") e.preventDefault();

    if(k == "escape"){
        if(curTool?.inUse){
            if(curTool.cancel()) return;
        }
        if(openDropdowns.length){
            closeDropdowns();
            return;
        }
        if(areSubWindowsOpen()){
            while(allSubWindows.length){
                allSubWindows[0].close();
            }
        }
    }
    
    if(menuAPI.isMenuOpen()){
        let curMenu = menuAPI.getCurrentMenu();
        if(!curMenu) return;
        if(k == "escape"){
            await curMenu.close();
            updateOverCanvas();
        }
        else if(k == "enter"){
            await curMenu.confirm();
            updateOverCanvas();
        }
        return;
    }

    if(["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){
        // e.preventDefault();
        return;
    }

    if(mouseDown[0]) return;

    if(k == "t"){
        let b = document.querySelector(".bottom-pane") as HTMLElement;
        if(b){
            if(b.offsetHeight > 30){
                b.style.height = "0px";
            }
            else{
                if(bottomPanelHeight < 10) bottomPanelHeight = 160;
                b.style.height = bottomPanelHeight+"px";
            }
        }
        // if(bottomPanelHeight <= 26) bottomPanelHeight = lastBottomPanelHeight ?? 26;
        // else bottomPanelHeight = 26;
        applyNewSizing();
    }
    else if(k == "delete" || k == "backspace"){
        if(selProject){
            if(_overCanvas && selProject.isSel){
                selProject.clearFromSelection();
            }
            else{
                selProject.clearLayers();
            }
        }
    }

    if(selProject){
        let p = selProject;

        if(e.ctrlKey){
            if(k == "z"){
                if(e.shiftKey){
                    e.preventDefault();
                    p.hist.redo();
                }
                else{
                    e.preventDefault();
                    p.hist.undo();
                }
            }
            else if(k == "a"){
                if(!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) e.preventDefault();
            }
            else if(k == "n") e.preventDefault();
        }
    }
});

// implementation

kbAPI.onevent = function(e){
    let active = document.activeElement.tagName;
    if(active == "INPUT" || active == "TEXTAREA") return;
    if(menuAPI.isMenuOpen()) return;
    if(curTool) if(curTool.inUse) return false; // don't want keybinds to be pressed while drawing
    return true;
};

// file system
kbAPI.registerEvent("save_file","s",{ctrl:true},e=>{
    if(selProject) saveFile(selProject);
});
kbAPI.registerEvent("save_as_file","s",{ctrl:true,shift:true},e=>{
    if(selProject) saveFileAs(selProject);
});
kbAPI.registerEvent("open_file","o",{ctrl:true},e=>{
    if(selProject) openFile();
});

// edit actions
kbAPI.registerEvent("select_all","a",{ctrl:true},e=>{
    selProject?.edit.selectAll();
});
kbAPI.registerEvent("deselect_all","d",{ctrl:true},e=>{
    selProject?.edit.deselectAll();
});
kbAPI.registerEvent("deselect_canobjs","d",{ctrl:true,shift:true},e=>{
    selProject?.deselectAllCanObjs();
    selProject?.unhoverAllCanObjs();
});

// selection
kbAPI.registerEvent("duplicate_selection","d",{shift:true},e=>{
    selProject?.edit.duplicateSelection();
});
kbAPI.registerEvent("copy","c",{ctrl:true},e=>{
    let p = selProject;
    if(!p) return;
    if(curPanel?.getId() == "timeline"){
        e.preventDefault();
        copyFromLayer();
        return;
    }
    else if(_overCanvas && p.isSel){
        p.edit.copySelection();
    }
});
kbAPI.registerEvent("cut","x",{ctrl:true},e=>{
    let p = selProject;
    if(!p) return;
    if(curPanel?.getId() == "timeline"){
        e.preventDefault();
        cutFromLayer();
        // cutFromLayer2(); // <-- at some point this will be used in order to cut multiple layers at a time and paste them relative to each other
        return;
    }
    else if(_overCanvas && p.isSel){
        p.edit.cutSelection();
    }
});
kbAPI.registerEvent("paste","v",{ctrl:true},e=>{
    let p = selProject;
    if(!p) return;
    if(curPanel?.getId() == "timeline"){
        e.preventDefault();
        pasteToLayer();
        return;
    }
    else if(_overCanvas){
        p.edit.pasteSelection();
    }
});
kbAPI.registerEvent("paste_into_new_project","v",{ctrl:true,shift:true},e=>{
    let p = selProject;
    if(!p) return;
    e.preventDefault();
    pasteToLayer(undefined,true);
});
kbAPI.registerEvent("cancel","escape",{},e=>{
    let p = selProject;
    if(!p) return;
    if(p.curFinishableAction){
        p.curFinishableAction.cancel();
        return;
    }
});
kbAPI.registerEvent("confirm","enter",{},e=>{
    let p = selProject;
    if(!p) return;
    if(p.curFinishableAction){
        p.curFinishableAction.finish();
        return;
    }
});

// tools
kbAPI.registerEvent("tool_select","s",{},e=>{
    selectTool(tools.find(v=>v instanceof SelectTool));
});
kbAPI.registerEvent("tool_pencil","d",{},e=>{
    selectTool(tools.find(v=>v instanceof PencilTool));
});
kbAPI.registerEvent("tool_eraser","e",{},e=>{
    selectTool(tools.find(v=>v instanceof EraserTool));
});
kbAPI.registerEvent("tool_pointer","a",{},e=>{
    selectTool(tools.find(v=>v instanceof PointerTool));
});
kbAPI.registerEvent("tool_line","l",{},e=>{
    selectTool(tools.find(v=>v instanceof LineTool));
});
kbAPI.registerEvent("tool_fill","f",{},e=>{
    selectTool(tools.find(v=>v instanceof FillTool));
});
kbAPI.registerEvent("tool_eye_dropper","g",{},e=>{ // g for grab
    selectTool(tools.find(v=>v instanceof EyeDropperTool));
});

// timeline
kbAPI.registerEvent("goto_frame_left","q",{},e=>{
    let p = selProject;
    if(!p) return;
    if(p.getFirstCurLayer()) p.goto(p.getCurFrameI()-1,p.getFirstCurLayer().lref._id);
});
kbAPI.registerEvent("goto_frame_right","w",{},e=>{
    let p = selProject;
    if(!p) return;
    if(p.getFirstCurLayer()) p.goto(p.getCurFrameI()+1,p.getFirstCurLayer().lref._id);
});
kbAPI.registerEvent("goto_layer_up","q",{shift:true},e=>{
    let p = selProject;
    if(!p) return;
    let f = p.curFrame;
    if(!f) return;
    let l = p.getFirstCurLayer();
    if(!l) return;
    p.goto(p.getCurFrameI(),p.gLayers[(p.gLayers.indexOf(l.lref)+1) % p.gLayers.length]?._id);
});
kbAPI.registerEvent("goto_layer_down","w",{shift:true},e=>{
    let p = selProject;
    if(!p) return;
    let f = p.curFrame;
    if(!f) return;
    let l = p.getFirstCurLayer();
    if(!l) return;
    let next = p.gLayers.indexOf(l.lref)-1;
    if(next < 0) next += p.gLayers.length;
    p.goto(p.getCurFrameI(),p.gLayers[next]?._id);
});
kbAPI.registerEvent("add_frame_left","q",{alt:true},e=>{
    let p = selProject;
    if(!p) return;
    p.addFrames(1,p.getCurFrameI(),{selectAfter:true});
});
kbAPI.registerEvent("add_frame_right","w",{alt:true},e=>{
    let p = selProject;
    if(!p) return;
    p.addFrames(1,p.getCurFrameI()+1,{selectAfter:true});
});

kbAPI.registerEvent("brush_size_dec","[",{},e=>{
    if(curTool instanceof DrawingTool){
        curTool.brushSize.inc(-1);
    }
});
kbAPI.registerEvent("brush_size_inc","]",{},e=>{
    if(curTool instanceof DrawingTool){
        curTool.brushSize.inc(1);
    }
});
kbAPI.registerEvent("pick_color","c",{},e=>{
    let p = selProject;
    if(!p) return;
    p.pickColor(mx,my);
});

// mini preview
kbAPI.registerEvent("mini_preview_play","p",{},e=>{
    getPanel<MiniPreviewPanel>("mini_preview",p=>{
        p.togglePlay();
    });
});