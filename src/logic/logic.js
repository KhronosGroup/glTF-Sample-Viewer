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

    const subscriber = observable.subscribe(value => app.setSelectedModel(value));
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

    const subscriber = observable.subscribe(values => app.$data.models = values);
    subscriber.unsubscribe()
}

// test output

const observer = {
    next: x => console.log('Observer got a new value: ' + x.event.msg),
    error: err => console.error('Observer got an error: ' + err)
};

app.modelChanged$.subscribe(observer);
app.flavourChanged$.subscribe(observer);
app.sceneChanged$.subscribe(observer);
app.cameraChanged$.subscribe(observer);


// test input

const newModels = [{title: "Cube"}, {title: "Flight Helmet"}, {title: "Monster"}];

setTimeout(() => {
    setModelsArray(newModels)
    setModelSelection(newModels[0].title)
}, 4000)
