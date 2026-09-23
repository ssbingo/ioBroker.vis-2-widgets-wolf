import { describe, expect, it } from 'vitest';

import { fmtDateTime, isOk, parseMessages, sortRows, toSeverity, type MessageRow } from './messages';

describe('isOk', () => {
    it('wertet ohne Vorgabe wahr bzw. ungleich 0 als in Ordnung — passend zu TW-Vorlauf (1 = i. O.)', () => {
        expect(isOk(1)).toBe(true);
        expect(isOk(0)).toBe(false);
        expect(isOk(true)).toBe(true);
        expect(isOk(false)).toBe(false);
    });

    it('vergleicht mit einem vorgegebenen Wert tolerant', () => {
        expect(isOk(0, '0')).toBe(true);
        expect(isOk('0', '0')).toBe(true);
        expect(isOk(2, '0')).toBe(false);
        expect(isOk(false, 'false')).toBe(true);
    });

    it('liefert ohne Wert null', () => {
        expect(isOk(null)).toBeNull();
        expect(isOk(undefined, '1')).toBeNull();
    });
});

describe('toSeverity', () => {
    it('erkennt gängige Schreibweisen', () => {
        expect(toSeverity('Error')).toBe('err');
        expect(toSeverity('warning')).toBe('warn');
        expect(toSeverity('Hinweis')).toBe('info');
        expect(toSeverity('unbekannt', 'err')).toBe('err');
    });
});

describe('parseMessages', () => {
    it('liest JSON mit verschiedenen Feldnamen, Sekunden und Datumstext', () => {
        const rows = parseMessages(
            JSON.stringify([
                { text: 'Wasserdruck unter 1,2 bar', ts: 1789625640000, severity: 'warning' },
                { message: 'Störabschaltung 41', time: 1788025620, level: 'error' },
                { msg: 'Wartung fällig', date: '2026-09-12T00:00:00Z' },
                'Sommerbetrieb beendet',
                { nothing: true },
                42,
            ]),
        );
        expect(rows.map(r => [r.severity, r.text])).toEqual([
            ['warn', 'Wasserdruck unter 1,2 bar'],
            ['err', 'Störabschaltung 41'],
            ['info', 'Wartung fällig'],
            ['info', 'Sommerbetrieb beendet'],
        ]);
        expect(rows[1].ts).toBe(1788025620000);
        expect(rows[2].ts).toBe(Date.parse('2026-09-12T00:00:00Z'));
        expect(rows[3].ts).toBeNull();
    });

    it('liefert bei ungültigem Inhalt eine leere Liste', () => {
        expect(parseMessages('kein json')).toEqual([]);
        expect(parseMessages({ a: 1 })).toEqual([]);
        expect(parseMessages(null)).toEqual([]);
    });
});

describe('sortRows', () => {
    it('ordnet nach Schweregrad, dann die neuesten zuerst', () => {
        const rows: MessageRow[] = [
            { key: 'a', severity: 'ok', text: 'A', ts: 500 },
            { key: 'b', severity: 'info', text: 'B', ts: 100 },
            { key: 'c', severity: 'err', text: 'C', ts: 10 },
            { key: 'd', severity: 'info', text: 'D', ts: 300 },
            { key: 'e', severity: 'warn', text: 'E', ts: null },
            { key: 'f', severity: 'info', text: 'F', ts: null },
        ];
        expect(sortRows(rows).map(r => r.key)).toEqual(['c', 'e', 'd', 'b', 'f', 'a']);
    });
});

describe('fmtDateTime', () => {
    it('formatiert wie im Entwurf', () => {
        expect(fmtDateTime(new Date(2026, 8, 17, 6, 14).getTime(), 'de-DE')).toBe('17.09.2026 · 06:14');
    });
});
