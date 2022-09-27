import * as schema from "./schema";
import { NodeContext } from "./nodes/node-types";
import { getNode } from "./nodes/nodes";

type BehaviorState = { [index: number]: { [socket: string]: any } };

function copyValue(value: any): any
{
    return JSON.parse(JSON.stringify(value));
}

export class Behavior {
    private behaviorExtensionData: schema.Behavior;
    private events: { [eventName: string]: number[] } = {};
    public context: NodeContext = {};
    private _nodeState: BehaviorState = {};
    private _variableState: { [variableName: string]: any } = {};

    constructor(behaviorExtensionObject: schema.Behavior) {
        this.behaviorExtensionData = behaviorExtensionObject;

        // Collect events that belong to this extension
        this.behaviorExtensionData.nodes.forEach(
            (node: schema.Node, index: number) => {
                if (schema.extractTypeCategory(node.type) === "event") {
                    const typeName = schema.extractTypeName(node.type);
                    if (!(typeName in this.events)) {
                        this.events[typeName] = [];
                    }
                    this.events[typeName] = [...this.events[typeName], index];
                }
            }
        );

        if (this.behaviorExtensionData.variables) {
            Object.entries(this.behaviorExtensionData.variables).forEach(
                ([variableName, variable]) => {
                    this._variableState[variableName] = variable.value;
                }
            );
        }

        this.context = {
            setVariable: (variable, value) => {
                this._variableState[variable] = copyValue(value);
            },
            getVariable: (variable) => {
                return copyValue(this._variableState[variable]);
            }
        };
    }

    private runOnEvent(eventName: string, data?: { [key: string]: any }) {
        if (eventName in this.events) {
            this.events[eventName].forEach((nodeIndex: number) => {
                this.run(nodeIndex, this.behaviorExtensionData.nodes, data);
            });
        }
    }

    public onUpdate() {
        this.runOnEvent("onUpdate");
    }

    public onStart() {
        this.runOnEvent("onStart");
    }

    public onEvent(eventName: string, eventData?: { [key: string]: any }) {
        this.runOnEvent(`on${eventName}Event`, eventData);
    }

    public getState(nodeIndex: number): { [socket: string]: any } {
        return this._nodeState[nodeIndex];
    }

    public getVariable(variableName: string): any {
        return this._variableState[variableName];
    }

    public runFromNode(nodeIndex: number) {
        this.run(nodeIndex, this.behaviorExtensionData.nodes);
    }

    private run(
        entryIndex: number,
        behaviorNodes: schema.Node[],
        initialState?: { [key: string]: any }
    ) {
        // Ensure no state can leak between individual runs
        this._nodeState = {};

        // Initialize state with the data from the input event, so that subsequent nodes can access it
        if (initialState) {
            this.makeState(entryIndex);
            this._nodeState[entryIndex] = initialState;
        }

        // Evaluate the graph node by node
        let currentIndex: number | undefined =
            behaviorNodes[entryIndex].flow?.next;
        while (currentIndex !== undefined) {
            currentIndex = this.evalNode(
                currentIndex,
                behaviorNodes[currentIndex]
            );
        }
    }

    private evalNode(index: number, node: schema.Node): number | undefined {
        // Extract all references from the state, so that the nodes don't need to differntiate between
        // references and literal values
        const parameters: { [paramName: string]: any } = {};
        for (const [paramName, paramValue] of Object.entries(
            node.parameters || {}
        )) {
            if (typeof paramValue === "object" && "$node" in paramValue) {
                parameters[paramName] =
                    this._nodeState[paramValue.$node][paramValue.socket];
                continue;
            } else if (
                typeof paramValue === "object" &&
                "$variable" in paramValue
            ) {
                parameters[paramName] = copyValue(this._variableState[paramValue.$variable]);
            } else if (Array.isArray(paramValue)) {
                const result = copyValue(paramValue);
                for (let i = 0; i < result.length; ++i) {
                    if (result[i].$variable !== undefined) {
                        result[i] = copyValue(this._variableState[result[i].$variable]);
                    } else if (result[i].$node !== undefined) {
                        result[i] = this._nodeState[result[i].$node][result[i].socket];
                    }
                }
                parameters[paramName] = result;
            } else {
                parameters[paramName] = paramValue;
            }
        }

        const nodeFunction = getNode(node.type);
        const output = nodeFunction(
            { parameters, flow: node.flow },
            this.context
        );
        this.makeState(index);
        for (const [socketName, socketValue] of Object.entries(output.result)) {
            this._nodeState[index][socketName] = socketValue;
        }

        return output.nextFlow;
    }

    private makeState(index: number) {
        if (!(index in this._nodeState)) {
            this._nodeState[index] = {};
        }
    }
}
