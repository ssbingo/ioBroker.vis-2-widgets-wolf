/*
 * Objekt-IDs des Statistik-Skripts aus dem Ordner ableiten.
 */
import { describe, expect, it } from 'vitest';

import { GAS_STATS_FIELDS, GAS_VALUES, gasStatsIds } from './gasStats';

describe('gasStatsIds', () => {
    it('hängt die State-Namen des Skripts an den Ordner', () => {
        const ids = gasStatsIds('0_userdata.0.Gas');
        expect(ids).toHaveLength(GAS_STATS_FIELDS.length);
        expect(ids[0]).toEqual({ attr: 'oid_zaehlerstand', id: '0_userdata.0.Gas.Zaehlerstand' });
        expect(ids.find(i => i.attr === 'oid_7tage')?.id).toBe('0_userdata.0.Gas.Letzte7Tage');
        expect(ids.find(i => i.attr === 'oid_vormonat')?.id).toBe('0_userdata.0.Gas.LetzterMonat');
    });

    it('kennt den berechneten Durchfluss ab Skriptfassung 2.1', () => {
        expect(gasStatsIds('0_userdata.0.Gas').find(i => i.attr === 'oid_durchfluss')?.id).toBe(
            '0_userdata.0.Gas.Durchfluss',
        );
    });

    it('kennt die Kosten des Monats ab Skriptfassung 3.0', () => {
        expect(gasStatsIds('0_userdata.0.Gas').find(i => i.attr === 'oid_kosten_monat')?.id).toBe(
            '0_userdata.0.Gas.Kosten.KostenMonat',
        );
    });

    it('verträgt Leerzeichen und einen Punkt am Ende', () => {
        expect(gasStatsIds('  0_userdata.0.Gas.  ')[2].id).toBe('0_userdata.0.Gas.Heute');
    });

    it('liefert ohne Ordner nichts', () => {
        expect(gasStatsIds('')).toEqual([]);
        expect(gasStatsIds(undefined)).toEqual([]);
    });
});

describe('GAS_VALUES', () => {
    it('nennt jeden Wert genau einmal und verweist nur auf Objektfelder des Widgets', () => {
        const keys = GAS_VALUES.map(v => v.key);
        expect(new Set(keys).size).toBe(keys.length);
        const felder = GAS_STATS_FIELDS.map(f => f.attr);
        for (const v of GAS_VALUES.filter(v => v.oid)) {
            expect(felder, v.key).toContain(v.oid);
        }
    });

    it('ermittelt Heute, Monat und Kosten notfalls selbst', () => {
        expect(GAS_VALUES.filter(v => v.self).map(v => v.key)).toEqual(['today', 'month', 'cost_month']);
    });

    it('nimmt für die Kosten ein verknüpftes Objekt vorrangig', () => {
        expect(GAS_VALUES.find(v => v.key === 'cost_month')?.oid).toBe('oid_kosten_monat');
    });
});
