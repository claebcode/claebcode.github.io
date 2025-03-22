if(!hasFileSystemAccess){
    console.warn("Warning: Your browser doesn't support the FileSystemAccessAPI, please use Chrome, Edge, Opera, or any Chromium based browsers. Fallback file access will be used instead.");
}

const legacyOpenInp = document.createElement("input");
const legacySaveAnchor = document.createElement("a");
legacyOpenInp.type = "file";

async function loadImgFromFile(f:File){
    console.log("init image load");
    let img = document.createElement("img");
    img.crossOrigin = "anonymous";
    let url = URL.createObjectURL(f);
    let xml = new XMLHttpRequest();
    xml.open("GET",url,true);
    xml.responseType = "arraybuffer";
    xml.onload = function(e){
        let blob = new Blob([this.response]);
        img.src = URL.createObjectURL(blob);
        console.log("start image load");
    };
    xml.onprogress = function(e){
        if(e.total == 0) return;
        console.log((e.loaded/e.total*100).toFixed(1));
    };
    let prom = new Promise<HTMLImageElement>(resolve=>{
        img.onload = function(){
            console.log("finished",img.width,img.height);
            URL.revokeObjectURL(url);
            URL.revokeObjectURL(img.src);

            resolve(img);
        };
        img.onerror = function(){
            resolve(null);
        };
    });
    xml.send();

    let out = await prom;

    return out;
}
function loadImg(b:Blob){
    let img = document.createElement("img");
    img.crossOrigin = "anonymous";
    let url = URL.createObjectURL(b);
    let prom = new Promise<HTMLImageElement>(resolve=>{
        img.onload = (e)=>{
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = function(e){
            URL.revokeObjectURL(url);
            console.warn("Err while loading img:",e,url);
            resolve(null);
        };
    });
    img.src = url;
    return prom;
}
function loadImgFromUrl(url:string){
    let img = document.createElement("img");
    img.crossOrigin = "anonymous";
    let prom = new Promise<HTMLImageElement>(resolve=>{
        img.onload = (e)=>{
            resolve(img);
        };
        img.onerror = function(){
            resolve(null);
        };
    });
    img.src = url;
    return prom;
}

const gFileTypes = [
    {
        description:"Supported Files",
        accept:{
            "image/qsp":[".qsp"],
            "image/qs":[".qs"],
            "image/png":[".png",".jpg",".jpeg"]
        }
    },
    {
        description:"Quick Surface File",
        accept:{
            "image/qsp":[".qsp"],
            "image/qs":[".qs"]
        }
    },
    {
        description:"Quick Surface Package",
        accept:{
            "image/qsp":[".qsp"]
        }
    },
    {
        description:"Quick Surface Project",
        accept:{
            "image/qs":[".qs"]
        }
    },
    {
        description:"Image",
        accept:{
            "image/png":[".png",".jpg",".jpeg"]
        }
    },
    {
        description:"Fallback",
        accept:{
            "application/zip":[".zip"]
        }
    }
] as FilePickerAcceptType[];

async function fallbackSave(b:Blob,filename:string){
    let url = URL.createObjectURL(b); // not sure when to revoke so I'll just leave it
    legacySaveAnchor.href = url;
    legacySaveAnchor.download = filename;
    legacySaveAnchor.click();
}
async function saveFileAs(p:Project){
    if(!p) return;
    
    if(hasFileSystemAccess){
        let handle = await showSaveFilePicker({
            types:gFileTypes,
            excludeAcceptAllOption:true,
            id:"save_file",
            suggestedName:p?.filename || ((p?.handle) ? p?.handle.name : "New File")
        });
        p.handle = handle;
        await _saveFile(await handle.getFile(),p,handle);
        p.updateFilename(handle.name);
    }
    else{ // fallback
        let newName = prompt("Enter a name for the file:",p?.legacyFile?.name ?? "New File.qsp");
        if(newName == null || newName == "") return;
        if(!newName.includes(".")) newName += ".qsp";
        if(newName.endsWith(".zip")) newName = newName.replace(".zip",""); // temp
        p.filename = newName;

        let type = "qsp";
        if(p.filename.includes(".qsp")) type = "qsp";
        else if(p.filename.includes(".qs")) type = "qs";
        else if(p.filename.includes(".png")) type = "png";
        else if(p.filename.includes(".jpg")) type = "jpg";
        else if(p.filename.includes(".jpeg")) type = "jpeg";
        
        if(!p.legacyFile){
            p.legacyFile = new File([],p.filename,{
                type:"image/"+type
            });
        }
   
        // @ts-ignore
        p.legacyFile.name = newName;
        await _saveFile(p.legacyFile,p);
    }
    if(false){ // old fallback
        let curLayer = p.getFirstCurLayer();
        if(curLayer){
            let url = curLayer.ctx.canvas.toDataURL();
            legacySaveAnchor.href = url;
            legacySaveAnchor.download = p.filename.replace(".qsp",".png").replace(".qs",".png");
            legacySaveAnchor.click();
            p.setSaved(true);
        }
    }
    
    p.addToRecents();
}
let _overrideFileVer = 2; // 0,2
async function saveFile(p:Project){
    if(!p) return;
    if(!p.handle) await saveFileAs(p);
    else await _saveFile(await p.handle.getFile(),p,p.handle);
}
function toBlob(can:HTMLCanvasElement){
    return new Promise<Blob>(resolve=>{
        can.toBlob(blob=>{
            resolve(blob);
        },"image/png");
    });
}
async function _saveFile(f:File,p:Project,handle?:FileSystemFileHandle){
    console.log(":: started save_file");
    
    if(!p) return;
    // if(!handle) return;
    if(!f) return;

    if(p.saving){
        console.warn("the project is current saving, skipped new save...");
        return;
    }

    // let f = await handle.getFile();
    let time = performance.now();
    p.fileItem.children[0].classList.add("saving"); // <- save dot

    let ver = 2; // 2 is for RW_gen2 and 0 is for base Quick Surface
    ver = _overrideFileVer;

    p.saving = true;

    p.onSave(); // save things like time spent

    if(imgTypes.includes(f.type)){
        // TODO - need to make function to validate whether a project can be saved as a certain file type
        if(p.frames.length > 1 || p.gLayers.length > 1){
            let res = confirm(
                "This project contains data that can't be saved to a standard image file such as extra frames or layers.\n\nThis data will be lost after saving.\n\nProceed anyways?\n\n(It is recommended to save as a .qsp file which supports all features, but the current selected frame with all visible layers will be merged for the final image if you continue.)"
            );
            if(!res){
                p.setSaved(false);
                p.fileItem.children[0].classList.remove("saving"); // <- save dot
                p.saving = false;
                return;
            }
        }
        
        console.log("> starting save of IMAGE file");
        const writableStream = (handle ? await handle.createWritable() : null);

        // 
        let ctx = createCan(p.w,p.h).getContext("2d");
        let frame = p.curFrame;
        for(const [id,l] of frame.layers){
            if(!l.ctx) continue;
            if(l.lref.hidden) continue;
            ctx.drawImage(l.ctx.canvas,0,0);
        }

        let blob = await toBlob(ctx.canvas);

        // 
        if(handle){
            await writableStream.write(blob);
            await writableStream.close();
        }
        else{ // fallback
            await fallbackSave(blob,p.filename);
        }

        console.log("## finished");
    }
    else if(f.type == "image/qsp" || f.name.endsWith(".qsp") || f.name.endsWith(".zip")){
        console.log("> starting save .qsp file");
        const writableStream = (handle ? await handle.createWritable() : null);

        // @ts-ignore
        let zip = new JSZip();

        type Proj = {
            name:string,
            p:Project
        };
        let projs:Proj[] = [
            {name:"main",p}
        ];
        for(const pp of projs){
            let folder = zip.folder(pp.name);
            
            // :: init vars
            if(ver < 2) ver = 2 // .qsp requires at least .qs version 2
            let w = p.w;
            let h = p.h;
            let totalParts = 0;
            for(const f of p.frames){
                for(const [id,l] of f.layers){
                    if(l.isEmpty()) continue;
                    totalParts++;
                }
            }

            let chunkW = 16384 / w;
            let chunkAmt = Math.ceil(totalParts / chunkW);
            let lastChunkI = Math.floor(totalParts / chunkW) * chunkW;
            let lastChunkW = totalParts - lastChunkI;
            if(lastChunkW == 0) lastChunkW = chunkW; // if totalParts is divisible by chunkW then the last chunk would be corrupted (width 0) without this

            // :: create metadata
            let meta = file_QS.metaConstruction(p,ver,w,h,{noReserveSpace:true});
            
            meta += "@qsp\n";
            meta += `${chunkAmt},16384,${chunkW},${lastChunkW}\n`;

            let projectInfoStr = file_QSP.getProjectInfo(p);
            if(projectInfoStr){
                meta += "@info\n";
                meta += projectInfoStr;
            }

            folder.file("meta.txt",meta);
            let chunkFolder = folder.folder("chunks");

            // :: create image data chunks
            console.log(":: create image data chunks");
            let _i = 0;
            let i = 0;
            let chunkI = 0;
            let chunks:CanvasRenderingContext2D[] = [];
            let curChunk:CanvasRenderingContext2D;
            let proms:Promise<Blob>[] = [];
            for(const f of p.frames){
                for(const [id,l] of f.layers){
                    if(l.isEmpty()) continue;

                    if(i == 0){
                        curChunk = createCan(chunkI == chunkAmt-1 ? w*lastChunkW : w*chunkW,h).getContext("2d");
                        chunks.push(curChunk);
                    }
                    curChunk.drawImage(l.ctx.canvas,i*w,0);
                    
                    i++;
                    _i++;
                    if(i == chunkW){
                        i = 0;
                        chunkI++;
                        proms.push(toBlob(curChunk.canvas));
                    }
                    else if(_i == totalParts) proms.push(toBlob(curChunk.canvas));
                }
            }

            // :: save chunk data to zip
            console.log(":: save chunk data to zip");
            let data = await Promise.all(proms);
            for(let i = 0; i < data.length; i++){
                let b = data[i];
                chunkFolder.file("chunk_"+i+".png",b);
            }
        }

        // :: finalize
        console.log(":: finalize");
        let content = await zip.generateAsync({type:"blob", compression: "STORE"});
        
        if(handle){
            await writableStream.write(content);
            await writableStream.close();
        }
        else{ // fallback
            await fallbackSave(content,p.filename);
        }

        console.log("## finished");
    }
    else if(f.type == "image/qs" || f.name.endsWith(".qs")){
        console.log("> starting save .qs file");

        const writableStream = (handle ? await handle.createWritable() : null);
        
        // :: init vars
        console.log(":: init vars");
        let can = document.createElement("canvas");
        let ctx = can.getContext("2d");
        let frameW = p.w;
        let frameH = p.h;
        let colAmt = 0;
        for(let i = 0; i < p.frames.length; i++){
            let frame = p.frames[i];
            let layers = [...frame.layers];
            for(let j = 0; j < layers.length; j++){
                let [_id,layer] = layers[j];
                // if(layer.isEmpty()) continue;
                if(layer.isEmpty()) continue;
                colAmt++;
            }
        }
        let width = Math.ceil(frameW*colAmt);
        let rowAmt = 1;
        let height = frameH*rowAmt;

        // :: start metadata construction (with layers def)
        let text = file_QS.metaConstruction(p,ver,frameW,frameH);

        console.log("META:",text);

        // > finished generating metadata

        // :: setup final canvas
        console.log(":: setup final canvas");
        let metaW = Math.ceil(text.length/height/3);
        if(metaW <= 3) metaW = 4;
        let metaH = height;

        let metaWLen = metaW.toString().length;
        let metaHLen = metaH.toString().length;
        let reserveSize = 6;
        text = metaW.toString()+text.substring(metaWLen);
	    text = text.substring(0,reserveSize)+metaH.toString()+text.substring(reserveSize+metaHLen);

        let fullW = width+metaW+1;
        let fullH = height;
        can.width = fullW;
        can.height = fullH;

        // :: save layer image data
        console.log(":: save layer image data"); // <-- THIS STAGE IS THE BIGGEST SLOWDOWN FOR LARGE PROJECTS WITH A LOT OF FRAMES/LAYERS - there may be a way to cache this so it only redraws the layers it knows were changed -> leading to insanely fast incremental saving
        let row = 0;
        let colI = 0;
        let amt = 0;
        if(!settings.debug_skipSaveLayerImageData) for(let i = 0; i < p.frames.length; i++){
            let frame = p.frames[i];
            // let layers = [...frame.layers];
            // for(let j = 0; j < layers.length; j++){
                // let [_id,layer] = layers[j];
            // for(const [_id,__layer] of frame.layers){
            for(const lref of p.gLayers){
                let layer = frame.layers.get(lref._id);
                if(!layer) continue;
                if(ver == 2) if(!layer.doesShowData()) continue; // <-- might not need this
                // if(layer.isEmpty()) continue;
                if(layer.isEmpty()) continue;
                ctx.drawImage(layer.ctx.canvas,metaW+1+colI,row);
                colI += frameW;
                amt++;
                // extra row logic in QS 1 if needed later
            }
        }
        else console.log(":: (skipped save layer image data b/c DEBUG_SKIP_SAVE_... was set to TRUE)");

        // :: create and save metadata image
        console.log(":: create and save metadata image");
        let ind = 0;
        let bufSize = metaW*metaH*4;
        let buf = new Uint8ClampedArray(bufSize);
        let x = 0;
        let y = 0;
        amt = 3;
        for(let i = 0; i < text.length; i += amt){
            let r = text.charCodeAt(i)||0;
            if(r == 0) break;
            let g = text.charCodeAt(i+1)||0;
            let b = text.charCodeAt(i+2)||0;

            buf[ind] = r;
            buf[ind+1] = g;
            buf[ind+2] = b;
            buf[ind+3] = 255;

            x++;
            if(x >= metaW){
                x -= metaW;
                y++;
            }

            ind += 4;
        }
        ctx.putImageData(new ImageData(buf,metaW,metaH),0,0);

        if(settings.debug_dontSaveToDisk){
            p.setSaved(true);
            p.fileItem.children[0].classList.remove("saving"); // <- save dot
            console.log("## finished (skipped finalize step b/c DEBUG_DONT_SAVE_TO_DISK was set to TRUE");
            return;
        }

        // :: finalize
        console.log(":: finalize");
        let blob = await new Promise<Blob>(resolve=>{
            can.toBlob(resolve,"image/png");
        });

        if(!blob){
            alert("An error occured while saving");
            return;
        }
        if(handle){
            await writableStream.write(blob);
            await writableStream.close();
        }
        else{ // fallback
            await fallbackSave(blob,p.filename);
        }

        console.log("## finished");
    }
    else{
        console.warn("> did not save, unknown file type and ext: ",f.type,f.name);
        alert("Error: did not save, unknown file type and ext: "+f.type+", "+f.name);
    }
    // let time = performance.now()-startTime;
    // await wait(1000);
    // setTimeout(()=>{
        p.setSaved(true);
        p.fileItem.children[0].classList.remove("saving"); // <- save dot
    // },0);

    console.log("TOTAL TIME: ",performance.now()-time);
    p.saving = false;
}

async function openFile(){
    // try{
        if(hasFileSystemAccess){
            let arr = await showOpenFilePicker({
                types:gFileTypes,
                excludeAcceptAllOption:true,
                id:"open_file",
                multiple:true
            });
            for(const handle of arr){
                _openFile(await handle.getFile(),handle);
            }
        }
        else{ // fallback
            let inp = document.createElement("input");
            inp.type = "file";
            inp.oninput = async function(e){
                console.log("...starting fallback file load...");
                let file = inp.files[0];
                if(!file){
                    console.warn("there was no file...");
                    return;
                }
                _openFile(file);
            };
            inp.click();
        }
        if(false){ // fallback (with legacy banner)
            openLegacyBanner();
            legacyBanner.appendChild(legacyOpenInp);
            // legacyOpenInp.accept = "*";
            // legacyOpenInp.accept = "image/qsp,image/qs,image/png,image/jpg,image/jpeg";
            legacyOpenInp.oninput = async function(e){
                closeLegacyBanner();
                console.log("...starting fallback file load...");
                let file = legacyOpenInp.files[0];
                if(!file){
                    console.warn("there was no file...");
                    return;
                }
                _openFile(file);
            };
        }
        if(false){ // old fallback
            openLegacyBanner();
            legacyBanner.appendChild(legacyOpenInp);
            legacyOpenInp.accept = "image/png,image/jpg,image/jpeg";
            legacyOpenInp.oninput = async function(e){
                closeLegacyBanner();
                let file = legacyOpenInp.files[0];
                if(!file) return;
                let img = await loadImgFromFile(file);
                let p = new Project(img.width,img.height,file.name);
                p.add();
                let curLayer = p.getFirstCurLayer();
                if(curLayer){
                    curLayer.ctx.drawImage(img,0,0);
                    curLayer.applyChange(true,false);
                }
                p.initialize();
            };
        }
    // }
    // catch(e){
    //     alert("An error occured while trying to open the file, check log.");
    //     console.error("ERROR WHILE OPENING FILE:",e);
    // }
}

async function openFolder(){
    if(!hasFileSystemAccess){
        alert("File system access must be supported by your browser to use this feature. Please use a new version of a Chromium based browser.");
        return;
    }

    let handle = await showDirectoryPicker({
        id:"open_folder",
        mode:"readwrite"
    });
    if(!handle){
        return;
    }

    _openFolder(handle);
}

function parseQSMetaData(ctx:CanvasRenderingContext2D){
    let width = ctx.canvas.width;
    let height = ctx.canvas.height;

    let data = ctx.getImageData(0,0,width,height).data;

    let w = "";
    let h = "";
    let i = 0;
    let offset = 8;
    
    for(let j = 0; j < 6; j++){
        w += String.fromCharCode(data[i+j]);
    }
    for(let j = 0; j < 6; j++){
        h += String.fromCharCode(data[offset+j]);
    }

    console.log("> pre meta: ",w,h);
    let metaW = parseInt(w.replace(/_/g,""));
    let metaH = parseInt(h.replace(/_/g,""));

    console.log("> meta: ",metaW,metaH);

    return {metaW,metaH};
}

const imgTypes = ["image/png","image/jpg","image/jpeg"];
async function _openFile(f:File,handle?:FileSystemFileHandle){
    // if(!handle) return;
    if(!f) return;
    if(handle){
        let perm = await handle.requestPermission({
            mode:"readwrite"
        });
        if(perm == "denied") return;
    }

    if(handle) for(const p of files){
        if(await p.handle?.isSameEntry(handle)){
            selectProject(p);
            return;
        }
    }

    // let f = await handle.getFile();
    let startTime = performance.now();

    // let imgTypes = [".png",".jpg",".jpeg"];
    // if(imgTypes.some(v=>name.endsWith(v))){
    if(imgTypes.includes(f.type)){
        // let img = await loadImgFromFile(f);
        let img = await loadImg(f);
        console.log("IMG:",f,img);
        let p = new Project(img.width,img.height,f.name);
        if(!handle) p.legacyFile = f;
        p.hist.startBare();
        p.handle = handle;
        p.add();
        p.setSaved(true);
        let curLayer = p.getFirstCurLayer();
        if(curLayer){
            curLayer.initCtxIfNeeded();
            curLayer.ctx.drawImage(img,0,0);
            curLayer.applyChange(true,false);
        }
        p.hist.endBare();
        p.initialize();
        p.loadFrame();
    }
    else if(f.type == "image/qsp" || f.name.endsWith(".qsp") || f.name.endsWith(".zip")){
        console.log(":: starting load of .qsp file");
        
        // @ts-ignore
        // if(!f.type) f.type = "application/zip";
        // @ts-ignore
        let zip = await JSZip.loadAsync(f);

        // :: start load
        let projs:string[] = ["main"];
        for(const pp of projs){
            // :: load meta
            let meta = await zip.files[pp+"/meta.txt"].async("text");

            // :: parse meta
            console.log(":: parse meta");
            let time = performance.now();
            let {
                ver,cellW,cellH,p,
                layerList,layerData2,sects
            } = file_QS.parseMeta(meta,f.name,handle,{
                noReserveSpace:true
            });
            console.log(performance.now()-time);

            // :: load chunks
            console.log(":: load chunks");
            time = performance.now();
            let {
                chunkAmt,maxWidth,chunkW,lastChunkW,projectInfo
            } = file_QSP.parsePackageMeta(sects);

            p.parseProjectInfo(projectInfo);

            let chunks:HTMLCanvasElement[] = [];
            for(let i = 0; i < chunkAmt; i++){
                let blob = await zip.files[pp+"/chunks/chunk_"+i+".png"].async("blob");
                let img = await loadImg(blob);
                if(!img){
                    alert("A critical error has occured, the file may possibly be corrupted. The image data is there but was unable to be read for some reason. Aborting.");
                    return;
                }
                let can = createCan(img.width,img.height);
                let ctx = can.getContext("2d");
                ctx.drawImage(img,0,0);
                chunks.push(can);
            }
            console.log(performance.now()-time);

            if(!handle) p.legacyFile = f; // legacy support
            
            // :: load image data into layers
            console.log(":: load image data into layers");
            time = performance.now();
            let _i = 0;
            let i = 0;
            let chunkI = 0;
            let curChunk = chunks[chunkI];
            for(let fI = 0; fI < p.frames.length; fI++){
                let frame = p.frames[fI];
                let frameD = layerData2[fI];
                if(frameD) for(const id of frameD.layers){
                    let layer = frame.layers.get(id);
                    layer.initCtxIfNeeded();
                    layer.ctx.drawImage(curChunk,-i*cellW,0);
                    layer.applyChange(true,false);
                    
                    _i++;
                    i++;
                    if(i == chunkW){
                        i = 0;
                        chunkI++;
                        curChunk = chunks[chunkI];
                    }
                }
            }
            console.log(performance.now()-time);

            // :: parse meta (Phase 2)
            console.log(":: parse meta (Phase 2)");
            time = performance.now();
            file_QS.parseMetaPhase2(p,sects);
            console.log(performance.now()-time);
            
            // :: finalize
            console.log(":: finalize");
            time = performance.now();
            file_QS.finalizeLoad(p,false);
            console.log(performance.now()-time);
        }
    }
    else if(f.type == "image/qs" || f.name.endsWith(".qs")){
        console.log(":: starting load of .qs file");
        
        let img = await loadImg(f);
        let str = "";
        
        // :: decryption
        console.log(":: starting decrypt");

        // setup canvas
        let can = document.createElement("canvas");
        can.width = img.width;
        can.height = img.height;
        let ctx = can.getContext("2d");
        ctx.drawImage(img,0,0);

        // read meta data
        let {metaW,metaH} = parseQSMetaData(ctx);
        let data = ctx.getImageData(0,0,metaW,metaH).data;
        let i = 0;
        let row = 0;
        let colI = 0;
        while(true){
            if(!data[i+3]) break;
            let r = data[i];
            if(r == 0) break;
            let g = data[i+1];
            let b = data[i+2];
            let letters = 
                String.fromCharCode(r) + 
                String.fromCharCode(g) + 
                String.fromCharCode(b);
            str += letters;
    
            i += 4;
            colI++;
            if(colI >= can.width) break;
            if(row >= can.height) break;
            // if(data[i] == 0){
            if(colI >= metaW){
                // i -= colI*4;
                // i -= metaW*4;
                colI = 0;
                // i += can.width*4;
                row++;
                continue;
            }
        }

        // parse meta data
        let {
            ver,cellW,cellH,p,
            layerList,layerData2,sects
        } = file_QS.parseMeta(str,f.name,handle);

        if(!handle) p.legacyFile = f; // legacy support

        // load spritesheet data
        let cells:Uint8ClampedArray[] = [];
        let ss_i = metaW+1;
        let ind = 0;
        while(ss_i+cellW <= img.width){
            let cell = ctx.getImageData(ss_i,0,cellW,cellH).data;
            cells.push(cell);
            // let layerData = layerList[ind];
            let zeroWidth = false;
            // if(false) if(layerData) if(layerData.isObj){ // place holder, does nothing in the rewrite at the moment
            //     cells.push(null);
            //     zeroWidth = true;
            // }
            if(!zeroWidth) ss_i += cellW;
            ind++;
        }

        // create and load layers
        if(ver == 0){
            ind = 0;
            for(let k = 0; k < cells.length; k++){
                let cell = cells[k];
                if(!cell) continue; // zeroWidth cells
                let layerData = layerList[ind];
                if(!layerData) continue;
                
                let frame = p.frames[layerData.frame];
                let name = layerData.name;
                if(!p.gLayers.some(v=>v.name == name)){
                    p.addGlobalLayer(name);
                    // visibility, locked?
                }
                let layer = frame.addLayer(p.gLayers.find(v=>v.name == name));
                layer.initCtxIfNeeded();
                layer.ctx.putImageData(new ImageData(cell,cellW,cellH),0,0);
                layer.applyChange(true,false);
    
                ind++;
            }
        }
        else if(ver == 2){
            let ind = 0;
            for(let k1 = 0; k1 < p.frames.length; k1++){
                let frame = p.frames[k1];
                // for(const [id,layer] of frame.layers){
                let frameD = layerData2[k1];
                if(frameD) for(const id of frameD.layers){
                    let cell = cells[ind];
                    let layer = frame.layers.get(id);
                    layer.initCtxIfNeeded();
                    // let lr = p.gLayers.find(v=>v._id == id);
                    // let layer = (lr.type == LayerType.background ? p.getBGLayer(id,true) : frame.addLayer(id));
                    layer.ctx.putImageData(new ImageData(cell,cellW,cellH),0,0);
                    layer.applyChange(true,false);
                    ind++;
                }
            }
        }

        // parse sections/settings (PHASE 2)
        file_QS.parseMetaPhase2(p,sects);

        // :: finalize
        file_QS.finalizeLoad(p);
    }
    if(selProject){
        selProject.updateCur();
        selProject.addToRecents();
    }
    console.log("TOTAL TIME:",performance.now()-startTime);
}

async function _openFolder(handle?:FileSystemDirectoryHandle){
    if(!handle) return;
    let perm = await handle.requestPermission({
        mode:"readwrite"
    });
    if(perm == "denied") return;

    console.warn(">> opened folder: "+handle.name);

    await addToRecentFolders(handle);
}

// GIF Export
declare const GIF:any;
interface GIFExportOptions{
    scale?:number;
    delay?:number;
    name?:string;
}
async function exportAsGIF(ops:GIFExportOptions){
    if(ops.scale == undefined) ops.scale = 1;
    if(ops.delay == undefined) ops.delay = 300;
    
    // Get the canvas element
    let p = selProject;
    if(!p){
        alert("Cannot export as gif, no project loaded");
        return;
    }
    
    const canvas = document.createElement("canvas");
    // console.log("OG:",p.w,p.h);
    canvas.width = p.w * ops.scale;
    canvas.height = p.h * ops.scale;
    // console.log("NEW:",canvas.width,canvas.height);
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = false;

    // Create a new GIF instance
    const gif = new GIF({
        workers: 4,
        quality: 1,
        // transparent: true,
        workerScript:"lib/gif.worker.js"
    });

    // let p = getPanel("mini_preview");
    // if(!p){
    //     alert("Error, at least one preview panel ")
    //     return;
    // }

    for(let i = 0; i < p.frames.length; i++){
        canvas.width = canvas.width; // to reset
        ctx.imageSmoothingEnabled = false;

        let f = p.frames[i];
        let a = f.getAll();
        for(const data of a.arr1){
            if(!data.v.doesShowData()) continue;
            if(ops.scale == 1) ctx.drawImage(data.v.ctx.canvas,0,0);
            else{
                ctx.drawImage(data.v.ctx.canvas,0,0,canvas.width,canvas.height);
            }
        }
        gif.addFrame(canvas,{copy:true,delay:ops.delay || 300});
    }

    let res:(v:boolean)=>void;
    let prom = new Promise<boolean>(resolve=>res = resolve);

    // Finalize the GIF
    gif.on('finished', function (blob:Blob) {
        if(ops.name){
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            console.log("NAME:",ops.name);
            link.download = ops.name;
            link.click();
    
            // Clean up the URL object
            URL.revokeObjectURL(url);
        }
        else{
            let url1 = URL.createObjectURL(blob);
            console.log("FINAL: ",url1);
            window.open(url1);
        }

        res(true);
    });
    gif.on("error",()=>{
        res(false);
    });

    // Start rendering the GIF
    gif.render();

    return prom;
}