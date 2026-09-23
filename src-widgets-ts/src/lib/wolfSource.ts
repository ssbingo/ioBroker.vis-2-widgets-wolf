/*
 * Objektfelder aus einer Adapterinstanz vorbelegen.
 *
 * Zwei Adapter liefern Wolf-Anlagen an ioBroker:
 *   wolf-smartset (ISM7, Cloud) — Objekt-IDs enthalten die Anlagenstruktur, die je Anlage anders
 *     heißt. Stabil ist die Wolf-Parameternummer in native.ParameterId; darüber wird zugeordnet.
 *   wolf (ISM8i, lokal) — feste Struktur <instanz>.<gerät>.<nummer>, z. B. hg1_t.4 für die
 *     Kesseltemperatur. Die Nummern stehen im Adapter (js/datapoints.json) und sind hier notiert.
 *
 * Was ein Adapter nicht liefert, bleibt leer: Das ISM8i kennt weder Tag-/Spartemperatur noch
 * Betriebsstunden, das ISM7 über wolf-smartset weder Modulation noch Anlagendruck.
 */

/** Adapter, aus dem sich Objekte vorbelegen lassen */
export type WolfAdapter = 'wolf-smartset' | 'wolf';

/** Zuordnung eines Widget-Attributs zu je einem Objekt der beiden Adapter */
export interface SourceMapping {
    /** Name des Widget-Attributs, z. B. oid_vorlauf */
    attr: string;
    /** wolf-smartset: Wert von native.ParameterId */
    param?: number;
    /** wolf (ISM8i): Pfad unterhalb der Instanz, z. B. „hg1_t.4" */
    ism8?: string;
}

/**
 * Zuordnungen je Widget. Die Reihenfolge entspricht den Feldern im Editor.
 *
 * ISM8i-Datenpunkte (js/datapoints.json des Adapters `wolf`):
 * hg1_t: 1 Störung · 2 Betriebsart · 3 Modulationsgrad · 4 Kesseltemperatur · 5 Sammlertemperatur ·
 *        6 Rücklauf · 7 Warmwasser · 8 Außentemperatur · 9 Flamme · 10 Heizkreispumpe ·
 *        11 Speicherladepumpe · 12 3-Wege-Umschaltventil · 13 Anlagendruck · 364 Kesselsolltemperatur
 * bm1_t: 53 Störung · 55 Raumtemperatur · 56 Warmwassersolltemperatur · 57 Programmwahl Heizkreis ·
 *        58 Programmwahl Warmwasser · 65 Sollwertkorrektur · 194 1x Warmwasserladung ·
 *        368 Vorlaufsolltemperatur direkter Heizkreis
 */
export const WIDGET_SOURCES: Record<string, SourceMapping[]> = {
    tplWolfSchema: [
        { attr: 'oid_vorlauf', param: 8000500001, ism8: 'hg1_t.4' },
        { attr: 'oid_ruecklauf', param: 8000700001, ism8: 'hg1_t.6' },
        { attr: 'oid_brenner', param: 8000900001, ism8: 'hg1_t.9' },
        { attr: 'oid_modulation', ism8: 'hg1_t.3' },
        { attr: 'oid_pumpe', param: 8001700001, ism8: 'hg1_t.10' },
        { attr: 'oid_aussentemp', param: 3000100000, ism8: 'hg1_t.8' },
        { attr: 'oid_ww_temp', param: 8000100001, ism8: 'hg1_t.7' },
        { attr: 'oid_ww_ladung', param: 8001900001, ism8: 'hg1_t.11' },
        { attr: 'oid_3wuv', param: 8001800001, ism8: 'hg1_t.12' },
        { attr: 'oid_hk_vorlauf1', param: 8000500001, ism8: 'hg1_t.4' },
    ],
    tplWolfBoiler: [
        { attr: 'oid_phase', param: 8002000001, ism8: 'hg1_t.2' },
        { attr: 'oid_brenner', param: 8000900001, ism8: 'hg1_t.9' },
        { attr: 'oid_modulation', ism8: 'hg1_t.3' },
        { attr: 'oid_druck', ism8: 'hg1_t.13' },
        { attr: 'oid_betriebsstunden', param: 8008400001 },
        { attr: 'oid_starts', param: 8008500001 },
        { attr: 'oid_vorlauf', param: 8000500001, ism8: 'hg1_t.4' },
        { attr: 'oid_ruecklauf', param: 8000700001, ism8: 'hg1_t.6' },
    ],
    tplWolfCircuit: [
        { attr: 'oid_betriebsart', param: 3001800000, ism8: 'bm1_t.57' },
        { attr: 'oid_tagtemp', param: 1000000000 },
        { attr: 'oid_spartemp', param: 1000100000 },
        { attr: 'oid_korrektur', param: 3001900000, ism8: 'bm1_t.65' },
        { attr: 'oid_zeitprogramm', param: 1000200000 },
        { attr: 'oid_raumtemp', param: 1001200000, ism8: 'bm1_t.55' },
        { attr: 'oid_raumsoll', param: 1001300000 },
        { attr: 'oid_vorlauf_soll', param: 8000600001, ism8: 'bm1_t.368' },
    ],
    tplWolfHeatCurve: [
        { attr: 'oid_korrektur', param: 3001900000, ism8: 'bm1_t.65' },
        { attr: 'oid_steilheit', param: 1000300000 },
        { attr: 'oid_aussentemp', param: 3000100000, ism8: 'hg1_t.8' },
        { attr: 'oid_aussentemp_mittel', param: 3000200000 },
        { attr: 'oid_vorlauf_soll', param: 8000600001, ism8: 'bm1_t.368' },
        { attr: 'oid_raumsoll', param: 1000000000 },
        { attr: 'oid_ladung', param: 8001900001, ism8: 'hg1_t.11' },
    ],
    tplWolfDhw: [
        { attr: 'oid_ww_temp', param: 8000100001, ism8: 'hg1_t.7' },
        { attr: 'oid_ww_soll', param: 3006600000, ism8: 'bm1_t.56' },
        { attr: 'oid_zeitprogramm', param: 3006700000, ism8: 'bm1_t.58' },
        { attr: 'oid_sofortladung', ism8: 'bm1_t.194' },
        { attr: 'oid_ww_soll_wirksam', param: 8000200001 },
        { attr: 'oid_ladung', param: 8001900001, ism8: 'hg1_t.11' },
    ],
    tplWolfMessages: [
        { attr: 'oid_check1', param: 8001100001, ism8: 'hg1_t.1' },
        { attr: 'oid_check2', param: 8001200001, ism8: 'bm1_t.53' },
    ],
    tplWolfTrends: [
        { attr: 'oid_serie1', param: 8000500001, ism8: 'hg1_t.4' },
        { attr: 'oid_serie2', param: 8000700001, ism8: 'hg1_t.6' },
        { attr: 'oid_serie3', param: 3000100000, ism8: 'hg1_t.8' },
        { attr: 'oid_serie4', param: 8000100001, ism8: 'hg1_t.7' },
    ],
};

/**
 * Welcher Adapter steckt hinter einer Instanz?
 *
 * @param instance Instanz wie „wolf-smartset.0" oder „wolf.0"
 * @returns der Adapter oder null, wenn es keiner der beiden ist
 */
export function wolfAdapterOf(instance: string | undefined): WolfAdapter | null {
    const name = (instance ?? '').trim().split('.')[0];
    return name === 'wolf-smartset' || name === 'wolf' ? name : null;
}

/** Objekte der Instanz, aus denen die Zuordnung schöpft */
export interface SourceObjects {
    /** wolf-smartset: Parameternummer → Objekt-ID */
    byParam: Map<number, string>;
    /** vorhandene Objekt-IDs der Instanz */
    ids: Set<string>;
}

/**
 * Welche Attribute lassen sich aus der Instanz belegen?
 *
 * @param widget Widget-Kennung, z. B. tplWolfSchema
 * @param instance Instanz wie „wolf-smartset.0"
 * @param objects Objekte dieser Instanz
 * @returns Attribut und Objekt-ID, nur für tatsächlich vorhandene Objekte
 */
export function sourceAssignment(
    widget: string,
    instance: string,
    objects: SourceObjects,
): Array<{ attr: string; id: string }> {
    const adapter = wolfAdapterOf(instance);
    const mappings = WIDGET_SOURCES[widget];
    if (!adapter || !mappings) {
        return [];
    }
    const base = instance.trim().replace(/\.+$/, '');
    const found: Array<{ attr: string; id: string }> = [];
    for (const m of mappings) {
        if (adapter === 'wolf-smartset') {
            const id = m.param === undefined ? undefined : objects.byParam.get(m.param);
            if (id) {
                found.push({ attr: m.attr, id });
            }
        } else if (m.ism8) {
            const id = `${base}.${m.ism8}`;
            if (objects.ids.has(id)) {
                found.push({ attr: m.attr, id });
            }
        }
    }
    return found;
}

/**
 * Wert, bei dem das 3-Wege-Umschaltventil auf Warmwasser steht — er hängt davon ab, wie der
 * Adapter den Zustand ablegt: wolf-smartset als Zahl, der ISM8i-Adapter als Text oder Wahrheitswert.
 *
 * @param type Datentyp des Ventil-Objekts (common.type)
 * @param adapter Adapter, aus dem das Objekt stammt
 * @returns der Wert für das Attribut „Wert für Warmwasser"
 */
export function valveDhwValue(type: string | undefined, adapter: WolfAdapter): string {
    if (adapter === 'wolf') {
        return type === 'boolean' ? 'true' : 'Open';
    }
    return type === 'boolean' ? 'true' : '1';
}
