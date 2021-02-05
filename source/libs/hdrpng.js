/**
 * hdrpng.js - Original code from Enki https://enkimute.github.io/hdrpng.js/
 *
 * Refactored and simplified.
 */

import { gltfImage } from "../gltf/image";

function _rgbeToFloat(buffer)
{
    const length = buffer.byteLength >> 2;
    const result = new Float32Array(length * 3);

    for (let i = 0; i < length; i++)
    {
        const s = Math.pow(2, buffer[i * 4 + 3] - (128 + 8));

        result[i * 3] = buffer[i * 4] * s;
        result[i * 3 + 1] = buffer[i * 4 + 1] * s;
        result[i * 3 + 2] = buffer[i * 4 + 2] * s;
    }
    return result;
}

async function loadHDR(buffer)
{
    let header = '';
    let pos = 0;
    const d8 = buffer;
    let format = undefined;
    // read header.
    while (!header.match(/\n\n[^\n]+\n/g)) header += String.fromCharCode(d8[pos++]);
    // check format.
    format = header.match(/FORMAT=(.*)$/m);
    if (format.length < 2)
    {
        return undefined;
    }
    format = format[1];
    if (format != '32-bit_rle_rgbe') return console.warn('unknown format : ' + format), this.onerror();
    // parse resolution
    let rez = header.split(/\n/).reverse();
    if (rez.length < 2)
    {
        return undefined;
    }
    rez = rez[1].split(' ');
    if (rez.length < 4)
    {
        return undefined;
    }
    const width = rez[3] * 1, height = rez[1] * 1;
    // Create image.
    const img = new Uint8Array(width * height * 4);
    let ipos = 0;
    // Read all scanlines
    for (let j = 0; j < height; j++)
    {
        const scanline = [];

        let rgbe = d8.slice(pos, pos += 4);
        const isNewRLE = (rgbe[0] == 2 && rgbe[1] == 2 && rgbe[2] == ((width >> 8) & 0xFF) && rgbe[3] == (width & 0xFF));

        if (isNewRLE && (width >= 8) && (width < 32768))
        {
            for (let i = 0; i < 4; i++)
            {
                let ptr = i * width;
                const ptr_end = (i + 1) * width;
                let buf = undefined;
                let count = undefined;
                while (ptr < ptr_end)
                {
                    buf = d8.slice(pos, pos += 2);
                    if (buf[0] > 128)
                    {
                        count = buf[0] - 128;
                        while (count-- > 0) scanline[ptr++] = buf[1];
                    }
                    else
                    {
                        count = buf[0] - 1;
                        scanline[ptr++] = buf[1];
                        while (count-- > 0) scanline[ptr++] = d8[pos++];
                    }
                }
            }

            for (let i = 0; i < width; i++)
            {
                img[ipos++] = scanline[i + 0 * width];
                img[ipos++] = scanline[i + 1 * width];
                img[ipos++] = scanline[i + 2 * width];
                img[ipos++] = scanline[i + 3 * width];
            }
        }
        else
        {
            pos -= 4;

            for (let i = 0; i < width; i++)
            {
                rgbe = d8.slice(pos, pos += 4);

                img[ipos++] = rgbe[0];
                img[ipos++] = rgbe[1];
                img[ipos++] = rgbe[2];
                img[ipos++] = rgbe[3];
            }
        }
    }

    const imageFloatBuffer = _rgbeToFloat(img);

    return {
        dataFloat: imageFloatBuffer,
        width: width,
        height: height
    };
}

export { loadHDR };
