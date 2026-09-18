import React from 'react';

import { fmt } from '../lib/fmt';
import type { ThemeType } from '../lib/theme';
import {
    ConfirmBar,
    ControlLabel,
    isPending,
    Readings,
    Stepper,
    type NumberControl,
    type Reading,
    type StatusTexts,
} from './controls';
import HeatCurveChart, { type HeatCurveChartProps } from './HeatCurveChart';

/** Einstellwert der Kurve: bedienbar mit Stepper oder nur angezeigt */
export interface CurveSetting {
    /** Beschriftung */
    label: string;
    /** Einheit */
    unit: string;
    /** Vorzeichen auch bei positiven Werten */
    signed: boolean;
    /** Bedienelement; null zeigt nur den Wert (Objekt nicht schreibbar) */
    control: NumberControl | null;
    /** Wert, wenn nicht bedienbar */
    value: number | null;
    /** Nachkommastellen des angezeigten Werts */
    decimals: number;
}

/** Anzeigewerte und Bedienelemente der Heizkurve; null blendet ein Element aus */
export interface HeatCurveViewProps {
    /** Hell oder dunkel */
    themeType: ThemeType;
    /** Überschrift */
    title: string;
    /** Unterzeile */
    subtitle?: string;
    /** Diagramm */
    chart: HeatCurveChartProps;
    /** Einstellwerte: Korrektur, Steilheit, Niveau — soweit verknüpft */
    settings: CurveSetting[];
    /** Anzeigewerte */
    readings: Reading[];
    /** Betriebspunkt verfälscht (Speicherladung) */
    distorted: boolean;
    /** Änderungen warten auf „Übernehmen" */
    staged: boolean;
    /** Übernehmen */
    onCommit: () => void;
    /** Verwerfen */
    onDiscard: () => void;
    /** übersetzte Texte */
    labels: {
        approximation: string;
        approximationHint: string;
        distorted: string;
        decrease: string;
        increase: string;
        apply: string;
        discard: string;
        status: StatusTexts;
    };
    /** Sprachregion */
    locale?: string;
}

/**
 * Heizkurve — Näherungskurve mit dem Betriebspunkt der Regelung, Sollwertkorrektur und, wo
 * das Objekt es erlaubt, Steilheit und Niveau. Darstellung ohne Zugriff auf ioBroker.
 *
 * @param props Kurve, Bedienelemente und Texte
 * @returns die Kachel
 */
export default function HeatCurveView(props: HeatCurveViewProps): React.JSX.Element {
    const { labels, locale } = props;
    const setting = (s: CurveSetting): React.JSX.Element => {
        if (!s.control) {
            // nur anzeigen: gleiche Typografie wie der Stepper, ohne Knöpfe
            const text = fmt(s.value, s.decimals, undefined, locale);
            return (
                <div
                    className="wolf-ctl"
                    key={s.label}
                >
                    <div className="wolf-ctl-label">
                        <span className="wolf-label">{s.label}</span>
                    </div>
                    <div className="wolf-stepper wolf-stepper-compact wolf-stepper-static">
                        <div className="wolf-big">
                            {s.signed && s.value !== null && s.value > 0 ? `+${text}` : text}
                            <small>{s.unit}</small>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div
                className="wolf-ctl"
                key={s.label}
            >
                <ControlLabel
                    label={s.label}
                    status={s.control.status}
                    texts={labels.status}
                />
                <Stepper
                    label={s.label}
                    value={s.control.value}
                    range={s.control.range}
                    unit={s.unit}
                    disabled={s.control.status === 'locked'}
                    pending={isPending(s.control.status)}
                    compact
                    signed={s.signed}
                    locale={locale}
                    labels={{ decrease: labels.decrease, increase: labels.increase }}
                    onChange={s.control.onChange}
                />
            </div>
        );
    };

    return (
        <div
            className="wolf-w wolf-heatcurve"
            data-wolf-theme={props.themeType}
        >
            <div className="wolf-head">
                <div>
                    <h3>{props.title}</h3>
                    {props.subtitle ? <div className="wolf-hint">{props.subtitle}</div> : null}
                </div>
                <span
                    className="wolf-badge"
                    title={labels.approximationHint}
                >
                    {labels.approximation}
                </span>
            </div>

            <HeatCurveChart {...props.chart} />
            <div
                className={props.distorted ? 'wolf-curve-note wolf-curve-note-warn' : 'wolf-curve-note'}
                role={props.distorted ? 'status' : undefined}
            >
                {props.distorted ? labels.distorted : labels.approximationHint}
            </div>

            {props.settings.length ? (
                <div className="wolf-mini-grid wolf-curve-controls">{props.settings.map(setting)}</div>
            ) : null}

            <Readings
                readings={props.readings}
                locale={locale}
            />

            {props.staged ? (
                <ConfirmBar
                    onCommit={props.onCommit}
                    onDiscard={props.onDiscard}
                    labels={{ apply: labels.apply, discard: labels.discard }}
                />
            ) : null}
        </div>
    );
}
