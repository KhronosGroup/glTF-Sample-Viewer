import { Behavior } from './behavior';
import { Interpreter } from './interpreter';


test('Run event', () => {
    const interpreter = new Interpreter();
    const behavior = new Behavior({
        nodes: [
            {
                type: "event/onUpdate",
                flow: { next: 1}
            },
            {
                type: "math/add",
                parameters: {
                    first: 1,
                    second: 1
                }
            }
        ]
    });
    behavior.onUpdate(interpreter);
    expect(Object.entries(interpreter._state).length).toBe(1);
});

test('Custom event', () => {
    const interpreter = new Interpreter();
    const behavior = new Behavior({
        nodes: [
            {
                type: "event/onTestEvent",
                flow: { next: 1}
            },
            {
                type: "math/add",
                parameters: {
                    first: {
                        $node: 0,
                        socket: "value"
                    },
                    second: 1
                }
            }
        ]
    });
    behavior.onEvent(interpreter, "Test", { value: 2 });
    expect(interpreter._state.$node[1].result).toBe(3);
});