/**@type {HTMLCanvasElement} */
const can = document.getElementById("can");
const ctx = can.getContext("2d");

/**
 * 
 * @param {*} src 
 * @returns {Promise<Image>}
 */
function loadImage(src=""){
    return new Promise(resolve=>{
        let img = new Image();
        img.onload = function(){
            resolve(img);
        };
        img.src = src;
    });
}

let mx = 0;
let my = 0;
document.addEventListener("mousemove",e=>{
    // mx = e.clientX/innerWidth*can.width - can.width/2;
    // my = e.clientY/innerHeight*can.height - can.height/2;
});

function wait(delay){
    return new Promise(resolve=>{
        setTimeout(()=>{
            resolve();
        },delay);
    });
}

let cache = [];
let animate = false;

let img;
async function calc(mx1){    
    if(animate) requestAnimationFrame(calc);
    
    can.width = img.width;
    can.height = img.height;

    // if(mx1 == null) mx = Math.floor(Math.sin(performance.now()/300)*30);
    // else mx = mx1;
    mx = Math.floor(Math.sin(performance.now()/300)*30);
    // console.log("TESTED: ",mx);

    // let cc = cache[mx];
    // if(cc){
    //     ctx.putImageData(new ImageData(cc,can.width,can.height),0,0);
    //     return;
    // }
    
    ctx.drawImage(img,0,0);
    let data = ctx.getImageData(0,0,can.width,can.height).data;
    ctx.clearRect(0,0,can.width,can.height);

    // let interval = 1/50;
    // let interval = 1/200;
    let interval = 1/200;
    if(false) for(let i = 0; i < data.length; i += 4){
        // data[i] = Math.floor(Math.random()*data[i]);

        // data[i] = Math.floor(data[i]*interval)/interval;
        // data[i+1] = Math.floor(data[i+1]*interval)/interval;
        // data[i+2] = Math.floor(data[i+2]*interval)/interval;
        // data[i+3] = Math.floor(data[i+3]*interval)/interval;

        // data[i+1] = Math.floor(data[i+2]/10)*10;
    }
    let i = 0;
    if(false) for(let y = 0; y < can.height; y++){
        for(let x = 0; x < can.width; x++){
            let dist = Math.sqrt((can.width/2-x)**2+(can.height/2-y)**2);
            // dist *= can.height;
            dist /= 6;
            data[i] = Math.floor(data[i]/dist)*dist;
            data[i+1] = Math.floor(data[i+1]/dist)*dist;
            data[i+2] = Math.floor(data[i+2]/dist)*dist;
            i += 4; // i++ for weird circles at top
        }
    }

    let ref;
    if(true){
        ref = new Uint8ClampedArray(data);
        for(let y = 0; y < can.height; y++){
            for(let x = 0; x < can.width; x++){
                let dx = x-can.width/2;
                let dy = y-can.height/2;
                let dist = Math.sqrt(dx**2+dy**2);
                let ang = Math.atan2(dy,dx);
                // ang += -Math.PI/2+5/(Math.sqrt(dist/100));
                ang += 100/dist**0.9-Math.PI/14;

                let tx = Math.floor(Math.cos(ang)*dist+mx);
                let ty = Math.floor(Math.sin(ang)*dist)+can.height/2;
                let ind = Math.floor((tx+ty*can.width)*4);

                let rat = 2;
                // let rat = 800/dist;

                // data[i] = (ref[ind+1]+ref[ind+2])/rat;
                // data[i+1] = (ref[ind]+ref[ind+1])/rat;
                // data[i+2] = (ref[ind+2]+ref[ind+1])/rat;
                // data[i] = ref[ind];
                // data[i+1] = ref[ind+1];
                // data[i+2] = ref[ind+2];
                ref[i] = data[ind];
                ref[i+1] = data[ind+1];
                ref[i+2] = data[ind+2];

                i += 4;
            }
        }
        cache[mx] = ref;
    }
    // await wait(0);

    if(!initing) ctx.putImageData(new ImageData(ref,can.width,can.height),0,0);
    console.log("done");
}

let initing = true;
async function init(){
    img = await loadImage("mc.png");
    // img = await loadImage("mc_50.png");
    // for(let i = -30; i < 30; i++){
    //     await calc(i);
    // }
    initing = false;
    calc();
}
init();