import { NodeInput, NodeContext, NodeOutput } from "./node-types"

export const mathNodes = {
    add: (input: NodeInput, context: NodeContext): NodeOutput => {
        const first = input.parameters.first;
        const second = input.parameters.second;
        const next = input.flow.next;
        return {nextFlow: next, result: {result: first + second}};
    },
    subtract: (input: NodeInput, context: NodeContext): NodeOutput => {
        const first = input.parameters.first;
        const second = input.parameters.second;
        const next = input.flow.next;
        return {nextFlow: next, result: {result: first - second}};
    },
}