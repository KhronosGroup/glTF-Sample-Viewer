export class GltfModelPathProvider {
    constructor(url, ignoredVariants = []) {
        this.url = url;
        this.ignoredVariants = ignoredVariants;
        this.modelsDictionary = undefined;
        this.tagsDictionary = {};
        this.screenshotsDictionary = {};
    }

    async initialize() {
        const response = await fetch(this.url + "/Models/model-index.json");
        this.populateDictionary(await response.json());
    }

    resolve(modelKey, flavour) {
        return this.modelsDictionary[modelKey][flavour];
    }

    /**
     * Model names, narrowed to those carrying every given tag and offering
     * every given flavour. An empty list does not narrow anything.
     */
    getAllKeys(tags = [], flavours = []) {
        return Object.keys(this.modelsDictionary).filter(
            (name) =>
                tags.every((tag) => this.tagsDictionary[name].includes(tag)) &&
                flavours.every((flavour) => this.modelsDictionary[name][flavour] !== undefined)
        );
    }

    /** Model name to preview image URL, for the models that ship one. */
    getAllScreenshots() {
        return this.screenshotsDictionary;
    }

    getAllTags() {
        const tags = new Set();
        for (const modelTags of Object.values(this.tagsDictionary)) {
            for (const tag of modelTags) {
                tags.add(tag);
            }
        }
        return [...tags].sort();
    }

    getAllFlavours() {
        const flavours = new Set();
        for (const variants of Object.values(this.modelsDictionary)) {
            for (const flavour of Object.keys(variants)) {
                flavours.add(flavour);
            }
        }
        return [...flavours].sort();
    }

    populateDictionary(modelIndexer) {
        const modelsFolder = this.url + "/Models";
        this.modelsDictionary = {};
        this.tagsDictionary = {};
        this.screenshotsDictionary = {};
        for (const entry of modelIndexer) {
            if (entry.variants === undefined || entry.name === undefined) {
                continue;
            }

            let variants = [];

            for (const variant of Object.keys(entry.variants)) {
                if (this.ignoredVariants.includes(variant)) {
                    continue;
                }

                const fileName = entry.variants[variant];
                variants[variant] =
                    modelsFolder + "/" + entry.name + "/" + variant + "/" + fileName;
            }
            this.modelsDictionary[entry.name] = variants;
            this.tagsDictionary[entry.name] = entry.tags ?? [];
            if (entry.screenshot !== undefined) {
                this.screenshotsDictionary[entry.name] =
                    modelsFolder + "/" + entry.name + "/" + entry.screenshot;
            }
        }
    }

    getModelFlavours(modelName) {
        if (this.modelsDictionary[modelName] === undefined) {
            return ["glTF"];
        }
        return Object.keys(this.modelsDictionary[modelName]);
    }
}

export function fillEnvironmentWithPaths(environmentNames, environmentsBasePath) {
    Object.keys(environmentNames).map(function (name, index) {
        const title = environmentNames[name];
        environmentNames[name] = {
            index: index,
            title: title,
            hdr_path: environmentsBasePath + name + ".hdr",
            jpg_path: environmentsBasePath + name + ".jpg",
            license_path: environmentsBasePath + name + ".hdr.license",
            base_path: environmentsBasePath
        };
    });
    return environmentNames;
}
