import { describe, expect, it } from 'vitest';

import { monthlyCost } from './gas';

describe('monthlyCost', () => {
    it('rechnet m³ über Brennwert und Zustandszahl in Kosten um', () => {
        const cost = monthlyCost(96.4, {
            brennwert: 11.482,
            zustandszahl: 0.9612,
            arbeitspreis: 0.1092,
            grundpreis: 14.9,
        });
        expect(cost).toBeCloseTo(96.4 * 11.482 * 0.9612 * 0.1092 + 14.9, 6);
    });

    it('nutzt die Vorgaben für Brennwert und Zustandszahl', () => {
        expect(monthlyCost(10, { arbeitspreis: 0.1 })).toBeCloseTo(10 * 11.482 * 0.9612 * 0.1, 6);
    });

    it('liefert null ohne Verbrauch oder Arbeitspreis', () => {
        expect(monthlyCost(null, { arbeitspreis: 0.1 })).toBeNull();
        expect(monthlyCost(10, {})).toBeNull();
    });
});
