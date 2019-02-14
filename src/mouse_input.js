import { Input_PanButton, Input_RotateButton } from './constants.js';

const ZoomThreshold = 1.0;

class gltfMouseInput
{
    constructor(canvas)
    {
        this.canvas = canvas;

        this.onZoom = () => { };
        this.onRotate = () => { };
        this.onPan = () => { };

        this.mouseDown = false;
        this.pressedButton = undefined;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    setupGlobalInputBindings(document)
    {
        document.onmouseup = this.mouseUpHandler.bind(this);
        document.onmousemove = this.mouseMoveHandler.bind(this);
    }

    setupCanvasInputBindings(canvas)
    {
        canvas.onmousedown = this.mouseDownHandler.bind(this);
        canvas.onwheel = this.mouseWheelHandler.bind(this);
    }

    mouseDownHandler(event)
    {
        this.mouseDown = true;
        this.pressedButton = event.button;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        this.canvas.style.cursor = "none";
    }

    mouseUpHandler()
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

        if (Math.abs(event.deltaY) < ZoomThreshold)
        {
            return;
        }

        this.canvas.style.cursor = "none";
        this.onZoom(event.deltaY);
    }
}

export { gltfMouseInput };
