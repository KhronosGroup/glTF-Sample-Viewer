import { actionNodes } from "./actionNodes"
test('Set', () => {
    actionNodes.set({parameters: {target: "/nodes/0/translation", value: [0.0,0.0,0.0]}, flow: {}}, { setCallback: (jsonPointer: string, value: any) => {
        expect(jsonPointer).toBe("/nodes/0/translation");
        expect(value).toStrictEqual([0.0, 0.0, 0.0]);
    }});
});

test('Get', () => {
    const output = actionNodes.get({parameters: {source: "/nodes/0/translation"}, flow: {}}, { getCallback: (jsonPointer: string): any => {
        expect(jsonPointer).toBe("/nodes/0/translation");
        return [0.0, 0.0, 0.0];
    }});
    expect(output.result.result).toStrictEqual([0.0, 0.0, 0.0]);
});