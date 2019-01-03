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

        let additionalFiles = [];
        let mainFile;
        for (const file of event.dataTransfer.files)
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
