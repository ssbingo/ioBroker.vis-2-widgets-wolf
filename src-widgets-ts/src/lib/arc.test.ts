import { describe, expect, it } from 'vitest';

import { arcFraction, arcPoint, arcSegment, ARC_FULL } from './arc';

describe('arcFraction', () => {
    it('rechnet den Anteil an der Skala', () => {
        expect(arcFraction(1.5, 0, 3)).toBe(0.5);
        expect(arcFraction(75, 0, 100)).toBe(0.75);
    });

    it('begrenzt auf 0…1', () => {
        expect(arcFraction(-1, 0, 3)).toBe(0);
        expect(arcFraction(4, 0, 3)).toBe(1);
    });

    it('liefert 0 bei fehlendem Wert oder leerer Skala', () => {
        expect(arcFraction(null, 0, 3)).toBe(0);
        expect(arcFraction(NaN, 0, 3)).toBe(0);
        expect(arcFraction(1, 3, 3)).toBe(0);
    });
});

describe('arcPoint', () => {
    it('liegt links, oben und rechts auf dem Halbkreis des Entwurfs', () => {
        const [lx, ly] = arcPoint(0);
        const [tx, ty] = arcPoint(0.5);
        const [rx, ry] = arcPoint(1);
        expect(lx).toBeCloseTo(14);
        expect(ly).toBeCloseTo(68);
        expect(tx).toBeCloseTo(60);
        expect(ty).toBeCloseTo(22);
        expect(rx).toBeCloseTo(106);
        expect(ry).toBeCloseTo(68);
    });
});

describe('arcSegment', () => {
    it('entspricht für den ganzen Bogen dem Pfad des Entwurfs', () => {
        expect(ARC_FULL).toBe('M14.00 68.00 A46 46 0 0 1 106.00 68.00');
    });

    it('trifft die Warnzone des Entwurfs bis etwa 1,2 bar auf einer 3-bar-Skala', () => {
        // Entwurf: "M14 68 A46 46 0 0 1 48 26" — der Endpunkt ist dort von Hand gesetzt und liegt
        // knapp neben dem Kreis (bei x = 48 liegt der Kreis bei y ≈ 23,6). Die x-Lage stimmt.
        const end = arcPoint(arcFraction(1.25, 0, 3));
        expect(end[0]).toBeCloseTo(48, 0);
        expect(Math.abs(end[1] - 26)).toBeLessThan(3);
        expect(arcSegment(0, 0.4)).toMatch(/^M14\.00 68\.00 A46 46 0 0 1 /);
    });
});
