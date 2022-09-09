import { actionNodes } from "./actionNodes";
import { flowNodes } from "./flowNodes"
import { mathNodes } from "./mathNodes"
import { NodeFunction } from "./node-types";

type NodeMapping = { [identifier: string]: NodeMapping | NodeFunction }

const nodes: NodeMapping = {
    math: mathNodes,
    flow: flowNodes,
    action: actionNodes
}

function isNodeFunction(entry: NodeMapping | NodeFunction): entry is NodeFunction {
    return typeof entry === "function";
}

export function getNode(type: string): NodeFunction {
    const identifiers = type.split("/");
    let currentRef: NodeMapping = nodes;
    for (const identifier of identifiers.slice(0, -1)) {
        const nextRef: NodeMapping | NodeFunction = currentRef[identifier];
        if (isNodeFunction(nextRef)) {
            throw new Error(`Invalid node type ${type}`);
        } else {
            currentRef = nextRef;
        }
    }
    const lastIdentifier = identifiers.pop();
    if (!lastIdentifier || !(lastIdentifier in currentRef) || !isNodeFunction(currentRef[lastIdentifier])) {
        throw new Error(`Invalid node type ${type}`);
    } else {
        // We can be sure that it is a NodeFunction as we checked it in the if clause
        return currentRef[lastIdentifier] as NodeFunction;
    }
}