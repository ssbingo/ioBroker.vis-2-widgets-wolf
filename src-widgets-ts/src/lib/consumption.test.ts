import { describe, expect, it } from 'vitest';

import { baseValue, consumptionSince, nextDayStart, startOfDay, startOfMonth } from './consumption';

describe('Stichtage', () => {
    const now = new Date(2026, 8, 18, 15, 42, 7);

    it('liefert Tages- und Monatsbeginn in lokaler Zeit', () => {
        expect(startOfDay(now)).toBe(new Date(2026, 8, 18).getTime());
        expect(startOfMonth(now)).toBe(new Date(2026, 8, 1).getTime());
    });

    it('liefert den nächsten Tagesbeginn, auch am Monatsende', () => {
        expect(nextDayStart(now)).toBe(new Date(2026, 8, 19).getTime());
        expect(nextDayStart(new Date(2026, 8, 30, 23, 59))).toBe(new Date(2026, 9, 1).getTime());
    });

    it('rechnet über die Zeitumstellung mit Kalendertagen, nicht mit 24 h', () => {
        // 25.10.2026: Umstellung auf Winterzeit, der Tag hat 25 Stunden
        const day = new Date(2026, 9, 25, 12);
        expect(new Date(nextDayStart(day)).getDate()).toBe(26);
        expect(new Date(nextDayStart(day)).getHours()).toBe(0);
    });
});

describe('baseValue', () => {
    it('nimmt den letzten Wert bis zum Stichtag', () => {
        expect(
            baseValue(
                [
                    { val: 18420.1, ts: 1000 },
                    { val: 18421.3, ts: 3000 },
                    { val: 18420.9, ts: 2000 },
                ],
                [{ val: 18422, ts: 5000 }],
            ),
        ).toBe(18421.3);
    });

    it('nimmt ohne Wert vor dem Stichtag den ersten danach', () => {
        expect(
            baseValue(
                [],
                [
                    { val: 1.04, ts: 9000 },
                    { val: 0.5, ts: 7000 },
                ],
            ),
        ).toBe(0.5);
    });

    it('überspringt ungültige Einträge und liefert ohne Werte null', () => {
        expect(baseValue([{ val: null, ts: 1000 }], [{ val: 'x', ts: 2000 }])).toBeNull();
        expect(baseValue(undefined, undefined)).toBeNull();
    });
});

describe('consumptionSince', () => {
    it('rechnet die Differenz zum Stichtag', () => {
        expect(consumptionSince(18427.482, 18422.662)).toBeCloseTo(4.82, 6);
    });

    it('nimmt nach einem Zähler-Neustart den aktuellen Stand', () => {
        expect(consumptionSince(0.8, 1.04)).toBe(0.8);
    });

    it('liefert ohne Werte null', () => {
        expect(consumptionSince(null, 1)).toBeNull();
        expect(consumptionSince(1, null)).toBeNull();
    });
});
