import { NodeInput, NodeContext, NodeOutput } from "./node-types"

export const actionNodes = {
    set: (input: NodeInput, context: NodeContext): NodeOutput => {
        if (context.setCallback) {
            context.setCallback(input.parameters.target, input.parameters.value);
        }
        return {nextFlow: input.flow?.next, result: {}};
    },
    get: (input: NodeInput, context: NodeContext): NodeOutput => {
        let value: any;
        if (context.getCallback) {
            value = context.getCallback(input.parameters.source);
        }
        return {nextFlow: input.flow?.next, result: {result: value}};
    }
}