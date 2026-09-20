/*
 * Statistik-Skript des Gaszählers: addOn/Gasverbrauch_statistik.js legt unter einem frei
 * wählbaren Ordner (Vorgabe 0_userdata.0.Gas) je einen State für Zählerstand, Heute, Gestern,
 * 7 Tage, 30 Tage, laufenden Monat und Vormonat an. Das Widget verknüpft diese States wie jede
 * andere Quelle; das Feld „Ordner des Statistik-Skripts" trägt sie nur bequem ein.
 */

/** Widget-Attribut und der State, den das Skript dafür anlegt */
export interface GasStatsField {
    /** Name des Widget-Attributs, z. B. oid_heute */
    attr: string;
    /** Name des States unterhalb des Ordners, z. B. Heute */
    state: string;
}

/** Zuordnung in der Reihenfolge, in der die Felder im Editor stehen */
export const GAS_STATS_FIELDS: GasStatsField[] = [
    { attr: 'oid_zaehlerstand', state: 'Zaehlerstand' },
    { attr: 'oid_heute', state: 'Heute' },
    { attr: 'oid_gestern', state: 'Gestern' },
    { attr: 'oid_7tage', state: 'Letzte7Tage' },
    { attr: 'oid_30tage', state: 'Letzte30Tage' },
    { attr: 'oid_monat', state: 'DieserMonat' },
    { attr: 'oid_vormonat', state: 'LetzterMonat' },
];

/**
 * Objekt-IDs, die das Skript unter dem Ordner anlegt.
 *
 * @param path Ordner aus dem Attribut, z. B. „0_userdata.0.Gas" (auch mit Punkt am Ende)
 * @returns Attribut und zugehörige Objekt-ID; leer, wenn kein Ordner angegeben ist
 */
export function gasStatsIds(path: string | undefined): Array<{ attr: string; id: string }> {
    const base = (path ?? '').trim().replace(/\.+$/, '');
    if (!base) {
        return [];
    }
    return GAS_STATS_FIELDS.map(f => ({ attr: f.attr, id: `${base}.${f.state}` }));
}

/**
 * Schlüssel der Werte in der Fußzeile — zugleich die Übersetzungsschlüssel. Die Anbindung setzt
 * sie zur Laufzeit zusammen, deshalb prüft der Übersetzungstest sie über diese Liste.
 */
export const GAS_VALUE_KEYS = ['today', 'yesterday', 'days7', 'days30', 'month', 'last_month', 'cost_month'] as const;
