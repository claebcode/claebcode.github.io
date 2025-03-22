type KBModifiers = {
    shift?:boolean;
    ctrl?:boolean;
    alt?:boolean;
};
type KBOps = {
    doesntPreventDefault?:boolean;
    stopAllPropagation?:boolean;
    keyup?:boolean;
    condition?:(e:KeyboardEvent)=>boolean;
};
class KBEvent{
    constructor(id:string,key:string,mod:KBModifiers={},f:(e:KeyboardEvent)=>void,ops:KBOps={}){
        this.id = id;
        this.key = key;
        this.mod = mod;
        this.f = f;
        this.ops = ops;
    }
    id:string;
    key:string;
    mod:KBModifiers;
    f:(e:KeyboardEvent)=>void|Promise<void>;
    ops:KBOps;
}
class KeyboardAPI{
    constructor(){
        this.evts = [];
        this.up_evts = [];
    }
    evts:KBEvent[];
    up_evts:KBEvent[];
    /**
     * Register some keybinding to the KB API such as pressing Ctrl+S to save.
     * @param key 
     * @param mod If you want no modifier put `{}`
     * @param f 
     * @param ops 
     * @returns 
     */
    registerEvent(id:string,key:string,mod:KBModifiers,f:(e:KeyboardEvent)=>void,ops:KBOps={}){
        let e = new KBEvent(id,key,mod,f,ops);
        if(ops.keyup) this.up_evts.push(e);
        else this.evts.push(e);
        return e;
    }
    _run(ev:KBEvent,e:KeyboardEvent,k:string){
        if(ev.key != k) return;
        if(!!ev.mod.shift != e.shiftKey) return;
        if(!!ev.mod.ctrl != (e.ctrlKey || e.metaKey)) return;
        if(!!ev.mod.alt != e.altKey) return;
        if(!ev.ops.doesntPreventDefault) e.preventDefault();
        if(ev.ops.stopAllPropagation){
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
        if(ev.ops.condition) if(!ev.ops.condition(e)) return;
        ev.f(e);
    }
    init(){
        document.addEventListener("keydown",e=>{
            if(this.onevent) if(!this.onevent(e)) return;
            let k = e.key.toLowerCase();
            for(const ev of this.evts){
                this._run(ev,e,k);
            }
        });
        document.addEventListener("keyup",e=>{
            if(this.onevent) if(!this.onevent(e)) return;
            let k = e.key.toLowerCase();
            for(const ev of this.up_evts){
                this._run(ev,e,k);
            }
        });
    }

    execEvent(id:string,key=""){
        let ev = this.evts.find(v=>v.id == id);
        if(!ev){
            console.warn("Failed to execute event, an event with the following id doesn't exist: ",id);
            return;
        }
        this._run(ev,new KeyboardEvent("keydown"),key);
    }
    
    /**
     * Override this with a custom function that relates to your own project. Return false if you want to block all kb events at that time.
     */
    onevent:(e:KeyboardEvent)=>boolean;
}
let kbAPI = new KeyboardAPI();
kbAPI.init();