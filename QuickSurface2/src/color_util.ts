// HSLAllDiff
let compareColors = compareColors_HSLAllDiff;
function compareColors_HSLAllDiff(c1:number[],c2:number[]){
	let hsla1 = RGBAtoHSLA(c1[0],c1[1],c1[2],255);
	let hsla2 = RGBAtoHSLA(c2[0],c2[1],c2[2],255);
	let hueDiff = hsla2[0]-hsla1[0];
	if(hueDiff > 180) hueDiff = 360-hueDiff;
	else if(hueDiff < -180) hueDiff = -360-hueDiff;
	let satDiff = hsla2[1]-hsla1[1];
	let lightDiff = hsla2[2]-hsla1[2];
	return Math.sqrt(Math.abs(hueDiff)**2 + Math.abs(satDiff)**2 + Math.abs(lightDiff)**2);
}
function HSLAtoRGBA(h:number,s:number,l:number,a:number){
    if(h < 0) h += 360;
    s /= 100;
    l /= 100;
    let C = (1 - Math.abs(2 * l - 1)) * s;
    let hue = h / 60;
    let X = C * (1 - Math.abs(hue % 2 - 1));
    let r = 0;
    let g = 0;
    let b = 0;
    if (hue >= 0 && hue < 1) {
        r = C;
        g = X;
    } else if (hue >= 1 && hue < 2) {
        r = X;
        g = C;
    } else if (hue >= 2 && hue < 3) {
        g = C;
        b = X;
    } else if(hue >= 3 && hue < 4) {
        g = X;
        b = C;
    } else if (hue >= 4 && hue < 5) {
        r = X;
        b = C;
    } else {
        r = C;
        b = X;
    }
    let m = l - C / 2;
    r += m;
    g += m;
    b += m;
    r *= 255;
    g *= 255;
    b *= 255;
    return [Math.round(r),Math.round(g),Math.round(b),a];
}
function RGBAtoHSLA(red:number,green:number,blue:number,alpha:number){
    red = red < 0 ? 0 : red > 255 ? 255 : red;
    green = green < 0 ? 0 : green > 255 ? 255 : green;
    blue = blue < 0 ? 0 : blue > 255 ? 255 : blue;

    let r = red / 255,
        g = green / 255,
        b = blue / 255,
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        delta = max - min,
        h:number, s:number, l:number;
    if (max == min) {
        h = 0;
    } else if (r == max) {
        h = (g - b) / delta;
    } else if (g == max) {
        h = 2 + (b - r) / delta;
    } else if (b == max) {
        h = 4 + (r - g) / delta;
    }
    h = Math.min(h * 60, 360);
    if (h < 0) h += 360;
    l = (min + max) / 2;
    if (max == min) s = 0;
    else if (l <= 0.5) s = delta / (max + min);
    else s = delta / (2 - max - min);
    return [
        Math.round(h),
        Math.round(s * 100),
        Math.round(l * 100),
        alpha
    ];
}