import { app } from '../ui/ui.js';

const observer = {
    next: x => console.log('Observer got a next value: ' + x.event.msg),
    error: err => console.error('Observer got an error: ' + err)
};

app.modelChanged$.subscribe(observer);
app.flavourChanged$.subscribe(observer);
app.sceneChanged$.subscribe(observer);
app.cameraChanged$.subscribe(observer);
app.setSelectedModel("Duck");
