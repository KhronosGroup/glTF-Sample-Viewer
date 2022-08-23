
export class NodeContext {
    // TODO
}

export interface NodeInput {
    parameters: any;
    flow: any;
};

export interface NodeOutput {
    nextFlow: number | undefined;
    result: { [socketName: string]: number | [number, number] | [number, number, number] | [number, number, number, number] };
};

export type NodeFunction = (input: NodeInput, context: NodeContext) => NodeOutput;

