/*
 * Geometrie der Bogenanzeige: Halbkreis mit Mittelpunkt (60, 68) und Radius 46, von links
 * (14, 68) über oben nach rechts (106, 68) — wie im freigegebenen Entwurf (viewBox 0 0 120 78).
 * Gerechnet wird ohne getTotalLength(), das in noch unsichtbaren Elementen 0 liefert.
 */

export const ARC_CX = 60;
export const ARC_CY = 68;
export const ARC_R = 46;

/**
 * Anteil eines Werts an der Skala, auf 0…1 begrenzt.
 *
 * @param value Messwert
 * @param min Skalenanfang
 * @param max Skalenende
 * @returns Anteil; 0 bei fehlendem Wert oder leerer Skala
 */
export function arcFraction(value: number | null, min: number, max: number): number {
    if (value === null || !Number.isFinite(value) || !(max > min)) {
        return 0;
    }
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Punkt auf dem Bogen zu einem Anteil.
 *
 * @param fraction 0 = links, 1 = rechts
 * @returns Koordinaten im viewBox-System
 */
export function arcPoint(fraction: number): [number, number] {
    const angle = Math.PI * (1 - fraction);
    return [ARC_CX + ARC_R * Math.cos(angle), ARC_CY - ARC_R * Math.sin(angle)];
}

/**
 * SVG-Pfad für einen Bogenabschnitt, z. B. eine Warnzone.
 *
 * @param from Anteil am Anfang
 * @param to Anteil am Ende
 * @returns Pfadangabe für das d-Attribut
 */
export function arcSegment(from: number, to: number): string {
    const [x0, y0] = arcPoint(Math.max(0, Math.min(1, from)));
    const [x1, y1] = arcPoint(Math.max(0, Math.min(1, to)));
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${ARC_R} ${ARC_R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/** Der vollständige Bogen */
export const ARC_FULL = arcSegment(0, 1);
