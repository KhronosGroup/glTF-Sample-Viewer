import { GltfObject } from './gltf_object.js';
import { clamp } from './utils.js';

class gltfAnimationClip extends GltfObject {
    constructor() {
        super();
        this.animations = undefined;
        this.start = 0;
        this.end = Infinity;
        this.offset = 0;
        this.speed = 1;
        this.repetitions = -1;
        this.reverse = false;

        this.timeStamp = undefined;
        this.pastTime = undefined;
    }

    fromJson(jsonAnimation) {
        super.fromJson(jsonAnimation);
        this.timeStamp = (this.start ?? 0.0) + (this.offset ?? 0.0);
    }

    advance(gltf, totalTime) {
        // Early exit if the animation has been repeated the specified number of times.
        if (this.repetitions == 0) {
            return;
        }

        // Early exit if the animation is essentially frozen because its speed is zero.
        if (this.speed == 0) {
            return;
        }

        let deltaTime = 0;
        if (this.pastTime !== undefined) {
            deltaTime = totalTime - this.pastTime;
        }
        this.pastTime = totalTime;

        // Increase timestamp depending on delta time and speed.
        this.timeStamp += this.speed * deltaTime;

        // Test if the timestamp is out of the time bounds.
        if (this.timeStamp > this.end) {
            const overtime = this.timeStamp - this.end;

            if (this.reverse) {
                this.timeStamp = this.end - overtime;
                this.speed *= -1;
            }
            else {
                this.timeStamp = this.start + overtime;
            }

            if (this.repetitions > 0) {
                this.repetitions--;
            }
        }
        else if (this.timeStamp < this.start) {
            const overtime = this.start - this.timeStamp;

            if (this.reverse) {
                this.timeStamp = this.start + overtime;
                this.speed *= -1;
            }
            else {
                this.timeStamp = this.end - overtime;
            }

            // Note: repetitions = -1 is infinite execution, repetitions = 0 is animation off.
            if (this.repetitions > 0) {
                this.repetitions--;
            }
        }

        // Always keep start <= timestamp <= end.
        this.timeStamp = clamp(this.timeStamp, this.start, this.end);

        for (const animation of this.animations) {
            gltf.animations[animation].advance(gltf, this.timeStamp);
        }
    }
}

export { gltfAnimationClip };
