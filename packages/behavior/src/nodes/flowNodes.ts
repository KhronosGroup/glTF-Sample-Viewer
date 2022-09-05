import { NodeInput, NodeContext, NodeOutput } from "./node-types"

export const flowNodes = {
    branch: (input: NodeInput, context: NodeContext): NodeOutput => {
        return {nextFlow: input.parameters.condition ? input.flow?.true : input.flow?.false, result: {}};
    }
}
