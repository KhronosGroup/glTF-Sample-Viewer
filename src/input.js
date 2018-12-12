class gltfInput
{
    constructor(canvas)
    {
        this.canvas = canvas;

        this.onMouseWheel = undefined;
        this.onDrag = undefined;

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
}

export { gltfInput };
