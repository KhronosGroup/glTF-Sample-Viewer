import { getIsGltf, getIsGlb } from './utils.js';

class gltfInput
{
    constructor(canvas)
    {
        this.canvas = canvas;

        this.onWheel = undefined;
        this.onDrag = undefined;
        this.onDropFiles = undefined;

        this.mouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    mouseDownHandler(event)
    {
        this.mouseDown = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        this.canvas.style.cursor = "none";
    }

    mouseUpHandler(event)
    {
        this.mouseDown = false;
        this.canvas.style.cursor = "grab";
    }

    mouseMoveHandler(event)
    {
        if (!this.mouseDown)
        {
            this.canvas.style.cursor = "grab";
            return;
        }

        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;

        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;

        this.onDrag(deltaX, deltaY);
    }

    mouseWheelHandler(event)
    {
        event.preventDefault();
        this.canvas.style.cursor = "none";
        this.onWheel(event.deltaY);
    }

    // for some reason, the drop event does not work without this
    dragOverHandler(event)
    {
        event.preventDefault();
    }

    dropEventHandler(event)
    {
        event.preventDefault();
        var files = [];
        var folders =[];
        var droppedFiles = event.dataTransfer.files;
        var droppedItems = event.dataTransfer.items;

        for(let i=0; i<droppedItems.length; i++)
        {
            if (droppedItems[i].getAsEntry) {
                var entry = droppedItems[i].getAsEntry();
                 } else if (droppedItems[i].webkitGetAsEntry) {
                 var entry = droppedItems[i].webkitGetAsEntry();
                }
                if (!entry) {
                    files.push(droppedFiles[i]);
                }
                else {
                    if(entry.isDirectory) {
                        folders.push(entry)
                    }
                    else{
                        files.push(droppedFiles[i]);
                    }
                }
        }

        if (folders.length === 0){
            this._processFiles(files)
        }
        else{
            var remaining = folders.length;
            for(let i=0; i< folders.length; i++){
                this._traverseFolder(folders[i],files,remaining, function(object){
                    object._processFiles(files)
                })
            }
        }

    }

    _traverseFolder(folder, files, remaining, callback){
        var self = this;
        var relativePath = folder.fullPath.replace(/^\//, "").replace(/(.+?)\/?$/, "$1/");
        var reader = folder.createReader();
        reader.readEntries(function(entries){
            remaining += entries.length;
            for(let entry of entries){
                if (entry.isFile){
                    entry.file(function(file){
                        file.fullPath = relativePath + file.name
                        files.push(file);
                        if (--remaining===0){
                            callback(self);
                        }
                    });
                }
                else if (entry.isDirectory){
                    self._traverseFolder(entry, files, remaining, callback);
                }
            }
            if (--remaining===0){
                callback(self);
            }
        })
    }

    _processFiles(files){
        var mainFile;
        var additionalFiles= [];
        for(let file of files){
        if (getIsGltf(file.name) || getIsGlb(file.name))
                {
                    mainFile = file;
                }
                else
                {
                    additionalFiles.push(file);
                }
        }
        if (mainFile === undefined)
                 {
                     console.warn("No gltf/glb file found. Provided files: " + additionalFiles.map(f => f.name).join(", "));
                     return;
                 }
        this.onDropFiles(mainFile, additionalFiles);
    }

}

export { gltfInput };
