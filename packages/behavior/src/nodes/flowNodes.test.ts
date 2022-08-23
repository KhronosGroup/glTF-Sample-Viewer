import { flowNodes } from "./flowNodes"

test('Branch', () => {
    {
        const output = flowNodes.branch({parameters: {condition: true}, flow: { true: 1, false: 2}}, {});
        expect(output.nextFlow === 1);
    }

    {
        const output = flowNodes.branch({parameters: {condition: false}, flow: { true: 1, false: 2}}, {});
        expect(output.nextFlow === 2);
    }
});
