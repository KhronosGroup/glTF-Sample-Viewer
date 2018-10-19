function jsToGl(array)
{
    let tensor = new glMatrix.ARRAY_TYPE(array.length);

    for (let i = 0; i < array.length; ++i)
    {
        tensor[i] = array[i];
    }

    return tensor;
}

function fromKeys(target, jsonObj, ignore = [])
{
    for(let k of Object.keys(target))
    {
        if(ignore && ignore.find(function(elem){return elem == k}) !== undefined)
        {
            continue; // skip
        }
        if(jsonObj[k] !== undefined)
        {
            target[k] = jsonObj[k];
        }
    }
}

function fromParams(parameters, target, jsonObj)
{
    for(let p of parameters)
    {
        if(jsonObj[p] !== undefined)
        {
            target[p] = jsonObj[p];
        }
    }
}

function stringHash(str, seed = 0)
{
    for(var i = 0; i < str.length; ++i)
    {
        seed = Math.imul(31, seed) + str.charCodeAt(i) | 0;
    }

    return seed;
}
