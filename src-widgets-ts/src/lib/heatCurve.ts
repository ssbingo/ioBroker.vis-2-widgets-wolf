/*
 * Heizkurve — NÄHERUNG, KEINE WOLF-SPEZIFIKATION.
 *
 * Wolf veröffentlicht keine Formel für die Heizkennlinie (Unterlage „Wolf Heizungsregelung —
 * Quellen und Vorgehen zur Heizkurve", 18.09.2026). Das Widget zeichnet deshalb den üblichen
 * Potenzansatz und kennzeichnet ihn als Näherung:
 *
 *     VL = TR + N + K + S · max(0, TR − TA)^n
 *
 * TR Raumsollwert, N Niveau, K Sollwertkorrektur (Parallelverschiebung), S Steilheit,
 * TA gemittelte Außentemperatur, n Krümmung (1 = linear). Begrenzt auf das Vorlauf-Maximum.
 * Der Betriebspunkt im Widget kommt dagegen aus der Regelung selbst (Vorlauf-Soll).
 * Plausibilität für Heizkörper nach Wolf-Ratgeber: −10 °C → etwa 70 °C, +8 °C → etwa 40 °C.
 */

/** Parameter des Kurvenmodells */
export interface CurveParams {
    /** Raumsollwert TR in °C */
    roomSetpoint: number;
    /** Steilheit S */
    slope: number;
    /** Niveau N in K */
    level: number;
    /** Sollwertkorrektur K in K */
    correction: number;
    /** Krümmung n, 1 = linear */
    exponent: number;
    /** Vorlauf-Maximum in °C (Wolf HG08) */
    maxFlow: number;
}

/**
 * Vorlauf-Soll nach dem Näherungsmodell.
 *
 * @param outside gemittelte Außentemperatur TA in °C
 * @param p Parameter
 * @returns Vorlauf in °C, höchstens maxFlow
 */
export function flowSetpoint(outside: number, p: CurveParams): number {
    const delta = Math.max(0, p.roomSetpoint - outside);
    const exponent = p.exponent > 0 ? p.exponent : 1;
    const flow = p.roomSetpoint + p.level + p.correction + p.slope * delta ** exponent;
    return Math.min(p.maxFlow, flow);
}

/**
 * Stützpunkte der Kurve von warm nach kalt.
 *
 * @param p Parameter
 * @param from wärmste Außentemperatur
 * @param to kälteste Außentemperatur
 * @param step Abstand in K
 * @returns Paare [Außentemperatur, Vorlauf]
 */
export function curvePoints(p: CurveParams, from: number, to: number, step = 1): Array<[number, number]> {
    const points: Array<[number, number]> = [];
    for (let ta = from; ta >= to - 1e-9; ta -= step) {
        points.push([ta, flowSetpoint(ta, p)]);
    }
    return points;
}

/**
 * Gitterlinien der Vorlaufachse: alle 20 K, beginnend 10 K über dem unteren Rand.
 *
 * @param min unterer Rand in °C
 * @param max oberer Rand in °C
 * @returns Werte der Gitterlinien
 */
export function flowTicks(min: number, max: number): number[] {
    const ticks: number[] = [];
    for (let v = min + 10; v <= max - 5; v += 20) {
        ticks.push(v);
    }
    return ticks;
}
