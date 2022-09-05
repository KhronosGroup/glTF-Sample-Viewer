import { Interpreter } from "./interpreter"
import * as schema from "./schema"

test('Control Flow', () => {
    const nodes = [
        {
            type: "flow/branch",
            parameters: {
                condition: true,
            },
            flow: {
                true: 1,
                false: 2,
            }
        },
        {
            type: "math/add",
            parameters: {
                first: 0,
                second: 1,
            },
            flow: { }
        },
        {
            type: "math/subtract",
            parameters: {
                first: 2,
                second: 1,
            },
            flow: { }
        }
    ]

    const interpreter = new Interpreter();
    interpreter.run(0, nodes);
    expect(interpreter._state["$node"][1]["result"]).toBe(1);
});

test('Resolve References', () => {
    const nodes = [
        {
            type: "math/add",
            parameters: {
                first: 0,
                second: 1,
            },
            flow: { next: 1 }
        },
        {
            type: "math/subtract",
            parameters: {
                first: { 
                    $node: 0,
                    socket: "result"
                },
                second: 1,
            },
        }
    ]

    const interpreter = new Interpreter();
    interpreter.run(0, nodes);
    expect(interpreter._state["$node"][1]["result"]).toBe(0);
});

