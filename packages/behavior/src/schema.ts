
export interface Node {
    name?: string;
    type: string;
    flow?: {[flowName: string]: any};
    parameters?: {[paramName: string]: any};
}

export interface Variable {
    type: string;
    value: any;
}

export function extractTypeCategory(type: string): string {
    return type.substring(0, type.indexOf('/'))
}

export function extractTypeName(type: string): string {
    return type.substring(type.indexOf('/') + 1)
}

export interface Behavior {
    nodes: Node[];
    variables?: {[variableName: string]: Variable};
}