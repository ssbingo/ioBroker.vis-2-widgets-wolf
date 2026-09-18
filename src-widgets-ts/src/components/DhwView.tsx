import React from 'react';

import { fmt } from '../lib/fmt';
import type { TankScale } from '../lib/tank';
import type { ThemeType } from '../lib/theme';
import {
    ConfirmBar,
    ControlLabel,
    isPending,
    PressButton,
    Segmented,
    Stepper,
    Toggle,
    type NumberControl,
    type SelectControl,
    type StatusTexts,
    type SwitchControl,
} from './controls';
import Tank from './Tank';

/** Anzeigewerte und Bedienelemente des Warmwassers; null blendet ein Element aus */
export interface DhwViewProps {
    /** Hell oder dunkel */
    themeType: ThemeType;
    /** Überschrift */
    title: string;
    /** Unterzeile */
    subtitle?: string;
    /** Speichertemperatur */
    temp: number | null;
    /** Solltemperatur */
    setpoint: NumberControl | null;
    /** wirksamer Speichersollwert (nur Anzeige); undefined blendet ihn aus */
    effectiveSetpoint?: number | null;
    /** Ladung aktiv; undefined blendet die Anzeige aus */
    charging?: boolean | null;
    /** Zeitprogramm */
    program: SelectControl | null;
    /** Zirkulationspumpe */
    circulation: SwitchControl | null;
    /** Sofortladung */
    boost: SwitchControl | null;
    /** Skala der Speichergrafik */
    scale: TankScale;
    /** Änderungen warten auf „Übernehmen" */
    staged: boolean;
    /** Übernehmen */
    onCommit: () => void;
    /** Verwerfen */
    onDiscard: () => void;
    /** übersetzte Texte */
    labels: {
        tank: string;
        setpoint: string;
        effectiveSetpoint: string;
        charging: string;
        active: string;
        inactive: string;
        program: string;
        circulation: string;
        boost: string;
        boostActive: string;
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
 * Warmwasser — Speichergrafik mit Sollmarke, Solltemperatur, Zeitprogramm, optional
 * Zirkulation und Sofortladung. Darstellung ohne Zugriff auf ioBroker.
 *
 * @param props Werte, Bedienelemente und Texte
 * @returns die Kachel
 */
export default function DhwView(props: DhwViewProps): React.JSX.Element {
    const { labels, locale, setpoint } = props;
    const showEffective = props.effectiveSetpoint !== undefined;
    const showCharging = props.charging !== undefined;

    return (
        <div
            className="wolf-w wolf-dhw"
            data-wolf-theme={props.themeType}
        >
            <div className="wolf-head">
                <div>
                    <h3>{props.title}</h3>
                    {props.subtitle ? <div className="wolf-hint">{props.subtitle}</div> : null}
                </div>
            </div>

            <div className="wolf-tank-row">
                <Tank
                    temp={props.temp}
                    target={setpoint?.value ?? null}
                    targetPending={setpoint ? isPending(setpoint.status) : false}
                    scale={props.scale}
                    text={`${fmt(props.temp, 1, undefined, locale)}°`}
                    label={labels.tank}
                    charging={props.charging === true}
                />
                <div className="wolf-dhw-side">
                    {setpoint ? (
                        <div className="wolf-ctl">
                            <ControlLabel
                                label={labels.setpoint}
                                status={setpoint.status}
                                texts={labels.status}
                            />
                            <Stepper
                                label={labels.setpoint}
                                value={setpoint.value}
                                range={setpoint.range}
                                unit="°C"
                                disabled={setpoint.status === 'locked'}
                                pending={isPending(setpoint.status)}
                                compact
                                locale={locale}
                                labels={{ decrease: labels.decrease, increase: labels.increase }}
                                onChange={setpoint.onChange}
                            />
                        </div>
                    ) : null}
                    {showEffective || showCharging ? (
                        <div className="wolf-kv">
                            {showEffective ? (
                                <div>
                                    <div className="wolf-label">{labels.effectiveSetpoint}</div>
                                    <div className="wolf-v wolf-num">
                                        {fmt(props.effectiveSetpoint ?? null, 1, undefined, locale)}
                                        <small>°C</small>
                                    </div>
                                </div>
                            ) : null}
                            {showCharging ? (
                                <div>
                                    <div className="wolf-label">{labels.charging}</div>
                                    <div
                                        className={
                                            props.charging
                                                ? 'wolf-v wolf-dhw-charging wolf-on'
                                                : 'wolf-v wolf-dhw-charging'
                                        }
                                    >
                                        {props.charging === null
                                            ? '–'
                                            : props.charging
                                              ? labels.active
                                              : labels.inactive}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    {props.circulation ? (
                        <Toggle
                            label={labels.circulation}
                            control={props.circulation}
                            texts={labels.status}
                        />
                    ) : null}
                    {props.boost ? (
                        <PressButton
                            label={labels.boost}
                            activeLabel={labels.boostActive}
                            control={props.boost}
                            texts={labels.status}
                        />
                    ) : null}
                </div>
            </div>

            {props.program ? (
                <div className="wolf-ctl wolf-dhw-program">
                    <ControlLabel
                        label={labels.program}
                        status={props.program.status}
                        texts={labels.status}
                    />
                    <Segmented
                        label={labels.program}
                        options={props.program.options}
                        value={props.program.value}
                        disabled={props.program.status === 'locked'}
                        pending={isPending(props.program.status)}
                        onSelect={props.program.onSelect}
                    />
                </div>
            ) : null}

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
