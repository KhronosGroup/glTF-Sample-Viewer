import { actionNodes } from "./actionNodes"
test('Set', () => {
    
    actionNodes.set({parameters: {target: "/nodes/0/translation", value: [0.0,0.0,0.0]}, flow: {}}, { setCallback: (jsonPointer: string, value: any) => {
        expect(jsonPointer).toBe("/nodes/0/translation");
        expect(value).toStrictEqual([0.0, 0.0, 0.0]);
    }});
});
