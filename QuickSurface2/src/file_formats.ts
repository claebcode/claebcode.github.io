// QS - Quick Surface Project
const file_QS = {
    metaConstruction(p:Project,ver:number,frameW:number,frameH:number,ops:{
        noReserveSpace?:boolean
    }={}){
        console.log(":: start metadata construction (with layers def)");
        let text = `${ops.noReserveSpace?"":"____________"}${ver},${frameW},${frameH}\n`; //[metaWidth & metaHeight reserved x12], [version], [cellWidth], [cellHeight] // Version: 0 (Quick Surface), 1 (Quick Surface Rewrite)
        if(ver == 0){
            for(let i = 0; i < p.frames.length; i++){
                let frame = p.frames[i];
                let layers = [...frame.layers];
                for(let j = 0; j < layers.length; j++){ // old format needs to be reworked (version 0)
                    let [_id,layer] = layers[j];
                    // if(layer.isEmpty()) continue;
                    let prefix = "";
                    // in the rewrite, there are no prefixes yet
                    text += (prefix?prefix.substring(0,prefix.length-1):"")+(prefix.length?"\x01":"")+layer.lref.name;
                    if(j != layers.length-1) text += ",";
                }
                if(i != p.frames.length-1) text += ";";
            }
            text += "\n";
        }
        else if(ver == 2){ // RW_gen2 layer saving
            text += `@l:${p.frames.length}\n`;
            for(let i = 0; i < p.gLayers.length; i++){
                let l = p.gLayers[i];
                text += l.serialize()+"\n"; // <- serialize uses ^ so it cannot contain that either
            }
            text += "@d\n"; // RW_gen2 layer data for positioning
            for(const l of p.gLayers){
                let list:number[] = [];
                for(let i = 0; i < p.frames.length; i++){
                    let f1 = p.frames[i];
                    let layer = f1.layers.get(l._id);
                    if(!layer) continue;
                    if(layer.isEmpty()) continue;
                    list.push(i);
                }
                if(!list.length) continue;
                text += l._id+"^"+list.join(",")+"\n";
            }
            text += "@sp\n"; // RW_gen2 span data
            for(let i = 0; i < p.frames.length; i++){
                let fr = p.frames[i];
                for(const [_id,l] of fr.layers){
                    if(l.spans.length) text += i+"^"+_id+"^"+(l.spans.length*l.spanDir)+"\n"; // frameI, layerID, len
                }
            }
            if(p.cp){
                text += "@cp\n";
                text += p.cp.serialize()+"\n";
            }
            text += "@c\n";
            text += map8x4To32(convert(col))+"\n";
            text += gAlpha+"\n";
        }

        // :: system settings
        text += file_QS.metaSystemSettings(p);

        return text;
    },
    metaSystemSettings(p:Project){
        let text = "";
        console.log(":: system settings");
        text += "@s\n";
        text += "0,"+p.getCurFrameI()+","+(p.curFrame.curLayers.length ? p.gLayers.findIndex(v=>v._id == p.getFirstCurLayer().lref._id) : 0)+"\n";
        return text;
    },
    // OPENING
    parseMeta(meta:string,name:string,handle:FileSystemFileHandle,ops:{
        noReserveSpace?:boolean
    }={}){
        console.log("> load QS meta: ",meta);
        if(!ops.noReserveSpace) meta = meta.substring(12).split("\x00")[0].trim();
        else meta = meta.trim();
        let lines = meta.split("\n");
        let firstLine = lines[0].split(",");
        let ver = parseFloat(firstLine[0]);
        let cellW = parseInt(firstLine[1]);
        let cellH = parseInt(firstLine[2]);
        console.log(`>> ver: ${ver}, cellW: ${cellW}, cellH: ${cellH}`);

        let sects = meta.split("\n@");
        sects.splice(0,1);
        
        let names = lines[1].split(";");
        let layerList = [];

        // init project
        let p = new Project(cellW,cellH,name);
        p.hist.startBare();
        // p.removeAllLayers();
        p.handle = handle;
        p.add(false);
        p.setSaved(true);
        console.log("> loaded project");

        // init layers & frames
        if(ver == 0) for(let k = 0; k < names.length; k++){
            let layers = names[k].split(",");
            let frame = p._addFrames();
            for(let j = 0; j < layers.length; j++){
                let layerName = layers[j];
                let split = layerName.split("\x01");
                if(split.length == 1) split.splice(0,0,"");

                let tags = split[0].split(",");
                let realName = split[1];

                let visible = true;
                let locked = false;

                // load tags
                for(const tag of tags){ // tags are handled differently in the rewrite
                    if(tag == "h") visible = false; // also not done yet for rewrite
                    else if(tag == "l") locked = true; // not implemented yet
                }

                layerList.push({
                    frame:k,
                    layer:j,
                    name:realName,
                    visible,
                    locked
                });
            }
        }

        // parse sections/settings (PHASE 1)
        let layerData2 = [];
        for(let j = 0; j < sects.length; j++){
            let sect = sects[j];
            let ln = sect.split("\n");
            let sectMeta = ln[0].split(":");
            let type = sectMeta[0];

            if(type == "l"){ // RW_gen2 layer/frame data
                let frameAmt = parseInt(sectMeta[1]);
                // for(let k = 0; k < frameAmt; k++){
                //     // layerData2[k] = {layers:[] as number[]};
                //     p._addFrames();
                // }
                p._addFrames(frameAmt); // <-- potential good optimization
                for(let k = 1; k < ln.length; k++){
                    let lr = LayerRef.deserialize(ln[k]);
                    lr.addTo(p);
                    // layerData2[k-1].layers.push(lr._id);
                }
            }
            else if(type == "d"){
                for(let k = 1; k < ln.length; k++){
                    let line = ln[k].split("^");
                    let id = parseInt(line[0]);
                    let frameList = line[1].split(",").map(v=>parseInt(v));
                    for(const frameI of frameList){
                        let ff = p.frames[frameI];
                        if(!ff){
                            console.warn("Err: could not find frame specified to load to");
                            continue;
                        }
                        let d = layerData2[frameI];
                        if(!d){
                            d = {layers:[] as number[]};
                            layerData2[frameI] = d;
                        }
                        d.layers.push(id);
                        ff.addLayer(p.getLRef(id));
                    }
                }
            }
        }
        return {
            ver,cellW,cellH,p,
            layerList,layerData2,sects
        };
    },
    parseMetaPhase2(p:Project,sects:string[]){
        for(const sect of sects){
            let ln = sect.split("\n");
            let sectMeta = ln[0].split(":");
            let type = sectMeta[0];

            if(type == "s"){ // system settings/info
                for(let j = 1; j < ln.length; j++){
                    let s = ln[j].split(",");
                    let id = s[0];
                    switch(id){
                        case "0":{
                            p.curFrame = p.frames[parseInt(s[1])];
                            p.deselectLayers(); // is this necessary?
                            // p.curFrame.addCurLayer(p.curFrame.layers.get(0));
                            let dat = p.gLayers[parseInt(s[2])];
                            if(dat){
                                let k = dat._id;
                                // let l = p.curFrame.layers.get(k);
                                p.curFrame.addCurLayer(p.curFrame.getLayer(k,true));
                            }
                        } break;
                    }
                }
            }
            else if(type == "sp"){
                for(let k = 1; k < ln.length; k++){
                    let line = ln[k].split("^"); // frameI, layerI, len
                    let fr = p.frames[parseInt(line[0])];
                    if(!fr){
                        console.warn("ERR (@SP): couldn't find frame: "+line[0]);
                        continue;
                    }
                    let l = fr.layers.get(parseInt(line[1]));
                    if(!l){
                        console.warn("ERR (@SP): couldn't find layer: "+line[1]);
                        continue;
                    }
                    l.manualSpanBy(parseInt(line[2]));
                }
            }
            else if(type == "cp"){
                p.cp.deserialize(ln[1]);
            }
            else if(type == "c"){
                selProject.setColStr(RGBToHex(map32To8x4(parseInt(ln[1]))),parseFloat(ln[2]));
            }
        }
    },
    finalizeLoad(p:Project,cleanupEmpty=true){
        p._lId = p.gLayers.length;

        p.hist.endBare();
        // let time = performance.now();
        p.initialize();
        // console.warn("INIT TIME: ",performance.now()-time);
        // time = performance.now();
        loadAllPanels();
        // console.warn("LOAD PANELS TIME: ",performance.now()-time);
        // time = performance.now();
        p.loadFrame();
        // console.warn("LOAD FRAME TIME: ",performance.now()-time);

        // time = performance.now();
        if(cleanupEmpty) p.cleanupEmpty();
        // console.warn("cleanup empty time: ",performance.now()-time);
    }
};

// QSP - Quick Surface Package
const file_QSP = {
    parsePackageMeta(sects:string[]){
        let chunkAmt = 1;
        let maxWidth = 16384;
        let chunkW = 1;
        let lastChunkW = 1;
        let projectInfo:any;
        for(const sect of sects){ // <-- really need to optimize this, need some kind of clear at the end or something with the other parseMetas
            let ln = sect.split("\n");
            let sectMeta = ln[0].split(":");
            let type = sectMeta[0];

            if(type == "qsp"){ // package meta
                // `${chunkAmt},16384,${chunkW},${lastChunkW}\n`;
                let info = ln[1].split(",");
                chunkAmt = parseInt(info[0]);
                maxWidth = parseInt(info[1]);
                chunkW = parseInt(info[2]);
                lastChunkW = parseInt(info[3]);
            }
            else if(type == "info"){ // project info/stats
                projectInfo = JSON.parse(ln[1]);
            }
        }
        return {
            chunkAmt,maxWidth,chunkW,lastChunkW,projectInfo
        };
    },
    getProjectInfo(p:Project){
        let data = {
            time:p.time,

            // editor sizing
            
        };
        return JSON.stringify(data);
    }
};