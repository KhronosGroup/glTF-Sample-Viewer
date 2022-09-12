import { getNode } from "./nodes/nodes";
import { NodeContext } from "./nodes/node-types";
import * as schema from "./schema";

export type InterpreterState = {[type: string]: {[index: number]: {[socket: string]: any}}};
export class Interpreter {

    public _state: InterpreterState  = {};
    public _variables: { [variable: string]: any} = {};
    public context: NodeContext = {};

    constructor()
    {
        this.context = {
            setVariable: (variable, value) => {
                this._variables[variable] = value;
            }
        }
    }

    public run(entryIndex: number, behaviorNodes: schema.Node[], initialState?: {[key: string]: any})
    {
        // Ensure no state can leak between individual runs
        this._state = {};

        // Initialize state with the data from the input event, so that subsequent nodes can access it
        if (initialState) {
            this.makeState("$node", entryIndex);
            this._state.$node[entryIndex] = initialState;
        }

        // Evaluate the graph node by node
        let currentIndex: number | undefined = behaviorNodes[entryIndex].flow?.next;
        while (currentIndex !== undefined) {
            currentIndex = this.evalNode(currentIndex, behaviorNodes[currentIndex]);
        }
    }

    private evalNode(index: number, node: schema.Node): number | undefined {

        // Extract all references from the state, so that the nodes don't need to differntiate between
        // references and literal values
        const parameters: {[paramName: string]: any} = {};
        for (const [paramName, paramValue] of Object.entries(node.parameters || {})) {
            if (typeof paramValue === 'object' && "$node" in paramValue) {
                parameters[paramName] = this._state.$node[paramValue.$node][paramValue.socket];
                continue;
            } else if (typeof paramValue === 'object' && "$variable" in paramValue) {
                parameters[paramName] = this._variables[paramValue.$variable];
            }
            else {
                parameters[paramName] = paramValue;
            }
        }

        const nodeFunction = getNode(node.type);
        const output = nodeFunction({parameters, flow: node.flow}, this.context);
        this.makeState("$node", index);
        for (const [socketName, socketValue] of Object.entries(output.result)) {
            this._state.$node[index][socketName] = socketValue;
        }

        return output.nextFlow;
    }

    private makeState(type: string, index: number) {
        if (!(type in this._state)) {
            this._state[type] = {};
        }
        if (!(index in this._state[type])) {
            this._state[type][index] = {};
        }
    }
};
