/** Tarifangaben für die Kostenrechnung */
export interface GasTariff {
    /** Brennwert in kWh/m³ */
    brennwert: number;
    /** Zustandszahl (Umrechnung Betriebs- auf Normzustand) */
    zustandszahl: number;
    /** Arbeitspreis in €/kWh */
    arbeitspreis: number;
    /** Grundpreis in €/Monat */
    grundpreis: number;
}

/** Vorgaben für Brennwert und Zustandszahl, wenn nichts eingetragen ist. */
export const DEFAULT_BRENNWERT = 11.482;
export const DEFAULT_ZUSTANDSZAHL = 0.9612;

/**
 * Kosten für einen Monatsverbrauch: m³ × Brennwert × Zustandszahl = kWh, dann × Arbeitspreis + Grundpreis.
 * Liefert null, wenn Verbrauch oder Arbeitspreis fehlen.
 *
 * @param monthM3 Monatsverbrauch in m³
 * @param tariff Brennwert, Zustandszahl, Arbeits- und Grundpreis
 * @returns Kosten in € oder null
 */
export function monthlyCost(monthM3: number | null, tariff: Partial<GasTariff>): number | null {
    if (monthM3 === null || !tariff.arbeitspreis) {
        return null;
    }
    const kwh = monthM3 * (tariff.brennwert || DEFAULT_BRENNWERT) * (tariff.zustandszahl || DEFAULT_ZUSTANDSZAHL);
    return kwh * tariff.arbeitspreis + (tariff.grundpreis || 0);
}
