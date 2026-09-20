import React from 'react';

import { fmt } from '../lib/fmt';
import Counter, { unitInside } from './Counter';
import Led from './Led';

/** Ein Wert in der Fußzeile: Verbrauch eines Zeitraums oder die Kosten */
export interface GasValue {
    /** eindeutiger Schlüssel */
    key: string;
    /** Beschriftung, z. B. „Heute" */
    label: string;
    /** Wert; null zeigt „–" */
    value: number | null;
    /** Einheit, z. B. m³ oder € */
    unit: string;
    /** Nachkommastellen */
    decimals: number;
}

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
    /** Werte der Fußzeile: Verbrauch der verknüpften Zeiträume und die Kosten */
    values: GasValue[];
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
    /** Hinweise zum Sensor (nicht erreichbar, Batterie, Zählerstatus); leer blendet die Zeile aus */
    warnings?: string[];
    /** übersetzte Beschriftungen */
    labels: {
        flow: string;
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
 * Momentandurchfluss mit Balken und darunter die Verbrauchswerte mit den Kosten. Wie viele
 * Werte die Fußzeile zeigt, entscheidet die Anbindung; sie bricht bei Bedarf um.
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

            {props.warnings?.length ? (
                <div
                    className="wolf-gas-warn"
                    role="status"
                >
                    {props.warnings.join(' · ')}
                </div>
            ) : null}

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

            {props.values.length ? (
                <div className={props.values.length > 3 ? 'wolf-foot wolf-foot-auto' : 'wolf-foot'}>
                    {props.values.map(v => (
                        <div key={v.key}>
                            <div className="wolf-label">{v.label}</div>
                            <div className="wolf-v wolf-num">
                                {fmt(v.value, v.decimals, undefined, locale)}
                                <small>{v.unit}</small>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
