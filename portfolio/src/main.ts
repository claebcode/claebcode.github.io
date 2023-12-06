console.log("page loaded");

let sections = [
    document.querySelector(".hero"),
    document.querySelector(".s-main-projects"),
    document.querySelector(".s-contact")
];

const main = document.querySelector(".main") as HTMLElement;
function makeGrid(){
    let can = document.createElement("canvas");
    can.width = 100;
    can.height = 100;
    let ctx = can.getContext("2d");
    ctx.fillStyle = "whitesmoke";
    ctx.fillRect(0,0,can.width,can.height); 
    ctx.strokeStyle = "rgba(0,0,0,0.05)";
    let can2 = can.cloneNode() as HTMLCanvasElement;
    let ctx2 = can2.getContext("2d");

    let ratio = 0.5;
    let inc = can.width*ratio;
    for(let x = 0; x < can.width; x += inc){
        ctx.beginPath();
        ctx.moveTo(x,0);
        ctx.lineTo(x,can.height);
        ctx.stroke();
    }
    for(let y = 0; y < can.height; y += inc){
        ctx.beginPath();
        ctx.moveTo(0,y);
        ctx.lineTo(can.width,y);
        ctx.stroke();
    }

    // can.toBlob(blob=>{
        // let url = URL.createObjectURL(blob);
        
        // main.style.background = `url(${url})`;
        // document.body.style.background = `url(${url})`;
    // });
    // can2.toBlob(blob=>{
    //     let url = URL.createObjectURL(blob);
        
    //     let div = document.querySelector(".hero-right") as HTMLElement;
    //     div.style.background = `url(${url})`;
    // });
}

function wait(delay:number){
    return new Promise<void>(resolve=>{
        setTimeout(()=>{
            resolve();
        },delay);
    });
}

async function fadeInSections(){
    await wait(200);
    let sections = document.querySelector(".sections");
    for(let i = 0; i < sections.children.length; i++){
        let c = sections.children[i] as HTMLElement;
        c.classList.add("fadeElement");
        let toId = setTimeout(()=>{
            c.classList.add("fadeUp");
        },i*200+100);
        c.addEventListener("mouseenter",e=>{
            c.classList.add("fadeUp");
            clearTimeout(toId);
        });
    }
}

let objs:number[][] = [];
let heroCan = document.querySelector(".hero-canvas") as HTMLCanvasElement;
let heroCtx = heroCan.getContext("2d");

let heroCan2 = document.querySelector(".hero-canvas-2") as HTMLCanvasElement;
let heroCtx2 = heroCan2.getContext("2d");

async function animateHero(){
    heroCan.height = 106;
    heroCan.width = innerWidth;

    let hero = document.querySelector(".hero");
    objs = [];
    for(let i = 0; i < 500; i++){ //20 //50
        objs.push([Math.random()*heroCan.width,Math.random()*heroCan.height,(Math.random()-0.5)*4+2.5,0,0,0]);
    }
}

class TriGroup{
    constructor(size:number,x:number,y:number,vx:number,vy:number,va:number,vs:number){
        size *= scale;
        
        this.size = size;
        this.x = x;
        this.y = y;
        this.vx = vx*scale;
        this.vy = vy*scale;
        this.va = va;
        this.vs = vs*scale;
        this.a = 0;
    }
    points = 3;
    size = 1;
    x = 0;
    y = 0;
    a = 0;
    vx = 0;
    vy = 0;
    va = 0;
    vs = 0;

    render(){
        let lx = Math.cos(this.a+Math.PI*2-Math.PI*2/this.points)*this.size+this.x;
        let ly = Math.sin(this.a+Math.PI*2-Math.PI*2/this.points)*this.size+this.y;
        for(let i = 0; i < this.points; i++){
            let angOffset = i*Math.PI*2/3;
            let tx = Math.cos(this.a+angOffset)*this.size+this.x;
            let ty = Math.sin(this.a+angOffset)*this.size+this.y;
            heroCtx2.fillRect(tx,ty,scale,scale);
            heroCtx2.beginPath();
            heroCtx2.moveTo(lx+scale/2,ly+scale/2);
            heroCtx2.lineTo(tx+scale/2,ty+scale/2);
            heroCtx2.stroke();
            lx = tx;
            ly = ty;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.a += this.va;
        this.size += this.vs;
        this.va *= 0.996;
        this.vx *= 1.005;
        this.vy *= 1.004;

        if(this.x < -this.size-10){
            this.x = heroCan2.width+this.size+10;
            this.y = Math.random()*heroCan2.height/4;
            this.size = Math.random()*15+5;
            this.vx = -0.3*Math.random()-0.3
            this.vy = 0.15*Math.random()+0.2;
            this.va = 1/this.size*0.7*Math.random()+0.01;
        }
    }
}
let groups:TriGroup[] = [];

let scale = innerWidth*0.005;
function setupCanvas2(){
    heroCan2.width = innerWidth;
    heroCan2.height = Math.ceil(heroCan2.width/2);
    
    for(let i = 0; i < 10; i++){
        let size = Math.random()*15+7;
        groups.push(new TriGroup(size,heroCan2.width*Math.random(),Math.random()*heroCan2.height,-0.3*Math.random()-0.3,0.15*Math.random()+0.2,1/size*0.7*Math.random()+0.01,0.2*Math.random()+0.05));
        // groups.push(new TriGroup(size,heroCan2.width+80,Math.random()*heroCan2.height/4,-0.5*Math.random()-0.3,0.3*Math.random()+0.2,1/size*0.7*Math.random()+0.01,0.2*Math.random()+0.05));
    }
}

let mx = 0;
let my = 0;
document.addEventListener("mousemove",e=>{
    let rect = heroCan.getBoundingClientRect();
    mx = ((e.clientX-rect.x)/rect.width*heroCan.width);
    my = ((e.clientY-rect.y)/rect.height*heroCan.height);
});
function update(){
    requestAnimationFrame(update);

    if(false){ //geometry anim
        heroCtx2.clearRect(0,0,heroCan2.width,heroCan2.height);
        for(const g of groups){
            g.render();
        }
    }

    if(false) if(objs.length){
        heroCtx.clearRect(0,0,heroCan.width,heroCan.height);
        let cx = heroCan.width/2;
        let cy = heroCan.height/2;
        let size = heroCan.height*0.05;
        heroCtx.lineWidth = size;
        let drag = 1;
        let maxVel = 3;
        // let drag = 0.94;
        for(let i = 0; i < objs.length; i++){
            let o = objs[i];
            let dx = o[0]-mx;
            let dy = o[1]-my;
            let dist = Math.sqrt(dx**2+dy**2);
            let ang = Math.atan2(dy,dx)+Math.PI/2;
            // orbit
            o[2] -= dx/dist/2;
            o[3] -= dy/dist/2;

            // rotate
            // o[2] += Math.cos(ang)/8;
            // o[3] += Math.sin(ang)/8;

            // drag
            // o[2] *= drag;
            // o[3] *= drag;

            // accel
            o[2] *= 1.01; //1.02

            // end
            if(o[0] >= heroCan.width){
                // o[0] = heroCan.width-1;
                // o[2] = -Math.abs(o[2]);
                o[0] = 0;
                o[1] = Math.random()*heroCan.height;
                o[2] = (Math.random()-0.5)*4+2.5;
                // o[2] = 0.3;
            }
            // bounce
            if(o[1] < 0){
                o[1] = 0;
                o[3] = Math.abs(o[3]);
            }
            else if(o[1] >= heroCan.height){
                o[1] = heroCan.height-1;
                o[3] = -Math.abs(o[3]);
            }

            // center accel
            // o[3] -= dy/dist/6;

            // max vel
            // if(o[2] > maxVel) o[2] = maxVel;
            
            // draw
            o[4] = o[0]-size; //lastX
            o[5] = o[1]; //lastY
            o[0] += o[2]*size;
            o[1] += o[3]*size;
            heroCtx.beginPath();
            heroCtx.moveTo(o[4],o[5]);
            heroCtx.lineTo(o[0],o[1]);
            heroCtx.stroke();
            // heroCtx.fillRect(Math.floor(o[0]-size/2),Math.floor(o[1]-size/2),size,size);
        }
    }
}
// setInterval(update,16.67*2);
// update();

let mouseDown = [false,false,false];
document.addEventListener("mousedown",e=>{
    mouseDown[e.button] = true;
});
document.addEventListener("mouseup",e=>{
    mouseDown[e.button] = false;
});

function initHC3(){
    let hc3 = document.querySelector(".hc3") as HTMLCanvasElement;
    hc3.width = 256;
    hc3.height = 256;
    let ctx = hc3.getContext("2d");
    let nob = new NobsinCtx(ctx);

    class Particle{
        constructor(x:number,y:number,vx:number,vy:number){
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.ox = x;
            this.oy = y;
            this.lx = x;
            this.ly = y;
        }
        ox = 0;
        oy = 0;
        x = 0;
        y = 0;
        vx = 0;
        vy = 0;

        lx = 0;
        ly = 0;
        times = 5;
    }
    let particles:Particle[] = [];
    if(true) for(let i = 0; i < 150; i++){
        particles.push(new Particle(Math.random()*hc3.width,Math.random()*hc3.height,Math.random()-0.5,Math.random()-0.5));
    }

    let size = 0.1;
    let hsize = size/2;

    function loop(){
        nob.updateStart();

        for(let i = 0; i < particles.length; i++){
            let p = particles[i];

            if(false) if(mouseDown[0]){
                let dx = p.x-p.ox;
                let dy = p.y-p.oy;
                let dist = Math.sqrt(dx**2+dy**2);
                p.vx -= dx/dist/8;
                p.vy -= dy/dist/8;
                p.vx *= 0.95;
                p.vy *= 0.95;
            }

            if(true){
                let dx = p.x-nob.centerX;
                let dy = p.y-nob.centerY;
                let ang = Math.atan2(dy,dx)+Math.PI*2/3.2;
                let tx = Math.cos(ang);
                let ty = Math.sin(ang);
                p.vx += tx/32;
                p.vy += ty/32;
            }
        
            p.times--;
            if(p.times <= 0){
                p.lx = p.x;
                p.ly = p.y;
                p.times = 20*Math.random();
            }

            if(p.x < 0){
                p.x = 0;
                p.vx = Math.abs(p.vx);
            }
            else if(p.x >= nob.width){
                p.x = nob.width-1;
                p.vx = -Math.abs(p.vx);
            }
            if(p.y < 0){
                p.y = 0;
                p.vy = Math.abs(p.vy);
            }
            else if(p.y >= nob.height){
                p.y = nob.height-1;
                p.vy = -Math.abs(p.vy);
            }

            p.x += p.vx/10;
            p.y += p.vy/10;
            
            let rAmt = 0.05; //0.05
            let lfx = Math.round(p.lx*rAmt)/rAmt;
            let lfy = Math.round(p.ly*rAmt)/rAmt;
            let fx = Math.round(p.x*rAmt)/rAmt;
            let fy = Math.round(p.y*rAmt)/rAmt;

            for(let j = i+1; j < particles.length; j++){
                let p2 = particles[j];
                let dx = p.x-p2.x;
                let dy = p.y-p2.y;
                let dist = Math.sqrt(dx**2+dy**2);
                if(dist < 60){
                    let col = [Math.min(Math.max(p.x+p.y+20,0),255),Math.min(Math.max(p.x-p.y-20,0),255),Math.min(Math.max(p.x/(p.y+50),0),255),255];
                    // let col = [Math.min(Math.max(p.x+p.y,0),255),Math.min(Math.max(p.x-p.y,0),255),Math.min(Math.max(p.x/p.y,0),255),255];
                    let max = 255; //255
                    let scale = 0.8; //0.8
                    // let col = [Math.min(Math.max(p.x+p.y,0),max),Math.min(Math.max(p.x|p.y,0),max),Math.min(Math.max(p.x|p.y,0),max),255]; //brown
                    // let col = [Math.min(Math.max(p.x+p.y,0),max),Math.min(Math.max(p.x|p.y,0),max),Math.min(Math.max(p.x|p.y,0),max),255];
                    col[0] *= scale;
                    col[1] *= scale;
                    col[2] *= scale;
                    col[3] = (60-dist)/60*255;
                    nob.drawLine_smart(p.x,p.y,p2.x,p2.y,col,1);
                }
            }
        }

        if(false){ //Glitch Effect
            let arr = [...nob.buf];
            let amt = Math.ceil(Math.tan((performance.now()/3000)+1)/2*35+20);
            arr.splice(Math.floor(Math.sin((performance.now()/3000)+1)/2*arr.length),amt);
            for(let i = 0; i < amt; i++) arr.push(0);
            nob.buf = new Uint8ClampedArray(arr);
        }
        nob.updateEnd();
    }
    setInterval(loop,16.667); //used setInterval instead of requestAnimationFrame to keep it always at 60fps (or lower)
    // loop();
}
initHC3();

// animateHero();
// setupCanvas2();
makeGrid();

// let b_viewMore = document.querySelector(".b-view-more");
let section_mainProjects = document.querySelector(".s-main-projects");
function initViewMoreButtons(){
    let len = sections.length-1;
    len = 1;
    for(let i = 0; i < len; i++){
        let section = sections[i];
        let div = document.createElement("div");
        div.className = "d-view-more";
        div.innerHTML = `
            <div class="b-view-more"><img src="assets/angles-down-solid.svg" alt=""></div>
        `;
        section.appendChild(div);
        div.addEventListener("click",e=>{
            sections[i+1].scrollIntoView({behavior:"smooth"});
            // scrollTo({left:0,top:scrollY+innerHeight,behavior:"smooth"});
        });
    }
}
initViewMoreButtons();

function mail(){
    let email = document.querySelector(".i-email") as HTMLInputElement;
    let name = document.querySelector(".i-name") as HTMLInputElement;
    let msg = document.querySelector(".i-message") as HTMLInputElement;
    let s = `mailto:claebhero@gmail.com?subject=${"Contact from: "+name.value} (${email.value})&body=${msg.value}`;
    let a = document.createElement("a");
    a.href = s;
    a.click();
}