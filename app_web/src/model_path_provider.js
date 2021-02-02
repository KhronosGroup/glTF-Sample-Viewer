import axios from 'axios';

import {
    getContainingFolder,
    combinePaths,
    getFileNameWithoutExtension
} from 'gltf-viewer-source';

class gltfModelPathProvider
{
    constructor(modelIndexerPath, currentFalvour="glTF", ignoredVariants = ["glTF-Embedded"])
    {
        this.modelIndexerPath = modelIndexerPath;
        this.ignoredVariants = ignoredVariants;
        this.currentFalvour = currentFalvour;
        this.modelsDictionary = undefined;

        this.modelIndexer = undefined;
    }

    async initialize()
    {
        const self = this;
        return axios.get(this.modelIndexerPath).then(response =>
        {
            self.modelIndexer = response.data;
            self.populateDictionary(self.modelIndexer);
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
        const modelsFolder = getContainingFolder(this.modelIndexerPath);
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
                if (this.currentFalvour !== variant)
                {
                    continue;
                }

                const fileName = entry.variants[variant];
                const modelPath = combinePaths(modelsFolder, entry.name, variant, fileName);
                let modelKey = getFileNameWithoutExtension(fileName);

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

    // Sets current flavour and repopulates the models dictionary
    setCurrentFlavour(currentFalvour)
    {
        this.currentFalvour = currentFalvour;

        if(this.modelIndexer === undefined)
        {
            console.log("can't set flavor. Model indexer not yet loaded.")
        }

        this.populateDictionary(this.modelIndexer);

        console.log("flavour set to: " + currentFalvour);
    }
}

function fillEnvironmentWithPaths(environmentNames, environmentsBasePath)
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

export { gltfModelPathProvider, fillEnvironmentWithPaths };
