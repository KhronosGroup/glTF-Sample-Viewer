export class GltfModelPathProvider {
    constructor(url, ignoredVariants = []) {
        this.url = url;
        this.ignoredVariants = ignoredVariants;
        this.modelsDictionary = undefined;
        this.tagsDictionary = {};
    }

    async initialize() {
        const response = await fetch(this.url + "/Models/model-index.json");
        this.populateDictionary(await response.json());
    }

    resolve(modelKey, flavour) {
        return this.modelsDictionary[modelKey][flavour];
    }

    /**
     * Model names, narrowed to those carrying every given tag and offering at
     * least one of the given flavours.
     */
    getAllKeys(tags = [], flavours = this.getAllFlavours()) {
        return Object.keys(this.modelsDictionary).filter(
            (name) =>
                tags.every((tag) => this.tagsDictionary[name].includes(tag)) &&
                flavours.some((flavour) => this.modelsDictionary[name][flavour] !== undefined)
        );
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
