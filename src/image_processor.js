import { HDRImage } from '../libs/hdrpng.js';

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
        const power = this.nearestPowerOf2(image.height);
        return { width: power, height: power };
    }

    processNonSquareImage(image)
    {
        return { width: this.makeEven(image.width), height: this.makeEven(image.height) };
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

    nearestPowerOf2(n)
    {
        if (this.isPowerOf2(n))
        {
            return n;
        }
        return Math.pow(2.0, Math.round(Math.log(n) / Math.log(2.0)));
    }

    isPowerOf2(n)
    {
        return n && (n & (n - 1)) === 0;
    }

    makeEven(n)
    {
        if (n % 2 === 1)
        {
            return n + 1;
        }
        return n;
    }
}

export { gltfImageProcessor };
