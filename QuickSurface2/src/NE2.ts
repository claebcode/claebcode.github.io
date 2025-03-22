var cc_st = {
    dummy:null as HTMLCanvasElement,
    c:null as CanvasRenderingContext2D
};
cc_st.dummy = document.createElement("canvas");
cc_st.dummy.width = 1;
cc_st.dummy.height = 1;
cc_st.c = cc_st.dummy.getContext("2d",{ willReadFrequently: true });
function convert(color:string){
    cc_st.c.clearRect(0,0,1,1);
    cc_st.c.fillStyle = color;
    cc_st.c.fillRect(0,0,1,1);
    return cc_st.c.getImageData(0,0,1,1).data;
}