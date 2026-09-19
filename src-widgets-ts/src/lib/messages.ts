/*
 * Meldungen: Zustandsprüfungen (z. B. TW-Vorlauf, TW-Abgas, Verbindung), Sammelstörung,
 * Störcode und eine optionale Meldungsliste aus einem JSON-Objekt — zu Zeilen mit Schweregrad
 * zusammengeführt. Ohne React und ohne ioBroker, damit testbar.
 */
import { toBoolean } from './fmt';
import { sameValue } from './writeTracker';

/** Schweregrad einer Zeile; "ok" für erfüllte Prüfungen */
export type Severity = 'err' | 'warn' | 'info' | 'ok';

/** wählbare Schweregrade einer Prüfung */
export const SEVERITIES = ['err', 'warn', 'info'] as const;

/** Eine Zeile der Meldungsliste */
export interface MessageRow {
    /** eindeutiger Schlüssel */
    key: string;
    /** Schweregrad */
    severity: Severity;
    /** Text */
    text: string;
    /** Zeitpunkt in ms, null wenn unbekannt */
    ts: number | null;
    /** Zeitpunkt ist der Beginn des Zustands („seit …"), nicht der einer Meldung */
    since?: boolean;
}

const RANK: Record<Severity, number> = { err: 0, warn: 1, info: 2, ok: 3 };

/**
 * Ist eine Prüfung erfüllt?
 *
 * @param value Wert des Objekts
 * @param okValue Wert, der „in Ordnung" bedeutet; leer: wahr bzw. ungleich 0 ist in Ordnung
 * @returns true/false, null ohne Wert
 */
export function isOk(value: unknown, okValue?: string): boolean | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const expected = okValue?.trim();
    if (expected) {
        return sameValue(value, expected);
    }
    return toBoolean(value) === true;
}

/**
 * @param value Schweregrad aus Attribut oder Meldung, auch in gängigen Schreibweisen
 * @param fallback Vorgabe
 * @returns Schweregrad
 */
export function toSeverity(value: unknown, fallback: Severity = 'info'): Severity {
    const s = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (['err', 'error', 'alarm', 'fault', 'critical', 'fehler', 'störung'].includes(s)) {
        return 'err';
    }
    if (['warn', 'warning', 'warnung'].includes(s)) {
        return 'warn';
    }
    if (['info', 'information', 'notice', 'hinweis'].includes(s)) {
        return 'info';
    }
    return fallback;
}

/**
 * Zeitpunkt aus einer Meldung: Millisekunden, Sekunden (Unix) oder Datumstext.
 *
 * @param value Rohwert
 * @returns ms oder null
 */
function toTimestamp(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        // Sekunden seit 1970 sind kleiner als 1e11 (bis ins Jahr 5138)
        return value < 1e11 ? value * 1000 : value;
    }
    if (typeof value === 'string' && value.trim()) {
        const t = Date.parse(value);
        return Number.isNaN(t) ? null : t;
    }
    return null;
}

/**
 * Meldungsliste aus einem Objekt (JSON-Text oder Array): Einträge als Text oder als Objekt mit
 * text/message/msg, ts/time/date und severity/level/type.
 *
 * @param raw Wert des Objekts
 * @returns Zeilen, ungültige Einträge übersprungen
 */
export function parseMessages(raw: unknown): MessageRow[] {
    let list: unknown = raw;
    if (typeof raw === 'string') {
        try {
            list = JSON.parse(raw);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(list)) {
        return [];
    }
    const rows: MessageRow[] = [];
    list.forEach((item: unknown, i) => {
        if (typeof item === 'string' && item.trim()) {
            rows.push({ key: `msg${i}`, severity: 'info', text: item.trim(), ts: null });
            return;
        }
        if (!item || typeof item !== 'object') {
            return;
        }
        const o = item as Record<string, unknown>;
        const text = [o.text, o.message, o.msg, o.title].find(t => typeof t === 'string' && t.trim());
        if (typeof text !== 'string') {
            return;
        }
        rows.push({
            key: `msg${i}`,
            severity: toSeverity(o.severity ?? o.level ?? o.type),
            text: text.trim(),
            ts: toTimestamp(o.ts ?? o.time ?? o.date ?? o.timestamp),
        });
    });
    return rows;
}

/**
 * Sortiert: Störungen vor Warnungen vor Hinweisen vor erfüllten Prüfungen, innerhalb davon die
 * neuesten zuerst; Zeilen ohne Zeitpunkt behalten ihre Reihenfolge am Ende ihrer Gruppe.
 *
 * @param rows Zeilen
 * @returns neue, sortierte Liste
 */
export function sortRows(rows: MessageRow[]): MessageRow[] {
    return rows
        .map((row, index) => ({ row, index }))
        .sort((a, b) => {
            const bySeverity = RANK[a.row.severity] - RANK[b.row.severity];
            if (bySeverity) {
                return bySeverity;
            }
            const ta = a.row.ts ?? -Infinity;
            const tb = b.row.ts ?? -Infinity;
            return tb !== ta ? tb - ta : a.index - b.index;
        })
        .map(e => e.row);
}

/**
 * Datum und Uhrzeit wie im Entwurf: „17.09.2026 · 06:14".
 *
 * @param ts Zeitpunkt in ms
 * @param locale Sprachregion
 * @returns Text
 */
export function fmtDateTime(ts: number, locale = 'de-DE'): string {
    const d = new Date(ts);
    const date = d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return `${date} · ${time}`;
}
