import axios from 'axios';
import path from 'path';

export class GltfModelPathProvider
{
    constructor(modelIndexerPath, ignoredVariants = ["glTF-Embedded"])
    {
        this.modelIndexerPath = modelIndexerPath;
        this.ignoredVariants = ignoredVariants;
        this.modelsDictionary = undefined;
    }

    async initialize()
    {
        const self = this;
        const response = await axios.get(this.modelIndexerPath);
        self.populateDictionary(response.data);
    }

    resolve(modelKey, flavour)
    {
        return this.modelsDictionary[modelKey][flavour];
    }

    getAllKeys()
    {
        return Object.keys(this.modelsDictionary);
    }

    populateDictionary(modelIndexer)
    {
        const modelsFolder = path.dirname(this.modelIndexerPath);
        this.modelsDictionary = {};
        for (const entry of modelIndexer)
        {
            if (entry.variants === undefined || entry.name === undefined)
            {
                continue;
            }

            let variants = [];

            for (const variant of Object.keys(entry.variants))
            {
                if (this.ignoredVariants.includes(variant))
                {
                    continue;
                }

                const fileName = entry.variants[variant];
                const modelPath = path.join(modelsFolder, entry.name, variant, fileName);
                variants[variant] = modelPath;
            }
            this.modelsDictionary[entry.name] = variants;
        }
    }

    getModelFlavours(modelName)
    {
        if(this.modelsDictionary[modelName] === undefined)
        {
            return ["glTF"];
        }
        return Object.keys(this.modelsDictionary[modelName]);
    }
}

export function fillEnvironmentWithPaths(environmentNames, environmentsBasePath)
{
    Object.keys(environmentNames).map(function(name, index) {
        const title = environmentNames[name];
        environmentNames[name] = {
            index: index,
            title: title,
            hdr_path: environmentsBasePath + name + ".hdr",
            jpg_path: environmentsBasePath + name + ".jpg"
        };
    });
    return environmentNames;
}
