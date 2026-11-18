// Canonical display names for material properties and extensions, shared between
// the Advanced controls toggles and the scene-tree material inspector.

// Fixed display names for a few abbreviations the generic pretty-printer would
// mangle (e.g. camera projections).
const FIXED_NAMES = {
    yfov: "Vertical FOV",
    znear: "Near Plane",
    zfar: "Far Plane",
    xmag: "X Magnification",
    ymag: "Y Magnification"
};

// Canonical display name for each material extension. Mirrors the labels used by
// the Advanced controls toggles.
const MATERIAL_EXTENSION_NAMES = {
    KHR_materials_anisotropy: "Anisotropy",
    KHR_materials_clearcoat: "Clearcoat",
    KHR_materials_diffuse_transmission: "Diffuse Transmission",
    KHR_materials_dispersion: "Dispersion",
    KHR_materials_emissive_strength: "Emissive Strength",
    KHR_materials_ior: "Index of Refraction",
    KHR_materials_iridescence: "Iridescence",
    KHR_materials_pbrSpecularGlossiness: "Specular Glossiness",
    KHR_materials_retroreflection: "Retroreflection",
    KHR_materials_scatter: "Scattering",
    KHR_materials_sheen: "Sheen",
    KHR_materials_specular: "Specular",
    KHR_materials_transmission: "Transmission",
    KHR_materials_unlit: "Unlit",
    KHR_materials_volume: "Volume"
};

// "alphaMode" / "alpha_mode" -> "Alpha Mode".
export function canonicalPropName(name) {
    if (FIXED_NAMES[name] !== undefined) {
        return FIXED_NAMES[name];
    }
    return name
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

// The canonical name of a material extension, or undefined for an unknown one.
export function canonicalExtensionName(extension) {
    return MATERIAL_EXTENSION_NAMES[extension];
}

export { MATERIAL_EXTENSION_NAMES };
