import { getIsGltf, getIsGlb } from './utils.js';

const Input_ResetCamera = "r";
const Input_RotateButton = 0;
const Input_PanButton = 1;

class gltfInput
{
    constructor(canvas)
    {
        this.canvas = canvas;

        this.onZoom = () => { };
        this.onRotate = () => { };
        this.onPan = () => { };
        this.onDropFiles = () => { };
        this.onResetCamera = () => { };

        this.mouseDown = false;
        this.pressedButton = undefined;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    setupGlobalInputBindings(document)
    {
        document.onmouseup = this.mouseUpHandler.bind(this);
        document.onmousemove = this.mouseMoveHandler.bind(this);
        document.onkeydown = this.keyDownHandler.bind(this);
    }

    setupCanvasInputBindings(canvas)
    {
        canvas.onmousedown = this.mouseDownHandler.bind(this);
        canvas.onwheel = this.mouseWheelHandler.bind(this);
        canvas.ondrop = this.dropEventHandler.bind(this);
        canvas.ondragover = this.dragOverHandler.bind(this);
    }

    mouseDownHandler(event)
    {
        this.mouseDown = true;
        this.pressedButton = event.button;
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
        event.preventDefault();

        if (!this.mouseDown)
        {
            this.canvas.style.cursor = "grab";
            return;
        }

        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;

        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;

        switch (this.pressedButton)
        {
        case Input_RotateButton:
            this.onRotate(deltaX, deltaY);
            break;
        case Input_PanButton:
            this.onPan(deltaX, deltaY);
            break;
        }
    }

    mouseWheelHandler(event)
    {
        event.preventDefault();
        this.canvas.style.cursor = "none";
        this.onZoom(event.deltaY);
    }

    keyDownHandler(event)
    {
        if (event.key === Input_ResetCamera)
        {
            this.onResetCamera();
        }
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
