'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Common utilities
 * @module glMatrix
 */

// Configuration Constants
var EPSILON = 0.000001;
var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;

var degree = Math.PI / 180;

/**
 * 3x3 Matrix
 * @module mat3
 */

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */
function create$2() {
  var out = new ARRAY_TYPE(9);
  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
  }
  out[0] = 1;
  out[4] = 1;
  out[8] = 1;
  return out;
}

/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
function multiply$2(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
  var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
  var a20 = a[6],
      a21 = a[7],
      a22 = a[8];

  var b00 = b[0],
      b01 = b[1],
      b02 = b[2];
  var b10 = b[3],
      b11 = b[4],
      b12 = b[5];
  var b20 = b[6],
      b21 = b[7],
      b22 = b[8];

  out[0] = b00 * a00 + b01 * a10 + b02 * a20;
  out[1] = b00 * a01 + b01 * a11 + b02 * a21;
  out[2] = b00 * a02 + b01 * a12 + b02 * a22;

  out[3] = b10 * a00 + b11 * a10 + b12 * a20;
  out[4] = b10 * a01 + b11 * a11 + b12 * a21;
  out[5] = b10 * a02 + b11 * a12 + b12 * a22;

  out[6] = b20 * a00 + b21 * a10 + b22 * a20;
  out[7] = b20 * a01 + b21 * a11 + b22 * a21;
  out[8] = b20 * a02 + b21 * a12 + b22 * a22;
  return out;
}

/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
function create$3() {
  var out = new ARRAY_TYPE(16);
  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {mat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
function clone$3(a) {
  var out = new ARRAY_TYPE(16);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
function identity$3(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
function transpose$2(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
        a02 = a[2],
        a03 = a[3];
    var a12 = a[6],
        a13 = a[7];
    var a23 = a[11];

    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a01;
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a02;
    out[9] = a12;
    out[11] = a[14];
    out[12] = a03;
    out[13] = a13;
    out[14] = a23;
  } else {
    out[0] = a[0];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a[1];
    out[5] = a[5];
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a[2];
    out[9] = a[6];
    out[10] = a[10];
    out[11] = a[14];
    out[12] = a[3];
    out[13] = a[7];
    out[14] = a[11];
    out[15] = a[15];
  }

  return out;
}

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
function invert$3(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];

  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;

  // Calculate the determinant
  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return null;
  }
  det = 1.0 / det;

  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

  return out;
}

/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
function multiply$3(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];

  // Cache only the current line of the second matrix
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[4];b1 = b[5];b2 = b[6];b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[8];b1 = b[9];b2 = b[10];b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[12];b1 = b[13];b2 = b[14];b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {vec3} v Scaling vector
 * @returns {mat4} out
 */
function fromScaling$3(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Returns the translation vector component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslation,
 *  the returned vector will be the same as the translation vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive translation component
 * @param  {mat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */
function getTranslation(out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];

  return out;
}

/**
 * Returns the scaling factor component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslationScale
 *  with a normalized Quaternion paramter, the returned vector will be
 *  the same as the scaling vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive scaling factor component
 * @param  {mat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */
function getScaling(out, mat) {
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];

  out[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
  out[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
  out[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);

  return out;
}

/**
 * Returns a quaternion representing the rotational component
 *  of a transformation matrix. If a matrix is built with
 *  fromRotationTranslation, the returned quaternion will be the
 *  same as the quaternion originally supplied.
 * @param {quat} out Quaternion to receive the rotation component
 * @param {mat4} mat Matrix to be decomposed (input)
 * @return {quat} out
 */
function getRotation(out, mat) {
  // Algorithm taken from http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
  var trace = mat[0] + mat[5] + mat[10];
  var S = 0;

  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (mat[6] - mat[9]) / S;
    out[1] = (mat[8] - mat[2]) / S;
    out[2] = (mat[1] - mat[4]) / S;
  } else if (mat[0] > mat[5] && mat[0] > mat[10]) {
    S = Math.sqrt(1.0 + mat[0] - mat[5] - mat[10]) * 2;
    out[3] = (mat[6] - mat[9]) / S;
    out[0] = 0.25 * S;
    out[1] = (mat[1] + mat[4]) / S;
    out[2] = (mat[8] + mat[2]) / S;
  } else if (mat[5] > mat[10]) {
    S = Math.sqrt(1.0 + mat[5] - mat[0] - mat[10]) * 2;
    out[3] = (mat[8] - mat[2]) / S;
    out[0] = (mat[1] + mat[4]) / S;
    out[1] = 0.25 * S;
    out[2] = (mat[6] + mat[9]) / S;
  } else {
    S = Math.sqrt(1.0 + mat[10] - mat[0] - mat[5]) * 2;
    out[3] = (mat[1] - mat[4]) / S;
    out[0] = (mat[8] + mat[2]) / S;
    out[1] = (mat[6] + mat[9]) / S;
    out[2] = 0.25 * S;
  }

  return out;
}

/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @param {vec3} s Scaling vector
 * @returns {mat4} out
 */
function fromRotationTranslationScale(out, q, v, s) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;

  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];

  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;

  return out;
}

/**
 * Generates a perspective projection matrix with the given bounds.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */
function perspective(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf = void 0;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;
  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }
  return out;
}

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {mat4} out
 */
function lookAt(out, eye, center, up) {
  var x0 = void 0,
      x1 = void 0,
      x2 = void 0,
      y0 = void 0,
      y1 = void 0,
      y2 = void 0,
      z0 = void 0,
      z1 = void 0,
      z2 = void 0,
      len = void 0;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];

  if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
    return identity$3(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;

  len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;

  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;

  len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;

  return out;
}

/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
function create$4() {
  var out = new ARRAY_TYPE(3);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  return out;
}

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
function length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
function fromValues$4(x, y, z) {
  var out = new ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function add$4(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function subtract$4(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
function scale$4(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;
  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
  }
  return out;
}

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function cross(out, a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2];
  var bx = b[0],
      by = b[1],
      bz = b[2];

  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 */
function transformMat4(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}

/**
 * Transforms the vec3 with a quat
 * Can also be used for dual quaternions. (Multiply it with the real part)
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec3} out
 */
function transformQuat(out, a, q) {
  // benchmarks: https://jsperf.com/quaternion-transform-vec3-implementations-fixed
  var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3];
  var x = a[0],
      y = a[1],
      z = a[2];
  // var qvec = [qx, qy, qz];
  // var uv = vec3.cross([], qvec, a);
  var uvx = qy * z - qz * y,
      uvy = qz * x - qx * z,
      uvz = qx * y - qy * x;
  // var uuv = vec3.cross([], qvec, uv);
  var uuvx = qy * uvz - qz * uvy,
      uuvy = qz * uvx - qx * uvz,
      uuvz = qx * uvy - qy * uvx;
  // vec3.scale(uv, uv, 2 * w);
  var w2 = qw * 2;
  uvx *= w2;
  uvy *= w2;
  uvz *= w2;
  // vec3.scale(uuv, uuv, 2);
  uuvx *= 2;
  uuvy *= 2;
  uuvz *= 2;
  // return vec3.add(out, a, vec3.add(out, uv, uuv));
  out[0] = x + uvx + uuvx;
  out[1] = y + uvy + uuvy;
  out[2] = z + uvz + uuvz;
  return out;
}

/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function rotateX$1(out, a, b, c) {
  var p = [],
      r = [];
  //Translate point to the origin
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];

  //perform rotation
  r[0] = p[0];
  r[1] = p[1] * Math.cos(c) - p[2] * Math.sin(c);
  r[2] = p[1] * Math.sin(c) + p[2] * Math.cos(c);

  //translate to correct position
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];

  return out;
}

/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function rotateY$1(out, a, b, c) {
  var p = [],
      r = [];
  //Translate point to the origin
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];

  //perform rotation
  r[0] = p[2] * Math.sin(c) + p[0] * Math.cos(c);
  r[1] = p[1];
  r[2] = p[2] * Math.cos(c) - p[0] * Math.sin(c);

  //translate to correct position
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];

  return out;
}

/**
 * Alias for {@link vec3.subtract}
 * @function
 */
var sub$4 = subtract$4;

/**
 * Alias for {@link vec3.length}
 * @function
 */
var len = length;

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
var forEach = function () {
  var vec = create$4();

  return function (a, stride, offset, count, fn, arg) {
    var i = void 0,
        l = void 0;
    if (!stride) {
      stride = 3;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];vec[1] = a[i + 1];vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];a[i + 1] = vec[1];a[i + 2] = vec[2];
    }

    return a;
  };
}();

/**
 * 4 Dimensional Vector
 * @module vec4
 */

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
function create$5() {
  var out = new ARRAY_TYPE(4);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }
  return out;
}

/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to normalize
 * @returns {vec4} out
 */
function normalize$1(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  var len = x * x + y * y + z * z + w * w;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    out[0] = x * len;
    out[1] = y * len;
    out[2] = z * len;
    out[3] = w * len;
  }
  return out;
}

/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
var forEach$1 = function () {
  var vec = create$5();

  return function (a, stride, offset, count, fn, arg) {
    var i = void 0,
        l = void 0;
    if (!stride) {
      stride = 4;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];vec[1] = a[i + 1];vec[2] = a[i + 2];vec[3] = a[i + 3];
      fn(vec, vec, arg);
      a[i] = vec[0];a[i + 1] = vec[1];a[i + 2] = vec[2];a[i + 3] = vec[3];
    }

    return a;
  };
}();

/**
 * Quaternion
 * @module quat
 */

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */
function create$6() {
  var out = new ARRAY_TYPE(4);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  out[3] = 1;
  return out;
}

/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {vec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/
function setAxisAngle(out, axis, rad) {
  rad = rad * 0.5;
  var s = Math.sin(rad);
  out[0] = s * axis[0];
  out[1] = s * axis[1];
  out[2] = s * axis[2];
  out[3] = Math.cos(rad);
  return out;
}

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */
function slerp(out, a, b, t) {
  // benchmarks:
  //    http://jsperf.com/quaternion-slerp-implementations
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bx = b[0],
      by = b[1],
      bz = b[2],
      bw = b[3];

  var omega = void 0,
      cosom = void 0,
      sinom = void 0,
      scale0 = void 0,
      scale1 = void 0;

  // calc cosine
  cosom = ax * bx + ay * by + az * bz + aw * bw;
  // adjust signs (if necessary)
  if (cosom < 0.0) {
    cosom = -cosom;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  // calculate coefficients
  if (1.0 - cosom > EPSILON) {
    // standard case (slerp)
    omega = Math.acos(cosom);
    sinom = Math.sin(omega);
    scale0 = Math.sin((1.0 - t) * omega) / sinom;
    scale1 = Math.sin(t * omega) / sinom;
  } else {
    // "from" and "to" quaternions are very close
    //  ... so we can do a linear interpolation
    scale0 = 1.0 - t;
    scale1 = t;
  }
  // calculate final values
  out[0] = scale0 * ax + scale1 * bx;
  out[1] = scale0 * ay + scale1 * by;
  out[2] = scale0 * az + scale1 * bz;
  out[3] = scale0 * aw + scale1 * bw;

  return out;
}

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {mat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
function fromMat3(out, m) {
  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
  // article "Quaternion Calculus and Fast Animation".
  var fTrace = m[0] + m[4] + m[8];
  var fRoot = void 0;

  if (fTrace > 0.0) {
    // |w| > 1/2, may as well choose w > 1/2
    fRoot = Math.sqrt(fTrace + 1.0); // 2w
    out[3] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot; // 1/(4w)
    out[0] = (m[5] - m[7]) * fRoot;
    out[1] = (m[6] - m[2]) * fRoot;
    out[2] = (m[1] - m[3]) * fRoot;
  } else {
    // |w| <= 1/2
    var i = 0;
    if (m[4] > m[0]) i = 1;
    if (m[8] > m[i * 3 + i]) i = 2;
    var j = (i + 1) % 3;
    var k = (i + 2) % 3;

    fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
    out[i] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
    out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
    out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
  }

  return out;
}

/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
var normalize$2 = normalize$1;

/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {vec3} a the initial vector
 * @param {vec3} b the destination vector
 * @returns {quat} out
 */
var rotationTo = function () {
  var tmpvec3 = create$4();
  var xUnitVec3 = fromValues$4(1, 0, 0);
  var yUnitVec3 = fromValues$4(0, 1, 0);

  return function (out, a, b) {
    var dot$$1 = dot(a, b);
    if (dot$$1 < -0.999999) {
      cross(tmpvec3, xUnitVec3, a);
      if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
      normalize(tmpvec3, tmpvec3);
      setAxisAngle(out, tmpvec3, Math.PI);
      return out;
    } else if (dot$$1 > 0.999999) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    } else {
      cross(tmpvec3, a, b);
      out[0] = tmpvec3[0];
      out[1] = tmpvec3[1];
      out[2] = tmpvec3[2];
      out[3] = 1 + dot$$1;
      return normalize$2(out, out);
    }
  };
}();

/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {quat} c the third operand
 * @param {quat} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */
var sqlerp = function () {
  var temp1 = create$6();
  var temp2 = create$6();

  return function (out, a, b, c, d, t) {
    slerp(temp1, a, d, t);
    slerp(temp2, b, c, t);
    slerp(out, temp1, temp2, 2 * t * (1 - t));

    return out;
  };
}();

/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {vec3} view  the vector representing the viewing direction
 * @param {vec3} right the vector representing the local "right" direction
 * @param {vec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */
var setAxes = function () {
  var matr = create$2();

  return function (out, view, right, up) {
    matr[0] = right[0];
    matr[3] = right[1];
    matr[6] = right[2];

    matr[1] = up[0];
    matr[4] = up[1];
    matr[7] = up[2];

    matr[2] = -view[0];
    matr[5] = -view[1];
    matr[8] = -view[2];

    return normalize$2(out, fromMat3(out, matr));
  };
}();

/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
function create$8() {
  var out = new ARRAY_TYPE(2);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }
  return out;
}

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
var forEach$2 = function () {
  var vec = create$8();

  return function (a, stride, offset, count, fn, arg) {
    var i = void 0,
        l = void 0;
    if (!stride) {
      stride = 2;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];a[i + 1] = vec[1];
    }

    return a;
  };
}();

function jsToGl(array)
{
    let tensor = new ARRAY_TYPE(array.length);

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
        if (ignore && ignore.find(function(elem){return elem == k}) !== undefined)
        {
            continue; // skip
        }
        if (jsonObj[k] !== undefined)
        {
            target[k] = jsonObj[k];
        }
    }
}

function stringHash(str$$1, seed = 0)
{
    for(var i = 0; i < str$$1.length; ++i)
    {
        seed = Math.imul(31, seed) + str$$1.charCodeAt(i) | 0;
    }

    return seed;
}

function combineHashes(hash1, hash2)
{
    return hash1 ^ (hash1 + 0x9e3779b9 + (hash2 << 6) + (hash2 >> 2));
}

function clamp(number, min$$1, max$$1)
{
    return Math.min(Math.max(number, min$$1), max$$1);
}

function getIsGlb(filename)
{
    return getExtension(filename) == "glb";
}

function getIsGltf(filename)
{
    return getExtension(filename) == "gltf";
}

function getExtension(filename)
{
    const split = filename.toLowerCase().split(".");
    if (split.length == 1)
    {
        return undefined;
    }
    return split[split.length - 1];
}

function getFileName(filePath)
{
    const split = filePath.split("/");
    return split[split.length - 1];
}

function getFileNameWithoutExtension(filePath)
{
    return getFileName(filePath).split(".")[0];
}

function getContainingFolder(filePath)
{
    return filePath.substring(0, filePath.lastIndexOf("/") + 1);
}

function combinePaths()
{
    const parts = Array.from(arguments);
    return parts.join("/");
}

// marker interface used to for parsing the uniforms
class UniformStruct { }

class Timer
{
    constructor()
    {
        this.startTime = undefined;
        this.endTime = undefined;
        this.seconds = undefined;
    }

    start()
    {
        this.startTime = new Date().getTime() / 1000;
        this.endTime = undefined;
        this.seconds = undefined;
    }

    stop()
    {
        this.endTime = new Date().getTime() / 1000;
        this.seconds = this.endTime - this.startTime;
    }
}

class gltfAccessor
{
    constructor(bufferView = undefined, byteOffset = 0,
                componentType = undefined, normalized = false,
                count = undefined, type = undefined,
                max = undefined, min = undefined,
                sparse = undefined, name = undefined)
    {
        this.bufferView = bufferView;
        this.byteOffset = byteOffset;
        this.componentType = componentType;
        this.normalized = normalized;
        this.count = count;
        this.type = type;
        this.max = max;
        this.min = min;
        this.sparse = sparse;
        this.name = name;
        this.typedView = undefined;
        this.glBuffer = undefined;

        this.componentCount = new Map();
        this.componentCount.set("SCALAR", 1);
        this.componentCount.set("VEC2", 2);
        this.componentCount.set("VEC3", 3);
        this.componentCount.set("VEC4", 4);
        this.componentCount.set("MAT2", 4);
        this.componentCount.set("MAT3", 9);
        this.componentCount.set("MAT4", 16);
    }

    getComponentCount()
    {
        return this.componentCount.get(this.type);
    }

    getComponentSize()
    {
        switch (this.componentType)
        {
            case gl.BYTE:
            case gl.UNSIGNED_BYTE:
                return 1;
            case gl.SHORT:
            case gl.UNSIGNED_SHORT:
                return 2;
            case gl.UNSIGNED_INT:
            case gl.FLOAT:
                return 4;
            default:
                return 0;
        }
    }

    getTypedView(gltf)
    {
        if (this.typedView !== undefined)
        {
            return this.typedView;
        }

        if (this.bufferView !== undefined)
        {
            let bufferView = gltf.bufferViews[this.bufferView];
            let buffer = gltf.buffers[bufferView.buffer];
            let byteOffset = bufferView.byteOffset;

            let componentCount = this.getComponentCount();
            if (bufferView.byteStride != 0)
            {
                componentCount = bufferView.byteStride / this.getComponentSize();
            }

            let arrayOffsetLength = this.byteOffset / this.getComponentSize();
            let arrayLength = arrayOffsetLength + this.count * componentCount;

            switch (this.componentType)
            {
            case gl.BYTE:
                this.typedView = new Int8Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case gl.UNSIGNED_BYTE:
                this.typedView = new Uint8Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case gl.SHORT:
                this.typedView = new Int16Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case gl.UNSIGNED_SHORT:
                this.typedView = new Uint16Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case gl.UNSIGNED_INT:
                this.typedView = new Uint32Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case gl.FLOAT:
                this.typedView = new Float32Array(buffer.buffer, byteOffset, arrayLength);
                break;
            }
        }

        if (this.typedView === undefined)
        {
            console.warn("Failed to convert buffer view to typed view!: " + this.bufferView);
        }

        return this.typedView;
    }

    fromJson(jsonAccessor)
    {
        fromKeys(this, jsonAccessor);
    }

    destroy()
    {
        if (this.glBuffer !== undefined)
        {
            gl.deleteBuffer(this.glBuffer);
        }

        this.glBuffer = undefined;
    }
}

class gltfBuffer
{
    constructor(uri = undefined, byteLength = undefined, name = undefined)
    {
        this.uri = uri;
        this.byteLength = byteLength;
        this.name = name;
        this.buffer = undefined; // raw data blob
    }

    fromJson(jsonBuffer)
    {
        fromKeys(this, jsonBuffer);
    }

    load(gltf, additionalFiles = undefined)
    {
        if (this.buffer !== undefined)
        {
            console.error("buffer has already been loaded");
            return;
        }

        const self = this;
        return new Promise(function(resolve, reject)
        {
            if (!self.setBufferFromFiles(additionalFiles, resolve) &&
                !self.sefBufferFromUri(gltf, resolve))
            {
                console.error("Was not able to resolve buffer with uri '%s'", self.uri);
                resolve();
            }
        });
    }

    sefBufferFromUri(gltf, callback)
    {
        if (this.uri === undefined)
        {
            return false;
        }

        const self = this;
        axios.get(getContainingFolder(gltf.path) + this.uri, { responseType: 'arraybuffer'})
            .then(function(response)
            {
                self.buffer = response.data;
                callback();
            });
        return true;
    }

    setBufferFromFiles(files, callback)
    {
        if (this.uri === undefined || files === undefined)
        {
            return false;
        }

        let bufferFile;
        for (bufferFile of files)
        {
            if (bufferFile.name === this.uri)
            {
                break;
            }
        }

        if (bufferFile.name !== this.uri)
        {
            return false;
        }

        const self = this;
        const reader = new FileReader();
        reader.onloadend = function(event)
        {
            self.buffer = event.target.result;
            callback();
        };
        reader.readAsArrayBuffer(bufferFile);

        return true;
    }
}

class gltfBufferView
{
    constructor(buffer = undefined,
                byteOffset = 0, byteLength = undefined, byteStride = 0,
                target = undefined, name = undefined)
    {
        this.buffer = buffer;
        this.byteOffset = byteOffset;
        this.byteLength = byteLength;
        this.byteStride = byteStride;
        this.target = target;
        this.name = name;
    }

    fromJson(jsonBufferView)
    {
        fromKeys(this, jsonBufferView);
    }
}

class gltfCamera
{
    constructor(type = "perspective",
                znear = 0.01, zfar = 10000.0,
                yfov = 45.0 * Math.PI / 180.0,
                aspectRatio = 16.0 / 9.0,
                xmag = 1.0, ymag = 1.0,
                name = undefined,
                node = undefined)
    {
        this.type = type;
        this.znear = znear;
        this.zfar = zfar;
        this.yfov = yfov; // radians
        this.xmag = xmag;
        this.ymag = ymag;
        this.aspectRatio = aspectRatio;
        this.name = name;
        this.node = node;
    }

    clone()
    {
        return gltfCamera(this.type, this.znear, this.zfar, this.yfov, this.aspectRatio, this.xmag, this.ymag, this.name, this.node);
    }

    getProjectionMatrix()
    {
        let proj = create$3();

        if (this.type == "perspective")
        {
            perspective(proj, this.yfov, this.aspectRatio, this.znear, this.zfar);
        }
        else if (this.type == "orthographic")
        {
            proj[0]  = 1.0 / this.xmag;
            proj[5]  = 1.0 / this.ymag;
            proj[10] = 2.0 / (this.znear / this.zfar);
            proj[14] = (this.zfar + this.znear) / (this.znear - this.zfar);
        }

        return proj;
    }

    getViewMatrix(gltf)
    {
        if(this.node !== undefined && gltf !== undefined)
        {
            // TODO: Avoid depending on global variables.
            const node = gltf.nodes[currentCamera.node];
            return clone$3(node.worldTransform);
        }

        return create$3();
    }

    getPosition(gltf)
    {
        let pos = create$4();
        getTranslation(pos, this.getViewMatrix(gltf));
    }

    fromJson(jsonCamera)
    {
        this.name = name;
        if(jsonCamera.perspective !== undefined)
        {
            this.type = "perspective";
            fromKeys(this, jsonCamera.perspective);
        }
        else if(jsonCamera.orthographic !== undefined)
        {
            this.type = "orthographic";
            fromKeys(this, jsonCamera.orthographic);
        }
    }
}

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
      }      var ar = (m && m.match(/rgb9_e5/i)) ? new Uint8Array( floatToRgb9_e5(rgbeToFloat(HDRdata)).buffer ) : new Uint8Array(HDRdata.buffer);
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
  };
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

function m(a,b) { for (var i in b) a[i]=b[i]; return a; }
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
  };
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
  var r,g,b,maxColor,ExpShared,denom,l=(buffer.byteLength/12)|0, res=res||new Uint32Array(l);
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
  var one_over_gamma=1/gamma,l=(buffer.byteLength/12)|0, res=res||new Uint8ClampedArray(l*4);
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

const ImageMimeType = {JPEG: "image/jpeg", HDR: "image/vnd.radiance"};

class gltfImage
{
    constructor(uri = undefined, type = gl.TEXTURE_2D, miplevel = 0, bufferView = undefined, name = undefined, mimeType = ImageMimeType.JPEG, image = undefined)
    {
        this.uri = uri;
        this.bufferView = bufferView;
        this.mimeType = mimeType;
        this.image = image; // javascript image
        if (this.image !== undefined)
        {
            this.image.crossOrigin = "";
        }
        this.name = name;
        this.type = type; // nonstandard
        this.miplevel = miplevel; // nonstandard
    }

    fromJson(jsonImage, path = "")
    {
        fromKeys(this, jsonImage);

        if(this.uri !== undefined)
        {
            this.uri = path + this.uri;
        }
    }

    load(gltf, additionalFiles = undefined)
    {
        if (this.image !== undefined)
        {
            console.error("image has already been loaded");
            return;
        }

        this.image = this.mimeType === ImageMimeType.HDR ? new HDRImage() : new Image();
        this.image.crossOrigin = "";
        const self = this;
        const promise = new Promise(function(resolve, reject)
        {
            self.image.onload = resolve;
            self.image.onerror = resolve;

            if (!self.setImageFromBufferView(gltf) &&
                !self.setImageFromFiles(additionalFiles) &&
                !self.setImageFromUri())
            {
                console.error("Was not able to resolve image with uri '%s'", self.uri);
                resolve();
            }
        });

        return promise;
    }

    setImageFromUri()
    {
        if (this.uri === undefined)
        {
            return false;
        }

        this.image.src = this.uri;
        return true;
    }

    setImageFromBufferView(gltf)
    {
        const view = gltf.bufferViews[this.bufferView];
        if (view === undefined)
        {
            return false;
        }

        const buffer = gltf.buffers[view.buffer].buffer;
        const array = new Uint8Array(buffer, view.byteOffset, view.byteLength);
        const blob = new Blob([array], { "type": this.mimeType });
        this.image.src = URL.createObjectURL(blob);
        return true;
    }

    setImageFromFiles(files)
    {
        if (this.uri === undefined || files === undefined)
        {
            return false;
        }

        let bufferFile;
        for (bufferFile of files)
        {
            if (bufferFile.name === this.uri)
            {
                break;
            }
        }

        if (bufferFile.name !== this.uri)
        {
            return false;
        }

        const reader = new FileReader();
        const self = this;
        reader.onloadend = function(event)
        {
            self.image.src = event.target.result;
        };
        reader.readAsDataURL(bufferFile);

        return true;
    }
}

class gltfLight
{
    constructor(type = "directional",
                color = [1, 1, 1],
                intensity = 1,
                innerConeAngle = 0.0,
                outerConeAngle = Math.PI / 4.0,
                range = -1.0, // if no range is defined in the json, this is the default the shader understands
                name = undefined,
                node = undefined)
    {
        this.type = type;
        this.color = color;
        this.intensity = intensity;
        this.innerConeAngle = innerConeAngle;
        this.outerConeAngle = outerConeAngle;
        this.range = range;
        this.name = name;
        this.node = node; // non-standard
    }

    fromJson(jsonLight)
    {
        fromKeys(this, jsonLight);
    }

    toUniform(gltf)
    {
        let uLight = new UniformLight();

        if (this.node !== undefined)
        {
            let transform = gltf.nodes[this.node].worldTransform;
            let rotation = create$6();
            let alongNegativeZ = fromValues$4(0, 0, -1);
            getRotation(rotation, transform);
            transformQuat(uLight.direction, alongNegativeZ, rotation);
            getTranslation(uLight.position, transform);
        }

        uLight.range = this.range;
        uLight.color = jsToGl(this.color);
        uLight.intensity = this.intensity;

        uLight.innerConeCos = Math.cos(this.innerConeAngle);
        uLight.outerConeCos = Math.cos(this.outerConeAngle);

        switch(this.type)
        {
            case "spot":
                uLight.type = Type_Spot;
                break;
            case "point":
                uLight.type = Type_Point;
                break;
            case "directional":
            default:
                uLight.type = Type_Directional;
                break;
        }

        return uLight;
    }
}

const Type_Directional = 0;
const Type_Point = 1;
const Type_Spot = 2;

class UniformLight extends UniformStruct
{
    constructor()
    {
        super();

        const defaultDirection = fromValues$4(-0.7399, -0.6428, -0.1983);
        this.direction = defaultDirection;
        this.range = -1.0;

        this.color = jsToGl([1, 1, 1]);
        this.intensity = 1.0;

        this.position = jsToGl([0, 0, 0]);
        this.innerConeCos = 0.0;

        this.outerConeCos = Math.PI / 4.0;
        this.type = Type_Directional;
        this.padding = create$8();
    }
}

class gltfTexture
{
    constructor(sampler = undefined, source = undefined, type = gl.TEXTURE_2D, texture = undefined)
    {
        this.sampler = sampler; // index to gltfSampler, default sampler ?
        this.source = source; // index to gltfImage
        this.glTexture = texture; // gl texture
        this.initialized = false;
        this.type = type;
    }

    fromJson(jsonTexture, defaultSampler)
    {
        fromKeys(this, jsonTexture);

        if (this.sampler === undefined)
        {
            this.sampler = defaultSampler;
        }
    }

    destroy()
    {
        if (this.glTexture !== undefined)
        {
            gl.deleteTexture(this.glTexture);
        }

        this.glTexture = undefined;
    }
}
class gltfTextureInfo
{
    constructor(index = undefined, texCoord = 0, colorSpace = gl.RGBA, samplerName = "", generateMips = true) // linear by default
    {
        this.index = index; // reference to gltfTexture
        this.texCoord = texCoord; // which UV set to use
        this.colorSpace = colorSpace;
        this.samplerName = samplerName;
        this.strength = 1.0; // occlusion
        this.scale = 1.0; // normal
        this.generateMips = generateMips;

        this.extensions = undefined;
    }

    fromJson(jsonTextureInfo, samplerName, colorSpace = gl.RGBA)
    {
        fromKeys(this, jsonTextureInfo);

        this.colorSpace = colorSpace;
        this.samplerName = samplerName;
    }
}

class gltfMaterial
{
    constructor(emissiveFactor = jsToGl([0, 0, 0]), alphaMode = "OPAQUE", alphaCutoff = 0.5, doubleSided = false,
                baseColorFactor = jsToGl([1, 1, 1, 1]), metallicFactor = 1.0, roughnessFactor = 1.0, // Metallic-Roughness
                diffuseFactor = jsToGl([1, 1, 1, 1]), specularFactor = jsToGl([1, 1, 1]), glossinessFactor = 1.0, // Specular Glossiness
                name = undefined)
    {
        this.textures = []; // array of gltfTextureInfos
        this.emissiveFactor = emissiveFactor;
        this.alphaMode = alphaMode;
        this.alphaCutoff = alphaCutoff;
        this.doubleSided = doubleSided;
        this.name = name;
        this.type = "unlit";

        this.metallicFactor = metallicFactor;
        this.roughnessFactor = roughnessFactor;
        this.baseColorFactor = baseColorFactor;

        this.diffuseFactor = diffuseFactor;
        this.specularFactor = specularFactor;
        this.glossinessFactor = glossinessFactor;

        this.properties = new Map();
        this.defines = [];
    }

    static getDefaults()
    {
        let defaultMaterial = new gltfMaterial();
        defaultMaterial.type = "MR";
        defaultMaterial.name = "Default Material";
        defaultMaterial.properties.set("u_BaseColorFactor", defaultMaterial.baseColorFactor);
        defaultMaterial.properties.set("u_MetallicFactor", defaultMaterial.metallicFactor);
        defaultMaterial.properties.set("u_RoughnessFactor", defaultMaterial.roughnessFactor);
        return defaultMaterial;
    }

    getShaderIdentifier()
    {
        switch (this.type)
        {
            default:
            case "SG": // fall through till we sparate shaders
            case "MR": return "metallic-roughness.frag";
            //case "SG": return "specular-glossiness.frag" ;
        }
    }

    getDefines()
    {
        return this.defines;
    }

    getProperties()
    {
        return this.properties;
    }

    getTextures()
    {
        return this.textures;
    }

    parseTextureInfoExtensions(textureInfo, textureKey)
    {
        if(textureInfo.extensions === undefined)
        {
            return;
        }

        if(textureInfo.extensions.KHR_texture_transform !== undefined)
        {
            const uvTransform = textureInfo.extensions.KHR_texture_transform;

            // override uvset
            if(uvTransform.texCoord !== undefined)
            {
                textureInfo.texCoord = uvTransform.texCoord;
            }

            let rotation = create$2();
            let scale$$1 = create$2();
            let translation = create$2();

            if(uvTransform.rotation !== undefined)
            {
                const s =  Math.sin(uvTransform.rotation);
                const c =  Math.cos(uvTransform.rotation);

                rotation = jsToGl([
                    c, s, 0.0,
                    -s, c, 0.0,
                    0.0, 0.0, 1.0]);
            }

            if(uvTransform.scale !== undefined)
            {
                scale$$1 = jsToGl([uvTransform.scale[0],0,0, 0,uvTransform.scale[1],0, 0,0,1]);
            }

            if(uvTransform.offset !== undefined)
            {
                translation = jsToGl([1,0,uvTransform.offset[0], 0,1,uvTransform.offset[1], 0, 0, 1]);
            }

            let uvMatrix = create$2();
            multiply$2(uvMatrix, rotation, scale$$1);
            multiply$2(uvMatrix, uvMatrix, translation);

            this.defines.push("HAS_" + textureKey.toUpperCase() + "_UV_TRANSFORM 1");
            this.properties.set("u_" + textureKey + "UVTransform", uvMatrix);
        }
    }

    fromJson(jsonMaterial)
    {
        fromKeys(this, jsonMaterial);
        // i.e. alphaMode + alphaCutoff, doubleSided.

        if (jsonMaterial.emissiveFactor !== undefined)
        {
            this.emissiveFactor = jsToGl(jsonMaterial.emissiveFactor);
        }

        if (jsonMaterial.normalTexture !== undefined)
        {
            let normalTexture = new gltfTextureInfo();
            normalTexture.fromJson(jsonMaterial.normalTexture,"u_NormalSampler");
            this.parseTextureInfoExtensions(normalTexture, "Normal");
            this.textures.push(normalTexture);
            this.defines.push("HAS_NORMAL_MAP 1");
            this.properties.set("u_NormalScale", normalTexture.scale);
            this.properties.set("u_NormalUVSet", normalTexture.texCoord);
        }

        if (jsonMaterial.occlusionTexture !== undefined)
        {
            let occlusionTexture = new gltfTextureInfo();
            occlusionTexture.fromJson(jsonMaterial.occlusionTexture,"u_OcclusionSampler");
            this.parseTextureInfoExtensions(occlusionTexture, "Occlusion");
            this.textures.push(occlusionTexture);
            this.defines.push("HAS_OCCLUSION_MAP 1");
            this.properties.set("u_OcclusionStrength", occlusionTexture.strength);
            this.properties.set("u_OcclusionUVSet", occlusionTexture.texCoord);
        }

        if (jsonMaterial.emissiveTexture !== undefined)
        {
            let emissiveTexture = new gltfTextureInfo();
            emissiveTexture.fromJson(jsonMaterial.emissiveTexture,"u_EmissiveSampler");
            this.parseTextureInfoExtensions(emissiveTexture, "Emissive");
            this.textures.push(emissiveTexture);
            this.defines.push("HAS_EMISSIVE_MAP 1");
            this.properties.set("u_EmissiveFactor", this.emissiveFactor);
            this.properties.set("u_EmissiveUVSet", emissiveTexture.texCoord);
        }

        if(this.alphaMode === 'MASK') // only set cutoff value for mask material
        {
            this.defines.push("ALPHAMODE_MASK 1");
            this.properties.set("u_AlphaCutoff", this.alphaCutoff);
        }

        if(jsonMaterial.extensions !== undefined)
        {
            this.fromJsonMaterialExtensions(jsonMaterial.extensions);
        }

        // dont do MR if we parsed SG before
        if (jsonMaterial.pbrMetallicRoughness !== undefined && this.type != "SG")
        {
            this.type = "MR";
            this.fromJsonMetallicRoughness(jsonMaterial.pbrMetallicRoughness);
        }
    }

    fromJsonMaterialExtensions(jsonExtensions)
    {
        if (jsonExtensions.KHR_materials_pbrSpecularGlossiness !== undefined)
        {
            this.type = "SG";
            this.fromJsonSpecularGlossiness(jsonExtensions.KHR_materials_pbrSpecularGlossiness);
        }

        if(jsonExtensions.KHR_materials_unlit !== undefined)
        {
            this.type = "unlit";
            this.defines.push("MATERIAL_UNLIT 1");
        }
    }

    fromJsonMetallicRoughness(jsonMetallicRoughness)
    {
        this.defines.push("MATERIAL_METALLICROUGHNESS 1");

        if (jsonMetallicRoughness.baseColorFactor !== undefined)
        {
            this.baseColorFactor = jsToGl(jsonMetallicRoughness.baseColorFactor);
        }

        if (jsonMetallicRoughness.metallicFactor !== undefined)
        {
            this.metallicFactor = jsonMetallicRoughness.metallicFactor;
        }

        if (jsonMetallicRoughness.roughnessFactor !== undefined)
        {
            this.roughnessFactor = jsonMetallicRoughness.roughnessFactor;
        }

        this.properties.set("u_BaseColorFactor", this.baseColorFactor);
        this.properties.set("u_MetallicFactor", this.metallicFactor);
        this.properties.set("u_RoughnessFactor", this.roughnessFactor);

        if (jsonMetallicRoughness.baseColorTexture !== undefined)
        {
            let baseColorTexture = new gltfTextureInfo();
            baseColorTexture.fromJson(jsonMetallicRoughness.baseColorTexture, "u_BaseColorSampler");
            this.parseTextureInfoExtensions(baseColorTexture, "BaseColor");
            this.textures.push(baseColorTexture);
            this.defines.push("HAS_BASE_COLOR_MAP 1");
            this.properties.set("u_BaseColorUVSet", baseColorTexture.texCoord);
        }

        if (jsonMetallicRoughness.metallicRoughnessTexture !== undefined)
        {
            let metallicRoughnessTexture = new gltfTextureInfo();
            metallicRoughnessTexture.fromJson(jsonMetallicRoughness.metallicRoughnessTexture, "u_MetallicRoughnessSampler");
            this.parseTextureInfoExtensions(metallicRoughnessTexture, "MetallicRoughness");
            this.textures.push(metallicRoughnessTexture);
            this.defines.push("HAS_METALLIC_ROUGHNESS_MAP 1");
            this.properties.set("u_MetallicRoughnessUVSet", metallicRoughnessTexture.texCoord);
        }
    }

    fromJsonSpecularGlossiness(jsonSpecularGlossiness)
    {
        this.defines.push("MATERIAL_SPECULARGLOSSINESS 1");

        if (jsonSpecularGlossiness.diffuseFactor !== undefined)
        {
            this.diffuseFactor = jsToGl(jsonSpecularGlossiness.diffuseFactor);
        }

        if (jsonSpecularGlossiness.specularFactor !== undefined)
        {
            this.specularFactor = jsToGl(jsonSpecularGlossiness.specularFactor);
        }

        if (jsonSpecularGlossiness.glossinessFactor !== undefined)
        {
            this.glossinessFactor = jsonSpecularGlossiness.glossinessFactor;
        }

        this.properties.set("u_DiffuseFactor", this.diffuseFactor);
        this.properties.set("u_SpecularFactor", this.specularFactor);
        this.properties.set("u_GlossinessFactor", this.glossinessFactor);

        if (jsonSpecularGlossiness.diffuseTexture !== undefined)
        {
            let diffuseTexture = new gltfTextureInfo();
            diffuseTexture.fromJson(jsonSpecularGlossiness.diffuseTexture,"u_DiffuseSampler");
            this.parseTextureInfoExtensions(diffuseTexture, "Diffuse");
            this.textures.push(diffuseTexture);
            this.defines.push("HAS_DIFFUSE_MAP 1");
            this.properties.set("u_DiffuseUVSet", diffuseTexture.texCoord);
        }

        if (jsonSpecularGlossiness.specularGlossinessTexture !== undefined)
        {
            let specularGlossinessTexture = new gltfTextureInfo();
            specularGlossinessTexture.fromJson(jsonSpecularGlossiness.specularGlossinessTexture,"u_SpecularGlossinessSampler");
            this.parseTextureInfoExtensions(specularGlossinessTexture, "SpecularGlossiness");
            this.textures.push(specularGlossinessTexture);
            this.defines.push("HAS_SPECULAR_GLOSSINESS_MAP 1");
            this.properties.set("u_SpecularGlossinessUVSet", specularGlossinessTexture.texCoord);
        }
    }
}

class gltfPrimitive
{
    constructor(attributes = [], indices = undefined, material = undefined, mode = gl.TRIANGLES)
    {
        this.attributes = attributes;
        this.indices = indices;
        this.material = material;
        this.mode = mode;
        this.defines = [];
        this.skip = true;
    }

    fromJson(jsonPrimitive, defaultMaterial, gltf)
    {
        fromKeys(this, jsonPrimitive, ["attributes"]);

        // Use the default glTF material.
        if (this.material === undefined)
        {
            this.material = defaultMaterial;
        }

        // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
        for(let attrib of Object.keys(jsonPrimitive.attributes))
        {
            const idx = jsonPrimitive.attributes[attrib];
            switch (attrib) {
                case "POSITION":
                    this.skip = false;
                    this.attributes.push({attribute: attrib, name:"a_Position", accessor: idx});
                    break;
                case "NORMAL":
                    this.defines.push("HAS_NORMALS 1");
                    this.attributes.push({attribute: attrib, name:"a_Normal", accessor: idx});
                    break;
                case "TANGENT":
                    this.defines.push("HAS_TANGENTS 1");
                    this.attributes.push({attribute: attrib, name:"a_Tangent", accessor: idx});
                    break;
                case "TEXCOORD_0":
                    this.defines.push("HAS_UV_SET1 1");
                    this.attributes.push({attribute: attrib, name:"a_UV1", accessor: idx});
                    break;
                case "TEXCOORD_1":
                    this.defines.push("HAS_UV_SET2 1");
                    this.attributes.push({attribute: attrib, name:"a_UV2", accessor: idx});
                    break;
                case "COLOR_0":
                    {
                        const accessor = gltf.accessors[idx];
                        this.defines.push("HAS_VERTEX_COLOR_" + accessor.type + " 1");
                        this.attributes.push({attribute: attrib, name:"a_Color", accessor: idx});
                    }
                    break;
                case "JOINTS_0":
                    this.defines.push("HAS_JOINTS 1");
                    // TODO: implement when we do animations later
                    break;
                case "WEIGHTS_0":
                    this.defines.push("HAS_WEIGHTS 1");
                    // TODO: implement when we do animations later

                    break;
                default:
                    console.log("Unknown attrib: " + attrib);
            }
        }
    }

    getShaderIdentifier()
    {
        return "primitive.vert";
    }

    getDefines()
    {
        return this.defines;
    }
}

class gltfMesh
{
    constructor(primitives = [], name = undefined)
    {
        this.primitives = primitives;
        this.name = name;
    }

    fromJson(jsonMesh, defaultMaterial, gltf)
    {
        if (jsonMesh.name !== undefined)
        {
            this.name = jsonMesh.name;
        }

        for (let i = 0; i < jsonMesh.primitives.length; ++i)
        {
            let primitive = new gltfPrimitive();
            primitive.fromJson(jsonMesh.primitives[i], defaultMaterial, gltf);
            this.primitives.push(primitive);
        }
    }
}

// contain:
// transform
// child indices (reference to scene array of nodes)

class gltfNode
{
    //  vec3 translation, quat rotation, vec3 scale
    constructor(translation = jsToGl([0, 0, 0]),
                rotation = jsToGl([0, 0, 0, 1]),
                scale$$1 = jsToGl([1, 1, 1]),
                children = [],
                name = undefined)
    {
        this.translation = translation;
        this.rotation = rotation;
        this.scale = scale$$1;
        this.matrix = undefined;
        this.children = children;
        this.camera = undefined;
        this.name = name;

        // non-standard:
        this.worldTransform = create$3();
        this.inverseWorldTransform = create$3();
        this.normalMatrix = create$3();
        this.light = undefined;
        this.changed = true;
    }

    fromJson(jsonNode)
    {
        if (jsonNode.name !== undefined)
        {
            this.name = jsonNode.name;
        }

        if (jsonNode.children !== undefined)
        {
            this.children = jsonNode.children;
        }

        this.mesh = jsonNode.mesh;
        this.camera = jsonNode.camera;

        if (jsonNode.matrix !== undefined)
        {
            this.applyMatrix(jsonNode.matrix);
        }
        else
        {
            if (jsonNode.scale !== undefined)
            {
                this.scale = jsToGl(jsonNode.scale);
            }

            if (jsonNode.rotation !== undefined)
            {
                this.rotation = jsToGl(jsonNode.rotation);
            }

            if (jsonNode.translation !== undefined)
            {
                this.translation = jsToGl(jsonNode.translation);
            }
        }
        this.changed = true;
    }

    applyMatrix(matrixData)
    {
        this.matrix = jsToGl(matrixData);

        getScaling(this.scale, this.matrix);
        getRotation(this.rotation, this.matrix);
        getTranslation(this.translation, this.matrix);

        this.changed = true;
    }

    // vec3
    translate(translation)
    {
        this.translation = translation;
        this.changed = true;
    }

    // quat
    rotate(rotation)
    {
        this.rotation = rotation;
        this.changed = true;
    }

    // vec3
    scale(scale$$1)
    {
        this.scale = scale$$1;
        this.changed = true;
    }

    // TODO: WEIGHTS

    // local transform
    getTransform()
    {
        if(this.transform === undefined || this.changed)
        {
            if (this.matrix !== undefined)
            {
                this.transform = this.matrix;
            }
            else
            {
                this.transform = create$3();
                fromRotationTranslationScale(this.transform, this.rotation, this.translation, this.scale);
            }
            this.changed = false;
        }

        return clone$3(this.transform);
    }
}

class gltfSampler
{
    constructor(magFilter = gl.LINEAR, minFilter = gl.LINEAR_MIPMAP_LINEAR,
                wrapS = gl.REPEAT, wrapT = gl.REPEAT,
                name = undefined)
    {
        this.magFilter = magFilter;
        this.minFilter = minFilter;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
        this.name = name;
    }

    fromJson(jsonSampler)
    {
        fromKeys(this, jsonSampler);
    }
}

class gltfScene
{
    constructor(nodes = [], name = undefined)
    {
        this.nodes = nodes;
        this.name = name;
    }

    fromJson(jsonScene)
    {
        if (jsonScene.nodes !== undefined)
        {
            this.nodes = jsonScene.nodes;
        }

        this.name = jsonScene.name;
    }

    applyTransformHierarchy(gltf, rootTransform = create$3())
    {
        function applyTransform(gltf, node, parentTransform)
        {
            multiply$3(node.worldTransform, parentTransform, node.getTransform());
            invert$3(node.inverseWorldTransform, node.worldTransform);
            transpose$2(node.normalMatrix, node.inverseWorldTransform);

            for (let c of node.children)
            {
                applyTransform(gltf, gltf.nodes[c], node.worldTransform);
            }
        }

        for (let n of this.nodes)
        {
            applyTransform(gltf, gltf.nodes[n], rootTransform);
        }
    }

    // can only be called after gltf as been fully parsed and constructed
    getSceneWithAlphaMode(gltf, mode = 'OPAQUE', not = false)
    {
        let Nodes = [];
        function AddNode (nodeIndex)
        {
            let node = gltf.nodes[nodeIndex];
            let mesh = gltf.meshes[node.mesh];

            if (mesh !== undefined)
            {
                for (let primitive of mesh.primitives)
                {
                    if (primitive.skip === false)
                    {
                        const material = gltf.materials[primitive.material];
                        if (material !== undefined && (not ? material.alphaMode !== mode : material.alphaMode === mode))
                        {
                            Nodes.push(nodeIndex);
                        }
                    }
                }
            }

            // recurse into children
            for(let c of node.children)
            {
                AddNode(c);
            }
        }

        for (let n of this.nodes)
        {
            AddNode(n);
        }

        return new gltfScene(Nodes, this.name);
    }

    sortSceneByDepth(gltf, viewProjectionMatrix, rootTransform)
    {
        // vector of {abs position, nodeIndex}
        let posNodes = [];

        function AddPosNode (nodeIndex, parentTransform)
        {
            let node = gltf.nodes[nodeIndex];

            let transform = node.getTransform(); // local transform
            multiply$3(transform, parentTransform, transform);
            multiply$3(transform, viewProjectionMatrix, transform);

            let pos = jsToGl([0, 0, 0]); // world pos
            getTranslation(pos, transform);

            // TODO: we could clip objects behind the camera
            posNodes.push({depth: pos[2], idx: nodeIndex});

            // recurse into children
            for(let c of node.children)
            {
                AddNode(gltf.nodes[c], transform);
            }
        }

        for (let n of this.nodes)
        {
            AddPosNode(n, rootTransform);
        }

        // high z far from camera first
        posNodes.sort(function(a,b) {return a.depth - b.depth});

        this.nodes = [];
        for(let node of posNodes)
        {
            this.nodes.push(node.idx);
        }
    }

    includesNode(gltf, nodeIndex)
    {
        let children = [...this.nodes];
        while(children.length > 0)
        {
            const childIndex = children.pop();

            if (childIndex === nodeIndex)
            {
                return true;
            }

            children = children.concat(gltf.nodes[childIndex].children);
        }

        return false;
    }
}

class glTF
{
    constructor(file)
    {
        this.accessors = [];
        this.nodes = [];
        this.scene = undefined; // the default scene to show.
        this.scenes = [];
        this.cameras = [];
        this.lights = [];
        this.textures = [];
        this.images = [];
        this.samplers = [];
        this.meshes = [];
        this.buffers = [];
        this.bufferViews = [];
        this.materials = [];
        this.defaultMaterial = -1;
        this.defaultSampler  = -1;
        this.cubemapSampler  = -1;
        this.path = file;
    }

    fromJsonNodes(jsonNodes)
    {
        for (let i = 0; i < jsonNodes.length; ++i)
        {
            const jsonNode = jsonNodes[i];
            let node = new gltfNode();
            node.fromJson(jsonNode);
            this.nodes.push(node);

            // assign the corresponding camera node
            if(node.camera !== undefined)
            {
                this.cameras[node.camera].node = i;
            }

            if(jsonNode.extensions !== undefined)
            {
                if (jsonNode.extensions.KHR_lights_punctual !== undefined)
                {
                    this.lights[jsonNode.extensions.KHR_lights_punctual.light].node = i;
                }
            }
        }
    }

    fromJsonCameras(jsonCameras)
    {
        for (let i = 0; i < jsonCameras.length; ++i)
        {
            let camera = new gltfCamera();
            camera.fromJson(jsonCameras[i]);
            this.cameras.push(camera);
        }
    }

    // pass extenstions.KHR_lights_punctual.lights to this
    fromJsonLights(jsonLights)
    {
        for (let i = 0; i < jsonLights.length; ++i)
        {
            let light = new gltfLight();
            light.fromJson(jsonLights[i]);
            this.lights.push(light);
        }
    }

    fromJsonMeshes(jsonMeshes)
    {
        for (let i = 0; i < jsonMeshes.length; ++i)
        {
            let mesh = new gltfMesh();
            mesh.fromJson(jsonMeshes[i], this.defaultMaterial, this);
            this.meshes.push(mesh);
        }
    }

    fromJsonSamplers(jsonSamplers)
    {
        for (let i = 0; i < jsonSamplers.length; ++i)
        {
            let sampler = new gltfSampler();
            sampler.fromJson(jsonSamplers[i]);
            this.samplers.push(sampler);
        }
    }

    fromJsonImages(jsonImages)
    {
        for (let i = 0; i < jsonImages.length; ++i)
        {
            let image = new gltfImage();
            image.fromJson(jsonImages[i], getContainingFolder(this.path));
            this.images.push(image);
        }
    }

    fromJsonTextures(jsonTextures)
    {
        for (let i = 0; i < jsonTextures.length; ++i)
        {
            let texture = new gltfTexture();
            texture.fromJson(jsonTextures[i], this.defaultSampler);
            this.textures.push(texture);
        }
    }

    fromJsonBuffers(jsonBuffers)
    {
        for (let i = 0; i < jsonBuffers.length; ++i)
        {
            let buffer = new gltfBuffer();
            buffer.fromJson(jsonBuffers[i]);
            this.buffers.push(buffer);
        }
    }

    fromJsonBufferViews(jsonBufferViews)
    {
        for (let i = 0; i < jsonBufferViews.length; ++i)
        {
            let bufferView = new gltfBufferView();
            bufferView.fromJson(jsonBufferViews[i]);
            this.bufferViews.push(bufferView);
        }
    }

    fromJsonAccessors(jsonAccessors)
    {
        for (let i = 0; i < jsonAccessors.length; ++i)
        {
            let accessor = new gltfAccessor();
            accessor.fromJson(jsonAccessors[i]);
            this.accessors.push(accessor);
        }
    }

    fromJsonScenes(jsonScenes)
    {
        for (let i = 0; i < jsonScenes.length; ++i)
        {
            let scene = new gltfScene();
            scene.fromJson(jsonScenes[i]);
            this.scenes.push(scene);
        }
    }

    fromJsonMaterials(jsonMaterials)
    {
        for (let i = 0; i < jsonMaterials.length; ++i)
        {
            let material = new gltfMaterial();
            material.fromJson(jsonMaterials[i]);
            this.materials.push(material);
        }
    }

    fromJson(json)
    {
        if(json.cameras !== undefined)
        {
            this.fromJsonCameras(json.cameras);
        }

        if(json.extensions !== undefined)
        {
            if(json.extensions.KHR_lights_punctual !== undefined)
            {
                if(json.extensions.KHR_lights_punctual.lights !== undefined)
                {
                    this.fromJsonLights(json.extensions.KHR_lights_punctual.lights);
                }
            }
        }

        if(json.nodes !== undefined)
        {
            this.fromJsonNodes(json.nodes);
        }

        if (json.materials !== undefined)
        {
            this.fromJsonMaterials(json.materials);
        }

        this.materials.push(gltfMaterial.getDefaults());
        this.defaultMaterial = this.materials.length - 1;

        if (json.accessors !== undefined)
        {
            this.fromJsonAccessors(json.accessors);
        }

        if (json.meshes !== undefined)
        {
            this.fromJsonMeshes(json.meshes);
        }

        if(json.samplers !== undefined)
        {
            this.fromJsonSamplers(json.samplers);
        }

        this.samplers.push(new gltfSampler());
        this.defaultSampler = this.samplers.length - 1;

        if(json.textures !== undefined)
        {
            this.fromJsonTextures(json.textures);
        }

        if(json.images !== undefined)
        {
            this.fromJsonImages(json.images);
        }

        if(json.buffers !== undefined)
        {
            this.fromJsonBuffers(json.buffers);
        }

        if(json.bufferViews !== undefined)
        {
            this.fromJsonBufferViews(json.bufferViews);
        }

        // Load the default scene too.
        if (json.scenes !== undefined)
        {
            if (json.scene === undefined && json.scenes.length > 0)
            {
                this.scene = 0;
            }
            else
            {
                this.scene = json.scene;
            }
        }

        if (json.scenes !== undefined)
        {
            this.fromJsonScenes(json.scenes);
        }
    }
}

class gltfLoader
{
    static load(gltf, appendix = undefined)
    {
        let buffers;
        let additionalFiles;
        if (appendix && appendix.length > 0)
        {
            if (appendix[0] instanceof ArrayBuffer)
            {
                buffers = appendix;
            }
            else if (appendix[0] instanceof File)
            {
                additionalFiles = appendix;
            }
        }

        let promises = [];

        if (buffers)
        {
            const count = Math.min(buffers.length, gltf.buffers.length);
            for (let i = 0; i < count; ++i)
            {
                gltf.buffers[i].buffer = buffers[i];
            }
        }
        else
        {
            for (const buffer of gltf.buffers)
            {
                promises.push(buffer.load(gltf, additionalFiles));
            }
        }

        for (let image of gltf.images)
        {
            promises.push(image.load(gltf, additionalFiles));
        }

        return promises;
    }

    static unload(gltf)
    {
        for (let image of gltf.images)
        {
            image.image = undefined;
        }
        gltf.images = [];

        for (let texture of gltf.textures)
        {
            texture.destroy();
        }
        gltf.textures = [];

        for (let accessor of gltf.accessors)
        {
            accessor.destroy();
        }
        gltf.accessors = [];
    }
}

class gltfModelPathProvider
{
    constructor(modelIndexerPath, ignoredVariants = ["glTF-Draco", "glTF-Embedded"])
    {
        this.modelIndexerPath = modelIndexerPath;
        this.ignoredVariants = ignoredVariants;
        this.modelsDictionary = undefined;
    }

    initialize()
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

                const fileName = entry.variants[variant];
                const modelPath = combinePaths(modelsFolder, entry.name, variant, fileName);
                let modelKey = getFileNameWithoutExtension(fileName);
                if (variant !== "glTF")
                {
                    modelKey += " (" + variant.replace("glTF-", "") + ")";
                }
                this.modelsDictionary[modelKey] = modelPath;
            }
        }
    }
}

class gltfShader
{
    constructor(program, hash)
    {
        this.program = program;
        this.hash = hash;
        this.uniforms = new Map();
        this.attributes = new Map();

        if(this.program !== undefined)
        {
            const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
            for(let i = 0; i < uniformCount; ++i)
            {
                const info = gl.getActiveUniform(this.program, i);
                const loc = gl.getUniformLocation(this.program, info.name);
                this.uniforms.set(info.name, {type: info.type, loc: loc});
            }

            const attribCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
            for(let i = 0; i < attribCount; ++i)
            {
                const info = gl.getActiveAttrib(this.program, i);
                const loc = gl.getAttribLocation(this.program, info.name);
                this.attributes.set(info.name, loc);
            }
        }
    }

    destroy()
    {
        if (this.program !== undefined)
        {
            this.deleteProgram(this.program);
        }

        this.program = undefined;
    }

    getAttribLocation(name)
    {
        const loc = this.attributes.get(name);

        if(loc !== undefined)
        {
            return loc;
        }
        else
        {
            console.log("Attribute name '" + name + "' doesn't exist!");
            return -1;
        }
    }

    getUniformLocation(name)
    {
        const uniform = this.uniforms.get(name);

        if(uniform !== undefined)
        {
            return uniform.loc;
        }
        else
        {
            console.log("Uniform name '" + name + "' doesn't exist!");
            return -1;
        }
    }


    updateUniform(objectName, object, log = true)
    {
        if (Array.isArray(object))
        {
            this.updateUniformArray(objectName, object, log);
        }
        else if (object instanceof UniformStruct)
        {
            this.updateUniformStruct(objectName, object, log);
        }
        else
        {
            this.updateUniformValue(objectName, object, log);
        }
    }

    updateUniformArray(arrayName, array, log)
    {
        for (let i = 0; i < array.length; ++i)
        {
            let element = array[i];
            let uniformName = arrayName + "[" + i + "]";
            this.updateUniform(uniformName, element, log);
        }
    }

    updateUniformStruct(structName, object, log)
    {
        let memberNames = Object.keys(object);
        for (let memberName of memberNames)
        {
            let uniformName = structName + "." + memberName;
            this.updateUniform(uniformName, object[memberName], log);
        }
    }

    // upload the values of a uniform with the given name using type resolve to get correct function call
    // vec3 => gl.uniform3f(value)
    updateUniformValue(uniformName, value, log)
    {
        const uniform = this.uniforms.get(uniformName);

        if(uniform !== undefined)
        {
            switch (uniform.type) {
                case gl.FLOAT: gl.uniform1f(uniform.loc, value); break;
                case gl.FLOAT_VEC2: gl.uniform2fv(uniform.loc, value); break;
                case gl.FLOAT_VEC3: gl.uniform3fv(uniform.loc, value); break;
                case gl.FLOAT_VEC4: gl.uniform4fv(uniform.loc, value); break;

                case gl.INT: gl.uniform1i(uniform.loc, value); break;
                case gl.INT_VEC2: gl.uniform2iv(uniform.loc, value); break;
                case gl.INT_VEC3: gl.uniform3iv(uniform.loc, value); break;
                case gl.INT_VEC4: gl.uniform4iv(uniform.loc, value); break;

                case gl.FLOAT_MAT2: gl.uniformMatrix2fv(uniform.loc, false, value); break;
                case gl.FLOAT_MAT3: gl.uniformMatrix3fv(uniform.loc, false, value); break;
                case gl.FLOAT_MAT4: gl.uniformMatrix4fv(uniform.loc, false, value); break;
            }
        }
        else if(log)
        {
            console.warn("Unkown uniform: " + uniformName);
        }
    }
}

function LoadWebGLExtensions(webglExtensions)
{
    for (let extension of webglExtensions)
    {
        if(gl.getExtension(extension) === null)
        {
            console.warn("Extension " + extension + " not supported!");
        }
    }

    let EXT_texture_filter_anisotropic = gl.getExtension("EXT_texture_filter_anisotropic");

    if (EXT_texture_filter_anisotropic)
    {
        gl.anisotropy = EXT_texture_filter_anisotropic.TEXTURE_MAX_ANISOTROPY_EXT;
        gl.maxAnisotropy = gl.getParameter(EXT_texture_filter_anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        gl.supports_EXT_texture_filter_anisotropic = true;
    }
    else
    {
        gl.supports_EXT_texture_filter_anisotropic = false;
    }
}

//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
function SetSampler(gltfSamplerObj, type, rectangleImage) // TEXTURE_2D
{
	if (rectangleImage)
	{
		gl.texParameteri(type, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(type, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
	else
	{
		gl.texParameteri(type, gl.TEXTURE_WRAP_S, gltfSamplerObj.wrapS);
		gl.texParameteri(type, gl.TEXTURE_WRAP_T, gltfSamplerObj.wrapT);
	}

    // Rectangle images are not mip-mapped, so force to non-mip-mapped sampler.
    if (rectangleImage && (gltfSamplerObj.minFilter != gl.NEAREST) && (gltfSamplerObj.minFilter != gl.LINEAR))
    {
        if ((gltfSamplerObj.minFilter == gl.NEAREST_MIPMAP_NEAREST) || (gltfSamplerObj.minFilter == gl.NEAREST_MIPMAP_LINEAR))
    	{
    		gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    	}
    	else
    	{
    		gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    	}
    }
    else
    {
    	gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gltfSamplerObj.minFilter);
    }
    gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, gltfSamplerObj.magFilter);
    
    if (gl.supports_EXT_texture_filter_anisotropic)
    {
        gl.texParameterf(type, gl.anisotropy, gl.maxAnisotropy); // => 16xAF
    }
}

function SetTexture(loc, gltf, textureInfo, texSlot)
{
    if(loc == -1)
    {
        return false;
    }

    let gltfTex = gltf.textures[textureInfo.index];

    if(gltfTex === undefined)
    {
        console.warn("Texture is undefined: " + textureInfo.index);
        return false;
    }

    if(gltfTex.glTexture === undefined)
    {
        gltfTex.glTexture = gl.createTexture();
    }

    gl.activeTexture(gl.TEXTURE0 + texSlot);
    gl.bindTexture(gltfTex.type, gltfTex.glTexture);

    gl.uniform1i(loc, texSlot);

    if(!gltfTex.initialized)
    {
        const gltfSampler = gltf.samplers[gltfTex.sampler];

        if(gltfSampler === undefined)
        {
            console.warn("Sampler is undefined for texture: " + textureInfo.index);
            return false;
        }

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        let images = [];

        if(gltfTex.source.length !== undefined)
        {
            // assume we have an array of textures (this is an unofficial extension to what glTF json can represent)
            images = gltfTex.source;
        }
        else
        {
            images = [gltfTex.source];
        }

        let generateMips = true;
        let rectangleImage = false;

        for(const src of images)
        {
            const image =  gltf.images[src];

            if (image === undefined)
            {
                console.warn("Image is undefined for texture: " + gltfTex.source);
                return false;
            }

            if (image.image.dataRGBE !== undefined)
            {
                gl.texImage2D(image.type, image.miplevel, gl.RGB, image.image.width, image.image.height, 0, gl.RGB, gl.FLOAT, image.image.dataFloat);
                generateMips = false;
            }
            else
            {
                gl.texImage2D(image.type, image.miplevel, textureInfo.colorSpace, textureInfo.colorSpace, gl.UNSIGNED_BYTE, image.image);
            }

            if (image.image.width != image.image.height)
            {
            	rectangleImage = true;
            	generateMips = false;
            }
        }
        
        SetSampler(gltfSampler, gltfTex.type, rectangleImage);

        if (textureInfo.generateMips && generateMips)
        {
            // Until this point, images can be assumed to be power of two.
            switch (gltfSampler.minFilter) {
                case gl.NEAREST_MIPMAP_NEAREST:
                case gl.NEAREST_MIPMAP_LINEAR:
                case gl.LINEAR_MIPMAP_NEAREST:
                case gl.LINEAR_MIPMAP_LINEAR:
                    gl.generateMipmap(gltfTex.type);
                    break;
                default:
                    break;
            }
        }
        
        
        // Release the complete image buffer after usage.
        gl.finish();
        for(const src of images)
        {
        	gltf.images[src].image = undefined;
        }

        gltfTex.initialized = true;
    }

    return gltfTex.initialized;
}

function SetIndices(gltf, accessorIndex)
{
    let gltfAccessor = gltf.accessors[accessorIndex];

    if (gltfAccessor.glBuffer === undefined)
    {
        gltfAccessor.glBuffer = gl.createBuffer();

        let data = gltfAccessor.getTypedView(gltf);

        if (data === undefined)
        {
            return false;
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gltfAccessor.glBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    }
    else
    {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gltfAccessor.glBuffer);
    }

    return true;
}

function EnableAttribute(gltf, attributeLocation, gltfAccessor)
{
    if(attributeLocation == -1)
    {
        return false;
    }

    let gltfBufferView = gltf.bufferViews[gltfAccessor.bufferView];

    if (gltfAccessor.glBuffer === undefined)
    {
        gltfAccessor.glBuffer = gl.createBuffer();

        let data = gltfAccessor.getTypedView(gltf);

        if (data === undefined)
        {
            return false;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, gltfAccessor.glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    }
    else
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, gltfAccessor.glBuffer);
    }

    gl.vertexAttribPointer(attributeLocation, gltfAccessor.getComponentCount(), gltfAccessor.componentType,
                           gltfAccessor.normalized, gltfBufferView.byteStride, gltfAccessor.byteOffset);
    gl.enableVertexAttribArray(attributeLocation);

    return true;
}

function CompileShader(isVert, shaderSource)
{
    let shader = gl.createShader(isVert ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (!compiled) {

        console.warn(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function LinkProgram(vertex, fragment)
{
    let program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    return program;
}

// THis class generates and caches the shader source text for a given permutation
class ShaderCache
{
    constructor(shaderFolder, shaderFiles)
    {
        this.shaders  = new Map(); // name & permutations hashed -> compiled shader
        this.sources  = new Map();        this.programs = new Map(); // (vertex shader, fragment shader) -> program
        this.loaded   = false;

        let self = this;
        let loadPromises = [];
        for (let file of shaderFiles)
        {
            const url = shaderFolder + file;
            loadPromises.push(axios.get(url, { responseType: 'text' }));
        }

        Promise.all(loadPromises).then(function (responseArray) {
            for (let fileIdx in shaderFiles)
            {
                let name = shaderFiles[fileIdx];
                let response = responseArray[fileIdx];
                self.sources.set(name, response.data);
            }

            // TODO: remove any // or /* style comments

            // resovle / expande sources (TODO: break include cycles)
            for (let [key, src] of self.sources)
            {
                let changed = false;
                for (let includeName of shaderFiles)
                {
                    //var pattern = RegExp(/#include</ + includeName + />/);
                    const pattern = "#include <" + includeName + ">";

                    if(src.includes(pattern))
                    {
                        // only replace the first occurance
                        src = src.replace(pattern, self.sources.get(includeName));

                        // remove the others
                        while (src.includes(pattern)) {
                            src = src.replace(pattern, "");
                        }

                        changed = true;
                    }
                }

                if(changed)
                {
                    self.sources.set(key, src);
                }
            }

            self.loaded = true;
        })
        .catch(function(err) {
            console.log(err);
        });

    }

    destroy()
    {
        for (let [identifier, shader] of this.shaders.entries())
        {
            gl.deleteShader(shader);
            shader = undefined;
        }

        this.shaders.clear();

        for (let [shader_hash, program] of this.programs)
        {
            program.destroy();
        }

        this.programs.clear();
    }

    // example args: "pbr.vert", ["NORMALS", "TANGENTS"]
    selectShader(shaderIdentifier, permutationDefines)
    {
        // first check shaders for the exact permutation
        // if not present, check sources and compile it
        // if not present, return null object

        const src = this.sources.get(shaderIdentifier);
        if(src === undefined)
        {
            if(this.loaded)
            {
                console.log("Shader source for " + shaderIdentifier + " not found");
            }
            return null;
        }

        const isVert = shaderIdentifier.endsWith(".vert");
        let hash = stringHash(shaderIdentifier);

        // console.log(shaderIdentifier);

        let defines = "";
        for(let define of permutationDefines)
        {
            // console.log(define);
            hash ^= stringHash(define);
            defines += "#define " + define + "\n";
        }

        let shader = this.shaders.get(hash);

        if(shader === undefined)
        {
            // console.log(defines);
            // compile this variant
            shader = CompileShader(isVert, defines + src);
            if(shader)
            {
                this.shaders.set(hash, shader);
            }
            else
            {
                console.log(shaderIdentifier + " compilation failed!");
                return undefined;
            }
        }

        return hash;
    }

    getShaderProgram(vertexShaderHash, fragmentShaderHash)
    {
        const hash = combineHashes(vertexShaderHash, fragmentShaderHash);

        let program = this.programs.get(hash);

        if (program) // program already linked
        {
            return program;
        }
        else // link this shader program type!
        {
            let linkedProg = LinkProgram(this.shaders.get(vertexShaderHash), this.shaders.get(fragmentShaderHash));
            if(linkedProg)
            {
                let program = new gltfShader(linkedProg, hash);
                this.programs.set(hash, program);
                return program;
            }
        }

        return undefined;
    }
}

const ToneMaps =
{
    LINEAR: "Linear" ,
    UNCHARTED: "Uncharted 2" ,
    HEJL_RICHARD: "Hejl Richard"
};

const DebugOutput =
{
    NONE: "None",
    METALLIC: "Metallic",
    ROUGHNESS: "Roughness",
    NORMAL: "Normal",
    BASECOLOR: "Base Color",
    OCCLUSION: "Occlusion",
    EMISIVE: "Emissive",
    ALPHA: "Alpha",
    F0: "F0"
};

const Environments =
[
    "papermill",
    "field",
    "doge2"
];

const EnvironmentsMipLevel =
[
    9,
    10,
    10
];

class gltfRenderingParameters
{
    constructor(
        environment = undefined,
        useIBL = true,
        usePunctual = false,
        useHdr = true,
        exposure = 1.0,
        gamma = 2.2,
        clearColor = [51, 51, 51],
        toneMap = ToneMaps.LINEAR,
        debugOutput = DebugOutput.NONE)
    {
        this.useIBL = useIBL;
        this.usePunctual = usePunctual;
        this.useHdr = useHdr;
        this.exposure = exposure;
        this.gamma = gamma;
        this.clearColor = clearColor;
        this.toneMap = toneMap;
        this.debugOutput = debugOutput;

        this.updateEnvironment(environment);

        const OES_texture_float = gl.getExtension("OES_texture_float");
        const OES_texture_float_linear = gl.getExtension("OES_texture_float_linear");
        if ((!OES_texture_float || !OES_texture_float_linear) && this.useHdr)
        {
            this.useHdr = false;
            console.warn("Forcing to LDR rendering.");
        }
    }

    updateEnvironment(environment)
    {
        if (Environments.includes(environment))
        {
            this.environment = environment;
            this.environmentMipLevel = EnvironmentsMipLevel[Environments.indexOf(environment)];
        }
        else
        {
            console.warn("Environment '%s' is not supported.", environment);
            this.environment = Environments[0];
            this.environmentMipLevel = EnvironmentsMipLevel[0];
        }
    }
}

class gltfRenderer
{
    constructor(canvas, defaultCamera, parameters, basePath)
    {
        this.canvas = canvas;
        this.defaultCamera = defaultCamera;
        this.parameters = parameters;
        this.basePath = basePath;
        this.shader = undefined; // current shader

        this.currentWidth  = 0;
        this.currentHeight = 0;

        this.shaderCache = new ShaderCache(basePath + "src/shaders/", [
            "primitive.vert",
            "metallic-roughness.frag",
            "tonemapping.glsl",
            "textures.glsl"
        ]);

        let requiredWebglExtensions = [
            "EXT_shader_texture_lod",
            "OES_standard_derivatives",
            "OES_element_index_uint",
            "EXT_texture_filter_anisotropic",
            "OES_texture_float",
            "OES_texture_float_linear"
        ];

        LoadWebGLExtensions(requiredWebglExtensions);

        this.visibleLights = [];

        this.viewMatrix = create$3();
        this.projMatrix = create$3();
        this.viewProjectionMatrix = create$3();

        this.currentCameraPosition = create$4();

        this.init();
        this.resize(canvas.canvasWidth, canvas.canvasHeight);
    }

    /////////////////////////////////////////////////////////////////////
    // Render glTF scene graph
    /////////////////////////////////////////////////////////////////////

    // app state
    init()
    {
        //TODO: To achieve correct rendering, WebGL runtimes must disable such conversions by setting UNPACK_COLORSPACE_CONVERSION_WEBGL flag to NONE
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.colorMask(true, true, true, true);
        gl.clearDepth(1.0);
    }

    resize(width, height)
    {
        if (this.currentWidth !== width || this.currentHeight !== height)
        {
            this.canvas.width  = width;
            this.canvas.height = height;
            this.currentHeight = height;
            this.currentWidth  = width;
            gl.viewport(0, 0, width, height);
        }
    }

    // frame state
    newFrame()
    {
        gl.clearColor(this.parameters.clearColor[0] / 255.0, this.parameters.clearColor[1] / 255.0, this.parameters.clearColor[2]  / 255.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    // render complete gltf scene with given camera
    drawScene(gltf, scene, cameraIndex, sortByDepth, scaleFactor)
    {
        let currentCamera = undefined;

        if(cameraIndex !== -1)
        {
            currentCamera = gltf.cameras[cameraIndex].clone();
        }
        else
        {
            currentCamera = this.defaultCamera;
        }

        currentCamera.aspectRatio = this.currentWidth / this.currentHeight;

        this.projMatrix = currentCamera.getProjectionMatrix();
        this.viewMatrix = currentCamera.getViewMatrix(gltf);
        this.currentCameraPosition = currentCamera.getPosition(gltf);

        this.visibleLights = this.getVisibleLights(gltf, scene);

        multiply$3(this.viewProjectionMatrix, this.projMatrix, this.viewMatrix);

        // Optional: pass a scene transfrom to be able to translate & rotate using the mouse

        let transform = create$3();

        if(sortByDepth)
        {
            scene.sortSceneByDepth(gltf, this.viewProjectionMatrix, transform);
        }

        let scaleMatrix = create$3();
        let scaleVector = fromValues$4(scaleFactor, scaleFactor, scaleFactor);
        fromScaling$3(scaleMatrix, scaleVector);

        let nodeIndices = scene.nodes.slice();
        while (nodeIndices.length > 0)
        {
            const nodeIndex = nodeIndices.pop();
            const node = gltf.nodes[nodeIndex];
            this.drawNode(gltf, node, scaleMatrix);
            nodeIndices = nodeIndices.concat(node.children);
        }
    }

    // returns all lights that are relevant for rendering or the default light if there are none
    getVisibleLights(gltf, scene)
    {
        let lights = [];
        for (let light of gltf.lights)
        {
            if (light.node !== undefined)
            {
                if (scene.includesNode(gltf, light.node))
                {
                    lights.push(light);
                }
            }
        }
        return lights.length > 0 ? lights : [ new gltfLight() ];
    }

    // same transform, recursive
    drawNode(gltf, node, scaleMatrix)
    {
        // draw primitive:
        let mesh = gltf.meshes[node.mesh];
        if (mesh !== undefined)
        {
            for (let primitive of mesh.primitives)
            {
                this.drawPrimitive(gltf, primitive, node.worldTransform, this.viewProjectionMatrix, node.normalMatrix, scaleMatrix);
            }
        }
    }

    // vertices with given material
    drawPrimitive(gltf, primitive, modelMatrix, viewProjectionMatrix, normalMatrix, scaleMatrix)
    {
        if (primitive.skip) return;

        const material = gltf.materials[primitive.material];

        //select shader permutation, compile and link program.

        let fragDefines = material.getDefines().concat(primitive.getDefines());
        this.pushParameterDefines(fragDefines);

        const fragmentHash = this.shaderCache.selectShader(material.getShaderIdentifier(), fragDefines);
        const vertexHash  = this.shaderCache.selectShader(primitive.getShaderIdentifier(), primitive.getDefines());

        if (fragmentHash && vertexHash)
        {
            this.shader = this.shaderCache.getShaderProgram(fragmentHash, vertexHash);
        }

        if (this.shader === undefined)
        {
            return;
        }

        gl.useProgram(this.shader.program);

        if (this.parameters.usePunctual)
        {
            this.applyLights(gltf);
        }

        // update model dependant matrices once per node
        this.shader.updateUniform("u_ViewProjectionMatrix", viewProjectionMatrix);
        this.shader.updateUniform("u_ModelMatrix", modelMatrix);
        this.shader.updateUniform("u_NormalMatrix", normalMatrix, false);
        this.shader.updateUniform("u_ScaleMatrix", scaleMatrix, false);
        this.shader.updateUniform("u_Gamma", this.parameters.gamma, false);
        this.shader.updateUniform("u_Exposure", this.parameters.exposure, false);
        this.shader.updateUniform("u_Camera", this.currentCameraPosition, false);

        if (material.doubleSided)
        {
            gl.disable(gl.CULL_FACE);
        }
        else
        {
            gl.enable(gl.CULL_FACE);
        }

        if(material.alphaMode === 'BLEND')
        {
            gl.enable(gl.BLEND);
            //gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // non pre mult alpha
            gl.blendEquation(gl.FUNC_ADD);

            // pre multiplied alpha
            // gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        }
        else
        {
            gl.disable(gl.BLEND);
        }

        const drawIndexed = primitive.indices !== undefined;
        if (drawIndexed)
        {
            if (!SetIndices(gltf, primitive.indices))
            {
                return;
            }
        }

        let vertexCount = 0;
        for (let attrib of primitive.attributes)
        {
            let gltfAccessor = gltf.accessors[attrib.accessor];
            vertexCount = gltfAccessor.count;

            if (!EnableAttribute(gltf, this.shader.getAttribLocation(attrib.name), gltfAccessor))
            {
                return; // skip this primitive.
            }
        }

        for(let [uniform, val] of material.getProperties().entries())
        {
            this.shader.updateUniform(uniform, val);
        }

        for(let i = 0; i < material.textures.length; ++i)
        {
            let info = material.textures[i];
            if (!SetTexture(this.shader.getUniformLocation(info.samplerName), gltf, info, i)) // binds texture and sampler
            {
                return;
            }
        }

        if (this.parameters.useIBL)
        {
            this.applyEnvironmentMap(gltf, material.textures.length);
        }

        if (drawIndexed)
        {
            let indexAccessor = gltf.accessors[primitive.indices];
            gl.drawElements(primitive.mode, indexAccessor.count, indexAccessor.componentType, indexAccessor.byteOffset);
        }
        else
        {
            gl.drawArrays(primitive.mode, 0, vertexCount);
        }

        for (let attrib of primitive.attributes)
        {
            gl.disableVertexAttribArray(this.shader.getAttribLocation(attrib.name));
        }
    }

    pushParameterDefines(fragDefines)
    {
        if (this.parameters.usePunctual)
        {
            fragDefines.push("USE_PUNCTUAL 1");
            fragDefines.push("LIGHT_COUNT " + this.visibleLights.length);
        }

        if (this.parameters.useIBL)
        {
            fragDefines.push("USE_IBL 1");
            fragDefines.push("USE_TEX_LOD 1");
        }

        if (this.parameters.useHdr)
        {
            fragDefines.push("USE_HDR 1");
        }

        switch(this.parameters.toneMap)
        {
            case(ToneMaps.UNCHARTED):
                fragDefines.push("TONEMAP_UNCHARTED 1");
                break;
            case(ToneMaps.HEJL_RICHARD):
                fragDefines.push("TONEMAP_HEJLRICHARD 1");
                break;
            case(ToneMaps.LINEAR):
            default:
                break;
        }

        if(this.parameters.debugOutput !== DebugOutput.NONE)
        {
            fragDefines.push("DEBUG_OUTPUT 1");
        }

        switch(this.parameters.debugOutput)
        {
            case(DebugOutput.METALLIC):
                fragDefines.push("DEBUG_METALLIC 1");
                break;
            case(DebugOutput.ROUGHNESS):
                fragDefines.push("DEBUG_ROUGHNESS 1");
                break;
            case(DebugOutput.NORMAL):
                fragDefines.push("DEBUG_NORMAL 1");
                break;
            case(DebugOutput.BASECOLOR):
                fragDefines.push("DEBUG_BASECOLOR 1");
                break;
            case(DebugOutput.OCCLUSION):
                fragDefines.push("DEBUG_OCCLUSION 1");
                break;
            case(DebugOutput.EMISIVE):
                fragDefines.push("DEBUG_EMISSIVE 1");
                break;
            case(DebugOutput.F0):
                fragDefines.push("DEBUG_F0 1");
                break;
            case(DebugOutput.ALPHA):
                fragDefines.push("DEBUG_ALPHA 1");
                break;
        }
    }

    applyLights(gltf)
    {
        let uniformLights = [];
        for (let light of this.visibleLights)
        {
            uniformLights.push(light.toUniform(gltf));
        }

        this.shader.updateUniform("u_Lights", uniformLights);
    }

    applyEnvironmentMap(gltf, texSlotOffset)
    {
        let diffuseEnvMap = new gltfTextureInfo(gltf.textures.length - 3, 0);
        let specularEnvMap = new gltfTextureInfo(gltf.textures.length - 2, 0);
        let lut = new gltfTextureInfo(gltf.textures.length - 1);

        specularEnvMap.generateMips = false;
        lut.generateMips = false;

        SetTexture(this.shader.getUniformLocation("u_DiffuseEnvSampler"), gltf, diffuseEnvMap, texSlotOffset);
        SetTexture(this.shader.getUniformLocation("u_SpecularEnvSampler"), gltf, specularEnvMap, texSlotOffset + 1);
        SetTexture(this.shader.getUniformLocation("u_brdfLUT"), gltf, lut, texSlotOffset + 2);

        this.shader.updateUniform("u_ScaleIBLAmbient", jsToGl([1, 1, gltf.textures.length, 0]));
    }

    destroy()
    {
        this.shaderCache.destroy();
    }
}

class gltfUserInterface
{
    constructor(
        modelPathProvider,
        selectedModel,
        renderingParameters,
        stats)
    {
        this.modelPathProvider = modelPathProvider;
        this.selectedModel = selectedModel;
        this.renderingParameters = renderingParameters;
        this.stats = stats;

        this.gui = undefined;
        this.gltfFolder = undefined;

        this.onModelSelected = undefined;
        this.onNextSceneSelected = undefined;
        this.onPreviousSceneSelected = undefined;
    }

    initialize()
    {
        this.gui = new dat.GUI({ width: 300 });
        this.gltfFolder = this.gui.addFolder("glTF");

        this.initializeModelsDropdown();
        this.initializeSceneSelection();
        this.initializeLightingSettings();
        this.initializeDebugSettings();
        this.initializeMonitoringView();
        this.gltfFolder.open();
    }

    initializeModelsDropdown()
    {
        const modelKeys = this.modelPathProvider.getAllKeys();
        if (!modelKeys.includes(this.selectedModel))
        {
            this.selectedModel = modelKeys[0];
        }

        const self = this;
        this.gltfFolder.add(this, "selectedModel", modelKeys).name("Model").onChange(modelKey => self.onModelSelected(modelKey));
    }

    initializeSceneSelection()
    {
        const scenesFolder = this.gltfFolder.addFolder("Scene Index");
        scenesFolder.add(this, "onPreviousSceneSelected").name("←");
        scenesFolder.add(this, "onNextSceneSelected").name("→");
    }

    initializeLightingSettings()
    {
        const self = this;
        const lightingFolder = this.gui.addFolder("Lighting");
        lightingFolder.add(this.renderingParameters, "useIBL").name("Image-Based Lighting");
        lightingFolder.add(this.renderingParameters, "usePunctual").name("Punctual Lighting");
        lightingFolder.add(this.renderingParameters, "environment", Environments).name("Environment")
            .onChange(() => self.onModelSelected(self.selectedModel));
        lightingFolder.add(this.renderingParameters, "exposure", 0, 2, 0.1).name("Exposure");
        lightingFolder.add(this.renderingParameters, "gamma", 0, 10, 0.1).name("Gamma");
        lightingFolder.add(this.renderingParameters, "toneMap", Object.values(ToneMaps)).name("Tone Map");
        lightingFolder.addColor(this.renderingParameters, "clearColor", [50, 50, 50]).name("Background Color");
    }

    initializeDebugSettings()
    {
        const debugFolder = this.gui.addFolder("Debug");
        debugFolder.add(this.renderingParameters, "debugOutput", Object.values(DebugOutput)).name("Debug Output");
    }

    initializeMonitoringView()
    {
        const monitoringFolder = this.gui.addFolder("Performance");
        this.stats.domElement.height = "48px";
        for (const child of this.stats.domElement.children)
        {
            child.style.display = "";
        }
        this.stats.domElement.style.position = "static";
        const statsList = document.createElement("li");
        statsList.appendChild(this.stats.domElement);
        statsList.classList.add("gui-stats");
        monitoringFolder.__ul.appendChild(statsList);
    }
}

class UserCamera extends gltfCamera
{
    constructor(
        position = [0, 0, 0],
        target = [0, 0,0],
        up = [0, 1, 0],
        xRot = 0, yRot = 0,
        zoom = 1)
    {
        super();

        this.position = jsToGl(position);
        this.target = jsToGl(target);
        this.up = jsToGl(up);
        this.xRot = xRot;
        this.yRot = yRot;
        this.zoom = zoom;
        this.zoomFactor = 1.04;
        this.rotateSpeed = 1 / 180;
    }

    getViewMatrix(gltf)
    {
        let view = create$3();
        lookAt(view, this.position, this.target, this.up);
        return view;
    }

    getPosition(gltf)
    {
        return this.position;
    }

    updatePosition()
    {
        // calculate direction from focus to camera (assuming camera is at positive z)
        // yRot rotates *around* x-axis, xRot rotates *around* y-axis
        let direction = fromValues$4(0, 0, 1);
        const zero = create$4();
        rotateX$1(direction, direction, zero, -this.yRot);
        rotateY$1(direction, direction, zero, -this.xRot);

        let position = create$4();
        scale$4(position, direction, this.zoom);
        add$4(position, position, this.target);

        this.position = position;
    }

    zoomIn(value)
    {
        if (value > 0)
        {
            this.zoom *= this.zoomFactor;
        }
        else
        {
            this.zoom /= this.zoomFactor;
        }
    }

    rotate(x, y)
    {
        const yMax = Math.PI / 2 - 0.01;
        this.xRot += (x * this.rotateSpeed);
        this.yRot += (y * this.rotateSpeed);
        this.yRot = clamp(this.yRot, -yMax, yMax);
    }

    fitViewToAsset(gltf)
    {
        let min$$1 = fromValues$4(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        let max$$1 = fromValues$4(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);

        this.getAssetExtends(gltf, min$$1, max$$1);

        let scaleFactor = 1.0;
        let minValue = Math.min(min$$1[0], Math.min(min$$1[1], min$$1[2]));
        let maxValue = Math.max(max$$1[0], Math.max(max$$1[1], max$$1[2]));
        let deltaValue = maxValue - minValue;
        scaleFactor = 1.0 / deltaValue;

        for (let i of [0, 1, 2])
        {
            min$$1[i] *= scaleFactor;
            max$$1[i] *= scaleFactor;
        }

        this.fitCameraTargetToExtends(min$$1, max$$1);
        this.fitZoomToExtends(min$$1, max$$1);

        return scaleFactor;
    }

    getAssetExtends(gltf, outMin, outMax)
    {
        for (const node of gltf.nodes)
        {
            if (node.mesh === undefined)
            {
                continue;
            }

            const mesh = gltf.meshes[node.mesh];
            if (mesh.primitives === undefined)
            {
                continue;
            }

            for (const primitive of mesh.primitives)
            {
                const attribute = primitive.attributes.find(a => a.attribute == "POSITION");
                if (attribute === undefined)
                {
                    continue;
                }

                const accessor = gltf.accessors[attribute.accessor];
                let assetMin = create$4();
                let assetMax = create$4();
                this.getExtendsFromAccessor(accessor, node.worldTransform, assetMin, assetMax);

                for (let i of [0, 1, 2])
                {
                    outMin[i] = Math.min(outMin[i], assetMin[i]);
                    outMax[i] = Math.max(outMax[i], assetMax[i]);
                }
            }
        }
    }

    fitZoomToExtends(min$$1, max$$1)
    {
        const maxAxisLength = Math.max(max$$1[0] - min$$1[0], max$$1[1] - min$$1[1]);
        this.zoom = this.getFittingZoom(maxAxisLength);
    }

    fitCameraTargetToExtends(min$$1, max$$1)
    {
        for (let i of [0, 1, 2])
        {
            this.target[i] = (max$$1[i] + min$$1[i]) / 2;
        }
    }

    getFittingZoom(axisLength)
    {
        const yfov = this.yfov;
        const xfov = this.yfov * this.aspectRatio;

        const yZoom = axisLength / 2 / Math.tan(yfov / 2);
        const xZoom = axisLength / 2 / Math.tan(xfov / 2);

        return Math.max(xZoom, yZoom);
    }

    getExtendsFromAccessor(accessor, worldTransform, outMin, outMax)
    {
        let boxMin = create$4();
        transformMat4(boxMin, jsToGl(accessor.min), worldTransform);

        let boxMax = create$4();
        transformMat4(boxMax, jsToGl(accessor.max), worldTransform);

        let center = create$4();
        add$4(center, boxMax, boxMin);
        scale$4(center, center, 0.5);

        let centerToSurface = create$4();
        sub$4(centerToSurface, boxMax, center);

        const radius = length(centerToSurface);

        for (let i of [1, 2, 3])
        {
            outMin[i] = center[i] - radius;
            outMax[i] = center[i] + radius;
        }
    }
}

class GlbParser
{
    constructor(data)
    {
        this.data = data;
        this.glbHeaderInts = 3;
        this.glbChunkHeaderInts = 2;
        this.glbMagic = 0x46546C67;
        this.glbVersion = 2;
        this.jsonChunkType = 0x4E4F534A;
        this.binaryChunkType = 0x004E4942;
    }

    extractGlbData()
    {
        const glbInfo = this.getCheckedGlbInfo();
        if (glbInfo === undefined)
        {
            return undefined;
        }

        let json = undefined;
        let buffers = [];
        const chunkInfos = this.getAllChunkInfos();
        for (let chunkInfo of chunkInfos)
        {
            if (chunkInfo.type == this.jsonChunkType && !json)
            {
                json = this.getJsonFromChunk(chunkInfo);
            }
            else if (chunkInfo.type == this.binaryChunkType)
            {
                buffers.push(this.getBufferFromChunk(chunkInfo));
            }
        }

        return { json: json, buffers: buffers };
    }

    getCheckedGlbInfo()
    {
        const header = new Uint32Array(this.data, 0, this.glbHeaderInts);
        const magic = header[0];
        const version = header[1];
        const length = header[2];

        if (!this.checkEquality(magic, this.glbMagic, "glb magic") ||
            !this.checkEquality(version, this.glbVersion, "glb header version") ||
            !this.checkEquality(length, this.data.byteLength, "glb byte length"))
        {
            return undefined;
        }

        return { "magic": magic, "version": version, "length": length };
    }

    getAllChunkInfos()
    {
        let infos = [];
        let chunkStart = this.glbHeaderInts * 4;
        while (chunkStart < this.data.byteLength)
        {
            const chunkInfo = this.getChunkInfo(chunkStart);
            infos.push(chunkInfo);
            chunkStart += chunkInfo.length + this.glbChunkHeaderInts * 4;
        }
        return infos;
    }

    getChunkInfo(headerStart)
    {
        const header = new Uint32Array(this.data, headerStart, this.glbChunkHeaderInts);
        const chunkStart = headerStart + this.glbChunkHeaderInts * 4;
        const chunkLength = header[0];
        const chunkType = header[1];
        return { "start": chunkStart, "length": chunkLength, "type": chunkType };
    }

    getJsonFromChunk(chunkInfo)
    {
        const chunkLength = chunkInfo.length;
        const jsonStart = (this.glbHeaderInts + this.glbChunkHeaderInts) * 4;
        const jsonSlice = new Uint8Array(this.data, jsonStart, chunkLength);
        return JSON.parse(String.fromCharCode.apply(null, jsonSlice));
    }

    getBufferFromChunk(chunkInfo)
    {
        return this.data.slice(chunkInfo.start, chunkInfo.start + chunkInfo.length);
    }

    checkEquality(actual, expected, name)
    {
        if (actual == expected)
        {
            return true;
        }

        console.error("Found invalid/unsupported " + name + ", expected: " + expected + ", but was: " + actual);
        return false;
    }
}

class gltfViewer
{
    constructor(
        canvas,
        modelIndex,
        headless = false,
        onRendererReady = undefined,
        basePath = "",
        initialModel = "",
        environmentMap = "papermill")
    {
        this.headless = headless;
        this.onRendererReady = onRendererReady;
        this.basePath = basePath;
        this.initialModel = initialModel;

        this.lastMouseX = 0.00;
        this.lastMouseY = 0.00;
        this.mouseDown = false;

        this.lastTouchX = 0.00;
        this.lastTouchY = 0.00;
        this.touchDown = false;

        // TODO: Avoid depending on global variables.
        window.canvas = canvas;
        canvas.style.cursor = "grab";

        this.loadingTimer = new Timer();
        this.gltf = undefined;

        this.sceneIndex = 0;
        this.cameraIndex = -1;

        this.renderingParameters = new gltfRenderingParameters(environmentMap);

        if (this.headless === true)
        {
            this.hideSpinner();
        }
        else if (this.initialModel.includes("/"))
        {
            // no UI if a path is provided (e.g. in the vscode plugin)
            this.loadFromPath(this.initialModel);
        }
        else
        {
            const self = this;
            this.stats = new Stats();
            this.pathProvider = new gltfModelPathProvider(this.basePath + modelIndex);
            this.pathProvider.initialize().then(() =>
            {
                self.initializeGui();
                self.loadFromPath(self.pathProvider.resolve(self.initialModel));
            });
        }

        this.userCamera = new UserCamera();

        this.currentlyRendering = false;
        this.renderer = new gltfRenderer(canvas, this.userCamera, this.renderingParameters, this.basePath);

        this.render(); // Starts a rendering loop.
    }

    setCamera(eye = [0.0, 0.0, 0.05], target = [0.0, 0.0, 0.0], up = [0.0, 1.0, 0.0],
        type = "perspective",
        znear = 0.01, zfar = 10000.0,
        yfov = 45.0 * Math.PI / 180.0, aspectRatio = 16.0 / 9.0,
        xmag = 1.0, ymag = 1.0)
    {
        this.cameraIndex = -1; // force use default camera

        this.userCamera.target = jsToGl(target);
        this.userCamera.up = jsToGl(up);
        this.userCamera.position = jsToGl(eye);
        this.userCamera.type = type;
        this.userCamera.znear = znear;
        this.userCamera.zfar = zfar;
        this.userCamera.yfov = yfov;
        this.userCamera.aspectRatio = aspectRatio;
        this.userCamera.xmag = xmag;
        this.userCamera.ymag = ymag;
    }

    loadFromFileObject(mainFile, additionalFiles)
    {
        const gltfFile = mainFile.name;
        this.notifyLoadingStarted(gltfFile);

        const reader = new FileReader();
        const self = this;
        if (getIsGlb(gltfFile))
        {
            reader.onloadend = function(event)
            {
                const data = event.target.result;
                const glbParser = new GlbParser(data);
                const glb = glbParser.extractGlbData();
                self.createGltf(gltfFile, glb.json, glb.buffers);
            };
            reader.readAsArrayBuffer(mainFile);
        }
        else
        {
            reader.onloadend = function(event)
            {
                const data = event.target.result;
                const json = JSON.parse(data);
                self.createGltf(gltfFile, json, additionalFiles);
            };
            reader.readAsText(mainFile);
        }
    }

    loadFromPath(gltfFile, basePath = "")
    {
        gltfFile = basePath + gltfFile;
        this.notifyLoadingStarted(gltfFile);

        const isGlb = getIsGlb(gltfFile);

        const self = this;
        axios.get(gltfFile, { responseType: isGlb ? "arraybuffer" : "json" }).then(function(response)
        {
            let json = response.data;
            let buffers = undefined;
            if (isGlb)
            {
                const glbParser = new GlbParser(response.data);
                const glb = glbParser.extractGlbData();
                json = glb.json;
                buffers = glb.buffers;
            }
            self.createGltf(gltfFile, json, buffers);
        }).catch(function(error)
        {
            console.error("glTF " + error);
            if (!self.headless) self.hideSpinner();
        });
    }

    createGltf(path, json, buffers)
    {
        this.renderingParameters.updateEnvironment(this.renderingParameters.environment);

        let gltf = new glTF(path);
        gltf.fromJson(json);

        const environmentType = this.renderingParameters.useHdr ? ImageMimeType.HDR : ImageMimeType.JPEG;
        this.addEnvironmentMap(gltf, this.renderingParameters.environment, this.renderingParameters.environmentMipLevel, environmentType);

        let assetPromises = gltfLoader.load(gltf, buffers);

        let self = this;
        Promise.all(assetPromises)
            .then(() => self.onResize(gltf))
            .then(() => self.onGltfLoaded(gltf));
    }

    isPowerOf2(n)
    {
        return n && (n & (n - 1)) === 0;
    }

    onResize(gltf)
    {
        const imagePromises = [];
        if (gltf.images !== undefined)
        {
            let i;
            for (i = 0; i < gltf.images.length; i++)
            {
                if (gltf.images[i].image.dataRGBE !== undefined ||
                    this.isPowerOf2(gltf.images[i].image.width) && this.isPowerOf2(gltf.images[i].image.height))
                {
                    continue;
                }

                if (gltf.images[i].image.width != gltf.images[i].image.height)
                {
                	// Rectangle, so not mip-mapped, so no resize needed.
                    continue;
                }
                
                const currentImagePromise = new Promise(function(resolve)
                {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');

                    function nearestPowerOf2(n)
                    {
                        return Math.pow(2.0, Math.round(Math.log(n) / Math.log(2.0)));
                    }

                    canvas.width = nearestPowerOf2(gltf.images[i].image.width);
                    canvas.height = nearestPowerOf2(gltf.images[i].image.height);

                    context.drawImage(gltf.images[i].image, 0, 0, canvas.width, canvas.height);

                    gltf.images[i].image.src = canvas.toDataURL("image/png");

                    resolve();
                });

                imagePromises.push(currentImagePromise);
            }
        }

        return Promise.all(imagePromises);
    }

    onGltfLoaded(gltf)
    {
        this.notifyLoadingEnded(gltf.path);

        if (gltf.scenes.length === 0)
        {
            throw "No scenes in the gltf";
        }

        this.currentlyRendering = false;

        // unload previous scene
        if (this.gltf !== undefined)
        {
            gltfLoader.unload(this.gltf);
            this.gltf = undefined;
        }

        this.sceneIndex = gltf.scene === undefined ? 0 : gltf.scene;
        const scene = gltf.scenes[this.sceneIndex];
        scene.applyTransformHierarchy(gltf);
        this.scaleFactor = this.userCamera.fitViewToAsset(gltf);

        this.gltf = gltf;
        this.currentlyRendering = true;
    }

    render()
    {
        let self = this;
        function renderFrame(elapsedTime)
        {
            if (self.stats !== undefined)
            {
                self.stats.begin();
            }

            if (self.currentlyRendering)
            {
                self.renderer.resize(canvas.clientWidth, canvas.clientHeight);
                self.renderer.newFrame();

                if (self.sceneIndex < 0)
                {
                    self.sceneIndex = 0;
                }
                else if (self.sceneIndex >= self.gltf.scenes.length)
                {
                    self.sceneIndex = self.gltf.scenes.length - 1;
                }

                if (self.gltf.scenes.length !== 0)
                {
                    if (self.headless == false)
                    {
                        self.userCamera.updatePosition();
                    }

                    const scene = self.gltf.scenes[self.sceneIndex];

                    // if transformations happen at runtime, we need to apply the transform hierarchy here
                    // scene.applyTransformHierarchy(gltf);

                    let alphaScene = scene.getSceneWithAlphaMode(self.gltf, 'BLEND'); // get non opaque
                    if (alphaScene.nodes.length > 0)
                    {
                        // first render opaque objects, oder is not important but could improve performance 'early z rejection'
                        let opaqueScene = scene.getSceneWithAlphaMode(self.gltf, 'BLEND', true);
                        self.renderer.drawScene(self.gltf, opaqueScene, self.cameraIndex, false, self.scaleFactor);

                        // render transparent objects ordered by distance from camera
                        self.renderer.drawScene(self.gltf, alphaScene, self.cameraIndex, true, self.scaleFactor);
                    }
                    else
                    {
                        // no alpha materials, render as is
                        self.renderer.drawScene(self.gltf, scene, self.cameraIndex, false, self.scaleFactor);
                    }
                }

                if (self.onRendererReady)
                {
                    self.onRendererReady();
                }
            }

            if (self.stats !== undefined)
            {
                self.stats.end();
            }

            window.requestAnimationFrame(renderFrame);
        }

        // After this start executing render loop.
        window.requestAnimationFrame(renderFrame);
    }

    onMouseDown(event)
    {
        if (this.currentlyRendering)
        {
            this.mouseDown = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            canvas.style.cursor = "none";
        }
    }

    onMouseUp(event)
    {
        if (this.currentlyRendering)
        {
            this.mouseDown = false;
            canvas.style.cursor = "grab";
        }
    }

    onMouseWheel(event)
    {
        if (this.currentlyRendering)
        {
            event.preventDefault();
            this.userCamera.zoomIn(event.deltaY);
            canvas.style.cursor = "none";
        }
    }

    onMouseMove(event)
    {
        if (this.currentlyRendering)
        {
            if (!this.mouseDown)
            {
                canvas.style.cursor = "grab";
                return;
            }

            const newX = event.clientX;
            const newY = event.clientY;

            const deltaX = newX - this.lastMouseX;
            const deltaY = newY - this.lastMouseY;

            this.lastMouseX = newX;
            this.lastMouseY = newY;

            this.userCamera.rotate(deltaX, deltaY);
        }
    }

    onTouchStart(event)
    {
        if (this.currentlyRendering)
        {
            this.touchDown = true;
            this.lastTouchX = event.touches[0].clientX;
            this.lastTouchY = event.touches[0].clientY;
        }
    }

    onTouchEnd(event)
    {
        if (this.currentlyRendering)
        {
            this.touchStart = false;
        }
    }

    onTouchMove(event)
    {
        if (this.currentlyRendering)
        {
            if (!touchDown)
            {
                return;
            }

            const newX = event.touches[0].clientX;
            const newY = event.touches[0].clientY;

            const deltaX = newX - this.lastTouchX;
            const deltaY = newY - this.lastTouchY;

            this.lastTouchX = newX;
            this.lastTouchY = newY;

            this.userCamera.rotate(deltaX, deltaY);
        }
    }

    // for some reason, the drop event does not work without this
    dragOverHandler(event)
    {
        if (this.currentlyRendering)
        {
            event.preventDefault();
        }
    }

    dropEventHandler(event)
    {
        if (this.currentlyRendering)
        {
            event.preventDefault();

            let additionalFiles = [];
            let mainFile;
            for (const file of event.dataTransfer.files)
            {
                if (getIsGltf(file.name) || getIsGlb(file.name))
                {
                    mainFile = file;
                }
                else
                {
                    additionalFiles.push(file);
                }
            }

            if (mainFile === undefined)
            {
                console.warn("No gltf/glb file found. Provided files: " + additionalFiles.map(f => f.name).join(", "));
                return;
            }

            this.loadFromFileObject(mainFile, additionalFiles);
        }
    }

    initializeGui()
    {
        const gui = new gltfUserInterface(
            this.pathProvider,
            this.initialModel,
            this.renderingParameters,
            this.stats);

        const self = this;
        gui.onModelSelected = (model) => self.loadFromPath(this.pathProvider.resolve(model));
        gui.onNextSceneSelected = () => self.sceneIndex++;
        gui.onPreviousSceneSelected = () => self.sceneIndex--;

        gui.initialize();
    }

    parseModelIndex(jsonIndex)
    {
        const modelDictionary = {};

        let ignoreVariants = ["glTF-Draco", "glTF-Embedded"];

        for (let entry of jsonIndex)
        {
            if (entry.variants !== undefined)
            {
                for (let variant of Object.keys(entry.variants))
                {
                    if (!ignoreVariants.includes(variant))
                    {
                        const path = entry.name + '/' + variant + '/' + entry.variants[variant];
                        const fileName = getFileNameWithoutExtension(path);
                        let identifier = fileName;
                        if (variant !== "glTF")
                        {
                            identifier += " (" + variant.replace('glTF-', '') + ")";
                        }
                        modelDictionary[identifier] = path;
                    }
                }
            }
        }

        return modelDictionary;
    }

    addEnvironmentMap(gltf, subFolder = "papermill", mipLevel = 9, type = ImageMimeType.JPEG)
    {
        let extension;
        switch (type)
        {
            case (ImageMimeType.JPEG):
                extension = ".jpg";
                break;
            case (ImageMimeType.HDR):
                extension = ".hdr";
                break;
            default:
                console.error("Unknown image type: " + type);
                return;
        }

        const imagesFolder = this.basePath + "assets/images/" + subFolder + "/";
        const diffusePrefix = imagesFolder + "diffuse/diffuse_";
        const diffuseSuffix = "_0" + extension;
        const specularPrefix = imagesFolder + "specular/specular_";
        const specularSuffix = "_";
        const sides =
            [
                ["right", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
                ["left", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
                ["top", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
                ["bottom", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
                ["front", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
                ["back", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]
            ];

        gltf.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, "DiffuseCubeMapSampler"));
        const diffuseCubeSamplerIdx = gltf.samplers.length - 1;

        gltf.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, "SpecularCubeMapSampler"));
        const specularCubeSamplerIdx = gltf.samplers.length - 1;

        gltf.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, "LUTSampler"));
        const lutSamplerIdx = gltf.samplers.length - 1;

        let imageIdx = gltf.images.length;

        let indices = [];

        function addSide(basePath, side, mipLevel)
        {
            let i = 0;
            for (i = 0; i <= mipLevel; i++)
            {
                const imagePath = basePath + i + extension;
                const image = new gltfImage(imagePath, side, i);
                image.mimeType = type;
                gltf.images.push(image);
                indices.push(++imageIdx);
            }
        }
        // u_DiffuseEnvSampler faces
        for (const side of sides)
        {
            const imagePath = diffusePrefix + side[0] + diffuseSuffix;
            const image = new gltfImage(imagePath, side[1]);
            image.mimeType = type;
            gltf.images.push(image);
        }

        // u_DiffuseEnvSampler tex
        gltf.textures.push(new gltfTexture(diffuseCubeSamplerIdx, [imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx], gl.TEXTURE_CUBE_MAP));

        // u_SpecularEnvSampler tex
        for (const side of sides)
        {
            addSide(specularPrefix + side[0] + specularSuffix, side[1], mipLevel);
        }

        gltf.textures.push(new gltfTexture(specularCubeSamplerIdx, indices, gl.TEXTURE_CUBE_MAP));

        gltf.images.push(new gltfImage(this.basePath + "assets/images/brdfLUT.png", gl.TEXTURE_2D));

        // u_brdfLUT tex
        gltf.textures.push(new gltfTexture(lutSamplerIdx, [++imageIdx], gl.TEXTURE_2D));
    }

    notifyLoadingStarted(path)
    {
        this.loadingTimer.start();
        console.log("Loading '%s' with environment '%s'", path, this.renderingParameters.environment);

        if (!this.headless)
        {
            this.showSpinner();
        }
    }

    notifyLoadingEnded(path)
    {
        this.loadingTimer.stop();
        console.log("Loading '%s' took %f seconds", path, this.loadingTimer.seconds);

        if (!this.headless)
        {
            this.hideSpinner();
        }
    }

    showSpinner()
    {
        let spinner = document.getElementById("gltf-rv-model-spinner");
        if (spinner !== undefined)
        {
            spinner.style.display = "block";
        }
    }

    hideSpinner()
    {
        let spinner = document.getElementById("gltf-rv-model-spinner");
        if (spinner !== undefined)
        {
            spinner.style.display = "none";
        }
    }
}

function gltf_rv(canvasId, index,
    headless = false,
    onRendererReady = undefined,
    basePath = "",
    initialModel = "BoomBox",
    envMap = "papermill")
{
    // TODO: Avoid depending on global variables.
    const canvas = window.canvas = document.getElementById(canvasId);
    if (!canvas)
    {
        console.warn("Failed to retrieve the WebGL canvas!");
        return null;
    }

    // TODO: Avoid depending on global variables.
    const gl = window.gl = getWebGlContext();
    if (!gl)
    {
        console.warn("Failed to get an WebGL rendering context!");
        return null;
    }

    const viewer = new gltfViewer(canvas, index, headless, onRendererReady, basePath, initialModel, envMap);

    canvas.onmousedown = viewer.onMouseDown.bind(viewer);
    document.onmouseup = viewer.onMouseUp.bind(viewer);
    document.onmousemove = viewer.onMouseMove.bind(viewer);
    canvas.onwheel = viewer.onMouseWheel.bind(viewer);
    canvas.ontouchstart = viewer.onTouchStart.bind(viewer);
    document.ontouchend = viewer.onTouchEnd.bind(viewer);
    document.ontouchmove = viewer.onTouchMove.bind(viewer);

    canvas.ondrop = viewer.dropEventHandler.bind(viewer);
    canvas.ondragover = viewer.dragOverHandler.bind(viewer);

    return viewer; // Succeeded in creating a glTF viewer!
}

function getWebGlContext()
{
    const parameters = { alpha: false, antialias: true };
    const contextTypes = [ "webgl", "experimental-webgl" ];

    let context;

    for (const contextType of contextTypes)
    {
        context = canvas.getContext(contextType, parameters);
        if (context)
        {
            return context;
        }
    }
}

exports.gltf_rv = gltf_rv;
