/*
 * Welcher Zweig des Anlagenschemas führt Wasser?
 *
 * Ein Umschaltventil (3WUV) trennt Heizkreis und Speicher: Steht es auf Warmwasser, fließt das
 * Kesselwasser in den Speicher und die Heizkreise stehen still — auch wenn die Kesselpumpe läuft
 * und der Brenner brennt. Ohne verknüpftes Ventil bleibt es beim bisherigen Verhalten.
 */

/**
 * Führt der Speicherzweig Wasser?
 *
 * @param charging Speicherladung aus einem eigenen Objekt; null, wenn keines verknüpft ist
 * @param primary Primärkreis aktiv (Kesselpumpe, ohne Objekt: Brenner)
 * @param valveToDhw Umschaltventil steht auf Warmwasser; null, wenn keines verknüpft ist
 * @returns true, wenn der Speicher geladen wird
 */
export function tankActive(charging: boolean | null, primary: boolean, valveToDhw: boolean | null): boolean {
    if (charging !== null) {
        return charging;
    }
    if (valveToDhw === null) {
        return primary;
    }
    return primary && valveToDhw;
}

/**
 * Führt ein Heizkreis Wasser?
 *
 * @param pumpOn Pumpe des Kreises; null, wenn kein Pumpenobjekt verknüpft ist
 * @param primary Primärkreis aktiv (Kesselpumpe, ohne Objekt: Brenner)
 * @param valveToDhw Umschaltventil steht auf Warmwasser; null, wenn keines verknüpft ist
 * @returns true, wenn der Kreis durchströmt wird
 */
export function circuitActive(pumpOn: boolean | null, primary: boolean, valveToDhw: boolean | null): boolean {
    // Das Ventil sticht die Pumpe: auf Warmwasser umgeschaltet erreicht kein Wasser den Kreis
    if (valveToDhw === true) {
        return false;
    }
    return pumpOn ?? primary;
}
