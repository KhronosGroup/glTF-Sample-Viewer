#include <functions.glsl>

// Common constants
float PI = 3.14159265358979323846;

// XYZ to sRGB color space
const mat3 XYZ_TO_REC709 = mat3(
     3.2404542, -0.9692660,  0.0556434,
    -1.5371385,  1.8760108, -0.2040259,
    -0.4985314,  0.0415560,  1.0572252
);

// Fresnel equations for dielectric/dielectric interfaces.
// Ref: https://belcour.github.io/blog/research/2017/05/01/brdf-thin-film.html
// Evaluation XYZ sensitivity curves in Fourier space
vec3 evalSensitivity(vec3 opd, vec3 shift) {
    vec3 phase = 2.0 * PI * opd * 1.0e-9;
    vec3 val = vec3(5.4856e-13, 4.4201e-13, 5.2481e-13);
    vec3 pos = vec3(1.6810e+06, 1.7953e+06, 2.2084e+06);
    vec3 var = vec3(4.3278e+09, 9.3046e+09, 6.6121e+09);

    vec3 xyz = val * sqrt(2.0 * PI * var) * cos(pos * phase + shift) * exp(-sq(phase) * var);
    xyz.x += 9.7470e-14 * sqrt(2.0 * PI * 4.5282e+09) * cos(2.2399e+06 * phase[0] + shift[0]) * exp(-4.5282e+09 * sq(phase[0]));
    xyz /= 1.0685e-7;

    vec3 srgb = XYZ_TO_REC709 * xyz;
    return srgb;
}

/* Polarized Fresnel Term
*/
void fresnelConductorExact(float cosThetaI,
                           float eta, float k,
                           out float Rp2, out float Rs2) {
    /* Modified from "Optics" by K.D. Moeller, University Science Books, 1988 */

    float cosThetaI2 = sq(cosThetaI);
    float sinThetaI2 = 1.0 - cosThetaI2;
    float sinThetaI4 = sq(sinThetaI2);

    float temp1 = sq(eta) - sq(k) - sinThetaI2;
    float a2pb2 = sqrt(sq(temp1) + 4.0 * sq(k) * sq(eta));
    float a     = sqrt(0.5 * (a2pb2 + temp1));

    float term1 = a2pb2 + cosThetaI2;
    float term2 = 2.0 * a * cosThetaI;

    Rs2 = (term1 - term2) / (term1 + term2);
    if (Rs2 < 0.0) {
        Rs2 = 0.0;
    }
    float term3 = a2pb2 * cosThetaI2 + sinThetaI4;
    float term4 = term2 * sinThetaI2;

    Rp2 = Rs2 * (term3 - term4) / (term3 + term4);
    if (Rp2 < 0.0) {
        Rp2 = 0.0;
    }
}

// Add continuous atan implementation at (0.0, 0.0) for special case eta_2 == 1.0
vec3 continuousAtan(vec3 y, vec3 x) {
    if (y[0] == 0.0 && x[0] == 0.0) {
        x[0] = 1.0;
    }
    if (y[1] == 0.0 && x[1] == 0.0) {
        x[1] = 1.0;
    }
    if (y[2] == 0.0 && x[2] == 0.0) {
        x[2] = 1.0;
    }

    return atan(y, x);
}

/* Phase shift due to a conducting material.
 * See our appendix
 */
void fresnelPhaseExact(vec3 cost, vec3 eta1,
                       vec3 eta2, vec3 kappa2,
                       out vec3 phiP, out vec3 phiS) {
    vec3 sinThetaSqr = vec3(1.0) - sq(cost);
    vec3 A = sq(eta2) * (vec3(1.0) - sq(kappa2)) - sq(eta1) * sinThetaSqr;
    vec3 B = sqrt(sq(A) + sq(2.0 * sq(eta2) * kappa2));
    vec3 U = sqrt(max(A + B, vec3(0)) / 2.0);
    vec3 V = sqrt(max(B - A, vec3(0)) / 2.0);

    vec3 C = 2.0 * eta1 * V * cost;
    vec3 D = sq(U) + sq(V) - sq(eta1 * cost);
    phiS = continuousAtan(C, D);
    vec3 E = 2.0 * eta1 * sq(eta2) * cost * (2.0 * kappa2 * U - (vec3(1.0) - sq(kappa2)) * V);
    vec3 F = sq(sq(eta2) * (vec3(1.0) + sq(kappa2)) * cost) - sq(eta1) * (sq(U) + sq(V));
    phiP = continuousAtan(E, F);
}

// Main function expected by BRDF Explorer
vec3 evalIridescence(float eta1, float eta2, float cosTheta1, float Dinc, vec3 baseF0, float metallic) {
    vec3 I = vec3(0.0);

    vec3 eta_1 = vec3(eta1);

    // Force eta_2 -> 1.0 when Dinc -> 0.0
    vec3 eta_2 = mix(eta_1, vec3(eta2), smoothstep(0.0, 0.03, Dinc));

    vec3 eta_3, kappa_3;
    artisticIor(baseF0, mix(vec3(0.0), baseF0, metallic), eta_3, kappa_3);

    vec3 R12p, T121p, R23p, R12s, T121s, R23s, cosTheta2;
    for (int i = 0; i < 3; ++i) {
        // Reflected and transmitted parts in the thin film
        // Note: This part needs to compute the new ray direction cosTheta2[i]
        //       as cosTheta2[i] is wavelength dependent.
        float scale = eta_1[i] / eta_2[i]; //(cosTheta1 > 0) ? eta_1 / eta_2 : eta_2 / eta_1;
        float cosThetaTSqr = 1.0 - (1.0 - sq(cosTheta1)) * sq(scale);

        // Check for total internal reflection
        if (cosThetaTSqr <= 0.0) {
            R12s[i] = 1.0;
            R12p[i] = 1.0;

            // Compute the transmission coefficients
            T121p[i] = 0.0;
            T121s[i] = 0.0;
        } else {
            cosTheta2[i] = sqrt(cosThetaTSqr);
            fresnelConductorExact(cosTheta1, eta_2[i] / eta_1[i], 0.0, R12p[i], R12s[i]);

            // Reflected part by the base
            fresnelConductorExact(cosTheta2[i], eta_3[i] / eta_2[i], kappa_3[i] / eta_2[i], R23p[i], R23s[i]);

            // Compute the transmission coefficients
            T121p[i] = 1.0 - R12p[i];
            T121s[i] = 1.0 - R12s[i];
        }
    }

    // Optical Path Difference
    vec3 OPD = 2.0 * eta_2 * Dinc * cosTheta2;

    // Variables
    vec3 phi21p = vec3(0.0);
    vec3 phi21s = vec3(0.0);
    vec3 phi23p = vec3(0.0);
    vec3 phi23s = vec3(0.0);
    vec3 r123s, r123p, Rs;

    // Evaluate the phase shift
    fresnelPhaseExact(vec3(cosTheta1), eta_1, eta_2, vec3(0.0), phi21p, phi21s);
    fresnelPhaseExact(cosTheta2, eta_2, eta_3, kappa_3, phi23p, phi23s);
    phi21p = vec3(PI) - phi21p;
    phi21s = vec3(PI) - phi21s;

    r123p = sqrt(R12p * R23p);
    r123s = sqrt(R12s * R23s);

    vec3 C0, Cm, Sm;
    vec3 S0 = vec3(1.0);

    // Iridescence term using spectral antialiasing for Parallel polarization
    // Reflectance term for m=0 (DC term amplitude)
    Rs = (sq(T121p) * R23p) / (vec3(1.0) - R12p * R23p);
    C0 = R12p + Rs;
    I += C0 * S0;

    // Reflectance term for m>0 (pairs of diracs)
    Cm = Rs - T121p;
    for (int m = 1; m <= 2; ++m){
        Cm *= r123p;
        Sm  = 2.0 * evalSensitivity(float(m) * OPD, float(m) * (phi23p + phi21p));
        I  += Cm * Sm;
    }

    // Iridescence term using spectral antialiasing for Perpendicular polarization
    // Reflectance term for m=0 (DC term amplitude)
    Rs = (sq(T121s) * R23s) / (vec3(1.0) - R12s * R23s);
    C0 = R12s + Rs;
    I += C0 * S0;

    // Reflectance term for m>0 (pairs of diracs)
    Cm = Rs - T121s ;
    for (int m = 1; m <= 2; ++m){
        Cm *= r123s;
        Sm  = 2.0 * evalSensitivity(float(m) * OPD, float(m) * (phi23s + phi21s));
        I  += Cm * Sm;
    }

    // Ensure that the BRDF is non negative and convert it to RGB
    I = max(I, vec3(0.0, 0.0, 0.0));

    return 0.5 * I;
}
