import { describe, expect, it } from 'vitest';

import { decimalsOf, numberRange, objectName, selectOptions, stepValue, switchValue, toObjectMeta } from './objectMeta';

/** Betriebsart des direkten Heizkreises, wie wolf-smartset sie liefert */
const BETRIEBSART = {
    common: {
        name: 'Betriebsart',
        write: true,
        min: 1,
        max: 5,
        states: {
            0: 'Abgastest',
            1: 'Standby-Betrieb',
            2: 'Automatikbetrieb',
            3: 'Heizbetrieb',
            4: 'Absenkbetrieb',
            5: 'Sommerbetrieb',
        },
    },
};

describe('objectName', () => {
    it('nimmt den Namen in der Sprache, sonst Englisch, sonst die erste Übersetzung', () => {
        expect(objectName(toObjectMeta({ common: { name: 'TW-Vorlauf' } }), 'de')).toBe('TW-Vorlauf');
        expect(objectName(toObjectMeta({ common: { name: { en: 'Connected', de: 'Verbunden' } } }), 'de')).toBe(
            'Verbunden',
        );
        expect(objectName(toObjectMeta({ common: { name: { en: 'Connected', de: 'Verbunden' } } }), 'fr')).toBe(
            'Connected',
        );
        expect(objectName(toObjectMeta({ common: { name: { pl: 'Połączono' } } }), 'fr')).toBe('Połączono');
        expect(objectName(toObjectMeta(null), 'de')).toBeUndefined();
    });
});

describe('switchValue', () => {
    it('schreibt in Zahl-Objekte 0/1, sonst true/false', () => {
        expect(switchValue(toObjectMeta({ common: { type: 'number', states: { 0: 'Aus', 1: 'Ein' } } }), true)).toBe(1);
        expect(switchValue(toObjectMeta({ common: { type: 'number' } }), false)).toBe(0);
        expect(switchValue(toObjectMeta({ common: { type: 'boolean' } }), true)).toBe(true);
        expect(switchValue(undefined, false)).toBe(false);
    });
});

describe('toObjectMeta', () => {
    it('liest Schreibrecht, Grenzen, Schrittweite und Klartexte', () => {
        const meta = toObjectMeta({ common: { write: false, min: 0, max: 3, step: 0.1 } });
        expect(meta).toEqual({ write: false, min: 0, max: 3, step: 0.1, states: {} });
    });

    it('gilt ohne Objekt oder ohne write-Angabe als schreibbar', () => {
        expect(toObjectMeta(null).write).toBe(true);
        expect(toObjectMeta({ common: {} }).write).toBe(true);
    });

    it('entfernt wiederholte Zahlenpräfixe aus den Klartexten', () => {
        expect(toObjectMeta({ common: { states: { 0: '0 - Standby' } } }).states).toEqual({ 0: 'Standby' });
    });
});

describe('selectOptions', () => {
    it('nimmt die Klartexte des Objekts innerhalb min/max', () => {
        expect(selectOptions(toObjectMeta(BETRIEBSART)).map(o => o.value)).toEqual(['1', '2', '3', '4', '5']);
        expect(selectOptions(toObjectMeta(BETRIEBSART))[0]).toEqual({ value: '1', label: 'Standby-Betrieb' });
    });

    it('bevorzugt die eigene Zuordnung aus dem Attribut', () => {
        expect(selectOptions(toObjectMeta(BETRIEBSART), '2=Auto;3=Heizen')).toEqual([
            { value: '2', label: 'Auto' },
            { value: '3', label: 'Heizen' },
        ]);
    });

    it('liefert eine leere Auswahl ohne Klartexte', () => {
        expect(selectOptions(undefined)).toEqual([]);
    });
});

describe('numberRange', () => {
    const fallback = { min: 5, max: 30, step: 0.5 };

    it('bevorzugt Attribut vor Objekt vor Vorgabe', () => {
        const meta = toObjectMeta({ common: { min: 5, max: 30, step: 0.5 } });
        expect(numberRange(meta, { min: 15, max: '', step: undefined }, fallback)).toEqual({
            min: 15,
            max: 30,
            step: 0.5,
        });
        expect(numberRange(undefined, {}, fallback)).toEqual(fallback);
    });

    it('verwirft eine unbrauchbare Schrittweite', () => {
        expect(numberRange(undefined, { step: 0 }, fallback).step).toBe(0.5);
    });
});

describe('stepValue', () => {
    it('zählt im Raster der Schrittweite ohne Gleitkommareste', () => {
        const range = { min: 0, max: 3, step: 0.1 };
        expect(stepValue(0.2, 1, range)).toBe(0.3);
        expect(stepValue(1.5, 3, range)).toBe(1.8);
    });

    it('rastet krumme Werte auf das Raster ein und begrenzt', () => {
        const range = { min: 5, max: 30, step: 0.5 };
        expect(stepValue(21.3, 1, range)).toBe(22);
        expect(stepValue(29.5, 2, range)).toBe(30);
        expect(stepValue(5, -1, range)).toBe(5);
        expect(stepValue(null, 0, range)).toBe(5);
    });

    it('kann ins Negative, wie die Sollwertkorrektur', () => {
        expect(stepValue(1, -3, { min: -4, max: 4, step: 0.5 })).toBe(-0.5);
    });
});

describe('decimalsOf', () => {
    it('zählt die Nachkommastellen', () => {
        expect(decimalsOf(1)).toBe(0);
        expect(decimalsOf(0.5)).toBe(1);
        expect(decimalsOf(0.05)).toBe(2);
    });
});
