import { GltfObject } from './gltf_object.js';
import { Behavior, Interpreter } from '@khronosgroup/gltf-behavior';
import { JsonPointer } from 'json-ptr';
import { PointerTargetProperty } from './pointer_target_property';
class gltfBehavior extends GltfObject
{
    constructor()
    {
        super();
        this.errors = [];
    }

    initGl(gltf, webGlContext)
    {
        super.initGl(gltf, webGlContext);

        this.interpreter = new Interpreter((pointer, value) => {
            const targetProperty = JsonPointer.get(gltf, pointer);

            // Check if the property is a valid target for the behavior to avoid messing up the viewer 
            // state if the extension is used in an invalid way
            if (targetProperty === undefined || !(targetProperty instanceof PointerTargetProperty)) {
                if (!this.errors.includes(pointer)) {
                    console.warn(`Cannot target ${pointer} in behavior`);
                    this.errors.push(pointer);
                }
                return;
            }

            targetProperty.setValue(value);
        },
        (pointer) => {
            const targetProperty = JsonPointer.get(gltf, pointer);

            // Check if the property is a valid target for the behavior to avoid messing up the viewer 
            // state if the extension is used in an invalid way
            if (targetProperty === undefined || !(targetProperty instanceof PointerTargetProperty)) {
                if (!this.errors.includes(pointer)) {
                    console.warn(`Cannot target ${pointer} in behavior`);
                    this.errors.push(pointer);
                }
                return undefined;
            }

            return targetProperty.value();
        });
    }

    fromJson(jsonBehavior)
    {
        super.fromJson(jsonBehavior);
        this.behavior = new Behavior(jsonBehavior);
    }

    processEvents(events)
    {
        if (!this.interpreter) {
            return;
        }

        for (const [eventName, eventData] of Object.entries(events)) {
            this.behavior.runOnEvent(eventName, this.interpreter, eventData);
        }
    }
}


export { gltfBehavior };
