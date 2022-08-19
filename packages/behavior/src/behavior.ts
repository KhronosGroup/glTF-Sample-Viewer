import { BehaviorNode } from './node'
import { BehaviorVariable } from './variable'

export interface Behavior {
    nodes: BehaviorNode[];
    variables: BehaviorVariable[];
}
