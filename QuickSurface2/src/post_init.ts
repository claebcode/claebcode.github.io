// let timelinePanel:TimelinePanel;
// let historyPanel:HistoryPanel;

let inst = new Instance();
// inst.bottomPanel = new TimelinePanel(PanelLoc.right);
// inst.bottomPanel.load();
inst.addPanel(new TimelinePanel(PanelLoc.bottom));
// inst.addPanel(new ColorPanel(PanelLoc.bottom));
// inst.addPanel(new HistoryPanel(PanelLoc.bottom));

// timelinePanel = inst.bottomPanel as TimelinePanel;
// inst.addPanel(new HistoryPanel(PanelLoc.right));

inst.addPanel(new HistoryPanel(PanelLoc.right));
inst.addPanel(new ColorPanel(PanelLoc.right));
// inst.addPanel(new FolderViewPanel(PanelLoc.right));
// inst.addPanel(new MixerPanel(PanelLoc.right));
inst.addPanel(new MixerPanel(PanelLoc.left));
inst.addPanel(new MiniPreviewPanel(PanelLoc.left));

// let mainProject = new Project(64,64);
// // let mainProject = new Project(2048,2048);
// // let mainProject = new Project(4096,4096);
// mainProject.add(false);
// mainProject.setSaved(true);
// mainProject._addFrames(8);
// mainProject.addBGLayer("Background");
// mainProject.addGlobalLayer("Layer 2");
// mainProject.curFrame.addCurLayer(mainProject.curFrame.layers.get(1));
// mainProject.initialize();
// mainProject.loadFrame();

let mainProject = createNewProject(64,64,"New File",8,8);
mainProject.addBGLayer("Background",0);

// brushSize = 14;
// brushSize = 400;

// funny canvas spin
let rotSpeed = Math.PI*2/256;
let rotAcc = 1.06;
function updateTest(){
    requestAnimationFrame(updateTest);
    if(!selProject) return;
    selProject.setRot(selProject.rot+rotSpeed);
    if(keys["d"]) rotSpeed *= rotAcc;
    if(keys["s"]) rotSpeed *= 1/rotAcc;

    if(!_e) return;
    llx = lx;
    lly = ly;
    lx = mx;
    ly = my;
    clx = cmx;
    cly = cmy;
    let m = calcMouse(_e);
    mx = m.x;
    my = m.y;
    cmx = m.cx;
    cmy = m.cy;

    if(debugDrawEveryFrame) if(selProject) if(curTool) if(selProject.curFrame?.curLayers.length){
        curTool.draw(null);
        // curTool.move();
        // if(overCanvas){
            // if(curTool.inUse) 
        // }
    }
}
// updateTest();

selectTool(tools[0]);
updateAllPanels();

// 39330