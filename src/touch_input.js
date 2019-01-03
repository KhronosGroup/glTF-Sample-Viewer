class gltfTouchInput
{
    constructor()
    {
        this.onRotate = () => { };
        this.touching = false;
        this.lastX = undefined;
        this.lastY = undefined;
    }

    setupGlobalInputBindings(document)
    {
        document.ontouchend = this.touchUpHandler.bind(this);
        document.ontouchmove = this.touchMoveHandler.bind(this);
    }

    setupCanvasInputBindings(canvas)
    {
        canvas.ontouchstart = this.touchStartHandler.bind(this);
    }

    touchStartHandler(event)
    {
        event.preventDefault();
        const touchObject = event.changedTouches[0];
        this.lastX = touchObject.clientX;
        this.lastY = touchObject.clientY;
        this.touching = true;
    }

    touchUpHandler()
    {
        this.touching = false;
    }

    touchMoveHandler(event)
    {
        if (!this.touching)
        {
            return;
        }

        if (event.touches.length !== 1)
        {
            this.touching = false;
            return;
        }

        const touchObject = event.changedTouches[0];

        const deltaX = touchObject.clientX - this.lastX;
        const deltaY = touchObject.clientY - this.lastY;

        this.lastX = touchObject.clientX;
        this.lastY = touchObject.clientY;

        this.onRotate(deltaX, deltaY);
    }
}

export { gltfTouchInput };
