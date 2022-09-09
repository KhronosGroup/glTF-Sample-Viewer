import { GltfObject } from './gltf_object.js';
import { AnimationTimer } from "./utils.js";
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

        this.interpreter = new Interpreter();
        this.interpreter.context.setCallback = (pointer, value) => {
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
        };
        this.interpreter.context.getCallback = (pointer) => {
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
        };
    }

    initState(state) {
        super.initState(state);
        this.interpreter.context.animationSetTimeCallback = (animation, time) => {
            // TODO
        };
        this.interpreter.context.animationSetPlayingCallback = (animation, isPlaying) => {
            if (isPlaying) {
                state.animations[animation].timer.unpause();
            } else {
                state.animations[animation].timer.pause();
            }
            
        };
        this.interpreter.context.animationsResetCallback = (animation) => {
            state.animaions[animation].timer.reset();
        };
        this.interpreter.context.animationSetSpeedCallback = (animation, speed) => {
            //TODO
        };
        this.interpreter.context.animationSetRepetitionsCallback = (animation, repetitions) => {
            //TODO
        };
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

        for (const event of events) {
            const toProperCase = String.prototype.toProperCase = (str) => {
                return str.replace(/\w\S*/g, (txt) => {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
            };
            const normalizedEventName = toProperCase(event.name);
            this.behavior.runOnEvent(`on${normalizedEventName}`, this.interpreter, event.data);
        }
    }
}


export { gltfBehavior };
