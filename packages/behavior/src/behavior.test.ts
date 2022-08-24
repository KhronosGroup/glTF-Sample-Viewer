import { Behavior } from './behavior';
import { Interpreter } from './interpreter';


test('Run event', () => {
    const interpreter = new Interpreter();
    const behavior = new Behavior(JSON.parse('{ "nodes": [{"type": "events/onUpdate"}]}'));
    behavior.onUpdate(interpreter);
});