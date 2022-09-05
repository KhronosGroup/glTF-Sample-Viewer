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