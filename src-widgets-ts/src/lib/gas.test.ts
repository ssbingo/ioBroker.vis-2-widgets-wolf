import { describe, expect, it } from 'vitest';

import { monthlyCost, pricePerKwh, priceSuspicious } from './gas';

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

describe('pricePerKwh', () => {
    it('nimmt Euro unverändert', () => {
        expect(pricePerKwh(0.0814, 'eur')).toBeCloseTo(0.0814, 6);
        expect(pricePerKwh(0.0814, undefined)).toBeCloseTo(0.0814, 6);
    });

    it('rechnet Cent in Euro um', () => {
        expect(pricePerKwh(8.14, 'ct')).toBeCloseTo(0.0814, 6);
    });

    it('liefert ohne Wert nichts', () => {
        expect(pricePerKwh(null, 'ct')).toBeNull();
        expect(pricePerKwh(undefined, 'eur')).toBeNull();
    });
});

describe('priceSuspicious', () => {
    it('meldet den Cent-Fehler: 8,14 statt 0,0814 €/kWh', () => {
        expect(priceSuspicious(8.14)).toBe(true);
    });

    it('schweigt bei üblichen Preisen', () => {
        expect(priceSuspicious(0.0814)).toBe(false);
        expect(priceSuspicious(0.19)).toBe(false);
    });

    it('meldet auch einen zu kleinen Preis', () => {
        expect(priceSuspicious(0.000814)).toBe(true);
    });

    it('schweigt ohne Preis', () => {
        expect(priceSuspicious(null)).toBe(false);
        expect(priceSuspicious(0)).toBe(false);
    });
});
