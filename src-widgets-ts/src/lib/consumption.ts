/*
 * Verbrauch aus einem fortlaufenden Zähler (z. B. HmIP-ESI GAS_VOLUME): Zählerstand jetzt minus
 * Zählerstand zu Tages- bzw. Monatsbeginn. Den Stand zum Stichtag liefert ein Verlaufsadapter
 * (sql, history, influxdb) — ohne React und ohne ioBroker, damit testbar.
 */

/** Eintrag aus getHistory */
export interface HistoryEntry {
    /** Wert */
    val: unknown;
    /** Zeitstempel in ms */
    ts: number;
}

/** Tage, die vor einem Stichtag nach dem letzten Wert gesucht wird (Logging nur bei Änderung) */
export const LOOKBACK_DAYS = 35;

/**
 * @param now Zeitpunkt
 * @returns Beginn des Tages in lokaler Zeit (ms)
 */
export function startOfDay(now: Date): number {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

/**
 * @param now Zeitpunkt
 * @returns Beginn des Monats in lokaler Zeit (ms)
 */
export function startOfMonth(now: Date): number {
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

/**
 * @param now Zeitpunkt
 * @returns Beginn des nächsten Tages in lokaler Zeit (ms) — auch über die Zeitumstellung korrekt
 */
export function nextDayStart(now: Date): number {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
}

/**
 * Zählerstand zum Stichtag: der letzte Wert bis zum Stichtag; fehlt der (Sensor erst danach
 * eingebaut oder Aufzeichnung jünger), der erste Wert danach.
 *
 * @param before Einträge bis zum Stichtag
 * @param after Einträge ab dem Stichtag
 * @returns Zählerstand oder null
 */
export function baseValue(before: HistoryEntry[] | undefined, after: HistoryEntry[] | undefined): number | null {
    const numeric = (entries: HistoryEntry[] | undefined): HistoryEntry[] =>
        (entries ?? []).filter(e => typeof e.val === 'number' && Number.isFinite(e.val));
    const b = numeric(before);
    if (b.length) {
        return b.reduce((last, e) => (e.ts > last.ts ? e : last)).val as number;
    }
    const a = numeric(after);
    if (a.length) {
        return a.reduce((first, e) => (e.ts < first.ts ? e : first)).val as number;
    }
    return null;
}

/**
 * Verbrauch seit dem Stichtag.
 *
 * @param current aktueller Zählerstand
 * @param base Zählerstand zum Stichtag
 * @returns Verbrauch; null ohne Werte. Ist der Zähler seitdem zurückgesetzt worden
 *   (aktuell kleiner als Stichtag), gilt der aktuelle Stand als Verbrauch seit dem Neustart.
 */
export function consumptionSince(current: number | null, base: number | null): number | null {
    if (current === null || base === null) {
        return null;
    }
    return current >= base ? current - base : current;
}
