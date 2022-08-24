import { Interpreter } from './interpreter';
import * as schema from './schema'


export class Behavior {
    private behaviorExtensionData: schema.Behavior;
    private events: {[eventName: string]: schema.Node[]} = {};

    constructor(behaviorExtensionObject: schema.Behavior) {
        this.behaviorExtensionData = behaviorExtensionObject;

        // Collect events that belong to this extension
        this.behaviorExtensionData.nodes.forEach( (node: schema.Node) => {
            if (schema.extractTypeCategory(node.type) === "event") {
                const typeName = schema.extractTypeName(node.type);
                this.events[typeName] = [...this.events[typeName], node];
            }
        });
    }

    private runOnEvent(eventName: string, interpreter: Interpreter) {
        if (eventName in this.events) {
            this.events[eventName].forEach((node: schema.Node) => {
                if (node.flow && node.flow.next) {
                    interpreter.run(node.flow.next, this.behaviorExtensionData.nodes);
                }
            });
        }
    }

    public onUpdate(interpreter: Interpreter) {
        this.runOnEvent("onUpdate", interpreter);
    }

    public onStart(interpreter: Interpreter) {
        this.runOnEvent("onStart", interpreter);
    }
}
