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
    /** Mehrwertsteuer in Prozent; 0 heißt, die Preise sind schon brutto */
    mwst: number;
}

/** Vorgaben für Brennwert und Zustandszahl, wenn nichts eingetragen ist. */
export const DEFAULT_BRENNWERT = 11.482;
export const DEFAULT_ZUSTANDSZAHL = 0.9612;

/** Einheit, in der der Arbeitspreis eingetragen ist */
export const PRICE_UNITS = ['eur', 'ct'] as const;

/** Euro oder Cent je Kilowattstunde */
export type PriceUnit = (typeof PRICE_UNITS)[number];

/**
 * Arbeitspreis in €/kWh. Auf der Gasrechnung steht er meist in Cent (z. B. 8,14 ct/kWh) — dann
 * ist „ct" die Einheit und der Wert wird hier umgerechnet.
 *
 * @param value eingetragener Arbeitspreis
 * @param unit Einheit des Eintrags, „eur" oder „ct"
 * @returns Arbeitspreis in €/kWh oder null
 */
export function pricePerKwh(value: number | null | undefined, unit: string | undefined): number | null {
    if (value === null || value === undefined || !isFinite(value)) {
        return null;
    }
    return unit === 'ct' ? value / 100 : value;
}

/** Bereich, in dem ein Arbeitspreis für Gas plausibel ist, in €/kWh */
export const PRICE_RANGE = { min: 0.01, max: 1 };

/**
 * Liegt der Arbeitspreis außerhalb des plausiblen Bereichs? Typisch sind 5 bis 20 ct/kWh; wer
 * Cent in ein Euro-Feld einträgt, landet um den Faktor 100 daneben.
 *
 * @param eurPerKwh Arbeitspreis in €/kWh
 * @returns true, wenn der Wert geprüft werden sollte
 */
export function priceSuspicious(eurPerKwh: number | null): boolean {
    return eurPerKwh !== null && eurPerKwh > 0 && (eurPerKwh < PRICE_RANGE.min || eurPerKwh > PRICE_RANGE.max);
}

/**
 * Kosten für einen Monatsverbrauch: m³ × Brennwert × Zustandszahl = kWh, dann × Arbeitspreis +
 * Grundpreis und zuletzt die Mehrwertsteuer. Wer Bruttopreise einträgt, lässt die Steuer auf 0 —
 * dann bleibt die Rechnung wie bisher.
 * Liefert null, wenn Verbrauch oder Arbeitspreis fehlen.
 *
 * @param monthM3 Monatsverbrauch in m³
 * @param tariff Brennwert, Zustandszahl, Arbeits- und Grundpreis, Mehrwertsteuer
 * @returns Kosten in € oder null
 */
export function monthlyCost(monthM3: number | null, tariff: Partial<GasTariff>): number | null {
    if (monthM3 === null || !tariff.arbeitspreis) {
        return null;
    }
    const kwh = monthM3 * (tariff.brennwert || DEFAULT_BRENNWERT) * (tariff.zustandszahl || DEFAULT_ZUSTANDSZAHL);
    const netto = kwh * tariff.arbeitspreis + (tariff.grundpreis || 0);
    return netto * (1 + (tariff.mwst || 0) / 100);
}
