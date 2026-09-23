/*
 * Statistik-Skript des Gaszählers: Das Skript aus dem Ordner addOn/ legt unter einem frei
 * wählbaren Ordner (Vorgabe 0_userdata.0.Gas) je einen State für Zählerstand, Heute, Gestern,
 * 7 Tage, 30 Tage, laufenden Monat und Vormonat an — ab Fassung 2.1 auch für den berechneten
 * Durchfluss. Das Widget verknüpft diese States wie jede andere Quelle; das Feld
 * „Ordner des Statistik-Skripts" trägt sie nur bequem ein.
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
    // ab Skriptfassung 2.1: aus der Zähleränderung berechnet, fällt nach einer Pause auf 0
    { attr: 'oid_durchfluss', state: 'Durchfluss' },
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

/** Ein Wert der Fußzeile: Schlüssel, Herkunft und Nachkommastellen */
export interface GasValueSpec {
    /** Schlüssel des Werts — zugleich Übersetzung und Name des Schalters (show_<key>) */
    key: string;
    /** Objekt-Attribut, aus dem der Wert kommt; ohne Angabe rechnet das Widget ihn selbst */
    oid?: string;
    /** Nachkommastellen in der Anzeige */
    decimals: number;
    /** Einheit; ohne Angabe m³ */
    unit?: string;
}

/**
 * Werte der Fußzeile in der Reihenfolge der Anzeige. Heute, Monat und die Kosten rechnet das
 * Widget selbst (aus Objekt oder Verlauf), die übrigen kommen aus verknüpften Objekten — meist
 * aus dem Statistik-Skript. Jeder Wert hat in der Gruppe „Sichtbare Werte" einen Schalter.
 */
export const GAS_VALUES: GasValueSpec[] = [
    { key: 'today', decimals: 2 },
    { key: 'yesterday', oid: 'oid_gestern', decimals: 2 },
    { key: 'days7', oid: 'oid_7tage', decimals: 1 },
    { key: 'days30', oid: 'oid_30tage', decimals: 1 },
    { key: 'month', decimals: 1 },
    { key: 'last_month', oid: 'oid_vormonat', decimals: 1 },
    { key: 'cost_month', decimals: 2, unit: '€' },
];

/** Schlüssel der Werte — der Übersetzungstest prüft darüber „<key>" und „show_<key>" */
export const GAS_VALUE_KEYS = GAS_VALUES.map(v => v.key);
