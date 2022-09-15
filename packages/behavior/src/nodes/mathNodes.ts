import { NodeInput, NodeContext, NodeOutput } from "./node-types"

type ArrayType = [number] | [number, number] | [number, number, number] | [number, number, number, number];
type ScalarOrArrayType = number | [number, number] | [number, number, number] | [number, number, number, number];

function scalarToArray(value: ScalarOrArrayType): ArrayType {
    if (typeof value === "number") {
        return [value];
    }
    return value;
}

function arrayToScalar(value: ArrayType): ScalarOrArrayType {
    if (value.length === 1) {
        return value[0];
    }
    return value;
}

export const mathNodes = {
    add: (input: NodeInput, context: NodeContext): NodeOutput => {
        const first = scalarToArray(input.parameters.first);
        const second = scalarToArray(input.parameters.second);
        const next = input.flow?.next;

        const result = first;
        for(let i = 0; i < first.length; ++i) {
            result[i] = first[i] + second[i];
        }

        return {nextFlow: next, result: {result: arrayToScalar(result)}};
    },
    subtract: (input: NodeInput, context: NodeContext): NodeOutput => {
        const first = scalarToArray(input.parameters.first);
        const second = scalarToArray(input.parameters.second);
        const next = input.flow?.next;

        const result = first;
        for(let i = 0; i < first.length; ++i) {
            result[i] = first[i] - second[i];
        }

        return {nextFlow: next, result: {result: arrayToScalar(result)}};
    },
    less: (input: NodeInput, context: NodeContext): NodeOutput => {
        const first = scalarToArray(input.parameters.first);
        const second = scalarToArray(input.parameters.second);
        const next = input.flow?.next;

        let compareResult = true;
        for(let i = 0; i < first.length; ++i) {
            compareResult = compareResult && (first[i] < second[i]);
        }

        return {nextFlow: next, result: {result: compareResult } };
    },
    multiply: (input: NodeInput, context: NodeContext): NodeOutput => {
        const first = scalarToArray(input.parameters.first);
        const second = scalarToArray(input.parameters.second);
        const next = input.flow?.next;

        const result = first;
        for(let i = 0; i < first.length; ++i) {
            result[i] = first[i] * second[i];
        }

        return {nextFlow: next, result: {result: arrayToScalar(result)}};
    },
    equals: (input: NodeInput, context: NodeContext): NodeOutput => {
        const first = scalarToArray(input.parameters.first);
        const second = scalarToArray(input.parameters.second);
        const next = input.flow?.next;

        let compareResult = true;
        for(let i = 0; i < first.length; ++i) {
            compareResult = compareResult && (first[i] === second[i]);
        }

        return {nextFlow: next, result: {result: compareResult } };
    },
    absval: (input: NodeInput, context: NodeContext): NodeOutput => {
        const value = scalarToArray(input.parameters.value);
        const next = input.flow?.next;

        const result = value;
        for(let i = 0; i < value.length; ++i) {
            result[i] = Math.abs(value[i]);
        }

        return {nextFlow: next, result: {result: arrayToScalar(result) } };
    }
}