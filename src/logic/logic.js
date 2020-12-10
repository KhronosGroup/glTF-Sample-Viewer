import { Observable } from 'rxjs';
import { app } from '../ui/ui.js';

// functionality
    // models
function setModelSelection(value)
{
    const observable = new Observable(subscriber =>
        {
            subscriber.next(value)
            // debug
            console.log("model selection has been updated!")
            subscriber.complete()
        });

    const subscriber = observable.subscribe(x => app.setSelectedModel(x));
    subscriber.unsubscribe()
}

function setModelsArray(values)
{
    const observable = new Observable(subscriber =>
        {
            subscriber.next(values)
            // debug
            console.log("model list has been updated!")
            subscriber.complete()
        });

    const subscriber = observable.subscribe(x => app.$data.models = x);
    subscriber.unsubscribe()
}
    // scenes
function setSceneSelection(value)
{
    const observable = new Observable(subscriber =>
        {
            subscriber.next(value)
            // debug
            console.log("scene selection has been updated!")
            subscriber.complete()
        });

    const subscriber = observable.subscribe(x => app.setSelectedScene(x));
    subscriber.unsubscribe()
}

function setScenesArray(values)
{
    const observable = new Observable(subscriber =>
        {
            subscriber.next(values)
            // debug
            console.log("scene list has been updated!")
            subscriber.complete()
        });

    const subscriber = observable.subscribe(x => app.$data.scenes = x);
    subscriber.unsubscribe()
}

// test output

const newScenes = [{title: "A"}, {title: "B"}, {title: "C"}];

const modelObserver = {
    next: () => {
        setScenesArray(newScenes)
        setSceneSelection(newScenes[0].title)
    }
}

const observer = {
    next: x => console.log('Observer got a new value: ' + x.event.msg),
    error: err => console.error('Observer got an error: ' + err)
};

app.modelChanged$.subscribe(modelObserver);
app.flavourChanged$.subscribe(observer);
app.sceneChanged$.subscribe(observer);
app.cameraChanged$.subscribe(observer);


// test input

const newModels = [{title: "Cube"}, {title: "Flight Helmet"}, {title: "Monster"}];

setTimeout(() => {
    setModelsArray(newModels)
    setModelSelection(newModels[0].title)
    setScenesArray(newScenes)
    setSceneSelection(newScenes[0].title)
}, 4000)
