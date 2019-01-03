import { getIsGltf, getIsGlb } from './utils.js';
import { Input_RotateButton, Input_ResetCamera, Input_PanButton } from './constants.js';
import { gltfMouseInput } from './mouse_input.js';

class gltfInput
{
    constructor(canvas)
    {
        this.canvas = canvas;

        this.mouseInput = new gltfMouseInput(canvas);

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
        this.mouseInput.setupGlobalInputBindings(document);
        this.mouseInput.onZoom = (delta => this.onZoom(delta)).bind(this);
        this.mouseInput.onRotate = ((x, y) => this.onRotate(x, y)).bind(this);
        this.mouseInput.onPan = ((x, y) => this.onPan(x, y)).bind(this);

        document.ontouchend = this.touchUpHandler.bind(this);
        document.ontouchmove = this.touchMoveHandler.bind(this);
        document.onkeydown = this.keyDownHandler.bind(this);
    }

    setupCanvasInputBindings(canvas)
    {
        this.mouseInput.setupCanvasInputBindings(canvas);

        canvas.ontouchstart = this.touchDownHandler.bind(this);
        canvas.ondrop = this.dropEventHandler.bind(this);
        canvas.ondragover = this.dragOverHandler.bind(this);
    }

    touchDownHandler(event)
    {
        event.preventDefault();

        this.mouseDown = true;
        this.pressedButton = Input_RotateButton;
        this.lastMouseX = event.changedTouches[0].clientX;
        this.lastMouseY = event.changedTouches[0].clientY;
    }

    touchUpHandler()
    {
        this.mouseDown = false;
    }

    touchMoveHandler(event)
    {
        if (!this.mouseDown)
        {
            return;
        }

        const deltaX = event.changedTouches[0].clientX - this.lastMouseX;
        const deltaY = event.changedTouches[0].clientY - this.lastMouseY;

        this.lastMouseX = event.changedTouches[0].clientX;
        this.lastMouseY = event.changedTouches[0].clientY;

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
