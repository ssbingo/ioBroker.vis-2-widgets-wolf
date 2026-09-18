import React from 'react';

import { fmt } from '../lib/fmt';
import Gauge from './Gauge';

/** Anzeigewerte und Beschriftungen des Kesselstatus */
export interface BoilerViewProps {
    /** Hell oder dunkel, folgt dem VIS-2-Theme */
    themeType: 'light' | 'dark';
    /** Überschrift der Kachel */
    title: string;
    /** Unterzeile, z. B. Gerätetyp */
    subtitle?: string;
    /** Betriebsphase im Klartext */
    phase: string;
    /** Modulationsgrad in % */
    modulation: number | null;
    /** Wasserdruck in bar */
    pressure: number | null;
    /** Warnung unterhalb dieses Drucks */
    pressureMin: number;
    /** Warnung oberhalb dieses Drucks */
    pressureMax: number;
    /** Skalenende des Druckbogens */
    pressureScale: number;
    /** Betriebsstunden */
    hours: number | null;
    /** Brennerstarts */
    starts: number | null;
    /** Vorlauftemperatur Ist in °C */
    flowTemp: number | null;
    /** Rücklauftemperatur in °C */
    returnTemp: number | null;
    /** übersetzte Beschriftungen */
    labels: {
        modulation: string;
        pressure: string;
        hours: string;
        starts: string;
        flowTemp: string;
        returnTemp: string;
    };
    /** Sprachregion für die Zahlformatierung */
    locale?: string;
}

/**
 * Liegt der Druck im zulässigen Bereich?
 *
 * @param pressure Wasserdruck in bar
 * @param min untere Warnschwelle
 * @param max obere Warnschwelle
 * @returns true innerhalb der Schwellen; null (kein Wert) gilt als unauffällig
 */
export function pressureOk(pressure: number | null, min: number, max: number): boolean {
    return pressure === null || (pressure >= min && pressure <= max);
}

/**
 * Kesselstatus — Darstellung ohne Zugriff auf ioBroker: Betriebsphase, Modulation,
 * Wasserdruck mit Warnzonen, Betriebsstunden, Brennerstarts, Vor- und Rücklauf.
 *
 * @param props Anzeigewerte und Beschriftungen
 * @returns die Kachel
 */
export default function BoilerView(props: BoilerViewProps): React.JSX.Element {
    const { labels, locale } = props;
    const ok = pressureOk(props.pressure, props.pressureMin, props.pressureMax);
    const bands = [];
    if (props.pressureMin > 0) {
        bands.push({ from: 0, to: props.pressureMin, color: 'var(--wolf-alert-soft)' });
    }
    if (props.pressureMax < props.pressureScale) {
        bands.push({ from: props.pressureMax, to: props.pressureScale, color: 'var(--wolf-alert-soft)' });
    }

    return (
        <div
            className="wolf-w wolf-boiler"
            data-wolf-theme={props.themeType}
        >
            <div className="wolf-head">
                <div>
                    <h3>{props.title}</h3>
                    {props.subtitle ? <div className="wolf-hint">{props.subtitle}</div> : null}
                </div>
            </div>

            <div className="wolf-phase-row">
                <span className="wolf-phase">{props.phase}</span>
            </div>

            <div className="wolf-gauges">
                <Gauge
                    value={props.modulation}
                    min={0}
                    max={100}
                    color="var(--wolf-accent)"
                    text={fmt(props.modulation, 0, undefined, locale)}
                    unit="%"
                    label={labels.modulation}
                />
                <Gauge
                    value={props.pressure}
                    min={0}
                    max={props.pressureScale}
                    color={ok ? 'var(--wolf-ok)' : 'var(--wolf-alert)'}
                    bands={bands}
                    text={fmt(props.pressure, 1, undefined, locale)}
                    unit="bar"
                    label={labels.pressure}
                />
            </div>

            <div className="wolf-kv">
                <div>
                    <div className="wolf-label">{labels.hours}</div>
                    <div className="wolf-v wolf-num">
                        {fmt(props.hours, 0, undefined, locale)}
                        <small>h</small>
                    </div>
                </div>
                <div>
                    <div className="wolf-label">{labels.starts}</div>
                    <div className="wolf-v wolf-num">{fmt(props.starts, 0, undefined, locale)}</div>
                </div>
                <div>
                    <div className="wolf-label">{labels.flowTemp}</div>
                    <div className="wolf-v wolf-num">
                        {fmt(props.flowTemp, 1, undefined, locale)}
                        <small>°C</small>
                    </div>
                </div>
                <div>
                    <div className="wolf-label">{labels.returnTemp}</div>
                    <div className="wolf-v wolf-num">
                        {fmt(props.returnTemp, 1, undefined, locale)}
                        <small>°C</small>
                    </div>
                </div>
            </div>
        </div>
    );
}
