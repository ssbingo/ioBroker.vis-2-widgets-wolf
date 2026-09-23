/*
 * Blöcke der Heizkreis-Kachel. Zu jedem Block gehören das Objekt `oid_<name>`, der Schalter
 * `show_<name>` der Attributgruppe „Sichtbare Blöcke" und der Übersetzungsschlüssel `show_<name>`.
 * Eigene Datei, damit der Übersetzungstest die Liste ohne VIS-2-Umgebung laden kann.
 */

/** Blöcke in der Reihenfolge der Darstellung */
export const CIRCUIT_BLOCKS = [
    'betriebsart',
    'tagtemp',
    'spartemp',
    'korrektur',
    'zeitprogramm',
    'raumtemp',
    'raumsoll',
    'vorlauf_soll',
] as const;

/** Name eines Blocks */
export type CircuitBlock = (typeof CIRCUIT_BLOCKS)[number];
