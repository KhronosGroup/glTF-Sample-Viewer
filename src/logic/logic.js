import { observable } from 'rxjs';
import { app } from '../ui/ui.js';

const observer = {
    next: x => console.log('Observer got a next value: ' + x.event.msg),
    error: err => console.error('Observer got an error: ' + err),
    complete: () => console.log('Observer got a complete notification'),
};

app.gunther$.subscribe(observer);
app.setSelectedModel("Duck");
