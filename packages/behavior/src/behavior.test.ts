import { Behavior } from './behavior';

test('Parse Behavior', () => {
    const behavior: Behavior = JSON.parse('{ "nodes": [], "variables": []}')
    expect(behavior.behaviorExtensionData);
});