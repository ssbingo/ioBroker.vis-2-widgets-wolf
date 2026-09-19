import { describe, expect, it } from 'vitest';

import { linePath, nearest, niceScale, rangeMs, timeLabel, timeTicks, toPoints } from './chart';

const HOUR = 3_600_000;

describe('rangeMs', () => {
    it('kennt die Zeiträume und fällt auf 24 h zurück', () => {
        expect(rangeMs('6h')).toBe(6 * HOUR);
        expect(rangeMs('7d')).toBe(168 * HOUR);
        expect(rangeMs('quatsch')).toBe(24 * HOUR);
    });
});

describe('toPoints', () => {
    it('nimmt nur Zahlen, macht Schalter zu 1/0 und sortiert', () => {
        expect(
            toPoints([
                { val: 3, ts: 300 },
                { val: 'x', ts: 200 },
                { val: true, ts: 100 },
                { val: null, ts: 150 },
                { val: 5 },
            ]),
        ).toEqual([
            { ts: 100, val: 1 },
            { ts: 300, val: 3 },
        ]);
        expect(toPoints(null)).toEqual([]);
    });
});

describe('niceScale', () => {
    it('teilt Temperaturen in runde Schritte', () => {
        expect(niceScale(-3.2, 61.4)).toEqual({ min: -20, max: 80, ticks: [-20, 0, 20, 40, 60, 80] });
        expect(niceScale(20.4, 23.9).ticks).toEqual([20, 21, 22, 23, 24]);
    });

    it('gibt einer flachen Kurve Luft', () => {
        const s = niceScale(21, 21);
        expect(s.min).toBeLessThan(21);
        expect(s.max).toBeGreaterThan(21);
    });
});

describe('timeTicks', () => {
    it('setzt bei 24 h alle vier Stunden eine Marke auf volle Stunden', () => {
        const end = new Date(2026, 8, 19, 10, 37).getTime();
        const ticks = timeTicks(end - 24 * HOUR, end);
        expect(ticks.map(t => new Date(t).getHours())).toEqual([12, 16, 20, 0, 4, 8]);
        expect(ticks.every(t => new Date(t).getMinutes() === 0)).toBe(true);
    });

    it('setzt bei 7 Tagen die Marken auf Mitternacht', () => {
        const end = new Date(2026, 8, 19, 10, 37).getTime();
        const ticks = timeTicks(end - 168 * HOUR, end);
        expect(ticks).toHaveLength(7);
        expect(ticks.every(t => new Date(t).getHours() === 0)).toBe(true);
    });
});

describe('timeLabel', () => {
    it('zeigt bis 24 h die Uhrzeit, darüber Wochentag und Datum', () => {
        const ts = new Date(2026, 8, 19, 8, 0).getTime();
        expect(timeLabel(ts, 24 * HOUR, 'de-DE')).toBe('08:00');
        expect(timeLabel(ts, 168 * HOUR, 'de-DE')).toBe('Sa., 19.09.');
    });
});

describe('linePath', () => {
    it('verbindet Punkte und unterbricht bei Lücken', () => {
        const pts = [
            { ts: 0, val: 1 },
            { ts: 10, val: 2 },
            { ts: 100, val: 3 },
        ];
        expect(
            linePath(
                pts,
                t => t,
                v => v * 10,
            ),
        ).toBe('M0.0 10.0 L10.0 20.0 L100.0 30.0');
        expect(
            linePath(
                pts,
                t => t,
                v => v * 10,
                50,
            ),
        ).toBe('M0.0 10.0 L10.0 20.0 M100.0 30.0');
        expect(
            linePath(
                [],
                t => t,
                v => v,
            ),
        ).toBe('');
    });
});

describe('nearest', () => {
    it('findet den nächstgelegenen Punkt', () => {
        const pts = [0, 10, 20, 30].map(ts => ({ ts, val: ts }));
        expect(nearest(pts, 14)?.ts).toBe(10);
        expect(nearest(pts, 16)?.ts).toBe(20);
        expect(nearest(pts, -5)?.ts).toBe(0);
        expect(nearest(pts, 99)?.ts).toBe(30);
        expect(nearest([], 5)).toBeNull();
    });
});
