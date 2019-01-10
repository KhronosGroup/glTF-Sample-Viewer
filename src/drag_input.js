import { getIsGltf, getIsGlb } from './utils.js';

class gltfDragInput
{
    constructor()
    {
        this.onDropFiles = () => { };
    }

    setupGlobalInputBindings() { }

    setupCanvasInputBindings(canvas)
    {
        canvas.ondrop = this.dropHandler.bind(this);
        canvas.ondragover = this.dragOverHandler.bind(this);
    }

    dragOverHandler(event)
    {
        event.preventDefault();
    }

    dropHandler(event)
    {
        event.preventDefault();

        let files = [];
        let folders = [];
        let droppedFiles = event.dataTransfer.files;
        let droppedItems = event.dataTransfer.items;

        for (let i = 0; i < droppedItems.length; i++)
        {
            let entry;
            if (droppedItems[i].getAsEntry)
            {
                entry = droppedItems[i].getAsEntry();
            }
            else if (droppedItems[i].webkitGetAsEntry)
            {
                entry = droppedItems[i].webkitGetAsEntry();
            }
            if (!entry)
            {
                files.push(droppedFiles[i]);
            }
            else
            {
                if (entry.isDirectory)
                {
                    folders.push(entry);
                }
                else
                {
                    files.push(droppedFiles[i]);
                }
            }
        }

        if (folders.length === 0)
        {
            this._processFiles(files);
        }
        else
        {
            let remaining = folders.length;
            for (let i = 0; i < folders.length; i++)
            {
                this._traverseFolder(folders[i], files, remaining, function(object)
                {
                    object._processFiles(files);
                });
            }
        }
    }

    _traverseFolder(folder, files, remaining, callback)
    {
        let self = this;
        let relativePath = folder.fullPath.replace(/^\//, "").replace(/(.+?)\/?$/, "$1/");
        let reader = folder.createReader();
        reader.readEntries(function(entries)
        {
            remaining += entries.length;
            for (let entry of entries)
            {
                if (entry.isFile)
                {
                    entry.file(function(file)
                    {
                        file.fullPath = relativePath + file.name;
                        files.push(file);
                        if (--remaining === 0)
                        {
                            callback(self);
                        }
                    });
                }
                else if (entry.isDirectory)
                {
                    self._traverseFolder(entry, files, remaining, callback);
                }
            }
            if (--remaining === 0)
            {
                callback(self);
            }
        });
    }

    _processFiles(files)
    {
        let mainFile;
        let additionalFiles = [];
        for (let file of files)
        {
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

export { gltfDragInput };
