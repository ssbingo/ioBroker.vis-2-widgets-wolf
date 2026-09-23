import { describe, expect, it } from 'vitest';

import { mapValue, parseValueMap, statesToValueMap, stripKeyPrefix } from './valueMap';

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

describe('stripKeyPrefix', () => {
    it('entfernt die wiederholte Zahl, wie sie wolf-smartset liefert', () => {
        expect(stripKeyPrefix('0', '0 - Standby')).toBe('Standby');
        expect(stripKeyPrefix('3', '3 - Wärmeanforderung (Heizbetrieb)')).toBe('Wärmeanforderung (Heizbetrieb)');
        expect(stripKeyPrefix('10', '10 - HG Status 10')).toBe('HG Status 10');
        expect(stripKeyPrefix('5', '5: Frostschutz')).toBe('Frostschutz');
    });

    it('lässt Texte ohne passendes Präfix unverändert', () => {
        expect(stripKeyPrefix('1', '10 - HG Status 10')).toBe('10 - HG Status 10');
        expect(stripKeyPrefix('0', '1')).toBe('1');
        expect(stripKeyPrefix('9', '9')).toBe('9');
        expect(stripKeyPrefix('2', '2-Wege-Ventil')).toBe('2-Wege-Ventil');
        expect(stripKeyPrefix('3', '3.5 bar')).toBe('3.5 bar');
    });

    it('wirkt beim Übernehmen von common.states', () => {
        expect(statesToValueMap({ 0: '0 - Standby', 3: '3 - Taktsperre' })).toEqual({ 0: 'Standby', 3: 'Taktsperre' });
        expect(statesToValueMap('0:0 - Aus;1:1 - Ein')).toEqual({ 0: 'Aus', 1: 'Ein' });
    });
});
