import { describe, expect, it } from 'vitest';

import { splitDigits } from './digits';

describe('splitDigits', () => {
    it('zerlegt ohne Gleitkommafehler (Regression aus dem Design-Paket)', () => {
        // Gleitkomma-Arithmetik ergab hier 18427,481 und 00100,299
        expect(splitDigits(18427.482, 5, 3)).toEqual({ whole: '18427', dec: '482', all: '18427482' });
        expect(splitDigits(100.3, 5, 3)).toEqual({ whole: '00100', dec: '300', all: '00100300' });
        expect(splitDigits(7314.096, 5, 3).dec).toBe('096');
        expect(splitDigits(12345.678, 5, 3).dec).toBe('678');
    });

    it('schneidet Nachkommastellen ab wie ein mechanisches Zählwerk', () => {
        expect(splitDigits(5.0019, 5, 3).dec).toBe('001');
        expect(splitDigits(0.4999, 1, 3).dec).toBe('499');
    });

    it('füllt links mit Nullen auf und kappt Überläufe', () => {
        expect(splitDigits(42, 5, 0)).toEqual({ whole: '00042', dec: '', all: '00042' });
        expect(splitDigits(123456.7, 5, 1).whole).toBe('23456');
    });

    it('stellt fehlende und ungültige Werte als Null dar', () => {
        expect(splitDigits(null, 3, 2).all).toBe('00000');
        expect(splitDigits(NaN, 3, 2).all).toBe('00000');
    });

    it('liefert vier Nachkommastellen für das Zeigerwerk', () => {
        expect(splitDigits(18427.4829, 5, 4).dec).toBe('4829');
    });
});
