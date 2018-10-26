class gltfViewer
{
    constructor(canvas)
    {
        this.roll  = Math.PI;
        this.pitch = 0.0;
        this.zoom  = 4.0;

        this.canvas = canvas;

        canvas.style.cursor = "grab";

        this.lastMouseX = 0.0;
        this.lastMouseY = 0.0;

        this.scale = 180;

        this.wheelSpeed = 1.04;
        this.mouseDown = false;
    }

    getCameraPosition()
    {
        let cameraPos = [-this.zoom * Math.sin(this.roll) * Math.cos(-this.pitch),
                         -this.zoom * Math.sin(-this.pitch),
                          this.zoom * Math.cos(this.roll) * Math.cos(-this.pitch)];
        return jsToGl(cameraPos);
    }

    getViewTransform()
    {
        let xRotation = mat4.create();
        mat4.rotateY(xRotation, xRotation, this.roll);

        let yRotation = mat4.create();
        mat4.rotateX(yRotation, yRotation, this.pitch);

        let viewMatrix = mat4.create();
        mat4.multiply(viewMatrix, yRotation, xRotation);
        viewMatrix[14] = -this.zoom;

        return viewMatrix;
    }

    onMouseDown(event)
    {
        this.mouseDown = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        canvas.style.cursor = "none";
    }

    onMouseUp(event)
    {
        this.mouseDown = false;
        canvas.style.cursor = "grab";
    }

    onMouseWheel(event)
    {
        event.preventDefault();
        if (event.deltaY > 0)
        {
            this.zoom *= this.wheelSpeed;
        }
        else
        {
            this.zoom /= this.wheelSpeed;
        }

        canvas.style.cursor = "none";
    }

    onMouseMove(event)
    {

        if (!this.mouseDown)
        {
            canvas.style.cursor = "grab";
            return;
        }

        let newX = event.clientX;
        let newY = event.clientY;

        let deltaX = newX - this.lastMouseX;
        this.roll += (deltaX / this.scale);

        let deltaY = newY - this.lastMouseY;
        this.pitch += (deltaY / this.scale);

        if (this.pitch >= Math.PI / 2.0)
        {
            this.pitch = +Math.PI / 2.0;
        }
        else if (this.pitch <= -Math.PI / 2.0)
        {
            this.pitch = -Math.PI / 2.0;
        }

        this.lastMouseX = newX;
        this.lastMouseY = newY;
    }
}
