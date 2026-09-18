import { describe, expect, it } from 'vitest';

import { mapValue, parseValueMap, statesToValueMap } from './valueMap';

describe('parseValueMap', () => {
    it('liest die Zuordnung aus dem Widget-Attribut', () => {
        expect(parseValueMap('0=Standby;1=Heizbetrieb;2=Warmwasser')).toEqual({
            0: 'Standby',
            1: 'Heizbetrieb',
            2: 'Warmwasser',
        });
    });

    it('verträgt Leerzeichen und überspringt Unvollständiges', () => {
        expect(parseValueMap(' 0 = Aus ; =leer; 1= ; 2=Ein;;')).toEqual({ 0: 'Aus', 2: 'Ein' });
    });

    it('behält Gleichheitszeichen im Text', () => {
        expect(parseValueMap('3=Ladung = aktiv')).toEqual({ 3: 'Ladung = aktiv' });
    });

    it('liefert eine leere Zuordnung ohne Text', () => {
        expect(parseValueMap('')).toEqual({});
        expect(parseValueMap(undefined)).toEqual({});
    });
});

describe('statesToValueMap', () => {
    it('übernimmt common.states in Objektform', () => {
        expect(statesToValueMap({ 0: 'Aus', 1: 'Ein', 2: 3 })).toEqual({ 0: 'Aus', 1: 'Ein', 2: '3' });
    });

    it('übernimmt die veraltete Textform', () => {
        expect(statesToValueMap('0:Aus;1:Ein')).toEqual({ 0: 'Aus', 1: 'Ein' });
    });

    it('ignoriert fehlende oder unpassende Angaben', () => {
        expect(statesToValueMap(undefined)).toEqual({});
        expect(statesToValueMap(['a'])).toEqual({});
    });
});

describe('mapValue', () => {
    const own = { 1: 'Heizen' };
    const fromObject = { 1: 'Heizbetrieb', 2: 'Warmwasser' };
    const defaults = { 0: 'Standby', 1: 'Heating', 2: 'Hot water' };

    it('fragt die Zuordnungen in der angegebenen Reihenfolge', () => {
        expect(mapValue(1, own, fromObject, defaults)).toBe('Heizen');
        expect(mapValue(2, own, fromObject, defaults)).toBe('Warmwasser');
        expect(mapValue(0, own, fromObject, defaults)).toBe('Standby');
    });

    it('zeigt unbekannte Werte und Klartexte unverändert', () => {
        expect(mapValue(7, own)).toBe('7');
        expect(mapValue('Brenner an', own)).toBe('Brenner an');
    });

    it('zeigt "--" ohne Wert', () => {
        expect(mapValue(null, own)).toBe('--');
        expect(mapValue('', own)).toBe('--');
    });
});
