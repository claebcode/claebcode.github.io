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

async function calc(){
    let img = await loadImage("mc.png");
    
    can.width = img.width;
    can.height = img.height;
    
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
    if(true){
        let ref = new Uint8ClampedArray(data);
        for(let y = 0; y < can.height; y++){
            for(let x = 0; x < can.width; x++){
                let dx = x-can.width/2;
                let dy = y-can.height/2;
                let dist = Math.sqrt(dx**2+dy**2);
                let ang = Math.atan2(dy,dx);
                ang += dist/100;

                let tx = Math.floor(Math.cos(ang)*dist);
                let ty = Math.floor(Math.sin(ang)*dist)+can.height/2;
                let ind = Math.floor((tx+ty*can.width)*4);

                data[i] = ref[ind];
                data[i+1] = ref[ind+1];
                data[i+2] = ref[ind+2];

                i += 4;
            }
        }
    }

    ctx.putImageData(new ImageData(data,can.width,can.height),0,0);
    console.log("done");
}
calc();