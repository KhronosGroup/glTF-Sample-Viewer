import { nodes } from "./nodes/nodes";
import { NodeInput, NodeOutput, NodeContext } from "./nodes/node-types";


interface BehaviorNode {
    type: string,
    flow: any,
    parameters: any
}

class Interpreter {
    public state = new Map<string, any>();
    public context: NodeContext = {};

    public eval(index: number, node: BehaviorNode): number | undefined {
        if (! (node.type in nodes)) {
            console.error(`Unknown node ${node.type} encountered during evaluation of behavior`);
        }

        const output = nodes[node.type]({parameters: node.parameters, flow: node.flow}, this.context);

        return output.nextFlow;
    }
};
