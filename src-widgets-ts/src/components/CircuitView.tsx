import React from 'react';

import type { ThemeType } from '../lib/theme';
import {
    ConfirmBar,
    ControlLabel,
    Readings,
    Segmented,
    Stepper,
    type NumberControl,
    type Reading,
    type SelectControl,
    type StatusTexts,
} from './controls';

/** Anzeigewerte und Bedienelemente des Heizkreises; null blendet ein Element aus */
export interface CircuitViewProps {
    /** Hell oder dunkel */
    themeType: ThemeType;
    /** Überschrift */
    title: string;
    /** Unterzeile */
    subtitle?: string;
    /** Betriebsart */
    mode: SelectControl | null;
    /** Tagtemperatur, groß mit Schieberegler */
    dayTemp: NumberControl | null;
    /** Spartemperatur */
    ecoTemp: NumberControl | null;
    /** Sollwertkorrektur */
    correction: NumberControl | null;
    /** Zeitprogramm */
    program: SelectControl | null;
    /** Anzeigewerte: Raum Ist, Raumsoll, Vorlauf Soll */
    readings: Reading[];
    /** Änderungen warten auf „Übernehmen" */
    staged: boolean;
    /** Übernehmen */
    onCommit: () => void;
    /** Verwerfen */
    onDiscard: () => void;
    /** übersetzte Texte */
    labels: {
        mode: string;
        dayTemp: string;
        ecoTemp: string;
        correction: string;
        program: string;
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
 * Heizkreis-Bedienung — Darstellung ohne Zugriff auf ioBroker.
 *
 * @param props Werte, Bedienelemente und Texte
 * @returns die Kachel
 */
export default function CircuitView(props: CircuitViewProps): React.JSX.Element {
    const { labels, locale } = props;
    const stepLabels = { decrease: labels.decrease, increase: labels.increase };
    const numberBlock = (
        control: NumberControl,
        label: string,
        unit: string,
        options: { compact?: boolean; slider?: boolean; signed?: boolean },
    ): React.JSX.Element => (
        <div className="wolf-ctl">
            <ControlLabel
                label={label}
                status={control.status}
                texts={labels.status}
            />
            <Stepper
                label={label}
                value={control.value}
                range={control.range}
                unit={unit}
                disabled={control.status === 'locked'}
                pending={control.status === 'pending' || control.status === 'staged'}
                locale={locale}
                labels={stepLabels}
                onChange={control.onChange}
                {...options}
            />
        </div>
    );
    const selectBlock = (control: SelectControl, label: string): React.JSX.Element => (
        <div className="wolf-ctl">
            <ControlLabel
                label={label}
                status={control.status}
                texts={labels.status}
            />
            <Segmented
                label={label}
                options={control.options}
                value={control.value}
                disabled={control.status === 'locked'}
                pending={control.status === 'pending' || control.status === 'staged'}
                onSelect={control.onSelect}
            />
        </div>
    );

    return (
        <div
            className="wolf-w wolf-circuit"
            data-wolf-theme={props.themeType}
        >
            <div className="wolf-head">
                <div>
                    <h3>{props.title}</h3>
                    {props.subtitle ? <div className="wolf-hint">{props.subtitle}</div> : null}
                </div>
            </div>

            {props.mode ? selectBlock(props.mode, labels.mode) : null}
            {props.dayTemp ? numberBlock(props.dayTemp, labels.dayTemp, '°C', { slider: true }) : null}
            {props.ecoTemp || props.correction ? (
                <div className="wolf-mini-grid">
                    {props.ecoTemp ? numberBlock(props.ecoTemp, labels.ecoTemp, '°C', { compact: true }) : null}
                    {props.correction
                        ? numberBlock(props.correction, labels.correction, 'K', { compact: true, signed: true })
                        : null}
                </div>
            ) : null}
            {props.program ? selectBlock(props.program, labels.program) : null}

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
