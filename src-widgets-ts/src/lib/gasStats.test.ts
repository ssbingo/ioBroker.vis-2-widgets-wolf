/*
 * Objekt-IDs des Statistik-Skripts aus dem Ordner ableiten.
 */
import { describe, expect, it } from 'vitest';

import { GAS_STATS_FIELDS, gasStatsIds } from './gasStats';

describe('gasStatsIds', () => {
    it('hängt die State-Namen des Skripts an den Ordner', () => {
        const ids = gasStatsIds('0_userdata.0.Gas');
        expect(ids).toHaveLength(GAS_STATS_FIELDS.length);
        expect(ids[0]).toEqual({ attr: 'oid_zaehlerstand', id: '0_userdata.0.Gas.Zaehlerstand' });
        expect(ids.find(i => i.attr === 'oid_7tage')?.id).toBe('0_userdata.0.Gas.Letzte7Tage');
        expect(ids.find(i => i.attr === 'oid_vormonat')?.id).toBe('0_userdata.0.Gas.LetzterMonat');
    });

    it('verträgt Leerzeichen und einen Punkt am Ende', () => {
        expect(gasStatsIds('  0_userdata.0.Gas.  ')[1].id).toBe('0_userdata.0.Gas.Heute');
    });

    it('liefert ohne Ordner nichts', () => {
        expect(gasStatsIds('')).toEqual([]);
        expect(gasStatsIds(undefined)).toEqual([]);
    });
});
