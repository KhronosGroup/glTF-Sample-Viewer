class gltfViewer
{
    constructor(canvas)
    {
        this.roll = Math.PI;
        this.pitch = 0.0;
        this.translate = 4.0;

        this.lastMouseX = 0.0;
        this.lastMouseY = 0.0;

        this.wheelSpeed = 1.04;
        this.mouseDown = false;
    }

    getViewTransform()
    {
        let xRotation = mat4.create();
        mat4.rotateY(xRotation, xRotation, this.roll);

        let yRotation = mat4.create();
        mat4.rotateX(yRotation, yRotation, this.pitch);

        let viewMatrix = mat4.create();
        mat4.multiply(viewMatrix, yRotation, xRotation);
        viewMatrix[14] = -this.translate;

        return viewMatrix;
    }

    onMouseDown(event)
    {
        this.mouseDown = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }

    onMouseUp(event)
    {
        this.mouseDown = false;
    }

    onMouseWheel(event)
    {
        event.preventDefault();
        if (event.deltaY > 0) {
            this.translate *= this.wheelSpeed;
        }
        else {
            this.translate /= this.wheelSpeed;
        }

        console.log("test");
    }

    onMouseMove(event)
    {
        if (!this.mouseDown)
        {
            return;
        }

        let newX = event.clientX;
        let newY = event.clientY;

        let deltaX = newX - this.lastMouseX;
        this.roll += (deltaX / 100.0);

        let deltaY = newY - this.lastMouseY;
        this.pitch += (deltaY / 100.0);

        this.lastMouseX = newX;
        this.lastMouseY = newY;
    }
}
