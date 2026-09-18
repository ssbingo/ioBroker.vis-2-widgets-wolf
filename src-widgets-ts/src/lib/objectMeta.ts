import { toNumber } from './fmt';
import { parseValueMap, statesToValueMap, type ValueMap } from './valueMap';
import type { WriteValue } from './writeTracker';

/** Was ein Widget über ein Objekt wissen muss, um es anzuzeigen und zu bedienen */
export interface ObjectMeta {
    /** common.write — fehlt die Angabe, gilt das Objekt als schreibbar */
    write: boolean;
    /** common.min */
    min?: number;
    /** common.max */
    max?: number;
    /** common.step */
    step?: number;
    /** Klartexte aus common.states, ohne wiederholte Zahlenpräfixe */
    states: ValueMap;
    /** common.type, z. B. number oder boolean */
    type?: string;
}

/** Auswahlmöglichkeit für Segmentschalter */
export interface SelectOption {
    /** Rohwert, der geschrieben wird */
    value: string;
    /** angezeigter Klartext */
    label: string;
}

/** Wertebereich eines Steppers */
export interface NumberRange {
    /** kleinster Wert */
    min: number;
    /** größter Wert */
    max: number;
    /** Schrittweite */
    step: number;
}

/**
 * Metadaten aus einem ioBroker-Objekt lesen.
 *
 * @param obj Objekt oder null, wenn es nicht gelesen werden konnte
 * @returns Metadaten; ohne Objekt schreibbar und ohne Grenzen
 */
export function toObjectMeta(obj: { common?: unknown } | null | undefined): ObjectMeta {
    const common = (obj?.common ?? {}) as Record<string, unknown>;
    return {
        write: common.write !== false,
        min: toNumber(common.min) ?? undefined,
        max: toNumber(common.max) ?? undefined,
        step: toNumber(common.step) ?? undefined,
        states: statesToValueMap(common.states),
        type: typeof common.type === 'string' ? common.type : undefined,
    };
}

/**
 * Schaltwert im Typ des Objekts: Zahl-Objekte (z. B. wolf-smartset „0 Aus / 1 Ein") bekommen 0/1,
 * alle anderen true/false.
 *
 * @param meta Metadaten des Objekts
 * @param on gewünschter Zustand
 * @returns zu schreibender Wert
 */
export function switchValue(meta: ObjectMeta | undefined, on: boolean): WriteValue {
    if (meta?.type === 'number') {
        return on ? 1 : 0;
    }
    return on;
}

/**
 * Auswahl für einen Segmentschalter. Eine eigene Zuordnung aus dem Widget-Attribut hat Vorrang;
 * sonst gelten die Klartexte des Objekts innerhalb von min/max — so fällt z. B. „0 = Abgastest"
 * bei Wolf heraus, wenn das Objekt min 1 angibt.
 *
 * @param meta Metadaten des Objekts
 * @param override Zuordnung aus dem Widget-Attribut, z. B. "1=Standby;2=Automatik"
 * @returns Auswahl, nach Wert sortiert
 */
export function selectOptions(meta: ObjectMeta | undefined, override?: string): SelectOption[] {
    const own = parseValueMap(override);
    const source = Object.keys(own).length ? own : (meta?.states ?? {});
    const inRange = (key: string): boolean => {
        const n = Number(key);
        if (!Number.isFinite(n) || Object.keys(own).length) {
            return true;
        }
        return (meta?.min === undefined || n >= meta.min) && (meta?.max === undefined || n <= meta.max);
    };
    return Object.entries(source)
        .filter(([key]) => inRange(key))
        .sort(([a], [b]) => Number(a) - Number(b) || a.localeCompare(b))
        .map(([value, label]) => ({ value, label }));
}

/**
 * Wertebereich eines Steppers: Widget-Attribut vor Objekt vor Vorgabe.
 *
 * @param meta Metadaten des Objekts
 * @param attrs Werte aus den Widget-Attributen (leer = nicht gesetzt)
 * @param attrs.min Minimum aus dem Attribut
 * @param attrs.max Maximum aus dem Attribut
 * @param attrs.step Schrittweite aus dem Attribut
 * @param fallback Vorgabe, wenn weder Attribut noch Objekt etwas angeben
 * @returns Wertebereich
 */
export function numberRange(
    meta: ObjectMeta | undefined,
    attrs: { min?: unknown; max?: unknown; step?: unknown },
    fallback: NumberRange,
): NumberRange {
    const step = toNumber(attrs.step) ?? meta?.step ?? fallback.step;
    return {
        min: toNumber(attrs.min) ?? meta?.min ?? fallback.min,
        max: toNumber(attrs.max) ?? meta?.max ?? fallback.max,
        step: step > 0 ? step : fallback.step,
    };
}

/**
 * Nachkommastellen einer Schrittweite, z. B. 0,5 → 1 und 0,05 → 2.
 *
 * @param step Schrittweite
 * @returns Anzahl Nachkommastellen
 */
export function decimalsOf(step: number): number {
    const text = String(step);
    const pos = text.indexOf('.');
    return pos < 0 ? 0 : text.length - pos - 1;
}

/**
 * Wert um Schritte verändern, auf das Raster der Schrittweite runden und begrenzen —
 * ohne Gleitkommareste wie 22,300000000000001.
 *
 * @param value Ausgangswert; null startet am Minimum
 * @param steps Anzahl Schritte, negativ zum Senken
 * @param range Wertebereich
 * @returns neuer Wert
 */
export function stepValue(value: number | null, steps: number, range: NumberRange): number {
    const base = value ?? range.min;
    const raw = Math.round((base + steps * range.step) / range.step) * range.step;
    const clamped = Math.min(range.max, Math.max(range.min, raw));
    return Number(clamped.toFixed(decimalsOf(range.step)));
}
