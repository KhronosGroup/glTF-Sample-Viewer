import { gltfMouseInput } from './mouse_input.js';
import { gltfTouchInput } from './touch_input.js';
import { gltfKeyboardInput } from './keyboard_input.js';

class gltfInput
{
    constructor(canvas)
    {
        this.mouseInput = new gltfMouseInput(canvas);
        this.touchInput = new gltfTouchInput();
        this.keyboardInput = new gltfKeyboardInput();

        this.onZoom = () => { };
        this.onRotate = () => { };
        this.onPan = () => { };
        this.onResetCamera = () => { };

        this.mouseInput.onZoom = (delta => this.onZoom(delta)).bind(this);
        this.mouseInput.onRotate = ((x, y) => this.onRotate(x, y)).bind(this);
        this.mouseInput.onPan = ((x, y) => this.onPan(x, y)).bind(this);
        this.touchInput.onRotate = ((x, y) => this.onRotate(x, y)).bind(this);
        this.touchInput.onZoom = (delta => this.onZoom(delta)).bind(this);
        this.keyboardInput.onResetCamera = (() => this.onResetCamera()).bind(this);
    }

    setupGlobalInputBindings(document)
    {
        this.mouseInput.setupGlobalInputBindings(document);
        this.touchInput.setupGlobalInputBindings(document);
        this.keyboardInput.setupGlobalInputBindings(document);
    }

    setupCanvasInputBindings(canvas)
    {
        this.mouseInput.setupCanvasInputBindings(canvas);
        this.touchInput.setupCanvasInputBindings(canvas);
        this.keyboardInput.setupCanvasInputBindings(canvas);
    }
}

export { gltfInput };
