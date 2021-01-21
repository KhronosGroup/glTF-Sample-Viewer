import { Input_ResetCamera } from './constants.js';

class gltfKeyboardInput
{
    constructor()
    {
        this.onResetCamera = () => { };
    }

    setupGlobalInputBindings(document)
    {
        document.onkeydown = this.keyDownHandler.bind(this);
    }

    setupCanvasInputBindings() { }

    keyDownHandler(event)
    {
        if (event.key === Input_ResetCamera)
        {
            this.onResetCamera();
        }
    }
}

export { gltfKeyboardInput };
