
export interface Node {
    type: string;
    flow?: {[flowName: string]: any};
    parameters?: {[paramName: string]: any};
}

export function extractTypeCategory(type: string): string {
    return type.substring(0, type.indexOf('/'))
}

export function extractTypeName(type: string): string {
    return type.substring(type.indexOf('/') + 1)
}

export interface Behavior {
    nodes: Node[];
    variables: any[]; // TODO
}