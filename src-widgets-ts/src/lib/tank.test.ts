import { describe, expect, it } from 'vitest';

import { TANK_BOTTOM, tankFraction, tankScale } from './tank';

describe('tankScale', () => {
    it('reicht vom Leitungswasser bis zum höchsten Sollwert', () => {
        expect(tankScale(80)).toEqual({ min: TANK_BOTTOM, max: 80 });
    });

    it('bleibt bei unsinnig kleinem Sollwert mindestens 20 K hoch', () => {
        expect(tankScale(0)).toEqual({ min: TANK_BOTTOM, max: TANK_BOTTOM + 20 });
    });
});

describe('tankFraction', () => {
    const scale = { min: 10, max: 80 };

    it('rechnet linear zwischen Boden und Deckel', () => {
        expect(tankFraction(10, scale)).toBe(0);
        expect(tankFraction(45, scale)).toBe(0.5);
        expect(tankFraction(80, scale)).toBe(1);
    });

    it('begrenzt auf 0…1', () => {
        expect(tankFraction(-5, scale)).toBe(0);
        expect(tankFraction(95, scale)).toBe(1);
    });

    it('liefert null ohne gültigen Wert oder mit leerer Skala', () => {
        expect(tankFraction(null, scale)).toBeNull();
        expect(tankFraction(Number.NaN, scale)).toBeNull();
        expect(tankFraction(40, { min: 50, max: 50 })).toBeNull();
    });
});
