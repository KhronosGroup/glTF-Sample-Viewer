import { mathNodes } from "./mathNodes"

test('Add', () => {
    const output = mathNodes.add({parameters: {"first": 1, "second": 2}, flow: { next: 1}}, {});
    expect(output.result.result).toBe(3);
});

test('Subtract', () => {
    const output = mathNodes.subtract({parameters: {"first": 1, "second": 2}, flow: { next: 1}}, {});
    expect(output.result.result).toBe(-1);
});
