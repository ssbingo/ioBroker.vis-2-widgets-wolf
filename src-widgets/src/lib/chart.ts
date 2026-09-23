/*
 * Achsen, Zeitraster und Pfade für das Verlaufsdiagramm (tplWolfTrends) — ohne React und ohne
 * ioBroker, damit testbar. Keine Diagrammbibliothek: eigenes SVG wie im Entwurf.
 */

/** Messpunkt */
export interface ChartPoint {
    /** Zeit in ms */
    ts: number;
    /** Wert */
    val: number;
}

/** wählbare Zeiträume */
export const RANGES = { '6h': 6, '12h': 12, '24h': 24, '7d': 168 } as const;
export type RangeKey = keyof typeof RANGES;

/** wählbare Verdichtungen des Verlaufsadapters */
export const AGGREGATES = ['average', 'minmax', 'none'] as const;
export type Aggregate = (typeof AGGREGATES)[number];

/** Punkte je Kurve bei verdichteten Abfragen */
export const CHART_POINTS = 150;

const HOUR = 3_600_000;

/**
 * @param key Zeitraum aus dem Attribut
 * @returns Dauer in ms, Vorgabe 24 h
 */
export function rangeMs(key: unknown): number {
    const hours = typeof key === 'string' && key in RANGES ? RANGES[key as RangeKey] : RANGES['24h'];
    return hours * HOUR;
}

/**
 * Verlaufseinträge zu Messpunkten: nur Zahlen, nach Zeit sortiert. Schalter (true/false) werden
 * 1/0, damit z. B. der Brenner als Fläche erscheinen kann.
 *
 * @param entries Ergebnis von getHistory
 * @returns Messpunkte
 */
export function toPoints(entries: Array<{ val?: unknown; ts?: unknown }> | null | undefined): ChartPoint[] {
    const points: ChartPoint[] = [];
    for (const e of entries ?? []) {
        const ts = typeof e.ts === 'number' ? e.ts : NaN;
        const val = typeof e.val === 'boolean' ? (e.val ? 1 : 0) : typeof e.val === 'number' ? e.val : NaN;
        if (Number.isFinite(ts) && Number.isFinite(val)) {
            points.push({ ts, val });
        }
    }
    return points.sort((a, b) => a.ts - b.ts);
}

/**
 * „Schöne" Achsenteilung: Schritte 1, 2, 2,5 oder 5 mal Zehnerpotenz, etwa `target` Linien.
 *
 * @param min kleinster Wert
 * @param max größter Wert
 * @param target gewünschte Zahl der Teilstriche
 * @returns Achsenanfang, -ende und Teilstriche
 */
export function niceScale(min: number, max: number, target = 5): { min: number; max: number; ticks: number[] } {
    let lo = Number.isFinite(min) ? min : 0;
    let hi = Number.isFinite(max) ? max : 1;
    if (hi - lo < 1e-9) {
        // flache Kurve: eine Einheit Luft nach oben und unten
        lo -= 1;
        hi += 1;
    }
    const raw = (hi - lo) / Math.max(1, target);
    const pow = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map(f => f * pow).find(s => s >= raw) ?? 10 * pow;
    const start = Math.floor(lo / step) * step;
    const end = Math.ceil(hi / step) * step;
    const ticks: number[] = [];
    for (let v = start; v <= end + step / 2; v += step) {
        ticks.push(Math.round(v / step) * step);
    }
    return { min: start, max: end, ticks };
}

/**
 * Zeitmarken: volle Stunden bzw. Mitternacht, Abstand nach Zeitraum.
 *
 * @param start Beginn in ms
 * @param end Ende in ms
 * @returns Zeitpunkte der Marken
 */
export function timeTicks(start: number, end: number): number[] {
    const span = end - start;
    const stepHours = span <= 6 * HOUR ? 1 : span <= 12 * HOUR ? 2 : span <= 24 * HOUR ? 4 : 24;
    const first = new Date(start);
    first.setMinutes(0, 0, 0);
    if (stepHours === 24) {
        first.setHours(0);
    } else {
        first.setHours(Math.ceil(first.getHours() / stepHours) * stepHours);
    }
    const ticks: number[] = [];
    // über Kalendertage zählen, damit die Zeitumstellung die Marken nicht verschiebt
    for (let d = new Date(first); d.getTime() <= end;) {
        if (d.getTime() >= start) {
            ticks.push(d.getTime());
        }
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + stepHours);
    }
    return ticks;
}

/**
 * Beschriftung einer Zeitmarke: Uhrzeit bis 24 h, sonst Wochentag und Datum.
 *
 * @param ts Zeitpunkt
 * @param span Länge des Zeitraums in ms
 * @param locale Sprachregion
 * @returns Text
 */
export function timeLabel(ts: number, span: number, locale = 'de-DE'): string {
    const d = new Date(ts);
    if (span > 24 * HOUR) {
        return d.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' });
    }
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/**
 * SVG-Pfad einer Linie; Lücken größer als `gap` unterbrechen die Linie.
 *
 * @param points Messpunkte, sortiert
 * @param x Zeit → x
 * @param y Wert → y
 * @param gap größte Lücke in ms, die noch verbunden wird
 * @returns Pfad, leer ohne Punkte
 */
export function linePath(
    points: ChartPoint[],
    x: (ts: number) => number,
    y: (val: number) => number,
    gap = Infinity,
): string {
    let d = '';
    let last: ChartPoint | null = null;
    for (const p of points) {
        const cmd = !last || p.ts - last.ts > gap ? 'M' : 'L';
        d += `${d ? ' ' : ''}${cmd}${x(p.ts).toFixed(1)} ${y(p.val).toFixed(1)}`;
        last = p;
    }
    return d;
}

/**
 * Wert einer Kurve zu einem Zeitpunkt: der nächstgelegene Messpunkt.
 *
 * @param points Messpunkte, sortiert
 * @param ts Zeitpunkt
 * @returns Messpunkt oder null
 */
export function nearest(points: ChartPoint[], ts: number): ChartPoint | null {
    if (!points.length) {
        return null;
    }
    let lo = 0;
    let hi = points.length - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (points[mid].ts <= ts) {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    return Math.abs(points[lo].ts - ts) <= Math.abs(points[hi].ts - ts) ? points[lo] : points[hi];
}
