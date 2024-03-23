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

let img;
let rr = 1;
async function calc(){
    if(!img){
        // img = await loadImage("paul.jpg");
        // img = await loadImage("mc_25.png");
        img = await loadImage("gundam.png");
        can.width = img.width;
        can.height = img.height;
        
        // ctx.drawImage(img,0,0);
    }
    // let img = await loadImage("paul.jpg");

    ctx.drawImage(img,0,0);

    for(let k = 0; k < 1; k++){
        let data = ctx.getImageData(0,0,can.width,can.height).data;
        ctx.clearRect(0,0,can.width,can.height);


        // let interval = 1/200;
        let interval = 1/100;
        if(false) for(let i = 0; i < data.length; i += 4){
            // data[i] = Math.floor(Math.random()*data[i]);

            data[i] = Math.floor(data[i]*interval)/interval;
            data[i+1] = Math.floor(data[i+1]*interval)/interval;
            data[i+2] = Math.floor(data[i+2]*interval)/interval;
            // data[i+3] = Math.floor(data[i+3]*interval)/interval;

            // data[i+1] = Math.floor(data[i+2]/10)*10;
        }

        rr = Math.sin(performance.now()/1000)*20;
        let r3 = 0.5;
        if(rr >= 0 && rr < r3) rr = r3;
        if(rr <= 0 && rr > -r3) rr = -r3;
        rr = Math.sin(performance.now()/1000)*20;
        // rr = Math.sin(performance.now()/2000)*20;
        // rr = Math.pow(performance.now()/2,1.2);

        if(true){
            let i = 0;
            let ref = new Uint8ClampedArray(data);
            for(let y = 0; y < can.height; y++){
                for(let x = 0; x < can.width; x++){
                    let dx = x-can.width/2;
                    let dy = y-can.height/2;
                    // let dist = Math.sqrt(dx**2+dy**2);
                    let dist = Math.abs(dx)+Math.abs(dy);
                    let ang = Math.atan2(dy,dx);
                    // ang += -Math.PI/2+(Math.sqrt(dist/100));
                    ang += -Math.PI/2+5/(Math.sqrt(dist/100));
                    // ang += 100/dist**0.9-Math.PI/14;
    
                    let tx = 0;
                    let ty = 0;
                    tx = Math.floor(Math.cos(ang)*dist)/rr;
                    ty = Math.floor(Math.sin(ang)*dist)+can.height/2;
                    // tx = Math.floor((dx/dist+10)*dist/rr);
                    // ty = Math.floor((dy/dist)*dist+can.height/2);
                    // tx = Math.floor((dx/dist+10)*dist/rr);
                    // ty = Math.floor((dy/dist)*dist+can.height/2);
                    let ind = Math.floor((tx+ty*can.width)*4);
    
                    // let rat = 2;
                    // let rat = 800/dist;
                    // let rat = Math.cos(x/50);
                    // let rat = Math.tan(ang*3);
    
                    // data[i] = (ref[ind+1]+ref[ind+2])/rat;
                    // data[i+1] = (ref[ind]+ref[ind+1])/rat;
                    // data[i+2] = (ref[ind+2]+ref[ind+1])/rat;
                    data[i] = ref[ind];
                    data[i+1] = ref[ind+1];
                    data[i+2] = ref[ind+2];
    
                    i += 4;
                }
            }
        }
    
        ctx.putImageData(new ImageData(data,can.width,can.height),0,0);


    }
}
calc();

let animate = true;
if(animate){
    function update(){
        requestAnimationFrame(update);
        calc();
    }
    update();
}