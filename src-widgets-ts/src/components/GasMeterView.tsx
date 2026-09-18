import React from 'react';

import { fmt } from '../lib/fmt';
import Counter, { unitInside } from './Counter';
import Led from './Led';

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
    /** Zählwerk-Variante A, B, C, E, F, G oder H */
    variant: string;
    /** Durchfluss, ab dem die LED Verbrauch anzeigt, in m³/h */
    threshold: number;
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
        consumption: string;
        noConsumption: string;
    };
    /** Sprachregion für die Zahlformatierung */
    locale?: string;
}

/**
 * Gaszähler — Darstellung ohne Zugriff auf ioBroker.
 *
 * Zählwerk in allen freigegebenen Varianten, Status-LED (Verbrauch ab Schwelle),
 * Momentandurchfluss mit Balken, Tages- und Monatswerte, Kosten des Monats.
 *
 * @param props Anzeigewerte und Beschriftungen
 * @returns die Kachel
 */
export default function GasMeterView(props: GasMeterViewProps): React.JSX.Element {
    const { labels, locale } = props;
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
                <Led
                    on={props.flow !== null && props.flow > props.threshold}
                    labelOn={labels.consumption}
                    labelOff={labels.noConsumption}
                />
            </div>

            <div className="wolf-counter-row">
                <Counter
                    value={props.reading}
                    variant={props.variant}
                    intDigits={props.intDigits}
                    decDigits={props.decDigits}
                    locale={locale}
                    unit="m³"
                />
                {unitInside(props.variant) ? null : <span className="wolf-label">m³</span>}
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
