/**
 * Pure derivations that keep the config slices internally consistent.
 *
 * Some renderer settings only make sense while another is enabled: image based
 * lighting controls the visibility of the environment background, and volume is
 * meaningless without transmission. These helpers resolve a partial update into
 * the full "next" value and, where a choice must be remembered so it can be
 * restored later, return the updated preference to remember.
 */

/**
 * Derives a lighting update so `renderEnv` follows `ibl`.
 *
 * Turning image based lighting off hides the background and remembers the
 * previous choice; turning it back on restores it rather than forcing it
 * visible.
 *
 * @param {Object} lighting The current `config.lighting` value.
 * @param {Object} partial The user's partial update.
 * @param {boolean} renderEnvPreference The remembered background visibility.
 * @returns {{ next: Object, preference: boolean }} The resolved partial and the
 *   (possibly updated) preference to remember.
 */
export function deriveLighting(lighting, partial, renderEnvPreference) {
    if (partial.ibl === false) {
        return { next: { ...partial, renderEnv: false }, preference: lighting.renderEnv };
    }
    if (partial.ibl === true) {
        return { next: { ...partial, renderEnv: renderEnvPreference }, preference: renderEnvPreference };
    }
    return { next: partial, preference: renderEnvPreference };
}

/**
 * Derives an extensions update so `volume` follows the transmission toggles.
 *
 * Volume is meaningless without either transmission, so turning the last one
 * off also turns volume off (remembering the choice) and turning one back on
 * restores it. This only moves the switch; the renderer is not notified until
 * volume is toggled directly.
 *
 * @param {Object} extensions The current `config.extensions` value.
 * @param {Object} partial The user's partial update.
 * @param {boolean} volumePreference The remembered volume toggle.
 * @returns {{ next: Object, preference: boolean }} The resolved partial and the
 *   (possibly updated) preference to remember.
 */
export function deriveExtensions(extensions, partial, volumePreference) {
    let next = partial;
    const otherTransmission = (key) =>
        key === "transmission" ? extensions.diffuseTransmission : extensions.transmission;

    for (const key of ["transmission", "diffuseTransmission"]) {
        if (partial[key] === undefined || otherTransmission(key)) {
            continue;
        }
        if (partial[key] === false) {
            next = { ...next, volume: false };
            volumePreference = extensions.volume;
        } else {
            next = { ...next, volume: volumePreference };
        }
    }
    return { next, preference: volumePreference };
}
