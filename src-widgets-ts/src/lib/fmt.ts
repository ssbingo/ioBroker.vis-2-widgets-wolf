/** Geschütztes schmales Leerzeichen zwischen Zahl und Einheit */
const NARROW_NBSP = ' ';

/**
 * Wert als Zahl lesen; liefert null für leere oder nicht numerische Werte.
 *
 * @param value Wert aus einem Objekt oder Widget-Attribut
 * @returns die Zahl oder null
 */
export function toNumber(value: unknown): number | null {
    let n: number;
    if (typeof value === 'number') {
        n = value;
    } else if (typeof value === 'string' && value.trim() !== '') {
        n = parseFloat(value);
    } else {
        return null;
    }
    return Number.isFinite(n) ? n : null;
}

/**
 * Wert als Ein/Aus lesen: true, Zahlen ungleich 0 sowie "true", "1", "on", "ein".
 * Liefert null für fehlende Werte, damit "unbekannt" von "aus" unterscheidbar bleibt.
 *
 * @param value Wert aus einem Objekt
 * @returns true, false oder null
 */
export function toBoolean(value: unknown): boolean | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return value !== 0;
    }
    if (typeof value === 'string') {
        return ['true', '1', 'on', 'ein'].includes(value.trim().toLowerCase());
    }
    return null;
}

/**
 * Dezimaltrennzeichen einer Sprachregion, z. B. "," für de-DE und "." für en.
 *
 * @param locale Sprachregion
 * @returns das Trennzeichen
 */
export function decimalSeparator(locale = 'de-DE'): string {
    const part = new Intl.NumberFormat(locale).formatToParts(1.5).find(p => p.type === 'decimal');
    return part?.value ?? ',';
}

/**
 * Zahl formatieren. Nicht numerische Werte werden als "--" dargestellt.
 *
 * @param value Wert aus dem Objekt
 * @param decimals Nachkommastellen
 * @param unit optionale Einheit, durch ein schmales geschütztes Leerzeichen abgesetzt
 * @param locale Sprachregion für Dezimal- und Tausendertrenner, Vorgabe deutsch
 * @returns der formatierte Text
 */
export function fmt(value: unknown, decimals = 1, unit?: string, locale = 'de-DE'): string {
    const n = toNumber(value);
    if (n === null) {
        return '--';
    }
    const text = n.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    return unit ? `${text}${NARROW_NBSP}${unit}` : text;
}
