let dbReq = indexedDB.open("main",4);
let db:IDBDatabase;
let recentsStore:IDBObjectStore;
dbReq.addEventListener("upgradeneeded",e=>{
    let req = e.target as IDBOpenDBRequest;

    let db = req.result as IDBDatabase;

    console.log("upgrading db");

    if(!db.objectStoreNames.contains("recents")) db.createObjectStore("recents");
    if(!db.objectStoreNames.contains("recent_folders")) db.createObjectStore("recent_folders");

    let store = req.transaction.objectStore("recents");
    if(!store.indexNames.contains("handle")) store.createIndex("handle","handle",{unique:true});

    let storeFolders = req.transaction.objectStore("recent_folders");
    if(!storeFolders.indexNames.contains("handle")) storeFolders.createIndex("handle","handle",{unique:true});
});
dbReq.addEventListener("success",e=>{
    console.log("successfully opened recent files db");
    db = dbReq.result;

    recentsStore = db.transaction("recents","readwrite").objectStore("recents");
    let recentFoldersStore = db.transaction("recent_folders","readwrite").objectStore("recent_folders");
    
    recentsStore.count().onsuccess = (e)=>{
        console.log("AMT: ",(e.target as IDBRequest).result);
    };
    recentFoldersStore.count().onsuccess = (e)=>{
        console.log("FOLDERS AMT: ",(e.target as IDBRequest).result);
    };
    // store.put()
});
dbReq.addEventListener("error",e=>{
    console.warn("ERROR opening db",e);
});
dbReq.addEventListener("blocked",e=>{
    console.warn("ERROR db blocked",e);
});

// 

interface FileStoreItem{
    date:string;
    handle:FileSystemFileHandle;
}
interface FolderStoreItem{
    date:string;
    handle:FileSystemDirectoryHandle;
}

async function getRecentFiles(){
    let list = [];
    
    let t = db.transaction(["recents"],"readonly");
    let store = t.objectStore("recents");
    
    return new Promise<FileStoreItem[]>(resolve=>{
        let cur = store.openCursor();
        let i = 0;
        cur.onsuccess = function(e){
            let cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
            if(!cursor){
                resolve(list);
                return;
            }
    
            list.push(cursor.value);
            
            i++;
            cursor.continue();
        };
        cur.onerror = function(e){
            console.warn("Failed to open cursor");
            resolve(null);
        };
    })
}
async function getRecentFileKeys(){
    let t = db.transaction(["recents"],"readonly");
    let store = t.objectStore("recents");
    
    return new Promise<any[]>(resolve=>{
        let req = store.getAllKeys();
        req.onsuccess = function(e){
            console.log("success");
            let list = (e.target as IDBRequest<IDBValidKey[]>).result;
            resolve(list);
        };
        req.onerror = function(e){
            console.warn("Failed to get recent file keys");
            resolve(null);
        };
    })
}
async function addToRecentFiles(handle:FileSystemFileHandle){
    if(!handle){
        console.warn("Canceled add, handle was null");
        return;
    }
    
    let start = performance.now();
    let files = await getRecentFiles();
    let alreadyThere = false;
    for(const v of files){
        if(await handle.isSameEntry(v.handle)){
            alreadyThere = true
            break;
        }
    }
    if(alreadyThere){
        // console.warn("already in the recent files list");
        // console.log("TAX time: ",performance.now()-start);
        return;
    }
    
    let t = db.transaction(["recents"],"readwrite");
    let store = t.objectStore("recents");
    
    return new Promise<boolean>(resolve=>{
        let date = new Date().toISOString();
        let id = date;
        let v = {
            date,
            handle
        };
        let req = store.put(v,id);
        req.onsuccess = function(e){
            console.log("TAX time: ",performance.now()-start);
            resolve(true);
        };
        req.onerror = function(e){
            resolve(false);
        }
    })
}
async function removeFromRecentFiles(handle:FileSystemFileHandle,date:string){
    if(!handle){
        console.warn("Canceled remove, handle was null");
        return;
    }
    
    let start = performance.now();
    let files = await getRecentFiles();
    let alreadyThere = false;
    for(const v of files){
        if(await handle.isSameEntry(v.handle)){
            alreadyThere = true
            break;
        }
    }
    if(!alreadyThere){
        // console.warn("wasn't in the recent files list");
        return;
    }
    
    let t = db.transaction(["recents"],"readwrite");
    let store = t.objectStore("recents");
    
    return new Promise<boolean>(resolve=>{
        let req = store.delete(date);
        req.onsuccess = function(e){
            console.log("TAX time: ",performance.now()-start);
            resolve(true);
        };
        req.onerror = function(e){
            resolve(false);
        }
    })
}
async function clearRecentFiles(){
    let t = db.transaction(["recents"],"readwrite");
    let store = t.objectStore("recents");

    let req = store.clear();
    return new Promise<boolean>(resolve=>{
        req.onsuccess = function(e){
            resolve(true);
        };
        req.onerror = function(e){
            resolve(false);
        };
    });
}

// recent folders
async function getRecentFolders(){
    let list = [];
    
    let t = db.transaction(["recent_folders"],"readonly");
    let store = t.objectStore("recent_folders");
    
    return new Promise<FolderStoreItem[]>(resolve=>{
        let cur = store.openCursor();
        let i = 0;
        cur.onsuccess = function(e){
            let cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
            if(!cursor){
                resolve(list);
                return;
            }
    
            list.push(cursor.value);
            
            i++;
            cursor.continue();
        };
        cur.onerror = function(e){
            console.warn("Failed to open cursor");
            resolve(null);
        };
    })
}
async function addToRecentFolders(handle:FileSystemDirectoryHandle){
    if(!handle){
        console.warn("Canceled add, handle was null");
        return;
    }
    
    let start = performance.now();
    let folders = await getRecentFolders();
    let alreadyThere = false;
    for(const v of folders){
        if(await handle.isSameEntry(v.handle)){
            alreadyThere = true
            break;
        }
    }
    if(alreadyThere){
        // console.warn("already in the recent files list");
        // console.log("TAX time: ",performance.now()-start);
        return;
    }
    
    let t = db.transaction(["recent_folders"],"readwrite");
    let store = t.objectStore("recent_folders");
    
    return new Promise<boolean>(resolve=>{
        let date = new Date().toISOString();
        let id = date;
        let v = {
            date,
            handle
        };
        let req = store.put(v,id);
        req.onsuccess = function(e){
            console.log("TAX time: ",performance.now()-start);
            resolve(true);
        };
        req.onerror = function(e){
            resolve(false);
        }
    })
}
async function removeFromRecentFolders(handle:FileSystemDirectoryHandle,date?:string){
    if(!handle){
        console.warn("Canceled remove, handle was null");
        return;
    }
    
    let start = performance.now();
    let folders = await getRecentFolders();
    let alreadyThere = false;
    for(const v of folders){
        if(await handle.isSameEntry(v.handle)){
            alreadyThere = true
            break;
        }
    }
    if(!alreadyThere){
        // console.warn("wasn't in the recent files list");
        return;
    }
    
    let t = db.transaction(["recent_folders"],"readwrite");
    let store = t.objectStore("recent_folders");
    
    return new Promise<boolean>(async resolve=>{
        if(!date){
            let all = await getRecentFolders();
            for(const item of all){
                if(await item.handle.isSameEntry(handle)){
                    break;
                }
            }
        }
        if(!date){
            resolve(false);
            return;
        }
        
        let req = store.delete(date);
        req.onsuccess = function(e){
            console.log("TAX time: ",performance.now()-start);
            resolve(true);
        };
        req.onerror = function(e){
            resolve(false);
        }
    })
}
async function clearRecentFolders(){
    let t = db.transaction(["recent_folders"],"readwrite");
    let store = t.objectStore("recent_folders");

    let req = store.clear();
    return new Promise<boolean>(resolve=>{
        req.onsuccess = function(e){
            resolve(true);
        };
        req.onerror = function(e){
            resolve(false);
        };
    });
}

// 

// function getStoreValueFast<T>(req:IDBRequest<T>){
//     return new Promise<T>(resolve=>{
//         req.onsuccess = function(e){
//             resolve((e.target as IDBRequest).result);
//         };
//         req.onerror = function(e){
//             resolve(null);
//         };
//     });
// }
// function getStoreValue<T>(store:string,f:(s:IDBObjectStore)=>IDBRequest<T>){
//     let t = db.transaction([store],"readonly");
//     let req = f(t.objectStore(store));
//     return new Promise<T>(resolve=>{
//         req.onsuccess = function(e){
//             resolve((e.target as IDBRequest).result);
//         };
//         req.onerror = function(e){
//             resolve(null);
//         };
//     });
// }