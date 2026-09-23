/** Temperaturskala der Speichergrafik in °C */
export interface TankScale {
    /** Temperatur am Boden (leere Grafik) */
    min: number;
    /** Temperatur am Deckel (volle Grafik) */
    max: number;
}

/** Boden der Skala: kaltes Leitungswasser */
export const TANK_BOTTOM = 10;

/**
 * Skala der Speichergrafik: vom kalten Leitungswasser bis zum höchsten einstellbaren Sollwert,
 * damit Füllstand und Sollmarke im selben Maßstab stehen und die Marke nie herausfällt.
 *
 * @param setpointMax höchster Sollwert (Objekt oder Attribut), z. B. 80
 * @returns die Skala, mindestens 20 K hoch
 */
export function tankScale(setpointMax: number): TankScale {
    return { min: TANK_BOTTOM, max: Math.max(setpointMax, TANK_BOTTOM + 20) };
}

/**
 * Füllstand der Grafik für eine Temperatur.
 *
 * @param temp Temperatur in °C
 * @param scale Skala
 * @returns Anteil 0…1, null ohne gültigen Wert
 */
export function tankFraction(temp: number | null, scale: TankScale): number | null {
    const span = scale.max - scale.min;
    if (temp === null || !Number.isFinite(temp) || !(span > 0)) {
        return null;
    }
    return Math.min(1, Math.max(0, (temp - scale.min) / span));
}
