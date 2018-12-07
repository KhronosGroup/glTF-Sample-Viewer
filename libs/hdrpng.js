/**
 * hdrpng.js - support for Radiance .HDR and RGBE / RGB9_E5 images in PNG.
 * @author Enki
 * @desc load/save Radiance .HDR, RGBE in PNG and RGB9_E5 in PNG for HTML5, webGL, webGL2.
 */

/**
 * HDRImage - wrapper that exposes default Image like interface for HDR imgaes. (till extending HTMLCanvasElement actually works ..)
 * @returns {HDRImage} a html HDR image element
 */
function HDRImage() {
  var res = document.createElement('canvas'), HDRsrc='t',HDRexposure=1.0,HDRgamma=2.2,HDRdata=null,context,HDRD;
  res.__defineGetter__('exposure',function(){return HDRexposure});
  res.__defineSetter__('exposure',function(val){ HDRexposure=val; if (HDRdata) { rgbeToLDR(HDRdata,HDRexposure,HDRgamma,HDRD.data); context.putImageData(HDRD,0,0); }});
  res.__defineGetter__('gamma',function(){return HDRgamma});
  res.__defineSetter__('gamma',function(val){ HDRgamma=val; if (HDRdata) { rgbeToLDR(HDRdata,HDRexposure,HDRgamma,HDRD.data); context.putImageData(HDRD,0,0); }});
  res.__defineGetter__('dataFloat',function(){ return rgbeToFloat(HDRdata); });
  res.__defineGetter__('dataRGBE',function(){ return HDRdata; });
  res.toHDRBlob = function(cb,m,q) {
    // Array to image.. slightly more involved.
      function createShader(gl, source, type) {
          var shader = gl.createShader(type);
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          return shader;
      }
      function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
          var program = gl.createProgram(),vs,fs;
          gl.attachShader(program, vs=createShader(gl, vertexShaderSource, gl.VERTEX_SHADER));
          gl.attachShader(program, fs=createShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER));
          gl.linkProgram(program); gl.deleteShader(vs); gl.deleteShader(fs);
          return program;
      };
      var ar = (m && m.match(/rgb9_e5/i)) ? new Uint8Array( floatToRgb9_e5(rgbeToFloat(HDRdata)).buffer ) : new Uint8Array(HDRdata.buffer);
      var vs2='precision highp float;\nattribute vec3 position;\nvarying vec2 tex;\nvoid main() { tex = position.xy/2.0+0.5; gl_Position = vec4(position, 1.0); }';
      var fs2='precision highp float;\nprecision highp sampler2D;\nuniform sampler2D tx;\nvarying vec2 tex;\nvoid main() { gl_FragColor = texture2D(tx,tex); }';
      var x = this.width, y = this.height;
      if (x*y*4 < ar.byteLength) return console.error('not big enough.');
      var c = document.createElement('canvas');
      c.width=x; c.height=y;
      var gl = c.getContext('webgl',{antialias:false,alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true});

      var texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);  gl.bindTexture(gl.TEXTURE_2D, texture);  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, x, y, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(ar.buffer));

      var program = createProgram(gl, vs2, fs2), uniformTexLocation = gl.getUniformLocation(program, 'tx');

      var positions = new Float32Array([-1, -1, 0, 1, -1, 0, 1,  1, 0, 1,  1, 0, -1,  1, 0, -1, -1, 0 ]), vertexPosBuffer=gl.createBuffer();
      gl.enableVertexAttribArray(0);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

      gl.useProgram(program);
      gl.uniform1i(uniformTexLocation, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.deleteTexture(texture);
      gl.deleteProgram(program);

      if (cb) return c.toBlob(cb);
  }
  res.__defineGetter__('src',function(){return HDRsrc});
  res.__defineSetter__('src',function(val){
    HDRsrc=val;
    context&&context.clearRect(0,0,this.width,this.height);
    if (val.match(/\.hdr$/i)) loadHDR(val,function(img,width,height){
      HDRdata = img;
      this.width  = this.style.width  = width;
      this.height = this.style.height = height;
      context = this.getContext('2d');
      HDRD = context.getImageData(0,0,width,height);
      rgbeToLDR(img,HDRexposure,HDRgamma,HDRD.data);
      context.putImageData(HDRD,0,0);
      this.onload&&this.onload();
    }.bind(res));
    else if (val.match(/\.rgb9_e5\.png$/i)) {
      var i = new Image();
      i.src = val;
      i.onload = function() {
        var c = document.createElement('canvas'), x=this.width=this.style.width=c.width=i.width, y=this.height=this.style.height=c.height=i.height, gl=c.getContext('webgl');

        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i);

        fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        var res = new Uint8Array(x*y*4);
        gl.readPixels(0,0,x,y,gl.RGBA,gl.UNSIGNED_BYTE,res);

        gl.deleteTexture(texture);
        gl.deleteFramebuffer(fb);

        this.dataRAW = new Uint32Array(res.buffer);
        HDRdata = floatToRgbe(rgb9_e5ToFloat(this.dataRAW));
        context = this.getContext('2d');
        HDRD = context.getImageData(0,0,x,y);
        rgbeToLDR(HDRdata,HDRexposure,HDRgamma,HDRD.data);
        context.putImageData(HDRD,0,0);
        this.onload&&this.onload();
      }.bind(res);
    } else if (val.match(/\.hdr\.png$|\.rgbe\.png/i)) {
      var i = new Image();
      i.src = val;
      i.onload = function() {
        var c = document.createElement('canvas'), x=this.width=this.style.width=c.width=i.width, y=this.height=this.style.height=c.height=i.height, gl=c.getContext('webgl');

        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i);

        fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        var res = new Uint8Array(x*y*4);
        gl.readPixels(0,0,x,y,gl.RGBA,gl.UNSIGNED_BYTE,res);

        gl.deleteTexture(texture);
        gl.deleteFramebuffer(fb);

        HDRdata = res;
        context = this.getContext('2d');
        HDRD = context.getImageData(0,0,x,y);
        rgbeToLDR(HDRdata,HDRexposure,HDRgamma,HDRD.data);
        context.putImageData(HDRD,0,0);
        this.onload&&this.onload();
      }.bind(res);
    }
  });
  return res;
}

function m(a,b) { for (var i in b) a[i]=b[i]; return a; };

/** Load and parse a Radiance .HDR file. It completes with a 32bit RGBE buffer.
  * @param {URL} url location of .HDR file to load.
  * @param {function} completion completion callback.
  * @returns {XMLHttpRequest} the XMLHttpRequest used to download the file.
  */
function loadHDR( url, completion ) {
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
    completion&&completion(img,width,height);
  }
  req.open("GET",url,true);
  req.send(null);
  return req;
}

/** Convert a float buffer to a RGB9_E5 buffer. (ref https://www.khronos.org/registry/OpenGL/extensions/EXT/EXT_texture_shared_exponent.txt)
  * @param {Float32Array} Buffer Floating point input buffer (96 bits/pixel).
  * @param {Uint32Array} [res] Optional output buffer with 32 bit RGB9_E5 per pixel.
  * @returns {Uint32Array} A 32bit uint32 array in RGB9_E5
  */
function floatToRgb9_e5(buffer,res) {
  var r,g,b,v,maxColor,ExpShared,denom,s,l=(buffer.byteLength/12)|0, res=res||new Uint32Array(l);
  for (var i=0;i<l;i++) {
    r=Math.min(32768.0,buffer[i*3]); g=Math.min(32768.0,buffer[i*3+1]); b=Math.min(32768.0,buffer[i*3+2]);
    maxColor = Math.max(Math.max(r,g),b);
    ExpShared = Math.max(-16,Math.floor(Math.log2(maxColor))) + 16;
    denom = Math.pow(2,ExpShared-24);
    if (Math.floor(maxColor/denom+0.5) == 511) { denom *= 2; ExpShared += 1; }
    res[i] = (Math.floor(r/denom+0.5)<<23)+(Math.floor(g/denom+0.5)<<14)+(Math.floor(b/denom+0.5)<<5)+ (ExpShared|0);
  }
  return res;
}

/** Convert an RGB9_E5 buffer to a Float buffer.
  * @param {Uint32Array} Buffer in RGB9_E5 format. (Uint32 buffer).
  * @param {Float32Array} [res] Optional float output buffer.
  * @returns {Float32Array} A Float32Array.
  */
function rgb9_e5ToFloat(buffer,res) {
  var v,s,l=buffer.byteLength>>2, res=res||new Float32Array(l*3);
  for (var i=0;i<l;i++) {
    v = buffer[i]; s = Math.pow(2,(v&31)-24);
    res[i*3]   =  (v>>>23)*s;
    res[i*3+1] = ((v>>>14)&511)*s;
    res[i*3+2] = ((v>>>5)&511)*s;
  }
  return res;
}

/** Convert a float buffer to a RGBE buffer.
  * @param {Float32Array} Buffer Floating point input buffer (96 bits/pixel).
  * @param {Uint8Array} [res] Optional output buffer with 32 bit RGBE per pixel.
  * @returns {Uint8Array} A 32bit uint8 array in RGBE
  */
function floatToRgbe(buffer,res) {
  var r,g,b,v,s,l=(buffer.byteLength/12)|0, res=res||new Uint8Array(l*4);
  for (var i=0;i<l;i++) {
    r = buffer[i*3]; g = buffer[i*3+1]; b = buffer[i*3+2];
    v = Math.max(Math.max(r,g),b); e = Math.ceil(Math.log2(v)); s = Math.pow(2,e-8);
    res[i*4]   = (r/s)|0;
    res[i*4+1] = (g/s)|0;
    res[i*4+2] = (b/s)|0;
    res[i*4+3] = (e+128);
  }
  return res;
}

/** Convert an RGBE buffer to a Float buffer.
  * @param {Uint8Array} buffer The input buffer in RGBE format. (as returned from loadHDR)
  * @param {Float32Array} [res] Optional result buffer containing 3 floats per pixel.
  * @returns {Float32Array} A floating point buffer with 96 bits per pixel (32 per channel, 3 channels).
  */
function rgbeToFloat(buffer,res) {
  var s,l=buffer.byteLength>>2, res=res||new Float32Array(l*3);
  for (var i=0;i<l;i++) {
    s = Math.pow(2,buffer[i*4+3]-(128+8));
    res[i*3]=buffer[i*4]*s;
    res[i*3+1]=buffer[i*4+1]*s;
    res[i*3+2]=buffer[i*4+2]*s;
  }
  return res;
}

/** Convert an RGBE buffer to LDR with given exposure and display gamma.
  * @param {Uint8Array} buffer The input buffer in RGBE format. (as returned from loadHDR)
  * @param {float} [exposure=1] Optional exposure value. (1=default, 2=1 step up, 3=2 steps up, -2 = 3 steps down)
  * @param {float} [gamma=2.2]  Optional display gamma to respect. (1.0 = linear, 2.2 = default monitor)
  * @param {Array} [res] res Optional result buffer.
  */
function rgbeToLDR(buffer,exposure,gamma,res) {
  exposure = Math.pow(2,exposure===undefined?1:exposure)/2;
  if (gamma===undefined) gamma = 2.2;
  var one_over_gamma=1/gamma,s,l=buffer.byteLength>>2, res=res||new Uint8ClampedArray(l*4);
  for (var i=0;i<l;i++) {
    s = exposure * Math.pow(2,buffer[i*4+3]-(128+8));
    res[i*4]  =255*Math.pow(buffer[i*4]*s,one_over_gamma);
    res[i*4+1]=255*Math.pow(buffer[i*4+1]*s,one_over_gamma);
    res[i*4+2]=255*Math.pow(buffer[i*4+2]*s,one_over_gamma);
    res[i*4+3]=255;
  }
  return res;
}

/** Convert an float buffer to LDR with given exposure and display gamma.
  * @param {Float32Array} buffer The input buffer in floating point format.
  * @param {float} [exposure=1] Optional exposure value. (1=default, 2=1 step up, 3=2 steps up, -2 = 3 steps down)
  * @param {float} [gamma=2.2]  Optional display gamma to respect. (1.0 = linear, 2.2 = default monitor)
  * @param {Array} [res] res Optional result buffer.
  */
function floatToLDR(buffer,exposure,gamma,res) {
  exposure = Math.pow(2,exposure===undefined?1:exposure)/2;
  if (gamma===undefined) gamma = 2.2;
  var one_over_gamma=1/gamma,s,l=(buffer.byteLength/12)|0, res=res||new Uint8ClampedArray(l*4);
  for (var i=0;i<l;i++) {
    res[i*4]  =255*Math.pow(buffer[i*3]*exposure,one_over_gamma);
    res[i*4+1]=255*Math.pow(buffer[i*3+1]*exposure,one_over_gamma);
    res[i*4+2]=255*Math.pow(buffer[i*3+2]*exposure,one_over_gamma);
    res[i*4+3]=255;
  }
  return res;
}


// Float/RGBE conversions.
HDRImage.floatToRgbe = floatToRgbe;
HDRImage.rgbeToFloat = rgbeToFloat;

// Float/RGB9_E5 conversions.
HDRImage.floatToRgb9_e5 = floatToRgb9_e5;
HDRImage.rgb9_e5ToFloat = rgb9_e5ToFloat;

// x to LDR conversion.
HDRImage.rgbeToLDR   = rgbeToLDR;
HDRImage.floatToLDR  = floatToLDR;


export { HDRImage };
