import { Ktx2Image } from '../libs/ktx2image.js';
import { HDRImage } from '../libs/hdrpng.js';
import { nearestPowerOf2, makeEven } from './math_utils.js';

class gltfImageProcessor
{
    processImages(gltf)
    {
        for (const gltfImage of gltf.images)
        {
            const image = gltfImage.image;

            if (image instanceof HDRImage)
            {
                continue;
            }
            if (image instanceof Ktx2Image)
            {
                continue;
            }

            let newDimensions = undefined;

            if (image.width === image.height)
            {
                newDimensions = this.processSquareImage(image);
            }
            else
            {
                newDimensions = this.processNonSquareImage(image);
            }

            if (newDimensions.width === image.width && newDimensions.height === image.height)
            {
                continue;
            }

            this.resizeImage(image, newDimensions);
        }
    }

    processSquareImage(image)
    {
        const power = nearestPowerOf2(image.height);
        return { width: power, height: power };
    }

    processNonSquareImage(image)
    {
        return { width: nearestPowerOf2(makeEven(image.width)), height: nearestPowerOf2(makeEven(image.height)) };
    }

    resizeImage(image, newDimensions)
    {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = newDimensions.width;
        canvas.height = newDimensions.height;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        image.src = canvas.toDataURL("image/png");
    }
}

export { gltfImageProcessor };
