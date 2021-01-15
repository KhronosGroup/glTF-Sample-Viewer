'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Common utilities
 * @module glMatrix
 */
// Configuration Constants
var EPSILON = 0.000001;
var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
if (!Math.hypot) Math.hypot = function () {
  var y = 0,
      i = arguments.length;

  while (i--) {
    y += arguments[i] * arguments[i];
  }

  return Math.sqrt(y);
};

/**
 * 3x3 Matrix
 * @module mat3
 */

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */

function create() {
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
 * Copies the upper-left 3x3 values into the given mat3.
 *
 * @param {mat3} out the receiving 3x3 matrix
 * @param {ReadonlyMat4} a   the source 4x4 matrix
 * @returns {mat3} out
 */

function fromMat4(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[4];
  out[4] = a[5];
  out[5] = a[6];
  out[6] = a[8];
  out[7] = a[9];
  out[8] = a[10];
  return out;
}
/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the first operand
 * @param {ReadonlyMat3} b the second operand
 * @returns {mat3} out
 */

function multiply(out, a, b) {
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

function create$1() {
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
 * @param {ReadonlyMat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */

function clone(a) {
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

function identity(out) {
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
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function transpose(out, a) {
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
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function invert(out, a) {
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
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

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
 * Calculates the determinant of a mat4
 *
 * @param {ReadonlyMat4} a the source matrix
 * @returns {Number} determinant of a
 */

function determinant(a) {
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
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}
/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function multiply$1(out, a, b) {
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
      a33 = a[15]; // Cache only the current line of the second matrix

  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}
/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function rotateY(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}
/**
 * Returns the translation vector component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslation,
 *  the returned vector will be the same as the translation vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive translation component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
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
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
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
  out[0] = Math.hypot(m11, m12, m13);
  out[1] = Math.hypot(m21, m22, m23);
  out[2] = Math.hypot(m31, m32, m33);
  return out;
}
/**
 * Returns a quaternion representing the rotational component
 *  of a transformation matrix. If a matrix is built with
 *  fromRotationTranslation, the returned quaternion will be the
 *  same as the quaternion originally supplied.
 * @param {quat} out Quaternion to receive the rotation component
 * @param {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {quat} out
 */

function getRotation(out, mat) {
  var scaling = new ARRAY_TYPE(3);
  getScaling(scaling, mat);
  var is1 = 1 / scaling[0];
  var is2 = 1 / scaling[1];
  var is3 = 1 / scaling[2];
  var sm11 = mat[0] * is1;
  var sm12 = mat[1] * is2;
  var sm13 = mat[2] * is3;
  var sm21 = mat[4] * is1;
  var sm22 = mat[5] * is2;
  var sm23 = mat[6] * is3;
  var sm31 = mat[8] * is1;
  var sm32 = mat[9] * is2;
  var sm33 = mat[10] * is3;
  var trace = sm11 + sm22 + sm33;
  var S = 0;

  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (sm23 - sm32) / S;
    out[1] = (sm31 - sm13) / S;
    out[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S;
    out[0] = 0.25 * S;
    out[1] = (sm12 + sm21) / S;
    out[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S;
    out[0] = (sm12 + sm21) / S;
    out[1] = 0.25 * S;
    out[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S;
    out[0] = (sm31 + sm13) / S;
    out[1] = (sm23 + sm32) / S;
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
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
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
      nf;
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
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */

function lookAt(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
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
    return identity(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len = 1 / Math.hypot(z0, z1, z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.hypot(x0, x1, x2);

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
  len = Math.hypot(y0, y1, y2);

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
 * Alias for {@link mat4.multiply}
 * @function
 */

var mul = multiply$1;

/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */

function create$2() {
  var out = new ARRAY_TYPE(3);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  return out;
}
/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {ReadonlyVec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */

function clone$1(a) {
  var out = new ARRAY_TYPE(3);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */

function length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.hypot(x, y, z);
}
/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */

function fromValues(x, y, z) {
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
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}
/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */

function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}
/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} distance between a and b
 */

function distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return Math.hypot(x, y, z);
}
/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
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
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}
/**
 * Calculates the dot product of two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} dot product of a and b
 */

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
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
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
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
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyQuat} q quaternion to transform with
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
      z = a[2]; // var qvec = [qx, qy, qz];
  // var uv = vec3.cross([], qvec, a);

  var uvx = qy * z - qz * y,
      uvy = qz * x - qx * z,
      uvz = qx * y - qy * x; // var uuv = vec3.cross([], qvec, uv);

  var uuvx = qy * uvz - qz * uvy,
      uuvy = qz * uvx - qx * uvz,
      uuvz = qx * uvy - qy * uvx; // vec3.scale(uv, uv, 2 * w);

  var w2 = qw * 2;
  uvx *= w2;
  uvy *= w2;
  uvz *= w2; // vec3.scale(uuv, uuv, 2);

  uuvx *= 2;
  uuvy *= 2;
  uuvz *= 2; // return vec3.add(out, a, vec3.add(out, uv, uuv));

  out[0] = x + uvx + uuvx;
  out[1] = y + uvy + uuvy;
  out[2] = z + uvz + uuvz;
  return out;
}
/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateX(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[0];
  r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
  r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad); //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateY$1(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
  r[1] = p[1];
  r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad); //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Alias for {@link vec3.subtract}
 * @function
 */

var sub = subtract;
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
  var vec = create$2();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

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
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
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

function create$3() {
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
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */

function fromValues$1(x, y, z, w) {
  var out = new ARRAY_TYPE(4);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}
/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to normalize
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
  }

  out[0] = x * len;
  out[1] = y * len;
  out[2] = z * len;
  out[3] = w * len;
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
  var vec = create$3();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

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
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      vec[3] = a[i + 3];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
      a[i + 3] = vec[3];
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

function create$4() {
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
 * @param {ReadonlyVec3} axis the axis around which to rotate
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
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
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
  var omega, cosom, sinom, scale0, scale1; // calc cosine

  cosom = ax * bx + ay * by + az * bz + aw * bw; // adjust signs (if necessary)

  if (cosom < 0.0) {
    cosom = -cosom;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  } // calculate coefficients


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
  } // calculate final values


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
 * @param {ReadonlyMat3} m rotation matrix
 * @returns {quat} out
 * @function
 */

function fromMat3(out, m) {
  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
  // article "Quaternion Calculus and Fast Animation".
  var fTrace = m[0] + m[4] + m[8];
  var fRoot;

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
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */

var fromValues$2 = fromValues$1;
/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quaternion to normalize
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
 * @param {ReadonlyVec3} a the initial vector
 * @param {ReadonlyVec3} b the destination vector
 * @returns {quat} out
 */

var rotationTo = function () {
  var tmpvec3 = create$2();
  var xUnitVec3 = fromValues(1, 0, 0);
  var yUnitVec3 = fromValues(0, 1, 0);
  return function (out, a, b) {
    var dot$1 = dot(a, b);

    if (dot$1 < -0.999999) {
      cross(tmpvec3, xUnitVec3, a);
      if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
      normalize(tmpvec3, tmpvec3);
      setAxisAngle(out, tmpvec3, Math.PI);
      return out;
    } else if (dot$1 > 0.999999) {
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
      out[3] = 1 + dot$1;
      return normalize$2(out, out);
    }
  };
}();
/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {ReadonlyQuat} c the third operand
 * @param {ReadonlyQuat} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */

var sqlerp = function () {
  var temp1 = create$4();
  var temp2 = create$4();
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
 * @param {ReadonlyVec3} view  the vector representing the viewing direction
 * @param {ReadonlyVec3} right the vector representing the local "right" direction
 * @param {ReadonlyVec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */

var setAxes = function () {
  var matr = create();
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

function jsToGl(array)
{
    let tensor = new ARRAY_TYPE(array.length);

    for (let i = 0; i < array.length; ++i)
    {
        tensor[i] = array[i];
    }

    return tensor;
}

function jsToGlSlice(array, offset, stride)
{
    let tensor = new ARRAY_TYPE(stride);

    for (let i = 0; i < stride; ++i)
    {
        tensor[i] = array[offset + i];
    }

    return tensor;
}

function initGlForMembers(gltfObj, gltf, webGlContext)
{
    for (const name of Object.keys(gltfObj))
    {
        const member = gltfObj[name];

        if (member === undefined)
        {
            continue;
        }
        if (member.initGl !== undefined)
        {
            member.initGl(gltf, webGlContext);
        }
        if (Array.isArray(member))
        {
            for (const element of member)
            {
                if (element !== null && element !== undefined && element.initGl !== undefined)
                {
                    element.initGl(gltf, webGlContext);
                }
            }
        }
    }
}

function objectsFromJsons(jsonObjects, GltfType)
{
    if (jsonObjects === undefined)
    {
        return [];
    }

    const objects = [];
    for (const jsonObject of jsonObjects)
    {
        objects.push(objectFromJson(jsonObject, GltfType));
    }
    return objects;
}

function objectFromJson(jsonObject, GltfType)
{
    const object = new GltfType();
    object.fromJson(jsonObject);
    return object;
}

function fromKeys(target, jsonObj, ignore = [])
{
    for(let k of Object.keys(target))
    {
        if (ignore && ignore.find(function(elem){return elem == k;}) !== undefined)
        {
            continue; // skip
        }
        if (jsonObj[k] !== undefined)
        {
            let normalizedK = k.replace("^@", "");
            target[normalizedK] = jsonObj[k];
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

function combineHashes(hash1, hash2)
{
    return hash1 ^ (hash1 + 0x9e3779b9 + (hash2 << 6) + (hash2 >> 2));
}

function clamp(number, min, max)
{
    return Math.min(Math.max(number, min), max);
}

function getIsGlb(filename)
{
    return getExtension(filename) == "glb";
}

function getIsGltf(filename)
{
    return getExtension(filename) == "gltf";
}

function getIsHdr(filename)
{
    return getExtension(filename) == "hdr";
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
    const filename = getFileName(filePath);
    const index = filename.lastIndexOf(".");
    return filename.slice(0, index);
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

class AnimationTimer
{
    constructor()
    {
        this.startTime = 0;
        this.paused = true;
        this.fixedTime = null;
        this.pausedTime = 0;
    }

    elapsedSec()
    {
        if(this.paused)
        {
            return this.pausedTime / 1000;
        }
        else
        {
            return this.fixedTime || (new Date().getTime() - this.startTime) / 1000;
        }
    }

    toggle()
    {
        if(this.paused)
        {
            this.unpause();
        }
        else
        {
            this.pause();
        }
    }

    start()
    {
        this.startTime = new Date().getTime();
        this.paused = false;
    }

    pause()
    {
        this.pausedTime = new Date().getTime() - this.startTime;
        this.paused = true;
    }

    unpause()
    {
        this.startTime += new Date().getTime() - this.startTime - this.pausedTime;
        this.paused = false;
    }

    reset()
    {
        if(!this.paused) {
            // Animation is running.
            this.startTime = new Date().getTime();
        }
        else {
            this.startTime = 0;
        }
        this.pausedTime = 0;
    }

    setFixedTime(timeInSec)
    {
        this.paused = false;
        this.fixedTime = timeInSec;
    }
}

// base class for all gltf objects
class GltfObject
{
    constructor()
    {
        this.extensions = undefined;
        this.extras = undefined;
    }

    fromJson(json)
    {
        fromKeys(this, json);
    }

    initGl(gltf, webGlContext)
    {
        initGlForMembers(this, gltf, webGlContext);
    }
}

class gltfCamera extends GltfObject
{
    constructor(
        type = "perspective",
        znear = 0.01,
        zfar = 10000.0,
        yfov = 45.0 * Math.PI / 180.0,
        aspectRatio = 16.0 / 9.0,
        xmag = 1.0,
        ymag = 1.0,
        name = undefined,
        nodeIndex = undefined)
    {
        super();
        this.type = type;
        this.znear = znear;
        this.zfar = zfar;
        this.yfov = yfov; // radians
        this.xmag = xmag;
        this.ymag = ymag;
        this.aspectRatio = aspectRatio;
        this.name = name;
        this.node = nodeIndex;
    }

    initGl(gltf, webGlContext)
    {
        super.initGl(gltf, webGlContext);

        let cameraIndex = undefined;
        for (let i = 0; i < gltf.nodes.length; i++)
        {
            cameraIndex = gltf.nodes[i].camera;
            if (cameraIndex === undefined)
            {
                continue;
            }

            if (gltf.cameras[cameraIndex] === this)
            {
                this.node = i;
                break;
            }
        }

        if(this.node === undefined)
        {
            console.error("Invalid node for camera " + cameraIndex);
        }
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

    sortPrimitivesByDepth(gltf, drawables)
    {
        // Precompute the distances to avoid their computation during sorting.
        for (const drawable of drawables)
        {
            const modelView = create$1();
            multiply$1(modelView, this.getViewMatrix(gltf), drawable.node.worldTransform);

            // Transform primitive centroid to find the primitive's depth.
            const pos = transformMat4(create$2(), clone$1(drawable.primitive.centroid), modelView);

            drawable.depth = pos[2];
        }

        // 1. Remove primitives that are behind the camera.
        //    --> They will never be visible and it is cheap to discard them here.
        // 2. Sort primitives so that the furthest nodes are rendered first.
        //    This is required for correct transparency rendering.
        return drawables
            .filter((a) => a.depth <= 0)
            .sort((a, b) => a.depth - b.depth);
    }

    getProjectionMatrix()
    {
        const projection = create$1();

        if (this.type === "perspective")
        {
            perspective(projection, this.yfov, this.aspectRatio, this.znear, this.zfar);
        }
        else if (this.type === "orthographic")
        {
            projection[0]  = 1.0 / this.xmag;
            projection[5]  = 1.0 / this.ymag;
            projection[10] = 2.0 / (this.znear - this.zfar);
            projection[14] = (this.zfar + this.znear) / (this.znear - this.zfar);
        }

        return projection;
    }

    getViewMatrix(gltf)
    {
        const view = create$1();
        const position = this.getPosition(gltf);
        const target = this.getLookAtTarget(gltf);
        lookAt(view, position, target, fromValues(0, 1, 0));
        return view;
    }

    getLookAtTarget(gltf)
    {
        const target = create$2();
        const position = this.getPosition(gltf);
        const lookDirection = this.getLookDirection(gltf);
        add(target, lookDirection, position);
        return target;
    }

    getPosition(gltf)
    {
        const position = create$2();
        const node = this.getNode(gltf);
        getTranslation(position, node.worldTransform);
        return position;
    }

    getLookDirection(gltf)
    {
        const direction = create$2();
        const rotation = this.getRotation(gltf);
        transformQuat(direction, fromValues(0, 0, -1), rotation);
        return direction;
    }

    getRotation(gltf)
    {
        const rotation = create$4();
        const node = this.getNode(gltf);
        getRotation(rotation, node.worldTransform);
        return rotation;
    }

    clone()
    {
        return new gltfCamera(
            this.type,
            this.znear,
            this.zfar,
            this.yfov,
            this.aspectRatio,
            this.xmag,
            this.ymag,
            this.name,
            this.node);
    }

    getNode(gltf)
    {
        return gltf.nodes[this.node];
    }
}

function getSceneExtents(gltf, sceneIndex, outMin, outMax)
{
    for (const i of [0, 1, 2])
    {
        outMin[i] = Number.POSITIVE_INFINITY;
        outMax[i] = Number.NEGATIVE_INFINITY;
    }

    const scene = gltf.scenes[sceneIndex];

    let nodeIndices = scene.nodes.slice();
    while(nodeIndices.length > 0)
    {
        const node = gltf.nodes[nodeIndices.pop()];
        nodeIndices = nodeIndices.concat(node.children);

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
            const attribute = primitive.glAttributes.find(a => a.attribute == "POSITION");
            if (attribute === undefined)
            {
                continue;
            }

            const accessor = gltf.accessors[attribute.accessor];
            const assetMin = create$2();
            const assetMax = create$2();
            getExtentsFromAccessor(accessor, node.worldTransform, assetMin, assetMax);

            for (const i of [0, 1, 2])
            {
                outMin[i] = Math.min(outMin[i], assetMin[i]);
                outMax[i] = Math.max(outMax[i], assetMax[i]);
            }
        }
    }
}

function getExtentsFromAccessor(accessor, worldTransform, outMin, outMax)
{
    const boxMin = create$2();
    transformMat4(boxMin, jsToGl(accessor.min), worldTransform);

    const boxMax = create$2();
    transformMat4(boxMax, jsToGl(accessor.max), worldTransform);

    const center = create$2();
    add(center, boxMax, boxMin);
    scale(center, center, 0.5);

    const centerToSurface = create$2();
    sub(centerToSurface, boxMax, center);

    const radius = length(centerToSurface);

    for (const i of [0, 1, 2])
    {
        outMin[i] = center[i] - radius;
        outMax[i] = center[i] + radius;
    }
}

function computePrimitiveCentroids(gltf)
{
    const meshes = gltf.nodes.filter(node => node.mesh !== undefined).map(node => gltf.meshes[node.mesh]);
    const primitives = meshes.reduce((acc, mesh) => acc.concat(mesh.primitives), []);
    for(const primitive of primitives) {

        const positionsAccessor = gltf.accessors[primitive.attributes.POSITION];
        const positions = positionsAccessor.getTypedView(gltf);

        if(primitive.indices !== undefined)
        {
            // Primitive has indices.

            const indicesAccessor = gltf.accessors[primitive.indices];

            const indices = indicesAccessor.getTypedView(gltf);

            const acc = new Float32Array(3);

            for(let i = 0; i < indices.length; i++) {
                const offset = 3 * indices[i];
                acc[0] += positions[offset];
                acc[1] += positions[offset + 1];
                acc[2] += positions[offset + 2];
            }

            const centroid = new Float32Array([
                acc[0] / indices.length,
                acc[1] / indices.length,
                acc[2] / indices.length,
            ]);

            primitive.setCentroid(centroid);
        }
        else
        {
            // Primitive does not have indices.

            const acc = new Float32Array(3);

            for(let i = 0; i < positions.length; i += 3) {
                acc[0] += positions[i];
                acc[1] += positions[i + 1];
                acc[2] += positions[i + 2];
            }

            const positionVectors = positions.length / 3;

            const centroid = new Float32Array([
                acc[0] / positionVectors,
                acc[1] / positionVectors,
                acc[2] / positionVectors,
            ]);

            primitive.setCentroid(centroid);
        }

    }
}

const VecZero = create$2();
const PanSpeedDenominator = 1200;
const MaxNearFarRatio = 10000;

class UserCamera extends gltfCamera
{
    constructor(
        position = [0, 0, 0],
        target = [0, 0,0],
        up = [0, 1, 0],
        xRot = 0,
        yRot = 0,
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
        this.panSpeed = 1;
        this.sceneExtents = {
            min: create$2(),
            max: create$2()
        };
    }

    updatePosition()
    {
        // calculate direction from focus to camera (assuming camera is at positive z)
        // yRot rotates *around* x-axis, xRot rotates *around* y-axis
        const direction = fromValues(0, 0, 1);
        this.toLocalRotation(direction);

        const position = create$2();
        scale(position, direction, this.zoom);
        add(position, position, this.target);

        this.position = position;

        this.fitCameraPlanesToExtents(this.sceneExtents.min, this.sceneExtents.max);
    }

    reset(gltf, sceneIndex)
    {
        this.xRot = 0;
        this.yRot = 0;
        this.fitViewToScene(gltf, sceneIndex, true);
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

    pan(x, y)
    {
        const left = fromValues(-1, 0, 0);
        this.toLocalRotation(left);
        scale(left, left, x * this.panSpeed);

        const up = fromValues(0, 1, 0);
        this.toLocalRotation(up);
        scale(up, up, y * this.panSpeed);

        add(this.target, this.target, up);
        add(this.target, this.target, left);
    }

    fitPanSpeedToScene(min, max)
    {
        const longestDistance = distance(min, max);
        this.panSpeed = longestDistance / PanSpeedDenominator;
    }

    fitViewToScene(gltf, sceneIndex)
    {
        getSceneExtents(gltf, sceneIndex, this.sceneExtents.min, this.sceneExtents.max);
        this.fitCameraTargetToExtents(this.sceneExtents.min, this.sceneExtents.max);
        this.fitZoomToExtents(this.sceneExtents.min, this.sceneExtents.max);
        this.fitPanSpeedToScene(this.sceneExtents.min, this.sceneExtents.max);
        this.fitCameraPlanesToExtents(this.sceneExtents.min, this.sceneExtents.max);
    }

    toLocalRotation(vector)
    {
        rotateX(vector, vector, VecZero, -this.yRot);
        rotateY$1(vector, vector, VecZero, -this.xRot);
    }

    getLookAtTarget()
    {
        return this.target;
    }

    getPosition()
    {
        return this.position;
    }

    fitZoomToExtents(min, max)
    {
        const maxAxisLength = Math.max(max[0] - min[0], max[1] - min[1]);
        this.zoom = this.getFittingZoom(maxAxisLength);
    }

    fitCameraTargetToExtents(min, max)
    {
        for (const i of [0, 1, 2])
        {
            this.target[i] = (max[i] + min[i]) / 2;
        }
    }

    fitCameraPlanesToExtents(min, max)
    {
        // Manually increase scene extent just for the camera planes to avoid camera clipping in most situations.
        const longestDistance = 10 * distance(min, max);
        let zNear = this.zoom - (longestDistance * 0.6);
        let zFar = this.zoom + (longestDistance * 0.6);

        // minimum near plane value needs to depend on far plane value to avoid z fighting or too large near planes
        zNear = Math.max(zNear, zFar / MaxNearFarRatio);

        this.znear = zNear;
        this.zfar = zFar;
    }

    getFittingZoom(axisLength)
    {
        const yfov = this.yfov;
        const xfov = this.yfov * this.aspectRatio;

        const yZoom = axisLength / 2 / Math.tan(yfov / 2);
        const xZoom = axisLength / 2 / Math.tan(xfov / 2);

        return Math.max(xZoom, yZoom);
    }
}

function nearestPowerOf2(n)
{
    if (isPowerOf2(n))
    {
        return n;
    }
    return Math.pow(2.0, Math.round(Math.log(n) / Math.log(2.0)));
}

function isPowerOf2(n)
{
    return n && (n & (n - 1)) === 0;
}

function makeEven(n)
{
    if (n % 2 === 1)
    {
        return n + 1;
    }
    return n;
}

class AsyncFileReader
{
    static async readAsArrayBuffer(path) {
        return new Promise( (resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(path);
        });
    }

    static async readAsText(path) {
        return new Promise( (resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(path);
        });
    }

    static async readAsDataURL(path) {
        return new Promise( (resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(path);
        });
    }
}

const ImageMimeType = {JPEG: "image/jpeg", PNG: "image/png", HDR: "image/vnd.radiance", KTX2: "image/ktx2", GLTEXTURE: "image/texture"};

class gltfImage extends GltfObject
{
    constructor(
        uri = undefined,
        type = WebGLRenderingContext.TEXTURE_2D,
        miplevel = 0,
        bufferView = undefined,
        name = undefined,
        mimeType = ImageMimeType.JPEG,
        image = undefined)
    {
        super();
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

    resolveRelativePath(basePath)
    {
        if (this.uri !== undefined)
        {
            if (this.uri.startsWith('./'))
            {
                // Remove preceding './' from URI.
                this.uri = this.uri.substr(2);
            }
            this.uri = basePath + this.uri;
        }
    }

    async load(gltf, additionalFiles = undefined)
    {
        if (this.image !== undefined)
        {
            if (this.mimeType !== ImageMimeType.GLTEXTURE)
            {
                console.error("image has already been loaded");
            }
            return;
        }

        if (this.mimeType === ImageMimeType.KTX2 && gltf.ktxDecoder !== undefined)
        {
            this.image = {};
        }
        else
        {
            this.image = new Image();
        }

        this.image.crossOrigin = "";
        const self = this;

        if (!await self.setImageFromBufferView(gltf) &&
            !await self.setImageFromFiles(additionalFiles, gltf) &&
            !await self.setImageFromUri(gltf))
        {
            console.error("Was not able to resolve image with uri '%s'", self.uri);
            return;
        }

        return;
    }

    static loadHTMLImage(url)
    {
        return new Promise( (resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image) );
            image.addEventListener('error', reject);
            image.src = url;
        });
    }

    async setImageFromUri(gltf)
    {
        if (this.uri === undefined)
        {
            return false;
        }

        if (this.image instanceof Image)
        {
            this.image = await gltfImage.loadHTMLImage(this.uri).catch( (error) => {
                console.error(error);
            });
        }
        else
        {
            if (gltf.ktxDecoder !== undefined)
            {
                this.image = await gltf.ktxDecoder.loadKtxFromUri(this.uri);
            }
            else
            {
                console.warn('Loading of ktx images failed: KtxDecoder not initalized');
            }
        }

        return true;
    }

    async setImageFromBufferView(gltf)
    {
        const view = gltf.bufferViews[this.bufferView];
        if (view === undefined)
        {
            return false;
        }

        const buffer = gltf.buffers[view.buffer].buffer;
        const array = new Uint8Array(buffer, view.byteOffset, view.byteLength);
        if (this.mimeType === ImageMimeType.KTX2)
        {
            if (gltf.ktxDecoder !== undefined)
            {
                this.image = await gltf.ktxDecoder.loadKtxFromBuffer(array);
            }
            else
            {
                console.warn('Loading of ktx images failed: KtxDecoder not initalized');
            }
        }
        else
        {
            const blob = new Blob([array], { "type": this.mimeType });
            const objectURL = URL.createObjectURL(blob);
            this.image = await gltfImage.loadHTMLImage(objectURL).catch( () => {
                console.error("Could not load image from buffer view");
            });
        }
        return true;
    }

    async setImageFromFiles(files, gltf)
    {
        if (this.uri === undefined || files === undefined)
        {
            return false;
        }

        let foundFile = files.find(function(file)
        {
            if (file.name === this.uri || file.fullPath === this.uri)
            {
                return true;
            }
        }, this);

        if (foundFile === undefined)
        {
            return false;
        }

        if (this.image instanceof Image)
        {
            const imageData = await AsyncFileReader.readAsDataURL(foundFile).catch( () => {
                console.error("Could not load image with FileReader");
            });
            this.image = await gltfImage.loadHTMLImage(imageData).catch( () => {
                console.error("Could not create image from FileReader image data");
            });
        }
        else
        {
            if (gltf.ktxDecoder !== undefined)
            {
                const data = new Uint8Array(await foundFile.arrayBuffer());
                this.image = await gltf.ktxDecoder.loadKtxFromBuffer(data);
            }
            else
            {
                console.warn('Loading of ktx images failed: KtxDecoder not initalized');
            }
        }

        return true;
    }

    shouldGenerateMips()
    {
        return (isPowerOf2(this.image.width) && isPowerOf2(this.image.height));
    }
}

const ToneMaps =
{
    NONE: "None",
    ACES_FAST: "ACES fast",
    ACES: "ACES"
};

const DebugOutput =
{
    NONE: "None",
    METALLIC: "Metallic",
    ROUGHNESS: "Roughness",
    NORMAL: "Normal",
    WORLDSPACENORMAL: "Worldspace Normal",
    GEOMETRYNORMAL: "Geometry Normal",
    TANGENT: "Tangent",
    BITANGENT: "Bitangent",
    BASECOLOR: "Base Color",
    OCCLUSION: "Occlusion",
    EMISSIVE: "Emissive",
    DIFFUSE: "Diffuse",
    SPECULAR: "Specular",
    CLEARCOAT: "ClearCoat",
    SHEEN: "Sheen",
    TRANSMISSION: "Transmission",
    ALPHA: "Alpha",
    F0: "F0"
};

class GltfState
{
    constructor()
    {
        this.gltf = undefined;
        this.environment = undefined;
        this.renderingParameters = {
            morphing: true,
            skinning: true,
            clearColor: [58, 64, 74],
            exposure: 1.0,
            usePunctual: false,
            useIBL: true,
            toneMap: ToneMaps.LINEAR,
            debugOutput: DebugOutput.NONE,
            environmentBackground: false,
            environmentRotation: 90.0 //+X = 0 +Z = 90 -X = 180 -Z = 270
        };
        this.userCamera = new UserCamera();
        this.sceneIndex = 0;
        this.cameraIndex = undefined;
        this.animationIndices = [];
        this.animationTimer = new AnimationTimer();
        this.variant = undefined;
    }
}

class gltfShader
{
    constructor(program, hash, gl)
    {
        this.program = program;
        this.hash = hash;
        this.uniforms = new Map();
        this.attributes = new Map();
        this.unknownAttributes = [];
        this.unknownUniforms = [];
        this.gl = gl;

        if(this.program !== undefined)
        {
            const uniformCount = this.gl.context.getProgramParameter(this.program, WebGL2RenderingContext.ACTIVE_UNIFORMS);
            for(let i = 0; i < uniformCount; ++i)
            {
                const info = this.gl.context.getActiveUniform(this.program, i);
                const loc = this.gl.context.getUniformLocation(this.program, info.name);
                this.uniforms.set(info.name, {type: info.type, loc: loc});
            }

            const attribCount = this.gl.context.getProgramParameter(this.program, WebGL2RenderingContext.ACTIVE_ATTRIBUTES);
            for(let i = 0; i < attribCount; ++i)
            {
                const info = this.gl.context.getActiveAttrib(this.program, i);
                const loc = this.gl.context.getAttribLocation(this.program, info.name);
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

    getAttributeLocation(name)
    {
        const loc = this.attributes.get(name);
        if (loc === undefined)
        {
            if (this.unknownAttributes.find(n => n === name) === undefined)
            {
                console.log("Attribute '%s' does not exist", name);
                this.unknownAttributes.push(name);
            }
            return -1;
        }
        return loc;
    }

    getUniformLocation(name)
    {
        const uniform = this.uniforms.get(name);
        if (uniform === undefined)
        {
            if (this.unknownUniforms.find(n => n === name) === undefined)
            {
                this.unknownUniforms.push(name);
            }
            return -1;
        }
        return uniform.loc;
    }

    updateUniform(objectName, object, log = true)
    {
        if (object instanceof UniformStruct)
        {
            this.updateUniformStruct(objectName, object, log);
        }
        else if (Array.isArray(object))
        {
            this.updateUniformArray(objectName, object, log);
        }
        else
        {
            this.updateUniformValue(objectName, object, log);
        }
    }

    updateUniformArray(arrayName, array, log)
    {
        if(array[0] instanceof UniformStruct)
        {
            for (let i = 0; i < array.length; ++i)
            {
                let element = array[i];
                let uniformName = arrayName + "[" + i + "]";
                this.updateUniform(uniformName, element, log);
            }
        }else {
            let uniformName = arrayName + "[0]";

            let flat = [];

            if(Array.isArray(array[0]) || array[0].length !== undefined)
            {
                for (let i = 0; i < array.length; ++i)
                {
                    flat.push.apply(flat, Array.from(array[i]));
                }
            }
            else
            {
                flat = array;
            }

            if(flat.length === 0)
            {
                console.error("Failed to flatten uniform array " + uniformName);
                return;
            }

            this.updateUniformValue(uniformName, flat, log);
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
    updateUniformValue(uniformName, value, log)
    {
        const uniform = this.uniforms.get(uniformName);

        if(uniform !== undefined)
        {
            switch (uniform.type) {
            case WebGL2RenderingContext.FLOAT:
            {
                if(Array.isArray(value) || value instanceof Float32Array)
                {
                    this.gl.context.uniform1fv(uniform.loc, value);
                }else {
                    this.gl.context.uniform1f(uniform.loc, value);
                }
                break;
            }
            case WebGL2RenderingContext.FLOAT_VEC2: this.gl.context.uniform2fv(uniform.loc, value); break;
            case WebGL2RenderingContext.FLOAT_VEC3: this.gl.context.uniform3fv(uniform.loc, value); break;
            case WebGL2RenderingContext.FLOAT_VEC4: this.gl.context.uniform4fv(uniform.loc, value); break;

            case WebGL2RenderingContext.INT:
            {
                if(Array.isArray(value) || value instanceof Uint32Array || value instanceof Int32Array)
                {
                    this.gl.context.uniform1iv(uniform.loc, value);
                }else {
                    this.gl.context.uniform1i(uniform.loc, value);
                }
                break;
            }
            case WebGL2RenderingContext.INT_VEC2: this.gl.context.uniform2iv(uniform.loc, value); break;
            case WebGL2RenderingContext.INT_VEC3: this.gl.context.uniform3iv(uniform.loc, value); break;
            case WebGL2RenderingContext.INT_VEC4: this.gl.context.uniform4iv(uniform.loc, value); break;

            case WebGL2RenderingContext.FLOAT_MAT2: this.gl.context.uniformMatrix2fv(uniform.loc, false, value); break;
            case WebGL2RenderingContext.FLOAT_MAT3: this.gl.context.uniformMatrix3fv(uniform.loc, false, value); break;
            case WebGL2RenderingContext.FLOAT_MAT4: this.gl.context.uniformMatrix4fv(uniform.loc, false, value); break;
            }
        }
        else if(log)
        {
            console.warn("Unkown uniform: " + uniformName);
        }
    }
}

// THis class generates and caches the shader source text for a given permutation
class ShaderCache
{
    constructor(sources, gl)
    {
        this.sources  = sources; // shader name -> source code
        this.shaders  = new Map(); // name & permutations hashed -> compiled shader
        this.programs = new Map(); // (vertex shader, fragment shader) -> program
        this.gl = gl;

        // resovle / expande sources (TODO: break include cycles)
        for (let [key, src] of this.sources)
        {
            let changed = false;
            for (let [includeName, includeSource] of this.sources)
            {
                //var pattern = RegExp(/#include</ + includeName + />/);
                const pattern = "#include <" + includeName + ">";

                if(src.includes(pattern))
                {
                    // only replace the first occurance
                    src = src.replace(pattern, includeSource);

                    // remove the others
                    while (src.includes(pattern))
                    {
                        src = src.replace(pattern, "");
                    }

                    changed = true;
                }
            }

            if(changed)
            {
                this.sources.set(key, src);
            }
        }
    }

    destroy()
    {
        for (let [, shader] of this.shaders.entries())
        {
            this.gl.context.deleteShader(shader);
            shader = undefined;
        }

        this.shaders.clear();

        for (let [, program] of this.programs)
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
            console.log("Shader source for " + shaderIdentifier + " not found");
            return null;
        }

        const isVert = shaderIdentifier.endsWith(".vert");
        let hash = stringHash(shaderIdentifier);

        // console.log(shaderIdentifier);

        let defines = "#version 300 es\n";
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
            shader = this.gl.compileShader(shaderIdentifier, isVert, defines + src);
            this.shaders.set(hash, shader);
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
            let linkedProg = this.gl.linkProgram(this.shaders.get(vertexShaderHash), this.shaders.get(fragmentShaderHash));
            if(linkedProg)
            {
                let program = new gltfShader(linkedProg, hash, this.gl);
                this.programs.set(hash, program);
                return program;
            }
        }

        return undefined;
    }
}

class gltfWebGl
{
    constructor()
    {
        this.context = undefined;
    }

    loadWebGlExtensions(webglExtensions)
    {
        for (let extension of webglExtensions)
        {
            if (this.context.getExtension(extension) === null)
            {
                console.warn("Extension " + extension + " not supported!");
            }
        }

        let EXT_texture_filter_anisotropic = this.context.getExtension("EXT_texture_filter_anisotropic");

        if (EXT_texture_filter_anisotropic)
        {
            this.context.anisotropy = EXT_texture_filter_anisotropic.TEXTURE_MAX_ANISOTROPY_EXT;
            this.context.maxAnisotropy = this.context.getParameter(EXT_texture_filter_anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            this.context.supports_EXT_texture_filter_anisotropic = true;
        }
        else
        {
            this.context.supports_EXT_texture_filter_anisotropic = false;
        }
    }

    setTexture(loc, gltf, textureInfo, texSlot)
    {
        if (loc === -1)
        {
            return false;
        }

        let gltfTex = gltf.textures[textureInfo.index];

        if (gltfTex === undefined)
        {
            console.warn("Texture is undefined: " + textureInfo.index);
            return false;
        }

        const image = gltf.images[gltfTex.source];
        if (image.mimeType === ImageMimeType.KTX2 ||
            image.mimeType === ImageMimeType.GLTEXTURE)
        {
            gltfTex.glTexture = image.image;
            gltfTex.initialized = true;
        }

        if (gltfTex.glTexture === undefined)
        {
            gltfTex.glTexture = this.context.createTexture();
        }

        this.context.activeTexture(WebGL2RenderingContext.TEXTURE0 + texSlot);
        this.context.bindTexture(gltfTex.type, gltfTex.glTexture);

        this.context.uniform1i(loc, texSlot);

        if (!gltfTex.initialized)
        {
            const gltfSampler = gltf.samplers[gltfTex.sampler];

            if (gltfSampler === undefined)
            {
                console.warn("Sampler is undefined for texture: " + textureInfo.index);
                return false;
            }

            this.context.pixelStorei(WebGL2RenderingContext.UNPACK_FLIP_Y_WEBGL, false);

            if (image === undefined)
            {
                console.warn("Image is undefined for texture: " + gltfTex.source);
                return false;
            }
            const internalformat = textureInfo.linear ? WebGL2RenderingContext.RGBA : WebGL2RenderingContext.SRGB8_ALPHA8;
            this.context.texImage2D(image.type, image.miplevel, internalformat, WebGL2RenderingContext.RGBA, WebGL2RenderingContext.UNSIGNED_BYTE, image.image);
            const generateMips = image.shouldGenerateMips();

            this.setSampler(gltfSampler, gltfTex.type, generateMips);

            if (textureInfo.generateMips && generateMips)
            {
                // Until this point, images can be assumed to be power of two.
                switch (gltfSampler.minFilter)
                {
                case WebGL2RenderingContext.NEAREST_MIPMAP_NEAREST:
                case WebGL2RenderingContext.NEAREST_MIPMAP_LINEAR:
                case WebGL2RenderingContext.LINEAR_MIPMAP_NEAREST:
                case WebGL2RenderingContext.LINEAR_MIPMAP_LINEAR:
                    this.context.generateMipmap(gltfTex.type);
                    break;
                }
            }

            gltfTex.initialized = true;
        }

        return gltfTex.initialized;
    }

    setIndices(gltf, accessorIndex)
    {
        let gltfAccessor = gltf.accessors[accessorIndex];

        if (gltfAccessor.glBuffer === undefined)
        {
            gltfAccessor.glBuffer = this.context.createBuffer();

            let data = gltfAccessor.getTypedView(gltf);

            if (data === undefined)
            {
                return false;
            }

            this.context.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, gltfAccessor.glBuffer);
            this.context.bufferData(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, data, WebGL2RenderingContext.STATIC_DRAW);
        }
        else
        {
            this.context.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, gltfAccessor.glBuffer);
        }

        return true;
    }

    enableAttribute(gltf, attributeLocation, gltfAccessor)
    {
        if (attributeLocation === -1)
        {
            console.warn("Tried to access unknown attribute");
            return false;
        }

        if(gltfAccessor.bufferView === undefined)
        {
            console.warn("Tried to access undefined bufferview");
            return true;
        }

        let gltfBufferView = gltf.bufferViews[gltfAccessor.bufferView];

        if (gltfAccessor.glBuffer === undefined)
        {
            gltfAccessor.glBuffer = this.context.createBuffer();

            let data = gltfAccessor.getTypedView(gltf);

            if (data === undefined)
            {
                return false;
            }

            this.context.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, gltfAccessor.glBuffer);
            this.context.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, data, WebGL2RenderingContext.STATIC_DRAW);
        }
        else
        {
            this.context.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, gltfAccessor.glBuffer);
        }

        this.context.vertexAttribPointer(attributeLocation, gltfAccessor.getComponentCount(gltfAccessor.type), gltfAccessor.componentType, gltfAccessor.normalized, gltfBufferView.byteStride, 0);
        this.context.enableVertexAttribArray(attributeLocation);

        return true;
    }

    compileShader(shaderIdentifier, isVert, shaderSource)
    {
        const shader = this.context.createShader(isVert ? WebGL2RenderingContext.VERTEX_SHADER : WebGL2RenderingContext.FRAGMENT_SHADER);
        this.context.shaderSource(shader, shaderSource);
        this.context.compileShader(shader);
        const compiled = this.context.getShaderParameter(shader, WebGL2RenderingContext.COMPILE_STATUS);

        if (!compiled)
        {
            // output surrounding source code
            let info = "";
            const messages = this.context.getShaderInfoLog(shader).split("\n");
            for(const message of messages)
            {
                info += message + "\n";
                const matches = message.match(/(?:(?:WARNING)|(?:ERROR)): [0-9]*:([0-9]*).*/i);
                if (matches && matches.length > 1)
                {
                    const lineNumber = parseInt(matches[1]) - 1;
                    const lines = shaderSource.split("\n");

                    for(let i = Math.max(0, lineNumber - 2); i < Math.min(lines.length, lineNumber + 3); i++)
                    {
                        if (lineNumber === i)
                        {
                            info += "->";
                        }
                        info += "\t" + lines[i] + "\n";
                    }
                }
            }

            throw new Error("Could not compile WebGL program '" + shaderIdentifier + "'. \n\n" + info);
        }

        return shader;
    }

    linkProgram(vertex, fragment)
    {
        let program = this.context.createProgram();
        this.context.attachShader(program, vertex);
        this.context.attachShader(program, fragment);
        this.context.linkProgram(program);

        if (!this.context.getProgramParameter(program, WebGL2RenderingContext.LINK_STATUS))
        {
            var info = this.context.getProgramInfoLog(program);
            throw new Error('Could not link WebGL program. \n\n' + info);
        }

        return program;
    }

    //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
    setSampler(gltfSamplerObj, type, generateMipmaps) // TEXTURE_2D
    {
        if (generateMipmaps)
        {
            this.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_WRAP_S, gltfSamplerObj.wrapS);
            this.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_WRAP_T, gltfSamplerObj.wrapT);
        }
        else
        {
            this.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_WRAP_S, WebGL2RenderingContext.CLAMP_TO_EDGE);
            this.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_WRAP_T, WebGL2RenderingContext.CLAMP_TO_EDGE);
        }

        // If not mip-mapped, force to non-mip-mapped sampler.
        if (!generateMipmaps && (gltfSamplerObj.minFilter != WebGL2RenderingContext.NEAREST) && (gltfSamplerObj.minFilter != WebGL2RenderingContext.LINEAR))
        {
            if ((gltfSamplerObj.minFilter == WebGL2RenderingContext.NEAREST_MIPMAP_NEAREST) || (gltfSamplerObj.minFilter == WebGL2RenderingContext.NEAREST_MIPMAP_LINEAR))
            {
                this.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_MIN_FILTER, WebGL2RenderingContext.NEAREST);
            }
            else
            {
                this.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_MIN_FILTER, WebGL2RenderingContext.LINEAR);
            }
        }
        else
        {
            this.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_MIN_FILTER, gltfSamplerObj.minFilter);
        }
        this.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_MAG_FILTER, gltfSamplerObj.magFilter);

        if (this.context.supports_EXT_texture_filter_anisotropic)
        {
            this.context.texParameterf(type, this.context.anisotropy, this.context.maxAnisotropy); // => 16xAF
        }
    }
}
const WebGl = new gltfWebGl();

var pbrShader = "precision highp float;\n#define GLSLIFY 1\n#include <tonemapping.glsl>\n#include <textures.glsl>\n#include <functions.glsl>\n#include <brdf.glsl>\n#include <punctual.glsl>\n#include <ibl.glsl>\nout vec4 g_finalColor;\n#ifdef USE_PUNCTUAL\nuniform Light u_Lights[LIGHT_COUNT+1];\n#endif\nuniform float u_MetallicFactor;uniform float u_RoughnessFactor;uniform vec4 u_BaseColorFactor;uniform vec3 u_SpecularFactor;uniform vec4 u_DiffuseFactor;uniform float u_GlossinessFactor;uniform float u_SheenRoughnessFactor;uniform vec3 u_SheenColorFactor;uniform float u_ClearcoatFactor;uniform float u_ClearcoatRoughnessFactor;uniform float u_TransmissionFactor;uniform float u_AlphaCutoff;uniform vec3 u_Camera;\n#ifdef MATERIAL_TRANSMISSION\nuniform ivec2 u_ScreenSize;\n#endif\nstruct MaterialInfo{float perceptualRoughness;vec3 f0;float alphaRoughness;vec3 albedoColor;vec3 f90;float metallic;vec3 n;vec3 baseColor;float sheenRoughnessFactor;vec3 sheenColorFactor;vec3 clearcoatF0;vec3 clearcoatF90;float clearcoatFactor;vec3 clearcoatNormal;float clearcoatRoughness;float transmissionFactor;};NormalInfo getNormalInfo(vec3 v){vec2 UV=getNormalUV();vec3 uv_dx=dFdx(vec3(UV,0.0));vec3 uv_dy=dFdy(vec3(UV,0.0));vec3 t_=(uv_dy.t*dFdx(v_Position)-uv_dx.t*dFdy(v_Position))/(uv_dx.s*uv_dy.t-uv_dy.s*uv_dx.t);vec3 n,t,b,ng;\n#ifdef HAS_TANGENTS\nt=normalize(v_TBN[0]);b=normalize(v_TBN[1]);ng=normalize(v_TBN[2]);\n#else\n#ifdef HAS_NORMALS\nng=normalize(v_Normal);\n#else\nng=normalize(cross(dFdx(v_Position),dFdy(v_Position)));\n#endif\nt=normalize(t_-ng*dot(ng,t_));b=cross(ng,t);\n#endif\nif(gl_FrontFacing==false){t*=-1.0;b*=-1.0;ng*=-1.0;}\n#ifdef HAS_NORMAL_MAP\nn=texture(u_NormalSampler,UV).rgb*2.0-vec3(1.0);n*=vec3(u_NormalScale,u_NormalScale,1.0);n=mat3(t,b,ng)*normalize(n);\n#else\nn=ng;\n#endif\nNormalInfo info;info.ng=ng;info.t=t;info.b=b;info.n=n;return info;}vec4 getBaseColor(){vec4 baseColor=vec4(1.0,1.0,1.0,1.0);\n#if defined(MATERIAL_SPECULARGLOSSINESS)\nbaseColor=u_DiffuseFactor;\n#elif defined(MATERIAL_METALLICROUGHNESS)\nbaseColor=u_BaseColorFactor;\n#endif\n#if defined(MATERIAL_SPECULARGLOSSINESS) && defined(HAS_DIFFUSE_MAP)\nbaseColor*=texture(u_DiffuseSampler,getDiffuseUV());\n#elif defined(MATERIAL_METALLICROUGHNESS) && defined(HAS_BASE_COLOR_MAP)\nbaseColor*=texture(u_BaseColorSampler,getBaseColorUV());\n#endif\nreturn baseColor*getVertexColor();}MaterialInfo getSpecularGlossinessInfo(MaterialInfo info){info.f0=u_SpecularFactor;info.perceptualRoughness=u_GlossinessFactor;\n#ifdef HAS_SPECULAR_GLOSSINESS_MAP\nvec4 sgSample=texture(u_SpecularGlossinessSampler,getSpecularGlossinessUV());info.perceptualRoughness*=sgSample.a;info.f0*=sgSample.rgb;\n#endif\ninfo.perceptualRoughness=1.0-info.perceptualRoughness;info.albedoColor=info.baseColor.rgb*(1.0-max(max(info.f0.r,info.f0.g),info.f0.b));return info;}MaterialInfo getMetallicRoughnessInfo(MaterialInfo info,float f0_ior){info.metallic=u_MetallicFactor;info.perceptualRoughness=u_RoughnessFactor;\n#ifdef HAS_METALLIC_ROUGHNESS_MAP\nvec4 mrSample=texture(u_MetallicRoughnessSampler,getMetallicRoughnessUV());info.perceptualRoughness*=mrSample.g;info.metallic*=mrSample.b;\n#endif\nvec3 f0=vec3(f0_ior);info.albedoColor=mix(info.baseColor.rgb*(vec3(1.0)-f0),vec3(0),info.metallic);info.f0=mix(f0,info.baseColor.rgb,info.metallic);return info;}MaterialInfo getSheenInfo(MaterialInfo info){info.sheenColorFactor=u_SheenColorFactor;info.sheenRoughnessFactor=u_SheenRoughnessFactor;\n#ifdef HAS_SHEEN_COLOR_MAP\nvec4 sheenColorSample=texture(u_SheenColorSampler,getSheenColorUV());info.sheenColorFactor*=sheenColorSample.rgb;\n#endif\n#ifdef HAS_SHEEN_ROUGHNESS_MAP\nvec4 sheenRoughnessSample=texture(u_SheenRoughnessSampler,getSheenRoughnessUV());info.sheenRoughnessFactor*=sheenRoughnessSample.a;\n#endif\nreturn info;}\n#ifdef MATERIAL_TRANSMISSION\nMaterialInfo getTransmissionInfo(MaterialInfo info){info.transmissionFactor=u_TransmissionFactor;\n#ifdef HAS_TRANSMISSION_MAP\nvec4 transmissionSample=texture(u_TransmissionSampler,getTransmissionUV());info.transmissionFactor*=transmissionSample.r;\n#endif\nreturn info;}\n#endif\nMaterialInfo getClearCoatInfo(MaterialInfo info,NormalInfo normalInfo,float f0_ior){info.clearcoatFactor=u_ClearcoatFactor;info.clearcoatRoughness=u_ClearcoatRoughnessFactor;info.clearcoatF0=vec3(f0_ior);info.clearcoatF90=vec3(1.0);\n#ifdef HAS_CLEARCOAT_TEXTURE_MAP\nvec4 clearcoatSample=texture(u_ClearcoatSampler,getClearcoatUV());info.clearcoatFactor*=clearcoatSample.r;\n#endif\n#ifdef HAS_CLEARCOAT_ROUGHNESS_MAP\nvec4 clearcoatSampleRoughness=texture(u_ClearcoatRoughnessSampler,getClearcoatRoughnessUV());info.clearcoatRoughness*=clearcoatSampleRoughness.g;\n#endif\n#ifdef HAS_CLEARCOAT_NORMAL_MAP\nvec4 clearcoatSampleNormal=texture(u_ClearcoatNormalSampler,getClearcoatNormalUV());info.clearcoatNormal=normalize(clearcoatSampleNormal.xyz);\n#else\ninfo.clearcoatNormal=normalInfo.ng;\n#endif\ninfo.clearcoatRoughness=clamp(info.clearcoatRoughness,0.0,1.0);return info;}float albedoSheenScalingLUT(float NdotV,float sheenRoughnessFactor){return texture(u_SheenELUT,vec2(NdotV,sheenRoughnessFactor)).r;}void main(){vec4 baseColor=getBaseColor();\n#ifdef ALPHAMODE_OPAQUE\nbaseColor.a=1.0;\n#endif\n#ifdef MATERIAL_UNLIT\ng_finalColor=(vec4(linearTosRGB(baseColor.rgb),baseColor.a));return;\n#endif\nvec3 v=normalize(u_Camera-v_Position);NormalInfo normalInfo=getNormalInfo(v);vec3 n=normalInfo.n;vec3 t=normalInfo.t;vec3 b=normalInfo.b;float NdotV=clampedDot(n,v);float TdotV=clampedDot(t,v);float BdotV=clampedDot(b,v);MaterialInfo materialInfo;materialInfo.baseColor=baseColor.rgb;float ior=1.5;float f0_ior=0.04;\n#ifdef MATERIAL_SPECULARGLOSSINESS\nmaterialInfo=getSpecularGlossinessInfo(materialInfo);\n#endif\n#ifdef MATERIAL_METALLICROUGHNESS\nmaterialInfo=getMetallicRoughnessInfo(materialInfo,f0_ior);\n#endif\n#ifdef MATERIAL_SHEEN\nmaterialInfo=getSheenInfo(materialInfo);\n#endif\n#ifdef MATERIAL_CLEARCOAT\nmaterialInfo=getClearCoatInfo(materialInfo,normalInfo,f0_ior);\n#endif\n#ifdef MATERIAL_TRANSMISSION\nmaterialInfo=getTransmissionInfo(materialInfo);\n#endif\nmaterialInfo.perceptualRoughness=clamp(materialInfo.perceptualRoughness,0.0,1.0);materialInfo.metallic=clamp(materialInfo.metallic,0.0,1.0);materialInfo.alphaRoughness=materialInfo.perceptualRoughness*materialInfo.perceptualRoughness;float reflectance=max(max(materialInfo.f0.r,materialInfo.f0.g),materialInfo.f0.b);materialInfo.f90=vec3(clamp(reflectance*50.0,0.0,1.0));materialInfo.n=n;vec3 f_specular=vec3(0.0);vec3 f_diffuse=vec3(0.0);vec3 f_emissive=vec3(0.0);vec3 f_clearcoat=vec3(0.0);vec3 f_sheen=vec3(0.0);vec3 f_transmission=vec3(0.0);float albedoSheenScaling=1.0;\n#ifdef USE_IBL\nf_specular+=getIBLRadianceGGX(n,v,materialInfo.perceptualRoughness,materialInfo.f0);f_diffuse+=getIBLRadianceLambertian(n,materialInfo.albedoColor);\n#ifdef MATERIAL_CLEARCOAT\nf_clearcoat+=getIBLRadianceGGX(materialInfo.clearcoatNormal,v,materialInfo.clearcoatRoughness,materialInfo.clearcoatF0);\n#endif\n#ifdef MATERIAL_SHEEN\nf_sheen+=getIBLRadianceCharlie(n,v,materialInfo.sheenRoughnessFactor,materialInfo.sheenColorFactor);\n#endif\n#ifdef MATERIAL_TRANSMISSION\nvec2 normalizedFragCoord=vec2(0.0,0.0);normalizedFragCoord.x=gl_FragCoord.x/float(u_ScreenSize.x);normalizedFragCoord.y=gl_FragCoord.y/float(u_ScreenSize.y);f_transmission+=materialInfo.transmissionFactor*getIBLRadianceTransmission(n,u_Camera-v_Position,normalizedFragCoord,materialInfo.perceptualRoughness,materialInfo.baseColor,materialInfo.f0,materialInfo.f90);\n#endif\n#endif\nfloat ao=1.0;\n#ifdef HAS_OCCLUSION_MAP\nao=texture(u_OcclusionSampler,getOcclusionUV()).r;f_diffuse=mix(f_diffuse,f_diffuse*ao,u_OcclusionStrength);f_specular=mix(f_specular,f_specular*ao,u_OcclusionStrength);f_sheen=mix(f_sheen,f_sheen*ao,u_OcclusionStrength);f_clearcoat=mix(f_clearcoat,f_clearcoat*ao,u_OcclusionStrength);\n#endif\n#ifdef USE_PUNCTUAL\nfor(int i=0;i<LIGHT_COUNT;++i){Light light=u_Lights[i];vec3 pointToLight=-light.direction;float rangeAttenuation=1.0;float spotAttenuation=1.0;if(light.type!=LightType_Directional){pointToLight=light.position-v_Position;}if(light.type!=LightType_Directional){rangeAttenuation=getRangeAttenuation(light.range,length(pointToLight));}if(light.type==LightType_Spot){spotAttenuation=getSpotAttenuation(pointToLight,light.direction,light.outerConeCos,light.innerConeCos);}vec3 intensity=rangeAttenuation*spotAttenuation*light.intensity*light.color;vec3 l=normalize(pointToLight);vec3 h=normalize(l+v);float NdotL=clampedDot(n,l);float NdotV=clampedDot(n,v);float NdotH=clampedDot(n,h);float LdotH=clampedDot(l,h);float VdotH=clampedDot(v,h);if(NdotL>0.0||NdotV>0.0){f_diffuse+=intensity*NdotL*BRDF_lambertian(materialInfo.f0,materialInfo.f90,materialInfo.albedoColor,VdotH);f_specular+=intensity*NdotL*BRDF_specularGGX(materialInfo.f0,materialInfo.f90,materialInfo.alphaRoughness,VdotH,NdotL,NdotV,NdotH);\n#ifdef MATERIAL_SHEEN\nf_sheen+=intensity*getPunctualRadianceSheen(materialInfo.sheenColorFactor,materialInfo.sheenRoughnessFactor,NdotL,NdotV,NdotH);albedoSheenScaling=min(1.0-max3(materialInfo.sheenColorFactor)*albedoSheenScalingLUT(NdotV,materialInfo.sheenRoughnessFactor),1.0-max3(materialInfo.sheenColorFactor)*albedoSheenScalingLUT(NdotL,materialInfo.sheenRoughnessFactor));\n#endif\n#ifdef MATERIAL_CLEARCOAT\nf_clearcoat+=intensity*getPunctualRadianceClearCoat(materialInfo.clearcoatNormal,v,l,h,VdotH,materialInfo.clearcoatF0,materialInfo.clearcoatF90,materialInfo.clearcoatRoughness);\n#endif\n}\n#ifdef MATERIAL_TRANSMISSION\nf_transmission+=intensity*getPunctualRadianceTransmission(n,v,l,materialInfo.alphaRoughness,materialInfo.f0,materialInfo.f90,materialInfo.transmissionFactor,materialInfo.baseColor);\n#endif\n}\n#endif\nf_emissive=u_EmissiveFactor;\n#ifdef HAS_EMISSIVE_MAP\nf_emissive*=texture(u_EmissiveSampler,getEmissiveUV()).rgb;\n#endif\nvec3 color=vec3(0);float clearcoatFactor=0.0;vec3 clearcoatFresnel=vec3(0.0);\n#ifdef MATERIAL_CLEARCOAT\nclearcoatFactor=materialInfo.clearcoatFactor;clearcoatFresnel=F_Schlick(materialInfo.clearcoatF0,materialInfo.clearcoatF90,clampedDot(materialInfo.clearcoatNormal,v));\n#endif\n#ifdef MATERIAL_TRANSMISSION\nvec3 diffuse=mix(f_diffuse,f_transmission,materialInfo.transmissionFactor);\n#else\nvec3 diffuse=f_diffuse;\n#endif\ncolor=f_emissive+diffuse+f_specular;color=f_sheen+color*albedoSheenScaling;color=color*(1.0-clearcoatFactor*clearcoatFresnel)+f_clearcoat*clearcoatFactor;\n#ifndef DEBUG_OUTPUT\n#ifdef ALPHAMODE_MASK\nif(baseColor.a<u_AlphaCutoff){discard;}baseColor.a=1.0;\n#endif\ng_finalColor=vec4(toneMap(color),baseColor.a);\n#else\n#ifdef DEBUG_METALLIC\ng_finalColor.rgb=vec3(materialInfo.metallic);\n#endif\n#ifdef DEBUG_ROUGHNESS\ng_finalColor.rgb=vec3(materialInfo.perceptualRoughness);\n#endif\n#ifdef DEBUG_NORMAL\n#ifdef HAS_NORMAL_MAP\ng_finalColor.rgb=texture(u_NormalSampler,getNormalUV()).rgb;\n#else\ng_finalColor.rgb=vec3(0.5,0.5,1.0);\n#endif\n#endif\n#ifdef DEBUG_GEOMETRY_NORMAL\ng_finalColor.rgb=(normalInfo.ng+1.0)/2.0;\n#endif\n#ifdef DEBUG_WORLDSPACE_NORMAL\ng_finalColor.rgb=(n+1.0)/2.0;\n#endif\n#ifdef DEBUG_TANGENT\ng_finalColor.rgb=t*0.5+vec3(0.5);\n#endif\n#ifdef DEBUG_BITANGENT\ng_finalColor.rgb=b*0.5+vec3(0.5);\n#endif\n#ifdef DEBUG_BASECOLOR\ng_finalColor.rgb=linearTosRGB(materialInfo.baseColor);\n#endif\n#ifdef DEBUG_OCCLUSION\ng_finalColor.rgb=vec3(ao);\n#endif\n#ifdef DEBUG_F0\ng_finalColor.rgb=materialInfo.f0;\n#endif\n#ifdef DEBUG_FEMISSIVE\ng_finalColor.rgb=linearTosRGB(f_emissive);\n#endif\n#ifdef DEBUG_FSPECULAR\ng_finalColor.rgb=linearTosRGB(f_specular);\n#endif\n#ifdef DEBUG_FDIFFUSE\ng_finalColor.rgb=linearTosRGB(f_diffuse);\n#endif\n#ifdef DEBUG_FCLEARCOAT\ng_finalColor.rgb=linearTosRGB(f_clearcoat);\n#endif\n#ifdef DEBUG_FSHEEN\ng_finalColor.rgb=linearTosRGB(f_sheen);\n#endif\n#ifdef DEBUG_FTRANSMISSION\ng_finalColor.rgb=linearTosRGB(f_transmission);\n#endif\n#ifdef DEBUG_ALPHA\ng_finalColor.rgb=vec3(baseColor.a);\n#endif\ng_finalColor.a=1.0;\n#endif\n}"; // eslint-disable-line

var brdfShader = "#define GLSLIFY 1\nvec3 F_Schlick(vec3 f0,vec3 f90,float VdotH){return f0+(f90-f0)*pow(clamp(1.0-VdotH,0.0,1.0),5.0);}float V_GGX(float NdotL,float NdotV,float alphaRoughness){float alphaRoughnessSq=alphaRoughness*alphaRoughness;float GGXV=NdotL*sqrt(NdotV*NdotV*(1.0-alphaRoughnessSq)+alphaRoughnessSq);float GGXL=NdotV*sqrt(NdotL*NdotL*(1.0-alphaRoughnessSq)+alphaRoughnessSq);float GGX=GGXV+GGXL;if(GGX>0.0){return 0.5/GGX;}return 0.0;}float D_GGX(float NdotH,float alphaRoughness){float alphaRoughnessSq=alphaRoughness*alphaRoughness;float f=(NdotH*NdotH)*(alphaRoughnessSq-1.0)+1.0;return alphaRoughnessSq/(M_PI*f*f);}float lambdaSheenNumericHelper(float x,float alphaG){float oneMinusAlphaSq=(1.0-alphaG)*(1.0-alphaG);float a=mix(21.5473,25.3245,oneMinusAlphaSq);float b=mix(3.82987,3.32435,oneMinusAlphaSq);float c=mix(0.19823,0.16801,oneMinusAlphaSq);float d=mix(-1.97760,-1.27393,oneMinusAlphaSq);float e=mix(-4.32054,-4.85967,oneMinusAlphaSq);return a/(1.0+b*pow(x,c))+d*x+e;}float lambdaSheen(float cosTheta,float alphaG){if(abs(cosTheta)<0.5){return exp(lambdaSheenNumericHelper(cosTheta,alphaG));}else{return exp(2.0*lambdaSheenNumericHelper(0.5,alphaG)-lambdaSheenNumericHelper(1.0-cosTheta,alphaG));}}float V_Sheen(float NdotL,float NdotV,float sheenRoughness){sheenRoughness=max(sheenRoughness,0.000001);float alphaG=sheenRoughness*sheenRoughness;return clamp(1.0/((1.0+lambdaSheen(NdotV,alphaG)+lambdaSheen(NdotL,alphaG))*(4.0*NdotV*NdotL)),0.0,1.0);}float D_Charlie(float sheenRoughness,float NdotH){sheenRoughness=max(sheenRoughness,0.000001);float alphaG=sheenRoughness*sheenRoughness;float invR=1.0/alphaG;float cos2h=NdotH*NdotH;float sin2h=1.0-cos2h;return(2.0+invR)*pow(sin2h,invR*0.5)/(2.0*M_PI);}vec3 BRDF_lambertian(vec3 f0,vec3 f90,vec3 diffuseColor,float VdotH){return(1.0-F_Schlick(f0,f90,VdotH))*(diffuseColor/M_PI);}vec3 BRDF_specularGGX(vec3 f0,vec3 f90,float alphaRoughness,float VdotH,float NdotL,float NdotV,float NdotH){vec3 F=F_Schlick(f0,f90,VdotH);float Vis=V_GGX(NdotL,NdotV,alphaRoughness);float D=D_GGX(NdotH,alphaRoughness);return F*Vis*D;}vec3 BRDF_specularSheen(vec3 sheenColor,float sheenRoughness,float NdotL,float NdotV,float NdotH){float sheenDistribution=D_Charlie(sheenRoughness,NdotH);float sheenVisibility=V_Sheen(NdotL,NdotV,sheenRoughness);return sheenColor*sheenDistribution*sheenVisibility;}"; // eslint-disable-line

var iblShader = "#define GLSLIFY 1\nvec3 getDiffuseLight(vec3 n){return texture(u_LambertianEnvSampler,u_envRotation*n).rgb;}vec4 getSpecularSample(vec3 reflection,float lod){return textureLod(u_GGXEnvSampler,u_envRotation*reflection,lod);}vec4 getSheenSample(vec3 reflection,float lod){return textureLod(u_CharlieEnvSampler,u_envRotation*reflection,lod);}vec3 getIBLRadianceGGX(vec3 n,vec3 v,float perceptualRoughness,vec3 specularColor){float NdotV=clampedDot(n,v);float lod=clamp(perceptualRoughness*float(u_MipCount),0.0,float(u_MipCount));vec3 reflection=normalize(reflect(-v,n));vec2 brdfSamplePoint=clamp(vec2(NdotV,perceptualRoughness),vec2(0.0,0.0),vec2(1.0,1.0));vec2 brdf=texture(u_GGXLUT,brdfSamplePoint).rg;vec4 specularSample=getSpecularSample(reflection,lod);vec3 specularLight=specularSample.rgb;return specularLight*(specularColor*brdf.x+brdf.y);}vec3 getTransmissionSample(vec2 fragCoord,float perceptualRoughness){float framebufferLod=log2(float(u_TransmissionFramebufferSize.x))*perceptualRoughness;vec3 transmittedLight=textureLod(u_TransmissionFramebufferSampler,fragCoord.xy,framebufferLod).rgb;transmittedLight=sRGBToLinear(transmittedLight);return transmittedLight;}vec3 getIBLRadianceTransmission(vec3 n,vec3 v,vec2 fragCoord,float perceptualRoughness,vec3 baseColor,vec3 f0,vec3 f90){float NdotV=clampedDot(n,v);vec2 brdfSamplePoint=clamp(vec2(NdotV,perceptualRoughness),vec2(0.0,0.0),vec2(1.0,1.0));vec2 brdf=texture(u_GGXLUT,brdfSamplePoint).rg;vec3 specularColor=f0*brdf.x+f90*brdf.y;float lod=clamp(perceptualRoughness*float(u_MipCount),0.0,float(u_MipCount));vec3 transmissionVector=normalize(-v);vec3 transmittedLight=getTransmissionSample(fragCoord.xy,perceptualRoughness);return(1.0-specularColor)*transmittedLight*baseColor;}vec3 getIBLRadianceLambertian(vec3 n,vec3 diffuseColor){vec3 diffuseLight=getDiffuseLight(n);return diffuseLight*diffuseColor;}vec3 getIBLRadianceCharlie(vec3 n,vec3 v,float sheenRoughness,vec3 sheenColor){float NdotV=clampedDot(n,v);float lod=clamp(sheenRoughness*float(u_MipCount),0.0,float(u_MipCount));vec3 reflection=normalize(reflect(-v,n));vec2 brdfSamplePoint=clamp(vec2(NdotV,sheenRoughness),vec2(0.0,0.0),vec2(1.0,1.0));float brdf=texture(u_CharlieLUT,brdfSamplePoint).b;vec4 sheenSample=getSheenSample(reflection,lod);vec3 sheenLight=sheenSample.rgb;return sheenLight*sheenColor*brdf;}"; // eslint-disable-line

var punctualShader = "#define GLSLIFY 1\nstruct Light{vec3 direction;float range;vec3 color;float intensity;vec3 position;float innerConeCos;float outerConeCos;int type;float padding1;float padding2;};const int LightType_Directional=0;const int LightType_Point=1;const int LightType_Spot=2;float getRangeAttenuation(float range,float distance){if(range<=0.0){return 1.0/pow(distance,2.0);}return max(min(1.0-pow(distance/range,4.0),1.0),0.0)/pow(distance,2.0);}float getSpotAttenuation(vec3 pointToLight,vec3 spotDirection,float outerConeCos,float innerConeCos){float actualCos=dot(normalize(spotDirection),normalize(-pointToLight));if(actualCos>outerConeCos){if(actualCos<innerConeCos){return smoothstep(outerConeCos,innerConeCos,actualCos);}return 1.0;}return 0.0;}vec3 getPunctualRadianceTransmission(vec3 normal,vec3 view,vec3 pointToLight,float alphaRoughness,vec3 f0,vec3 f90,float transmissionPercentage,vec3 baseColor){vec3 n=normalize(normal);vec3 v=normalize(view);vec3 l=normalize(pointToLight);vec3 l_mirror=normalize(l+2.0*n*dot(-l,n));vec3 h=normalize(l_mirror+v);float D=D_GGX(clamp(dot(n,h),0.0,1.0),alphaRoughness);vec3 F=F_Schlick(f0,f90,clamp(dot(v,h),0.0,1.0));float T=transmissionPercentage;float Vis=V_GGX(clamp(dot(n,l_mirror),0.0,1.0),clamp(dot(n,v),0.0,1.0),alphaRoughness);vec3 f_transmission=(1.0-F)*T*baseColor*D*Vis;return f_transmission;}vec3 getPunctualRadianceClearCoat(vec3 clearcoatNormal,vec3 v,vec3 l,vec3 h,float VdotH,vec3 f0,vec3 f90,float clearcoatRoughness){float NdotL=clampedDot(clearcoatNormal,l);float NdotV=clampedDot(clearcoatNormal,v);float NdotH=clampedDot(clearcoatNormal,h);return NdotL*BRDF_specularGGX(f0,f90,clearcoatRoughness*clearcoatRoughness,VdotH,NdotL,NdotV,NdotH);}vec3 getPunctualRadianceSheen(vec3 sheenColor,float sheenRoughness,float NdotL,float NdotV,float NdotH){return NdotL*BRDF_specularSheen(sheenColor,sheenRoughness,NdotL,NdotV,NdotH);}"; // eslint-disable-line

var primitiveShader = "#define GLSLIFY 1\n#include <animation.glsl>\nin vec3 a_Position;out vec3 v_Position;\n#ifdef HAS_NORMALS\nin vec3 a_Normal;\n#endif\n#ifdef HAS_TANGENTS\nin vec4 a_Tangent;\n#endif\n#ifdef HAS_NORMALS\n#ifdef HAS_TANGENTS\nout mat3 v_TBN;\n#else\nout vec3 v_Normal;\n#endif\n#endif\n#ifdef HAS_UV_SET1\nin vec2 a_UV1;\n#endif\n#ifdef HAS_UV_SET2\nin vec2 a_UV2;\n#endif\nout vec2 v_UVCoord1;out vec2 v_UVCoord2;\n#ifdef HAS_VERTEX_COLOR_VEC3\nin vec3 a_Color;out vec3 v_Color;\n#endif\n#ifdef HAS_VERTEX_COLOR_VEC4\nin vec4 a_Color;out vec4 v_Color;\n#endif\nuniform mat4 u_ViewProjectionMatrix;uniform mat4 u_ModelMatrix;uniform mat4 u_NormalMatrix;vec4 getPosition(){vec4 pos=vec4(a_Position,1.0);\n#ifdef USE_MORPHING\npos+=getTargetPosition();\n#endif\n#ifdef USE_SKINNING\npos=getSkinningMatrix()*pos;\n#endif\nreturn pos;}\n#ifdef HAS_NORMALS\nvec3 getNormal(){vec3 normal=a_Normal;\n#ifdef USE_MORPHING\nnormal+=getTargetNormal();\n#endif\n#ifdef USE_SKINNING\nnormal=mat3(getSkinningNormalMatrix())*normal;\n#endif\nreturn normalize(normal);}\n#endif\n#ifdef HAS_TANGENTS\nvec3 getTangent(){vec3 tangent=a_Tangent.xyz;\n#ifdef USE_MORPHING\ntangent+=getTargetTangent();\n#endif\n#ifdef USE_SKINNING\ntangent=mat3(getSkinningMatrix())*tangent;\n#endif\nreturn normalize(tangent);}\n#endif\nvoid main(){vec4 pos=u_ModelMatrix*getPosition();v_Position=vec3(pos.xyz)/pos.w;\n#ifdef HAS_NORMALS\n#ifdef HAS_TANGENTS\nvec3 tangent=getTangent();vec3 normalW=normalize(vec3(u_NormalMatrix*vec4(getNormal(),0.0)));vec3 tangentW=normalize(vec3(u_ModelMatrix*vec4(tangent,0.0)));vec3 bitangentW=cross(normalW,tangentW)*a_Tangent.w;v_TBN=mat3(tangentW,bitangentW,normalW);\n#else\nv_Normal=normalize(vec3(u_NormalMatrix*vec4(getNormal(),0.0)));\n#endif\n#endif\nv_UVCoord1=vec2(0.0,0.0);v_UVCoord2=vec2(0.0,0.0);\n#ifdef HAS_UV_SET1\nv_UVCoord1=a_UV1;\n#endif\n#ifdef HAS_UV_SET2\nv_UVCoord2=a_UV2;\n#endif\n#if defined(HAS_VERTEX_COLOR_VEC3) || defined(HAS_VERTEX_COLOR_VEC4)\nv_Color=a_Color;\n#endif\ngl_Position=u_ViewProjectionMatrix*pos;}"; // eslint-disable-line

var texturesShader = "#define GLSLIFY 1\nin vec2 v_UVCoord1;in vec2 v_UVCoord2;uniform int u_MipCount;uniform samplerCube u_LambertianEnvSampler;uniform samplerCube u_GGXEnvSampler;uniform sampler2D u_GGXLUT;uniform samplerCube u_CharlieEnvSampler;uniform sampler2D u_CharlieLUT;uniform sampler2D u_SheenELUT;uniform mat3 u_envRotation;uniform sampler2D u_NormalSampler;uniform float u_NormalScale;uniform int u_NormalUVSet;uniform mat3 u_NormalUVTransform;uniform vec3 u_EmissiveFactor;uniform sampler2D u_EmissiveSampler;uniform int u_EmissiveUVSet;uniform mat3 u_EmissiveUVTransform;uniform sampler2D u_OcclusionSampler;uniform int u_OcclusionUVSet;uniform float u_OcclusionStrength;uniform mat3 u_OcclusionUVTransform;uniform sampler2D u_BaseColorSampler;uniform int u_BaseColorUVSet;uniform mat3 u_BaseColorUVTransform;uniform sampler2D u_MetallicRoughnessSampler;uniform int u_MetallicRoughnessUVSet;uniform mat3 u_MetallicRoughnessUVTransform;uniform sampler2D u_DiffuseSampler;uniform int u_DiffuseUVSet;uniform mat3 u_DiffuseUVTransform;uniform sampler2D u_SpecularGlossinessSampler;uniform int u_SpecularGlossinessUVSet;uniform mat3 u_SpecularGlossinessUVTransform;uniform sampler2D u_ClearcoatSampler;uniform int u_ClearcoatUVSet;uniform mat3 u_ClearcoatUVTransform;uniform sampler2D u_ClearcoatRoughnessSampler;uniform int u_ClearcoatRoughnessUVSet;uniform mat3 u_ClearcoatRoughnessUVTransform;uniform sampler2D u_ClearcoatNormalSampler;uniform int u_ClearcoatNormalUVSet;uniform mat3 u_ClearcoatNormalUVTransform;uniform sampler2D u_SheenColorSampler;uniform int u_SheenColorUVSet;uniform mat3 u_SheenColorUVTransform;uniform sampler2D u_SheenRoughnessSampler;uniform int u_SheenRoughnessUVSet;uniform mat3 u_SheenRoughnessUVTransform;uniform sampler2D u_TransmissionSampler;uniform int u_TransmissionUVSet;uniform mat3 u_TransmissionUVTransform;uniform sampler2D u_TransmissionFramebufferSampler;uniform ivec2 u_TransmissionFramebufferSize;vec2 getNormalUV(){vec3 uv=vec3(u_NormalUVSet<1 ? v_UVCoord1 : v_UVCoord2,1.0);\n#ifdef HAS_NORMAL_UV_TRANSFORM\nuv*=u_NormalUVTransform;\n#endif\nreturn uv.xy;}vec2 getEmissiveUV(){vec3 uv=vec3(u_EmissiveUVSet<1 ? v_UVCoord1 : v_UVCoord2,1.0);\n#ifdef HAS_EMISSIVE_UV_TRANSFORM\nuv*=u_EmissiveUVTransform;\n#endif\nreturn uv.xy;}vec2 getOcclusionUV(){vec3 uv=vec3(u_OcclusionUVSet<1 ? v_UVCoord1 : v_UVCoord2,1.0);\n#ifdef HAS_OCCLUSION_UV_TRANSFORM\nuv*=u_OcclusionUVTransform;\n#endif\nreturn uv.xy;}vec2 getBaseColorUV(){vec3 uv=vec3(u_BaseColorUVSet<1 ? v_UVCoord1 : v_UVCoord2,1.0);\n#ifdef HAS_BASECOLOR_UV_TRANSFORM\nuv*=u_BaseColorUVTransform;\n#endif\nreturn uv.xy;}vec2 getMetallicRoughnessUV(){vec3 uv=vec3(u_MetallicRoughnessUVSet<1 ? v_UVCoord1 : v_UVCoord2,1.0);\n#ifdef HAS_METALLICROUGHNESS_UV_TRANSFORM\nuv*=u_MetallicRoughnessUVTransform;\n#endif\nreturn uv.xy;}vec2 getSpecularGlossinessUV(){vec3 uv=vec3(u_SpecularGlossinessUVSet<1 ? v_UVCoord1 : v_UVCoord2,1.0);\n#ifdef HAS_SPECULARGLOSSINESS_UV_TRANSFORM\nuv*=u_SpecularGlossinessUVTransform;\n#endif\nreturn uv.xy;}vec2 getDiffuseUV(){vec3 uv=vec3(u_DiffuseUVSet<1 ? v_UVCoord1 : v_UVCoord2,1.0);\n#ifdef HAS_DIFFUSE_UV_TRANSFORM\nuv*=u_DiffuseUVTransform;\n#endif\nreturn uv.xy;}vec2 getClearcoatUV(){vec3 uv=vec3(u_ClearcoatUVSet<1 ? v_UVCoord1 : v_UVCoord2,1.0);\n#ifdef HAS_CLEARCOAT_UV_TRANSFORM\nuv*=u_ClearcoatUVTransform;\n#endif\nreturn uv.xy;}vec2 getClearcoatRoughnessUV(){vec3 uv=vec3(u_ClearcoatRoughnessUVSet<1 ? v_UVCoord1 : v_UVCoord2,1.0);\n#ifdef HAS_CLEARCOATROUGHNESS_UV_TRANSFORM\nuv*=u_ClearcoatRoughnessUVTransform;\n#endif\nreturn uv.xy;}vec2 getClearcoatNormalUV(){vec3 uv=vec3(u_ClearcoatNormalUVSet<1 ? v_UVCoord1 : v_UVCoord2,1.0);\n#ifdef HAS_CLEARCOATNORMAL_UV_TRANSFORM\nuv*=u_ClearcoatNormalUVTransform;\n#endif\nreturn uv.xy;}vec2 getSheenColorUV(){vec3 uv=vec3(u_SheenColorUVSet<1 ? v_UVCoord1 : v_UVCoord2,1.0);\n#ifdef HAS_SHEENCOLOR_UV_TRANSFORM\nuv*=u_SheenColorUVTransform;\n#endif\nreturn uv.xy;}vec2 getSheenRoughnessUV(){vec3 uv=vec3(u_SheenRoughnessUVSet<1 ? v_UVCoord1 : v_UVCoord2,1.0);\n#ifdef HAS_SHEENROUGHNESS_UV_TRANSFORM\nuv*=u_SheenRoughnessUVTransform;\n#endif\nreturn uv.xy;}vec2 getTransmissionUV(){vec3 uv=vec3(u_TransmissionUVSet<1 ? v_UVCoord1 : v_UVCoord2,1.0);\n#ifdef HAS_TRANSMISSION_UV_TRANSFORM\nuv*=u_TransmissionUVTransform;\n#endif\nreturn uv.xy;}"; // eslint-disable-line

var tonemappingShader = "#define GLSLIFY 1\nuniform float u_Exposure;const float GAMMA=2.2;const float INV_GAMMA=1.0/GAMMA;const mat3 ACESInputMat=mat3(0.59719,0.07600,0.02840,0.35458,0.90834,0.13383,0.04823,0.01566,0.83777);const mat3 ACESOutputMat=mat3(1.60475,-0.10208,-0.00327,-0.53108,1.10813,-0.07276,-0.07367,-0.00605,1.07602);vec3 linearTosRGB(vec3 color){return pow(color,vec3(INV_GAMMA));}vec3 sRGBToLinear(vec3 srgbIn){return vec3(pow(srgbIn.xyz,vec3(GAMMA)));}vec4 sRGBToLinear(vec4 srgbIn){return vec4(sRGBToLinear(srgbIn.xyz),srgbIn.w);}vec3 toneMapACESFast(vec3 color){color*=0.6;const float A=2.51;const float B=0.03;const float C=2.43;const float D=0.59;const float E=0.14;return clamp((color*(A*color+B))/(color*(C*color+D)+E),0.0,1.0);}vec3 RRTAndODTFit(vec3 color){vec3 a=color*(color+0.0245786)-0.000090537;vec3 b=color*(0.983729*color+0.4329510)+0.238081;return a/b;}vec3 toneMapACES(vec3 color){color=ACESInputMat*color;color=RRTAndODTFit(color);color=ACESOutputMat*color;color=clamp(color,0.0,1.0);return color;}vec3 toneMap(vec3 color){color*=u_Exposure;\n#ifdef TONEMAP_ACES_FAST\nreturn linearTosRGB(toneMapACESFast(color));\n#endif\n#ifdef TONEMAP_ACES\nreturn linearTosRGB(toneMapACES(color));\n#endif\nreturn linearTosRGB(color);}"; // eslint-disable-line

var shaderFunctions = "#define GLSLIFY 1\nconst float M_PI=3.141592653589793;in vec3 v_Position;\n#ifdef HAS_NORMALS\n#ifdef HAS_TANGENTS\nin mat3 v_TBN;\n#else\nin vec3 v_Normal;\n#endif\n#endif\n#ifdef HAS_VERTEX_COLOR_VEC3\nin vec3 v_Color;\n#endif\n#ifdef HAS_VERTEX_COLOR_VEC4\nin vec4 v_Color;\n#endif\nvec4 getVertexColor(){vec4 color=vec4(1.0,1.0,1.0,1.0);\n#ifdef HAS_VERTEX_COLOR_VEC3\ncolor.rgb=v_Color.rgb;\n#endif\n#ifdef HAS_VERTEX_COLOR_VEC4\ncolor=v_Color;\n#endif\nreturn color;}struct NormalInfo{vec3 ng;vec3 n;vec3 t;vec3 b;};float clampedDot(vec3 x,vec3 y){return clamp(dot(x,y),0.0,1.0);}float max3(vec3 v){return max(max(v.x,v.y),v.z);}"; // eslint-disable-line

var animationShader = "#define GLSLIFY 1\n#ifdef HAS_TARGET_POSITION0\nin vec3 a_Target_Position0;\n#endif\n#ifdef HAS_TARGET_POSITION1\nin vec3 a_Target_Position1;\n#endif\n#ifdef HAS_TARGET_POSITION2\nin vec3 a_Target_Position2;\n#endif\n#ifdef HAS_TARGET_POSITION3\nin vec3 a_Target_Position3;\n#endif\n#ifdef HAS_TARGET_POSITION4\nin vec3 a_Target_Position4;\n#endif\n#ifdef HAS_TARGET_POSITION5\nin vec3 a_Target_Position5;\n#endif\n#ifdef HAS_TARGET_POSITION6\nin vec3 a_Target_Position6;\n#endif\n#ifdef HAS_TARGET_POSITION7\nin vec3 a_Target_Position7;\n#endif\n#ifdef HAS_TARGET_NORMAL0\nin vec3 a_Target_Normal0;\n#endif\n#ifdef HAS_TARGET_NORMAL1\nin vec3 a_Target_Normal1;\n#endif\n#ifdef HAS_TARGET_NORMAL2\nin vec3 a_Target_Normal2;\n#endif\n#ifdef HAS_TARGET_NORMAL3\nin vec3 a_Target_Normal3;\n#endif\n#ifdef HAS_TARGET_TANGENT0\nin vec3 a_Target_Tangent0;\n#endif\n#ifdef HAS_TARGET_TANGENT1\nin vec3 a_Target_Tangent1;\n#endif\n#ifdef HAS_TARGET_TANGENT2\nin vec3 a_Target_Tangent2;\n#endif\n#ifdef HAS_TARGET_TANGENT3\nin vec3 a_Target_Tangent3;\n#endif\n#ifdef USE_MORPHING\nuniform float u_morphWeights[WEIGHT_COUNT];\n#endif\n#ifdef HAS_JOINT_SET1\nin vec4 a_Joint1;\n#endif\n#ifdef HAS_JOINT_SET2\nin vec4 a_Joint2;\n#endif\n#ifdef HAS_WEIGHT_SET1\nin vec4 a_Weight1;\n#endif\n#ifdef HAS_WEIGHT_SET2\nin vec4 a_Weight2;\n#endif\n#ifdef USE_SKINNING\nuniform mat4 u_jointMatrix[JOINT_COUNT];uniform mat4 u_jointNormalMatrix[JOINT_COUNT];\n#endif\n#ifdef USE_SKINNING\nmat4 getSkinningMatrix(){mat4 skin=mat4(0);\n#if defined(HAS_WEIGHT_SET1) && defined(HAS_JOINT_SET1)\nskin+=a_Weight1.x*u_jointMatrix[int(a_Joint1.x)]+a_Weight1.y*u_jointMatrix[int(a_Joint1.y)]+a_Weight1.z*u_jointMatrix[int(a_Joint1.z)]+a_Weight1.w*u_jointMatrix[int(a_Joint1.w)];\n#endif\n#if defined(HAS_WEIGHT_SET2) && defined(HAS_JOINT_SET2)\nskin+=a_Weight2.x*u_jointMatrix[int(a_Joint2.x)]+a_Weight2.y*u_jointMatrix[int(a_Joint2.y)]+a_Weight2.z*u_jointMatrix[int(a_Joint2.z)]+a_Weight2.w*u_jointMatrix[int(a_Joint2.w)];\n#endif\nreturn skin;}mat4 getSkinningNormalMatrix(){mat4 skin=mat4(0);\n#if defined(HAS_WEIGHT_SET1) && defined(HAS_JOINT_SET1)\nskin+=a_Weight1.x*u_jointNormalMatrix[int(a_Joint1.x)]+a_Weight1.y*u_jointNormalMatrix[int(a_Joint1.y)]+a_Weight1.z*u_jointNormalMatrix[int(a_Joint1.z)]+a_Weight1.w*u_jointNormalMatrix[int(a_Joint1.w)];\n#endif\n#if defined(HAS_WEIGHT_SET2) && defined(HAS_JOINT_SET2)\nskin+=a_Weight2.x*u_jointNormalMatrix[int(a_Joint2.x)]+a_Weight2.y*u_jointNormalMatrix[int(a_Joint2.y)]+a_Weight2.z*u_jointNormalMatrix[int(a_Joint2.z)]+a_Weight2.w*u_jointNormalMatrix[int(a_Joint2.w)];\n#endif\nreturn skin;}\n#endif\n#ifdef USE_MORPHING\nvec4 getTargetPosition(){vec4 pos=vec4(0);\n#ifdef HAS_TARGET_POSITION0\npos.xyz+=u_morphWeights[0]*a_Target_Position0;\n#endif\n#ifdef HAS_TARGET_POSITION1\npos.xyz+=u_morphWeights[1]*a_Target_Position1;\n#endif\n#ifdef HAS_TARGET_POSITION2\npos.xyz+=u_morphWeights[2]*a_Target_Position2;\n#endif\n#ifdef HAS_TARGET_POSITION3\npos.xyz+=u_morphWeights[3]*a_Target_Position3;\n#endif\n#ifdef HAS_TARGET_POSITION4\npos.xyz+=u_morphWeights[4]*a_Target_Position4;\n#endif\nreturn pos;}vec3 getTargetNormal(){vec3 normal=vec3(0);\n#ifdef HAS_TARGET_NORMAL0\nnormal+=u_morphWeights[0]*a_Target_Normal0;\n#endif\n#ifdef HAS_TARGET_NORMAL1\nnormal+=u_morphWeights[1]*a_Target_Normal1;\n#endif\n#ifdef HAS_TARGET_NORMAL2\nnormal+=u_morphWeights[2]*a_Target_Normal2;\n#endif\n#ifdef HAS_TARGET_NORMAL3\nnormal+=u_morphWeights[3]*a_Target_Normal3;\n#endif\n#ifdef HAS_TARGET_NORMAL4\nnormal+=u_morphWeights[4]*a_Target_Normal4;\n#endif\nreturn normal;}vec3 getTargetTangent(){vec3 tangent=vec3(0);\n#ifdef HAS_TARGET_TANGENT0\ntangent+=u_morphWeights[0]*a_Target_Tangent0;\n#endif\n#ifdef HAS_TARGET_TANGENT1\ntangent+=u_morphWeights[1]*a_Target_Tangent1;\n#endif\n#ifdef HAS_TARGET_TANGENT2\ntangent+=u_morphWeights[2]*a_Target_Tangent2;\n#endif\n#ifdef HAS_TARGET_TANGENT3\ntangent+=u_morphWeights[3]*a_Target_Tangent3;\n#endif\n#ifdef HAS_TARGET_TANGENT4\ntangent+=u_morphWeights[4]*a_Target_Tangent4;\n#endif\nreturn tangent;}\n#endif\n"; // eslint-disable-line

class gltfRenderer
{
    constructor(context)
    {
        this.shader = undefined; // current shader

        this.currentWidth = 0;
        this.currentHeight = 0;

        this.webGl = new gltfWebGl();
        this.webGl.context = context;

        // create render target for non transmission materials
        this.opaqueRenderTexture = 0;
        this.opaqueFramebuffer = 0;
        this.opaqueDepthTexture = 0;
        this.opaqueFramebufferWidth = 1024;
        this.opaqueFramebufferHeight = 1024;

        const shaderSources = new Map();
        shaderSources.set("primitive.vert", primitiveShader);
        shaderSources.set("pbr.frag", pbrShader);
        shaderSources.set("brdf.glsl", brdfShader);
        shaderSources.set("ibl.glsl", iblShader);
        shaderSources.set("punctual.glsl", punctualShader);
        shaderSources.set("tonemapping.glsl", tonemappingShader);
        shaderSources.set("textures.glsl", texturesShader);
        shaderSources.set("functions.glsl", shaderFunctions);
        shaderSources.set("animation.glsl", animationShader);

        this.shaderCache = new ShaderCache(shaderSources, this.webGl);

        let requiredWebglExtensions = [
            "EXT_texture_filter_anisotropic",
            "OES_texture_float_linear"
        ];

        this.webGl.loadWebGlExtensions(requiredWebglExtensions);

        this.visibleLights = [];

        this.viewMatrix = create$1();
        this.projMatrix = create$1();
        this.viewProjectionMatrix = create$1();

        this.currentCameraPosition = create$2();

        this.init();
    }

    /////////////////////////////////////////////////////////////////////
    // Render glTF scene graph
    /////////////////////////////////////////////////////////////////////

    // app state
    init()
    {
        const context = this.webGl.context;
        context.pixelStorei(WebGL2RenderingContext.UNPACK_COLORSPACE_CONVERSION_WEBGL, WebGL2RenderingContext.NONE);
        context.enable(WebGL2RenderingContext.DEPTH_TEST);
        context.depthFunc(WebGL2RenderingContext.LEQUAL);
        context.colorMask(true, true, true, true);
        context.clearDepth(1.0);

        this.opaqueRenderTexture = context.createTexture();
        context.bindTexture(context.TEXTURE_2D, this.opaqueRenderTexture);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR_MIPMAP_LINEAR);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
        context.texImage2D( context.TEXTURE_2D,
                            0,
                            context.RGBA,
                            this.opaqueFramebufferWidth,
                            this.opaqueFramebufferHeight,
                            0,
                            context.RGBA,
                            context.UNSIGNED_BYTE,
                            null);
        context.bindTexture(context.TEXTURE_2D, null);

        this.opaqueDepthTexture = context.createTexture();
        context.bindTexture(context.TEXTURE_2D, this.opaqueDepthTexture);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
        context.texImage2D( context.TEXTURE_2D,
                            0,
                            context.DEPTH_COMPONENT16,
                            this.opaqueFramebufferWidth,
                            this.opaqueFramebufferHeight,
                            0,
                            context.DEPTH_COMPONENT,
                            context.UNSIGNED_SHORT,
                            null);
        context.bindTexture(context.TEXTURE_2D, null);

        this.opaqueFramebuffer = context.createFramebuffer();
        context.bindFramebuffer(context.FRAMEBUFFER, this.opaqueFramebuffer);
        context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, this.opaqueRenderTexture, 0);
        context.framebufferTexture2D(context.FRAMEBUFFER, context.DEPTH_ATTACHMENT, context.TEXTURE_2D, this.opaqueDepthTexture, 0);
        context.viewport(0, 0, this.currentWidth, this.currentHeight);
        context.bindFramebuffer(context.FRAMEBUFFER, null);

    }

    resize(width, height)
    {
        if (this.currentWidth !== width || this.currentHeight !== height)
        {
            this.currentHeight = height;
            this.currentWidth = width;
            this.webGl.context.viewport(0, 0, width, height);
        }
    }

    // frame state
    clearFrame(clearColor)
    {
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, null);
        this.webGl.context.clearColor(clearColor[0] / 255.0, clearColor[1] / 255.0, clearColor[2] / 255.0, 1.0);
        this.webGl.context.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT);
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, this.opaqueFramebuffer);
        this.webGl.context.clearColor(clearColor[0] / 255.0, clearColor[1] / 255.0, clearColor[2] / 255.0, 1.0);
        this.webGl.context.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT);
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, null);
    }

    // render complete gltf scene with given camera
    drawScene(state, scene)
    {
        let currentCamera = undefined;

        if (state.cameraIndex === undefined)
        {
            currentCamera = state.userCamera;
        }
        else
        {
            currentCamera = state.gltf.cameras[state.cameraIndex].clone();
        }

        currentCamera.aspectRatio = this.currentWidth / this.currentHeight;

        this.projMatrix = currentCamera.getProjectionMatrix();
        this.viewMatrix = currentCamera.getViewMatrix(state.gltf);
        this.currentCameraPosition = currentCamera.getPosition(state.gltf);

        this.visibleLights = this.getVisibleLights(state.gltf, scene);

        multiply$1(this.viewProjectionMatrix, this.projMatrix, this.viewMatrix);

        const nodes = scene.gatherNodes(state.gltf);

        // Update skins.
        for (const node of nodes)
        {
            if (node.mesh !== undefined && node.skin !== undefined)
            {
                this.updateSkin(state, node);
            }
        }

        // collect drawables by essentially zipping primitives (for geometry and material)
        // and nodes for the transform
        const drawables = nodes
            .filter(node => node.mesh !== undefined)
            .reduce((acc, node) => acc.concat(state.gltf.meshes[node.mesh].primitives.map( primitive => {
                return  {node: node, primitive: primitive};
            })), [])
            .filter(({node, primitive}) => primitive.material !== undefined);

        // opaque drawables don't need sorting
        const opaqueDrawables = drawables
            .filter(({node, primitive}) => state.gltf.materials[primitive.material].alphaMode !== "BLEND"
                && (state.gltf.materials[primitive.material].extensions === undefined
                    || state.gltf.materials[primitive.material].extensions.KHR_materials_transmission === undefined));

        // transparent drawables need sorting before they can be drawn
        let transparentDrawables = drawables
            .filter(({node, primitive}) => state.gltf.materials[primitive.material].alphaMode === "BLEND"
                && (state.gltf.materials[primitive.material].extensions === undefined
                    || state.gltf.materials[primitive.material].extensions.KHR_materials_transmission === undefined));
        transparentDrawables = currentCamera.sortPrimitivesByDepth(state.gltf, transparentDrawables);

        // Render transmission sample texture
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, this.opaqueFramebuffer);

        this.webGl.context.viewport(0, 0, this.opaqueFramebufferWidth, this.opaqueFramebufferHeight);
        for (const drawable of opaqueDrawables)
        {
            this.drawPrimitive(state, drawable.primitive, drawable.node, this.viewProjectionMatrix);
        }
        for (const drawable of transparentDrawables)
        {
            this.drawPrimitive(state, drawable.primitive, drawable.node, this.viewProjectionMatrix);
        }

        //Reset Viewport
        this.webGl.context.viewport(0, 0,  this.currentWidth, this.currentHeight);

        //Create Framebuffer Mipmaps
        this.webGl.context.bindTexture(this.webGl.context.TEXTURE_2D, this.opaqueRenderTexture);
        this.webGl.context.generateMipmap(this.webGl.context.TEXTURE_2D);

        // Render to canvas
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, null);
        for (const drawable of opaqueDrawables)
        {
            this.drawPrimitive(state, drawable.primitive, drawable.node, this.viewProjectionMatrix);
        }
        for (const drawable of transparentDrawables)
        {
            this.drawPrimitive(state, drawable.primitive, drawable.node, this.viewProjectionMatrix);
        }

        // filter materials with transmission extension
        let transmissionDrawables = drawables
            .filter(({node, primitive}) => state.gltf.materials[primitive.material].extensions !== undefined
                && state.gltf.materials[primitive.material].extensions.KHR_materials_transmission !== undefined);
        transmissionDrawables = currentCamera.sortPrimitivesByDepth(state.gltf, transmissionDrawables);
        for (const drawable of transmissionDrawables)
        {
            this.drawPrimitive(state, drawable.primitive, drawable.node, this.viewProjectionMatrix, this.opaqueRenderTexture);
        }
    }

    // vertices with given material
    drawPrimitive(state, primitive, node, viewProjectionMatrix, transmissionSampleTexture)
    {
        if (primitive.skip) return;

        let material;
        if(primitive.mappings !== undefined && state.variant != "default")
        {
            const names = state.gltf.variants.map(obj => obj.name);
            const idx = names.indexOf(state.variant);
            let materialIdx = primitive.material;
            primitive.mappings.forEach(element => {
                if(element.variants.indexOf(idx) >= 0)
                {
                    materialIdx = element.material;
                }
            });
            material = state.gltf.materials[materialIdx];
        }
        else
        {
            material = state.gltf.materials[primitive.material];
        }

        //select shader permutation, compile and link program.

        let vertDefines = [];
        this.pushVertParameterDefines(vertDefines, state.renderingParameters, state.gltf, node, primitive);
        vertDefines = primitive.getDefines().concat(vertDefines);

        let fragDefines = material.getDefines().concat(vertDefines);
        this.pushFragParameterDefines(fragDefines, state);

        const fragmentHash = this.shaderCache.selectShader(material.getShaderIdentifier(), fragDefines);
        const vertexHash = this.shaderCache.selectShader(primitive.getShaderIdentifier(), vertDefines);

        if (fragmentHash && vertexHash)
        {
            this.shader = this.shaderCache.getShaderProgram(fragmentHash, vertexHash);
        }

        if (this.shader === undefined)
        {
            return;
        }

        this.webGl.context.useProgram(this.shader.program);

        if (state.renderingParameters.usePunctual)
        {
            this.applyLights(state.gltf);
        }

        // update model dependant matrices once per node
        this.shader.updateUniform("u_ViewProjectionMatrix", viewProjectionMatrix);
        this.shader.updateUniform("u_ModelMatrix", node.worldTransform);
        this.shader.updateUniform("u_NormalMatrix", node.normalMatrix, false);
        this.shader.updateUniform("u_Exposure", state.renderingParameters.exposure, false);
        this.shader.updateUniform("u_Camera", this.currentCameraPosition, false);

        this.updateAnimationUniforms(state, node, primitive);

        if (determinant(node.worldTransform) < 0.0)
        {
            this.webGl.context.frontFace(WebGL2RenderingContext.CW);
        }
        else
        {
            this.webGl.context.frontFace(WebGL2RenderingContext.CCW);
        }

        if (material.doubleSided)
        {
            this.webGl.context.disable(WebGL2RenderingContext.CULL_FACE);
        }
        else
        {
            this.webGl.context.enable(WebGL2RenderingContext.CULL_FACE);
        }

        if (material.alphaMode === 'BLEND')
        {
            this.webGl.context.enable(WebGL2RenderingContext.BLEND);
            this.webGl.context.blendFuncSeparate(WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA, WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA);
            this.webGl.context.blendEquation(WebGL2RenderingContext.FUNC_ADD);
        }
        else
        {
            this.webGl.context.disable(WebGL2RenderingContext.BLEND);
        }

        const drawIndexed = primitive.indices !== undefined;
        if (drawIndexed)
        {
            if (!this.webGl.setIndices(state.gltf, primitive.indices))
            {
                return;
            }
        }

        let vertexCount = 0;
        for (const attribute of primitive.glAttributes)
        {
            const gltfAccessor = state.gltf.accessors[attribute.accessor];
            vertexCount = gltfAccessor.count;

            const location = this.shader.getAttributeLocation(attribute.name);
            if (location < 0)
            {
                continue; // only skip this attribute
            }
            if (!this.webGl.enableAttribute(state.gltf, location, gltfAccessor))
            {
                return; // skip this primitive
            }
        }

        for (let [uniform, val] of material.getProperties().entries())
        {
            this.shader.updateUniform(uniform, val);
        }

        for (let i = 0; i < material.textures.length; ++i)
        {
            let info = material.textures[i];
            const location = this.shader.getUniformLocation(info.samplerName);
            if (location < 0)
            {
                continue; // only skip this texture
            }
            if (!this.webGl.setTexture(location, state.gltf, info, i)) // binds texture and sampler
            {
                return; // skip this material
            }
        }

        let textureCount = material.textures.length;
        if (state.renderingParameters.useIBL && state.environment !== undefined)
        {
            textureCount = this.applyEnvironmentMap(state, textureCount);
        }

        if (state.renderingParameters.usePunctual)
        {
            this.webGl.setTexture(this.shader.getUniformLocation("u_SheenELUT"), state.gltf, state.environment.sheenELUT, textureCount++);
        }

        if(transmissionSampleTexture !== undefined)
        {
            this.webGl.context.activeTexture(WebGL2RenderingContext.TEXTURE0 + textureCount);
            this.webGl.context.bindTexture(this.webGl.context.TEXTURE_2D, this.opaqueRenderTexture);
            this.webGl.context.uniform1i(this.shader.getUniformLocation("u_TransmissionFramebufferSampler"), textureCount);
            textureCount++;

            this.webGl.context.uniform2i(this.shader.getUniformLocation("u_ScreenSize"), this.currentWidth, this.currentHeight);
            this.webGl.context.uniform2i(this.shader.getUniformLocation("u_TransmissionFramebufferSize"), this.opaqueFramebufferWidth, this.opaqueFramebufferHeight);
        }

        if (drawIndexed)
        {
            const indexAccessor = state.gltf.accessors[primitive.indices];
            this.webGl.context.drawElements(primitive.mode, indexAccessor.count, indexAccessor.componentType, 0);
        }
        else
        {
            this.webGl.context.drawArrays(primitive.mode, 0, vertexCount);
        }

        for (const attribute of primitive.glAttributes)
        {
            const location = this.shader.getAttributeLocation(attribute.name);
            if (location < 0)
            {
                continue; // skip this attribute
            }
            this.webGl.context.disableVertexAttribArray(location);
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
        return lights;
    }

    updateSkin(state, node)
    {
        if (state.renderingParameters.skinning && state.gltf.skins !== undefined)
        {
            const skin = state.gltf.skins[node.skin];
            skin.computeJoints(state.gltf, node);
        }
    }

    pushVertParameterDefines(vertDefines, parameters, gltf, node, primitive)
    {
        // skinning
        if (parameters.skinning && node.skin !== undefined && primitive.hasWeights && primitive.hasJoints)
        {
            const skin = gltf.skins[node.skin];

            vertDefines.push("USE_SKINNING 1");
            vertDefines.push("JOINT_COUNT " + skin.jointMatrices.length);
        }

        // morphing
        if (parameters.morphing && node.mesh !== undefined && primitive.targets.length > 0)
        {
            const mesh = gltf.meshes[node.mesh];
            if (mesh.weights !== undefined && mesh.weights.length > 0)
            {
                vertDefines.push("USE_MORPHING 1");
                vertDefines.push("WEIGHT_COUNT " + Math.min(mesh.weights.length, 8));
            }
        }
    }

    updateAnimationUniforms(state, node, primitive)
    {
        if (state.renderingParameters.skinning && node.skin !== undefined && primitive.hasWeights && primitive.hasJoints)
        {
            const skin = state.gltf.skins[node.skin];

            this.shader.updateUniform("u_jointMatrix", skin.jointMatrices);
            if(primitive.hasNormals)
            {
                this.shader.updateUniform("u_jointNormalMatrix", skin.jointNormalMatrices);
            }
        }

        if (state.renderingParameters.morphing && node.mesh !== undefined && primitive.targets.length > 0)
        {
            const mesh = state.gltf.meshes[node.mesh];
            if (mesh.weights !== undefined && mesh.weights.length > 0)
            {
                this.shader.updateUniformArray("u_morphWeights", mesh.weights);
            }
        }
    }

    pushFragParameterDefines(fragDefines, state)
    {
        if (state.renderingParameters.usePunctual)
        {
            fragDefines.push("USE_PUNCTUAL 1");
            fragDefines.push("LIGHT_COUNT " + this.visibleLights.length);
        }

        if (state.renderingParameters.useIBL && state.environment)
        {
            fragDefines.push("USE_IBL 1");
        }

        switch (state.renderingParameters.toneMap)
        {
        case (ToneMaps.ACES_FAST):
            fragDefines.push("TONEMAP_ACES_FAST 1");
            break;
        case (ToneMaps.ACES):
            fragDefines.push("TONEMAP_ACES 1");
            break;
        }

        if (state.renderingParameters.debugOutput !== DebugOutput.NONE)
        {
            fragDefines.push("DEBUG_OUTPUT 1");
        }

        switch (state.renderingParameters.debugOutput)
        {
        case (DebugOutput.METALLIC):
            fragDefines.push("DEBUG_METALLIC 1");
            break;
        case (DebugOutput.ROUGHNESS):
            fragDefines.push("DEBUG_ROUGHNESS 1");
            break;
        case (DebugOutput.NORMAL):
            fragDefines.push("DEBUG_NORMAL 1");
            break;
        case (DebugOutput.WORLDSPACENORMAL):
            fragDefines.push("DEBUG_WORLDSPACE_NORMAL 1");
            break;
        case (DebugOutput.GEOMETRYNORMAL):
            fragDefines.push("DEBUG_GEOMETRY_NORMAL 1");
            break;
        case (DebugOutput.TANGENT):
            fragDefines.push("DEBUG_TANGENT 1");
            break;
        case (DebugOutput.BITANGENT):
            fragDefines.push("DEBUG_BITANGENT 1");
            break;
        case (DebugOutput.BASECOLOR):
            fragDefines.push("DEBUG_BASECOLOR 1");
            break;
        case (DebugOutput.OCCLUSION):
            fragDefines.push("DEBUG_OCCLUSION 1");
            break;
        case (DebugOutput.EMISSIVE):
            fragDefines.push("DEBUG_FEMISSIVE 1");
            break;
        case (DebugOutput.SPECULAR):
            fragDefines.push("DEBUG_FSPECULAR 1");
            break;
        case (DebugOutput.DIFFUSE):
            fragDefines.push("DEBUG_FDIFFUSE 1");
            break;
        case (DebugOutput.THICKNESS):
            fragDefines.push("DEBUG_THICKNESS 1");
            break;
        case (DebugOutput.CLEARCOAT):
            fragDefines.push("DEBUG_FCLEARCOAT 1");
            break;
        case (DebugOutput.SHEEN):
            fragDefines.push("DEBUG_FSHEEN 1");
            break;
        case (DebugOutput.SUBSURFACE):
            fragDefines.push("DEBUG_FSUBSURFACE 1");
            break;
        case (DebugOutput.TRANSMISSION):
            fragDefines.push("DEBUG_FTRANSMISSION 1");
            break;
        case (DebugOutput.F0):
            fragDefines.push("DEBUG_F0 1");
            break;
        case (DebugOutput.ALPHA):
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

        if (uniformLights.length > 0)
        {
            this.shader.updateUniform("u_Lights", uniformLights);
        }
    }

    applyEnvironmentMap(state, texSlotOffset)
    {
        const environment = state.environment;
        this.webGl.setTexture(this.shader.getUniformLocation("u_LambertianEnvSampler"), environment, environment.diffuseEnvMap, texSlotOffset++);

        this.webGl.setTexture(this.shader.getUniformLocation("u_GGXEnvSampler"), environment, environment.specularEnvMap, texSlotOffset++);
        this.webGl.setTexture(this.shader.getUniformLocation("u_GGXLUT"), environment, environment.lut, texSlotOffset++);

        this.webGl.setTexture(this.shader.getUniformLocation("u_CharlieEnvSampler"), environment, environment.sheenEnvMap, texSlotOffset++);
        this.webGl.setTexture(this.shader.getUniformLocation("u_CharlieLUT"), environment, environment.sheenLUT, texSlotOffset++);

        this.shader.updateUniform("u_MipCount", environment.mipCount);

        let rotMatrix4 = create$1();
        rotateY(rotMatrix4, rotMatrix4,  state.renderingParameters.environmentRotation / 180.0 * Math.PI);
        let rotMatrix3 = create();
        fromMat4(rotMatrix3, rotMatrix4);
        this.shader.updateUniform("u_envRotation", rotMatrix3);

        return texSlotOffset;
    }

    destroy()
    {
        this.shaderCache.destroy();
    }
}

class GltfView
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.context = this.canvas.getContext("webgl2", { alpha: false, antialias: true });
        this.renderer = new gltfRenderer(this.context);
    }

    createState()
    {
        return new GltfState();
    }

    renderFrameToCanvas(state)
    {
        // TODO: this should probably not be done here
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.renderer.resize(this.canvas.width, this.canvas.height);

        this.renderer.clearFrame(state.renderingParameters.clearColor);

        if(state.gltf === undefined)
        {
            return;
        }

        const scene = state.gltf.scenes[state.sceneIndex];

        scene.applyTransformHierarchy(state.gltf);

        this.renderer.drawScene(state, scene);
    }

    animate(state)
    {
        if(state.gltf === undefined)
        {
            return;
        }

        if(state.gltf.animations !== undefined && state.animationIndices !== undefined && !state.animationTimer.paused)
        {
            const t = state.animationTimer.elapsedSec();

            const animations = state.animationIndices.map(index => {
                return state.gltf.animations[index];
            }).filter(animation => animation !== undefined);

            for(const animation of animations)
            {
                animation.advance(state.gltf, t);
            }
        }
    }

    // gatherStatistics collects information about the GltfState such as the number of rendererd meshes or triangles
    gatherStatistics(state)
    {
        if(state.gltf === undefined)
        {
            return;
        }

        // gather information from the active scene
        const scene = state.gltf.scenes[state.sceneIndex];
        const nodes = scene.gatherNodes(state.gltf);
        const activeMeshes = nodes.filter(node => node.mesh !== undefined).map(node => state.gltf.meshes[node.mesh]);
        const activePrimitives = activeMeshes
            .reduce((acc, mesh) => acc.concat(mesh.primitives), [])
            .filter(primitive => primitive.material !== undefined);
        const activeMaterials = [... new Set(activePrimitives.map(primitive => state.gltf.materials[primitive.material]))];
        const opaqueMaterials = activeMaterials.filter(material => material.alphaMode !== "BLEND");
        const transparentMaterials = activeMaterials.filter(material => material.alphaMode === "BLEND");
        const faceCount = activePrimitives
            .map(primitive => {
                const verticesCount = state.gltf.accessors[primitive.indices].count;
                if (verticesCount === 0)
                {
                    return 0;
                }

                // convert vertex count to point, line or triangle count
                switch (primitive.mode) {
                case WebGLRenderingContext.POINTS:
                    return verticesCount;
                case WebGLRenderingContext.LINES:
                    return verticesCount / 2;
                case WebGLRenderingContext.LINE_LOOP:
                    return verticesCount;
                case WebGLRenderingContext.LINE_STRIP:
                    return verticesCount - 1;
                case WebGLRenderingContext.TRIANGLES:
                    return verticesCount / 3;
                case WebGLRenderingContext.TRIANGLE_STRIP:
                case WebGLRenderingContext.TRIANGLE_FAN:
                    return verticesCount - 2;
                }
            })
            .reduce((acc, faceCount) => acc += faceCount);

        // assemble statistics object
        return {
            meshCount: activeMeshes.length,
            faceCount: faceCount,
            opaqueMaterialsCount: opaqueMaterials.length,
            transparentMaterialsCount: transparentMaterials.length
        };
    }

    async startRendering(state)
    {
        const update = () =>
        {
            this.animate(state);
            this.renderFrameToCanvas(state);
            window.requestAnimationFrame(update);
        };

        // After this start executing render loop.
        window.requestAnimationFrame(update);
    }
}

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var axios = createCommonjsModule(function (module, exports) {
/* axios v0.18.1 | (c) 2019 by Matt Zabriskie */
(function webpackUniversalModuleDefinition(root, factory) {
	module.exports = factory();
})(commonjsGlobal, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {
	
	var utils = __webpack_require__(2);
	var bind = __webpack_require__(3);
	var Axios = __webpack_require__(5);
	var defaults = __webpack_require__(6);
	
	/**
	 * Create an instance of Axios
	 *
	 * @param {Object} defaultConfig The default config for the instance
	 * @return {Axios} A new instance of Axios
	 */
	function createInstance(defaultConfig) {
	  var context = new Axios(defaultConfig);
	  var instance = bind(Axios.prototype.request, context);
	
	  // Copy axios.prototype to instance
	  utils.extend(instance, Axios.prototype, context);
	
	  // Copy context to instance
	  utils.extend(instance, context);
	
	  return instance;
	}
	
	// Create the default instance to be exported
	var axios = createInstance(defaults);
	
	// Expose Axios class to allow class inheritance
	axios.Axios = Axios;
	
	// Factory for creating new instances
	axios.create = function create(instanceConfig) {
	  return createInstance(utils.merge(defaults, instanceConfig));
	};
	
	// Expose Cancel & CancelToken
	axios.Cancel = __webpack_require__(22);
	axios.CancelToken = __webpack_require__(23);
	axios.isCancel = __webpack_require__(19);
	
	// Expose all/spread
	axios.all = function all(promises) {
	  return Promise.all(promises);
	};
	axios.spread = __webpack_require__(24);
	
	module.exports = axios;
	
	// Allow use of default import syntax in TypeScript
	module.exports.default = axios;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {
	
	var bind = __webpack_require__(3);
	var isBuffer = __webpack_require__(4);
	
	/*global toString:true*/
	
	// utils is a library of generic helper functions non-specific to axios
	
	var toString = Object.prototype.toString;
	
	/**
	 * Determine if a value is an Array
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Array, otherwise false
	 */
	function isArray(val) {
	  return toString.call(val) === '[object Array]';
	}
	
	/**
	 * Determine if a value is an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
	 */
	function isArrayBuffer(val) {
	  return toString.call(val) === '[object ArrayBuffer]';
	}
	
	/**
	 * Determine if a value is a FormData
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an FormData, otherwise false
	 */
	function isFormData(val) {
	  return (typeof FormData !== 'undefined') && (val instanceof FormData);
	}
	
	/**
	 * Determine if a value is a view on an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
	 */
	function isArrayBufferView(val) {
	  var result;
	  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
	    result = ArrayBuffer.isView(val);
	  } else {
	    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
	  }
	  return result;
	}
	
	/**
	 * Determine if a value is a String
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a String, otherwise false
	 */
	function isString(val) {
	  return typeof val === 'string';
	}
	
	/**
	 * Determine if a value is a Number
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Number, otherwise false
	 */
	function isNumber(val) {
	  return typeof val === 'number';
	}
	
	/**
	 * Determine if a value is undefined
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if the value is undefined, otherwise false
	 */
	function isUndefined(val) {
	  return typeof val === 'undefined';
	}
	
	/**
	 * Determine if a value is an Object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Object, otherwise false
	 */
	function isObject(val) {
	  return val !== null && typeof val === 'object';
	}
	
	/**
	 * Determine if a value is a Date
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Date, otherwise false
	 */
	function isDate(val) {
	  return toString.call(val) === '[object Date]';
	}
	
	/**
	 * Determine if a value is a File
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a File, otherwise false
	 */
	function isFile(val) {
	  return toString.call(val) === '[object File]';
	}
	
	/**
	 * Determine if a value is a Blob
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Blob, otherwise false
	 */
	function isBlob(val) {
	  return toString.call(val) === '[object Blob]';
	}
	
	/**
	 * Determine if a value is a Function
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Function, otherwise false
	 */
	function isFunction(val) {
	  return toString.call(val) === '[object Function]';
	}
	
	/**
	 * Determine if a value is a Stream
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Stream, otherwise false
	 */
	function isStream(val) {
	  return isObject(val) && isFunction(val.pipe);
	}
	
	/**
	 * Determine if a value is a URLSearchParams object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
	 */
	function isURLSearchParams(val) {
	  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
	}
	
	/**
	 * Trim excess whitespace off the beginning and end of a string
	 *
	 * @param {String} str The String to trim
	 * @returns {String} The String freed of excess whitespace
	 */
	function trim(str) {
	  return str.replace(/^\s*/, '').replace(/\s*$/, '');
	}
	
	/**
	 * Determine if we're running in a standard browser environment
	 *
	 * This allows axios to run in a web worker, and react-native.
	 * Both environments support XMLHttpRequest, but not fully standard globals.
	 *
	 * web workers:
	 *  typeof window -> undefined
	 *  typeof document -> undefined
	 *
	 * react-native:
	 *  navigator.product -> 'ReactNative'
	 */
	function isStandardBrowserEnv() {
	  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
	    return false;
	  }
	  return (
	    typeof window !== 'undefined' &&
	    typeof document !== 'undefined'
	  );
	}
	
	/**
	 * Iterate over an Array or an Object invoking a function for each item.
	 *
	 * If `obj` is an Array callback will be called passing
	 * the value, index, and complete array for each item.
	 *
	 * If 'obj' is an Object callback will be called passing
	 * the value, key, and complete object for each property.
	 *
	 * @param {Object|Array} obj The object to iterate
	 * @param {Function} fn The callback to invoke for each item
	 */
	function forEach(obj, fn) {
	  // Don't bother if no value provided
	  if (obj === null || typeof obj === 'undefined') {
	    return;
	  }
	
	  // Force an array if not already something iterable
	  if (typeof obj !== 'object') {
	    /*eslint no-param-reassign:0*/
	    obj = [obj];
	  }
	
	  if (isArray(obj)) {
	    // Iterate over array values
	    for (var i = 0, l = obj.length; i < l; i++) {
	      fn.call(null, obj[i], i, obj);
	    }
	  } else {
	    // Iterate over object keys
	    for (var key in obj) {
	      if (Object.prototype.hasOwnProperty.call(obj, key)) {
	        fn.call(null, obj[key], key, obj);
	      }
	    }
	  }
	}
	
	/**
	 * Accepts varargs expecting each argument to be an object, then
	 * immutably merges the properties of each object and returns result.
	 *
	 * When multiple objects contain the same key the later object in
	 * the arguments list will take precedence.
	 *
	 * Example:
	 *
	 * ```js
	 * var result = merge({foo: 123}, {foo: 456});
	 * console.log(result.foo); // outputs 456
	 * ```
	 *
	 * @param {Object} obj1 Object to merge
	 * @returns {Object} Result of all merge properties
	 */
	function merge(/* obj1, obj2, obj3, ... */) {
	  var result = {};
	  function assignValue(val, key) {
	    if (typeof result[key] === 'object' && typeof val === 'object') {
	      result[key] = merge(result[key], val);
	    } else {
	      result[key] = val;
	    }
	  }
	
	  for (var i = 0, l = arguments.length; i < l; i++) {
	    forEach(arguments[i], assignValue);
	  }
	  return result;
	}
	
	/**
	 * Extends object a by mutably adding to it the properties of object b.
	 *
	 * @param {Object} a The object to be extended
	 * @param {Object} b The object to copy properties from
	 * @param {Object} thisArg The object to bind function to
	 * @return {Object} The resulting value of object a
	 */
	function extend(a, b, thisArg) {
	  forEach(b, function assignValue(val, key) {
	    if (thisArg && typeof val === 'function') {
	      a[key] = bind(val, thisArg);
	    } else {
	      a[key] = val;
	    }
	  });
	  return a;
	}
	
	module.exports = {
	  isArray: isArray,
	  isArrayBuffer: isArrayBuffer,
	  isBuffer: isBuffer,
	  isFormData: isFormData,
	  isArrayBufferView: isArrayBufferView,
	  isString: isString,
	  isNumber: isNumber,
	  isObject: isObject,
	  isUndefined: isUndefined,
	  isDate: isDate,
	  isFile: isFile,
	  isBlob: isBlob,
	  isFunction: isFunction,
	  isStream: isStream,
	  isURLSearchParams: isURLSearchParams,
	  isStandardBrowserEnv: isStandardBrowserEnv,
	  forEach: forEach,
	  merge: merge,
	  extend: extend,
	  trim: trim
	};


/***/ }),
/* 3 */
/***/ (function(module, exports) {
	
	module.exports = function bind(fn, thisArg) {
	  return function wrap() {
	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }
	    return fn.apply(thisArg, args);
	  };
	};


/***/ }),
/* 4 */
/***/ (function(module, exports) {

	/*!
	 * Determine if an object is a Buffer
	 *
	 * @author   Feross Aboukhadijeh <https://feross.org>
	 * @license  MIT
	 */
	
	module.exports = function isBuffer (obj) {
	  return obj != null && obj.constructor != null &&
	    typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
	};


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {
	
	var defaults = __webpack_require__(6);
	var utils = __webpack_require__(2);
	var InterceptorManager = __webpack_require__(16);
	var dispatchRequest = __webpack_require__(17);
	
	/**
	 * Create a new instance of Axios
	 *
	 * @param {Object} instanceConfig The default config for the instance
	 */
	function Axios(instanceConfig) {
	  this.defaults = instanceConfig;
	  this.interceptors = {
	    request: new InterceptorManager(),
	    response: new InterceptorManager()
	  };
	}
	
	/**
	 * Dispatch a request
	 *
	 * @param {Object} config The config specific for this request (merged with this.defaults)
	 */
	Axios.prototype.request = function request(config) {
	  /*eslint no-param-reassign:0*/
	  // Allow for axios('example/url'[, config]) a la fetch API
	  if (typeof config === 'string') {
	    config = utils.merge({
	      url: arguments[0]
	    }, arguments[1]);
	  }
	
	  config = utils.merge(defaults, {method: 'get'}, this.defaults, config);
	  config.method = config.method.toLowerCase();
	
	  // Hook up interceptors middleware
	  var chain = [dispatchRequest, undefined];
	  var promise = Promise.resolve(config);
	
	  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
	    chain.unshift(interceptor.fulfilled, interceptor.rejected);
	  });
	
	  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
	    chain.push(interceptor.fulfilled, interceptor.rejected);
	  });
	
	  while (chain.length) {
	    promise = promise.then(chain.shift(), chain.shift());
	  }
	
	  return promise;
	};
	
	// Provide aliases for supported request methods
	utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, config) {
	    return this.request(utils.merge(config || {}, {
	      method: method,
	      url: url
	    }));
	  };
	});
	
	utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, data, config) {
	    return this.request(utils.merge(config || {}, {
	      method: method,
	      url: url,
	      data: data
	    }));
	  };
	});
	
	module.exports = Axios;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {
	
	var utils = __webpack_require__(2);
	var normalizeHeaderName = __webpack_require__(7);
	
	var DEFAULT_CONTENT_TYPE = {
	  'Content-Type': 'application/x-www-form-urlencoded'
	};
	
	function setContentTypeIfUnset(headers, value) {
	  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
	    headers['Content-Type'] = value;
	  }
	}
	
	function getDefaultAdapter() {
	  var adapter;
	  if (typeof XMLHttpRequest !== 'undefined') {
	    // For browsers use XHR adapter
	    adapter = __webpack_require__(8);
	  } else if (typeof process !== 'undefined') {
	    // For node use HTTP adapter
	    adapter = __webpack_require__(8);
	  }
	  return adapter;
	}
	
	var defaults = {
	  adapter: getDefaultAdapter(),
	
	  transformRequest: [function transformRequest(data, headers) {
	    normalizeHeaderName(headers, 'Content-Type');
	    if (utils.isFormData(data) ||
	      utils.isArrayBuffer(data) ||
	      utils.isBuffer(data) ||
	      utils.isStream(data) ||
	      utils.isFile(data) ||
	      utils.isBlob(data)
	    ) {
	      return data;
	    }
	    if (utils.isArrayBufferView(data)) {
	      return data.buffer;
	    }
	    if (utils.isURLSearchParams(data)) {
	      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
	      return data.toString();
	    }
	    if (utils.isObject(data)) {
	      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
	      return JSON.stringify(data);
	    }
	    return data;
	  }],
	
	  transformResponse: [function transformResponse(data) {
	    /*eslint no-param-reassign:0*/
	    if (typeof data === 'string') {
	      try {
	        data = JSON.parse(data);
	      } catch (e) { /* Ignore */ }
	    }
	    return data;
	  }],
	
	  /**
	   * A timeout in milliseconds to abort a request. If set to 0 (default) a
	   * timeout is not created.
	   */
	  timeout: 0,
	
	  xsrfCookieName: 'XSRF-TOKEN',
	  xsrfHeaderName: 'X-XSRF-TOKEN',
	
	  maxContentLength: -1,
	
	  validateStatus: function validateStatus(status) {
	    return status >= 200 && status < 300;
	  }
	};
	
	defaults.headers = {
	  common: {
	    'Accept': 'application/json, text/plain, */*'
	  }
	};
	
	utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
	  defaults.headers[method] = {};
	});
	
	utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
	});
	
	module.exports = defaults;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {
	
	var utils = __webpack_require__(2);
	
	module.exports = function normalizeHeaderName(headers, normalizedName) {
	  utils.forEach(headers, function processHeader(value, name) {
	    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
	      headers[normalizedName] = value;
	      delete headers[name];
	    }
	  });
	};


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {
	
	var utils = __webpack_require__(2);
	var settle = __webpack_require__(9);
	var buildURL = __webpack_require__(12);
	var parseHeaders = __webpack_require__(13);
	var isURLSameOrigin = __webpack_require__(14);
	var createError = __webpack_require__(10);
	
	module.exports = function xhrAdapter(config) {
	  return new Promise(function dispatchXhrRequest(resolve, reject) {
	    var requestData = config.data;
	    var requestHeaders = config.headers;
	
	    if (utils.isFormData(requestData)) {
	      delete requestHeaders['Content-Type']; // Let the browser set it
	    }
	
	    var request = new XMLHttpRequest();
	
	    // HTTP basic authentication
	    if (config.auth) {
	      var username = config.auth.username || '';
	      var password = config.auth.password || '';
	      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
	    }
	
	    request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);
	
	    // Set the request timeout in MS
	    request.timeout = config.timeout;
	
	    // Listen for ready state
	    request.onreadystatechange = function handleLoad() {
	      if (!request || request.readyState !== 4) {
	        return;
	      }
	
	      // The request errored out and we didn't get a response, this will be
	      // handled by onerror instead
	      // With one exception: request that using file: protocol, most browsers
	      // will return status as 0 even though it's a successful request
	      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
	        return;
	      }
	
	      // Prepare the response
	      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
	      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
	      var response = {
	        data: responseData,
	        status: request.status,
	        statusText: request.statusText,
	        headers: responseHeaders,
	        config: config,
	        request: request
	      };
	
	      settle(resolve, reject, response);
	
	      // Clean up request
	      request = null;
	    };
	
	    // Handle low level network errors
	    request.onerror = function handleError() {
	      // Real errors are hidden from us by the browser
	      // onerror should only fire if it's a network error
	      reject(createError('Network Error', config, null, request));
	
	      // Clean up request
	      request = null;
	    };
	
	    // Handle timeout
	    request.ontimeout = function handleTimeout() {
	      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED',
	        request));
	
	      // Clean up request
	      request = null;
	    };
	
	    // Add xsrf header
	    // This is only done if running in a standard browser environment.
	    // Specifically not if we're in a web worker, or react-native.
	    if (utils.isStandardBrowserEnv()) {
	      var cookies = __webpack_require__(15);
	
	      // Add xsrf header
	      var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ?
	          cookies.read(config.xsrfCookieName) :
	          undefined;
	
	      if (xsrfValue) {
	        requestHeaders[config.xsrfHeaderName] = xsrfValue;
	      }
	    }
	
	    // Add headers to the request
	    if ('setRequestHeader' in request) {
	      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
	        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
	          // Remove Content-Type if data is undefined
	          delete requestHeaders[key];
	        } else {
	          // Otherwise add header to the request
	          request.setRequestHeader(key, val);
	        }
	      });
	    }
	
	    // Add withCredentials to request if needed
	    if (config.withCredentials) {
	      request.withCredentials = true;
	    }
	
	    // Add responseType to request if needed
	    if (config.responseType) {
	      try {
	        request.responseType = config.responseType;
	      } catch (e) {
	        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
	        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
	        if (config.responseType !== 'json') {
	          throw e;
	        }
	      }
	    }
	
	    // Handle progress if needed
	    if (typeof config.onDownloadProgress === 'function') {
	      request.addEventListener('progress', config.onDownloadProgress);
	    }
	
	    // Not all browsers support upload events
	    if (typeof config.onUploadProgress === 'function' && request.upload) {
	      request.upload.addEventListener('progress', config.onUploadProgress);
	    }
	
	    if (config.cancelToken) {
	      // Handle cancellation
	      config.cancelToken.promise.then(function onCanceled(cancel) {
	        if (!request) {
	          return;
	        }
	
	        request.abort();
	        reject(cancel);
	        // Clean up request
	        request = null;
	      });
	    }
	
	    if (requestData === undefined) {
	      requestData = null;
	    }
	
	    // Send the request
	    request.send(requestData);
	  });
	};


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {
	
	var createError = __webpack_require__(10);
	
	/**
	 * Resolve or reject a Promise based on response status.
	 *
	 * @param {Function} resolve A function that resolves the promise.
	 * @param {Function} reject A function that rejects the promise.
	 * @param {object} response The response.
	 */
	module.exports = function settle(resolve, reject, response) {
	  var validateStatus = response.config.validateStatus;
	  // Note: status is not exposed by XDomainRequest
	  if (!response.status || !validateStatus || validateStatus(response.status)) {
	    resolve(response);
	  } else {
	    reject(createError(
	      'Request failed with status code ' + response.status,
	      response.config,
	      null,
	      response.request,
	      response
	    ));
	  }
	};


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {
	
	var enhanceError = __webpack_require__(11);
	
	/**
	 * Create an Error with the specified message, config, error code, request and response.
	 *
	 * @param {string} message The error message.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 * @param {Object} [request] The request.
	 * @param {Object} [response] The response.
	 * @returns {Error} The created error.
	 */
	module.exports = function createError(message, config, code, request, response) {
	  var error = new Error(message);
	  return enhanceError(error, config, code, request, response);
	};


/***/ }),
/* 11 */
/***/ (function(module, exports) {
	
	/**
	 * Update an Error with the specified config, error code, and response.
	 *
	 * @param {Error} error The error to update.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 * @param {Object} [request] The request.
	 * @param {Object} [response] The response.
	 * @returns {Error} The error.
	 */
	module.exports = function enhanceError(error, config, code, request, response) {
	  error.config = config;
	  if (code) {
	    error.code = code;
	  }
	  error.request = request;
	  error.response = response;
	  return error;
	};


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {
	
	var utils = __webpack_require__(2);
	
	function encode(val) {
	  return encodeURIComponent(val).
	    replace(/%40/gi, '@').
	    replace(/%3A/gi, ':').
	    replace(/%24/g, '$').
	    replace(/%2C/gi, ',').
	    replace(/%20/g, '+').
	    replace(/%5B/gi, '[').
	    replace(/%5D/gi, ']');
	}
	
	/**
	 * Build a URL by appending params to the end
	 *
	 * @param {string} url The base of the url (e.g., http://www.google.com)
	 * @param {object} [params] The params to be appended
	 * @returns {string} The formatted url
	 */
	module.exports = function buildURL(url, params, paramsSerializer) {
	  /*eslint no-param-reassign:0*/
	  if (!params) {
	    return url;
	  }
	
	  var serializedParams;
	  if (paramsSerializer) {
	    serializedParams = paramsSerializer(params);
	  } else if (utils.isURLSearchParams(params)) {
	    serializedParams = params.toString();
	  } else {
	    var parts = [];
	
	    utils.forEach(params, function serialize(val, key) {
	      if (val === null || typeof val === 'undefined') {
	        return;
	      }
	
	      if (utils.isArray(val)) {
	        key = key + '[]';
	      } else {
	        val = [val];
	      }
	
	      utils.forEach(val, function parseValue(v) {
	        if (utils.isDate(v)) {
	          v = v.toISOString();
	        } else if (utils.isObject(v)) {
	          v = JSON.stringify(v);
	        }
	        parts.push(encode(key) + '=' + encode(v));
	      });
	    });
	
	    serializedParams = parts.join('&');
	  }
	
	  if (serializedParams) {
	    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
	  }
	
	  return url;
	};


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {
	
	var utils = __webpack_require__(2);
	
	// Headers whose duplicates are ignored by node
	// c.f. https://nodejs.org/api/http.html#http_message_headers
	var ignoreDuplicateOf = [
	  'age', 'authorization', 'content-length', 'content-type', 'etag',
	  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
	  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
	  'referer', 'retry-after', 'user-agent'
	];
	
	/**
	 * Parse headers into an object
	 *
	 * ```
	 * Date: Wed, 27 Aug 2014 08:58:49 GMT
	 * Content-Type: application/json
	 * Connection: keep-alive
	 * Transfer-Encoding: chunked
	 * ```
	 *
	 * @param {String} headers Headers needing to be parsed
	 * @returns {Object} Headers parsed into an object
	 */
	module.exports = function parseHeaders(headers) {
	  var parsed = {};
	  var key;
	  var val;
	  var i;
	
	  if (!headers) { return parsed; }
	
	  utils.forEach(headers.split('\n'), function parser(line) {
	    i = line.indexOf(':');
	    key = utils.trim(line.substr(0, i)).toLowerCase();
	    val = utils.trim(line.substr(i + 1));
	
	    if (key) {
	      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
	        return;
	      }
	      if (key === 'set-cookie') {
	        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
	      } else {
	        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
	      }
	    }
	  });
	
	  return parsed;
	};


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {
	
	var utils = __webpack_require__(2);
	
	module.exports = (
	  utils.isStandardBrowserEnv() ?
	
	  // Standard browser envs have full support of the APIs needed to test
	  // whether the request URL is of the same origin as current location.
	  (function standardBrowserEnv() {
	    var msie = /(msie|trident)/i.test(navigator.userAgent);
	    var urlParsingNode = document.createElement('a');
	    var originURL;
	
	    /**
	    * Parse a URL to discover it's components
	    *
	    * @param {String} url The URL to be parsed
	    * @returns {Object}
	    */
	    function resolveURL(url) {
	      var href = url;
	
	      if (msie) {
	        // IE needs attribute set twice to normalize properties
	        urlParsingNode.setAttribute('href', href);
	        href = urlParsingNode.href;
	      }
	
	      urlParsingNode.setAttribute('href', href);
	
	      // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
	      return {
	        href: urlParsingNode.href,
	        protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
	        host: urlParsingNode.host,
	        search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
	        hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
	        hostname: urlParsingNode.hostname,
	        port: urlParsingNode.port,
	        pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
	                  urlParsingNode.pathname :
	                  '/' + urlParsingNode.pathname
	      };
	    }
	
	    originURL = resolveURL(window.location.href);
	
	    /**
	    * Determine if a URL shares the same origin as the current location
	    *
	    * @param {String} requestURL The URL to test
	    * @returns {boolean} True if URL shares the same origin, otherwise false
	    */
	    return function isURLSameOrigin(requestURL) {
	      var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
	      return (parsed.protocol === originURL.protocol &&
	            parsed.host === originURL.host);
	    };
	  })() :
	
	  // Non standard browser envs (web workers, react-native) lack needed support.
	  (function nonStandardBrowserEnv() {
	    return function isURLSameOrigin() {
	      return true;
	    };
	  })()
	);


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {
	
	var utils = __webpack_require__(2);
	
	module.exports = (
	  utils.isStandardBrowserEnv() ?
	
	  // Standard browser envs support document.cookie
	  (function standardBrowserEnv() {
	    return {
	      write: function write(name, value, expires, path, domain, secure) {
	        var cookie = [];
	        cookie.push(name + '=' + encodeURIComponent(value));
	
	        if (utils.isNumber(expires)) {
	          cookie.push('expires=' + new Date(expires).toGMTString());
	        }
	
	        if (utils.isString(path)) {
	          cookie.push('path=' + path);
	        }
	
	        if (utils.isString(domain)) {
	          cookie.push('domain=' + domain);
	        }
	
	        if (secure === true) {
	          cookie.push('secure');
	        }
	
	        document.cookie = cookie.join('; ');
	      },
	
	      read: function read(name) {
	        var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
	        return (match ? decodeURIComponent(match[3]) : null);
	      },
	
	      remove: function remove(name) {
	        this.write(name, '', Date.now() - 86400000);
	      }
	    };
	  })() :
	
	  // Non standard browser env (web workers, react-native) lack needed support.
	  (function nonStandardBrowserEnv() {
	    return {
	      write: function write() {},
	      read: function read() { return null; },
	      remove: function remove() {}
	    };
	  })()
	);


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {
	
	var utils = __webpack_require__(2);
	
	function InterceptorManager() {
	  this.handlers = [];
	}
	
	/**
	 * Add a new interceptor to the stack
	 *
	 * @param {Function} fulfilled The function to handle `then` for a `Promise`
	 * @param {Function} rejected The function to handle `reject` for a `Promise`
	 *
	 * @return {Number} An ID used to remove interceptor later
	 */
	InterceptorManager.prototype.use = function use(fulfilled, rejected) {
	  this.handlers.push({
	    fulfilled: fulfilled,
	    rejected: rejected
	  });
	  return this.handlers.length - 1;
	};
	
	/**
	 * Remove an interceptor from the stack
	 *
	 * @param {Number} id The ID that was returned by `use`
	 */
	InterceptorManager.prototype.eject = function eject(id) {
	  if (this.handlers[id]) {
	    this.handlers[id] = null;
	  }
	};
	
	/**
	 * Iterate over all the registered interceptors
	 *
	 * This method is particularly useful for skipping over any
	 * interceptors that may have become `null` calling `eject`.
	 *
	 * @param {Function} fn The function to call for each interceptor
	 */
	InterceptorManager.prototype.forEach = function forEach(fn) {
	  utils.forEach(this.handlers, function forEachHandler(h) {
	    if (h !== null) {
	      fn(h);
	    }
	  });
	};
	
	module.exports = InterceptorManager;


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {
	
	var utils = __webpack_require__(2);
	var transformData = __webpack_require__(18);
	var isCancel = __webpack_require__(19);
	var defaults = __webpack_require__(6);
	var isAbsoluteURL = __webpack_require__(20);
	var combineURLs = __webpack_require__(21);
	
	/**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
	function throwIfCancellationRequested(config) {
	  if (config.cancelToken) {
	    config.cancelToken.throwIfRequested();
	  }
	}
	
	/**
	 * Dispatch a request to the server using the configured adapter.
	 *
	 * @param {object} config The config that is to be used for the request
	 * @returns {Promise} The Promise to be fulfilled
	 */
	module.exports = function dispatchRequest(config) {
	  throwIfCancellationRequested(config);
	
	  // Support baseURL config
	  if (config.baseURL && !isAbsoluteURL(config.url)) {
	    config.url = combineURLs(config.baseURL, config.url);
	  }
	
	  // Ensure headers exist
	  config.headers = config.headers || {};
	
	  // Transform request data
	  config.data = transformData(
	    config.data,
	    config.headers,
	    config.transformRequest
	  );
	
	  // Flatten headers
	  config.headers = utils.merge(
	    config.headers.common || {},
	    config.headers[config.method] || {},
	    config.headers || {}
	  );
	
	  utils.forEach(
	    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
	    function cleanHeaderConfig(method) {
	      delete config.headers[method];
	    }
	  );
	
	  var adapter = config.adapter || defaults.adapter;
	
	  return adapter(config).then(function onAdapterResolution(response) {
	    throwIfCancellationRequested(config);
	
	    // Transform response data
	    response.data = transformData(
	      response.data,
	      response.headers,
	      config.transformResponse
	    );
	
	    return response;
	  }, function onAdapterRejection(reason) {
	    if (!isCancel(reason)) {
	      throwIfCancellationRequested(config);
	
	      // Transform response data
	      if (reason && reason.response) {
	        reason.response.data = transformData(
	          reason.response.data,
	          reason.response.headers,
	          config.transformResponse
	        );
	      }
	    }
	
	    return Promise.reject(reason);
	  });
	};


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {
	
	var utils = __webpack_require__(2);
	
	/**
	 * Transform the data for a request or a response
	 *
	 * @param {Object|String} data The data to be transformed
	 * @param {Array} headers The headers for the request or response
	 * @param {Array|Function} fns A single function or Array of functions
	 * @returns {*} The resulting transformed data
	 */
	module.exports = function transformData(data, headers, fns) {
	  /*eslint no-param-reassign:0*/
	  utils.forEach(fns, function transform(fn) {
	    data = fn(data, headers);
	  });
	
	  return data;
	};


/***/ }),
/* 19 */
/***/ (function(module, exports) {
	
	module.exports = function isCancel(value) {
	  return !!(value && value.__CANCEL__);
	};


/***/ }),
/* 20 */
/***/ (function(module, exports) {
	
	/**
	 * Determines whether the specified URL is absolute
	 *
	 * @param {string} url The URL to test
	 * @returns {boolean} True if the specified URL is absolute, otherwise false
	 */
	module.exports = function isAbsoluteURL(url) {
	  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
	  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
	  // by any combination of letters, digits, plus, period, or hyphen.
	  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
	};


/***/ }),
/* 21 */
/***/ (function(module, exports) {
	
	/**
	 * Creates a new URL by combining the specified URLs
	 *
	 * @param {string} baseURL The base URL
	 * @param {string} relativeURL The relative URL
	 * @returns {string} The combined URL
	 */
	module.exports = function combineURLs(baseURL, relativeURL) {
	  return relativeURL
	    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
	    : baseURL;
	};


/***/ }),
/* 22 */
/***/ (function(module, exports) {
	
	/**
	 * A `Cancel` is an object that is thrown when an operation is canceled.
	 *
	 * @class
	 * @param {string=} message The message.
	 */
	function Cancel(message) {
	  this.message = message;
	}
	
	Cancel.prototype.toString = function toString() {
	  return 'Cancel' + (this.message ? ': ' + this.message : '');
	};
	
	Cancel.prototype.__CANCEL__ = true;
	
	module.exports = Cancel;


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {
	
	var Cancel = __webpack_require__(22);
	
	/**
	 * A `CancelToken` is an object that can be used to request cancellation of an operation.
	 *
	 * @class
	 * @param {Function} executor The executor function.
	 */
	function CancelToken(executor) {
	  if (typeof executor !== 'function') {
	    throw new TypeError('executor must be a function.');
	  }
	
	  var resolvePromise;
	  this.promise = new Promise(function promiseExecutor(resolve) {
	    resolvePromise = resolve;
	  });
	
	  var token = this;
	  executor(function cancel(message) {
	    if (token.reason) {
	      // Cancellation has already been requested
	      return;
	    }
	
	    token.reason = new Cancel(message);
	    resolvePromise(token.reason);
	  });
	}
	
	/**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
	CancelToken.prototype.throwIfRequested = function throwIfRequested() {
	  if (this.reason) {
	    throw this.reason;
	  }
	};
	
	/**
	 * Returns an object that contains a new `CancelToken` and a function that, when called,
	 * cancels the `CancelToken`.
	 */
	CancelToken.source = function source() {
	  var cancel;
	  var token = new CancelToken(function executor(c) {
	    cancel = c;
	  });
	  return {
	    token: token,
	    cancel: cancel
	  };
	};
	
	module.exports = CancelToken;


/***/ }),
/* 24 */
/***/ (function(module, exports) {
	
	/**
	 * Syntactic sugar for invoking a function and expanding an array for arguments.
	 *
	 * Common use case would be to use `Function.prototype.apply`.
	 *
	 *  ```js
	 *  function f(x, y, z) {}
	 *  var args = [1, 2, 3];
	 *  f.apply(null, args);
	 *  ```
	 *
	 * With `spread` this example can be re-written.
	 *
	 *  ```js
	 *  spread(function(x, y, z) {})([1, 2, 3]);
	 *  ```
	 *
	 * @param {Function} callback
	 * @returns {Function}
	 */
	module.exports = function spread(callback) {
	  return function wrap(arr) {
	    return callback.apply(null, arr);
	  };
	};


/***/ })
/******/ ])
});

});

const axios$1 = axios;

class gltfAccessor extends GltfObject
{
    constructor()
    {
        super();
        this.bufferView = undefined;
        this.byteOffset = 0;
        this.componentType = undefined;
        this.normalized = false;
        this.count = undefined;
        this.type = undefined;
        this.max = undefined;
        this.min = undefined;
        this.sparse = undefined;
        this.name = undefined;

        // non gltf
        this.glBuffer = undefined;
        this.typedView = undefined;
        this.filteredView = undefined;
    }

    getTypedView(gltf)
    {
        if (this.typedView !== undefined)
        {
            return this.typedView;
        }

        if (this.bufferView !== undefined)
        {
            const bufferView = gltf.bufferViews[this.bufferView];
            const buffer = gltf.buffers[bufferView.buffer];
            const byteOffset = this.byteOffset + bufferView.byteOffset;

            const componentSize = this.getComponentSize(this.componentType);
            let componentCount = this.getComponentCount(this.type);

            if(bufferView.byteStride !== 0)
            {
                componentCount = bufferView.byteStride / componentSize;
            }

            const arrayLength = this.count * componentCount;

            switch (this.componentType)
            {
            case WebGL2RenderingContext.BYTE:
                this.typedView = new Int8Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case WebGL2RenderingContext.UNSIGNED_BYTE:
                this.typedView = new Uint8Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case WebGL2RenderingContext.SHORT:
                this.typedView = new Int16Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case WebGL2RenderingContext.UNSIGNED_SHORT:
                this.typedView = new Uint16Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case WebGL2RenderingContext.UNSIGNED_INT:
                this.typedView = new Uint32Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case WebGL2RenderingContext.FLOAT:
                this.typedView = new Float32Array(buffer.buffer, byteOffset, arrayLength);
                break;
            }
        }

        if (this.typedView === undefined)
        {
            console.warn("Failed to convert buffer view to typed view!: " + this.bufferView);
        }
        else if (this.sparse !== undefined)
        {
            this.applySparse(gltf, this.typedView);
        }

        return this.typedView;
    }

    getDeinterlacedView(gltf)
    {
        if (this.filteredView !== undefined)
        {
            return this.filteredView;
        }

        if (this.bufferView !== undefined)
        {
            const bufferView = gltf.bufferViews[this.bufferView];
            const buffer = gltf.buffers[bufferView.buffer];
            const byteOffset = this.byteOffset + bufferView.byteOffset;

            const componentSize = this.getComponentSize(this.componentType);
            const componentCount = this.getComponentCount(this.type);
            const arrayLength = this.count * componentCount;

            let stride = bufferView.byteStride !== 0 ? bufferView.byteStride : componentCount * componentSize;
            let dv = new DataView(buffer.buffer, byteOffset, this.count * stride);

            let func = 'getFloat32';
            switch (this.componentType)
            {
            case WebGL2RenderingContext.BYTE:
                this.filteredView = new Int8Array(arrayLength);
                func = 'getInt8';
                break;
            case WebGL2RenderingContext.UNSIGNED_BYTE:
                this.filteredView = new Uint8Array(arrayLength);
                func = 'getUint8';
                break;
            case WebGL2RenderingContext.SHORT:
                this.filteredView = new Int16Array(arrayLength);
                func = 'getInt16';
                break;
            case WebGL2RenderingContext.UNSIGNED_SHORT:
                this.filteredView = new Uint16Array(arrayLength);
                func = 'getUint16';
                break;
            case WebGL2RenderingContext.UNSIGNED_INT:
                this.filteredView = new Uint32Array(arrayLength);
                func = 'getUint32';
                break;
            case WebGL2RenderingContext.FLOAT:
                this.filteredView = new Float32Array(arrayLength);
                func = 'getFloat32';
                break;
            }

            for(let i = 0; i < arrayLength; ++i)
            {
                let offset = Math.floor(i/componentCount) * stride + (i % componentCount) * componentSize;
                this.filteredView[i] = dv[func](offset, true);
            }
        }

        if (this.filteredView === undefined)
        {
            console.warn("Failed to convert buffer view to filtered view!: " + this.bufferView);
        }
        else if (this.sparse !== undefined)
        {
            this.applySparse(gltf, this.filteredView);
        }

        return this.filteredView;
    }

    applySparse(gltf, view)
    {
        // Gather indices.

        const indicesBufferView = gltf.bufferViews[this.sparse.indices.bufferView];
        const indicesBuffer = gltf.buffers[indicesBufferView.buffer];
        const indicesByteOffset = this.sparse.indices.byteOffset + indicesBufferView.byteOffset;

        const indicesComponentSize = this.getComponentSize(this.sparse.indices.componentType);
        let indicesComponentCount = 1;

        if(indicesBufferView.byteStride !== 0)
        {
            indicesComponentCount = indicesBufferView.byteStride / indicesComponentSize;
        }

        const indicesArrayLength = this.sparse.count * indicesComponentCount;

        let indicesTypedView;
        switch (this.sparse.indices.componentType)
        {
        case WebGL2RenderingContext.UNSIGNED_BYTE:
            indicesTypedView = new Uint8Array(indicesBuffer.buffer, indicesByteOffset, indicesArrayLength);
            break;
        case WebGL2RenderingContext.UNSIGNED_SHORT:
            indicesTypedView = new Uint16Array(indicesBuffer.buffer, indicesByteOffset, indicesArrayLength);
            break;
        case WebGL2RenderingContext.UNSIGNED_INT:
            indicesTypedView = new Uint32Array(indicesBuffer.buffer, indicesByteOffset, indicesArrayLength);
            break;
        }

        // Gather values.

        const valuesBufferView = gltf.bufferViews[this.sparse.values.bufferView];
        const valuesBuffer = gltf.buffers[valuesBufferView.buffer];
        const valuesByteOffset = this.sparse.values.byteOffset + valuesBufferView.byteOffset;

        const valuesComponentSize = this.getComponentSize(this.componentType);
        let valuesComponentCount = this.getComponentCount(this.type);

        if(valuesBufferView.byteStride !== 0)
        {
            valuesComponentCount = valuesBufferView.byteStride / valuesComponentSize;
        }

        const valuesArrayLength = this.sparse.count * valuesComponentCount;

        let valuesTypedView;
        switch (this.componentType)
        {
        case WebGL2RenderingContext.BYTE:
            valuesTypedView = new Int8Array(valuesBuffer.buffer, valuesByteOffset, valuesArrayLength);
            break;
        case WebGL2RenderingContext.UNSIGNED_BYTE:
            valuesTypedView = new Uint8Array(valuesBuffer.buffer, valuesByteOffset, valuesArrayLength);
            break;
        case WebGL2RenderingContext.SHORT:
            valuesTypedView = new Int16Array(valuesBuffer.buffer, valuesByteOffset, valuesArrayLength);
            break;
        case WebGL2RenderingContext.UNSIGNED_SHORT:
            valuesTypedView = new Uint16Array(valuesBuffer.buffer, valuesByteOffset, valuesArrayLength);
            break;
        case WebGL2RenderingContext.UNSIGNED_INT:
            valuesTypedView = new Uint32Array(valuesBuffer.buffer, valuesByteOffset, valuesArrayLength);
            break;
        case WebGL2RenderingContext.FLOAT:
            valuesTypedView = new Float32Array(valuesBuffer.buffer, valuesByteOffset, valuesArrayLength);
            break;
        }

        // Overwrite values.

        for(let i = 0; i < this.sparse.count; ++i)
        {
            for(let k = 0; k < valuesComponentCount; ++k)
            {
                view[indicesTypedView[i] * valuesComponentCount + k] = valuesTypedView[i * valuesComponentCount + k];
            }
        }
    }

    getComponentCount(type)
    {
        return CompononentCount.get(type);
    }

    getComponentSize(componentType)
    {
        switch (componentType)
        {
        case WebGL2RenderingContext.BYTE:
        case WebGL2RenderingContext.UNSIGNED_BYTE:
            return 1;
        case WebGL2RenderingContext.SHORT:
        case WebGL2RenderingContext.UNSIGNED_SHORT:
            return 2;
        case WebGL2RenderingContext.UNSIGNED_INT:
        case WebGL2RenderingContext.FLOAT:
            return 4;
        default:
            return 0;
        }
    }

    destroy()
    {
        if (this.glBuffer !== undefined)
        {
            // TODO: this breaks the dependency direction
            WebGl.context.deleteBuffer(this.glBuffer);
        }

        this.glBuffer = undefined;
    }
}

const CompononentCount = new Map(
    [
        ["SCALAR", 1],
        ["VEC2", 2],
        ["VEC3", 3],
        ["VEC4", 4],
        ["MAT2", 4],
        ["MAT3", 9],
        ["MAT4", 16]
    ]
);

class gltfBuffer extends GltfObject
{
    constructor()
    {
        super();
        this.uri = undefined;
        this.byteLength = undefined;
        this.name = undefined;

        // non gltf
        this.buffer = undefined; // raw data blob
    }

    load(gltf, additionalFiles = undefined)
    {
        if (this.buffer !== undefined)
        {
            console.error("buffer has already been loaded");
            return;
        }

        const self = this;
        return new Promise(function(resolve)
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
        axios$1.get(getContainingFolder(gltf.path) + this.uri, { responseType: 'arraybuffer'})
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

        const foundFile = files.find(function(file)
        {
            if (file.name === this.uri || file.fullPath === this.uri)
            {
                return true;
            }
        }, this);

        if (foundFile === undefined)
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
        reader.readAsArrayBuffer(foundFile);

        return true;
    }
}

class gltfBufferView extends GltfObject
{
    constructor()
    {
        super();
        this.buffer = undefined;
        this.byteOffset = 0;
        this.byteLength = undefined;
        this.byteStride = 0;
        this.target = undefined;
        this.name = undefined;
    }
}

class gltfLight extends GltfObject
{
    constructor(
        type = "directional",
        color = [1, 1, 1],
        intensity = 1,
        innerConeAngle = 0,
        outerConeAngle = Math.PI / 4,
        range = -1,
        name = undefined,
        node = undefined)
    {
        super();
        this.type = type;
        this.color = color;
        this.intensity = intensity;
        this.innerConeAngle = innerConeAngle;
        this.outerConeAngle = outerConeAngle;
        this.range = range;
        this.name = name;
        // non gltf
        this.node = node;
    }

    initGl(gltf, webGlContext)
    {
        super.initGl(gltf, webGlContext);

        for (let i = 0; i < gltf.nodes.length; i++)
        {
            const nodeExtensions = gltf.nodes[i].extensions;
            if (nodeExtensions === undefined)
            {
                continue;
            }

            const lightsExtension = nodeExtensions.KHR_lights_punctual;
            if (lightsExtension === undefined)
            {
                continue;
            }

            const lightIndex = lightsExtension.light;
            if (gltf.lights[lightIndex] === this)
            {
                this.node = i;
                break;
            }
        }
    }

    fromJson(jsonLight)
    {
        super.fromJson(jsonLight);

        if(jsonLight.spot !== undefined)
        {
            fromKeys(this, jsonLight.spot);
        }
    }

    toUniform(gltf)
    {
        const uLight = new UniformLight();

        if (this.node !== undefined)
        {
            const matrix = gltf.nodes[this.node].worldTransform;

            var scale = fromValues(1, 1, 1);
            getScaling(scale, matrix);

            // To extract a correct rotation, the scaling component must be eliminated.
            const mn = create$1();
            for(const col of [0, 1, 2])
            {
                mn[col] = matrix[col] / scale[0];
                mn[col + 4] = matrix[col + 4] / scale[1];
                mn[col + 8] = matrix[col + 8] / scale[2];
            }
            var rotation = create$4();
            getRotation(rotation, mn);
            normalize$2(rotation, rotation);

            const alongNegativeZ = fromValues(0, 0, -1);
            transformQuat(uLight.direction, alongNegativeZ, rotation);

            var translation = fromValues(0, 0, 0);
            getTranslation(translation, matrix);
            uLight.position = translation;
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

        const defaultDirection = fromValues(-0.7399, -0.6428, -0.1983);
        this.direction = defaultDirection;
        this.range = -1;

        this.color = jsToGl([1, 1, 1]);
        this.intensity = 1;

        this.position = jsToGl([0, 0, 0]);
        this.innerConeCos = 0.0;

        this.outerConeCos = Math.PI / 4;
        this.type = Type_Directional;
        this.padding1 = 0.0;
        this.padding2 = 0.0;
    }
}

// https://github.com/KhronosGroup/glTF/blob/khr_ktx2_ibl/extensions/2.0/Khronos/KHR_lights_image_based/schema/imageBasedLight.schema.json

class ImageBasedLight extends GltfObject
{
    constructor()
    {
        super();
        this.rotation = jsToGl([0, 0, 0, 1]);
        this.brightnessFactor = 1;
        this.brightnessOffset = 0;
        this.specularEnvironmentTexture = undefined;
        this.diffuseEnvironmentTexture = undefined;
        this.sheenEnvironmentTexture = undefined;

        // non-gltf
        this.levelCount = 1;
    }

    fromJson(jsonIBL)
    {
        super.fromJson(jsonIBL);

        if(jsonIBL.extensions !== undefined)
        {
            this.fromJsonExtensions(jsonIBL.extensions);
        }
    }

    fromJsonExtensions(extensions)
    {
        if (extensions.KHR_materials_sheen !== undefined)
        {
            this.sheenEnvironmentTexture = extensions.KHR_materials_sheen.sheenEnvironmentTexture;
        }
    }

    initGl(gltf, webGlContext)
    {
        if (this.diffuseEnvironmentTexture !== undefined)
        {
            const textureObject = gltf.textures[this.diffuseEnvironmentTexture];
            textureObject.type = WebGL2RenderingContext.TEXTURE_CUBE_MAP;
        }
        if (this.specularEnvironmentTexture !== undefined)
        {
            const textureObject = gltf.textures[this.specularEnvironmentTexture];
            textureObject.type = WebGL2RenderingContext.TEXTURE_CUBE_MAP;

            const imageObject = gltf.images[textureObject.source];
            this.levelCount = imageObject.image.levelCount;
        }
        if(this.sheenEnvironmentTexture !== undefined)
        {
            const textureObject = gltf.textures[this.sheenEnvironmentTexture];
            textureObject.type = WebGL2RenderingContext.TEXTURE_CUBE_MAP;

            const imageObject = gltf.images[textureObject.source];
            if (this.levelCount !== imageObject.image.levelCount)
            {
                console.error("Specular and sheen do not have same level count");
            }
        }
    }
}

class gltfTexture extends GltfObject
{
    constructor(sampler = undefined, source = undefined, type = WebGLRenderingContext.TEXTURE_2D, texture = undefined)
    {
        super();
        this.sampler = sampler; // index to gltfSampler, default sampler ?
        this.source = source; // index to gltfImage

        // non gltf
        this.glTexture = texture;
        this.type = type;
        this.initialized = false;
        this.mipLevelCount = 0;
    }

    initGl(gltf, webGlContext)
    {
        if (this.sampler === undefined)
        {
            this.sampler = gltf.samplers.length - 1;
        }

        initGlForMembers(this, gltf, webGlContext);
    }

    fromJson(jsonTexture)
    {
        super.fromJson(jsonTexture);
        if (jsonTexture.extensions !== undefined &&
            jsonTexture.extensions.KHR_texture_basisu !== undefined &&
            jsonTexture.extensions.KHR_texture_basisu.source !== undefined)
        {
            this.source = jsonTexture.extensions.KHR_texture_basisu.source;
        }
    }

    destroy()
    {
        if (this.glTexture !== undefined)
        {
            // TODO: this breaks the dependency direction
            WebGl.context.deleteTexture(this.glTexture);
        }

        this.glTexture = undefined;
    }
}

class gltfTextureInfo
{
    constructor(index = undefined, texCoord = 0, linear = true, samplerName = "", generateMips = true) // linear by default
    {
        this.index = index; // reference to gltfTexture
        this.texCoord = texCoord; // which UV set to use
        this.linear = linear;
        this.samplerName = samplerName;
        this.strength = 1.0; // occlusion
        this.scale = 1.0; // normal
        this.generateMips = generateMips;

        this.extensions = undefined;
    }

    initGl(gltf, webGlContext)
    {
        initGlForMembers(this, gltf, webGlContext);
    }

    fromJson(jsonTextureInfo)
    {
        fromKeys(this, jsonTextureInfo);
    }
}

class gltfMaterial extends GltfObject
{
    constructor()
    {
        super();
        this.name = undefined;
        this.pbrMetallicRoughness = undefined;
        this.normalTexture = undefined;
        this.occlusionTexture = undefined;
        this.emissiveTexture = undefined;
        this.emissiveFactor = fromValues(0, 0, 0);
        this.alphaMode = "OPAQUE";
        this.alphaCutoff = 0.5;
        this.doubleSided = false;

        // non gltf properties
        this.type = "unlit";
        this.textures = [];
        this.properties = new Map();
        this.defines = [];
    }

    static createDefault()
    {
        const defaultMaterial = new gltfMaterial();
        defaultMaterial.type = "MR";
        defaultMaterial.name = "Default Material";
        defaultMaterial.defines.push("MATERIAL_METALLICROUGHNESS 1");
        const baseColorFactor = fromValues$1(1, 1, 1, 1);
        const metallicFactor = 1;
        const roughnessFactor = 1;
        defaultMaterial.properties.set("u_BaseColorFactor", baseColorFactor);
        defaultMaterial.properties.set("u_MetallicFactor", metallicFactor);
        defaultMaterial.properties.set("u_RoughnessFactor", roughnessFactor);

        return defaultMaterial;
    }

    getShaderIdentifier()
    {
        switch (this.type)
        {
        default:
        case "SG": // fall through till we sparate shaders
        case "MR": return "pbr.frag";
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

            let rotation = create();
            let scale = create();
            let translation = create();

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
                scale = jsToGl([uvTransform.scale[0], 0, 0, 0, uvTransform.scale[1], 0, 0, 0, 1]);
            }

            if(uvTransform.offset !== undefined)
            {
                translation = jsToGl([1, 0, uvTransform.offset[0], 0, 1, uvTransform.offset[1], 0, 0, 1]);
            }

            let uvMatrix = create();
            multiply(uvMatrix, rotation, scale);
            multiply(uvMatrix, uvMatrix, translation);

            this.defines.push("HAS_" + textureKey.toUpperCase() + "_UV_TRANSFORM 1");
            this.properties.set("u_" + textureKey + "UVTransform", uvMatrix);
        }
    }

    initGl(gltf, webGlContext)
    {
        if (this.normalTexture !== undefined)
        {
            this.normalTexture.samplerName = "u_NormalSampler";
            this.parseTextureInfoExtensions(this.normalTexture, "Normal");
            this.textures.push(this.normalTexture);
            this.defines.push("HAS_NORMAL_MAP 1");
            this.properties.set("u_NormalScale", this.normalTexture.scale);
            this.properties.set("u_NormalUVSet", this.normalTexture.texCoord);
        }

        if (this.occlusionTexture !== undefined)
        {
            this.occlusionTexture.samplerName = "u_OcclusionSampler";
            this.parseTextureInfoExtensions(this.occlusionTexture, "Occlusion");
            this.textures.push(this.occlusionTexture);
            this.defines.push("HAS_OCCLUSION_MAP 1");
            this.properties.set("u_OcclusionStrength", this.occlusionTexture.strength);
            this.properties.set("u_OcclusionUVSet", this.occlusionTexture.texCoord);
        }

        this.properties.set("u_EmissiveFactor", this.emissiveFactor);
        if (this.emissiveTexture !== undefined)
        {
            this.emissiveTexture.samplerName = "u_EmissiveSampler";
            this.parseTextureInfoExtensions(this.emissiveTexture, "Emissive");
            this.textures.push(this.emissiveTexture);
            this.defines.push("HAS_EMISSIVE_MAP 1");
            this.properties.set("u_EmissiveUVSet", this.emissiveTexture.texCoord);
        }

        if (this.baseColorTexture !== undefined)
        {
            this.baseColorTexture.samplerName = "u_BaseColorSampler";
            this.parseTextureInfoExtensions(this.baseColorTexture, "BaseColor");
            this.textures.push(this.baseColorTexture);
            this.defines.push("HAS_BASE_COLOR_MAP 1");
            this.properties.set("u_BaseColorUVSet", this.baseColorTexture.texCoord);
        }

        if (this.metallicRoughnessTexture !== undefined)
        {
            this.metallicRoughnessTexture.samplerName = "u_MetallicRoughnessSampler";
            this.parseTextureInfoExtensions(this.metallicRoughnessTexture, "MetallicRoughness");
            this.textures.push(this.metallicRoughnessTexture);
            this.defines.push("HAS_METALLIC_ROUGHNESS_MAP 1");
            this.properties.set("u_MetallicRoughnessUVSet", this.metallicRoughnessTexture.texCoord);
        }

        if (this.diffuseTexture !== undefined)
        {
            this.diffuseTexture.samplerName = "u_DiffuseSampler";
            this.parseTextureInfoExtensions(this.diffuseTexture, "Diffuse");
            this.textures.push(this.diffuseTexture);
            this.defines.push("HAS_DIFFUSE_MAP 1");
            this.properties.set("u_DiffuseUVSet", this.diffuseTexture.texCoord);
        }

        if (this.specularGlossinessTexture !== undefined)
        {
            this.specularGlossinessTexture.samplerName = "u_SpecularGlossinessSampler";
            this.parseTextureInfoExtensions(this.specularGlossinessTexture, "SpecularGlossiness");
            this.textures.push(this.specularGlossinessTexture);
            this.defines.push("HAS_SPECULAR_GLOSSINESS_MAP 1");
            this.properties.set("u_SpecularGlossinessUVSet", this.specularGlossinessTexture.texCoord);
        }

        if(this.alphaMode === 'MASK') // only set cutoff value for mask material
        {
            this.defines.push("ALPHAMODE_MASK 1");
            this.properties.set("u_AlphaCutoff", this.alphaCutoff);
        }
        else if (this.alphaMode === 'OPAQUE')
        {
            this.defines.push("ALPHAMODE_OPAQUE 1");
        }

        if (this.pbrMetallicRoughness !== undefined && this.type !== "SG")
        {
            this.defines.push("MATERIAL_METALLICROUGHNESS 1");

            let baseColorFactor = fromValues$1(1, 1, 1, 1);
            let metallicFactor = 1;
            let roughnessFactor = 1;

            if (this.pbrMetallicRoughness.baseColorFactor !== undefined)
            {
                baseColorFactor = jsToGl(this.pbrMetallicRoughness.baseColorFactor);
            }

            if (this.pbrMetallicRoughness.metallicFactor !== undefined)
            {
                metallicFactor = this.pbrMetallicRoughness.metallicFactor;
            }

            if (this.pbrMetallicRoughness.roughnessFactor !== undefined)
            {
                roughnessFactor = this.pbrMetallicRoughness.roughnessFactor;
            }

            this.properties.set("u_BaseColorFactor", baseColorFactor);
            this.properties.set("u_MetallicFactor", metallicFactor);
            this.properties.set("u_RoughnessFactor", roughnessFactor);
        }

        if (this.extensions !== undefined)
        {
            if (this.extensions.KHR_materials_unlit !== undefined)
            {
                this.defines.push("MATERIAL_UNLIT 1");
            }

            if (this.extensions.KHR_materials_pbrSpecularGlossiness !== undefined)
            {
                this.defines.push("MATERIAL_SPECULARGLOSSINESS 1");

                let diffuseFactor = fromValues$1(1, 1, 1, 1);
                let specularFactor = fromValues(1, 1, 1);
                let glossinessFactor = 1;

                if (this.extensions.KHR_materials_pbrSpecularGlossiness.diffuseFactor !== undefined)
                {
                    diffuseFactor = jsToGl(this.extensions.KHR_materials_pbrSpecularGlossiness.diffuseFactor);
                }

                if (this.extensions.KHR_materials_pbrSpecularGlossiness.specularFactor !== undefined)
                {
                    specularFactor = jsToGl(this.extensions.KHR_materials_pbrSpecularGlossiness.specularFactor);
                }

                if (this.extensions.KHR_materials_pbrSpecularGlossiness.glossinessFactor !== undefined)
                {
                    glossinessFactor = this.extensions.KHR_materials_pbrSpecularGlossiness.glossinessFactor;
                }

                this.properties.set("u_DiffuseFactor", diffuseFactor);
                this.properties.set("u_SpecularFactor", specularFactor);
                this.properties.set("u_GlossinessFactor", glossinessFactor);
            }

            // Clearcoat is part of the default metallic-roughness shader
            if(this.extensions.KHR_materials_clearcoat !== undefined)
            {
                let clearcoatFactor = 0.0;
                let clearcoatRoughnessFactor = 0.0;

                this.defines.push("MATERIAL_CLEARCOAT 1");

                if(this.extensions.KHR_materials_clearcoat.clearcoatFactor !== undefined)
                {
                    clearcoatFactor = this.extensions.KHR_materials_clearcoat.clearcoatFactor;
                }
                if(this.extensions.KHR_materials_clearcoat.clearcoatRoughnessFactor !== undefined)
                {
                    clearcoatRoughnessFactor = this.extensions.KHR_materials_clearcoat.clearcoatRoughnessFactor;
                }

                if (this.clearcoatTexture !== undefined)
                {
                    this.clearcoatTexture.samplerName = "u_ClearcoatSampler";
                    this.parseTextureInfoExtensions(this.clearcoatTexture, "Clearcoat");
                    this.textures.push(this.clearcoatTexture);
                    this.defines.push("HAS_CLEARCOAT_TEXTURE_MAP 1");
                    this.properties.set("u_ClearcoatUVSet", this.clearcoatTexture.texCoord);
                }
                if (this.clearcoatRoughnessTexture !== undefined)
                {
                    this.clearcoatRoughnessTexture.samplerName = "u_ClearcoatRoughnessSampler";
                    this.parseTextureInfoExtensions(this.clearcoatRoughnessTexture, "ClearcoatRoughness");
                    this.textures.push(this.clearcoatRoughnessTexture);
                    this.defines.push("HAS_CLEARCOAT_ROUGHNESS_MAP 1");
                    this.properties.set("u_ClearcoatRoughnessUVSet", this.clearcoatRoughnessTexture.texCoord);
                }
                if (this.clearcoatNormalTexture !== undefined)
                {
                    this.clearcoatNormalTexture.samplerName = "u_ClearcoatNormalSampler";
                    this.parseTextureInfoExtensions(this.clearcoatNormalTexture, "ClearcoatNormal");
                    this.textures.push(this.clearcoatNormalTexture);
                    this.defines.push("HAS_CLEARCOAT_NORMAL_MAP 1");
                    this.properties.set("u_ClearcoatNormalUVSet", this.clearcoatNormalTexture.texCoord);
                }
                this.properties.set("u_ClearcoatFactor", clearcoatFactor);
                this.properties.set("u_ClearcoatRoughnessFactor", clearcoatRoughnessFactor);
            }

            // Sheen material extension
            // https://github.com/sebavan/glTF/tree/KHR_materials_sheen/extensions/2.0/Khronos/KHR_materials_sheen
            if(this.extensions.KHR_materials_sheen !== undefined)
            {
                let sheenRoughnessFactor = 0.0;
                let sheenColorFactor =  fromValues(1.0, 1.0, 1.0);

                this.defines.push("MATERIAL_SHEEN 1");

                if(this.extensions.KHR_materials_sheen.sheenRoughnessFactor !== undefined)
                {
                    sheenRoughnessFactor = this.extensions.KHR_materials_sheen.sheenRoughnessFactor;
                }
                if(this.extensions.KHR_materials_sheen.sheenColorFactor !== undefined)
                {
                    sheenColorFactor = jsToGl(this.extensions.KHR_materials_sheen.sheenColorFactor);
                }
                if (this.sheenRoughnessTexture !== undefined)
                {
                    this.sheenRoughnessTexture.samplerName = "u_sheenRoughnessSampler";
                    this.parseTextureInfoExtensions(this.sheenRoughnessTexture, "SheenRoughness");
                    this.textures.push(this.sheenRoughnessTexture);
                    this.defines.push("HAS_SHEEN_ROUGHNESS_MAP 1");
                    this.properties.set("u_SheenRoughnessUVSet", this.sheenRoughnessTexture.texCoord);
                }
                if (this.sheenColorTexture !== undefined)
                {
                    this.sheenColorTexture.samplerName = "u_SheenColorSampler";
                    this.parseTextureInfoExtensions(this.sheenColorTexture, "SheenColor");
                    this.textures.push(this.sheenColorTexture);
                    this.defines.push("HAS_SHEEN_COLOR_MAP 1");
                    this.properties.set("u_SheenColorUVSet", this.sheenColorTexture.texCoord);
                }

                this.properties.set("u_SheenRoughnessFactor", sheenRoughnessFactor);
                this.properties.set("u_SheenColorFactor", sheenColorFactor);
            }

            // KHR Extension: Transmission
            if (this.extensions.KHR_materials_transmission !== undefined)
            {
                let transmissionFactor = 0.0;

                this.defines.push("MATERIAL_TRANSMISSION 1");

                if (transmissionFactor !== undefined)
                {
                    transmissionFactor = this.extensions.KHR_materials_transmission.transmissionFactor;
                }
                if (this.transmissionTexture !== undefined)
                {
                    this.transmissionTexture.samplerName = "u_TransmissionSampler";
                    this.parseTextureInfoExtensions(this.transmissionTexture, "Transmission");
                    this.textures.push(this.transmissionTexture);
                    this.defines.push("HAS_TRANSMISSION_MAP 1");
                    this.properties.set("u_TransmissionUVSet", this.transmissionTexture.texCoord);
                }

                this.properties.set("u_TransmissionFactor", transmissionFactor);
            }
        }

        initGlForMembers(this, gltf, webGlContext);
    }

    fromJson(jsonMaterial)
    {
        super.fromJson(jsonMaterial);

        if (jsonMaterial.emissiveFactor !== undefined)
        {
            this.emissiveFactor = jsToGl(jsonMaterial.emissiveFactor);
        }

        if (jsonMaterial.normalTexture !== undefined)
        {
            const normalTexture = new gltfTextureInfo();
            normalTexture.fromJson(jsonMaterial.normalTexture);
            this.normalTexture = normalTexture;
        }

        if (jsonMaterial.occlusionTexture !== undefined)
        {
            const occlusionTexture = new gltfTextureInfo();
            occlusionTexture.fromJson(jsonMaterial.occlusionTexture);
            this.occlusionTexture = occlusionTexture;
        }

        if (jsonMaterial.emissiveTexture !== undefined)
        {
            const emissiveTexture = new gltfTextureInfo(undefined, 0, false);
            emissiveTexture.fromJson(jsonMaterial.emissiveTexture);
            this.emissiveTexture = emissiveTexture;
        }

        if(jsonMaterial.extensions !== undefined)
        {
            this.fromJsonMaterialExtensions(jsonMaterial.extensions);
        }

        if (jsonMaterial.pbrMetallicRoughness !== undefined && this.type !== "SG")
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
        }

        if(jsonExtensions.KHR_materials_clearcoat !== undefined)
        {
            this.fromJsonClearcoat(jsonExtensions.KHR_materials_clearcoat);
        }

        if(jsonExtensions.KHR_materials_sheen !== undefined)
        {
            this.fromJsonSheen(jsonExtensions.KHR_materials_sheen);
        }

        if(jsonExtensions.KHR_materials_transmission !== undefined)
        {
            this.fromJsonTransmission(jsonExtensions.KHR_materials_transmission);
        }
    }

    fromJsonMetallicRoughness(jsonMetallicRoughness)
    {
        if (jsonMetallicRoughness.baseColorTexture !== undefined)
        {
            const baseColorTexture = new gltfTextureInfo(undefined, 0, false);
            baseColorTexture.fromJson(jsonMetallicRoughness.baseColorTexture);
            this.baseColorTexture = baseColorTexture;
        }

        if (jsonMetallicRoughness.metallicRoughnessTexture !== undefined)
        {
            const metallicRoughnessTexture = new gltfTextureInfo();
            metallicRoughnessTexture.fromJson(jsonMetallicRoughness.metallicRoughnessTexture);
            this.metallicRoughnessTexture = metallicRoughnessTexture;
        }
    }

    fromJsonSpecularGlossiness(jsonSpecularGlossiness)
    {
        if (jsonSpecularGlossiness.diffuseTexture !== undefined)
        {
            const diffuseTexture = new gltfTextureInfo(undefined, 0, false);
            diffuseTexture.fromJson(jsonSpecularGlossiness.diffuseTexture);
            this.diffuseTexture = diffuseTexture;
        }

        if (jsonSpecularGlossiness.specularGlossinessTexture !== undefined)
        {
            const specularGlossinessTexture = new gltfTextureInfo();
            specularGlossinessTexture.fromJson(jsonSpecularGlossiness.specularGlossinessTexture);
            this.specularGlossinessTexture = specularGlossinessTexture;
        }
    }

    fromJsonClearcoat(jsonClearcoat)
    {
        if(jsonClearcoat.clearcoatTexture !== undefined)
        {
            const clearcoatTexture = new gltfTextureInfo();
            clearcoatTexture.fromJson(jsonClearcoat.clearcoatTexture);
            this.clearcoatTexture = clearcoatTexture;
        }

        if(jsonClearcoat.clearcoatRoughnessTexture !== undefined)
        {
            const clearcoatRoughnessTexture =  new gltfTextureInfo();
            clearcoatRoughnessTexture.fromJson(jsonClearcoat.clearcoatRoughnessTexture);
            this.clearcoatRoughnessTexture = clearcoatRoughnessTexture;
        }

        if(jsonClearcoat.clearcoatNormalTexture !== undefined)
        {
            const clearcoatNormalTexture =  new gltfTextureInfo();
            clearcoatNormalTexture.fromJson(jsonClearcoat.clearcoatNormalTexture);
            this.clearcoatNormalTexture = clearcoatNormalTexture;
        }
    }

    fromJsonSheen(jsonSheen)
    {
        if(jsonSheen.sheenColorTexture !== undefined)
        {
            const sheenColorTexture = new gltfTextureInfo();
            sheenColorTexture.fromJson(jsonSheen.sheenColorTexture);
            this.sheenColorTexture = sheenColorTexture;
        }
        if(jsonSheen.sheenRoughnessTexture !== undefined)
        {
            const sheenRoughnessTexture = new gltfTextureInfo();
            sheenRoughnessTexture.fromJson(jsonSheen.sheenRoughnessTexture);
            this.sheenRoughnessTexture = sheenRoughnessTexture;
        }
    }

    fromJsonTransmission(jsonTransmission)
    {
        if(jsonTransmission.transmissionTexture !== undefined)
        {
            const transmissionTexture = new gltfTextureInfo();
            transmissionTexture.fromJson(jsonTransmission.transmissionTexture);
            this.transmissionTexture = transmissionTexture;
        }
    }
}

class DracoDecoder {

    constructor(dracoLib) {
        if (!DracoDecoder.instance && dracoLib === undefined)
        {
            if (DracoDecoderModule === undefined)
            {
                console.error('Failed to initalize DracoDecoder: draco library undefined');
                return undefined;
            }
            else
            {
                dracoLib = DracoDecoderModule;
            }
        }
        if (!DracoDecoder.instance)
        {
            DracoDecoder.instance = this;
            this.module = null;

            this.initializingPromise = new Promise(resolve => {
                let dracoDecoderType = {};
                dracoDecoderType['onModuleLoaded'] = dracoDecoderModule => {
                    this.module = dracoDecoderModule;
                    resolve();
                };
                dracoLib(dracoDecoderType);
            });
        }
        return DracoDecoder.instance;
    }

    async ready() {
        await this.initializingPromise;
        Object.freeze(DracoDecoder.instance);
    }

}

class gltfPrimitive extends GltfObject
{
    constructor()
    {
        super();
        this.attributes = [];
        this.targets = [];
        this.indices = undefined;
        this.material = undefined;
        this.mode = WebGLRenderingContext.TRIANGLES;

        // non gltf
        this.glAttributes = [];
        this.defines = [];
        this.skip = true;
        this.hasWeights = false;
        this.hasJoints = false;
        this.hasNormals = false;
        this.hasTangents = false;
        this.hasTexcoord = false;
        this.hasColor = false;

        // The primitive centroid is used for depth sorting.
        this.centroid = undefined;
    }

    initGl(gltf, webGlContext)
    {
        // Use the default glTF material.
        if (this.material === undefined)
        {
            this.material = gltf.materials.length - 1;
        }

        initGlForMembers(this, gltf, webGlContext);

        const maxAttributes = webGlContext.getParameter(WebGLRenderingContext.MAX_VERTEX_ATTRIBS);

        // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes

        if (this.extensions !== undefined)
        {
            if (this.extensions.KHR_draco_mesh_compression !== undefined)
            {
                const dracoDecoder = new DracoDecoder();
                if (dracoDecoder !== undefined && Object.isFrozen(dracoDecoder))
                {
                    let dracoGeometry = this.decodeDracoBufferToIntermediate(
                        this.extensions.KHR_draco_mesh_compression, gltf);
                    this.copyDataFromDecodedGeometry(gltf, dracoGeometry, this.attributes);
                }
                else
                {
                    console.warn('Failed to load draco compressed mesh: DracoDecoder not initialized');
                }
            }
        }

        // VERTEX ATTRIBUTES
        for (const attribute of Object.keys(this.attributes))
        {
            if(this.glAttributes.length >= maxAttributes)
            {
                console.error("To many vertex attributes for this primitive, skipping " + attribute);
                break;
            }

            const idx = this.attributes[attribute];
            switch (attribute)
            {
            case "POSITION":
                this.skip = false;
                this.glAttributes.push({ attribute: attribute, name: "a_Position", accessor: idx });
                break;
            case "NORMAL":
                this.hasNormals = true;
                this.defines.push("HAS_NORMALS 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Normal", accessor: idx });
                break;
            case "TANGENT":
                this.hasTangents = true;
                this.defines.push("HAS_TANGENTS 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Tangent", accessor: idx });
                break;
            case "TEXCOORD_0":
                this.hasTexcoord = true;
                this.defines.push("HAS_UV_SET1 1");
                this.glAttributes.push({ attribute: attribute, name: "a_UV1", accessor: idx });
                break;
            case "TEXCOORD_1":
                this.hasTexcoord = true;
                this.defines.push("HAS_UV_SET2 1");
                this.glAttributes.push({ attribute: attribute, name: "a_UV2", accessor: idx });
                break;
            case "COLOR_0":
                this.hasColor = true;
                const accessor = gltf.accessors[idx];
                this.defines.push("HAS_VERTEX_COLOR_" + accessor.type + " 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Color", accessor: idx });
                break;
            case "JOINTS_0":
                this.hasJoints = true;
                this.defines.push("HAS_JOINT_SET1 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Joint1", accessor: idx });
                break;
            case "WEIGHTS_0":
                this.hasWeights = true;
                this.defines.push("HAS_WEIGHT_SET1 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Weight1", accessor: idx });
                break;
            case "JOINTS_1":
                this.hasJoints = true;
                this.defines.push("HAS_JOINT_SET2 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Joint2", accessor: idx });
                break;
            case "WEIGHTS_1":
                this.hasWeights = true;
                this.defines.push("HAS_WEIGHT_SET2 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Weight2", accessor: idx });
                break;
            default:
                console.log("Unknown attribute: " + attribute);
            }
        }

        // MORPH TARGETS
        if (this.targets !== undefined)
        {
            let i = 0;
            for (const target of this.targets)
            {
                if(this.glAttributes.length + 3 > maxAttributes)
                {
                    console.error("To many vertex attributes for this primitive, skipping target " + i);
                    break;
                }

                for (const attribute of Object.keys(target))
                {
                    const idx = target[attribute];

                    switch (attribute)
                    {
                    case "POSITION":
                        this.defines.push("HAS_TARGET_POSITION" + i + " 1");
                        this.glAttributes.push({ attribute: attribute, name: "a_Target_Position" + i, accessor: idx });
                        break;
                    case "NORMAL":
                        this.defines.push("HAS_TARGET_NORMAL" + i + " 1");
                        this.glAttributes.push({ attribute: attribute, name: "a_Target_Normal" + i, accessor: idx });
                        break;
                    case "TANGENT":
                        this.defines.push("HAS_TARGET_TANGENT" + i + " 1");
                        this.glAttributes.push({ attribute: attribute, name: "a_Target_Tangent" + i, accessor: idx });
                        break;
                    }
                }

                ++i;
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

    setCentroid(centroid)
    {
        this.centroid = centroid;
    }

    fromJson(jsonPrimitive)
    {
        super.fromJson(jsonPrimitive);

        if(jsonPrimitive.extensions !== undefined)
        {
            this.fromJsonPrimitiveExtensions(jsonPrimitive.extensions);
        }
    }

    fromJsonPrimitiveExtensions(jsonExtensions)
    {
        if(jsonExtensions.KHR_materials_variants !== undefined)
        {
            this.fromJsonVariants(jsonExtensions.KHR_materials_variants);
        }
    }

    fromJsonVariants(jsonVariants)
    {
        if(jsonVariants.mappings !== undefined)
        {
            this.mappings = jsonVariants.mappings;
        }
    }

    copyDataFromDecodedGeometry(gltf, dracoGeometry, primitiveAttributes)
    {
        // indices
        let indexBuffer = dracoGeometry.index.array;
        this.loadBufferIntoGltf(indexBuffer, gltf, this.indices, 34963,
            "index buffer view");

        // Position
        if(dracoGeometry.attributes.POSITION !== undefined)
        {
            let positionBuffer = this.loadArrayIntoArrayBuffer(dracoGeometry.attributes.POSITION.array,
                dracoGeometry.attributes.POSITION.componentType);
            this.loadBufferIntoGltf(positionBuffer, gltf, primitiveAttributes["POSITION"], 34962,
                "position buffer view");
        }

        // Normal
        if(dracoGeometry.attributes.NORMAL !== undefined)
        {
            let normalBuffer = this.loadArrayIntoArrayBuffer(dracoGeometry.attributes.NORMAL.array,
                dracoGeometry.attributes.NORMAL.componentType);
            this.loadBufferIntoGltf(normalBuffer, gltf, primitiveAttributes["NORMAL"], 34962,
                "normal buffer view");
        }

        // TEXCOORD_0
        if(dracoGeometry.attributes.TEXCOORD_0 !== undefined)
        {
            let uvBuffer = this.loadArrayIntoArrayBuffer(dracoGeometry.attributes.TEXCOORD_0.array,
                dracoGeometry.attributes.TEXCOORD_0.componentType);
            this.loadBufferIntoGltf(uvBuffer, gltf, primitiveAttributes["TEXCOORD_0"], 34962,
                "TEXCOORD_0 buffer view");
        }

        // TEXCOORD_1
        if(dracoGeometry.attributes.TEXCOORD_1 !== undefined)
        {
            let uvBuffer = this.loadArrayIntoArrayBuffer(dracoGeometry.attributes.TEXCOORD_1.array,
                dracoGeometry.attributes.TEXCOORD_1.componentType);
            this.loadBufferIntoGltf(uvBuffer, gltf, primitiveAttributes["TEXCOORD_1"], 34962,
                "TEXCOORD_1 buffer view");
        }

        // Tangent
        if(dracoGeometry.attributes.TANGENT !== undefined)
        {
            let tangentBuffer = this.loadArrayIntoArrayBuffer(dracoGeometry.attributes.TANGENT.array,
                dracoGeometry.attributes.TANGENT.componentType);
            this.loadBufferIntoGltf(tangentBuffer, gltf, primitiveAttributes["TANGENT"], 34962,
                "Tangent buffer view");
        }

        // Color
        if(dracoGeometry.attributes.COLOR_0 !== undefined)
        {
            let colorBuffer = this.loadArrayIntoArrayBuffer(dracoGeometry.attributes.COLOR_0.array,
                dracoGeometry.attributes.COLOR_0.componentType);
            this.loadBufferIntoGltf(colorBuffer, gltf, primitiveAttributes["COLOR_0"], 34962,
                "color buffer view");
        }

        // JOINTS_0
        if(dracoGeometry.attributes.JOINTS_0 !== undefined)
        {
            let jointsBuffer = this.loadArrayIntoArrayBuffer(dracoGeometry.attributes.JOINTS_0.array,
                dracoGeometry.attributes.JOINTS_0.componentType);
            this.loadBufferIntoGltf(jointsBuffer, gltf, primitiveAttributes["JOINTS_0"], 34963,
                "JOINTS_0 buffer view");
        }

        // WEIGHTS_0
        if(dracoGeometry.attributes.WEIGHTS_0 !== undefined)
        {
            let weightsBuffer = this.loadArrayIntoArrayBuffer(dracoGeometry.attributes.WEIGHTS_0.array,
                dracoGeometry.attributes.WEIGHTS_0.componentType);
            this.loadBufferIntoGltf(weightsBuffer, gltf, primitiveAttributes["WEIGHTS_0"], 34963,
                "WEIGHTS_0 buffer view");
        }

        // JOINTS_1
        if(dracoGeometry.attributes.JOINTS_1 !== undefined)
        {
            let jointsBuffer = this.loadArrayIntoArrayBuffer(dracoGeometry.attributes.JOINTS_1.array,
                dracoGeometry.attributes.JOINTS_1.componentType);
            this.loadBufferIntoGltf(jointsBuffer, gltf, primitiveAttributes["JOINTS_1"], 34963,
                "JOINTS_1 buffer view");
        }

        // WEIGHTS_1
        if(dracoGeometry.attributes.WEIGHTS_1 !== undefined)
        {
            let weightsBuffer = this.loadArrayIntoArrayBuffer(dracoGeometry.attributes.WEIGHTS_1.array,
                dracoGeometry.attributes.WEIGHTS_1.componentType);
            this.loadBufferIntoGltf(weightsBuffer, gltf, primitiveAttributes["WEIGHTS_1"], 34963,
                "WEIGHTS_1 buffer view");
        }
    }

    loadBufferIntoGltf(buffer, gltf, gltfAccessorIndex, gltfBufferViewTarget, gltfBufferViewName)
    {
        const gltfBufferObj = new gltfBuffer();
        gltfBufferObj.byteLength = buffer.byteLength;
        gltfBufferObj.buffer = buffer;
        gltf.buffers.push(gltfBufferObj);

        const gltfBufferViewObj = new gltfBufferView();
        gltfBufferViewObj.buffer = gltf.buffers.length - 1;
        gltfBufferViewObj.byteLength = buffer.byteLength;
        if(gltfBufferViewName !== undefined)
        {
            gltfBufferViewObj.name = gltfBufferViewName;
        }
        gltfBufferViewObj.target = gltfBufferViewTarget;
        gltf.bufferViews.push(gltfBufferViewObj);

        gltf.accessors[gltfAccessorIndex].byteOffset = 0;
        gltf.accessors[gltfAccessorIndex].bufferView = gltf.bufferViews.length - 1;
    }

    loadArrayIntoArrayBuffer(arrayData, componentType)
    {
        let arrayBuffer;
        switch (componentType)
        {
        case "Int8Array":
            arrayBuffer = new ArrayBuffer(arrayData.length);
            let int8Array = new Int8Array(arrayBuffer);
            int8Array.set(arrayData);
            break;
        case "Uint8Array":
            arrayBuffer = new ArrayBuffer(arrayData.length);
            let uint8Array = new Uint8Array(arrayBuffer);
            uint8Array.set(arrayData);
            break;
        case "Int16Array":
            arrayBuffer = new ArrayBuffer(arrayData.length * 2);
            let int16Array = new Int16Array(arrayBuffer);
            int16Array.set(arrayData);
            break;
        case "Uint16Array":
            arrayBuffer = new ArrayBuffer(arrayData.length * 2);
            let uint16Array = new Uint16Array(arrayBuffer);
            uint16Array.set(arrayData);
            break;
        case "Int32Array":
            arrayBuffer = new ArrayBuffer(arrayData.length * 4);
            let int32Array = new Int32Array(arrayBuffer);
            int32Array.set(arrayData);
            break;
        case "Uint32Array":
            arrayBuffer = new ArrayBuffer(arrayData.length * 4);
            let uint32Array = new Uint32Array(arrayBuffer);
            uint32Array.set(arrayData);
            break;
        default:
        case "Float32Array":
            arrayBuffer = new ArrayBuffer(arrayData.length * 4);
            let floatArray = new Float32Array(arrayBuffer);
            floatArray.set(arrayData);
            break;
        }


        return arrayBuffer;
    }

    decodeDracoBufferToIntermediate(dracoExtension, gltf)
    {
        let dracoBufferViewIDX = dracoExtension.bufferView;

        const origGltfDrBufViewObj = gltf.bufferViews[dracoBufferViewIDX];
        const origGltfDracoBuffer = gltf.buffers[origGltfDrBufViewObj.buffer];

        const totalBuffer = new Int8Array( origGltfDracoBuffer.buffer );
        const actualBuffer = totalBuffer.slice(origGltfDrBufViewObj.byteOffset,
            origGltfDrBufViewObj.byteOffset + origGltfDrBufViewObj.byteLength);

        // decode draco buffer to geometry intermediate
        let dracoDecoder = new DracoDecoder();
        let draco = dracoDecoder.module;
        let decoder = new draco.Decoder();
        let decoderBuffer = new draco.DecoderBuffer();
        decoderBuffer.Init(actualBuffer, origGltfDrBufViewObj.byteLength);
        let geometry = this.decodeGeometry( draco, decoder, decoderBuffer, dracoExtension.attributes, gltf );

        draco.destroy( decoderBuffer );

        return geometry;
    }

    getDracoArrayTypeFromComponentType(componentType)
    {
        switch (componentType)
        {
        case WebGL2RenderingContext.BYTE:
            return "Int8Array";
        case WebGL2RenderingContext.UNSIGNED_BYTE:
            return "Uint8Array";
        case WebGL2RenderingContext.SHORT:
            return "Int16Array";
        case WebGL2RenderingContext.UNSIGNED_SHORT:
            return "Uint16Array";
        case WebGL2RenderingContext.INT:
            return "Int32Array";
        case WebGL2RenderingContext.UNSIGNED_INT:
            return "Uint32Array";
        case WebGL2RenderingContext.FLOAT:
            return "Float32Array";
        default:
            return "Float32Array";
        }
    }

    decodeGeometry(draco, decoder, decoderBuffer, gltfDracoAttributes, gltf) {
        let dracoGeometry;
        let decodingStatus;

        // decode mesh in draco decoder
        let geometryType = decoder.GetEncodedGeometryType( decoderBuffer );
        if ( geometryType === draco.TRIANGULAR_MESH ) {
            dracoGeometry = new draco.Mesh();
            decodingStatus = decoder.DecodeBufferToMesh( decoderBuffer, dracoGeometry );
        }
        else
        {
            throw new Error( 'DRACOLoader: Unexpected geometry type.' );
        }

        if ( ! decodingStatus.ok() || dracoGeometry.ptr === 0 ) {
            throw new Error( 'DRACOLoader: Decoding failed: ' + decodingStatus.error_msg() );
        }

        let geometry = { index: null, attributes: {} };
        let vertexCount = dracoGeometry.num_points();

        // Gather all vertex attributes.
        for(let dracoAttr in gltfDracoAttributes)
        {
            let componentType = WebGL2RenderingContext.BYTE;
            let accessotVertexCount;
            // find gltf accessor for this draco attribute
            for (const [key, value] of Object.entries(this.attributes))
            {
                if(key === dracoAttr)
                {
                    componentType = gltf.accessors[value].componentType;
                    accessotVertexCount = gltf.accessors[value].count;
                    break;
                }
            }

            // check if vertex count matches
            if(vertexCount !== accessotVertexCount)
            {
                throw new Error(`DRACOLoader: Accessor vertex count ${accessotVertexCount} does not match draco decoder vertex count  ${vertexCount}`);
            }
            componentType = this.getDracoArrayTypeFromComponentType(componentType);

            let dracoAttribute = decoder.GetAttributeByUniqueId( dracoGeometry, gltfDracoAttributes[dracoAttr]);
            var tmpObj = this.decodeAttribute( draco, decoder,
                dracoGeometry, dracoAttr, dracoAttribute, componentType);
            geometry.attributes[tmpObj.name] = tmpObj;
        }

        // Add index buffer
        if ( geometryType === draco.TRIANGULAR_MESH ) {

            // Generate mesh faces.
            let numFaces = dracoGeometry.num_faces();
            let numIndices = numFaces * 3;
            let dataSize = numIndices * 4;
            let ptr = draco._malloc( dataSize );
            decoder.GetTrianglesUInt32Array( dracoGeometry, dataSize, ptr );
            let index = new Uint32Array( draco.HEAPU32.buffer, ptr, numIndices ).slice();
            draco._free( ptr );

            geometry.index = { array: index, itemSize: 1 };

        }

        draco.destroy( dracoGeometry );
        return geometry;
    }

    decodeAttribute( draco, decoder, dracoGeometry, attributeName, attribute, attributeType) {
        let numComponents = attribute.num_components();
        let numPoints = dracoGeometry.num_points();
        let numValues = numPoints * numComponents;

        let ptr;
        let array;

        let dataSize;
        switch ( attributeType ) {
        case "Float32Array":
            dataSize = numValues * 4;
            ptr = draco._malloc( dataSize );
            decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_FLOAT32, dataSize, ptr );
            array = new Float32Array( draco.HEAPF32.buffer, ptr, numValues ).slice();
            draco._free( ptr );
            break;

        case "Int8Array":
            ptr = draco._malloc( numValues );
            decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_INT8, numValues, ptr );
            array = new Int8Array( draco.HEAP8.buffer, ptr, numValues ).slice();
            draco._free( ptr );
            break;

        case "Int16Array":
            dataSize = numValues * 2;
            ptr = draco._malloc( dataSize );
            decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_INT16, dataSize, ptr );
            array = new Int16Array( draco.HEAP16.buffer, ptr, numValues ).slice();
            draco._free( ptr );
            break;

        case "Int32Array":
            dataSize = numValues * 4;
            ptr = draco._malloc( dataSize );
            decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_INT32, dataSize, ptr );
            array = new Int32Array( draco.HEAP32.buffer, ptr, numValues ).slice();
            draco._free( ptr );
            break;

        case "Uint8Array":
            ptr = draco._malloc( numValues );
            decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_UINT8, numValues, ptr );
            array = new Uint8Array( draco.HEAPU8.buffer, ptr, numValues ).slice();
            draco._free( ptr );
            break;

        case "Uint16Array":
            dataSize = numValues * 2;
            ptr = draco._malloc( dataSize );
            decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_UINT16, dataSize, ptr );
            array = new Uint16Array( draco.HEAPU16.buffer, ptr, numValues ).slice();
            draco._free( ptr );
            break;

        case "Uint32Array":
            dataSize = numValues * 4;
            ptr = draco._malloc( dataSize );
            decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_UINT32, dataSize, ptr );
            array = new Uint32Array( draco.HEAPU32.buffer, ptr, numValues ).slice();
            draco._free( ptr );
            break;

        default:
            throw new Error( 'DRACOLoader: Unexpected attribute type.' );
        }

        return {
            name: attributeName,
            array: array,
            itemSize: numComponents,
            componentType: attributeType
        };

    }
}

class gltfMesh extends GltfObject
{
    constructor()
    {
        super();
        this.primitives = [];
        this.name = undefined;
        this.weights = [];
    }

    fromJson(jsonMesh)
    {
        super.fromJson(jsonMesh);

        if (jsonMesh.name !== undefined)
        {
            this.name = jsonMesh.name;
        }

        this.primitives = objectsFromJsons(jsonMesh.primitives, gltfPrimitive);

        if(jsonMesh.weights !== undefined)
        {
            this.weights = jsonMesh.weights;
        }
    }
}

// contain:
// transform
// child indices (reference to scene array of nodes)

class gltfNode extends GltfObject
{
    constructor()
    {
        super();
        this.camera = undefined;
        this.children = [];
        this.matrix = undefined;
        this.rotation = jsToGl([0, 0, 0, 1]);
        this.scale = jsToGl([1, 1, 1]);
        this.translation = jsToGl([0, 0, 0]);
        this.name = undefined;
        this.mesh = undefined;
        this.skin = undefined;

        // non gltf
        this.worldTransform = create$1();
        this.inverseWorldTransform = create$1();
        this.normalMatrix = create$1();
        this.light = undefined;
        this.changed = true;
    }

    initGl()
    {
        if (this.matrix !== undefined)
        {
            this.applyMatrix(this.matrix);
        }
        else
        {
            if (this.scale !== undefined)
            {
                this.scale = jsToGl(this.scale);
            }

            if (this.rotation !== undefined)
            {
                this.rotation = jsToGl(this.rotation);
            }

            if (this.translation !== undefined)
            {
                this.translation = jsToGl(this.translation);
            }
        }
        this.changed = true;
    }

    applyMatrix(matrixData)
    {
        this.matrix = jsToGl(matrixData);

        getScaling(this.scale, this.matrix);

        // To extract a correct rotation, the scaling component must be eliminated.
        const mn = create$1();
        for(const col of [0, 1, 2])
        {
            mn[col] = this.matrix[col] / this.scale[0];
            mn[col + 4] = this.matrix[col + 4] / this.scale[1];
            mn[col + 8] = this.matrix[col + 8] / this.scale[2];
        }
        getRotation(this.rotation, mn);
        normalize$2(this.rotation, this.rotation);

        getTranslation(this.translation, this.matrix);

        this.changed = true;
    }

    // vec3
    applyTranslation(translation)
    {
        this.translation = translation;
        this.changed = true;
    }

    // quat
    applyRotation(rotation)
    {
        this.rotation = rotation;
        this.changed = true;
    }

    // vec3
    applyScale(scale)
    {
        this.scale = scale;
        this.changed = true;
    }

    resetTransform()
    {
        this.rotation = jsToGl([0, 0, 0, 1]);
        this.scale = jsToGl([1, 1, 1]);
        this.translation = jsToGl([0, 0, 0]);
        this.changed = true;
    }

    getLocalTransform()
    {
        if(this.transform === undefined || this.changed)
        {
            this.transform = create$1();
            fromRotationTranslationScale(this.transform, this.rotation, this.translation, this.scale);
            this.changed = false;
        }

        return clone(this.transform);
    }
}

class gltfSampler extends GltfObject
{
    constructor(
        magFilter = WebGLRenderingContext.LINEAR,
        minFilter = WebGLRenderingContext.LINEAR_MIPMAP_LINEAR,
        wrapS = WebGLRenderingContext.REPEAT,
        wrapT = WebGLRenderingContext.REPEAT)
    {
        super();
        this.magFilter = magFilter;
        this.minFilter = minFilter;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
        this.name = undefined;
    }

    static createDefault()
    {
        return new gltfSampler();
    }
}

class gltfScene extends GltfObject
{
    constructor(nodes = [], name = undefined)
    {
        super();
        this.nodes = nodes;
        this.name = name;

        // non gltf
        this.imageBasedLight = undefined;
    }

    initGl(gltf, webGlContext)
    {
        super.initGl(gltf, webGlContext);

        if (this.extensions !== undefined &&
            this.extensions.KHR_lights_image_based !== undefined)
        {
            const index = this.extensions.KHR_lights_image_based.imageBasedLight;
            this.imageBasedLight = gltf.imageBasedLights[index];
        }
    }

    applyTransformHierarchy(gltf, rootTransform = create$1())
    {
        function applyTransform(gltf, node, parentTransform)
        {
            multiply$1(node.worldTransform, parentTransform, node.getLocalTransform());
            invert(node.inverseWorldTransform, node.worldTransform);
            transpose(node.normalMatrix, node.inverseWorldTransform);

            for (const child of node.children)
            {
                applyTransform(gltf, gltf.nodes[child], node.worldTransform);
            }
        }

        for (const node of this.nodes)
        {
            applyTransform(gltf, gltf.nodes[node], rootTransform);
        }
    }

    gatherNodes(gltf)
    {
        const nodes = [];

        function gatherNode(nodeIndex)
        {
            const node = gltf.nodes[nodeIndex];
            nodes.push(node);

            // recurse into children
            for(const child of node.children)
            {
                gatherNode(child);
            }
        }

        for (const node of this.nodes)
        {
            gatherNode(node);
        }

        return nodes;
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

class gltfAsset extends GltfObject
{
    constructor()
    {
        super();
        this.copyright = undefined;
        this.generator = undefined;
        this.version = undefined;
        this.minVersion = undefined;
    }
}

class gltfAnimationChannel extends GltfObject
{
    constructor()
    {
        super();
        this.target = {node: undefined, path: undefined};
        this.sampler = undefined;
    }
}

const InterpolationPath =
{
    TRANSLATION: "translation",
    ROTATION: "rotation",
    SCALE: "scale",
    WEIGHTS: "weights"
};

class gltfAnimationSampler extends GltfObject
{
    constructor()
    {
        super();
        this.input = undefined;
        this.interpolation = undefined;
        this.output = undefined;
    }
}

const InterpolationModes =
{
    LINEAR: "LINEAR",
    STEP: "STEP",
    CUBICSPLINE: "CUBICSPLINE"
};

class gltfInterpolator
{
    constructor()
    {
        this.prevKey = 0;
        this.prevT = 0.0;
    }

    slerpQuat(q1, q2, t)
    {
        const qn1 = create$4();
        const qn2 = create$4();

        normalize$2(qn1, q1);
        normalize$2(qn2, q2);

        const quatResult = create$4();

        slerp(quatResult, qn1, qn2, t);
        normalize$2(quatResult, quatResult);

        return quatResult;
    }

    step(prevKey, output, stride)
    {
        const result = new ARRAY_TYPE(stride);

        for(let i = 0; i < stride; ++i)
        {
            result[i] = output[prevKey * stride + i];
        }

        return result;
    }

    linear(prevKey, nextKey, output, t, stride)
    {
        const result = new ARRAY_TYPE(stride);

        for(let i = 0; i < stride; ++i)
        {
            result[i] = output[prevKey * stride + i] * (1-t) + output[nextKey * stride + i] * t;
        }

        return result;
    }

    cubicSpline(prevKey, nextKey, output, keyDelta, t, stride)
    {
        // stride: Count of components (4 in a quaternion).
        // Scale by 3, because each output entry consist of two tangents and one data-point.
        const prevIndex = prevKey * stride * 3;
        const nextIndex = nextKey * stride * 3;
        const A = 0;
        const V = 1 * stride;
        const B = 2 * stride;

        const result = new ARRAY_TYPE(stride);
        const tSq = t ** 2;
        const tCub = t ** 3;

        // We assume that the components in output are laid out like this: in-tangent, point, out-tangent.
        // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#appendix-c-spline-interpolation
        for(let i = 0; i < stride; ++i)
        {
            const v0 = output[prevIndex + i + V];
            const a = keyDelta * output[nextIndex + i + A];
            const b = keyDelta * output[prevIndex + i + B];
            const v1 = output[nextIndex + i + V];

            result[i] = ((2*tCub - 3*tSq + 1) * v0) + ((tCub - 2*tSq + t) * b) + ((-2*tCub + 3*tSq) * v1) + ((tCub - tSq) * a);
        }

        return result;
    }

    resetKey()
    {
        this.prevKey = 0;
    }

    interpolate(gltf, channel, sampler, t, stride, maxTime)
    {
        const input = gltf.accessors[sampler.input].getDeinterlacedView(gltf);
        const output = gltf.accessors[sampler.output].getDeinterlacedView(gltf);

        if(output.length === stride) // no interpolation for single keyFrame animations
        {
            return jsToGlSlice(output, 0, stride);
        }

        // Wrap t around, so the animation loops.
        // Make sure that t is never earlier than the first keyframe and never later then the last keyframe.
        t = t % maxTime;
        t = clamp(t, input[0], input[input.length - 1]);

        if (this.prevT > t)
        {
            this.prevKey = 0;
        }

        this.prevT = t;

        // Find next keyframe: min{ t of input | t > prevKey }
        let nextKey = null;
        for (let i = this.prevKey; i < input.length; ++i)
        {
            if (t <= input[i])
            {
                nextKey = clamp(i, 1, input.length - 1);
                break;
            }
        }
        this.prevKey = clamp(nextKey - 1, 0, nextKey);

        const keyDelta = input[nextKey] - input[this.prevKey];

        // Normalize t: [t0, t1] -> [0, 1]
        const tn = (t - input[this.prevKey]) / keyDelta;

        if(channel.target.path === InterpolationPath.ROTATION)
        {

            if(InterpolationModes.CUBICSPLINE === sampler.interpolation)
            {
                // GLTF requires cubic spline interpolation for quaternions.
                // https://github.com/KhronosGroup/glTF/issues/1386
                const result = this.cubicSpline(this.prevKey, nextKey, output, keyDelta, tn, 4);
                normalize$2(result, result);
                return result;
            }
            else if(sampler.interpolation === InterpolationModes.LINEAR)
            {
                const q0 = this.getQuat(output, this.prevKey);
                const q1 = this.getQuat(output, nextKey);
                return this.slerpQuat(q0, q1, tn);
            }
            else if(sampler.interpolation === InterpolationModes.STEP)
            {
                return this.getQuat(output, this.prevKey);
            }

        }

        switch(sampler.interpolation)
        {
        case InterpolationModes.STEP:
            return this.step(this.prevKey, output, stride);
        case InterpolationModes.CUBICSPLINE:
            return this.cubicSpline(this.prevKey, nextKey, output, keyDelta, tn, stride);
        default:
            return this.linear(this.prevKey, nextKey, output, tn, stride);
        }
    }

    getQuat(output, index)
    {
        const x = output[4 * index];
        const y = output[4 * index + 1];
        const z = output[4 * index + 2];
        const w = output[4 * index + 3];
        return fromValues$2(x, y, z, w);
    }
}

class gltfAnimation extends GltfObject
{
    constructor()
    {
        super();
        this.channels = [];
        this.samplers = [];
        this.name = '';

        // not gltf
        this.interpolators = [];
        this.maxTime = 0;
    }

    fromJson(jsonAnimation)
    {
        super.fromJson(jsonAnimation);

        this.channels = objectsFromJsons(jsonAnimation.channels, gltfAnimationChannel);
        this.samplers = objectsFromJsons(jsonAnimation.samplers, gltfAnimationSampler);
        this.name = jsonAnimation.name;

        if(this.channels === undefined)
        {
            console.error("No channel data found for skin");
            return;
        }

        for(let i = 0; i < this.channels.length; ++i)
        {
            this.interpolators.push(new gltfInterpolator());
        }
    }

    advance(gltf, totalTime)
    {
        if(this.channels === undefined)
        {
            return;
        }

        if(this.maxTime == 0)
        {
            for(let i = 0; i < this.channels.length; ++i)
            {
                const channel = this.channels[i];
                const sampler = this.samplers[channel.sampler];
                const input = gltf.accessors[sampler.input].getDeinterlacedView(gltf);
                const max = input[input.length - 1];
                if(max > this.maxTime)
                {
                    this.maxTime = max;
                }
            }
        }

        for(let i = 0; i < this.interpolators.length; ++i)
        {
            const channel = this.channels[i];
            const sampler = this.samplers[channel.sampler];
            const interpolator = this.interpolators[i];

            const node = gltf.nodes[channel.target.node];

            switch(channel.target.path)
            {
            case InterpolationPath.TRANSLATION:
                node.applyTranslation(interpolator.interpolate(gltf, channel, sampler, totalTime, 3, this.maxTime));
                break;
            case InterpolationPath.ROTATION:
                node.applyRotation(interpolator.interpolate(gltf, channel, sampler, totalTime, 4, this.maxTime));
                break;
            case InterpolationPath.SCALE:
                node.applyScale(interpolator.interpolate(gltf, channel, sampler, totalTime, 3, this.maxTime));
                break;
            case InterpolationPath.WEIGHTS:
            {
                const mesh = gltf.meshes[node.mesh];
                mesh.weights = interpolator.interpolate(gltf, channel, sampler, totalTime, mesh.weights.length, this.maxTime);
                break;
            }
            }
        }
    }
}

class gltfSkin extends GltfObject
{
    constructor()
    {
        super();

        this.name = "";
        this.inverseBindMatrices = undefined;
        this.joints = [];
        this.skeleton = undefined;

        // not gltf
        this.jointMatrices = [];
        this.jointNormalMatrices = [];
    }

    computeJoints(gltf, parentNode)
    {
        const ibmAccessor = gltf.accessors[this.inverseBindMatrices].getDeinterlacedView(gltf);
        this.jointMatrices = [];
        this.jointNormalMatrices = [];

        let i = 0;
        for(const joint of this.joints)
        {
            const node = gltf.nodes[joint];

            let jointMatrix = create$1();
            let ibm = jsToGlSlice(ibmAccessor, i++ * 16, 16);
            mul(jointMatrix, node.worldTransform, ibm);
            mul(jointMatrix, parentNode.inverseWorldTransform, jointMatrix);
            this.jointMatrices.push(jointMatrix);

            let normalMatrix = create$1();
            invert(normalMatrix, jointMatrix);
            transpose(normalMatrix, normalMatrix);
            this.jointNormalMatrices.push(normalMatrix);
        }
    }
}

class gltfVariant extends GltfObject
{
    constructor()
    {
        super();
        this.name = undefined;
    }

    fromJson(jsonVariant)
    {
        if(jsonVariant.name !== undefined)
        {
            this.name = jsonVariant.name;
        }
    }
}

class glTF extends GltfObject
{
    constructor(file)
    {
        super();
        this.asset = undefined;
        this.accessors = [];
        this.nodes = [];
        this.scene = undefined; // the default scene to show.
        this.scenes = [];
        this.cameras = [];
        this.lights = [];
        this.imageBasedLights = [];
        this.textures = [];
        this.images = [];
        this.samplers = [];
        this.meshes = [];
        this.buffers = [];
        this.bufferViews = [];
        this.materials = [];
        this.animations = [];
        this.skins = [];
        this.path = file;
    }

    initGl(webGlContext)
    {
        initGlForMembers(this, this, webGlContext);
    }

    fromJson(json)
    {
        super.fromJson(json);

        this.asset = objectFromJson(json.asset, gltfAsset);
        this.cameras = objectsFromJsons(json.cameras, gltfCamera);
        this.accessors = objectsFromJsons(json.accessors, gltfAccessor);
        this.meshes = objectsFromJsons(json.meshes, gltfMesh);
        this.samplers = objectsFromJsons(json.samplers, gltfSampler);
        this.materials = objectsFromJsons(json.materials, gltfMaterial);
        this.buffers = objectsFromJsons(json.buffers, gltfBuffer);
        this.bufferViews = objectsFromJsons(json.bufferViews, gltfBufferView);
        this.scenes = objectsFromJsons(json.scenes, gltfScene);
        this.textures = objectsFromJsons(json.textures, gltfTexture);
        this.nodes = objectsFromJsons(json.nodes, gltfNode);
        this.lights = objectsFromJsons(getJsonLightsFromExtensions(json.extensions), gltfLight);
        this.imageBasedLights = objectsFromJsons(getJsonIBLsFromExtensions(json.extensions), ImageBasedLight);
        this.images = objectsFromJsons(json.images, gltfImage);
        this.animations = objectsFromJsons(json.animations, gltfAnimation);
        this.skins = objectsFromJsons(json.skins, gltfSkin);
        this.variants = objectsFromJsons(getJsonVariantsFromExtension(json.extensions), gltfVariant);
        this.variants = enforceVariantsUniqueness(this.variants);

        this.materials.push(gltfMaterial.createDefault());
        this.samplers.push(gltfSampler.createDefault());

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
    }
}

function getJsonLightsFromExtensions(extensions)
{
    if (extensions === undefined)
    {
        return [];
    }
    if (extensions.KHR_lights_punctual === undefined)
    {
        return [];
    }
    return extensions.KHR_lights_punctual.lights;
}

function getJsonIBLsFromExtensions(extensions)
{
    if (extensions === undefined)
    {
        return [];
    }
    if (extensions.KHR_lights_image_based === undefined)
    {
        return [];
    }
    return extensions.KHR_lights_image_based.imageBasedLights;
}

function getJsonVariantsFromExtension(extensions)
{
    if (extensions === undefined)
    {
        return [];
    }
    if (extensions.KHR_materials_variants === undefined)
    {
        return [];
    }
    return extensions.KHR_materials_variants.variants;
}

function enforceVariantsUniqueness(variants)
{
    for(let i=0;i<variants.length;i++)
    {
        const name = variants[i].name;
        for(let j=i+1;j<variants.length;j++)
        {
            if(variants[j].name == name)
            {
                variants[j].name += "0";  // Add random character to duplicates
            }
        }
    }


    return variants;
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
        const stringBuffer = new TextDecoder("utf-8").decode(jsonSlice);
        return JSON.parse(stringBuffer);
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

class gltfImageProcessor
{
    processImages(gltf)
    {
        for (const gltfImage of gltf.images)
        {
            const image = gltfImage.image;

            if (gltfImage.mimeType === ImageMimeType.KTX2 ||
                gltfImage.mimeType === ImageMimeType.GLTEXTURE)
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

class gltfLoader
{
    static async load(gltf, webGlContext, appendix = undefined)
    {
        const buffers = gltfLoader.getBuffers(appendix);
        const additionalFiles = gltfLoader.getAdditionalFiles(appendix);

        const buffersPromise = gltfLoader.loadBuffers(gltf, buffers, additionalFiles);

        await buffersPromise; // images might be stored in the buffers
        const imagesPromise = gltfLoader.loadImages(gltf, additionalFiles)
            .then(() => gltfLoader.processImages(gltf));

        return await Promise.all([buffersPromise, imagesPromise])
            .then(() => gltf.initGl(webGlContext));
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

    static getBuffers(appendix)
    {
        return gltfLoader.getTypedAppendix(appendix, ArrayBuffer);
    }

    static getAdditionalFiles(appendix)
    {
        return gltfLoader.getTypedAppendix(appendix, File);
    }

    static getTypedAppendix(appendix, Type)
    {
        if (appendix && appendix.length > 0)
        {
            if (appendix[0] instanceof Type)
            {
                return appendix;
            }
        }
    }

    static loadBuffers(gltf, buffers, additionalFiles)
    {
        const promises = [];
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
        return Promise.all(promises);
    }

    static loadImages(gltf, additionalFiles)
    {
        const imagePromises = [];
        for (let image of gltf.images)
        {
            imagePromises.push(image.load(gltf, additionalFiles));
        }
        return Promise.all(imagePromises);
    }

    static processImages(gltf)
    {
        const imageProcessor = new gltfImageProcessor();
        imageProcessor.processImages(gltf);
    }
}

var iblFiltering = "precision mediump float;\n#define GLSLIFY 1\n#define MATH_PI 3.1415926535897932384626433832795\nuniform samplerCube uCubeMap;const int cLambertian=0;const int cGGX=1;const int cCharlie=2;uniform float u_roughness;uniform int u_sampleCount;uniform int u_width;uniform float u_lodBias;uniform int u_distribution;uniform int u_currentFace;in vec2 texCoord;out vec4 fragmentColor;vec3 uvToXYZ(int face,vec2 uv){if(face==0)return vec3(1.f,uv.y,-uv.x);else if(face==1)return vec3(-1.f,uv.y,uv.x);else if(face==2)return vec3(+uv.x,-1.f,+uv.y);else if(face==3)return vec3(+uv.x,1.f,-uv.y);else if(face==4)return vec3(+uv.x,uv.y,1.f);else{return vec3(-uv.x,+uv.y,-1.f);}}vec2 dirToUV(vec3 dir){return vec2(0.5f+0.5f*atan(dir.z,dir.x)/MATH_PI,1.f-acos(dir.y)/MATH_PI);}float saturate(float v){return clamp(v,0.0f,1.0f);}float bitfieldReverse(uint bits){bits=(bits<<16u)|(bits>>16u);bits=((bits&0x55555555u)<<1u)|((bits&0xAAAAAAAAu)>>1u);bits=((bits&0x33333333u)<<2u)|((bits&0xCCCCCCCCu)>>2u);bits=((bits&0x0F0F0F0Fu)<<4u)|((bits&0xF0F0F0F0u)>>4u);bits=((bits&0x00FF00FFu)<<8u)|((bits&0xFF00FF00u)>>8u);return float(bits);}float Hammersley(uint i){return bitfieldReverse(i)*2.3283064365386963e-10;}vec3 getImportanceSampleDirection(vec3 normal,float sinTheta,float cosTheta,float phi){vec3 H=normalize(vec3(sinTheta*cos(phi),sinTheta*sin(phi),cosTheta));vec3 bitangent=vec3(0.0,1.0,0.0);float NdotX=dot(normal,vec3(1.0,0.0,0.0));float NdotY=dot(normal,vec3(0.0,1.0,0.0));float NdotZ=dot(normal,vec3(0.0,0.0,1.0));if(abs(NdotY)>abs(NdotX)&&abs(NdotY)>abs(NdotZ)){if(NdotY>0.0){bitangent=vec3(0.0,0.0,1.0);}else{bitangent=vec3(0.0,0.0,-1.0);}}vec3 tangent=cross(bitangent,normal);bitangent=cross(normal,tangent);return normalize(tangent*H.x+bitangent*H.y+normal*H.z);}float V_Ashikhmin(float NdotL,float NdotV){return clamp(1.0/(4.0*(NdotL+NdotV-NdotL*NdotV)),0.0,1.0);}float D_GGX(float NdotH,float roughness){float alpha=roughness*roughness;float alpha2=alpha*alpha;float divisor=NdotH*NdotH*(alpha2-1.0)+1.0;return alpha2/(MATH_PI*divisor*divisor);}float D_Ashikhmin(float NdotH,float roughness){float alpha=roughness*roughness;float a2=alpha*alpha;float cos2h=NdotH*NdotH;float sin2h=1.0-cos2h;float sin4h=sin2h*sin2h;float cot2=-cos2h/(a2*sin2h);return 1.0/(MATH_PI*(4.0*a2+1.0)*sin4h)*(4.0*exp(cot2)+sin4h);}float D_Charlie(float sheenRoughness,float NdotH){sheenRoughness=max(sheenRoughness,0.000001);float alphaG=sheenRoughness*sheenRoughness;float invR=1.0/alphaG;float cos2h=NdotH*NdotH;float sin2h=1.0-cos2h;return(2.0+invR)*pow(sin2h,invR*0.5)/(2.0*MATH_PI);}vec3 getSampleVector(int sampleIndex,vec3 N,float roughness){float X=float(sampleIndex)/float(u_sampleCount);float Y=Hammersley(uint(sampleIndex));float phi=2.0*MATH_PI*X;float cosTheta=0.f;float sinTheta=0.f;if(u_distribution==cLambertian){cosTheta=1.0-Y;sinTheta=sqrt(1.0-cosTheta*cosTheta);}else if(u_distribution==cGGX){float alpha=roughness*roughness;cosTheta=sqrt((1.0-Y)/(1.0+(alpha*alpha-1.0)*Y));sinTheta=sqrt(1.0-cosTheta*cosTheta);}else if(u_distribution==cCharlie){float alpha=roughness*roughness;sinTheta=pow(Y,alpha/(2.0*alpha+1.0));cosTheta=sqrt(1.0-sinTheta*sinTheta);}return getImportanceSampleDirection(N,sinTheta,cosTheta,phi);}float PDF(vec3 V,vec3 H,vec3 N,vec3 L,float roughness){if(u_distribution==cLambertian){float NdotL=dot(N,L);return max(NdotL*(1.0/MATH_PI),0.0);}else if(u_distribution==cGGX){float VdotH=dot(V,H);float NdotH=dot(N,H);float D=D_GGX(NdotH,roughness);return max(D*NdotH/(4.0*VdotH),0.0);}else if(u_distribution==cCharlie){float VdotH=dot(V,H);float NdotH=dot(N,H);float D=D_Charlie(roughness,NdotH);return max(D*NdotH/abs(4.0*VdotH),0.0);}return 0.f;}vec3 filterColor(vec3 N){vec4 color=vec4(0.f);float solidAngleTexel=4.0*MATH_PI/(6.0*float(u_width)*float(u_width));for(int i=0;i<u_sampleCount;++i){vec3 H=getSampleVector(i,N,u_roughness);vec3 V=N;vec3 L=normalize(reflect(-V,H));float NdotL=dot(N,L);if(NdotL>0.0){float lod=0.0;if(u_roughness>0.0||u_distribution==cLambertian){float pdf=PDF(V,H,N,L,u_roughness);float solidAngleSample=1.0/(float(u_sampleCount)*pdf);lod=0.5*log2(solidAngleSample/solidAngleTexel);lod+=u_lodBias;}if(u_distribution==cLambertian){color+=vec4(textureLod(uCubeMap,H,lod).rgb,1.0);}else{color+=vec4(textureLod(uCubeMap,L,lod).rgb*NdotL,NdotL);}}}if(color.w==0.f){return color.rgb;}return color.rgb/color.w;}float V_SmithGGXCorrelated(float NoV,float NoL,float roughness){float a2=pow(roughness,4.0);float GGXV=NoL*sqrt(NoV*NoV*(1.0-a2)+a2);float GGXL=NoV*sqrt(NoL*NoL*(1.0-a2)+a2);return 0.5/(GGXV+GGXL);}vec3 LUT(float NdotV,float roughness){vec3 V=vec3(sqrt(1.0-NdotV*NdotV),0.0,NdotV);vec3 N=vec3(0.0,0.0,1.0);float A=0.0;float B=0.0;float C=0.0;for(int i=0;i<u_sampleCount;++i){vec3 H=getSampleVector(i,N,roughness);vec3 L=normalize(reflect(-V,H));float NdotL=saturate(L.z);float NdotH=saturate(H.z);float VdotH=saturate(dot(V,H));if(NdotL>0.0){if(u_distribution==cGGX){float V_pdf=V_SmithGGXCorrelated(NdotV,NdotL,roughness)*VdotH*NdotL/NdotH;float Fc=pow(1.0-VdotH,5.0);A+=(1.0-Fc)*V_pdf;B+=Fc*V_pdf;C+=0.0;}if(u_distribution==cCharlie){float sheenDistribution=D_Charlie(roughness,NdotH);float sheenVisibility=V_Ashikhmin(NdotL,NdotV);A+=0.0;B+=0.0;C+=sheenVisibility*sheenDistribution*NdotL*VdotH;}}}return vec3(4.0*A,4.0*B,4.0*2.0*MATH_PI*C)/float(u_sampleCount);}void main(){vec2 newUV=texCoord;newUV=newUV*2.0-1.0;vec3 scan=uvToXYZ(u_currentFace,newUV);vec3 direction=normalize(scan);direction.y=-direction.y;vec3 color=filterColor(direction);fragmentColor=vec4(color,1.0);}"; // eslint-disable-line

var panoramaToCubeMap = "#define MATH_PI 3.1415926535897932384626433832795\n#define MATH_INV_PI (1.0 / MATH_PI)\nprecision highp float;\n#define GLSLIFY 1\nin vec2 texCoord;out vec4 fragmentColor;uniform int u_currentFace;uniform sampler2D u_inputTexture;uniform sampler2D u_panorama;vec3 uvToXYZ(int face,vec2 uv){if(face==0)return vec3(1.f,uv.y,-uv.x);else if(face==1)return vec3(-1.f,uv.y,uv.x);else if(face==2)return vec3(+uv.x,-1.f,+uv.y);else if(face==3)return vec3(+uv.x,1.f,-uv.y);else if(face==4)return vec3(+uv.x,uv.y,1.f);else{return vec3(-uv.x,+uv.y,-1.f);}}vec2 dirToUV(vec3 dir){return vec2(0.5f+0.5f*atan(dir.z,dir.x)/MATH_PI,1.f-acos(dir.y)/MATH_PI);}vec3 panoramaToCubeMap(int face,vec2 texCoord){vec2 texCoordNew=texCoord*2.0-1.0;vec3 scan=uvToXYZ(face,texCoordNew);vec3 direction=normalize(scan);vec2 src=dirToUV(direction);return texture(u_panorama,src).rgb;}void main(void){fragmentColor=vec4(0.0,0.0,0.0,1.0);fragmentColor.rgb=panoramaToCubeMap(u_currentFace,texCoord);}"; // eslint-disable-line

var debugOutput = "precision highp float;\n#define GLSLIFY 1\nin vec2 texCoord;out vec4 fragmentColor;uniform int u_currentFace;uniform samplerCube u_inputTexture;vec3 uvToXYZ(int face,vec2 uv){if(face==0)return vec3(1.f,uv.y,-uv.x);else if(face==1)return vec3(-1.f,uv.y,uv.x);else if(face==2)return vec3(+uv.x,-1.f,+uv.y);else if(face==3)return vec3(+uv.x,1.f,-uv.y);else if(face==4)return vec3(+uv.x,uv.y,1.f);else{return vec3(-uv.x,+uv.y,-1.f);}}void main(void){fragmentColor=vec4(texCoord.x*10.0,0.0,texCoord.y*10.0,1.0);vec2 newUV=texCoord;newUV=newUV*2.0-1.0;vec4 textureColor=vec4(0.0,0.0,0.0,1.0);vec3 direction=normalize(uvToXYZ(u_currentFace,newUV.xy));textureColor=textureLod(u_inputTexture,direction,1.0);if(texCoord.x>0.1){fragmentColor=textureColor;}if(texCoord.y>0.1){fragmentColor=textureColor;}}"; // eslint-disable-line

var fullscreenShader = "precision highp float;\n#define GLSLIFY 1\nout vec2 texCoord;void main(void){float x=float((gl_VertexID&1)<<2);float y=float((gl_VertexID&2)<<1);texCoord.x=x*0.5;texCoord.y=y*0.5;gl_Position=vec4(x-1.0,y-1.0,0,1);}"; // eslint-disable-line

// How to use:
// set canvas/context in constructor
// init(input: panorama image)
// filterAll()
// fetch texture IDs

class iblSampler
{
    constructor(view)
    {

        this.gl = view.context;

        this.currentWidth = view.canvas.width;
        this.currentHeight = view.canvas.height;

        this.textureSize = 256;
        this.sampleCount = 64;
        this.lodBias = 0.0;
        this.mipmapCount = undefined;


        this.lambertianTextureID = undefined;
        this.ggxTextureID = undefined;
        this.sheenTextureID = undefined;


        this.inputTextureID = undefined;
        this.cubemapTextureID = undefined;
        this.framebuffer = undefined;

        const shaderSources = new Map();

        shaderSources.set("fullscreen.vert", fullscreenShader);
        shaderSources.set("panorama_to_cubemap.frag", panoramaToCubeMap);
        shaderSources.set("ibl_filtering.frag", iblFiltering);
        shaderSources.set("debug.frag", debugOutput);

        this.shaderCache = new ShaderCache(shaderSources, view.renderer.webGl);


    }

    /////////////////////////////////////////////////////////////////////


    loadTextureHDR(image)
    {

        var texture = this.gl.createTexture();

        this.gl.bindTexture( this.gl.TEXTURE_2D,  texture);

        this.gl.bindTexture( this.gl.TEXTURE_2D, texture); // as this function is asynchronus, another texture could be set in between


        var internalFormat = this.gl.RGB32F;
        var format = this.gl.RGB;
        var type = this.gl.FLOAT;
        var data = undefined;

        if (image.dataFloat instanceof Float32Array)
        {
            internalFormat = this.gl.RGB32F;
            format = this.gl.RGB;
            type = this.gl.FLOAT;
            data = image.dataFloat;
        }

        if (image instanceof Image)
        {
            internalFormat = this.gl.RGBA;
            format = this.gl.RGBA;
            type = this.gl.UNSIGNED_BYTE;
            data = image;
        }



        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0, //level
            internalFormat,
            image.width,
            image.height,
            0, //border
            format,
            type,
            data);

        this.gl.texParameteri( this.gl.TEXTURE_2D,  this.gl.TEXTURE_WRAP_S,  this.gl.MIRRORED_REPEAT);
        this.gl.texParameteri( this.gl.TEXTURE_2D,  this.gl.TEXTURE_WRAP_T,  this.gl.MIRRORED_REPEAT);
        this.gl.texParameteri( this.gl.TEXTURE_2D,  this.gl.TEXTURE_MIN_FILTER,  this.gl.LINEAR);
        this.gl.texParameteri( this.gl.TEXTURE_2D,  this.gl.TEXTURE_MAG_FILTER,  this.gl.LINEAR);

        return texture;
    }



    createCubemapTexture(withMipmaps)
    {
        var targetTexture =  this.gl.createTexture();
        this.gl.bindTexture( this.gl.TEXTURE_CUBE_MAP, targetTexture);


        // define size and format of level 0
        const level = 0;
        const internalFormat = this.use8bit ? this.gl.RGBA8 : this.gl.RGBA32F;
        const border = 0;
        const format = this.gl.RGBA;
        const type = this.use8bit ? this.gl.UNSIGNED_BYTE : this.gl.FLOAT;
        const data = null;

        for(var i = 0; i < 6; ++i)
        {
            this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, level, internalFormat,
                this.textureSize, this.textureSize, border,
                format, type, data);

        }

        if(withMipmaps)
        {
            this.gl.texParameteri( this.gl.TEXTURE_CUBE_MAP,  this.gl.TEXTURE_MIN_FILTER,  this.gl.LINEAR_MIPMAP_LINEAR);
        }
        else
        {
            this.gl.texParameteri( this.gl.TEXTURE_CUBE_MAP,  this.gl.TEXTURE_MIN_FILTER,  this.gl.LINEAR);
        }

        this.gl.texParameteri( this.gl.TEXTURE_CUBE_MAP,  this.gl.TEXTURE_MAG_FILTER,  this.gl.LINEAR);
        this.gl.texParameteri( this.gl.TEXTURE_CUBE_MAP,  this.gl.TEXTURE_WRAP_S,  this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri( this.gl.TEXTURE_CUBE_MAP,  this.gl.TEXTURE_WRAP_T,  this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri( this.gl.TEXTURE_CUBE_MAP,  this.gl.TEXTURE_WRAP_R,  this.gl.CLAMP_TO_EDGE);


        return targetTexture;
    }



    init(panoramaImage)
    {
        if (!this.gl.getExtension('EXT_color_buffer_float'))
        {
            this.use8bit = true;
        }

        this.inputTextureID = this.loadTextureHDR(panoramaImage);

        this.cubemapTextureID = this.createCubemapTexture(true);

        this.framebuffer = this.gl.createFramebuffer();

        this.lambertianTextureID = this.createCubemapTexture(false);
        this.ggxTextureID = this.createCubemapTexture(true);
        this.sheenTextureID = this.createCubemapTexture(true);


        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.ggxTextureID);
        this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);

        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.sheenTextureID);
        this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);

        this.mipmapLevels = Math.floor(Math.log2(this.textureSize))+1;
    }

    filterAll()
    {
        this.panoramaToCubeMap();
        this.cubeMapToLambertian();
        this.cubeMapToGGX();
        this.cubeMapToSheen();

        this.gl.bindFramebuffer(  this.gl.FRAMEBUFFER, null);
        this.gl.viewport(0, 0, this.currentWidth, this.currentHeight);//ToDo
    }




    panoramaToCubeMap()
    {
        for(var i = 0; i < 6; ++i)
        {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
            var side = i;
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+side, this.cubemapTextureID, 0);

            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.cubemapTextureID);

            this.gl.viewport(0, 0,  this.textureSize,  this.textureSize);

            this.gl.clearColor(1.0, 0.0, 0.0, 0.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT| this.gl.DEPTH_BUFFER_BIT);

            const vertexHash = this.shaderCache.selectShader("fullscreen.vert", []);
            const fragmentHash = this.shaderCache.selectShader("panorama_to_cubemap.frag", []);

            var shader = this.shaderCache.getShaderProgram(fragmentHash, vertexHash);
            this.gl.useProgram(shader.program);

            //  TEXTURE0 = active.
            this.gl.activeTexture(this.gl.TEXTURE0+0);

            // Bind texture ID to active texture
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.inputTextureID);

            // map shader uniform to texture unit (TEXTURE0)
            const location = this.gl.getUniformLocation(shader.program,"u_panorama");
            this.gl.uniform1i(location, 0); // texture unit 0 (TEXTURE0)

            shader.updateUniform("u_currentFace", i);

            //fullscreen triangle
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
        }

        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.cubemapTextureID);
        this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);

    }


    applyFilter(
        distribution,
        roughness,
        targetMipLevel,
        targetTexture)
    {
        var currentTextureSize =  this.textureSize>>(targetMipLevel);

        for(var i = 0; i < 6; ++i)
        {

            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
            var side = i;
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+side, targetTexture, targetMipLevel);

            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, targetTexture);

            this.gl.viewport(0, 0, currentTextureSize, currentTextureSize);

            this.gl.clearColor(1.0, 0.0, 0.0, 0.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT| this.gl.DEPTH_BUFFER_BIT);


            const vertexHash = this.shaderCache.selectShader("fullscreen.vert", []);
            const fragmentHash = this.shaderCache.selectShader("ibl_filtering.frag", []);

            var shader = this.shaderCache.getShaderProgram(fragmentHash, vertexHash);
            this.gl.useProgram(shader.program);


            //  TEXTURE0 = active.
            this.gl.activeTexture(this.gl.TEXTURE0+0);

            // Bind texture ID to active texture
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.cubemapTextureID);

            // map shader uniform to texture unit (TEXTURE0)
            const location = this.gl.getUniformLocation(shader.program,"u_cubemapTexture");
            this.gl.uniform1i(location, 0); // texture unit 0


            shader.updateUniform("u_roughness", roughness);
            shader.updateUniform("u_sampleCount", this.sampleCount);
            shader.updateUniform("u_width", this.textureSize);
            shader.updateUniform("u_lodBias", this.lodBias);
            shader.updateUniform("u_distribution", distribution);
            shader.updateUniform("u_currentFace", i);


            //fullscreen triangle
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

        }

    }

    cubeMapToLambertian()
    {
        this.applyFilter(
            0,
            0.0,
            0,
            this.lambertianTextureID);
    }


    cubeMapToGGX()
    {
        for(var currentMipLevel = 0; currentMipLevel < this.mipmapLevels; ++currentMipLevel)
        {
            const roughness =  (currentMipLevel) /  (this.mipmapLevels - 1);
            this.applyFilter(
                1,
                roughness,
                currentMipLevel,
                this.ggxTextureID);
        }
    }

    cubeMapToSheen()
    {
        for(var currentMipLevel = 0; currentMipLevel < this.mipmapLevels; ++currentMipLevel)
        {
            const roughness =  (currentMipLevel) /  (this.mipmapLevels - 1);
            this.applyFilter(
                2,
                roughness,
                currentMipLevel,
                this.sheenTextureID);
        }
    }


    destroy()
    {
        this.shaderCache.destroy();
    }
}

class KtxDecoder {

    constructor (context, externalKtxlib) {
        this.gl = context;
        this.libktx = null;
        if (context !== undefined)
        {
            if (externalKtxlib === undefined && LIBKTX !== undefined)
            {
                externalKtxlib = LIBKTX;
            }
            if (externalKtxlib !== undefined)
            {
                this.initializied = this.init(context, externalKtxlib);
            }
            else
            {
                console.error('Failed to initalize KTXDecoder: ktx library undefined');
                return undefined;
            }
        }
        else
        {
            console.error('Failed to initalize KTXDecoder: WebGL context undefined');
            return undefined;
        }
    }

    async init(context, externalKtxlib) {
        this.libktx = await externalKtxlib({preinitializedWebGLContext: context});
        this.libktx.GL.makeContextCurrent(this.libktx.GL.createContext(null, { majorVersion: 2.0 }));
    }

    transcode(ktexture) {
        if (ktexture.needsTranscoding) {
            let format;

            let astcSupported = false;
            let etcSupported = false;
            let dxtSupported = false;
            let pvrtcSupported = false;

            astcSupported = !!this.gl.getExtension('WEBGL_compressed_texture_astc');
            etcSupported = !!this.gl.getExtension('WEBGL_compressed_texture_etc1');
            dxtSupported = !!this.gl.getExtension('WEBGL_compressed_texture_s3tc');
            pvrtcSupported = !!(this.gl.getExtension('WEBGL_compressed_texture_pvrtc')) || !!(this.gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc'));

            if (astcSupported) {
                format = this.libktx.TranscodeTarget.ASTC_4x4_RGBA;
            } else if (dxtSupported) {
                format = this.libktx.TranscodeTarget.BC1_OR_3;
            } else if (pvrtcSupported) {
                format = this.libktx.TranscodeTarget.PVRTC1_4_RGBA;
            } else if (etcSupported) {
                format = this.libktx.TranscodeTarget.ETC;
            } else {
                format = this.libktx.TranscodeTarget.RGBA8888;
            }
            if (ktexture.transcodeBasis(format, 0) != this.libktx.ErrorCode.SUCCESS) {
                console.warn('Texture transcode failed. See console for details.');
            }
        }
    }

    async loadKtxFromUri(uri) {
        await this.initializied;
        const response = await fetch(uri);
        const data = new Uint8Array(await response.arrayBuffer());
        const texture = new this.libktx.ktxTexture(data);
        this.transcode(texture);
        let uploadResult = texture.glUpload();
        uploadResult.texture.levels = Math.log2(texture.baseWidth);
        return uploadResult.texture;
    }

    async loadKtxFromBuffer(data) {
        await this.initializied;
        const texture = new this.libktx.ktxTexture(data);
        this.transcode(texture);
        const uploadResult = texture.glUpload();
        return uploadResult.texture;
    }
}

/**
 * hdrpng.js - Original code from Enki https://enkimute.github.io/hdrpng.js/
 *
 * Refactored and simplified.
 */

function HDRImage() {
    var res = document.createElement('canvas'), HDRdata=null;
    res.__defineGetter__('dataFloat',function(){ return rgbeToFloat(HDRdata); });
    res.__defineGetter__('dataRGBE',function(){ return HDRdata; });
    res.loadHDR = async function(val){
        if (typeof val === "string" && val.match(/\.hdr$/i))
        {
            loadHDRFromURL(val,function(img, width, height) {
                HDRdata = img;
                this.width  = this.style.width  = width;
                this.height = this.style.height = height;
                this.onload && this.onload();
            }.bind(res));
        }
        else
        {
            loadHDR(val,function(img, width, height) {
                HDRdata = img;
                this.width  = this.style.width  = width;
                this.height = this.style.height = height;
                this.onload && this.onload();
            }.bind(res));
        }
    };
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
function loadHDRFromURL(url, completion ) {
    var req = m(new XMLHttpRequest(),{responseType:"arraybuffer"});
    req.onerror = completion.bind(req,false);
    req.onload  = function() {
        if (this.status>=400) return this.onerror();
        loadHDR(new Uint8Array(this.response), completion);
    };
    req.open("GET",url,true);
    req.send(null);
    return req;
}

async function loadHDR(buffer, callback)
{
    var header='',pos=0,d8=buffer,format;
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
    callback && callback(img,width,height);
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

function initKtxLib(view, ktxlib)
{
    view.ktxDecoder = new KtxDecoder(view.context,ktxlib);
}

async function initDracoLib(dracolib)
{
    const dracoDecoder = new DracoDecoder(dracolib);
    if (dracoDecoder !== undefined)
    {
        await dracoDecoder.ready();
    }
}

async function loadGltf(file, view, additionalFiles)
{
    let isGlb = undefined;
    let buffers = undefined;
    let json = undefined;
    let data = undefined;
    if(typeof file === "string")
    {
        isGlb = getIsGlb(file);
        let response = await axios$1.get(file, { responseType: isGlb ? "arraybuffer" : "json" });
        json = response.data;
        data = response.data;
    }
    else
    {
        let fileContent = file;
        file = file.name;
        isGlb = getIsGlb(file);
        if (isGlb)
        {
            data = await AsyncFileReader.readAsArrayBuffer(fileContent);
        }
        else
        {
            data = await AsyncFileReader.readAsText(fileContent);
            json = JSON.parse(data);
            buffers = additionalFiles;
        }
    }

    if (isGlb)
    {
        const glbParser = new GlbParser(data);
        const glb = glbParser.extractGlbData();
        json = glb.json;
        buffers = glb.buffers;
    }

    const gltf = new glTF(file);
    gltf.ktxDecoder = view.ktxDecoder;
    //Make sure draco decoder instance is ready
    gltf.fromJson(json);

    // because the gltf image paths are not relative
    // to the gltf, we have to resolve all image paths before that
    for (const image of gltf.images)
    {
        image.resolveRelativePath(getContainingFolder(gltf.path));
    }

    await gltfLoader.load(gltf, view.context, buffers);

    return gltf;
}


async function loadEnvironment(file, view)
{
    let image = new HDRImage();
    if (typeof file === "string")
    {
        await image.loadHDR(file);
        await new Promise((resolve, reject) => {
            image.onload = () => resolve(image);
            image.onerror = reject;
        });
    }
    else
    {
        const imageData = await AsyncFileReader.readAsArrayBuffer(file).catch( () => {
            console.error("Could not load image with FileReader");
        });
        await image.loadHDR(new Uint8Array(imageData));
    }
    return loadEnvironmentFromImage(image, view);
}


async function loadEnvironmentFromImage(imageHDR, view)
{
    // The environment uses the same type of samplers, textures and images as used in the glTF class
    // so we just use it as a template
    const environment = new glTF();

    //
    // Prepare samplers.
    //

    let samplerIdx = environment.samplers.length;

    environment.samplers.push(new gltfSampler(WebGL2RenderingContext.LINEAR, WebGL2RenderingContext.LINEAR, WebGL2RenderingContext.CLAMP_TO_EDGE, WebGL2RenderingContext.CLAMP_TO_EDGE, "DiffuseCubeMapSampler"));
    const diffuseCubeSamplerIdx = samplerIdx++;

    environment.samplers.push(new gltfSampler(WebGL2RenderingContext.LINEAR, WebGL2RenderingContext.LINEAR_MIPMAP_LINEAR, WebGL2RenderingContext.CLAMP_TO_EDGE, WebGL2RenderingContext.CLAMP_TO_EDGE, "SpecularCubeMapSampler"));
    const specularCubeSamplerIdx = samplerIdx++;

    environment.samplers.push(new gltfSampler(WebGL2RenderingContext.LINEAR, WebGL2RenderingContext.LINEAR_MIPMAP_LINEAR, WebGL2RenderingContext.CLAMP_TO_EDGE, WebGL2RenderingContext.CLAMP_TO_EDGE, "SheenCubeMapSampler"));
    const sheenCubeSamplerIdx = samplerIdx++;

    environment.samplers.push(new gltfSampler(WebGL2RenderingContext.LINEAR, WebGL2RenderingContext.LINEAR, WebGL2RenderingContext.CLAMP_TO_EDGE, WebGL2RenderingContext.CLAMP_TO_EDGE, "LUTSampler"));
    const lutSamplerIdx = samplerIdx++;

    //
    // Prepare images and textures.
    //

    let imageIdx = environment.images.length;

    let environmentFiltering = new iblSampler(view);

    environmentFiltering.init(imageHDR);
    environmentFiltering.filterAll();

    // Diffuse

    const diffuseGltfImage = new gltfImage(
        undefined,
        WebGL2RenderingContext.TEXTURE_CUBE_MAP,
        0,
        undefined,
        "Diffuse",
        ImageMimeType.GLTEXTURE,
        environmentFiltering.lambertianTextureID
        );

    environment.images.push(diffuseGltfImage);

    const diffuseTexture = new gltfTexture(
        diffuseCubeSamplerIdx,
        [imageIdx++],
        WebGL2RenderingContext.TEXTURE_CUBE_MAP,
        environmentFiltering.lambertianTextureID);

    environment.textures.push(diffuseTexture);

    environment.diffuseEnvMap = new gltfTextureInfo(environment.textures.length - 1, 0, true);
    environment.diffuseEnvMap.generateMips = false;



    // Specular
    const specularGltfImage = new gltfImage(
        undefined,
        WebGL2RenderingContext.TEXTURE_CUBE_MAP,
        0,
        undefined,
        "Specular",
        ImageMimeType.GLTEXTURE,
        environmentFiltering.ggxTextureID
        );

    environment.images.push(specularGltfImage);

    const specularTexture = new gltfTexture(
        specularCubeSamplerIdx,
        [imageIdx++],
        WebGL2RenderingContext.TEXTURE_CUBE_MAP,
        environmentFiltering.ggxTextureID);

    environment.textures.push(specularTexture);

    environment.specularEnvMap = new gltfTextureInfo(environment.textures.length - 1, 0, true);
    environment.specularEnvMap.generateMips = false;


    // Sheen
    const sheenGltfImage = new gltfImage(
        undefined,
        WebGL2RenderingContext.TEXTURE_CUBE_MAP,
        0,
        undefined,
        "Sheen",
        ImageMimeType.GLTEXTURE,
        environmentFiltering.ggxTextureID
        );

    environment.images.push(sheenGltfImage);

    const sheenTexture = new gltfTexture(
        sheenCubeSamplerIdx,
        [imageIdx++],
        WebGL2RenderingContext.TEXTURE_CUBE_MAP,
        environmentFiltering.sheenTextureID);

    environment.textures.push(sheenTexture);

    environment.sheenEnvMap = new gltfTextureInfo(environment.textures.length - 1, 0, true);
    environment.sheenEnvMap.generateMips = false;

/*
    // Diffuse

    const lambertian = new gltfImage(filteredEnvironmentsDirectoryPath + "/lambertian/diffuse.ktx2", WebGL2RenderingContext.TEXTURE_CUBE_MAP);
    lambertian.mimeType = ImageMimeType.KTX2;
    environment.images.push(lambertian);
    environment.textures.push(new gltfTexture(diffuseCubeSamplerIdx, [imageIdx++], WebGL2RenderingContext.TEXTURE_CUBE_MAP));
    environment.diffuseEnvMap = new gltfTextureInfo(environment.textures.length - 1, 0, true);
    environment.diffuseEnvMap.generateMips = false;

    // Specular

    const specular = new gltfImage(filteredEnvironmentsDirectoryPath + "/ggx/specular.ktx2", WebGL2RenderingContext.TEXTURE_CUBE_MAP);
    specular.mimeType = ImageMimeType.KTX2;
    environment.images.push(specular);
    environment.textures.push(new gltfTexture(specularCubeSamplerIdx, [imageIdx++], WebGL2RenderingContext.TEXTURE_CUBE_MAP));
    environment.specularEnvMap = new gltfTextureInfo(environment.textures.length - 1, 0, true);
    environment.specularEnvMap.generateMips = false;

    const specularImage = environment.images[environment.textures[environment.textures.length - 1].source];

    // Sheen

    const sheen = new gltfImage(filteredEnvironmentsDirectoryPath + "/charlie/sheen.ktx2", WebGL2RenderingContext.TEXTURE_CUBE_MAP);
    sheen.mimeType = ImageMimeType.KTX2;
    environment.images.push(sheen);
    environment.textures.push(new gltfTexture(sheenCubeSamplerIdx, [imageIdx++], WebGL2RenderingContext.TEXTURE_CUBE_MAP));
    environment.sheenEnvMap = new gltfTextureInfo(environment.textures.length - 1, 0, true);
    environment.sheenEnvMap.generateMips = false;*/

    //
    // Look Up Tables.
    //

    // GGX

    environment.images.push(new gltfImage("assets/images/lut_ggx.png", WebGL2RenderingContext.TEXTURE_2D));
    environment.textures.push(new gltfTexture(lutSamplerIdx, [imageIdx++], WebGL2RenderingContext.TEXTURE_2D));

    environment.lut = new gltfTextureInfo(environment.textures.length - 1);
    environment.lut.generateMips = false;

    // Sheen
    // Charlie

    environment.images.push(new gltfImage("assets/images/lut_charlie.png", WebGL2RenderingContext.TEXTURE_2D));
    environment.textures.push(new gltfTexture(lutSamplerIdx, [imageIdx++], WebGL2RenderingContext.TEXTURE_2D));

    environment.sheenLUT = new gltfTextureInfo(environment.textures.length - 1);
    environment.sheenLUT.generateMips = false;

    // Sheen E LUT

    environment.images.push(new gltfImage("assets/images/lut_sheen_E.png", WebGL2RenderingContext.TEXTURE_2D));
    environment.textures.push(new gltfTexture(lutSamplerIdx, [imageIdx++], WebGL2RenderingContext.TEXTURE_2D));

    environment.sheenELUT = new gltfTextureInfo(environment.textures.length - 1);
    environment.sheenELUT.generateMips = false;

    await gltfLoader.loadImages(environment).then(() => gltfLoader.processImages(environment));

    environment.initGl(view.context);

    environment.mipCount = environmentFiltering.mipmapLevels;

    return environment;
}

exports.GltfView = GltfView;
exports.combinePaths = combinePaths;
exports.computePrimitiveCentroids = computePrimitiveCentroids;
exports.getContainingFolder = getContainingFolder;
exports.getFileNameWithoutExtension = getFileNameWithoutExtension;
exports.getIsGlb = getIsGlb;
exports.getIsGltf = getIsGltf;
exports.getIsHdr = getIsHdr;
exports.glTF = glTF;
exports.initDracoLib = initDracoLib;
exports.initKtxLib = initKtxLib;
exports.loadEnvironment = loadEnvironment;
exports.loadGltf = loadGltf;
