import React from 'react';

import { ARC_FULL, arcFraction, arcSegment } from '../lib/arc';

/** Farbiger Skalenabschnitt, z. B. eine Warnzone — in Einheiten des Messwerts */
export interface GaugeBand {
    /** Beginn des Abschnitts */
    from: number;
    /** Ende des Abschnitts */
    to: number;
    /** Farbe, z. B. var(--wolf-alert-soft) */
    color: string;
}

/** Eigenschaften der Bogenanzeige */
export interface GaugeProps {
    /** Messwert; null zeigt einen leeren Bogen */
    value: number | null;
    /** Skalenanfang */
    min: number;
    /** Skalenende */
    max: number;
    /** Farbe des Werts */
    color: string;
    /** Skalenabschnitte unter dem Wert */
    bands?: GaugeBand[];
    /** formatierter Wert */
    text: string;
    /** Einheit */
    unit: string;
    /** Beschriftung unter dem Wert */
    label: string;
}

/**
 * Bogenanzeige (Halbkreis) mit optionalen Warnzonen.
 *
 * @param props Wert, Skala, Farben und Beschriftung
 * @returns die Anzeige
 */
export default function Gauge(props: GaugeProps): React.JSX.Element {
    const fraction = arcFraction(props.value, props.min, props.max);
    return (
        <div
            className="wolf-gauge"
            role="meter"
            aria-label={props.label}
            aria-valuemin={props.min}
            aria-valuemax={props.max}
            aria-valuenow={props.value ?? undefined}
            aria-valuetext={`${props.text} ${props.unit}`}
        >
            <svg
                viewBox="0 0 120 78"
                aria-hidden="true"
            >
                <path
                    d={ARC_FULL}
                    fill="none"
                    stroke="var(--wolf-line)"
                    strokeWidth="10"
                    strokeLinecap="round"
                />
                {(props.bands || []).map(b => (
                    <path
                        key={`${b.from}-${b.to}`}
                        d={arcSegment(
                            arcFraction(b.from, props.min, props.max),
                            arcFraction(b.to, props.min, props.max),
                        )}
                        fill="none"
                        stroke={b.color}
                        strokeWidth="10"
                    />
                ))}
                {fraction > 0 ? (
                    <path
                        className="wolf-arc-v"
                        d={ARC_FULL}
                        pathLength={100}
                        fill="none"
                        stroke={props.color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(fraction * 100).toFixed(2)} 200`}
                    />
                ) : null}
            </svg>
            <div className="wolf-gv">
                {props.text}
                <small>{props.unit}</small>
            </div>
            <div className="wolf-label">{props.label}</div>
        </div>
    );
}
