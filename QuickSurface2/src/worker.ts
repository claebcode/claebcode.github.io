console.log("spawned worker");

self.addEventListener("message",e=>{
    let d = e.data;
    // console.log("got data:",d);
    if(d.t == 0){ // aliasing correction
        let data = d.data;
        let ha = d.ha;
        let a2 = d.a2;
        let full = [];
        let none = [];
        for(let i = d.off; i < data.length+d.off; i += 4){
            let a = data[i+3];
            if(a == 0) continue;
            if(a < ha){
                data[i+3] = 0;
                none.push(d.start+i);
                // wasOverCanvas = true;
            }
            else{
                data[i+3] = a2;
                full.push(d.start+i);
            }
        }
        self.postMessage({
            i:d.i,
            t:d.t,
            start:d.start,
            end:d.end,
            none,full
            // data
        });
    }
});