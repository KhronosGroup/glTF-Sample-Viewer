import { actionNodes } from "./actionNodes";
import { flowNodes } from "./flowNodes"
import { mathNodes } from "./mathNodes"
import { NodeFunction } from "./node-types";

export const nodes: { [category: string]: { [name: string]: NodeFunction; }} = {
    math: mathNodes,
    flow: flowNodes,
    action: actionNodes
}
