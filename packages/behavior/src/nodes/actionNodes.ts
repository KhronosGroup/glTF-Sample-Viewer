import { NodeInput, NodeContext, NodeOutput } from "./node-types"

export const actionNodes = {
    set: (input: NodeInput, context: NodeContext): NodeOutput => {
        if (context.setCallback) {
            context.setCallback(input.parameters.target, input.parameters.value);
        }
        return {nextFlow: input.flow.next, result: {}};
    },
}