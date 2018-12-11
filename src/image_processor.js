class gltfImageProcessor
{
    isPowerOf2(n)
    {
        return n && (n & (n - 1)) === 0;
    }

    postProcessImages(gltf)
    {
        const imagePromises = [];
        if (gltf.images !== undefined)
        {
            let i;
            for (i = 0; i < gltf.images.length; i++)
            {
                if (gltf.images[i].image.dataRGBE !== undefined ||
                    this.isPowerOf2(gltf.images[i].image.width) && (gltf.images[i].image.width === gltf.images[i].image.height))
                {
                    // Square image and power of two, so no resize needed.
                    continue;
                }

                let doPower = false;

                if (gltf.images[i].image.width == gltf.images[i].image.height)
                {
                    // Square image but not power of two. Resize it to power of two.
                    doPower = true;
                }
                else
                {
                    // Rectangle image, so not mip-mapped and ...

                    if ((gltf.images[i].image.width % 2 == 0) && (gltf.images[i].image.height % 2 == 0))
                    {
                        // ... with even size, so no resize needed.
                        continue;
                    }

                    // ... with odd size, so resize needed to make even size.
                }

                const currentImagePromise = new Promise(function(resolve)
                {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');

                    function nearestPowerOf2(n)
                    {
                        return Math.pow(2.0, Math.round(Math.log(n) / Math.log(2.0)));
                    }

                    function makeEven(n)
                    {
                        if (n % 2 === 1)
                        {
                            return n + 1;
                        }
                        return n;
                    }

                    if (doPower)
                    {
                        canvas.width = nearestPowerOf2(gltf.images[i].image.width);
                        canvas.height = nearestPowerOf2(gltf.images[i].image.height);
                    }
                    else
                    {
                        canvas.width = makeEven(gltf.images[i].image.width);
                        canvas.height = makeEven(gltf.images[i].image.height);
                    }

                    context.drawImage(gltf.images[i].image, 0, 0, canvas.width, canvas.height);

                    gltf.images[i].image.src = canvas.toDataURL("image/png");

                    resolve();
                });

                imagePromises.push(currentImagePromise);
            }
        }

        return Promise.all(imagePromises);
    }
}
