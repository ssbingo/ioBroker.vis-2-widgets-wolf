import React from 'react';

import { splitDigits } from '../lib/digits';
import { fmt } from '../lib/fmt';

/** Anzeigewerte und Beschriftungen des Gaszählers */
export interface GasMeterViewProps {
    /** Hell oder dunkel, folgt dem VIS-2-Theme */
    themeType: 'light' | 'dark';
    /** Überschrift der Kachel */
    title: string;
    /** Unterzeile, z. B. die Quelle */
    subtitle?: string;
    /** Zählerstand in m³ */
    reading: number | null;
    /** Momentandurchfluss in m³/h */
    flow: number | null;
    /** Verbrauch heute in m³ */
    today: number | null;
    /** Verbrauch im laufenden Monat in m³ */
    month: number | null;
    /** Kosten im laufenden Monat in € */
    costMonth: number | null;
    /** Skalenende des Durchflussbalkens in m³/h */
    maxFlow: number;
    /** Stellen vor dem Komma im Zählwerk */
    intDigits: number;
    /** Stellen nach dem Komma im Zählwerk */
    decDigits: number;
    /** übersetzte Beschriftungen */
    labels: {
        flow: string;
        today: string;
        month: string;
        costMonth: string;
    };
    /** Sprachregion für die Zahlformatierung */
    locale?: string;
}

/**
 * Gaszähler — Darstellung ohne Zugriff auf ioBroker.
 *
 * Stand M0: Zählwerk in Variante A, Durchfluss, Tages-/Monatswerte und Kosten.
 * Die übrigen Zählwerk-Varianten und die Status-LED folgen in M1.
 *
 * @param props Anzeigewerte und Beschriftungen
 * @returns die Kachel
 */
export default function GasMeterView(props: GasMeterViewProps): React.JSX.Element {
    const { labels, locale } = props;
    const digits = splitDigits(props.reading, props.intDigits, props.decDigits);
    const barWidth =
        props.flow !== null && props.maxFlow > 0 ? Math.min(100, Math.max(0, (props.flow / props.maxFlow) * 100)) : 0;

    return (
        <div
            className="wolf-w wolf-gasmeter"
            data-wolf-theme={props.themeType}
        >
            <div className="wolf-head">
                <div>
                    <h3>{props.title}</h3>
                    {props.subtitle ? <div className="wolf-hint">{props.subtitle}</div> : null}
                </div>
            </div>

            <div className="wolf-counter-row">
                <div
                    className="wolf-counter wolf-cnt-a"
                    role="img"
                    aria-label={fmt(props.reading, props.decDigits, 'm³', locale)}
                >
                    {digits.whole.split('').map((d, i) => (
                        <span key={`w${i}`}>{d}</span>
                    ))}
                    {digits.dec.split('').map((d, i) => (
                        <span
                            key={`d${i}`}
                            className="wolf-dec"
                        >
                            {d}
                        </span>
                    ))}
                </div>
                <span className="wolf-label">m³</span>
            </div>

            <div>
                <span className="wolf-label">{labels.flow}</span>
                <div className="wolf-big">
                    {fmt(props.flow, 2, undefined, locale)}
                    <small>m³/h</small>
                </div>
                <div className="wolf-bar">
                    <span style={{ width: `${barWidth}%` }} />
                </div>
            </div>

            <div className="wolf-foot">
                <div>
                    <div className="wolf-label">{labels.today}</div>
                    <div className="wolf-v wolf-num">
                        {fmt(props.today, 2, undefined, locale)}
                        <small>m³</small>
                    </div>
                </div>
                <div>
                    <div className="wolf-label">{labels.month}</div>
                    <div className="wolf-v wolf-num">
                        {fmt(props.month, 1, undefined, locale)}
                        <small>m³</small>
                    </div>
                </div>
                <div>
                    <div className="wolf-label">{labels.costMonth}</div>
                    <div className="wolf-v wolf-num">
                        {fmt(props.costMonth, 2, undefined, locale)}
                        <small>€</small>
                    </div>
                </div>
            </div>
        </div>
    );
}
