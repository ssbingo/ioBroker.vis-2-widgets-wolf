/** Zuordnung Rohwert → Klartext; Schlüssel sind die Rohwerte als Zeichenkette */
export type ValueMap = Record<string, string>;

/**
 * Liest eine Zuordnung im Format "0=Standby;1=Heizbetrieb;2=Warmwasser".
 * Leerzeichen um Schlüssel und Text werden entfernt, unvollständige Einträge übersprungen.
 *
 * @param text Zuordnung aus einem Widget-Attribut
 * @returns die Zuordnung, leer bei fehlendem Text
 */
export function parseValueMap(text: string | undefined | null): ValueMap {
    const map: ValueMap = {};
    for (const entry of (text || '').split(';')) {
        const pos = entry.indexOf('=');
        if (pos < 1) {
            continue;
        }
        const key = entry.slice(0, pos).trim();
        const value = entry.slice(pos + 1).trim();
        if (key && value) {
            map[key] = value;
        }
    }
    return map;
}

/**
 * Entfernt eine vorangestellte Wiederholung des Schlüssels, wie sie manche Adapter liefern:
 * "3 - Wärmeanforderung (Heizbetrieb)" → "Wärmeanforderung (Heizbetrieb)".
 * Nur wenn das Präfix genau dem Schlüssel entspricht, auf das Trennzeichen ein Leerzeichen folgt
 * und danach noch Text steht.
 *
 * @param key Rohwert als Zeichenkette
 * @param text Klartext
 * @returns Klartext ohne redundantes Präfix
 */
export function stripKeyPrefix(key: string, text: string): string {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Trennzeichen mit folgendem Leerzeichen: "0 - Standby", "5: Frostschutz" — nicht "2-Wege-Ventil"
    const stripped = text.replace(new RegExp(`^${escaped}\\s*[-–:.]\\s+`), '');
    return stripped && stripped !== text ? stripped : text;
}

/**
 * Übernimmt common.states eines ioBroker-Objekts als Zuordnung.
 * Unterstützt die Objektform { "0": "Aus" } und die veraltete Textform "0:Aus;1:Ein".
 *
 * @param states common.states des Objekts
 * @returns die Zuordnung, leer wenn keine Zustände definiert sind
 */
export function statesToValueMap(states: unknown): ValueMap {
    if (typeof states === 'string') {
        const map = parseValueMap(states.replace(/:/g, '='));
        for (const key of Object.keys(map)) {
            map[key] = stripKeyPrefix(key, map[key]);
        }
        return map;
    }
    if (states && typeof states === 'object' && !Array.isArray(states)) {
        const map: ValueMap = {};
        for (const [key, value] of Object.entries(states as Record<string, unknown>)) {
            if (typeof value === 'string' || typeof value === 'number') {
                map[key] = stripKeyPrefix(key, String(value));
            }
        }
        return map;
    }
    return {};
}

/**
 * Klartext zu einem Rohwert. Die Zuordnungen werden der Reihe nach befragt, die erste
 * mit passendem Schlüssel gewinnt. Ohne Treffer wird der Rohwert selbst angezeigt.
 *
 * @param value Rohwert aus dem Objekt
 * @param maps Zuordnungen in absteigender Priorität
 * @returns Klartext, "--" bei fehlendem Wert
 */
export function mapValue(value: unknown, ...maps: ValueMap[]): string {
    if (value === null || value === undefined || value === '') {
        return '--';
    }
    let key: string;
    if (typeof value === 'string') {
        key = value.trim();
    } else if (typeof value === 'number' || typeof value === 'boolean') {
        key = String(value);
    } else {
        key = JSON.stringify(value);
    }
    for (const map of maps) {
        if (key in map) {
            return map[key];
        }
    }
    return key;
}
