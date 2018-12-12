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

export { gltfInput };
