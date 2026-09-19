import React, { useState } from 'react';

import { nearest, type ChartPoint } from '../lib/chart';
import { fmt } from '../lib/fmt';
import { fmtDateTime } from '../lib/messages';
import type { ThemeType } from '../lib/theme';
import TrendsChart, { type TrendSeries } from './TrendsChart';

/** Ladezustand des Verlaufs */
export type TrendsStatus = 'loading' | 'ready' | 'empty' | 'error' | 'noInstance';

/** Anzeigewerte und Beschriftungen der Verläufe */
export interface TrendsViewProps {
    /** Hell oder dunkel */
    themeType: ThemeType;
    /** Überschrift */
    title: string;
    /** Unterzeile */
    subtitle?: string;
    /** Ladezustand */
    status: TrendsStatus;
    /** Linien */
    series: TrendSeries[];
    /** Fläche im Hintergrund; null ohne */
    area: TrendSeries | null;
    /** Skalenende der Fläche */
    areaMax: number;
    /** Beginn des Zeitraums in ms */
    start: number;
    /** Ende des Zeitraums in ms */
    end: number;
    /** feste untere Achsengrenze; null = automatisch */
    yMin: number | null;
    /** feste obere Achsengrenze; null = automatisch */
    yMax: number | null;
    /** Einheit der Linien, z. B. °C */
    unit: string;
    /** Einheit der Fläche, z. B. % */
    areaUnit: string;
    /** übersetzte Texte */
    labels: {
        loading: string;
        empty: string;
        error: string;
        noInstance: string;
        chart: string;
        keyHint: string;
    };
    /** Sprachregion */
    locale?: string;
}

/**
 * @param points Messpunkte
 * @param hover Zeitpunkt unter dem Zeiger; null: letzter Wert
 * @returns anzuzeigender Wert
 */
function valueAt(points: ChartPoint[], hover: number | null): number | null {
    if (!points.length) {
        return null;
    }
    return hover === null ? points[points.length - 1].val : (nearest(points, hover)?.val ?? null);
}

/**
 * Verläufe — Diagramm mit Legende; die Legende zeigt den letzten Wert, beim Zeigen den Wert
 * unter dem Fadenkreuz. Darstellung ohne Zugriff auf ioBroker.
 *
 * @param props Kurven, Zustand und Texte
 * @returns die Kachel
 */
export default function TrendsView(props: TrendsViewProps): React.JSX.Element {
    const { labels, locale } = props;
    const [hover, setHover] = useState<number | null>(null);
    const message =
        props.status === 'loading'
            ? labels.loading
            : props.status === 'empty'
              ? labels.empty
              : props.status === 'error'
                ? labels.error
                : props.status === 'noInstance'
                  ? labels.noInstance
                  : null;

    return (
        <div
            className="wolf-w wolf-trends"
            data-wolf-theme={props.themeType}
        >
            <div className="wolf-head">
                <div>
                    <h3>{props.title}</h3>
                    <div className="wolf-hint">
                        {hover !== null ? fmtDateTime(hover, locale) : (props.subtitle ?? '')}
                    </div>
                </div>
            </div>

            <div className="wolf-chart-wrap">
                <TrendsChart
                    series={props.series}
                    area={props.area}
                    areaMax={props.areaMax}
                    start={props.start}
                    end={props.end}
                    yMin={props.yMin}
                    yMax={props.yMax}
                    hover={hover}
                    onHover={setHover}
                    label={labels.chart}
                    keyHint={labels.keyHint}
                    locale={locale}
                />
                {message ? (
                    <div
                        className={
                            props.status === 'error' || props.status === 'noInstance'
                                ? 'wolf-chart-msg wolf-chart-msg-warn'
                                : 'wolf-chart-msg'
                        }
                        role="status"
                    >
                        {message}
                    </div>
                ) : null}
            </div>

            {/* Werte unter dem Fadenkreuz ansagen — nur solange es steht, sonst wären es die Live-Werte */}
            <div
                className="wolf-legend"
                aria-live={hover !== null ? 'polite' : 'off'}
            >
                {props.series.map(s => (
                    <span
                        key={s.key}
                        className="wolf-lg"
                    >
                        <i className={`wolf-bg-${s.color}`} />
                        {s.label}
                        <b className="wolf-lg-v">{`${fmt(valueAt(s.points, hover), 1, undefined, locale)} ${props.unit}`}</b>
                    </span>
                ))}
                {props.area ? (
                    <span className="wolf-lg">
                        <i className="wolf-lg-area" />
                        {props.area.label}
                        <b className="wolf-lg-v">{`${fmt(valueAt(props.area.points, hover), 0, undefined, locale)} ${props.areaUnit}`}</b>
                    </span>
                ) : null}
            </div>
        </div>
    );
}
