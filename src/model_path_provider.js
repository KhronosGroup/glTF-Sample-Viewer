export class GltfModelPathProvider
{
    constructor(url, ignoredVariants = [])
    {
        this.url = url;
        this.ignoredVariants = ignoredVariants;
        this.modelsDictionary = undefined;
    }

    async initialize()
    {
        const response = await fetch(this.url + "/Models/model-index.json");
        this.populateDictionary(await response.json());
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
        const modelsFolder = this.url + "/Models";
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
                variants[variant] = modelsFolder + "/" + entry.name + "/" + variant + "/" + fileName;
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
