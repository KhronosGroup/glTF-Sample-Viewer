import { Behavior } from "./behavior";

test("Run event", () => {
    const behavior = new Behavior({
        nodes: [
            {
                type: "event/onUpdate",
                flow: { next: 1 }
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
    behavior.onUpdate();
    expect(behavior.getState(1).result).toBe(2);
});

test("Custom event", () => {
    const behavior = new Behavior({
        nodes: [
            {
                type: "event/onTestEvent",
                flow: { next: 1 }
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
    behavior.onEvent("Test", { value: 2 });
    expect(behavior.getState(1).result).toBe(3);
});

test("Control Flow", () => {
    const behavior = new Behavior({
        nodes: [
            {
                type: "event/onTestEvent",
                flow: {
                    next: 1
                }
            },
            {
                type: "flow/branch",
                parameters: {
                    condition: true
                },
                flow: {
                    true: 2,
                    false: 3
                }
            },
            {
                type: "math/add",
                parameters: {
                    first: 0,
                    second: 1
                },
                flow: {}
            },
            {
                type: "math/subtract",
                parameters: {
                    first: 2,
                    second: 1
                },
                flow: {}
            }
        ]
    });

    behavior.onEvent("Test");
    expect(behavior.getState(2).result).toBe(1);
});

test("Resolve References", () => {
    const behavior = new Behavior({
        nodes: [
            {
                type: "event/onTestEvent",
                flow: { next: 1 }
            },
            {
                type: "math/add",
                parameters: {
                    first: 0,
                    second: 1
                },
                flow: { next: 2 }
            },
            {
                type: "math/subtract",
                parameters: {
                    first: {
                        $node: 1,
                        socket: "result"
                    },
                    second: 1
                }
            }
        ]
    });

    behavior.onEvent("Test");
    expect(behavior.getState(2).result).toBe(0);
});

test("Set and get variable", () => {
    const behavior = new Behavior({
        nodes: [
            {
                type: "event/onTestEvent",
                flow: { next: 1 }
            },
            {
                type: "action/getVariable",
                parameters: {
                    variable: "variable"
                },
                flow: { next: 2 }
            },
            {
                type: "action/setVariable",
                parameters: {
                    variable: "variable",
                    value: 41
                },
                flow: { next: 3 }
            },
            {
                type: "action/getVariable",
                parameters: {
                    variable: "variable"
                },
                flow: { next: 4 }
            },
            {
                type: "math/add",
                parameters: {
                    first: {
                        $variable: "variable"
                    },
                    second: 1
                }
            }
        ],
        variables: {
            variable: {
                type: "float",
                value: 23
            }
        }
    });

    behavior.onEvent("Test");
    expect(behavior.getVariable("variable")).toBe(41);
    expect(behavior.getState(1).result).toBe(23);
    expect(behavior.getState(3).result).toBe(41);
    expect(behavior.getState(4).result).toBe(42);
});

test("Initial value for variables", () => {
    const behavior = new Behavior({
        nodes: [
            {
                type: "event/onTestEvent",
                flow: { next: 1 }
            },
            {
                type: "math/add",
                parameters: {
                    first: {
                        $variable: "variable"
                    },
                    second: 1
                }
            }
        ],
        variables: {
            variable: {
                type: "float",
                value: 41
            }
        }
    });

    behavior.onEvent("Test");
    expect(behavior.getVariable("variable")).toBe(41);
    expect(behavior.getState(1).result).toBe(42);
});
