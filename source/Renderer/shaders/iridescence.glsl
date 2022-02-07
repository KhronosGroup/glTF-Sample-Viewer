// XYZ to sRGB color space
const mat3 XYZ_TO_REC709 = mat3(
     3.2404542, -0.9692660,  0.0556434,
    -1.5371385,  1.8760108, -0.2040259,
    -0.4985314,  0.0415560,  1.0572252
);

// Assume air interface for top
// Note: We don't handle the case fresnel0 == 1
vec3 Fresnel0ToIor(vec3 fresnel0) {
    vec3 sqrtF0 = sqrt(fresnel0);
    return (vec3(1.0) + sqrtF0) / (vec3(1.0) - sqrtF0);
}

// Conversion FO/IOR
vec3 IorToFresnel0(vec3 transmittedIor, float incidentIor) {
    return sq((transmittedIor - vec3(incidentIor)) / (transmittedIor + vec3(incidentIor)));
}

// ior is a value between 1.0 and 3.0. 1.0 is air interface
float IorToFresnel0(float transmittedIor, float incidentIor) {
    return sq((transmittedIor - incidentIor) / (transmittedIor + incidentIor));
}

// Fresnel equations for dielectric/dielectric interfaces.
// Ref: https://belcour.github.io/blog/research/2017/05/01/brdf-thin-film.html
// Evaluation XYZ sensitivity curves in Fourier space
vec3 evalSensitivity(vec3 opd, vec3 shift) {
    vec3 phase = 2.0 * M_PI * opd * 1.0e-9;
    vec3 val = vec3(5.4856e-13, 4.4201e-13, 5.2481e-13);
    vec3 pos = vec3(1.6810e+06, 1.7953e+06, 2.2084e+06);
    vec3 var = vec3(4.3278e+09, 9.3046e+09, 6.6121e+09);

    vec3 xyz = val * sqrt(2.0 * M_PI * var) * cos(pos * phase + shift) * exp(-sq(phase) * var);
    xyz.x += 9.7470e-14 * sqrt(2.0 * M_PI * 4.5282e+09) * cos(2.2399e+06 * phase[0] + shift[0]) * exp(-4.5282e+09 * sq(phase[0]));
    xyz /= 1.0685e-7;

    vec3 srgb = XYZ_TO_REC709 * xyz;
    return srgb;
}

// Main function expected by BRDF Explorer
vec3 evalIridescence(float eta_1, float eta2, float cosTheta1, float Dinc, vec3 baseF0) {
    vec3 I;

    // Force eta_2 -> eta_1 when Dinc -> 0.0
    float eta_2 = mix(eta_1, eta2, smoothstep(0.0, 0.03, Dinc));
    // Evaluate the cosTheta on the base layer (Snell law)
    float sinTheta2Sq = sq(eta_1 / eta_2) * (1.0 - sq(cosTheta1));

    // Handle TIR:
    float cosTheta2Sq = 1.0 - sinTheta2Sq;
    if (cosTheta2Sq < 0.0) {
        I = vec3(1.0, 1.0, 1.0);
    } else {
        float cosTheta2 = sqrt(cosTheta2Sq);

        // First interface
        float R0 = IorToFresnel0(eta_2, eta_1);
        float R12 = F_Schlick(R0, cosTheta1);
        float R21 = R12;
        float T121 = 1.0 - R12;
        float phi12 = 0.0;
        if (eta_2 < eta_1) {
            phi12 = M_PI;
        }
        float phi21 = M_PI - phi12;

        // Second interface
        vec3 eta_3 = Fresnel0ToIor(baseF0 + 0.0001); // guard against 1.0
        vec3 R1 = IorToFresnel0(eta_3, eta_2);

        vec3 sinTheta3Sq = sq(vec3(eta_2) / eta_3) * sinTheta2Sq;
        vec3 cosTheta3Sq = vec3(1.0) - sinTheta3Sq;
        vec3 cosTheta3 = sqrt(cosTheta3Sq);

        vec3 R23 = F_Schlick(R1, cosTheta2);
        vec3 phi23 = vec3(0.0);
        if (eta_3[0] < eta_2) {
            phi23[0] = M_PI;
        }
        if (eta_3[1] < eta_2) {
            phi23[1] = M_PI;
        }
        if (eta_3[2] < eta_2) {
            phi23[2] = M_PI;
        }

        // Phase shift
        float OPD = 2.0 * eta_2 * Dinc * cosTheta2;
        vec3 phi = vec3(phi21) + phi23;

        // Compound terms
        vec3 R123 = clamp(R12 * R23, 1e-5, 0.9999);
        vec3 r123 = sqrt(R123);
        vec3 Rs = sq(T121) * R23 / (vec3(1.0, 1.0, 1.0) - R123);

        // Reflectance term for m = 0 (DC term amplitude)
        vec3 C0 = R12 + Rs;
        I = C0;

        // Reflectance term for m > 0 (pairs of diracs)
        vec3 Cm = Rs - T121;
        for (int m = 1; m <= 2; ++m)
        {
            Cm *= r123;
            vec3 Sm = 2.0 * evalSensitivity(vec3(float(m) * OPD), float(m) * phi);
            I += Cm * Sm;
        }

        // Since out of gamut colors might be produced, negative color values are clamped to 0.
        I = max(I, vec3(0.0, 0.0, 0.0));
    }

    return I;
}
