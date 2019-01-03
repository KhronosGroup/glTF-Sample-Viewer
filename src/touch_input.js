class gltfTouchInput
{
    constructor()
    {
        this.onRotate = () => { };
        this.touchCount = 0;
        this.lastX = undefined;
        this.lastY = undefined;
    }

    setupGlobalInputBindings(document)
    {
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
        this.touchCount = event.touches.length;
    }

    touchMoveHandler(event)
    {
        if (this.touchCount !== event.touches.length)
        {
            this.touchCount = 0;
            return;
        }

        if (event.touches.length === 1)
        {
            this.singleTouchMoveHandler(event);
        }
        else
        {
            this.multiTouchMoveHandler(event);
        }
    }

    singleTouchMoveHandler(event)
    {
        const touchObject = event.changedTouches[0];

        const deltaX = touchObject.clientX - this.lastX;
        const deltaY = touchObject.clientY - this.lastY;

        this.lastX = touchObject.clientX;
        this.lastY = touchObject.clientY;

        this.onRotate(deltaX, deltaY);
    }

    multiTouchMoveHandler(event)
    {

    }
}

export { gltfTouchInput };
