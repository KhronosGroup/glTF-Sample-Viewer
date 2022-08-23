
export class NodeContext {
    // TODO
}

export interface NodeInput {
    parameters: any;
    flow: any;
};

export interface NodeOutput {
    nextFlow: number | undefined;
    result: any;
};

export type NodeFunction = (input: NodeInput, context: NodeContext) => NodeOutput;

