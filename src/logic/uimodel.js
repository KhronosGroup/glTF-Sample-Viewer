import { gltfModelPathProvider } from '../model_path_provider.js'
import { map } from 'rxjs/operators';

class UIModel
{
    constructor(app)
    {
        this.pathProvider = new gltfModelPathProvider('assets/models/2.0/model-index.json');
        this.pathProvider.initialize();

        this.model = app.modelChanged$.pipe(map(value => this.pathProvider.resolve(value.event.msg)));
        this.flavour = app.flavourChanged$.pipe(map(value => value.event.msg)); // TODO gltfModelPathProvider needs to be changed to accept flavours explicitely
        this.scene = app.sceneChanged$.pipe(map(value => value.event.msg));
        this.camera = app.cameraChanged$.pipe(map(value => value.event.msg));
        this.environment = app.environmentChanged$.pipe(map(value => value.event.msg));
        this.tonemap = app.tonemapChanged$.pipe(map(value => value.event.msg));
        this.debugchannel = app.debugchannelChanged$.pipe(map(value => value.event.msg));
        this.skinningEnabled = app.skinningChanged$.pipe(map(value => value.event.msg));
        this.morphingEnabled = app.morphingChanged$.pipe(map(value => value.event.msg));
        this.iblEnabled = app.iblChanged$.pipe(map(value => value.event.msg));
        this.punctualLightsEnabled = app.punctualLightsChanged$.pipe(map(value => value.event.msg));
        this.environmentEnabled = app.environmentVisibilityChanged$.pipe(map(value => value.event.msg));
        this.addEnvironment = app.addEnvironment$.pipe(map(() => {/* TODO Open file dialog */}));
        this.clearColor = app.colorChanged$.pipe(map(value => value.event.msg)); // TODO find correct way of returning a color value string
    }
}

export { UIModel };
