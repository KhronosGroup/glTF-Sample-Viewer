import { NodeInput, NodeContext, NodeOutput } from "./node-types"

export const actionNodes = {
    set: (input: NodeInput, context: NodeContext): NodeOutput => {
        context.setCallback?.(input.parameters.target, input.parameters.value);
        return {nextFlow: input.flow?.next, result: {}};
    },
    get: (input: NodeInput, context: NodeContext): NodeOutput => {
        let value: any;
        value = context.getCallback?.(input.parameters.source);
        return {nextFlow: input.flow?.next, result: {result: value}};
    },
    setVariable: (input: NodeInput, context: NodeContext): NodeOutput => {
        let value: any;
        value = context.setVariable?.(input.parameters.variable, input.parameters.value);
        return {nextFlow: input.flow?.next, result: {}};
    },
    getVariable: (input: NodeInput, context: NodeContext): NodeOutput => {
        let value: any;
        value = context.getVariable?.(input.parameters.variable);
        return {nextFlow: input.flow?.next, result: {result: value}};
    },
    animations: {
        setTime: (input: NodeInput, context: NodeContext): NodeOutput => {
            context.animationSetTimeCallback?.(input.parameters.animation, input.parameters.time);
            return {nextFlow: input.flow?.next, result: {}};
        },
        setPlaying: (input: NodeInput, context: NodeContext): NodeOutput => {
            context.animationSetPlayingCallback?.(input.parameters.animation, input.parameters.isPlaying);
            return {nextFlow: input.flow?.next, result: {}};
        },
        reset: (input: NodeInput, context: NodeContext): NodeOutput => {
            context.animationResetCallback?.(input.parameters.animation);
            return {nextFlow: input.flow?.next, result: {}};
        },
        setSpeed: (input: NodeInput, context: NodeContext): NodeOutput => {
            context.animationSetSpeedCallback?.(input.parameters.animation, input.parameters.speed);
            return {nextFlow: input.flow?.next, result: {}};
        },
        setRepetitions: (input: NodeInput, context: NodeContext): NodeOutput => {
            context.animationSetRepetitionsCallback?.(input.parameters.animation, input.parameters.repetitions);
            return {nextFlow: input.flow?.next, result: {}};
        },
        queueAnimations: (input: NodeInput, context: NodeContext): NodeOutput => {
            context.animationQueueCallback?.(input.parameters.animations, input.parameters.repetitions);
            return {nextFlow: input.flow?.next, result: {}};
        }
    }
}