import { Interpreter, InterpreterState } from './interpreter';
import * as schema from './schema'


export class Behavior {
    private behaviorExtensionData: schema.Behavior;
    private events: {[eventName: string]: number[]} = {};

    constructor(behaviorExtensionObject: schema.Behavior) {
        this.behaviorExtensionData = behaviorExtensionObject;

        // Collect events that belong to this extension
        this.behaviorExtensionData.nodes.forEach( (node: schema.Node, index: number) => {
            if (schema.extractTypeCategory(node.type) === "event") {
                const typeName = schema.extractTypeName(node.type);
                if (!(typeName in this.events)) {
                    this.events[typeName] = [];
                }
                this.events[typeName] = [...this.events[typeName], index];
            }
        });
    }

    private runOnEvent(eventName: string, interpreter: Interpreter, data?: {[key: string]: any}) {
        if (eventName in this.events) {
            this.events[eventName].forEach((nodeIndex: number) => {
                interpreter.run(nodeIndex, this.behaviorExtensionData.nodes, data);
            });
        }
    }

    public onUpdate(interpreter: Interpreter) {
        this.runOnEvent("onUpdate", interpreter);
    }

    public onStart(interpreter: Interpreter) {
        this.runOnEvent("onStart", interpreter);
    }

    public onEvent(interpreter: Interpreter, eventName: string, eventData?: {[key: string]: any}) {
        this.runOnEvent(`on${eventName}Event`, interpreter, eventData);
    }
}
