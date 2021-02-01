import axios from 'axios';

import path from 'path';

class gltfModelPathProvider
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
        return axios.get(this.modelIndexerPath).then(response =>
        {
            const modelIndexer = response.data;
            self.populateDictionary(modelIndexer);
        });
    }

    resolve(modelKey)
    {
        return this.modelsDictionary[modelKey];
    }

    getAllKeys()
    {
        return Object.keys(this.modelsDictionary);
    }

    pathExists(path)
    {
        return Object.values(this.modelsDictionary).find(p => p === path);
    }

    populateDictionary(modelIndexer)
    {
        const modelsFolder = path.dirname(this.modelIndexerPath);
        this.modelsDictionary = {};
        for (const entry of modelIndexer)
        {
            if (entry.variants === undefined)
            {
                continue;
            }

            for (const variant of Object.keys(entry.variants))
            {
                if (this.ignoredVariants.includes(variant))
                {
                    continue;
                }

                const fileName = entry.variants[variant];
                const modelPath = path.join(modelsFolder, entry.name, variant, fileName);
                let modelKey = path.basename(fileName, path.extname(fileName));

                if (entry.name !== undefined)
                {
                    modelKey = entry.name;
                }
                if (variant !== "glTF")
                {
                    modelKey += " (" + variant.replace("glTF-", "") + ")";
                }

                this.modelsDictionary[modelKey] = modelPath;
            }
        }
    }
}

export { gltfModelPathProvider };
