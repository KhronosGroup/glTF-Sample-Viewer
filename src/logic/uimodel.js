import { gltfModelPathProvider } from '../model_path_provider.js'
import { map, startWith } from 'rxjs/operators';
import { glTF } from '../gltf.js';

// this class wraps all the observables for the gltf sample viewer state
// the data streams coming out of this should match the data required in GltfState
// as close as possible
class UIModel
{
    constructor(app)
    {
        this.app = app;

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
        this.clearColor = app.colorChanged$.pipe(map(value => value)); // TODO find correct way of returning a color value string
    }

    attachGltfLoaded(gltfLoadedObservable)
    {
        const gltfLoadedAndInit = gltfLoadedObservable.pipe(
            startWith(new glTF())
        );

        const sceneIndices = gltfLoadedAndInit.pipe(
            map( (gltf) => {
                return gltf.scenes.map( (scene, index) => {
                    return {title: index};
                });
            })
        );
        sceneIndices.subscribe( (scenes) => {
            this.app.scenes = scenes;
        });


    }
}

export { UIModel };
