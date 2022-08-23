import { nodes } from "./nodes/nodes";
import { NodeContext } from "./nodes/node-types";


interface BehaviorNode {
    type: string,
    flow?: {[flowName: string]: any},
    parameters: {[paramName: string]: any}
}

export class Interpreter {
    public state = new Map<[string, number, string], any>();
    public context: NodeContext = {};

    public run(entryIndex: number, nodes: BehaviorNode[])
    {
        // Ensure no state can leak between individual runs
        this.state.clear();

        // Evaluate the graph node by node
        let currentIndex: number | undefined = entryIndex;
        do {
            currentIndex = this.evalNode(currentIndex, nodes[currentIndex]);
        } while (currentIndex !== undefined)
    }

    private evalNode(index: number, node: BehaviorNode): number | undefined {
        if (! (node.type in nodes)) {
            console.error(`Unknown node ${node.type} encountered during evaluation of behavior`);
        }

        const output = nodes[node.type]({parameters: node.parameters, flow: node.flow}, this.context);
        for (const [socketName, socketValue] of Object.entries(output.result)) {
            this.state.set(["node", index, socketName], socketValue)
        }

        return output.nextFlow;
    }
};
