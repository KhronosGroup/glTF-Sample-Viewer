/**
 * hdrpng.js - Original code from Enki https://enkimute.github.io/hdrpng.js/
 * 
 * Refactored and simplified.
 */

function HDRImage() {
    var res = document.createElement('canvas'), HDRsrc='t',HDRdata=null;
    res.__defineGetter__('dataFloat',function(){ return rgbeToFloat(HDRdata); });
    res.__defineGetter__('dataRGBE',function(){ return HDRdata; });
    res.__defineSetter__('src',function(val){
        HDRsrc=val;
        if (val.match(/\.hdr$/i)) loadHDR(val,function(img, width, height) {
            HDRdata = img;
            this.width  = this.style.width  = width;
            this.height = this.style.height = height;
            this.onload && this.onload();
        }.bind(res));
    });
    return res;
}

function m(a,b) {
    for (var i in b) a[i]=b[i];
    return a;
}

/** 
 * Load and parse a Radiance .HDR file. It completes with a 32bit RGBE buffer.
 * @param {URL}      url        location of .HDR file to load.
 * @param {function} completion completion callback.
 * 
 * @returns {XMLHttpRequest}    the XMLHttpRequest used to download the file.
 */
function loadHDR(url, completion ) {
    var req = m(new XMLHttpRequest(),{responseType:"arraybuffer"});
    req.onerror = completion.bind(req,false);
    req.onload  = function() {
        if (this.status>=400) return this.onerror();
        var header='',pos=0,d8=new Uint8Array(this.response),format;
        // read header.
        while (!header.match(/\n\n[^\n]+\n/g)) header += String.fromCharCode(d8[pos++]);
        // check format.
        format = header.match(/FORMAT=(.*)$/m)[1];
        if (format!='32-bit_rle_rgbe') return console.warn('unknown format : '+format),this.onerror();
        // parse resolution
        var rez=header.split(/\n/).reverse()[1].split(' '), width=rez[3]*1, height=rez[1]*1;
        // Create image.
        var img=new Uint8Array(width*height*4),ipos=0;
        // Read all scanlines
        for (var j=0; j<height; j++) {
            var scanline = [];

            var rgbe = d8.slice(pos, pos+=4);
            const isNewRLE = (rgbe[0] == 2 && rgbe[1] == 2 && rgbe[2] == ((width >> 8) & 0xFF) && rgbe[3] == (width & 0xFF));

            if (isNewRLE && (width >= 8) && (width < 32768))
            {
                for (var i=0; i < 4; i++)
                {
                    var ptr = i*width, ptr_end = (i+1)*width, buf, count;
                    while (ptr<ptr_end)
                    {
                        buf = d8.slice(pos, pos+=2);
                        if (buf[0] > 128)
                        {
                            count = buf[0]-128;
                            while(count-- > 0) scanline[ptr++] = buf[1];
                        }
                        else
                        {
                            count = buf[0]-1;
                            scanline[ptr++]=buf[1];
                            while(count-- > 0) scanline[ptr++] = d8[pos++];
                        }
                    }
                }

                for (var i=0;i<width;i++)
                {
                    img[ipos++] = scanline[i+0*width];
                    img[ipos++] = scanline[i+1*width];
                    img[ipos++] = scanline[i+2*width];
                    img[ipos++] = scanline[i+3*width];
                }
            }
            else
            {
                pos -= 4;

                for (var i = 0; i < width; i++)
                {
                    rgbe = d8.slice(pos, pos += 4);

                    img[ipos++] = rgbe[0];
                    img[ipos++] = rgbe[1];
                    img[ipos++] = rgbe[2];
                    img[ipos++] = rgbe[3];
                }
            }
        }
        completion && completion(img,width,height);
    }
    req.open("GET",url,true);
    req.send(null);
    return req;
}

/** Convert a float buffer to a RGBE buffer.
  * @param {Float32Array} buffer Floating point input buffer (96 bits/pixel).
  * @param {Uint8Array}   [res]  Optional output buffer with 32 bit RGBE per pixel.
  * 
  * @returns {Uint8Array}        A 32bit uint8 array in RGBE
  */
function floatToRgbe(buffer, res) {
    var r,g,b,v,s,l=(buffer.byteLength/12)|0, res=res||new Uint8Array(l*4);
    for (var i=0; i<l; i++) {
        r = buffer[i*3];
        g = buffer[i*3+1];
        b = buffer[i*3+2];

        v = Math.max(Math.max(r,g),b);

        var e = Math.ceil(Math.log2(v));
        s = Math.pow(2,e-8);
        
        res[i*4]   = (r/s)|0;
        res[i*4+1] = (g/s)|0;
        res[i*4+2] = (b/s)|0;
        res[i*4+3] = (e+128);
    }
    return res;
}

/** Convert an RGBE buffer to a Float buffer.
  * @param {Uint8Array}     buffer The input buffer in RGBE format. (as returned from loadHDR)
  * @param {Float32Array}   [res]  Optional result buffer containing 3 floats per pixel.
  * 
  * @returns {Float32Array}        A floating point buffer with 96 bits per pixel (32 per channel, 3 channels).
  */
function rgbeToFloat(buffer, res) {
    var s,l=buffer.byteLength>>2, res=res||new Float32Array(l*3);
    for (var i=0; i<l; i++) {
        s = Math.pow(2,buffer[i*4+3]-(128+8));
        
        res[i*3]   = buffer[i*4]*s;
        res[i*3+1] = buffer[i*4+1]*s;
        res[i*3+2] = buffer[i*4+2]*s;
    }
    return res;
}

// Float/RGBE conversions.
HDRImage.floatToRgbe = floatToRgbe;
HDRImage.rgbeToFloat = rgbeToFloat;

export { HDRImage };
