function initCanExample(){
    const can = document.querySelector("#can_example") as HTMLCanvasElement;
    const ctx = can.getContext("2d");
    const nob = new NobsinCtx(ctx);

    function update(){
        
    }
    setInterval(update,16.667);
}

let src = convert("#930101");
let src2 = convert("#C60101");
let src3 = convert("#923701");
let to,to2,to3;

function initCanControl(){
    let color = document.querySelector("#i-color") as HTMLInputElement;
    let color2 = document.querySelector("#i-color2") as HTMLInputElement;
    let color3 = document.querySelector("#i-color3") as HTMLInputElement;
    const can = document.querySelector("#can_control") as HTMLCanvasElement;
    can.width = 70;
    can.height = 50;
    const ctx = can.getContext("2d");
    const nob = new NobsinCtx(ctx);
    // let img = tl.load("char_a_punch3.png",null);
    let anim = tl.loadAnim("char_a_punch4.png",32,32,null);

    let frameI = 0;
    let i = 0;

    color.value = "#930101";
    color2.value = "#C60101";
    color3.value = "#923701";

    function parseColor(col:string){
        col = col.replace("#","");
        return [
            parseInt(col.substring(0,2),16),
            parseInt(col.substring(2,4),16),
            parseInt(col.substring(4,6),16),
            255
        ];
    }

    function update(){
        nob.updateStart();
        nob.dep = new Uint8ClampedArray(nob.ssize);

        to = parseColor(color.value);
        to2 = parseColor(color2.value);
        to3 = parseColor(color3.value);

        nob.drawImage_basic_replaceMulti_dep(anim[frameI],0,0,[src,src2,src3],[to,to2,to3],0,0);

        nob.updateEnd();

        i++;
        if(i >= 10){
            i = 0;
            frameI++;
            if(frameI >= anim.length) frameI = 0;
        }
    }
    setInterval(update,16.667);
}

function initCanDepth(){
    const can = document.querySelector("#can_depth") as HTMLCanvasElement;
    can.width = 120;
    can.height = 60;
    const ctx = can.getContext("2d");
    const nob = new NobsinCtx(ctx);
    let anim = tl.loadAnim("char_walk_2.png",32,32,null);
    let frameI = 0;
    let i = 0;

    function update(){
        nob.updateStart();
        nob.dep = new Uint16Array(nob.ssize);

        let ang = performance.now()/500;
        let tx = Math.cos(ang)*nob.height*0.35;
        let ty = Math.sin(ang)*nob.height*0.25;
        let frame = anim[frameI];
        nob.flipX = (ty > 0);
        // nob.drawImage_basic_dep(frame,nob.centerX+tx-frame.w/2,nob.centerY+ty-frame.h/2-3,false,ty*20+500,0);
        nob.drawImage_basic_replaceMulti_dep(frame,nob.centerX+tx-frame.w/2,nob.centerY+ty-frame.h/2-3,[src,src2,src3],[to,to2,to3],ty*20+500,0);
        
        nob.drawLine_smart_dep(nob.centerX,nob.centerY+6,nob.centerX,nob.centerY-100,COLORS.gray,20,nob.centerY+600);
        // nob.drawLine_smart_dep(nob.centerX,nob.centerY,nob.centerX,nob.centerY-100,COLORS.gray,20,nob.centerY+1800);
        
        nob.updateEnd();

        i++;
        if(i >= 10){
            i = 0;
            frameI++;
            if(frameI >= anim.length) frameI = 0;
        }
    }
    setInterval(update,16.667);
}

// initCanExample();
initCanControl();
initCanDepth();