import { vec2 } from "gl-matrix";

const ZoomThreshold = 1;

class gltfTouchInput
{
    constructor()
    {
        this.onZoom = () => { };
        this.onRotate = () => { };
        this.touchCount = 0;

        this.lastSingleX = undefined;
        this.lastSingleY = undefined;
        this.lastMultiDistance = undefined;
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
        this.touchCount = event.touches.length;
        const firstFinger = event.touches[0];

        if (this.touchCount === 1)
        {
            this.lastSingleX = firstFinger.clientX;
            this.lastSingleY = firstFinger.clientY;
        }
        else
        {
            const secondFinger = event.touches[1];
            const firstPosition = vec2.fromValues(firstFinger.clientX, firstFinger.clientY);
            const secondPosition = vec2.fromValues(secondFinger.clientX, secondFinger.clientY);
            this.lastMultiDistance = vec2.dist(firstPosition, secondPosition);
        }
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
        const touchObject = event.touches[0];

        const deltaX = touchObject.clientX - this.lastSingleX;
        const deltaY = touchObject.clientY - this.lastSingleY;

        this.lastSingleX = touchObject.clientX;
        this.lastSingleY = touchObject.clientY;

        this.onRotate(deltaX, deltaY);
    }

    multiTouchMoveHandler(event)
    {
        const firstFinger = event.touches[0];
        const secondFinger = event.touches[1];

        const firstPosition = vec2.fromValues(firstFinger.clientX, firstFinger.clientY);
        const secondPosition = vec2.fromValues(secondFinger.clientX, secondFinger.clientY);
        const distance = vec2.dist(firstPosition, secondPosition);
        const deltaDistance = distance - this.lastMultiDistance;

        this.lastMultiDistance = distance;

        if (Math.abs(deltaDistance) > ZoomThreshold)
        {
            this.onZoom(-deltaDistance);
        }
    }
}

export { gltfTouchInput };
