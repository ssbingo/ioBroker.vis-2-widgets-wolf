import { describe, expect, it } from 'vitest';

import { decimalSeparator, fmt, toNumber } from './fmt';

describe('toNumber', () => {
    it('liest Zahlen und numerische Zeichenketten', () => {
        expect(toNumber(12.5)).toBe(12.5);
        expect(toNumber('12.5')).toBe(12.5);
        expect(toNumber(' 7 ')).toBe(7);
    });

    it('liefert null für leere und nicht numerische Werte', () => {
        for (const v of [null, undefined, '', '   ', 'abc', NaN, Infinity, true, {}, []]) {
            expect(toNumber(v)).toBeNull();
        }
    });
});

describe('fmt', () => {
    it('formatiert deutsch mit Nachkommastellen', () => {
        expect(fmt(1234.5, 2)).toBe('1.234,50');
    });

    it('formatiert nach Sprachregion', () => {
        expect(fmt(1234.5, 1, undefined, 'en')).toBe('1,234.5');
    });

    it('setzt die Einheit mit schmalem geschütztem Leerzeichen ab', () => {
        expect(fmt(0.92, 2, 'm³/h')).toBe('0,92 m³/h');
    });

    it('zeigt "--" für fehlende Werte', () => {
        expect(fmt(null)).toBe('--');
        expect(fmt('x', 2, 'm³')).toBe('--');
    });
});

describe('decimalSeparator', () => {
    it('kennt Komma und Punkt', () => {
        expect(decimalSeparator('de-DE')).toBe(',');
        expect(decimalSeparator('en')).toBe('.');
        expect(decimalSeparator('ru')).toBe(',');
    });
});
