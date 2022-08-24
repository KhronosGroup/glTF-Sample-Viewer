import { nodes } from "./nodes/nodes";
import { NodeContext } from "./nodes/node-types";
import * as schema from "./schema";


export class Interpreter {
    public state: {[type: string]: {[index: number]: {[socket: string]: any}}} = {};
    public context: NodeContext = {};


    public run(entryIndex: number, nodes: schema.Node[])
    {
        // Ensure no state can leak between individual runs
        this.state = {};

        // Evaluate the graph node by node
        let currentIndex: number | undefined = entryIndex;
        do {
            currentIndex = this.evalNode(currentIndex, nodes[currentIndex]);
        } while (currentIndex !== undefined)
    }

    private evalNode(index: number, node: schema.Node): number | undefined {
        if (! (node.type in nodes)) {
            console.error(`Unknown node ${node.type} encountered during evaluation of behavior`);
        }

        // Extract all references from the state, so that the nodes don't need to differntiate between
        // references and literal values
        let parameters: {[paramName: string]: any} = {};
        for (const [paramName, paramValue] of Object.entries(node.parameters || {})) {
            if (typeof paramValue === 'object' && "$node" in paramValue) {
                parameters[paramName] = this.state["$node"][paramValue.$node][paramValue.socket];
                continue;
            } else {
                parameters[paramName] = paramValue;
            }
        }

        const output = nodes[node.type]({parameters: parameters, flow: node.flow}, this.context);
        this.makeState("$node", index);
        for (const [socketName, socketValue] of Object.entries(output.result)) {
            this.state["$node"][index][socketName] = socketValue;
        }

        return output.nextFlow;
    }

    private makeState(type: string, index: number) {
        if (!(type in this.state)) {
            this.state[type] = {};
        }
        if (!(index in this.state[type])) {
            this.state[type][index] = {};
        }
    }
};
