import React, { useEffect, useId, useState } from 'react';

import { linePath, nearest, niceScale, timeLabel, timeTicks, type ChartPoint } from '../lib/chart';
import { fmt } from '../lib/fmt';

/** Farben der Kurven — nur Tokens, damit hell und dunkel stimmen */
export const SERIES_COLORS = ['warm', 'cool', 'ok', 'accent', 'warn', 'warm2', 'cool2', 'ink'] as const;
export type SeriesColor = (typeof SERIES_COLORS)[number];

/** Eine Kurve */
export interface TrendSeries {
    /** eindeutiger Schlüssel */
    key: string;
    /** Bezeichnung */
    label: string;
    /** Farbe */
    color: SeriesColor;
    /** Messpunkte, sortiert */
    points: ChartPoint[];
}

/** Eigenschaften des Diagramms */
export interface TrendsChartProps {
    /** Linien */
    series: TrendSeries[];
    /** Fläche im Hintergrund, z. B. Modulation; null ohne */
    area: TrendSeries | null;
    /** Skalenende der Fläche (100 für %) — die Fläche nutzt das untere Drittel wie im Entwurf */
    areaMax: number;
    /** Beginn des Zeitraums in ms */
    start: number;
    /** Ende des Zeitraums in ms */
    end: number;
    /** feste untere Achsengrenze; null = automatisch */
    yMin: number | null;
    /** feste obere Achsengrenze; null = automatisch */
    yMax: number | null;
    /** Zeitpunkt unter dem Zeiger; null ohne */
    hover: number | null;
    /** Zeiger bewegt bzw. verlassen */
    onHover: (ts: number | null) => void;
    /** Beschreibung für Screenreader */
    label: string;
    /** Bedienhinweis für die Tastatur, wird an die Beschreibung angehängt */
    keyHint: string;
    /** Sprachregion */
    locale?: string;
}

const PAD = { left: 40, right: 12, top: 10, bottom: 24 };
/** Anteil der Zeichenhöhe, den die Fläche höchstens einnimmt (Entwurf: 42 %) */
const AREA_SHARE = 0.42;

/**
 * Größe eines Elements, laufend über ResizeObserver.
 *
 * @param el Element oder null
 * @returns Breite und Höhe in Pixeln
 */
function useSize(el: HTMLElement | null): { width: number; height: number } {
    const [size, setSize] = useState({ width: 0, height: 0 });
    useEffect(() => {
        if (!el) {
            return undefined;
        }
        const observer = new ResizeObserver(entries => {
            const r = entries[0]?.contentRect;
            if (r) {
                setSize({ width: Math.floor(r.width), height: Math.floor(r.height) });
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [el]);
    return size;
}

/**
 * Verlaufsdiagramm in echter Pixelgröße: Schrift und Linien bleiben bei jeder Kachelgröße gleich.
 * Linien für die Kurven, Fläche im Hintergrund, Raster, Zeitachse und Fadenkreuz beim Zeigen.
 *
 * @param props Kurven, Zeitraum und Achsen
 * @returns das Diagramm
 */
export default function TrendsChart(props: TrendsChartProps): React.JSX.Element {
    const [box, setBox] = useState<HTMLDivElement | null>(null);
    const clipId = `${useId().replace(/:/g, '')}-plot`;
    const { width, height } = useSize(box);
    const iw = Math.max(1, width - PAD.left - PAD.right);
    const ih = Math.max(1, height - PAD.top - PAD.bottom);
    const span = Math.max(1, props.end - props.start);

    const values = props.series.flatMap(s => s.points.map(p => p.val));
    const scale = niceScale(
        props.yMin ?? (values.length ? Math.min(...values) : 0),
        props.yMax ?? (values.length ? Math.max(...values) : 1),
    );
    const x = (ts: number): number => PAD.left + ((ts - props.start) / span) * iw;
    const y = (v: number): number => PAD.top + ih - ((v - scale.min) / (scale.max - scale.min)) * ih;
    const yArea = (v: number): number =>
        PAD.top + ih - (Math.max(0, Math.min(props.areaMax, v)) / props.areaMax) * ih * AREA_SHARE;
    const decimals = scale.ticks.length > 1 && Math.abs(scale.ticks[1] - scale.ticks[0]) < 1 ? 1 : 0;

    let areaPath = '';
    if (props.area?.points.length) {
        const pts = props.area.points;
        areaPath = `${linePath(pts, x, yArea)} L${x(pts[pts.length - 1].ts).toFixed(1)} ${PAD.top + ih} L${x(pts[0].ts).toFixed(1)} ${PAD.top + ih} Z`;
    }

    // Tastatur: 48 Schritte über den Zeitraum (bei 24 h eine halbe Stunde)
    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
        const step = span / 48;
        const current = props.hover ?? props.end;
        const target =
            e.key === 'ArrowLeft'
                ? current - step
                : e.key === 'ArrowRight'
                  ? current + step
                  : e.key === 'Home'
                    ? props.start
                    : e.key === 'End'
                      ? props.end
                      : undefined;
        if (target !== undefined) {
            e.preventDefault();
            props.onHover(Math.max(props.start, Math.min(props.end, target)));
        } else if (e.key === 'Escape') {
            props.onHover(null);
        }
    };

    const pointerTs = (e: React.PointerEvent<SVGRectElement>): number => {
        const r = e.currentTarget.getBoundingClientRect();
        const frac = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
        return props.start + frac * span;
    };

    return (
        <div
            className="wolf-chart"
            ref={setBox}
            role="group"
            tabIndex={0}
            aria-label={`${props.label}. ${props.keyHint}`}
            onKeyDown={onKeyDown}
            onBlur={() => props.onHover(null)}
        >
            {width > 0 && height > 0 ? (
                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    role="img"
                    aria-label={props.label}
                >
                    {scale.ticks.map(v => (
                        <g key={v}>
                            <line
                                className="wolf-chart-grid"
                                x1={PAD.left}
                                y1={y(v).toFixed(1)}
                                x2={width - PAD.right}
                                y2={y(v).toFixed(1)}
                            />
                            <text
                                className="wolf-chart-tick"
                                x={PAD.left - 7}
                                y={(y(v) + 3.5).toFixed(1)}
                                textAnchor="end"
                            >
                                {fmt(v, decimals, undefined, props.locale)}
                            </text>
                        </g>
                    ))}
                    {timeTicks(props.start, props.end).map(t => (
                        <text
                            key={t}
                            className="wolf-chart-tick wolf-chart-time"
                            x={x(t).toFixed(1)}
                            y={height - 7}
                            textAnchor="middle"
                        >
                            {timeLabel(t, span, props.locale)}
                        </text>
                    ))}
                    {/* Randwerte vor dem Zeitraum liefern die Verlaufsadapter mit — nur im Zeichenbereich zeigen */}
                    <clipPath id={clipId}>
                        <rect
                            x={PAD.left}
                            y={PAD.top - 2}
                            width={iw}
                            height={ih + 4}
                        />
                    </clipPath>
                    <g clipPath={`url(#${clipId})`}>
                        {areaPath ? (
                            <path
                                className="wolf-chart-area"
                                d={areaPath}
                            />
                        ) : null}
                        {props.series.map(s => (
                            <path
                                key={s.key}
                                className={`wolf-chart-line wolf-stroke-${s.color}`}
                                d={linePath(s.points, x, y)}
                            />
                        ))}
                    </g>
                    {props.hover !== null ? (
                        <g>
                            <line
                                className="wolf-chart-cursor"
                                x1={x(props.hover).toFixed(1)}
                                y1={PAD.top}
                                x2={x(props.hover).toFixed(1)}
                                y2={PAD.top + ih}
                            />
                            {props.series.map(s => {
                                const p = nearest(s.points, props.hover as number);
                                return p ? (
                                    <circle
                                        key={s.key}
                                        className={`wolf-chart-dot wolf-fill-${s.color}`}
                                        cx={x(p.ts).toFixed(1)}
                                        cy={y(p.val).toFixed(1)}
                                        r="3.5"
                                    />
                                ) : null;
                            })}
                        </g>
                    ) : null}
                    <rect
                        className="wolf-chart-hit"
                        x={PAD.left}
                        y={PAD.top}
                        width={iw}
                        height={ih}
                        onPointerMove={e => props.onHover(pointerTs(e))}
                        onPointerDown={e => props.onHover(pointerTs(e))}
                        onPointerLeave={() => props.onHover(null)}
                    />
                </svg>
            ) : null}
        </div>
    );
}
