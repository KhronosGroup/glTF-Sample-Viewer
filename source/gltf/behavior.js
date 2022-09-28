import { GltfObject } from './gltf_object.js';

import { Behavior } from '@khronosgroup/gltf-behavior';
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

        this.behavior.context.setCallback = (pointer, value) => {
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
        this.behavior.context.getCallback = (pointer) => {
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
        this.behavior.context.animationSetTimeCallback = (animation, time) => {
            state.animations[animation].timer.setTime(time);
        };
        this.behavior.context.animationSetPlayingCallback = (animation, isPlaying) => {
            if (isPlaying) {
                if (state.animations[animation].timer.isStopped) {
                    state.animations[animation].timer.start();
                } else {
                    state.animations[animation].timer.continue();
                }
            } else {
                state.animations[animation].timer.pause();
            }
            
        };
        this.behavior.context.animationResetCallback = (animation) => {
            state.animations[animation].timer.stop();
        };
        this.behavior.context.animationSetSpeedCallback = (animation, speed) => {
            state.animations[animation].timer.setSpeed(speed);
        };
        this.behavior.context.animationSetRepetitionsCallback = (animation, repetitions) => {
            state.animations[animation].timer.setRepetitions(repetitions);
        };
        this.behavior.context.animationQueueCallback = (animations, repetitions) => {
            let index = 0;
            let func = function() {
                if(index >= animations.length) {
                    return;
                }
        
                const animation = animations[index];
                const repetitionCount = repetitions[index];
                
                state.animations[animation].timer.setRepetitions(repetitionCount);
                state.animations[animation].timer.start();
                index++;
                state.animations[animation].timer.onFinishRepetitions = func.bind(state, animations, repetitions, index);
            };

            func();
        };
    }

    fromJson(jsonBehavior)
    {
        super.fromJson(jsonBehavior);
        this.behavior = new Behavior(jsonBehavior);
    }

    processEvents(events)
    {
        for (const event of events) {
            const toProperCase = String.prototype.toProperCase = (str) => {
                return str.replace(/\w\S*/g, (txt) => {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
            };
            const normalizedEventName = toProperCase(event.name);
            this.behavior.runOnEvent(`on${normalizedEventName}`, event.data);
        }
    }
}


export { gltfBehavior };
