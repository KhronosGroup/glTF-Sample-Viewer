
export interface NodeContext {
    setCallback?: (jsonPointer: string, value: any) => void;
    getCallback?: (jsonPointer: string) => any;
    animationSetTimeCallback?: (animation: number, time: number) => void;
    animationSetPlayingCallback?: (animation: number, isPlaying: boolean) => void;
    animationResetCallback?: (animation: number) => void;
    animationSetSpeedCallback?: (animation:number, speed: number) => void;
    animationSetRepetitionsCallback?: (animation: number, repetitions: number) => void;
    animationQueueCallback?: (animations: [number], repetitions: [number]) => void;
    setVariable?: (variable: any, value: any) => void;
    getVariable?: (variable: any) => any;
}

export interface NodeInput {
    parameters: any;
    flow: any;
};

export interface NodeOutput {
    nextFlow: number | undefined;
    result: { [socketName: string]: number | [number, number] | [number, number, number] | [number, number, number, number] | boolean };
};

export type NodeFunction = (input: NodeInput, context: NodeContext) => NodeOutput;

