import { GltfObject } from './gltf_object.js';
import { Behavior, Interpreter } from '@khronosgroup/gltf-behavior';
import { JsonPointer } from 'json-ptr';
class gltfBehavior extends GltfObject
{
    constructor()
    {
        super();
        this.interpreter = new Interpreter((pointer, value) => {
            // const animatedProperty = JsonPointer.get(gltf, property);
            console.log(`Behavior triggered ${value}`);
        },
        (pointer) => {
            console.log(`Behavior get triggered ${pointer}`);
            return {};
        });
    }

    initGl(gltf, webGlContext)
    {
        super.initGl(gltf, webGlContext);
    }

    fromJson(jsonBehavior)
    {
        super.fromJson(jsonBehavior);
        this.behavior = new Behavior(jsonBehavior);
    }

    processEvents(events)
    {
        for (const [eventName, eventData] of Object.entries(events)) {
            this.behavior.runOnEvent(eventName, this.interpreter, eventData);
        }
    }
}


export { gltfBehavior };
