import { Interpreter } from "./interpreter"

test('Interpreter', () => {
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
    expect(interpreter.state.get(["node", 1, "result"]) === 1);
});

