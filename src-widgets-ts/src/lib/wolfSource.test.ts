/*
 * Vorbelegen der Objektfelder aus einer Adapterinstanz.
 */
import { describe, expect, it } from 'vitest';

import { sourceAssignment, valveDhwValue, WIDGET_SOURCES, wolfAdapterOf, type SourceObjects } from './wolfSource';

/** Objekte einer wolf-smartset-Anlage, wie sie der Adapter anlegt */
const smartset: SourceObjects = {
    byParam: new Map([
        [8000500001, 'wolf-smartset.0.Benutzer.Übersicht.8000500001'],
        [8000700001, 'wolf-smartset.0.Benutzer.Übersicht.8000700001'],
        [8000900001, 'wolf-smartset.0.Benutzer.Heizung.210_Wärmeerzeuger_1.8000900001'],
        [8001800001, 'wolf-smartset.0.Benutzer.Übersicht.8001800001'],
        [3000100000, 'wolf-smartset.0.Benutzer.Heizung.058_Direkter_Heizkreis.3000100000'],
    ]),
    ids: new Set(),
};

/** Objekte einer ISM8i-Anlage am Adapter „wolf" */
const ism8: SourceObjects = {
    byParam: new Map(),
    ids: new Set(['wolf.0.hg1_t.4', 'wolf.0.hg1_t.6', 'wolf.0.hg1_t.9', 'wolf.0.hg1_t.12', 'wolf.0.hg1_t.3']),
};

describe('wolfAdapterOf', () => {
    it('erkennt beide Adapter', () => {
        expect(wolfAdapterOf('wolf-smartset.0')).toBe('wolf-smartset');
        expect(wolfAdapterOf('wolf.2')).toBe('wolf');
    });

    it('weist alles andere ab', () => {
        expect(wolfAdapterOf('hm-rpc.0')).toBeNull();
        expect(wolfAdapterOf('')).toBeNull();
        expect(wolfAdapterOf(undefined)).toBeNull();
    });
});

describe('sourceAssignment', () => {
    it('findet wolf-smartset-Objekte über die Parameternummer', () => {
        const a = sourceAssignment('tplWolfSchema', 'wolf-smartset.0', smartset);
        expect(a.find(x => x.attr === 'oid_vorlauf')?.id).toBe('wolf-smartset.0.Benutzer.Übersicht.8000500001');
        expect(a.find(x => x.attr === 'oid_3wuv')?.id).toBe('wolf-smartset.0.Benutzer.Übersicht.8001800001');
    });

    it('lässt aus, was die Anlage nicht liefert', () => {
        const a = sourceAssignment('tplWolfSchema', 'wolf-smartset.0', smartset);
        // Modulation gibt es nur am ISM8i, der Speicherfühler fehlt in dieser Anlage
        expect(a.map(x => x.attr)).not.toContain('oid_modulation');
        expect(a.map(x => x.attr)).not.toContain('oid_ww_temp');
    });

    it('baut ISM8i-Objekte aus dem festen Pfad', () => {
        const a = sourceAssignment('tplWolfSchema', 'wolf.0', ism8);
        expect(a.find(x => x.attr === 'oid_vorlauf')?.id).toBe('wolf.0.hg1_t.4');
        expect(a.find(x => x.attr === 'oid_modulation')?.id).toBe('wolf.0.hg1_t.3');
        // die Anlage meldet keine Außentemperatur, also bleibt das Feld leer
        expect(a.map(x => x.attr)).not.toContain('oid_aussentemp');
    });

    it('liefert nichts für fremde Adapter oder unbekannte Widgets', () => {
        expect(sourceAssignment('tplWolfSchema', 'hm-rpc.0', ism8)).toEqual([]);
        expect(sourceAssignment('tplUnbekannt', 'wolf.0', ism8)).toEqual([]);
    });

    it('kennt alle acht Widget-Kennungen außer dem Gaszähler', () => {
        expect(Object.keys(WIDGET_SOURCES).sort()).toEqual([
            'tplWolfBoiler',
            'tplWolfCircuit',
            'tplWolfDhw',
            'tplWolfHeatCurve',
            'tplWolfMessages',
            'tplWolfSchema',
            'tplWolfTrends',
        ]);
    });
});

describe('valveDhwValue', () => {
    it('folgt dem Datentyp des Ventil-Objekts', () => {
        expect(valveDhwValue('number', 'wolf-smartset')).toBe('1');
        expect(valveDhwValue('boolean', 'wolf-smartset')).toBe('true');
        expect(valveDhwValue('string', 'wolf')).toBe('Open');
        expect(valveDhwValue('boolean', 'wolf')).toBe('true');
    });
});
