/*
 * Fluss im Anlagenschema: Umschaltventil, Kesselpumpe und Speicherladung.
 */
import { describe, expect, it } from 'vitest';

import { circuitActive, tankActive } from './schemaFlow';

describe('tankActive', () => {
    it('folgt dem eigenen Ladungsobjekt, wenn es eines gibt', () => {
        expect(tankActive(true, false, false)).toBe(true);
        expect(tankActive(false, true, true)).toBe(false);
    });

    it('folgt ohne Ventil dem Primärkreis', () => {
        expect(tankActive(null, true, null)).toBe(true);
        expect(tankActive(null, false, null)).toBe(false);
    });

    it('lädt nur, wenn das Ventil auf Warmwasser steht', () => {
        expect(tankActive(null, true, true)).toBe(true);
        expect(tankActive(null, true, false)).toBe(false);
        expect(tankActive(null, false, true)).toBe(false);
    });
});

describe('circuitActive', () => {
    it('folgt der eigenen Pumpe, wenn es eine gibt', () => {
        expect(circuitActive(true, false, null)).toBe(true);
        expect(circuitActive(false, true, null)).toBe(false);
    });

    it('folgt ohne Pumpe dem Primärkreis', () => {
        expect(circuitActive(null, true, null)).toBe(true);
        expect(circuitActive(null, false, null)).toBe(false);
    });

    it('steht still, solange das Ventil auf Warmwasser steht — auch mit laufender Pumpe', () => {
        expect(circuitActive(null, true, true)).toBe(false);
        expect(circuitActive(true, true, true)).toBe(false);
    });

    it('fließt wieder, sobald das Ventil auf Heizung steht', () => {
        expect(circuitActive(null, true, false)).toBe(true);
        expect(circuitActive(false, true, false)).toBe(false);
    });
});
