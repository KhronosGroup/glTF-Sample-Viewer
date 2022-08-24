import { Interpreter } from "./interpreter"
import * as schema from "./schema"

test('Control Flow', () => {
    const nodes = [
        {
            type: "branch",
            parameters: {
                condition: true,
            },
            flow: {
                true: 1,
                false: 2,
            }
        },
        {
            type: "add",
            parameters: {
                first: 0,
                second: 1,
            },
            flow: { }
        },
        {
            type: "subtract",
            parameters: {
                first: 2,
                second: 1,
            },
            flow: { }
        }
    ]

    const interpreter = new Interpreter();
    interpreter.run(0, nodes);
    expect(interpreter.state["$node"][1]["result"]).toBe(1);
});

test('Resolve References', () => {
    const nodes = [
        {
            type: "add",
            parameters: {
                first: 0,
                second: 1,
            },
            flow: { next: 1 }
        },
        {
            type: "subtract",
            parameters: {
                first: { 
                    $node: 0,
                    socket: "result"
                },
                second: 1,
            },
            flow: { }
        }
    ]

    const interpreter = new Interpreter();
    interpreter.run(0, nodes);
    expect(interpreter.state["$node"][1]["result"]).toBe(0);
});

