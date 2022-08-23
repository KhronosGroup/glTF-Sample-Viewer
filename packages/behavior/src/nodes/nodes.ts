import { flowNodes } from "./flowNodes"
import { mathNodes } from "./mathNodes"
import { NodeFunction } from "./node-types";

export const nodes: { [nodeName: string]: NodeFunction; } = {
    ...mathNodes,
    ...flowNodes
}
